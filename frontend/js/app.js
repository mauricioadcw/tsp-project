/**
 * app.js
 * Controla la interacción de la UI y llama a la API de Python
 * expuesta por pywebview en window.pywebview.api
 *
 * Nota: window.pywebview solo existe una vez que pywebview termina
 * de inicializar la ventana, por eso todo el código que la usa va
 * dentro del listener 'pywebviewready'.
 */

let grafoActual = null;
let nActual = 0;
let pasoActualIndice = 0;
let totalPasos = 0;

function etiquetaLetra(indice) {
  return String.fromCharCode(65 + indice);
}

window.addEventListener("pywebviewready", () => {
  const api = window.pywebview.api;

  const inputN = document.getElementById("input-n");
  const mensajeN = document.getElementById("mensaje-n");
  const zonaManual = document.getElementById("zona-manual");
  const selectOrigen = document.getElementById("in-origen");
  const selectDestino = document.getElementById("in-destino");
  const inputPeso = document.getElementById("in-peso");
  const mensajeArista = document.getElementById("mensaje-arista");
  const listaAristas = document.getElementById("lista-aristas");
  const mensajeValidacion = document.getElementById("mensaje-validacion");
  const btnResolver = document.getElementById("btn-resolver");
  const zonaPasos = document.getElementById("zona-pasos");
  const textoPaso = document.getElementById("texto-paso");
  const contadorPaso = document.getElementById("contador-paso");
  const panelResultado = document.getElementById("panel-resultado");
  const textoResultado = document.getElementById("texto-resultado");

  // ---------------------------------------------------------
  // Validación del número de nodos
  // ---------------------------------------------------------

  function validarN() {
    const n = parseInt(inputN.value, 10);
    if (isNaN(n) || n < 5 || n > 10) {
      mensajeN.textContent = "n debe ser un entero entre 5 y 10.";
      return null;
    }
    mensajeN.textContent = "";
    return n;
  }

  function poblarSelectsNodos(n) {
    selectOrigen.innerHTML = "";
    selectDestino.innerHTML = "";
    for (let i = 0; i < n; i++) {
      const optA = new Option(etiquetaLetra(i), i);
      const optB = new Option(etiquetaLetra(i), i);
      selectOrigen.add(optA);
      selectDestino.add(optB);
    }
    if (n > 1) selectDestino.selectedIndex = 1;
  }

  function reiniciarFlujoDesdeConfig() {
    zonaPasos.classList.add("oculto");
    panelResultado.classList.add("oculto");
    btnResolver.disabled = true;
    mensajeValidacion.textContent = "";
  }

  // ---------------------------------------------------------
  // Modo manual
  // ---------------------------------------------------------

  document.getElementById("btn-manual").addEventListener("click", async () => {
    const n = validarN();
    if (n === null) return;

    const res = await api.crear_grafo(n);
    if (!res.ok) {
      mensajeN.textContent = res.error;
      return;
    }

    nActual = n;
    grafoActual = { n, aristas: [] };
    poblarSelectsNodos(n);
    zonaManual.classList.remove("oculto");
    listaAristas.innerHTML = "";
    reiniciarFlujoDesdeConfig();
    dibujarGrafo(grafoActual);
  });

  document.getElementById("btn-agregar-arista").addEventListener("click", async () => {
    const origen = selectOrigen.value;
    const destino = selectDestino.value;
    const peso = inputPeso.value;

    if (origen === destino) {
      mensajeArista.textContent = "Origen y destino no pueden ser el mismo nodo.";
      return;
    }
    if (!peso || parseFloat(peso) <= 0) {
      mensajeArista.textContent = "Ingrese un peso positivo.";
      return;
    }

    const res = await api.agregar_arista(origen, destino, peso);
    if (res.ok) {
      mensajeArista.textContent = "";
      grafoActual = res.grafo;
      dibujarGrafo(grafoActual);
      refrescarListaAristas();
      inputPeso.value = "";
    } else {
      mensajeArista.textContent = res.error;
    }
  });

  function refrescarListaAristas() {
    listaAristas.innerHTML = "";
    grafoActual.aristas.forEach((arista) => {
      const li = document.createElement("li");
      li.textContent = `${etiquetaLetra(arista.origen)} — ${etiquetaLetra(arista.destino)} (peso ${arista.peso})`;

      const btnQuitar = document.createElement("button");
      btnQuitar.textContent = "Quitar";
      btnQuitar.addEventListener("click", async () => {
        const res = await api.eliminar_arista(arista.origen, arista.destino);
        if (res.ok) {
          grafoActual = res.grafo;
          dibujarGrafo(grafoActual);
          refrescarListaAristas();
        }
      });

      li.appendChild(btnQuitar);
      listaAristas.appendChild(li);
    });
  }

  // ---------------------------------------------------------
  // Modo aleatorio
  // ---------------------------------------------------------

  document.getElementById("btn-aleatorio").addEventListener("click", async () => {
    const n = validarN();
    if (n === null) return;

    const res = await api.generar_grafo_aleatorio(n, 0.7);
    if (!res.ok) {
      mensajeN.textContent = res.error;
      return;
    }

    nActual = n;
    grafoActual = res.grafo;
    zonaManual.classList.add("oculto");
    reiniciarFlujoDesdeConfig();
    dibujarGrafo(grafoActual);
    mensajeValidacion.textContent = "Grafo aleatorio generado. Valídelo antes de resolver.";
  });

  // ---------------------------------------------------------
  // Validar hamiltonicidad
  // ---------------------------------------------------------

  document.getElementById("btn-validar").addEventListener("click", async () => {
    if (!grafoActual) {
      mensajeValidacion.textContent = "Primero genere un grafo.";
      mensajeValidacion.style.color = "#b91c1c";
      return;
    }

    const res = await api.validar_hamiltoniano();
    if (!res.ok) {
      mensajeValidacion.textContent = res.error;
      mensajeValidacion.style.color = "#b91c1c";
      return;
    }

    if (res.valido) {
      mensajeValidacion.textContent = "✅ El grafo contiene al menos un ciclo hamiltoniano.";
      mensajeValidacion.style.color = "#16803c";
      btnResolver.disabled = false;
    } else {
      let texto = "⚠️ El grafo no admite un ciclo hamiltoniano.";
      if (res.sugerencias.length > 0) {
        texto += " Aristas sugeridas: " + res.sugerencias.join(", ");
      }
      if (res.mensaje_extra) {
        texto += " " + res.mensaje_extra;
      }
      mensajeValidacion.textContent = texto;
      mensajeValidacion.style.color = "#b91c1c";
      btnResolver.disabled = true;
    }
  });

  // ---------------------------------------------------------
  // Resolver TSP completo
  // ---------------------------------------------------------

  btnResolver.addEventListener("click", async () => {
    const res = await api.resolver_tsp_completo();
    if (!res.ok) {
      alert(res.error);
      return;
    }

    totalPasos = res.resumen.total_pasos;
    pasoActualIndice = 0;
    zonaPasos.classList.remove("oculto");
    await mostrarPaso(pasoActualIndice);
  });

  // ---------------------------------------------------------
  // Navegación paso a paso
  // ---------------------------------------------------------

  document.getElementById("btn-paso-siguiente").addEventListener("click", async () => {
    if (pasoActualIndice < totalPasos - 1) {
      pasoActualIndice++;
      await mostrarPaso(pasoActualIndice);
    }
  });

  document.getElementById("btn-paso-anterior").addEventListener("click", async () => {
    if (pasoActualIndice > 0) {
      pasoActualIndice--;
      await mostrarPaso(pasoActualIndice);
    }
  });

  async function mostrarPaso(indice) {
    const res = await api.obtener_paso(indice);
    if (!res.ok) return;

    const paso = res.paso;
    textoPaso.textContent = paso.mensaje;
    contadorPaso.textContent = `Paso ${indice + 1} / ${totalPasos}`;

    if (paso.tipo === "resultado" && paso.ciclo_optimo) {
      panelResultado.classList.remove("oculto");
      const rutaLetras = paso.ciclo_optimo.ruta.map(etiquetaLetra).join(" → ");
      textoResultado.textContent =
        `Ciclo óptimo: ${rutaLetras} (costo = ${paso.ciclo_optimo.costo}) ` +
        `de ${paso.total_ciclos} ciclos hamiltonianos encontrados.`;
      dibujarGrafo(grafoActual, paso.ciclo_optimo.ruta, null);
    } else if (paso.tipo === "evaluacion" && paso.ruta) {
      panelResultado.classList.add("oculto");
      dibujarGrafo(grafoActual, null, paso.ruta);
    } else {
      panelResultado.classList.add("oculto");
      dibujarGrafo(grafoActual, null, null);
    }
  }
});
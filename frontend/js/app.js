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
let pasoActualIndice = 0;
let totalPasos = 0;

window.addEventListener("pywebviewready", () => {
  const api = window.pywebview.api;

  const inputN = document.getElementById("input-n");
  const zonaManual = document.getElementById("zona-manual");
  const mensajeValidacion = document.getElementById("mensaje-validacion");
  const zonaPasos = document.getElementById("zona-pasos");
  const textoPaso = document.getElementById("texto-paso");
  const contadorPaso = document.getElementById("contador-paso");
  const panelResultado = document.getElementById("panel-resultado");
  const textoResultado = document.getElementById("texto-resultado");

  // --- Modo manual: mostrar zona de ingreso de aristas ---
  document.getElementById("btn-manual").addEventListener("click", async () => {
    const n = parseInt(inputN.value);
    const res = await api.crear_grafo(n);
    if (res.ok) {
      zonaManual.classList.remove("oculto");
      mensajeValidacion.textContent = `Grafo de ${n} nodos creado. Agregue las aristas.`;
    }
  });

  document.getElementById("btn-agregar-arista").addEventListener("click", async () => {
    const origen = document.getElementById("in-origen").value;
    const destino = document.getElementById("in-destino").value;
    const peso = document.getElementById("in-peso").value;

    const res = await api.agregar_arista(origen, destino, peso);
    if (res.ok) {
      const grafoRes = await api.obtener_grafo();
      grafoActual = grafoRes.grafo;
      dibujarGrafo(grafoActual);
    } else {
      alert(res.error);
    }
  });

  // --- Modo aleatorio ---
  document.getElementById("btn-aleatorio").addEventListener("click", async () => {
    const n = parseInt(inputN.value);
    const res = await api.generar_grafo_aleatorio(n, 0.7);
    if (res.ok) {
      grafoActual = res.grafo;
      dibujarGrafo(grafoActual);
      mensajeValidacion.textContent = "Grafo aleatorio generado.";
    }
  });

  // --- Validar hamiltonicidad ---
  document.getElementById("btn-validar").addEventListener("click", async () => {
    const res = await api.validar_hamiltoniano();
    if (!res.ok) {
      mensajeValidacion.textContent = res.error;
      return;
    }
    if (res.valido) {
      mensajeValidacion.textContent = "✅ El grafo contiene al menos un ciclo hamiltoniano.";
      mensajeValidacion.style.color = "#16803c";
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
    }
  });

  // --- Resolver TSP completo ---
  document.getElementById("btn-resolver").addEventListener("click", async () => {
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

  // --- Navegación paso a paso ---
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
      const rutaLetras = paso.ciclo_optimo.ruta
        .map((i) => String.fromCharCode(65 + i))
        .join(" → ");
      textoResultado.textContent =
        `Ciclo óptimo: ${rutaLetras} (costo = ${paso.ciclo_optimo.costo}) ` +
        `de ${paso.total_ciclos} ciclos hamiltonianos encontrados.`;
      dibujarGrafo(grafoActual, paso.ciclo_optimo.ruta);
    }
  }
});
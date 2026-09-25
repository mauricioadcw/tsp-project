/**
 * app.js
 * Controla la interacción de la UI y llama a la API de Python
 * expuesta por pywebview en window.pywebview.api
 *
 * Nota: window.pywebview.api solo existe una vez que pywebview termina
 * de inyectar el puente JS<->Python. El nombre exacto del evento que
 * avisa esto ("pywebviewready" vs "_pywebviewready") varía entre
 * versiones de pywebview, así que en vez de depender de un nombre
 * fijo, se espera activamente a que window.pywebview.api exista.
 */

let grafoActual = null;
let nActual = 0;
let pasoActualIndice = 0;
let totalPasos = 0;
let totalCiclos = 0;

// Estado de la tabla comparativa
let tablaModo = "mejores";
let tablaPagina = 1;
let tablaTamanoPagina = 10;
let tablaTotalPaginas = 1;

// Estado de la reproducción automática
let reproduciendo = false;
let temporizadorReproduccion = null;

function etiquetaLetra(indice) {
  return String.fromCharCode(65 + indice);
}

function esperarApiPywebview(intentos = 100, intervaloMs = 50) {
  return new Promise((resolve, reject) => {
    let contador = 0;
    const revisar = () => {
      if (window.pywebview && window.pywebview.api) {
        resolve(window.pywebview.api);
        return;
      }
      contador++;
      if (contador >= intentos) {
        reject(new Error("window.pywebview.api no apareció a tiempo"));
        return;
      }
      setTimeout(revisar, intervaloMs);
    };
    revisar();
  });
}

esperarApiPywebview()
  .then(iniciarApp)
  .catch((err) => {
    console.error("No se pudo inicializar la app:", err);
    alert("No se pudo conectar con el backend de Python. Reinicie la aplicación.");
  });

function iniciarApp(api) {

  // --- Referencias: configuración del grafo ---
  const inputN = document.getElementById("input-n");
  const mensajeN = document.getElementById("mensaje-n");
  const zonaManual = document.getElementById("zona-manual");
  const selectOrigen = document.getElementById("in-origen");
  const selectDestino = document.getElementById("in-destino");
  const inputPeso = document.getElementById("in-peso");
  const mensajeArista = document.getElementById("mensaje-arista");
  const listaAristas = document.getElementById("lista-aristas");
  const mensajeValidacion = document.getElementById("mensaje-validacion");

  // --- Referencias: matriz ---
  const panelMatriz = document.getElementById("panel-matriz");
  const tablaMatriz = document.getElementById("tabla-matriz");

  // --- Referencias: ejecución / paso a paso ---
  const btnResolver = document.getElementById("btn-resolver");
  const zonaPasos = document.getElementById("zona-pasos");
  const textoPaso = document.getElementById("texto-paso");
  const contadorPaso = document.getElementById("contador-paso");
  const btnPlayPausa = document.getElementById("btn-play-pausa");
  const selectVelocidad = document.getElementById("select-velocidad");
  const inputIrARuta = document.getElementById("input-ir-a-ruta");
  const btnIrARuta = document.getElementById("btn-ir-a-ruta");

  // --- Referencias: tabla de resultados ---
  const panelTablaResultados = document.getElementById("panel-tabla-resultados");
  const selectModoTabla = document.getElementById("select-modo-tabla");
  const selectTamanoPagina = document.getElementById("select-tamano-pagina");
  const cuerpoTablaResultados = document.getElementById("cuerpo-tabla-resultados");
  const textoPaginacion = document.getElementById("texto-paginacion");
  const btnPaginaAnterior = document.getElementById("btn-pagina-anterior");
  const btnPaginaSiguiente = document.getElementById("btn-pagina-siguiente");

  // --- Referencias: resultado final ---
  const panelResultado = document.getElementById("panel-resultado");
  const textoResultado = document.getElementById("texto-resultado");

  // ===========================================================
  // Configuración del grafo
  // ===========================================================

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
      selectOrigen.add(new Option(etiquetaLetra(i), i));
      selectDestino.add(new Option(etiquetaLetra(i), i));
    }
    if (n > 1) selectDestino.selectedIndex = 1;
  }

  function reiniciarFlujoDesdeConfig() {
    detenerReproduccion();
    zonaPasos.classList.add("oculto");
    panelResultado.classList.add("oculto");
    panelTablaResultados.classList.add("oculto");
    panelMatriz.classList.add("oculto");
    btnResolver.disabled = true;
    mensajeValidacion.textContent = "";
  }

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

  // ===========================================================
  // Validación de hamiltonicidad
  // ===========================================================

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
      await mostrarMatrizCostos();
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
      panelMatriz.classList.add("oculto");
    }
  });

  // ===========================================================
  // Matriz de costos
  // ===========================================================

  async function mostrarMatrizCostos() {
    const res = await api.obtener_matriz_costos();
    if (!res.ok) return;

    const { n, etiquetas, filas } = res.matriz;

    let html = "<thead><tr><th></th>";
    etiquetas.forEach((e) => (html += `<th>${e}</th>`));
    html += "</tr></thead><tbody>";

    for (let i = 0; i < n; i++) {
      html += `<tr><th>${etiquetas[i]}</th>`;
      for (let j = 0; j < n; j++) {
        const valor = filas[i][j];
        if (valor === null) {
          html += `<td class="celda-vacia">—</td>`;
        } else {
          html += `<td>${valor}</td>`;
        }
      }
      html += "</tr>";
    }
    html += "</tbody>";

    tablaMatriz.innerHTML = html;
    panelMatriz.classList.remove("oculto");
  }

  // ===========================================================
  // Resolver TSP
  // ===========================================================

  btnResolver.addEventListener("click", async () => {
    const res = await api.resolver_tsp_completo();
    if (!res.ok) {
      alert(res.error);
      return;
    }

    totalPasos = res.resumen.total_pasos;
    totalCiclos = res.resumen.total_ciclos;
    pasoActualIndice = 0;

    zonaPasos.classList.remove("oculto");
    inputIrARuta.max = Math.max(0, totalCiclos - 1);

    await mostrarPaso(pasoActualIndice);

    if (totalCiclos > 0) {
      panelTablaResultados.classList.remove("oculto");
      tablaPagina = 1;
      tablaModo = selectModoTabla.value;
      tablaTamanoPagina = parseInt(selectTamanoPagina.value, 10);
      await cargarTablaResultados();

      panelResultado.classList.remove("oculto");
      const optimo = res.resumen.ciclo_optimo;
      const rutaLetras = optimo.ruta.map(etiquetaLetra).join(" → ");
      textoResultado.textContent =
        `Ciclo óptimo: ${rutaLetras} (costo = ${optimo.costo}) ` +
        `de ${totalCiclos} ciclos hamiltonianos encontrados.`;
      dibujarGrafo(grafoActual, optimo.ruta, null);
    }
  });

  // ===========================================================
  // Paso a paso: navegación manual
  // ===========================================================

  document.getElementById("btn-paso-siguiente").addEventListener("click", async () => {
    if (pasoActualIndice < totalPasos - 1) {
      pasoActualIndice++;
      await mostrarPaso(pasoActualIndice);
    } else {
      detenerReproduccion();
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
      dibujarGrafo(grafoActual, paso.ciclo_optimo.ruta, null);
      detenerReproduccion();
    } else if (paso.tipo === "evaluacion" && paso.ruta) {
      dibujarGrafo(grafoActual, null, paso.ruta);
    } else {
      dibujarGrafo(grafoActual, null, null);
    }
  }

  // ===========================================================
  // Reproducción automática
  // ===========================================================

  function iniciarReproduccion() {
    reproduciendo = true;
    btnPlayPausa.textContent = "⏸ Pausar";
    const intervalo = parseInt(selectVelocidad.value, 10);

    temporizadorReproduccion = setInterval(async () => {
      if (pasoActualIndice < totalPasos - 1) {
        pasoActualIndice++;
        await mostrarPaso(pasoActualIndice);
      } else {
        detenerReproduccion();
      }
    }, intervalo);
  }

  function detenerReproduccion() {
    reproduciendo = false;
    btnPlayPausa.textContent = "▶ Reproducir";
    if (temporizadorReproduccion) {
      clearInterval(temporizadorReproduccion);
      temporizadorReproduccion = null;
    }
  }

  btnPlayPausa.addEventListener("click", () => {
    if (reproduciendo) {
      detenerReproduccion();
    } else {
      iniciarReproduccion();
    }
  });

  // Si cambia la velocidad mientras reproduce, reiniciar el intervalo
  selectVelocidad.addEventListener("change", () => {
    if (reproduciendo) {
      detenerReproduccion();
      iniciarReproduccion();
    }
  });

  // ===========================================================
  // Salto directo a una ruta específica
  // ===========================================================

  btnIrARuta.addEventListener("click", async () => {
    const num = parseInt(inputIrARuta.value, 10);
    if (isNaN(num) || num < 0) return;

    detenerReproduccion();
    const res = await api.saltar_a_ruta(num - 1);
    if (!res.ok) {
      alert(res.error);
      return;
    }

    pasoActualIndice = res.indice_pasos;
    textoPaso.textContent = res.paso.mensaje;
    contadorPaso.textContent = `Paso ${pasoActualIndice + 1} / ${res.total_pasos}`;

    if (res.paso.ruta) {
      dibujarGrafo(grafoActual, null, res.paso.ruta);
    }
  });

  // ===========================================================
  // Tabla comparativa de ciclos (paginada)
  // ===========================================================

  async function cargarTablaResultados() {
    const res = await api.obtener_tabla_ciclos(tablaModo, tablaPagina, tablaTamanoPagina);
    if (!res.ok) return;

    tablaTotalPaginas = res.total_paginas;
    tablaPagina = res.pagina;

    const idOptimo = tablaModo === "mejores" && res.datos.length > 0 ? res.datos[0].id : null;
    const idPeor = tablaModo === "peores" && res.datos.length > 0 ? res.datos[0].id : null;

    cuerpoTablaResultados.innerHTML = "";
    res.datos.forEach((ciclo) => {
      const tr = document.createElement("tr");
      if (ciclo.id === idOptimo) tr.classList.add("fila-optima");
      if (ciclo.id === idPeor) tr.classList.add("fila-peor");

      const rutaLetras = ciclo.ruta.map(etiquetaLetra).join(" → ");
      tr.innerHTML = `<td>${ciclo.id}</td><td>${rutaLetras}</td><td>${ciclo.costo}</td>`;

      // Click en una fila: la resalta en el grafo
      tr.addEventListener("click", () => {
        dibujarGrafo(grafoActual, null, ciclo.ruta);
      });

      cuerpoTablaResultados.appendChild(tr);
    });

    const desde = tablaTamanoPagina === -1 ? 1 : (tablaPagina - 1) * tablaTamanoPagina + 1;
    const hasta = tablaTamanoPagina === -1 ? res.total_ciclos : Math.min(tablaPagina * tablaTamanoPagina, res.total_ciclos);
    textoPaginacion.textContent = tablaTamanoPagina === -1
      ? `Mostrando todas (${res.total_ciclos})`
      : `${desde}–${hasta} de ${res.total_ciclos} · Pág. ${tablaPagina}/${tablaTotalPaginas}`;

    btnPaginaAnterior.disabled = tablaPagina <= 1 || tablaTamanoPagina === -1;
    btnPaginaSiguiente.disabled = tablaPagina >= tablaTotalPaginas || tablaTamanoPagina === -1;
  }

  selectModoTabla.addEventListener("change", async () => {
    tablaModo = selectModoTabla.value;
    tablaPagina = 1;
    await cargarTablaResultados();
  });

  selectTamanoPagina.addEventListener("change", async () => {
    tablaTamanoPagina = parseInt(selectTamanoPagina.value, 10);
    tablaPagina = 1;
    await cargarTablaResultados();
  });

  btnPaginaAnterior.addEventListener("click", async () => {
    if (tablaPagina > 1) {
      tablaPagina--;
      await cargarTablaResultados();
    }
  });

  btnPaginaSiguiente.addEventListener("click", async () => {
    if (tablaPagina < tablaTotalPaginas) {
      tablaPagina++;
      await cargarTablaResultados();
    }
  });
}
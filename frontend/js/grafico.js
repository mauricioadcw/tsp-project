/**
 * grafico.js
 * Dibuja el grafo (nodos + aristas) en el <canvas>.
 * Recibe la estructura { n, aristas: [{origen, destino, peso}] }
 * que devuelve backend/grafo.py -> a_dict().
 *
 * Soporta resaltar una ruta en dos modos:
 * - modoEvaluando: ruta que se está evaluando en el paso actual
 *   (color ámbar, se ve mientras el usuario navega paso a paso)
 * - modoOptimo: ciclo óptimo final (color verde)
 */

function etiqueta(indice) {
  return String.fromCharCode(65 + indice); // 0 -> A, 1 -> B, ...
}

function calcularPosiciones(n, ancho, alto) {
  const radio = Math.min(ancho, alto) / 2 - 50;
  const centroX = ancho / 2;
  const centroY = alto / 2;
  const posiciones = [];

  for (let i = 0; i < n; i++) {
    const angulo = (2 * Math.PI * i) / n - Math.PI / 2;
    posiciones.push({
      x: centroX + radio * Math.cos(angulo),
      y: centroY + radio * Math.sin(angulo),
    });
  }
  return posiciones;
}

function construirSetAristas(ruta) {
  const set = new Set();
  if (!ruta) return set;
  for (let k = 0; k < ruta.length - 1; k++) {
    const a = ruta[k], b = ruta[k + 1];
    set.add(`${Math.min(a, b)}-${Math.max(a, b)}`);
  }
  return set;
}

/**
 * @param {object} grafoData     { n, aristas: [{origen, destino, peso}] }
 * @param {number[]|null} rutaOptima     ciclo óptimo final, ej. [0,3,1,2,4,0]
 * @param {number[]|null} rutaEvaluando  ruta que se está evaluando en el paso actual
 */
function dibujarGrafo(grafoData, rutaOptima = null, rutaEvaluando = null) {
  const canvas = document.getElementById("canvas-grafo");
  const ctx = canvas.getContext("2d");

  // --- Soporte HiDPI: evita el efecto borroso en pantallas de alta densidad ---
  const dpr = window.devicePixelRatio || 1;
  const anchoCss = canvas.clientWidth || canvas.width;
  const altoCss = canvas.clientHeight || canvas.height;
  canvas.width = anchoCss * dpr;
  canvas.height = altoCss * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  ctx.clearRect(0, 0, anchoCss, altoCss);

  if (!grafoData || !grafoData.n) return;

  const posiciones = calcularPosiciones(grafoData.n, anchoCss, altoCss);
  const aristasOptimas = construirSetAristas(rutaOptima);
  const aristasEvaluando = construirSetAristas(rutaEvaluando);

  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  // --- Aristas ---
  grafoData.aristas.forEach((arista) => {
    const p1 = posiciones[arista.origen];
    const p2 = posiciones[arista.destino];
    const clave = `${Math.min(arista.origen, arista.destino)}-${Math.max(arista.origen, arista.destino)}`;
    const esOptima = aristasOptimas.has(clave);
    const esEvaluando = aristasEvaluando.has(clave) && !esOptima;

    let color = "#c3cad3";
    let grosor = 1.6;
    if (esOptima) { color = "#16803c"; grosor = 4; }
    else if (esEvaluando) { color = "#d97706"; grosor = 3; }

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = grosor;
    ctx.stroke();
  });

  // --- Etiquetas de peso (con fondo, para alto contraste) ---
  grafoData.aristas.forEach((arista) => {
    const p1 = posiciones[arista.origen];
    const p2 = posiciones[arista.destino];
    const clave = `${Math.min(arista.origen, arista.destino)}-${Math.max(arista.origen, arista.destino)}`;
    const esOptima = aristasOptimas.has(clave);
    const esEvaluando = aristasEvaluando.has(clave) && !esOptima;

    const mx = (p1.x + p2.x) / 2;
    const my = (p1.y + p2.y) / 2;
    const textoColor = esOptima ? "#16803c" : esEvaluando ? "#b45309" : "#1f2937";
    const texto = String(arista.peso);

    ctx.font = "bold 13px Arial";
    const anchoTexto = ctx.measureText(texto).width;

    // Fondo blanco tras el número para que resalte sobre las líneas cruzadas
    ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
    ctx.beginPath();
    ctx.roundRect(mx - anchoTexto / 2 - 4, my - 10, anchoTexto + 8, 20, 5);
    ctx.fill();

    ctx.fillStyle = textoColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(texto, mx, my);
  });

  // --- Nodos ---
  posiciones.forEach((p, i) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 19, 0, 2 * Math.PI);
    ctx.fillStyle = "#2563eb";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#1d4ed8";
    ctx.stroke();

    ctx.fillStyle = "white";
    ctx.font = "bold 14px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(etiqueta(i), p.x, p.y);
  });
}
/**
 * grafico.js
 * Dibuja el grafo (nodos + aristas) en el <canvas>.
 * Recibe la estructura { n, aristas: [{origen, destino, peso}] }
 * que devuelve backend/grafo.py -> a_dict().
 *
 * Resalta una ruta en dos modos:
 * - rutaEvaluando: ruta del paso actual (ámbar). Las aristas que la ruta
 *   necesita pero el grafo no tiene se dibujan punteadas en rojo.
 * - rutaOptima: ciclo óptimo final (verde).
 * Sobre cada nodo de la ruta se muestra su orden de visita.
 */

const COLORES = {
  arista: "#aab4c3",
  aristaTenue: "#d9dee6",
  evaluando: "#b45f06",
  optimo: "#1b7a43",
  faltante: "#b3261e",
  nodo: "#1d4f91",
  nodoBorde: "#143a6d",
  texto: "#17212e",
  textoTenue: "#8b95a3",
};
const FUENTE = '"Segoe UI Variable", "Segoe UI", system-ui, sans-serif';

let ultimoDibujo = null;

function etiqueta(indice) {
  return String.fromCharCode(65 + indice); // 0 -> A, 1 -> B, ...
}

function claveArista(a, b) {
  return `${Math.min(a, b)}-${Math.max(a, b)}`;
}

function calcularPosiciones(n, ancho, alto) {
  const radio = Math.max(60, Math.min(ancho, alto) / 2 - 55);
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
  for (let k = 0; k < ruta.length - 1; k++) set.add(claveArista(ruta[k], ruta[k + 1]));
  return set;
}

// Las etiquetas de peso no se ponen todas en el punto medio: en un
// círculo, las diagonales coinciden en el centro y se taparían entre sí.
function puntoEtiqueta(p1, p2, arista) {
  const t = 0.38 + ((arista.origen * 7 + arista.destino * 3) % 5) * 0.06;
  return { x: p1.x + (p2.x - p1.x) * t, y: p1.y + (p2.y - p1.y) * t };
}

function trazarLinea(ctx, p1, p2, color, grosor, punteada = false) {
  ctx.beginPath();
  ctx.setLineDash(punteada ? [7, 5] : []);
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.strokeStyle = color;
  ctx.lineWidth = grosor;
  ctx.stroke();
  ctx.setLineDash([]);
}

function dibujarGrafo(grafoData, rutaOptima = null, rutaEvaluando = null) {
  ultimoDibujo = { grafoData, rutaOptima, rutaEvaluando };

  const canvas = document.getElementById("canvas-grafo");
  const ctx = canvas.getContext("2d");

  // Soporte HiDPI
  const dpr = window.devicePixelRatio || 1;
  const ancho = canvas.clientWidth || canvas.width;
  const alto = canvas.clientHeight || canvas.height;
  canvas.width = ancho * dpr;
  canvas.height = alto * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, ancho, alto);

  if (!grafoData || !grafoData.n) {
    ctx.fillStyle = COLORES.textoTenue;
    ctx.font = `14px ${FUENTE}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Configure un grafo para visualizarlo aquí.", ancho / 2, alto / 2);
    return;
  }

  const pos = calcularPosiciones(grafoData.n, ancho, alto);
  const setOptimas = construirSetAristas(rutaOptima);
  const setEvaluando = construirSetAristas(rutaEvaluando);
  const hayRuta = Boolean(rutaOptima || rutaEvaluando);
  const existentes = new Set(grafoData.aristas.map((a) => claveArista(a.origen, a.destino)));

  const estadoDe = (arista) => {
    const clave = claveArista(arista.origen, arista.destino);
    if (setOptimas.has(clave)) return "optimo";
    if (setEvaluando.has(clave)) return "evaluando";
    return "normal";
  };

  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  // 1) Aristas normales (atenuadas si hay una ruta resaltada), luego las de ruta encima
  const aristas = [...grafoData.aristas].sort(
    (a, b) => (estadoDe(a) !== "normal") - (estadoDe(b) !== "normal")
  );
  aristas.forEach((a) => {
    const est = estadoDe(a);
    const color = est === "optimo" ? COLORES.optimo
                : est === "evaluando" ? COLORES.evaluando
                : hayRuta ? COLORES.aristaTenue : COLORES.arista;
    const grosor = est === "optimo" ? 4 : est === "evaluando" ? 3 : 1.4;
    trazarLinea(ctx, pos[a.origen], pos[a.destino], color, grosor);
  });

  // 2) Aristas que la ruta evaluada necesita y no existen
  if (rutaEvaluando) {
    for (let k = 0; k < rutaEvaluando.length - 1; k++) {
      const a = rutaEvaluando[k], b = rutaEvaluando[k + 1];
      if (!existentes.has(claveArista(a, b))) {
        trazarLinea(ctx, pos[a], pos[b], COLORES.faltante, 2.4, true);
      }
    }
  }

  // 3) Pesos
  ctx.font = `600 12px ${FUENTE}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  aristas.forEach((a) => {
    const est = estadoDe(a);
    const { x, y } = puntoEtiqueta(pos[a.origen], pos[a.destino], a);
    const texto = String(a.peso);
    const w = ctx.measureText(texto).width + 10;
    const color = est === "optimo" ? COLORES.optimo
                : est === "evaluando" ? COLORES.evaluando
                : hayRuta ? COLORES.textoTenue : COLORES.texto;

    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y - 9, w, 18, 4);
    ctx.fill();
    if (est !== "normal") {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.fillStyle = color;
    ctx.fillText(texto, x, y);
  });

  // 4) Nodos
  pos.forEach((p, i) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 19, 0, 2 * Math.PI);
    ctx.fillStyle = COLORES.nodo;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = COLORES.nodoBorde;
    ctx.stroke();

    ctx.fillStyle = "#fff";
    ctx.font = `600 14px ${FUENTE}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(etiqueta(i), p.x, p.y);
  });

  // 5) Orden de visita sobre cada nodo de la ruta activa
  const rutaActiva = rutaEvaluando || rutaOptima;
  if (rutaActiva) {
    const color = rutaEvaluando ? COLORES.evaluando : COLORES.optimo;
    for (let k = 0; k < rutaActiva.length - 1; k++) {
      const p = pos[rutaActiva[k]];
      const bx = p.x + 16, by = p.y - 16;
      ctx.beginPath();
      ctx.arc(bx, by, 9, 0, 2 * Math.PI);
      ctx.fillStyle = "#fff";
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = color;
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.font = `700 10px ${FUENTE}`;
      ctx.fillText(String(k + 1), bx, by + 0.5);
    }
  }
}

// Redibujar al cambiar el tamaño de la ventana
(function observarTamano() {
  const canvas = document.getElementById("canvas-grafo");
  if (!canvas || typeof ResizeObserver === "undefined") return;
  new ResizeObserver(() => {
    if (ultimoDibujo) {
      dibujarGrafo(ultimoDibujo.grafoData, ultimoDibujo.rutaOptima, ultimoDibujo.rutaEvaluando);
    }
  }).observe(canvas);
})();

// Estado inicial: lienzo vacío con mensaje
dibujarGrafo(null);

/**
 * grafico.js
 * Dibuja el grafo (nodos + aristas) en el <canvas>.
 * Recibe la estructura { n, aristas: [{origen, destino, peso}] }
 * que devuelve backend/grafo.py -> a_dict().
 */

function etiqueta(indice) {
  return String.fromCharCode(65 + indice); // 0 -> A, 1 -> B, ...
}

function calcularPosiciones(n, ancho, alto) {
  // Distribuye los n nodos en un círculo
  const radio = Math.min(ancho, alto) / 2 - 40;
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

function dibujarGrafo(grafoData, rutaResaltada = null) {
  const canvas = document.getElementById("canvas-grafo");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!grafoData || !grafoData.n) return;

  const posiciones = calcularPosiciones(grafoData.n, canvas.width, canvas.height);

  // Set de aristas resaltadas (ciclo óptimo), para pintarlas distinto
  const aristasResaltadas = new Set();
  if (rutaResaltada) {
    for (let k = 0; k < rutaResaltada.length - 1; k++) {
      const a = rutaResaltada[k], b = rutaResaltada[k + 1];
      aristasResaltadas.add(`${Math.min(a,b)}-${Math.max(a,b)}`);
    }
  }

  // Dibujar aristas
  grafoData.aristas.forEach((arista) => {
    const p1 = posiciones[arista.origen];
    const p2 = posiciones[arista.destino];
    const clave = `${Math.min(arista.origen, arista.destino)}-${Math.max(arista.origen, arista.destino)}`;
    const esOptima = aristasResaltadas.has(clave);

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.strokeStyle = esOptima ? "#16803c" : "#b0b8c1";
    ctx.lineWidth = esOptima ? 3 : 1.5;
    ctx.stroke();

    // Peso de la arista, a mitad de camino
    const mx = (p1.x + p2.x) / 2;
    const my = (p1.y + p2.y) / 2;
    ctx.fillStyle = "#555";
    ctx.font = "12px Arial";
    ctx.fillText(arista.peso, mx, my);
  });

  // Dibujar nodos
  posiciones.forEach((p, i) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 18, 0, 2 * Math.PI);
    ctx.fillStyle = "#2563eb";
    ctx.fill();

    ctx.fillStyle = "white";
    ctx.font = "bold 13px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(etiqueta(i), p.x, p.y);
  });
}

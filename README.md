# TSP — Problema del Agente Viajero (Fuerza Bruta)

Matemática Computacional — UPC 2026-20

## Estructura del proyecto

```
tsp-project/
├── main.py                      # Punto de entrada: crea la ventana pywebview
├── requirements.txt
├── backend/
│   ├── api.py                   # Puente entre JS y la lógica (expuesto como window.pywebview.api)
│   ├── grafo.py                 # Clase Grafo: matriz de adyacencia, generación, validación hamiltoniana
│   └── tsp_fuerza_bruta.py      # Algoritmo de fuerza bruta: permutaciones, cálculo de costos, ciclo óptimo
└── frontend/
    ├── index.html                # Estructura de la interfaz
    ├── css/
    │   └── style.css
    └── js/
        ├── grafico.js            # Dibujo del grafo en <canvas>
        └── app.js                 # Interacción con la API de Python
```

## Instalación

```bash
python -m venv venv
source venv/bin/activate        # En Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Ejecución

```bash
python main.py
```

## Flujo de la aplicación

1. **Configurar grafo** — el usuario ingresa n (5-10) y elige generación manual
   (agregando aristas con peso) o aleatoria.
2. **Validar** — se verifica que el grafo admita al menos un ciclo hamiltoniano
   (grado mínimo 2 por nodo + conectividad). Si falla, se sugieren aristas.
3. **Resolver TSP** — se ejecuta la fuerza bruta: se generan las permutaciones
   de nodos (fijando el nodo 0 como origen/destino para evitar ciclos
   equivalentes por rotación), se valida cada una contra las aristas
   existentes y se calcula su costo.
4. **Paso a paso** — el usuario avanza por cada ruta evaluada usando los
   botones Anterior/Siguiente, viendo en vivo si es válida y su costo.
5. **Resultado** — se muestra el ciclo óptimo, su costo, el total de ciclos
   hamiltonianos encontrados, y se resalta visualmente sobre el grafo.

## Pendiente para el 50% de avance (semana 6)

- [ ] Mejorar validación de hamiltonicidad (la actual es una condición
      necesaria rápida; considerar Ore/Dirac o un chequeo más estricto)
- [ ] Pulir visualización del grafo (mejor distribución si n es grande)
- [ ] Agregar manejo de errores en la UI (inputs vacíos, aristas duplicadas)
- [ ] Redactar informe: introducción, objetivo, metodología con capturas
      de código en formato APA (ver ejemplo de "Teoría de Juegos")
- [ ] Bibliografía sobre TSP y algoritmos de fuerza bruta

## Notas técnicas

- El grafo es **no dirigido** (matriz de adyacencia simétrica).
- Los nodos se identifican internamente como 0..n-1 y se muestran en la
  interfaz como letras A, B, C... (ver función `etiqueta()` en grafico.js
  y `_etiqueta()` en tsp_fuerza_bruta.py).
- La complejidad de la fuerza bruta es O((n-1)!) — para n=10 son 362,880
  permutaciones, sigue siendo manejable en tiempo real.

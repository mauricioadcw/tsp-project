# TSP — Problema del Agente Viajero (Fuerza Bruta)

**Matemática Computacional — UPC 2026-20** · Curso 1AMA0726

Aplicación de escritorio con interfaz web (Python + pywebview) que resuelve
el Problema del Agente Viajero (TSP) mediante el algoritmo de fuerza bruta.
Permite generar un grafo no dirigido de forma manual o aleatoria, valida
si admite un ciclo hamiltoniano, y ejecuta la búsqueda exhaustiva de todas
las rutas posibles mostrando el proceso paso a paso hasta llegar al ciclo
óptimo.

## Integrantes

Trabajo Grupal — Grupo 2 · Sección 15359 · Ciclo 202620

| Integrante | Código |
|---|---|
| Del Castillo Wan, Mauricio Adriel | U202517849 |
| Lupu Peña, Zoica Mihaela | U202511676 |
| Bravo Canchanya, Paolo Cesar | U20251B279 |
| Sánchez Campos, Neyser | U20251B739 |

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
        ├── grafico.js            # Dibujo del grafo en <canvas> (HiDPI, resaltado por paso)
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
   (agregando aristas por nodo A-J con peso, desde selects) o aleatoria.
2. **Validar** — se verifica si el grafo admite un ciclo hamiltoniano en dos
   etapas: un chequeo rápido (grado mínimo 2 + conectividad) y, si ese pasa,
   una confirmación exacta por backtracking. Solo si es válido se habilita
   la resolución.
3. **Resolver TSP** — se ejecuta la fuerza bruta: se generan las permutaciones
   de nodos (fijando el nodo 0 como origen/destino para evitar ciclos
   equivalentes por rotación), se valida cada una contra las aristas
   existentes y se calcula su costo.
4. **Paso a paso** — el usuario avanza por cada ruta evaluada usando los
   botones Anterior/Siguiente. La ruta en evaluación se resalta en el grafo
   en color ámbar, junto con su validez y costo.
5. **Resultado** — se muestra el ciclo óptimo, su costo, el total de ciclos
   hamiltonianos encontrados, y se resalta en verde sobre el grafo.

## Estado actual (avance semana 6)

- [x] Generación de grafo manual y aleatoria
- [x] Validación exacta de hamiltonicidad (backtracking)
- [x] Algoritmo de fuerza bruta con historial de pasos
- [x] Interfaz interactiva paso a paso con resaltado visual
- [x] Manejo de errores en inputs (n fuera de rango, aristas duplicadas/inválidas)
- [ ] Redactar informe: introducción, objetivo, metodología con capturas
      de código en formato APA (ver ejemplo de "Teoría de Juegos")
- [ ] Bibliografía sobre TSP y algoritmos de fuerza bruta
- [ ] Diagrama de flujo del programa (para el informe)

## Notas técnicas

- El grafo es **no dirigido** (matriz de adyacencia simétrica).
- Los nodos se identifican internamente como 0..n-1 y se muestran en la
  interfaz como letras A, B, C... (ver función `etiqueta()` en grafico.js
  y `_etiqueta()` en tsp_fuerza_bruta.py).
- La complejidad de la fuerza bruta es O((n-1)!) — para n=10 son 362,880
  permutaciones, sigue siendo manejable en tiempo real.
- La validación de hamiltonicidad usa backtracking con poda (se detiene
  al encontrar el primer ciclo), distinto del algoritmo de resolución
  que sí necesita evaluar todas las permutaciones para hallar el óptimo.
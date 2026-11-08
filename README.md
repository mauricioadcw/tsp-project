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
3. **Matriz de costos** — al validar correctamente, se muestra la matriz n×n
   con los pesos entre cada par de nodos.
4. **Resolver TSP** — se ejecuta la fuerza bruta: se generan las permutaciones
   de nodos (fijando el nodo 0 como origen/destino para evitar ciclos
   equivalentes por rotación), se valida cada una contra las aristas
   existentes y se calcula su costo.
5. **Paso a paso** — el usuario avanza por cada ruta evaluada con los botones
   Anterior/Siguiente, con reproducción automática (velocidad configurable)
   o saltando directo a una ruta por número. La ruta en evaluación se resalta
   en el grafo en color ámbar, cada nodo muestra su orden de visita y las
   aristas que la ruta necesita pero no existen se dibujan punteadas en rojo.
6. **Resultado y tabla comparativa** — se muestra el ciclo óptimo resaltado
   en verde sobre el grafo, junto con una tabla paginada de todos los ciclos
   hamiltonianos encontrados (ordenable por mejores/peores/orden de
   generación, con opción de ver todos). El "#" de cada fila coincide con
   el campo "Ir a la ruta N.º"; al hacer clic en una fila, la app salta a
   ese paso del recorrido y lo resalta en el grafo (en verde si el ciclo
   tiene el costo óptimo, en ámbar en los demás casos).

## Empaquetar como ejecutable (.exe)

El ejecutable se genera con [Nuitka](https://nuitka.net), que traduce el
código Python a C y lo compila a un binario nativo. Debe correrse en
Windows para obtener un `.exe` de Windows.

```powershell
pip install nuitka

python -m nuitka --mode=onefile --windows-console-mode=disable --include-data-dir=frontend=frontend --output-filename=TSP-AgenteViajero.exe main.py
```

El ejecutable queda junto a `main.py` como `TSP-AgenteViajero.exe`.

**Notas:**
- La primera compilación tarda varios minutos. Nuitka puede pedir permiso
  para descargar Dependency Walker y, si no hay un compilador de C
  instalado, MinGW; ambos se guardan en caché.
- `--include-data-dir=frontend=frontend` copia la carpeta `frontend/`
  dentro del ejecutable como archivos de datos (no se compilan).
- `--windows-console-mode=disable` oculta la consola negra. Recomendado:
  probar primero SIN este flag para ver cualquier error de arranque; una
  vez confirmado que abre bien, compilar CON el flag para la versión que
  se entrega. Con el flag activo, si algo falla al iniciar no se verá
  ningún mensaje de error.
- No agregar `--include-package=webview`: choca con la regla interna de
  Nuitka para pywebview y la compilación falla. Los archivos de datos de
  pywebview ya los incluye Nuitka por su cuenta.
- `main.py` ya usa `webview.start(debug=False)` y resuelve las rutas con
  `ruta_recurso()`, que también funciona en el ejecutable compilado.
- pywebview en Windows usa el motor WebView2, que viene preinstalado en
  Windows 11 y en versiones modernas de Windows 10. Si el ejecutable no
  abre en otra máquina, verificar que tenga WebView2 Runtime instalado.
- Algunos antivirus marcan como sospechoso el modo de archivo único. Si
  pasa, compilar con `--mode=standalone` (genera una carpeta con el
  ejecutable y sus librerías, y arranca más rápido).
- Las carpetas generadas (`main.build/`, `main.dist/`, `main.onefile-build/`)
  y el `.exe` no se suben al repositorio (están en `.gitignore`). Para
  compartir el ejecutable, adjuntarlo en una *Release* del repositorio.

Probar siempre `TSP-AgenteViajero.exe` directamente antes de distribuirlo,
para confirmar que carga la interfaz correctamente fuera del entorno de
desarrollo.

## Estado actual (avance semana 6)

- [x] Generación de grafo manual y aleatoria
- [x] Validación exacta de hamiltonicidad (backtracking)
- [x] Algoritmo de fuerza bruta con historial de pasos
- [x] Matriz de costos visible
- [x] Tabla comparativa de ciclos (paginada, mejores/peores/orden de generación)
- [x] Interfaz interactiva paso a paso con resaltado visual, reproducción
      automática y salto directo a una ruta
- [x] Manejo de errores en inputs (n fuera de rango, aristas duplicadas/inválidas)
- [x] Rediseño de la interfaz (panel lateral de procedimiento + área de trabajo)
- [ ] Empaquetar versión final como .exe con Nuitka (con debug=False)
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
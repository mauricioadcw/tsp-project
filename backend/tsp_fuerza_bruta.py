"""
tsp_fuerza_bruta.py
Algoritmo de fuerza bruta para el Problema del Agente Viajero (TSP).

Genera todos los ciclos hamiltonianos posibles a partir de las
permutaciones de nodos, calcula el costo de cada uno usando la
matriz de costos del grafo, y determina el ciclo óptimo.

Se guardan dos vistas de los resultados:
- self.pasos: registro cronológico de CADA permutación evaluada
  (válida o no), usado por el modo paso a paso / animación.
- self.ciclos_validos: solo los ciclos hamiltonianos válidos,
  usado por la tabla comparativa. Se mantiene también una versión
  ordenada por costo para servir "mejores N" / "peor" sin volver
  a ordenar en cada consulta.

Para n grande (hasta 10, según el enunciado) el total de pasos es
(n-1)! como máximo 362,880 — manejable en memoria, pero nunca se
envía completo al frontend: siempre se sirve paginado.
"""

from itertools import permutations


class ResolverTSP:
    def __init__(self, grafo):
        self.grafo = grafo
        self.pasos = []            # cronología completa (para paso a paso)
        self.ciclos_validos = []   # ciclos válidos en orden de generación
        self.ciclos_por_costo = [] # mismos ciclos, ordenados ascendente por costo
        self.ciclo_optimo = None
        self.ciclo_peor = None

    # ---------------------------------------------------------
    # Resolución
    # ---------------------------------------------------------

    def resolver(self):
        """
        Ejecuta la fuerza bruta completa y construye el registro de pasos.
        Fija el nodo 0 como inicio/fin para no repetir ciclos equivalentes
        por rotación (reduce (n-1)! en vez de n!, sin perder soluciones).
        """
        n = self.grafo.n
        nodos_restantes = list(range(1, n))
        self.pasos = []
        self.ciclos_validos = []

        self.pasos.append({
            "tipo": "inicio",
            "mensaje": f"Se generarán todas las permutaciones de los {n-1} "
                       f"nodos restantes, fijando el nodo 0 como origen/destino."
        })

        for indice, perm in enumerate(permutations(nodos_restantes)):
            ruta = [0] + list(perm) + [0]
            valido, costo = self._evaluar_ruta(ruta)

            self.pasos.append({
                "tipo": "evaluacion",
                "indice_ruta": indice,  # posición entre TODAS las permutaciones (válidas o no)
                "ruta": ruta,
                "valido": valido,
                "costo": costo if valido else None,
                "mensaje": self._mensaje_paso(ruta, valido, costo)
            })

            if valido:
                self.ciclos_validos.append({
                    "id": len(self.ciclos_validos),  # posición entre los ciclos VÁLIDOS
                    "ruta": ruta,
                    "costo": costo
                })

        self.ciclos_por_costo = sorted(self.ciclos_validos, key=lambda c: c["costo"])

        if self.ciclos_validos:
            self.ciclo_optimo = self.ciclos_por_costo[0]
            self.ciclo_peor = self.ciclos_por_costo[-1]
            self.pasos.append({
                "tipo": "resultado",
                "ciclo_optimo": self.ciclo_optimo,
                "total_ciclos": len(self.ciclos_validos),
                "mensaje": f"Se encontraron {len(self.ciclos_validos)} ciclos "
                           f"hamiltonianos. El óptimo tiene costo "
                           f"{self.ciclo_optimo['costo']}."
            })
        else:
            self.ciclo_optimo = None
            self.ciclo_peor = None
            self.pasos.append({
                "tipo": "resultado",
                "ciclo_optimo": None,
                "total_ciclos": 0,
                "mensaje": "No se encontraron ciclos hamiltonianos válidos."
            })

        return self.resumen()

    def _evaluar_ruta(self, ruta):
        """Calcula el costo total de una ruta si todas sus aristas existen."""
        costo = 0
        for k in range(len(ruta) - 1):
            i, j = ruta[k], ruta[k + 1]
            peso = self.grafo.peso(i, j)
            if peso is None:
                return False, None
            costo += peso
        return True, costo

    def _mensaje_paso(self, ruta, valido, costo):
        etiquetas = " -> ".join(self._etiqueta(i) for i in ruta)
        if valido:
            return f"Ruta {etiquetas}: válida, costo = {costo}"
        return f"Ruta {etiquetas}: no es un ciclo válido (arista inexistente)"

    @staticmethod
    def _etiqueta(indice):
        """Convierte índice 0..n-1 a letra A..J para mostrar en la UI."""
        return chr(65 + indice)

    def resumen(self):
        """
        Resumen liviano (sin la lista completa de ciclos) para no
        mandar de golpe potencialmente cientos de miles de filas.
        La tabla se consulta aparte con obtener_pagina_ciclos().
        """
        return {
            "total_ciclos": len(self.ciclos_validos),
            "ciclo_optimo": self.ciclo_optimo,
            "ciclo_peor": self.ciclo_peor,
            "total_pasos": len(self.pasos)
        }

    # ---------------------------------------------------------
    # Consulta paginada para la tabla comparativa
    # ---------------------------------------------------------

    def obtener_pagina_ciclos(self, modo="mejores", pagina=1, tamano_pagina=10):
        """
        Devuelve una página de la tabla de ciclos válidos.

        modo:
          - "mejores": ordenados de menor a mayor costo (empieza por el óptimo)
          - "peores":  ordenados de mayor a menor costo (empieza por el peor)
          - "orden_generacion": en el orden en que la fuerza bruta los generó
        pagina: 1-based
        tamano_pagina: cantidad de filas por página; -1 significa "todas"
        """
        if modo == "peores":
            fuente = list(reversed(self.ciclos_por_costo))
        elif modo == "orden_generacion":
            fuente = self.ciclos_validos
        else:  # "mejores" por defecto
            fuente = self.ciclos_por_costo

        total = len(fuente)

        if tamano_pagina == -1:
            datos = fuente
            total_paginas = 1
            pagina = 1
        else:
            total_paginas = max(1, -(-total // tamano_pagina))  # ceil division
            pagina = max(1, min(pagina, total_paginas))
            inicio = (pagina - 1) * tamano_pagina
            fin = inicio + tamano_pagina
            datos = fuente[inicio:fin]

        return {
            "datos": datos,
            "pagina": pagina,
            "total_paginas": total_paginas,
            "total_ciclos": total,
            "tamano_pagina": tamano_pagina
        }

    # ---------------------------------------------------------
    # Paso a paso / animación
    # ---------------------------------------------------------

    def obtener_paso(self, indice):
        if 0 <= indice < len(self.pasos):
            return self.pasos[indice]
        return None

    def buscar_paso_por_indice_ruta(self, indice_ruta):
        """
        Traduce un 'número de ruta entre todas las permutaciones'
        (0-based, tal como se muestra en la tabla) al índice dentro
        de self.pasos, para poder saltar directo con el input de
        'ir a la ruta N' del modo paso a paso.
        """
        # self.pasos[0] es el mensaje de "inicio"; las evaluaciones
        # empiezan en self.pasos[1], en el mismo orden que se generaron.
        indice_en_pasos = indice_ruta + 1
        if 0 <= indice_en_pasos < len(self.pasos) and self.pasos[indice_en_pasos]["tipo"] == "evaluacion":
            return indice_en_pasos
        return None
"""
tsp_fuerza_bruta.py
Algoritmo de fuerza bruta para el Problema del Agente Viajero (TSP).

Genera todos los ciclos hamiltonianos posibles a partir de las
permutaciones de nodos, calcula el costo de cada uno usando la
matriz de costos del grafo, y determina el ciclo óptimo.

El "paso a paso" se modela generando la lista completa de pasos
de antemano; el frontend simplemente pide pasos[i] uno a la vez
para dar la sensación de ejecución interactiva.
"""

from itertools import permutations


class ResolverTSP:
    def __init__(self, grafo):
        self.grafo = grafo
        self.pasos = []          # historial de pasos para mostrar en la UI
        self.ciclos_validos = [] # lista de dicts: {"ruta": [...], "costo": int}
        self.ciclo_optimo = None

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

        for perm in permutations(nodos_restantes):
            ruta = [0] + list(perm) + [0]
            valido, costo = self._evaluar_ruta(ruta)

            self.pasos.append({
                "tipo": "evaluacion",
                "ruta": ruta,
                "valido": valido,
                "costo": costo if valido else None,
                "mensaje": self._mensaje_paso(ruta, valido, costo)
            })

            if valido:
                self.ciclos_validos.append({"ruta": ruta, "costo": costo})

        if self.ciclos_validos:
            self.ciclo_optimo = min(self.ciclos_validos, key=lambda c: c["costo"])
            self.pasos.append({
                "tipo": "resultado",
                "ciclo_optimo": self.ciclo_optimo,
                "total_ciclos": len(self.ciclos_validos),
                "mensaje": f"Se encontraron {len(self.ciclos_validos)} ciclos "
                           f"hamiltonianos. El óptimo tiene costo "
                           f"{self.ciclo_optimo['costo']}."
            })
        else:
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
        return {
            "total_ciclos": len(self.ciclos_validos),
            "ciclos": self.ciclos_validos,
            "ciclo_optimo": self.ciclo_optimo,
            "total_pasos": len(self.pasos)
        }

    def obtener_paso(self, indice):
        if 0 <= indice < len(self.pasos):
            return self.pasos[indice]
        return None

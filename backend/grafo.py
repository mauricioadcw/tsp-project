"""
grafo.py
Representación del grafo no dirigido mediante matriz de adyacencia
y validación de existencia de ciclos hamiltonianos.
"""

import random
from itertools import combinations


class Grafo:
    def __init__(self, n):
        """
        n: cantidad de nodos, n en [5, 10]
        matriz: matriz de adyacencia n x n.
                matriz[i][j] = peso de la arista (i, j)
                matriz[i][j] = None si no existe arista
        """
        if not (5 <= n <= 10):
            raise ValueError("n debe estar en el rango [5, 10]")

        self.n = n
        self.nodos = list(range(n))  # 0..n-1 -> se etiquetan como A, B, C... en el frontend
        self.matriz = [[None for _ in range(n)] for _ in range(n)]

    # ---------------------------------------------------------
    # Construcción del grafo
    # ---------------------------------------------------------

    def agregar_arista(self, i, j, peso):
        """Agrega una arista no dirigida entre i y j con el peso dado."""
        if i == j:
            raise ValueError("No se permiten auto-ciclos (i == j)")
        if not (0 <= i < self.n and 0 <= j < self.n):
            raise ValueError("Índice de nodo fuera de rango")
        if peso <= 0:
            raise ValueError("El peso debe ser un número positivo")
        if self.matriz[i][j] is not None:
            raise ValueError(f"La arista {chr(65+i)}-{chr(65+j)} ya existe")
        self.matriz[i][j] = peso
        self.matriz[j][i] = peso

    def eliminar_arista(self, i, j):
        """Elimina la arista entre i y j, si existe."""
        if self.matriz[i][j] is None:
            raise ValueError("Esa arista no existe")
        self.matriz[i][j] = None
        self.matriz[j][i] = None

    def generar_aleatorio(self, densidad=0.7, peso_min=1, peso_max=20):
        """
        Genera un grafo aleatorio con la densidad de conexión indicada.
        Se asegura de que el grafo resultante sea susceptible de tener
        al menos un ciclo hamiltoniano (grafo conexo como mínimo).
        """
        # Reiniciar matriz
        self.matriz = [[None for _ in range(self.n)] for _ in range(self.n)]

        # 1. Generar un ciclo hamiltoniano base para garantizar que exista al menos uno
        orden = list(range(self.n))
        random.shuffle(orden)
        for k in range(self.n):
            i, j = orden[k], orden[(k + 1) % self.n]
            self.agregar_arista(i, j, random.randint(peso_min, peso_max))

        # 2. Agregar aristas adicionales aleatorias según la densidad
        posibles = list(combinations(range(self.n), 2))
        random.shuffle(posibles)
        for (i, j) in posibles:
            if self.matriz[i][j] is None and random.random() < densidad:
                self.agregar_arista(i, j, random.randint(peso_min, peso_max))

    # ---------------------------------------------------------
    # Validación de hamiltonicidad
    # ---------------------------------------------------------

    def existe_ciclo_hamiltoniano(self):
        """
        Validación en dos etapas:

        1. Chequeo rápido (condición NECESARIA, no suficiente):
           - El grafo debe ser conexo
           - Cada nodo debe tener grado >= 2
           Si falla aquí, se corta de inmediato y se sugieren aristas,
           sin necesidad de explorar nada más.

        2. Chequeo exacto (backtracking): solo se ejecuta si el
           chequeo rápido pasa. Busca un ciclo hamiltoniano real
           deteniéndose apenas encuentra el primero (no explora todo
           el espacio, a diferencia de la resolución completa en
           tsp_fuerza_bruta.py, que sí necesita evaluarlos todos para
           encontrar el óptimo).

        Devuelve (bool, lista_de_sugerencias)
        """
        faltantes = []

        # --- Etapa 1: chequeo rápido ---
        for i in range(self.n):
            grado = sum(1 for j in range(self.n) if self.matriz[i][j] is not None)
            if grado < 2:
                for j in range(self.n):
                    if j != i and self.matriz[i][j] is None:
                        faltantes.append((i, j))
                        break

        if not self._es_conexo():
            faltantes.append("grafo_desconexo")

        if faltantes:
            return (False, faltantes)

        # --- Etapa 2: chequeo exacto con backtracking ---
        if self._existe_ciclo_backtracking():
            return (True, [])

        # El chequeo rápido pasó pero no existe ciclo real: no hay una
        # "arista faltante" única que lo arregle (el problema es
        # estructural), así que se informa de forma genérica.
        return (False, ["sin_ciclo_hamiltoniano"])

    def _existe_ciclo_backtracking(self):
        """
        Búsqueda con poda que confirma la existencia de al menos un
        ciclo hamiltoniano, sin generar todas las permutaciones.
        Fija el nodo 0 como inicio para reducir el espacio de búsqueda.
        """
        visitado = [False] * self.n
        camino = [0]
        visitado[0] = True
        return self._backtrack(camino, visitado)

    def _backtrack(self, camino, visitado):
        if len(camino) == self.n:
            # ¿Se puede cerrar el ciclo volviendo al nodo inicial?
            return self.matriz[camino[-1]][camino[0]] is not None

        actual = camino[-1]
        for siguiente in range(self.n):
            if not visitado[siguiente] and self.matriz[actual][siguiente] is not None:
                visitado[siguiente] = True
                camino.append(siguiente)

                if self._backtrack(camino, visitado):
                    return True

                # Deshacer (backtrack)
                camino.pop()
                visitado[siguiente] = False

        return False

    def _es_conexo(self):
        visitados = set()
        pila = [0]
        while pila:
            actual = pila.pop()
            if actual in visitados:
                continue
            visitados.add(actual)
            for j in range(self.n):
                if self.matriz[actual][j] is not None and j not in visitados:
                    pila.append(j)
        return len(visitados) == self.n

    # ---------------------------------------------------------
    # Utilidades
    # ---------------------------------------------------------

    def peso(self, i, j):
        return self.matriz[i][j]

    def a_dict(self):
        """Serializa el grafo para enviarlo al frontend (JSON-friendly)."""
        aristas = []
        for i in range(self.n):
            for j in range(i + 1, self.n):
                if self.matriz[i][j] is not None:
                    aristas.append({"origen": i, "destino": j, "peso": self.matriz[i][j]})
        return {"n": self.n, "aristas": aristas}

    def matriz_costos(self):
        """
        Devuelve la matriz de costos completa (n x n) tal como la pide
        el enunciado: 'el sistema construirá la matriz de costos'.
        Las celdas sin arista se representan como None (el frontend
        las muestra como '-'); la diagonal siempre es None.
        """
        return {
            "n": self.n,
            "etiquetas": [chr(65 + i) for i in range(self.n)],
            "filas": [
                [self.matriz[i][j] for j in range(self.n)]
                for i in range(self.n)
            ]
        }
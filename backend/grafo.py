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
        self.matriz[i][j] = peso
        self.matriz[j][i] = peso

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
        Verificación rápida de factibilidad (condición necesaria, no
        suficiente) antes de correr la fuerza bruta completa:
        - El grafo debe ser conexo
        - Cada nodo debe tener grado >= 2
        Devuelve (bool, lista_de_aristas_faltantes_sugeridas)
        """
        faltantes = []

        # Verificar grado mínimo 2 en cada nodo
        for i in range(self.n):
            grado = sum(1 for j in range(self.n) if self.matriz[i][j] is not None)
            if grado < 2:
                # Sugerir conectar con el siguiente nodo disponible
                for j in range(self.n):
                    if j != i and self.matriz[i][j] is None:
                        faltantes.append((i, j))
                        break

        # Verificar conectividad (BFS)
        if not self._es_conexo():
            faltantes.append("grafo_desconexo")

        return (len(faltantes) == 0, faltantes)

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

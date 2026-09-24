"""
api.py
Clase puente entre el frontend (JS) y la lógica de negocio (Python).
Cada método público de esta clase queda expuesto en JS como
window.pywebview.api.<nombre_metodo>(...)
"""

from backend.grafo import Grafo
from backend.tsp_fuerza_bruta import ResolverTSP


class Api:
    def __init__(self):
        self.grafo = None
        self.resolver_tsp = None

    # ---------------------------------------------------------
    # Construcción del grafo
    # ---------------------------------------------------------

    def crear_grafo(self, n):
        """Inicializa un grafo vacío de n nodos. Llamado al elegir modo manual."""
        self.grafo = Grafo(int(n))
        return {"ok": True, "n": self.grafo.n}

    def agregar_arista(self, i, j, peso):
        """Usado en modo manual: agrega una arista ingresada por el usuario."""
        if self.grafo is None:
            return {"ok": False, "error": "Primero debe crear el grafo"}
        try:
            self.grafo.agregar_arista(int(i), int(j), float(peso))
            return {"ok": True}
        except ValueError as e:
            return {"ok": False, "error": str(e)}

    def generar_grafo_aleatorio(self, n, densidad=0.7):
        """Genera un grafo aleatorio válido de n nodos."""
        self.grafo = Grafo(int(n))
        self.grafo.generar_aleatorio(densidad=float(densidad))
        return {"ok": True, "grafo": self.grafo.a_dict()}

    def obtener_grafo(self):
        if self.grafo is None:
            return {"ok": False, "error": "No hay grafo creado"}
        return {"ok": True, "grafo": self.grafo.a_dict()}

    # ---------------------------------------------------------
    # Validación
    # ---------------------------------------------------------

    def validar_hamiltoniano(self):
        """
        Verifica si el grafo actual admite un ciclo hamiltoniano.
        Si no, devuelve sugerencias de aristas faltantes.
        """
        if self.grafo is None:
            return {"ok": False, "error": "No hay grafo creado"}

        valido, faltantes = self.grafo.existe_ciclo_hamiltoniano()

        sugerencias = []
        mensaje_extra = None
        for item in faltantes:
            if isinstance(item, tuple):
                i, j = item
                sugerencias.append(f"{chr(65+i)}-{chr(65+j)}")
            elif item == "grafo_desconexo":
                mensaje_extra = "El grafo no es conexo (hay nodos aislados o sin ruta entre subgrupos)."
            elif item == "sin_ciclo_hamiltoniano":
                mensaje_extra = ("El grafo cumple los requisitos mínimos de grado y conectividad, "
                                  "pero no contiene ningún ciclo hamiltoniano real. "
                                  "Pruebe agregar más aristas.")

        return {
            "ok": True,
            "valido": valido,
            "sugerencias": sugerencias,
            "mensaje_extra": mensaje_extra,
        }

    # ---------------------------------------------------------
    # Resolución TSP
    # ---------------------------------------------------------

    def resolver_tsp_completo(self):
        """Ejecuta la fuerza bruta completa y devuelve el resumen final."""
        if self.grafo is None:
            return {"ok": False, "error": "No hay grafo creado"}

        self.resolver_tsp = ResolverTSP(self.grafo)
        resumen = self.resolver_tsp.resolver()
        return {"ok": True, "resumen": resumen}

    def obtener_paso(self, indice):
        """Devuelve el paso i del historial, para el avance interactivo en la UI."""
        if self.resolver_tsp is None:
            return {"ok": False, "error": "Debe ejecutar resolver_tsp_completo primero"}

        paso = self.resolver_tsp.obtener_paso(int(indice))
        if paso is None:
            return {"ok": False, "error": "Índice fuera de rango"}
        return {"ok": True, "paso": paso, "total_pasos": len(self.resolver_tsp.pasos)}
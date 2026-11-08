"""
main.py
Punto de entrada de la aplicación.
Crea la ventana pywebview y carga el frontend, exponiendo la Api
para que el JavaScript del frontend pueda llamarla.
"""

import os
import sys
import webview
from backend.api import Api


def ruta_recurso(ruta_relativa):
    """
    Resuelve rutas de archivos tanto en desarrollo (python main.py)
    como empaquetado con PyInstaller (--onefile), donde los archivos
    quedan extraídos en una carpeta temporal (sys._MEIPASS).
    """
    if hasattr(sys, "_MEIPASS"):
        base = sys._MEIPASS
    else:
        base = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(base, ruta_relativa)


def main():
    api = Api()
    webview.create_window(
        title="TSP - Problema del Agente Viajero (Fuerza Bruta)",
        url=ruta_recurso("frontend/index.html"),
        js_api=api,
        width=1280,
        height=800,
        min_size=(1000, 640),
    )
    webview.start(debug=False)


if __name__ == "__main__":
    main()
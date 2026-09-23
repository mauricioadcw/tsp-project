"""
main.py
Punto de entrada de la aplicación.
Crea la ventana pywebview y carga el frontend, exponiendo la Api
para que el JavaScript del frontend pueda llamarla.
"""

import webview
from backend.api import Api


def main():
    api = Api()
    webview.create_window(
        title="Problema del Agente Viajero",
        url="frontend/index.html",
        js_api=api,
        width=1100,
        height=750,
        min_size=(900, 600),
    )
    webview.start(debug=True)  # debug=True habilita DevTools


if __name__ == "__main__":
    main()

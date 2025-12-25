# Jarvis OS v5.5 - Advanced AR HUD

Este repositorio contiene una aplicación de Realidad Aumentada (AR) de última generación inspirada en la interfaz de Jarvis (Stark Industries). Construida con **React**, **MediaPipe Hands** y **Tailwind CSS**, permite una interacción touchless completa mediante gestos manuales.

## 🚀 Características Principales

- **Detección de Gestos 3D**:
  - **Pinch (Pinza)**: Inicia el modo de dibujo en el espacio AR.
  - **Palm Open (Palma)**: Activa el borrador holográfico de precisión.
  - **Still Hand (Mano Quieta)**: Inicia el proceso de fijación de objetivo (Target Lock).
- **Dibujo Holográfico Avanzado**:
  - **Lift Pen**: Soporte para múltiples trazos independientes.
  - **Z-Depth Awareness**: El grosor del trazo cambia dinámicamente según la distancia de la mano a la cámara.
  - **Sistema de Partículas**: Efectos visuales de luz al dibujar.
- **HUD Biométrico y Telemetría**:
  - Visualización en tiempo real de BPM, niveles de estrés y profundidad Z.
  - Esqueleto de mano holográfico proyectado sobre la imagen real.
  - Consola de logs del sistema con eventos dinámicos.
- **Paleta de Colores Interactiva**: Cambia el color de tus trazos (Cian, Magenta, Amarillo, Verde) mediante hover o selección directa.

## 🛠️ Tecnologías Utilizadas

- **React 18**: Framework principal de la UI.
- **MediaPipe Hands**: Motor de IA para el seguimiento de manos y detección de landmarks.
- **Tailwind CSS 4**: Estilizado premium con efectos de glassmorphism y animaciones sci-fi.
- **Lucide React**: Iconografía técnica y minimalista.
- **Vite**: Herramienta de construcción ultra rápida.

## 📦 Instalación y Uso

1.  Clona el repositorio:
    ```bash
    git clone https://github.com/YvnPretty/vr.git
    ```
2.  Navega a la carpeta del proyecto:
    ```bash
    cd ar_game
    ```
3.  Instala las dependencias:
    ```bash
    npm install
    ```
4.  Inicia el servidor de desarrollo:
    ```bash
    npm run dev
    ```
5.  Abre tu navegador en `http://localhost:5173` y concede permisos de cámara.

## 🎮 Guía de Interacción

- **Para Dibujar**: Junta el dedo índice y el pulgar. Mueve la mano para crear trazos.
- **Para Borrar**: Abre la palma de la mano y pásala sobre los dibujos que desees eliminar.
- **Para Cambiar Color**: Pasa el cursor sobre los círculos de color en la parte inferior de la pantalla.
- **Target Lock**: Mantén la mano quieta sobre un punto para que el sistema fije el objetivo.

---
Desarrollado con ❤️ para una experiencia AR inmersiva.

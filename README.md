# AR Shared View Prototype - Unity

Este proyecto es un prototipo funcional de un juego de Realidad Aumentada (AR) desarrollado en Unity utilizando **AR Foundation**. Permite la detección de superficies, interacción con objetos AR y la capacidad de compartir la vista en tiempo real con otro usuario.

## Requisitos Técnicos

- **Unity 2021.3 LTS** o superior.
- **AR Foundation** (v4.x o v5.x).
- **ARCore XR Plugin** (para Android).
- **ARKit XR Plugin** (para iOS).
- **TextMeshPro** para la interfaz de usuario.

## Estructura del Proyecto

- `Assets/Scripts/ARPlacementManager.cs`: Maneja la colocación de objetos en planos detectados.
- `Assets/Scripts/ARInteractable.cs`: Permite mover, rotar y escalar objetos AR mediante gestos táctiles.
- `Assets/Scripts/ARViewSharer.cs`: Captura la cámara y la posición para transmitirla.
- `Assets/Scripts/ARViewReceiver.cs`: Recibe y visualiza la escena compartida.
- `Assets/Scripts/UIManager.cs`: Controla la interfaz de usuario básica.

## Configuración de la Escena (Unity Hierarchy)

1. **AR Session Origin**:
   - Añadir componente `AR Plane Manager`.
   - Añadir componente `AR Raycast Manager`.
   - Añadir componente `AR Placement Manager` (asignar un Prefab).
2. **AR Session**: Controla el ciclo de vida de la experiencia AR.
3. **Main Camera**:
   - Asegurarse de que tiene el componente `AR Camera Manager` y `AR Camera Background`.
   - Añadir el script `ARViewSharer.cs`.
4. **Canvas**:
   - Botón "Compartir Vista" -> Conectar a `UIManager`.
   - Texto de estado.

## Funcionalidad de Compartir Vista

El sistema utiliza un enfoque de **Streaming de Datos + Frames**:
1. **Captura**: El `ARViewSharer` toma un "screenshot" de la cámara AR y captura la posición/rotación (`Pose`).
2. **Compresión**: La imagen se comprime en JPG para reducir el ancho de banda.
3. **Sincronización**: Se envía un objeto `ARFrameData` que contiene la imagen y la transformación espacial.
4. **Visualización**: El receptor aplica la imagen a un `RawImage` y mueve una cámara virtual a la posición recibida, replicando exactamente lo que el emisor ve.

## 🌐 WebSocket Bridge (Conexión Web)

Para ver la transmisión en el navegador, debes ejecutar el servidor puente:

1.  Asegúrate de tener **Node.js** instalado.
2.  Navega a la carpeta `bridge/`.
3.  Ejecuta: `node server.js`.
4.  Abre `web_viewer/index.html` en tu navegador (o usa el servidor local en el puerto 3000).

## 💎 Interfaz Premium (Unity)

He añadido `ARPremiumUI.cs` para una experiencia visual superior:
- **Efectos de Fade-in**: La interfaz aparece suavemente al iniciar.
- **Indicadores de Pulso**: Animación visual cuando la transmisión está activa.
- **Paneles Contextuales**: Cambia entre modo exploración y modo transmisión.

## Configuración de la Escena (Actualizada)

1. **Canvas**:
   - Añadir `ARPremiumUI` al objeto Canvas.
   - Vincular los paneles (Main, Sharing) y botones.
   - Añadir un `CanvasGroup` para el efecto de fade.
2. **Main Camera**:
   - Asegurarse de que `ARViewSharer` esté presente.
3. **AR Network Manager**:
   - Configurar la IP del servidor puente (tu PC).

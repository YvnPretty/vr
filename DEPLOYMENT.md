# Guía de Despliegue (Deployment Guide)

Este documento detalla los pasos para compilar y desplegar el juego de AR en dispositivos reales.

## 1. Preparación de la Escena
Asegúrate de haber guardado tu escena principal como `Assets/Scenes/MainScene.unity`.

## 2. Configuración de XR
1. Ve a **Edit > Project Settings > XR Plug-in Management**.
2. Instala los paquetes si no lo has hecho.
3. En la pestaña de **Android**, marca **ARCore**.
4. En la pestaña de **iOS**, marca **ARKit**.

## 3. Compilación Automática (Scripted Build)
He incluido un script en `Assets/Editor/BuildScript.cs` que permite compilar el proyecto desde el menú superior de Unity:
- **Build > Build Android**: Generará un archivo `.apk` en la carpeta `Builds/Android/`.
- **Build > Build iOS**: Generará el proyecto de Xcode en la carpeta `Builds/iOS/`.

### Compilación por Línea de Comandos (CLI)
Si deseas automatizar el despliegue (CI/CD), puedes usar los siguientes comandos desde la terminal (ajusta la ruta a tu Unity.exe):

**Para Android:**
```powershell
& "C:\Program Files\Unity\Hub\Editor\<VERSION>\Editor\Unity.exe" -quit -batchmode -executeMethod BuildScript.PerformAndroidBuild -logFile build_android.log
```

**Para iOS:**
```powershell
& "C:\Program Files\Unity\Hub\Editor\<VERSION>\Editor\Unity.exe" -quit -batchmode -executeMethod BuildScript.PerformIOSBuild -logFile build_ios.log
```

## 4. Despliegue en Dispositivo

### Android
1. Conecta tu teléfono por USB.
2. Habilita las **Opciones de Desarrollador** y la **Depuración USB**.
3. Instala el APK generado:
   ```powershell
   adb install Builds/Android/AR_Game.apk
   ```

### iOS
1. Abre el proyecto generado en `Builds/iOS` con **Xcode**.
2. Selecciona tu equipo de desarrollo (Signing & Capabilities).
3. Conecta tu iPhone y presiona **Run**.

## 5. Pruebas de Red (Sharing View)
Para que la función de compartir vista funcione:
1. Ambos dispositivos deben estar en la **misma red Wi-Fi**.
2. Identifica la IP del dispositivo receptor.
3. En el dispositivo emisor (AR), introduce esa IP en el componente `ARNetworkManager`.
4. Asegúrate de que el firewall no bloquee el puerto **11000**.

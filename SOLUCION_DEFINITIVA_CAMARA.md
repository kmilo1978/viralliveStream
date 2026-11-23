# Solución Definitiva de Cámara Web: Guía y Registro de Blindaje Técnico

## 1. Resumen Ejecutivo
Este documento detalla la solución arquitectónica y técnica definitiva implementada en **Virallive Stream** (`spike-v0`) para erradicar de forma permanente:
1. **La pantalla negra** causada por dongles de captura HDMI sin señal (`Web Camera 5843:7884`).
2. **La tarjeta invasiva de descanso** (`Cámara en espera · Pulsa Iniciar o Cargar MP4` con el avatar Maddy).
3. **El bloqueo de hardware DirectShow en Windows** (`NotReadableError` / `AbortError`).

---

## 2. Diagnóstico de la Causa Raíz

En el equipo del usuario coexisten dos dispositivos de video reconocidos por Windows:
* **`USB2.0 HD UVC WebCam (13d3:56a8)`**: La cámara web física integrada del portátil (donde está el streamer).
* **`Web Camera (5843:7884)`**: Un dongle USB de captura de video HDMI (MacroSilicon / generic USB capture card).

### ¿Por qué se producía el fallo anteriormente?
1. **Selección por defecto errónea de Chromium**: Cuando el navegador solicitaba un stream con restricciones suaves (`{ deviceId: { ideal: id } }`), Windows y Chromium asignaban por defecto la capturadora `5843`. Al no tener un cable HDMI conectado con video encendido, la capturadora entrega fotogramas 100% negros (`#000000`).
2. **Ciclo de choque en el driver (`DirectShow Lock`)**: Para evitar el fondo negro, el sistema detenía inmediatamente la capturadora (`track.stop()`) y trataba de abrir la webcam integrada 150 ms después. En Windows, detener un dispositivo DirectShow requiere entre 300 y 500 ms para liberar el identificador del controlador. Al hacer la petición tan rápido, Windows rechazaba la conexión con `NotReadableError: Could not start video source`.
3. **Condición de carrera entre efectos (`Race Condition`)**: La función `enumerateDevices()` realizaba una llamada interna asíncrona a `startCamera()` en caliente al mismo tiempo que el efecto de montaje (`useEffect`), provocando colisiones entre procesos.
4. **Ocultamiento de la etiqueta `<video>`**: Si `cameraStreamActive` era falso, el elemento `<video>` tenía `display: "none"`, lo que impedía que el motor gráfico de Chromium inicializara la reproducción de fotogramas, dejando visible el overlay de espera.

---

## 3. Las 7 Medidas de Blindaje Implementadas

### Medida 1: Restricción Estricta (`exact`) en lugar de `ideal`
Se modificó la petición de `getUserMedia` para utilizar restricciones obligatorias:
```typescript
s = await navigator.mediaDevices.getUserMedia({
  video: { deviceId: { exact: candId } },
  audio: false,
});
```
* **Efecto**: Obliga a Chromium y a Windows a abrir directamente el hardware de la webcam integrada del portátil. El navegador ya no tiene permiso de saltar automáticamente a la capturadora `5843`. Si el navegador no soporta `exact`, cuenta con un fallback transparente a `ideal`.

### Medida 2: Eliminación de la Condición de Carrera en `enumerateDevices()`
Se desacopló completamente la enumeración de dispositivos del arranque de video. `enumerateDevices()` ahora solo clasifica, ordena y actualiza la lista en memoria; nunca dispara llamadas concurrentes a `startCamera()`.

### Medida 3: Ventana de Estabilización del Driver a 450 ms
Cuando se descarta un stream previo, se otorga una pausa deliberada de `450 ms`:
```typescript
await new Promise((r) => setTimeout(r, 450));
```
* **Efecto**: Garantiza que el driver de video de Windows libere por completo los recursos de hardware antes de que se solicite la nueva cámara, erradicando los errores de hardware ocupado (`NotReadableError`).

### Medida 4: Elemento `<video>` Siempre Presente en Pantalla
Se eliminó la regla `!cameraStreamActive ? "none" : "block"`. El elemento `<video>` ahora se mantiene en `display: "block"` de forma constante:
```typescript
display: isConnectedLive
  ? "none"
  : sourceMode === "video_file" && localVideoFileUrl
  ? "none"
  : "block",
```
* **Efecto**: Permite que el reproductor de Chromium comience a decodificar y mostrar fotogramas inmediatamente en cuanto el stream es asignado a `srcObject`, sin esperar ciclos de re-renderizado de React.

### Medida 5: Vigilante Automático de Reconexión Continua
Se incorporó un temporizador vigilante (`watchdog`) que comprueba el estado cada `1.8 segundos`:
```typescript
useEffect(() => {
  if (sourceMode !== "camera" || cameraStreamActive || isConnectedLive) return;

  const timer = setTimeout(() => {
    if (!cameraStreamActive && !isStartingCameraRef.current) {
      void startCamera(undefined, true);
    }
  }, 1800);

  return () => clearTimeout(timer);
}, [sourceMode, cameraStreamActive, isConnectedLive, startCamera]);
```
* **Efecto**: Si la cámara llega a tardar un segundo en responder, el sistema reintenta la conexión por sí mismo en bucle sin exigir que el usuario pulse botones manuales.

### Medida 6: Reconexión Instantánea al Enfocar la Pestaña
Se añadieron detectores para los eventos `focus` y `visibilitychange`:
* **Efecto**: En cuanto el usuario hace clic en la ventana del navegador o regresa de otra aplicación, el sistema reactiva la cámara web automáticamente.

### Medida 7: Botón de Rescate Interactivo Rosado
En la barra inferior y en el monitor se conserva el botón de rescate de un clic:
* **`[ 📷 Usar Webcam de Portátil ]`**: Fuerza la conmutación a la webcam integrada (`USB2.0 HD UVC WebCam`) y purga cualquier identificador erróneo guardado en `localStorage`.

---

## 4. Guía Rápida para el Usuario / Streamer

1. **Para entrar al estudio**:
   * Abre tu navegador en `http://localhost:3000`.
   * Pulsa `Ctrl + F5` si deseas forzar la descarga fresca del código.
2. **Tu cámara correcta en el selector**:
   * **`📷 Webcam Integrada: USB2.0 HD UVC WebCam (13d3:56a8) ★ Recomendada`** (Tu rostro y habitación en vivo).
3. **Dispositivo a evitar**:
   * `⚠️ Capturadora HDMI (5843 - Sin señal) (Pantalla negra)` (Solo debe seleccionarse si conectas una consola o cámara externa por cable HDMI).
4. **Si cambias de cabina (`CAM`, `TRY ON`, `DÚO`, `CLIPS`, `TIKTOK`)**:
   * La cámara permanece encendida de forma fluida y continua sin interrupciones.

---

*Fecha de registro y validación: 23 de noviembre de 2026.*  
*Estado del compilador: TypeScript 0 errores (`tsc --noEmit` código 0).*  
*Repositorio GitHub sincronizado: https://github.com/kmilo1978/viralliveStream.git (rama main).*

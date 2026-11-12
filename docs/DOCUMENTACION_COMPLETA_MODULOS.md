# 📖 MANUAL COMPLETO DE MÓDULOS Y FUNCIONALIDADES
## Plataforma de Streaming en Vivo Profesional (MiPlataformaStream / Delulu Stream)

Bienvenido a la documentación oficial y exhaustiva de **MiPlataformaStream**. Esta guía describe a profundidad la arquitectura, componentes, opciones de configuración, casos de uso y solución de problemas para cada uno de los módulos de la cabina de transmisión.

---

## Índice de Módulos

1. [Cabina Central CAM & Monitor Principal](#1-cabina-central-cam--monitor-principal)
2. [Fondos Virtuales & Chroma Key (Verde #00FF00)](#2-fondos-virtuales--chroma-key-verde-00ff00)
3. [Barra de Grabación Predeterminada & Resoluciones (480p - 4K)](#3-barra-de-grabación-predeterminada--resoluciones-480p---4k)
4. [Live Shopping & Tarjetas de Compra con Código QR](#4-live-shopping--tarjetas-de-compra-con-código-qr)
5. [Logos y Banners Programados en Pantalla con URLs](#5-logos-y-banners-programados-en-pantalla-con-urls)
6. [Teleprompter / Guion en Pantalla (Estilo OneStream Live)](#6-teleprompter--guion-en-pantalla-estilo-onestream-live)
7. [Stream Deck / Botonera de Acciones Personalizadas](#7-stream-deck--botonera-de-acciones-personalizadas)
8. [Multistreaming a 45+ Plataformas Simultáneas](#8-multistreaming-a-45-plataformas-simultáneas)
9. [TikTok Live con Marcas & Formato Vertical 9:16](#9-tiktok-live-con-marcas--formato-vertical-916)
10. [Unified Live Chat (Logos Oficiales & Google Sheets)](#10-unified-live-chat-logos-oficiales--google-sheets)
11. [Playlist Streaming (Transmisión Continua 24/7)](#11-playlist-streaming-transmisión-continua-247)
12. [Schedule or Go Live (Programador & Botón 1-Clic)](#12-schedule-or-go-live-programador--botón-1-clic)
13. [Probador Virtual Try-On en Tiempo Real (lucy-vton-3.6)](#13-probador-virtual-try-on-en-tiempo-real-lucy-vton-36)
14. [Voice Finance & Cambiador de Voz](#14-voice-finance--cambiador-de-voz)
15. [Skins Studio & Generador de Personajes con IA](#15-skins-studio--generador-de-personajes-con-ia)
16. [OBS Studio WebSockets & Sistema de Alertas](#16-obs-studio-websockets--sistema-de-alertas)

---

## 1. Cabina Central CAM & Monitor Principal

### ¿Qué es?
Es el corazón operativo de la transmisión. Controla la captura de video en vivo (cámara web o archivo pregrabado MP4/WebM en bucle), la relación de aspecto, el recorte, la sincronización de audio y el procesamiento en tiempo real con Decart AI.

### ¿Para qué sirve?
- Permite alternar entre **Cámara Web** y **Video MP4** de respaldo para emitir sin estar frente al lente.
- Proporciona modo espejo horizontal (`🪞`), pantalla dividida (`[ | ]`) para comparar entrada vs salida, y selector de aspecto (`16:9`, `9:16`, `1:1`, `4:3`).
- Incorpora un **Vúmetro de Audio (0-100%)** con respuesta en vivo para evitar sobremodulación del micrófono.
- Ofrece el **Modo Streamer Seguro (`STREAMER MODE`)** que censura automáticamente en pantalla los tokens de conexión, URLs privadas y costos por segundo.
- **Barra Maestra de Capas (`screen-layers-master-bar`)**: Regula y vigila que no existan más de 3 elementos superpuestos al tiempo en pantalla, ofreciendo switches directos para encender o apagar Fondo, Shopping, Banners, Prompter y Botones sin saturar al espectador.

---

## 2. Fondos Virtuales & Chroma Key (Verde #00FF00)

### ¿Qué es?
Un motor de escenografía virtual que reemplaza el fondo del streamer en vivo con imágenes fotográficas de ultra alta definición, fondos en bucle o un panel verde sólido (`#00FF00`) para recorte croma.

### ¿Para qué sirve?
- **Fondo Verde por Defecto**: Tanto en CAM como en el Probador Virtual, el fondo activo por defecto es `Chroma Key (Verde)`. Esto permite aislar la silueta del presentador en OBS Studio o en el software de transmisión sin gastar créditos de inteligencia artificial en standby.
- **Previsualización con Cero Créditos (0 CR)**: La previsualización de fondos se ejecuta en el navegador del cliente sin llamar a APIs externas pagadas.
- **Catálogo Integrado**: Escenarios realistas preconfigurados (Oficina Moderna, Estudio Cyberpunk Neón, Biblioteca Clásica, Playa Tropical, Espacio Profundo, Fondo Video Bucle).
- **Subida de Fondos Propios**: Carga de imágenes (`JPG`, `PNG`, `WebP`) o videos de fondo (`MP4`) desde el disco local.
- **Persistencia**: Permite marcar cualquier fondo con `⭐ Poner por Defecto` para que se recuerde automáticamente en cada sesión.

---

## 3. Barra de Grabación Predeterminada & Resoluciones (480p - 4K)

### ¿Qué es?
Una barra de herramientas fija y predeterminada (`studio-recording-bar`) situada permanentemente encima del Dock de navegación de CAM, permitiendo iniciar y detener grabaciones locales de video en cualquier instante.

### ¿Para qué sirve?
- Graba todo el contenido emitido en cabina (video, banners, fondos, tarjetas QR y subtítulos) directamente en el disco duro del streamer.
- **Resoluciones seleccionables**:
  - `480p` (SD, 1.5 Mbps) - Ideal para clips rápidos o conexiones modestas.
  - `720p` (HD, 3.5 Mbps) - Estándar equilibrado para directos.
  - `1080p` (Full HD, 7.0 Mbps) - Alta nitidez para grabaciones maestras.
  - `4K` (Ultra HD, 16.0 Mbps) - Máxima calidad profesional.
- **Indicador REC parpadeante** y cronómetro en vivo de duración (`00:00`).
- **MediaRecorder WebM/VP9**: Codificación nativa en el navegador, 100% libre de marcas de agua o límites artificiales.
- Al pulsar `⏹ Detener`, el archivo `grabacion_stream_*.webm` se descarga de forma instantánea a la carpeta de descargas del equipo.

---

## 4. Live Shopping & Tarjetas de Compra con Código QR

### ¿Qué es?
Un sistema de comercio en vivo inspirado en OneStream Live y TikTok Shop que permite a los espectadores comprar productos escaneando un código QR directamente desde la pantalla del stream.

### ¿Para qué sirve?
- Muestra tarjetas de producto flotantes en el escenario con:
  - Imagen del producto con contención estricta (`56x56 px` en el dock y `72x72 px` en la tarjeta flotante, evitando que las fotos gigantes se estallen o desborden).
  - Título y subtítulo del artículo.
  - Precio actual en moneda elegida (`USD`, `EUR`, `MXN`, `GBP`, `COP`) y precio comparativo tachado.
  - **Código QR dinámico** generado en tiempo real con la URL de compra.
- Posicionamiento configurable: Abajo al Centro (`bottom-center`), Abajo a la Izquierda (`bottom-left`) o Abajo a la Derecha (`bottom-right`).
- Catálogo de productos en el Dock con switch individual `👁️ EN PANTALLA` y modal para añadir nuevos productos al instante.

---

## 5. Logos y Banners Programados en Pantalla con URLs

### ¿Qué es?
Un administrador de publicidad y elementos de identidad visual que despliega logotipos, avisos patrocinados y cintillos sobre la transmisión.

### ¿Para qué sirve?
- Permite subir imágenes PNG transparentes de patrocinadores, redes sociales o logos de canal.
- **Modos de Visualización**:
  - *Fijo Permanente*: Permanece visible durante toda la transmisión.
  - *Cíclico Programado*: Aparece cada `X` segundos durante `Y` segundos (ej. aparecer 10 segundos cada 30 segundos).
- **Animaciones configurables**: Deslizamiento (`slide`), Desvanecimiento (`fade`), Rebote (`bounce`) y Zoom (`zoom`).
- **Banners con URLs Ejecutables**: Al hacer clic sobre el banner en pantalla, se abre la URL del anunciante en una nueva pestaña.
- **Texto Copiable con 1 Clic**: Si el banner incluye un código promocional (ej. `DESCUENTO20`), el streamer o espectador puede pulsar `📋 Copiar` para copiar el cupón al portapapeles.

---

## 6. Teleprompter / Guion en Pantalla (Estilo OneStream Live)

### ¿Qué es?
Un apuntador de guion digital semi-transparente que se proyecta sobre el monitor de la cabina.

### ¿Para qué sirve?
- Permite al presentador leer notas, discursos o guiones comerciales sin apartar la mirada de la cámara web.
- **Solo visible en la cabina del streamer**, sin transmitirse a la audiencia final.
- Control de velocidad de desplazamiento continuo (niveles 1 a 5).
- Botones de Pausa, Reanudar y Reiniciar al inicio.
- Campo de edición de texto en vivo para añadir puntos clave sobre la marcha.

---

## 7. Stream Deck / Botonera de Acciones Personalizadas

### ¿Qué es?
Una botonera virtual interactiva de macros y controles rápidos.

### ¿Para qué sirve?
- Permite crear botones con iconos emoji o imágenes PNG personalizadas, etiquetas de texto y colores temáticos.
- Tamaños configurables: Pequeño (`sm`), Mediano (`md`), Grande (`lg`).
- Ubicación flexible: en la barra inferior de controles (`deck`) o flotante en el monitor de video (`screen`).
- Dispara acciones como cambio de prompts de IA, cambio de vestuario, activación de efectos de sonido o alertas de OBS.

---

## 8. Multistreaming a 45+ Plataformas Simultáneas

### ¿Qué es?
Un motor de multidifusión que distribuye la señal de video a múltiples plataformas sociales en paralelo.

### ¿Para qué sirve?
- Conexión con 45+ redes: YouTube Live, Facebook Live, TikTok Live, Twitch, Instagram Live, Kick, LinkedIn Live, Twitter/X, Restream, Trovo y servidores RTMP personalizados.
- Contador de audiencia total agregada en vivo en la esquina superior (`LIVE · 18.5K`).
- Gestión de claves de transmisión (`Stream Keys`) y URLs de ingesta RTMP con almacenamiento cifrado local.

---

## 9. TikTok Live con Marcas & Formato Vertical 9:16

### ¿Qué es?
Un estudio vertical dedicado a transmisiones de alto impacto en TikTok, Instagram Reels y YouTube Shorts.

### ¿Para qué sirve?
- **Simulador de Smartphone 9:16**: Marco realista estilo iPhone con Dynamic Island, badge LIVE, reacciones flotantes animadas y botón de tienda `🛍️ SHOP`.
- **4 Temas de Marca Profesionales**: Beauty & Skincare, Fitness & High Energy, Music & Club DJ, Travel & Adventure.
- **Fondo Verde Chroma Key por Defecto**: El simulador y la cabina inician con fondo verde `#00FF00` para recorte perfecto de silueta en OBS.
- **Selector de Fondos & Fondo Predeterminado**: Permite cambiar escenarios, subir fotos/videos y guardar el fondo favorito con `⭐ Poner por Defecto`.
- **Botón `🚀 APLICAR MARCO Y FONDO A CABINA CAM`**: Sincroniza el marco 9:16, los textos de marca y el fondo en la cabina central con 1 solo clic.

---

## 10. Unified Live Chat (Logos Oficiales & Google Sheets)

### ¿Qué es?
Un agregador de comentarios de múltiples redes en una sola ventana consolidada, con soporte para importar comentarios desde Google Sheets.

### ¿Para qué sirve?
- **Logotipos Reales Oficiales**: Muestra los logos vectoriales SVG auténticos de TikTok, YouTube, Twitch, Facebook e Instagram en los filtros y en cada mensaje.
- **Filtros por Plataforma y SuperChats**: Permite ver todas las redes o aislar donaciones destacadas.
- **Botón `📌 FIJAR EN PANTALLA`**: Proyecta cualquier comentario como tercio inferior sobre el video del streamer con su logo oficial.
- **Compositor en Vivo**: Permite escribir comentarios de prueba o de moderación seleccionando la red social y montos de donación.
- **Integración con Google Sheets**:
  - Pegado directo de filas copiadas de Google Sheets (`Usuario`, `Mensaje`, `Plataforma`, `Donación`).
  - Subida de archivos CSV/TSV.
  - Botón `📋 Plantilla Google Sheets` para copiar el formato de columnas con un clic.
  - **Auto-Lanzador Secuencial**: Temporizador automático (5s, 8s, 15s, 30s) que publica los comentarios de la hoja periódicamente para simular una audiencia activa y orgánica en el stream.

---

## 11. Playlist Streaming (Transmisión Continua 24/7)

### ¿Qué es?
Un sistema de reproducción automatizada de colas de video pregrabadas.

### ¿Para qué sirve?
- Mantiene canales transmitiendo contenido continuo 24 horas al día, 7 días a la semana sin necesidad de un operador en vivo.
- Contador de duración total de la lista de reproducción.
- Transición automática al siguiente clip al finalizar el actual.
- Interruptor de bucle infinito (`Repetición Continua 24/7`).
- Botón para cargar cualquier clip de la lista en la cabina CAM o iniciar el directo a las 45+ plataformas.

---

## 12. Schedule or Go Live (Programador & Botón 1-Clic)

### ¿Qué es?
Un panel de control de lanzamiento de directos programados y transmisiones espontáneas.

### ¿Para qué sirve?
- **Botón Hero `🔴 GO LIVE NOW`**: Inicia la conexión en vivo y el multistreaming con 1 solo clic.
- **Reloj de Cuenta Regresiva en Vivo**: Muestra días, horas, minutos y segundos exactos hasta el próximo evento programado.
- **Calendario de Eventos**: Permite agendar directos con fecha, hora, título descriptivo y plataformas asignadas.

---

## 13. Probador Virtual Try-On en Tiempo Real (lucy-vton-3.6)

### ¿Qué es?
Un probador de moda inteligente con inteligencia artificial que viste digitalmente al streamer en tiempo real.

### ¿Para qué sirve?
- **Modelo `lucy-vton-3.6`**: Procesa la silueta del presentador y le coloca prendas digitales (chaquetas, vestidos, sudaderas, ropa deportiva).
- **Carrusel de hasta 10 prendas estilo espejo**: Clic en cualquier prenda para probársela al instante.
- **Subida de Prendas Propias**: Admite fotos de ropa de tiendas locales o marcas asociadas.
- **Fondo Verde Chroma Key por Defecto & Escenarios en Vivo**: El monitor dual de salida refleja inmediatamente el fondo seleccionado (Verde `#00FF00`, Oficina, Cyberpunk, etc.).
- **Botonera de Grabación Integrada**: Graba videos de la sesión de prueba en resoluciones de 480p a 4K con descarga automática de archivos WebM.

---

## 14. Voice Finance & Cambiador de Voz

### ¿Qué es?
Un procesador de audio en vivo y monitor de economía de créditos de transmisión.

### ¿Para qué sirve?
- **Cambiador de Voz**: Filtros DSP de audio como Robot, Cyberpunk, Radio Vintage, Voz Grave Masculina, Tono Agudo, Reverb de Estudio y Supresión de Ruido.
- **Calculadora Financiera**: Monitorea el consumo de créditos por segundo de Decart AI, tiempo de sesión transcurrido y saldo disponible.

---

## 15. Skins Studio & Generador de Personajes con IA

### ¿Qué es?
Un taller de creación y personalización de avatares visuales y sustitución de rostros.

### ¿Para qué sirve?
- Permite subir una imagen de referencia (`Reference Image`) para transferir su estilo, rostro o atuendo al streamer.
- Biblioteca de personajes oficiales (Anime, Cyberpunk, Fotorealista, Pintura al Óleo).
- Guardado de combinaciones favoritas como presets reutilizables.

---

## 16. OBS Studio WebSockets & Sistema de Alertas

### ¿Qué es?
Módulo de enlace directo con Open Broadcaster Software (OBS Studio) y eventos en pantalla.

### ¿Para qué sirve?
- Genera enlaces de fuentes de navegador (`Browser Source`) para `/obs-overlay` y `/obs-stage`.
- Sistema de bus de alertas en tiempo real (`alerts-bus.ts`):
  - Alertas de Nuevos Seguidores.
  - Alertas de Suscripciones.
  - Alertas de Donaciones y SuperChats con sonido y animación gráfica.
- Conexión por WebSocket nativo con OBS Studio para cambiar escenas y controlar fuentes remotamente.

---

*Documento generado y mantenido por el equipo de ingeniería de MiPlataformaStream.*

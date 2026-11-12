# 📖 MANUAL COMPLETO DE MÓDULOS Y FUNCIONALIDADES
## Plataforma de Streaming en Vivo Profesional (Viralive / MiPlataformaStream)

Bienvenido a la documentación oficial y exhaustiva de **Viralive (MiPlataformaStream)**. Esta guía describe a profundidad la arquitectura, componentes, opciones de configuración, casos de uso y solución de problemas para cada uno de los módulos de la cabina de transmisión.

---

## Índice de Módulos

1. [Cabina Central CAM & Monitor Principal Panorámico](#1-cabina-central-cam--monitor-principal-panorámico)
2. [Fondos Virtuales & Chroma Key (Verde #00FF00)](#2-fondos-virtuales--chroma-key-verde-00ff00)
3. [Barra de Grabación Predeterminada & Resoluciones (480p - 4K)](#3-barra-de-grabación-predeterminada--resoluciones-480p---4k)
4. [Live Shopping & Tarjetas de Compra con Código QR (Optimizado Móvil 9:16)](#4-live-shopping--tarjetas-de-compra-con-código-qr-optimizado-móvil-916)
5. [Logos y Banners Programados en Pantalla con URLs](#5-logos-y-banners-programados-en-pantalla-con-urls)
6. [Teleprompter / Guion en Pantalla (Estilo OneStream Live)](#6-teleprompter--guion-en-pantalla-estilo-onestream-live)
7. [Stream Deck / Botonera de Acciones Personalizadas](#7-stream-deck--botonera-de-acciones-personalizadas)
8. [Multistreaming a 45+ Plataformas Simultáneas](#8-multistreaming-a-45-plataformas-simultáneas)
9. [TikTok Live con Marcas & Formato Vertical 9:16](#9-tiktok-live-con-marcas--formato-vertical-916)
10. [Unified Live Chat (Logos Oficiales, Switches por Red & Google Sheets)](#10-unified-live-chat-logos-oficiales-switches-por-red--google-sheets)
11. [Playlist Streaming (Transmisión Continua 24/7)](#11-playlist-streaming-transmisión-continua-247)
12. [Schedule or Go Live (Programador & Botón 1-Clic)](#12-schedule-or-go-live-programador--botón-1-clic)
13. [Probador Virtual Try-On en Tiempo Real (lucy-vton-3.6 & Multi-Prendas)](#13-probador-virtual-try-on-en-tiempo-real-lucy-vton-36--multi-prendas)
14. [Voice Finance & Cambiador de Voz](#14-voice-finance--cambiador-de-voz)
15. [Skins Studio & Guardarropa IA (Unificado dentro de CREATE con Dashicons)](#15-skins-studio--guardarropa-ia-unificado-dentro-de-create-con-dashicons)
16. [OBS Studio WebSockets & Sistema de Alertas](#16-obs-studio-websockets--sistema-de-alertas)
17. [Integración Universal de WhatsApp por Defecto (QR, Número y Agente IA)](#17-integración-universal-de-whatsapp-por-defecto-qr-número-y-agente-ia)
18. [Cabina DÚO (Split Screen, Batallas PK & Invitados Co-Host)](#18-cabina-dúo-split-screen-batallas-pk--invitados-co-host)
19. [Transmisión en Zoom, Google Meet, Microsoft Teams y WhatsApp Video](#19-transmisión-en-zoom-google-meet-microsoft-teams-y-whatsapp-video)

---

## 1. Cabina Central CAM & Monitor Principal Panorámico

### ¿Qué es?
Es el centro neurálgico de la transmisión. Controla la captura de video en vivo (cámara web física o archivo pregrabado MP4/WebM en bucle infinito), la relación de aspecto, el recorte, la sincronización de audio y el procesamiento en tiempo real con Decart AI.

### Características Principales:
- **Monitor Panorámico Ampliado (1360px a 1480px)**: Se rediseñó el contenedor de escenario (`.delulu-monitor-container`) para ocupar todo el ancho disponible, eliminando las barras negras laterales en monitores modernos de escritorio, pantallas ultra-wide y resoluciones 2K/4K.
- **Alternancia Cámara Web vs Video MP4**: Permite emitir en vivo o descansar reproduciendo un video de respaldo pregrabado sin cortar la señal del directo.
- **Relaciones de Aspecto Dinámicas**: Selector instantáneo entre `16:9 Panorámico` (YouTube, Twitch, Facebook), `9:16 Vertical` (TikTok, Reels, Shorts), `1:1 Cuadrado` y `4:3 Clásico`.
- **Modo Espejo y Vúmetro de Audio**: Permite voltear horizontalmente la imagen y monitorear el nivel del micrófono en decibelios (0 a 100%) con barra verde/amarilla/roja en tiempo real.
- **Modo Streamer Seguro (`STREAMER MODE`)**: Oculta con 1 clic los tokens de autenticación, URLs privadas de webhook y saldos de créditos para que no se filtren en vivo.
- **Gestor de Capas en Pantalla (`studio-layers-manager-card`)**: Controla las capas activas con un límite inteligente de hasta 4 elementos simultáneos (Fondo Virtual, Shopping QR, Banners, Guion, WhatsApp Live, Chat IA) para evitar saturación visual.
- **Rejilla de Herramientas de Escena Sin Scrollbar**: Barra lateral derecha organizada en cuadrícula simétrica que aloja accesos directos a Fondos, WhatsApp, Shop QR, Banners, Guion, Deck, Chat IA y Grabar.

---

## 2. Fondos Virtuales & Chroma Key (Verde #00FF00)

### ¿Qué es?
Un motor de escenografía virtual que sustituye el fondo físico del streamer con fondos fotográficos de alta definición, videos animados en bucle o un panel verde sólido (`#00FF00`) para recorte croma.

### ¿Para qué sirve?
- **Fondo Verde por Defecto**: Inicia automáticamente con `Chroma Key (Verde)` tanto en CAM como en TRY ON para facilitar el aislamiento de silueta en OBS Studio sin consumir créditos de IA.
- **Previsualización con Cero Créditos (0 CR)**: Se ejecuta en el cliente local sin coste por segundo.
- **Catálogo de Escenarios**: Oficina Ejecutiva, Penthouse Moderno, Estudio Neón Cyberpunk, Biblioteca Clásica, Playa Tropical y Espacio Profundo.
- **Carga de Fondos Propios**: Admite fotos (`JPG`, `PNG`, `WebP`) y videos en bucle (`MP4`).
- **Persistencia**: Marca con `⭐ Poner por Defecto` para recordar tu escenario favorito en cada transmisión.

---

## 3. Barra de Grabación Predeterminada & Resoluciones (480p - 4K)

### ¿Qué es?
Un módulo de grabación local nativo en el navegador (`studio-recording-bar`) accesible permanentemente desde la barra lateral derecha.

### ¿Para qué sirve?
- Graba todo lo que se ve en el monitor central (video, capas, banners, tarjetas de producto, WhatsApp y subtítulos) directamente en el disco duro del usuario.
- **Resoluciones Seleccionables**:
  - `480p` (SD, 1.5 Mbps) - Ideal para clips rápidos o conexiones ligeras.
  - `720p` (HD, 3.5 Mbps) - Estándar equilibrado para streaming.
  - `1080p` (Full HD, 7.0 Mbps) - Alta fidelidad para masters de YouTube.
  - `4K` (Ultra HD, 16.0 Mbps) - Máxima calidad profesional.
- **Cronómetro e Indicador REC**: Muestra parpadeo rojo y tiempo transcurrido en minutos y segundos (`00:00`).
- **Descarga Inmediata**: Al detener la grabación, se descarga automáticamente un archivo `grabacion_stream_*.webm` codificado en VP9/Opus sin marcas de agua.

---

## 4. Live Shopping & Tarjetas de Compra con Código QR (Optimizado Móvil 9:16)

### ¿Qué es?
Un sistema de compras en vivo inspirado en TikTok Shop y OneStream Live que proyecta tarjetas de producto flotantes con códigos QR escaneables en pantalla.

### Novedades y Optimización Móvil 9:16:
- **Rediseño Estilo TikTok Shop Pin**: En formato vertical (móvil 9:16), la tarjeta se transforma en un chip compacto de cristal oscuro (`rgba(14, 14, 24, 0.94)`) ubicado a la izquierda (`left: 10px; bottom: 242px`).
- **Cero Colisiones Visuales**: No tapa los comentarios de chat, deja completamente libre la columna derecha de corazones flotantes (`real-feel-hearts-col`) y respeta el recuadro de la cámara secundaria PiP.
- **Código QR de Alto Contraste**: El QR de compra se renderiza en un recuadro blanco nítido con renderizado por píxeles para lectura instantánea desde cualquier teléfono.
- **Datos del Producto**: Imagen en miniatura contenida (sin desbordamientos), título, precio actual en moneda local (`USD`, `EUR`, `MXN`, `COP`, `GBP`), precio tachado de oferta y botón de compra directa.
- **Selector en Catálogo**: Switch individual `👁️ EN PANTALLA` y modal para agregar o editar productos al instante.

---

## 5. Logos y Banners Programados en Pantalla con URLs

### ¿Qué es?
Un gestor publicitario que proyecta logotipos, banners de patrocinadores y cintillos promocionales sobre la transmisión.

### ¿Para qué sirve?
- **Modos de Despliegue**:
  - *Fijo Permanente*: Siempre en pantalla.
  - *Cíclico Programado*: Aparece cada `X` segundos durante `Y` segundos (ej. mostrarse 10s cada 30s).
- **Animaciones Suaves**: Deslizamiento (`slide`), Desvanecimiento (`fade`), Rebote (`bounce`) y Zoom (`zoom`).
- **URLs Ejecutables**: Al hacer clic en el banner se abre la página web del patrocinador en una nueva pestaña.
- **Cupón Copiable en 1 Clic**: Botón `📋 Copiar` para copiar códigos promocionales (ej. `PROMO2026`) al portapapeles.

---

## 6. Teleprompter / Guion en Pantalla (Estilo OneStream Live)

### ¿Qué es?
Un apuntador digital semitransparente proyectado sobre el monitor de la cabina.

### ¿Para qué sirve?
- Permite leer discursos, fichas técnicas de productos o guiones comerciales mirando fijamente a la cámara.
- **Visible exclusivamente para el streamer** (no se proyecta en la salida pública de OBS ni en las redes).
- Control de desplazamiento continuo ajustable, modo espejo horizontal y editor de texto rápido.

---

## 7. Stream Deck / Botonera de Acciones Personalizadas

### ¿Qué es?
Una botonera virtual interactiva de accesos directos y macros de producción.

### ¿Para qué sirve?
- Botones personalizables con iconos Dashicon o imágenes PNG propias.
- Tamaños: Pequeño (`sm`), Mediano (`md`) o Grande (`lg`).
- Ubicación: En la barra inferior del estudio o flotante en el monitor de video.
- Dispara efectos de sonido, cambios de vestuario, cambios de cámara y alertas en OBS.

---

## 8. Multistreaming a 45+ Plataformas Simultáneas

### ¿Qué es?
Un motor de emisión multidestino que retransmite la señal a múltiples plataformas sociales al mismo tiempo.

### ¿Para qué sirve?
- Conexión oficial a: YouTube Live, Facebook Live, TikTok Live, Twitch, Instagram Live, Kick, LinkedIn Live, Twitter/X, Restream y servidores RTMP personalizados.
- Contador de audiencia total agregada en vivo en la parte superior (`LIVE · 33.6K`).
- Gestión cifrada y segura de claves de transmisión (`Stream Keys`) en almacenamiento local.

---

## 9. TikTok Live con Marcas & Formato Vertical 9:16

### ¿Qué es?
Un estudio vertical optimizado para transmisiones en TikTok, Instagram Reels y YouTube Shorts.

### ¿Para qué sirve?
- **Marco de Smartphone Realista**: Estilo iPhone con Dynamic Island, badge LIVE, reacciones flotantes animadas y muelle inferior de herramientas.
- **4 Temas de Marca Profesionales**: Beauty & Skincare, Fitness & High Energy, Music & Club DJ, Travel & Adventure.
- **Sincronización en 1 Clic**: Botón `🚀 APLICAR MARCO Y FONDO A CABINA CAM` para llevar la configuración a la cabina principal de inmediato.

---

## 10. Unified Live Chat (Logos Oficiales, Switches por Red & Google Sheets)

### ¿Qué es?
Un agregador universal de comentarios y chat en vivo que unifica la conversación de múltiples redes en una sola ventana.

### ¿Para qué sirve?
- **Logotipos Oficiales SVG**: Muestra los logos auténticos de TikTok, YouTube, Twitch, Facebook e Instagram.
- **Switches de Activación Individual**: Filtra o silencia canales sociales específicos en tiempo real.
- **Fijar Comentarios en Pantalla**: Botón `📌 FIJAR` que proyecta el mensaje como tercio inferior en el directo con su red social y donación.
- **Integración con Google Sheets**:
  - Pegado de comentarios o carga de archivos CSV/TSV.
  - Botón `📋 Plantilla Google Sheets` para copiar las columnas requeridas.
  - **Auto-Lanzador Secuencial**: Dispara mensajes periódicos cada 5s, 8s, 15s o 30s para dinamizar el stream.

---

## 11. Playlist Streaming (Transmisión Continua 24/7)

### ¿Qué es?
Un gestor automatizado de listas de reproducción de video para emisiones desatendidas.

### ¿Para qué sirve?
- Emite bucles de videos pregrabados 24 horas al día, 7 días a la semana sin necesidad de operador presente.
- Transición automática entre clips y repetición infinita.
- Envío directo de la lista a la cabina CAM o a multistreaming.

---

## 12. Schedule or Go Live (Programador & Botón 1-Clic)

### ¿Qué es?
El centro de control de lanzamientos en vivo y calendario de eventos futuros.

### ¿Para qué sirve?
- **Botón Hero `🔴 GO LIVE NOW`**: Conexión inmediata a todas las redes activadas.
- **Reloj de Cuenta Regresiva**: Días, horas, minutos y segundos exactos para el próximo evento agendado.
- **Calendario Integrado**: Organización de transmisiones con fecha, hora, título y destinos.

---

## 13. Probador Virtual Try-On en Tiempo Real (lucy-vton-3.6 & Multi-Prendas)

### ¿Qué es?
Un probador de moda digital con IA que viste al presentador en tiempo real con prendas digitales.

### ¿Para qué sirve?
- **Motor `lucy-vton-3.6`**: Procesa la silueta humana y ajusta prendas con caída y textura realista.
- **Carrusel de Prendas**: Galería estilo espejo para seleccionar chaquetas, vestidos, sudaderas o trajes formales con 1 clic.
- **Programación de Subida Multi-Prendas con Banners**:
  - Permite subir tandas de prendas asociadas a banners promocionales sincronizados.
  - Cada prenda puede ir acompañada de su título, precio, código de descuento y banner correspondiente.
- **Grabación Integrada en Resoluciones 480p a 4K**: Registra las sesiones de prueba con descarga WebM inmediata.

---

## 14. Voice Finance & Cambiador de Voz

### ¿Qué es?
Un procesador de modulación de voz en vivo y monitor de costos de infraestructura.

### ¿Para qué sirve?
- **Cambiador de Voz DSP**: Filtros como Robot, Cyberpunk, Radio Vintage, Voz Grave Masculina, Voz Femenina, Reverb y Cancelación de Ruido.
- **Calculadora Financiera**: Auditoría en vivo de créditos por segundo de IA y alertas de límite de saldo.

---

## 15. Skins Studio & Guardarropa IA (Unificado dentro de CREATE con Dashicons)

### ¿Qué es?
El laboratorio de creación, personalización y almacenamiento de avatares, rostros y atuendos con inteligencia artificial.

### Reorganización y Diseño Consistente:
- **Unificación en `CREATE`**: Para eliminar duplicaciones confusas en el menú, el Gestor de Skins, el Guardarropa IA y los Accesorios ahora residen de forma ordenada dentro de la sección `CREATE`.
- **Línea de Iconos Consistente (`Dashicons`)**: Se homologaron los iconos de todo el módulo utilizando la librería oficial de Dashicons SVG (sin emojis desalineados ni iconos rotos).
- **Biblioteca de Estilos**: Anime, Cyberpunk, Fotorealista, Pintura al Óleo, Escultura Clásica y Personajes Fantásticos.
- **Guardado y Exportación**: Presets reutilizables almacenados en `localStorage` con exportación en JSON.

---

## 16. OBS Studio WebSockets & Sistema de Alertas

### ¿Qué es?
El puente de comunicación bidireccional entre la plataforma web y Open Broadcaster Software (OBS Studio).

### ¿Para qué sirve?
- Enlaces de fuentes de navegador: `/obs-overlay` (solo capas y gráficos) y `/obs-stage` (escenario completo).
- **Sistema de Alertas en Tiempo Real (`alerts-bus.ts`)**: Notificaciones gráficas y sonoras de nuevos seguidores, suscripciones, donaciones y SuperChats.
- Conexión WebSocket para cambiar de escena o conmutar fuentes en OBS automáticamente.

---

## 17. Integración Universal de WhatsApp por Defecto (QR, Número y Agente IA)

### ¿Qué es?
Un módulo universal de atención y conversión comercial vía WhatsApp integrado **por defecto** en las 3 cabinas de transmisión: **`CAM`**, **`TRY ON`** y **`DÚO`**.

### Las 3 Modalidades de Integración:

1. **Por Número Telefónico**:
   - Ingreso del número internacional con código de país (ej. `+1 (555) 234-5678`).
   - Mensaje inicial predeterminado editable (ej. *"¡Hola! Vi la transmisión en vivo y quiero información de los productos"*).
   - Generación automática del enlace oficial `https://wa.me/NUMERO?text=MENSAJE` con botones para **Copiar Enlace** o **Probar Chat**.

2. **Por Código QR en Pantalla**:
   - Generación instantánea de un código QR nítido y de alto contraste vinculado al chat oficial.
   - Proyección flotante en el monitor de video de la cabina.
   - Botón para **Descargar QR en formato PNG** de alta resolución para usar en afiches o folletos.
   - Interruptor directo `EN PANTALLA: ON / OFF`.

3. **Por API y Agente IA de Ventas 24/7**:
   - Compatible con Webhooks HTTP (n8n, Make), Evolution API y Meta Cloud API oficial.
   - Switch de **Auto-responder con Agente IA** para atender consultas de clientes automáticamente.
   - **System Prompt de Ventas Personalizable**: Instrucciones del agente (personalidad, lista de productos, precios y llamadas a la acción).
   - **Simulador Interactivo de Prueba**: Caja de chat dentro del panel para enviar preguntas simuladas como cliente y verificar las respuestas del Agente IA antes de salir al aire.

### Proyección en Pantalla & Responsive Móvil 9:16:
- **En Escritorio (16:9 y Panorámico)**: Badge flotante en la esquina inferior izquierda con logo oficial, indicador de `IA`, número de teléfono y QR escaneable.
- **En Móvil (9:16 Smartphone)**: Ubicado en la parte izquierda (`left: 10px; bottom: 310px`), apilado armoniosamente arriba de la tarjeta de Shop QR. No choca con los corazones flotantes, no tapa los comentarios de chat y no interfiere con la cámara secundaria PiP.

---

## 18. Cabina DÚO (Split Screen, Batallas PK & Invitados Co-Host)

### ¿Qué es?
La cabina especializada en transmisiones compartidas con invitados en vivo o pregrabados, entrevistas, colaboraciones y batallas PK.

### Características Principales:
- **Modos de Pantalla Dividida**:
  - `Vertical 50/50`: Pantalla dividida mitad superior / mitad inferior (ideal para batallas PK en formato TikTok).
  - `Lado a Lado (Horizontal)`: Distribución 50% izquierda / 50% derecha para entrevistas y podcasts.
  - `Flotante PiP`: El invitado aparece en una ventana secundaria en la esquina con borde personalizable.
- **Catálogo de Invitados Co-Host**: Presets interactivos listos para usar (Cristiano Ronaldo, Mia, Alex Rivera, Sofia Martínez).
- **Diálogos Interactivos Sincronizados**: Rótulos de diálogo con cambio automático (temporizador de 14s) o manual con botones de navegación.
- **Fuentes Mixtas**: Permite combinar streamer en vivo + invitado MP4, streamer MP4 + invitado en vivo, o ambos en video pregrabado.
- **Herramientas de Estudio Compartidas**: La cabina DÚO cuenta con acceso directo a Fondos Virtuales, WhatsApp Live, Shop QR, Banners y Chat IA.

---

## 19. Transmisión en Zoom, Google Meet, Microsoft Teams y WhatsApp Video

### ¿Qué es?
La capacidad de utilizar la cabina de streaming de Virallive como cámara web virtual de alta definición para videollamadas corporativas, reuniones de equipo, webinars y clases virtuales.

### Procedimiento de Conexión en 3 Pasos:
1. **Paso 1: Abrir el Escenario Web en OBS**:
   - En OBS Studio, añade una nueva fuente de tipo `Navegador` (`Browser Source`).
   - Pega la URL del escenario de la plataforma: `http://localhost:3000/obs-stage` (o tu dominio de producción).
   - Configura la resolución en `1920x1080` (o `1280x720`) a 30 o 60 FPS.
2. **Paso 2: Iniciar la Cámara Virtual de OBS**:
   - En el panel inferior derecho de controles de OBS Studio, haz clic en el botón **`Iniciar Cámara Virtual`** (`Start Virtual Camera`).
3. **Paso 3: Seleccionar en tu Aplicación de Videollamada**:
   - Abre **Zoom**, **Google Meet**, **Microsoft Teams** o **WhatsApp Web / Desktop**.
   - En la configuración de video/cámara, selecciona como dispositivo de entrada: **`OBS Virtual Camera`**.
   - ¡Listo! Todo lo que hagas en tu cabina (avatares IA, probador de ropa, fondos chroma, banners, WhatsApp QR y tarjetas de shopping) se transmitirá con total fluidez en tu videollamada sin instalar controladores externos complicados.

---

*Documentación oficial generada y actualizada para la versión V1 Spike de Virallive / MiPlataformaStream.*

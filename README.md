# 🚀 Virallive (MiPlataformaStream)
## Cabina de Streaming Profesional en Vivo con Inteligencia Artificial

Plataforma de última generación para creadores de contenido, streamers, marcas de moda y transmisiones de live-commerce. Combina procesamiento de video en tiempo real, probador virtual de ropa con IA, avatares generativos, comercio interactivo con códigos QR y difusión simultánea a más de 45 redes sociales.

---

## 🌟 Características Principales

### 1. Cabina Central CAM & Motores de IA (Decart, DeepFaceLive y Deep-Live-Cam)
* **Selector de Motor en Vivo**: Alterna entre la nube de **Decart AI** y motores de Face Swap locales (**DeepFaceLive** y **Deep-Live-Cam**) con **0 créditos** de consumo y latencia de 15-35ms.
* **DeepFaceLive API**: Soporte para modelos DFM preentrenados (`.dfm`) con aceleración DirectML y CUDA.
* **Deep-Live-Cam API**: Intercambio facial en directo a partir de una sola foto de referencia (InsightFace) con restaurador facial **GFPGAN v1.4** y **CodeFormer**.
* **Escenario Ampliado (1360px - 1480px)**: Aprovechamiento completo del ancho de pantalla sin barras negras laterales en monitores modernos 16:9, ultra-wide y pantallas 2K/4K.
* **Alternancia en 1 Clic**: Emisión en vivo desde cámara web física o reproducción de videos de respaldo pregrabados (MP4/WebM) en bucle.
* **Vúmetro de Audio & Modo Espejo**: Monitoreo visual de decibelios del micrófono y control de recorte en aspectos `16:9`, `9:16`, `1:1` y `4:3`.
* **Modo Streamer Seguro (`STREAMER MODE`)**: Censura automática en pantalla de tokens privados, URLs de servidor y balances de créditos.

### 2. Integración Universal de WhatsApp por Defecto
* **Presente en todas las cabinas**: Integrado y accesible en `CAM`, `TRY ON` y `DÚO`.
* **Modalidad 1: Por Número Directo**: Generación automática de enlace oficial `wa.me/NUMERO` con mensaje inicial predeterminado y botones para copiar o probar.
* **Modalidad 2: Código QR en Pantalla**: Código QR dinámico de alta resolución para escanear en pantalla con descarga en formato `.png`.
* **Modalidad 3: API & Agente IA de Ventas 24/7**: Conexión con Webhooks (n8n/Make), Evolution API o Meta Cloud API, con switch de auto-respuesta, prompt de ventas personalizable y simulador interactivo de pruebas.
* **Badge Flotante Adaptativo**: Optimizado para escritorio 16:9 y formato vertical móvil 9:16 (apilado limpio que no bloquea corazones, chat ni cámara secundaria PiP).

### 3. Cabina DÚO (Split Screen & Co-Host)
* **Pantalla Dividida**: Modos Vertical 50/50 (batallas PK estilo TikTok), Lado a Lado (entrevistas) y Flotante PiP en esquina.
* **Invitados Interactivos**: Catálogo de personajes (Cristiano Ronaldo, Mia, Alex Rivera, Sofia Martínez) con diálogos sincronizados en vivo.
* **Mezcla de Fuentes**: Combina presentador en vivo + invitado MP4, o viceversa, con sincronización de audio.

### 4. Probador Virtual de Ropa Try-On en Tiempo Real
* **Modelo `lucy-vton-3.6`**: Adaptación fotorealista de prendas digitales a la silueta del presentador en vivo.
* **Carrusel Estilo Espejo**: Selección rápida de atuendos con un toque.
* **Programación Multi-Prendas con Banners**: Permite subir tandas de prendas asociadas a banners publicitarios sincronizados con enlaces de compra.

### 5. Live Shopping con Código QR (Optimizado 9:16)
* **Diseño TikTok Shop Pin**: Tarjeta compacta de cristal oscuro anclada a la izquierda en vista móvil (`left: 10px; bottom: 242px`) con código QR de alto contraste.
* **Información Completa de Producto**: Imagen miniatura contenida, título, moneda local (`USD`, `EUR`, `MXN`, `COP`, `GBP`), precio actual y precio tachado de oferta.

### 6. Transmisión en Zoom, Meet, Teams y WhatsApp Video
* **Cámara Virtual de OBS**: Convierte la cabina en una webcam virtual HD para videollamadas corporativas y conferencias a través de la ruta `/obs-stage`.

### 7. Multistreaming a 45+ Redes Sociales
* Emisión simultánea a YouTube Live, TikTok Live, Facebook Live, Twitch, Instagram Live, Kick, LinkedIn Live, Twitter/X y RTMP personalizado con contador de audiencia agregada en tiempo real.

### 8. Fondos Virtuales & Chroma Key (#00FF00)
* Fondo verde sólido por defecto en CAM y TRY ON para recorte instantáneo en OBS, más catálogo de escenarios realistas (Oficina, Neón Cyberpunk, Penthouse, Biblioteca) con 0 créditos de costo en previsualización.

### 9. Grabación Local Multiresolución (480p - 4K)
* Grabador nativo en el navegador con selector de calidad (`480p`, `720p HD`, `1080p FHD`, `4K UHD`) y descarga automática de archivos `.webm` sin marcas de agua.

### 10. Unified Live Chat & Google Sheets
* Chat consolidado con logotipos oficiales SVG de TikTok, YouTube, Twitch, Facebook e Instagram, switches individuales por red, opción de fijar comentarios en pantalla y cargador secuencial de comentarios desde hojas de Google Sheets.

### 11. Skins Studio & Guardarropa IA (Unificado en CREATE)
* Centralización de avatares, guardarropa y accesorios dentro de la pestaña `CREATE` con iconografía homogénea basada en `Dashicons`.

---

## 🛠️ Tecnologías Utilizadas

* **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
* **Librería de Interfaz**: [React 19](https://react.dev/)
* **Tipado Estricto**: [TypeScript 5](https://www.typescriptlang.org/)
* **Inteligencia Artificial de Video**: [@decartai/sdk](https://decart.ai/)
* **Motores de Face Swap en Tiempo Real**: DeepFaceLive (DFM DirectML) & Deep-Live-Cam (InsightFace + GFPGAN)
* **Códigos QR Dinámicos**: [qrcode](https://www.npmjs.com/package/qrcode)
* **Iconografía Vectorial**: Dashicons SVG oficiales & Logos SVG auténticos
* **Captura & Grabación**: MediaStream API & MediaRecorder nativo del navegador

---

## 💻 Instalación y Puesta en Marcha

### Prerrequisitos
* Node.js v18.17 o superior (Recomendado v20+ o v24+)
* npm v9 o superior

### Pasos de Instalación

1. **Clonar el repositorio**:
   \`\`\`bash
   git clone https://github.com/kmilo1978/viralliveStream.git
   cd viralliveStream/spike-v0
   \`\`\`

2. **Instalar dependencias**:
   \`\`\`bash
   npm install
   \`\`\`

3. **Iniciar el servidor de desarrollo**:
   \`\`\`bash
   npm run dev
   \`\`\`
   Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver la cabina de transmisión.

4. **Compilación para producción**:
   \`\`\`bash
   npm run build
   npm run start
   \`\`\`

---

## 📂 Estructura del Proyecto

\`\`\`
spike-v0/
├── docs/
│   └── DOCUMENTACION_COMPLETA_MODULOS.md  # Manual exhaustivo de los 19 módulos
├── src/
│   ├── app/
│   │   ├── globals.css                    # Estilos visuales, glassmorphism y responsive
│   │   ├── layout.tsx                     # Layout raíz de Next.js
│   │   ├── page.tsx                       # Orquestador principal de la cabina y estudio
│   │   ├── obs-overlay/                   # Escenario para Browser Source de OBS (capas)
│   │   └── obs-stage/                     # Escenario limpio para OBS Virtual Camera
│   ├── components/
│   │   ├── WhatsAppStudioPanel.tsx        # Panel de control de WhatsApp (QR, número y Agente IA)
│   │   ├── GuestSplitScreenPanel.tsx      # Cabina DÚO y pantalla dividida con co-hosts
│   │   ├── RealFeelLiveChatOverlay.tsx    # Chat flotante y corazones animados estilo TikTok
│   │   ├── UnifiedLiveChatPanel.tsx       # Chat multired con Google Sheets
│   │   ├── TikTokBrandedStudioPanel.tsx   # Simulador vertical para TikTok Live
│   │   ├── SkinsStudioPanel.tsx           # Generador de avatares y skins IA
│   │   ├── StreamConfigModal.tsx          # Modal de configuración de streaming y audiencia
│   │   ├── Dashicons.tsx                  # Librería unificada de iconos SVG
│   │   └── PlatformLogos.tsx              # Logotipos oficiales de redes sociales
│   └── lib/
│       ├── studio-data.ts                 # Modelos de datos, presets y configuración por defecto
│       ├── qr-helper.ts                   # Generador dinámico de códigos QR
│       ├── alerts-bus.ts                  # Bus de alertas y eventos en tiempo real
│       └── video-preprocessor.ts          # Recorte y preprocesamiento de video en canvas
├── DESIGN.md                              # Guía de arquitectura de diseño clean-room
├── ROADMAP_V2_SAAS.md                     # Planificación de la versión SaaS V2
├── NOTAS_ANTIGRAVITY.md                   # Bitácora de validaciones y control de calidad
└── README.md                              # Documentación general del repositorio
\`\`\`

---

## 📚 Documentación Adicional

* [Manual Completo de Módulos (docs/DOCUMENTACION_COMPLETA_MODULOS.md)](docs/DOCUMENTACION_COMPLETA_MODULOS.md)
* [Guía de Diseño Clean-Room (DESIGN.md)](DESIGN.md)
* [Roadmap SaaS V2 (ROADMAP_V2_SAAS.md)](ROADMAP_V2_SAAS.md)
* [Historial de Validaciones (NOTAS_ANTIGRAVITY.md)](NOTAS_ANTIGRAVITY.md)

---

*Desarrollado con dedicación para revolucionar el streaming profesional en vivo.*

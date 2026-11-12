"use client";

import React, { useState, useMemo } from "react";
import { Dashicon, type DashiconName } from "@/components/Dashicons";
import { ViraliveLogo } from "@/components/ViraliveLogo";
import { PlatformLogo, TikTokLogo, YouTubeLogo, TwitchLogo, FacebookLogo, InstagramLogo } from "@/components/PlatformLogos";

export type DocSectionId =
  | "guia_maestra"
  | "cam_stage"
  | "virtual_backgrounds"
  | "recording_suite"
  | "live_shopping"
  | "scheduled_banners"
  | "teleprompter"
  | "stream_deck"
  | "multistream"
  | "tiktok_live"
  | "unified_chat"
  | "playlist_streaming"
  | "schedule_live"
  | "tryon_virtual"
  | "voice_finance"
  | "skins_studio"
  | "obs_alerts"
  | "vcam_videocalls";

interface DocumentationCenterPanelProps {
  onNavigateToTab?: (tab: "CAM" | "TRY_ON" | "DUO" | "EXPLORE" | "CREATE" | "PRO" | "DOCS" | "SETTINGS", proSubTab?: string) => void;
}

interface DocItem {
  id: DocSectionId;
  title: string;
  category: "Cabina CAM" | "Módulos PRO" | "Herramientas de Estudio" | "Integraciones";
  icon: DashiconName;
  shortDesc: string;
  badge?: string;
  targetTab: "CAM" | "TRY_ON" | "DUO" | "PRO" | "CREATE";
  targetProSubTab?: string;
  content: {
    whatIs: string;
    whatIsFor: string;
    howTo: string[];
    technicalDetails: { label: string; value: string }[];
    commonMistakes: { mistake: string; solution: string }[];
  };
}

const DOC_ITEMS: DocItem[] = [
  {
    id: "guia_maestra",
    title: "Guía Completa Paso a Paso (Virallive V1 · Cabina + OBS)",
    category: "Cabina CAM",
    icon: "book",
    badge: "Empieza Aquí",
    targetTab: "CAM",
    shortDesc: "Manual práctico de principio a fin: cómo configurar cámara, estilos IA, Dúo, Clips, TikTok Marcas, Playlist y transmitir hoy vía Cabina + OBS.",
    content: {
      whatIs:
        "Es tu guía rápida oficial para dominar toda la Versión 1 de Virallive (estudio local Cabina + OBS) en pocos minutos, sin necesidad de conocimientos técnicos.",
      whatIsFor:
        "Te muestra el orden exacto para preparar tu escena con IA, personalizar marcas/invitados y sacar la señal en vivo hacia OBS Studio, aclarando además las condiciones reales (*) de TikTok e Instagram y lo que pasa a Versión 2 SaaS.",
      howTo: [
        "Paso 1 — Cabina CAM: Elige tu fuente (Cámara Web o Video pregrabado), prueba los 45 Estilos o 4 Efectos VFX desde la barra izquierda y selecciona tu fondo verde Chroma Key (#00FF00) sin gastar créditos.",
        "Paso 2 — Capas y Chat IA (Columna derecha CAM): Activa hasta 4 capas en pantalla (Fondo, Shop QR, Banners, Chat IA, Deck). Desde arriba manejas Agente IA, comentarios manuales o Google Sheets y auto-respondedor.",
        "Paso 3 — TRY ON, DÚO y CREATE: Usa TRY ON para probador de ropa en vivo; DÚO para pantalla dividida con Perfil de Invitado personalizable (foto, color, verificado y texto); y CREATE (Wardrobe/Accesorios) para diseñar atuendos o ítems nuevos.",
        "Paso 4 — CLIPS y TIKTOK (Menú superior después de DÚO): En CLIPS procesa videos en 6 proporciones (16:9, 9:16, 1:1, 4:5, 4:3, 21:9) y hasta 4K. En TIKTOK sube tu Logo PNG transparente, elige colores RGB personalizados y configura fondos limpios sin nombres en pantalla.",
        "Paso 5 — PRO → Playlist Streaming: Sube tus propios videos, programa fecha/horas, enciende Prelanzamiento (cuenta regresiva) y elige 1 plataforma o MultiLive.",
        "Paso 6 — Salir al Aire hoy (Cabina + OBS) y Condiciones (*): En V1 transmites enviando esta Cabina a OBS Studio (/obs-stage + Cámara Virtual). * Recuerda: TikTok Live exige acceso LIVE Studio/RTMP aprobado (+1.000 seg.) e Instagram Live exige Cuenta Profesional (Live Producer). El MultiStream directo en nube sin OBS y Playlist 24/7 se ejecutarán en Versión 2 SaaS.",
      ],
      technicalDetails: [
        { label: "Modo Operativo V1", value: "Cabina Local + OBS Studio (/obs-stage y /obs-overlay vía WebSockets v5)" },
        { label: "Límite de Capas en CAM", value: "Hasta 4 capas simultáneas visibles para evitar saturar el video" },
        { label: "Condicional TikTok Live *", value: "Solo cuentas con LIVE Studio / clave RTMP oficial aprobada (+1.000 seg.)" },
        { label: "Condicional Instagram Live *", value: "Solo cuentas Profesionales (Creador/Empresa) con clave de Live Producer" },
        { label: "Alcance Versión 2 (V2 SaaS)", value: "MultiStream directo en nube (WebRTC→RTMP), Playlist 24/7 sin PC encendido e integraciones Composio.dev" },
      ],
      commonMistakes: [
        {
          mistake: "Intentar usar MultiStream o MultiLive directamente sin OBS en la Versión 1.",
          solution: "En V1, el MultiStream hacia redes sale conectando la Cabina a OBS Studio (con plugin obs-multi-rtmp). El servidor en nube propio sin OBS llegará en Versión 2 SaaS.",
        },
        {
          mistake: "No encontrar la clave RTMP en una cuenta nueva de TikTok o cuenta personal de Instagram.",
          solution: "Verifica las condiciones (*): TikTok requiere elegibilidad LIVE habilitada y en Instagram debes cambiar primero tu cuenta a Perfil Profesional (Creador o Empresa).",
        },
      ],
    },
  },
  {
    id: "cam_stage",
    title: "Cabina Central CAM & Monitor Principal",
    category: "Cabina CAM",
    icon: "camera",
    badge: "Core",
    targetTab: "CAM",
    shortDesc: "Captura de cámara web o video MP4 en bucle, vúmetro de audio y switches de capas en pantalla.",
    content: {
      whatIs:
        "Es el centro de control de video en vivo de la plataforma. Permite alimentar la transmisión mediante tu cámara web física o utilizando un archivo de video MP4/WebM pregrabado en bucle continuo.",
      whatIsFor:
        "Garantiza que la emisión nunca se caiga. Si debes alejarte de la cámara, puedes cambiar al modo Video MP4 sin cortar la conexión con tus espectadores ni con las plataformas vinculadas.",
      howTo: [
        "En la barra de controles de cabina, selecciona tu fuente en el desplegable: '📹 Cámara Web' o '📼 Video MP4 (Bucle)'.",
        "Si usas Video MP4, pulsa '📂 Cargar MP4' para subir tu clip de respaldo.",
        "Usa el botón '🪞' para activar el modo espejo horizontal y que tus movimientos coincidan con la vista natural.",
        "Usa el botón '[ | ]' para dividir la pantalla entre entrada cruda y salida procesada.",
        "Activa el interruptor 'STREAMER MODE' para ocultar automáticamente claves de stream y saldos de créditos si compartes pantalla.",
        "Revisa la Barra Maestra de Capas: el indicador te avisará si superas el límite de 3 capas activas para no sobrecargar la vista del usuario.",
      ],
      technicalDetails: [
        { label: "Relaciones de Aspecto", value: "16:9 (Horizontal), 9:16 (Vertical TikTok/Reels), 1:1 (Cuadrado), 4:3 (Clásico)" },
        { label: "Formatos de Video Admitidos", value: "MP4 (H.264), WebM (VP8/VP9)" },
        { label: "Medición de Audio", value: "Vúmetro en decibelios normalizados de 0% a 100%" },
        { label: "Límite Recomendado", value: "Máximo 3 capas superpuestas simultáneas" },
      ],
      commonMistakes: [
        {
          mistake: "La cámara no enciende o sale pantalla negra.",
          solution: "Verifica que le diste permiso al navegador para acceder a la cámara y que ninguna otra aplicación (como Zoom u OBS) la tenga bloqueada en uso exclusivo.",
        },
        {
          mistake: "El video pregrabado no se repite al terminar.",
          solution: "El reproductor tiene bucle ('loop') automático activado; asegúrate de que el archivo termine con un fotograma limpio para que la transición sea imperceptible.",
        },
      ],
    },
  },
  {
    id: "virtual_backgrounds",
    title: "Fondos Virtuales & Chroma Key (Verde #00FF00)",
    category: "Cabina CAM",
    icon: "format-gallery",
    badge: "Predeterminado",
    targetTab: "CAM",
    shortDesc: "Fondo verde por defecto para recorte en OBS o cambio por escenarios realistas sin gastar créditos.",
    content: {
      whatIs:
        "Un sistema de reemplazo de fondo que sitúa al streamer sobre un panel verde sólido Chroma Key (#00FF00) o dentro de estudios realistas (oficinas de lujo, sets cyberpunk, bibliotecas o playas).",
      whatIsFor:
        "Permite que cualquier streamer emita con fondo verde predeterminado para aislar su silueta limpiamente en OBS Studio o en el software de transmisión, sin necesidad de gastar créditos de IA en modo de espera.",
      howTo: [
        "Por defecto, el fondo activo siempre es '🟢 Chroma Key (Verde)'.",
        "En la pestaña 'Fondos Virtuales' del dock, haz clic sobre cualquier tarjeta para previsualizar el escenario en tiempo real.",
        "Para subir tu propia foto o video de fondo, pulsa '📷 + Subir Fondo' o '📼 + Subir Video'.",
        "Haz clic en '⭐ Poner por Defecto' sobre tu fondo preferido para que el sistema lo recuerde permanentemente.",
        "Usa el switch '🖼️ Fondo' en la barra maestra de capas para encender o apagar la capa de fondo al instante.",
      ],
      technicalDetails: [
        { label: "Color Chroma Key", value: "#00FF00 (Verde Neón Puro de Máxima Separación Espectral)" },
        { label: "Consumo de Créditos en Previsualización", value: "0 Créditos (Renderizado local en cliente)" },
        { label: "Formatos de Fondo Soportados", value: "JPG, PNG, WebP, MP4 (bucle de video continuo)" },
        { label: "Almacenamiento Local", value: "Persistencia en localStorage (miplataformastream.virtualBackgrounds.v2)" },
      ],
      commonMistakes: [
        {
          mistake: "El fondo se ve desalineado o estirado.",
          solution: "Se recomienda subir imágenes en resolución 1920x1080 (16:9) para horizontal o 1080x1920 (9:16) para TikTok vertical.",
        },
        {
          mistake: "El recorte verde en OBS se ve con bordes verdes.",
          solution: "En los filtros de OBS añade 'Filtro de Croma Key', selecciona el color verde puro (#00FF00) y ajusta la similitud entre 380 y 420.",
        },
      ],
    },
  },
  {
    id: "recording_suite",
    title: "Barra de Grabación Local & Resoluciones (480p - 4K)",
    category: "Cabina CAM",
    icon: "video-alt2",
    badge: "Siempre Visible",
    targetTab: "CAM",
    shortDesc: "Grabación de video en cabina con selector 480p/720p/1080p/4K, cronómetro digital y descarga WebM directa.",
    content: {
      whatIs:
        "Una barra fija siempre presente encima del dock que graba la transmisión completa directamente en la memoria y disco del ordenador, sin depender de servidores externos ni marcas de agua.",
      whatIsFor:
        "Permite guardar archivos maestros de tus transmisiones para editarlos posteriormente, crear reels, resúmenes de YouTube o conservar una copia de seguridad en alta fidelidad.",
      howTo: [
        "En la barra '📹 Grabación de Video en Cabina', haz clic en el selector de calidad para elegir: 480p, 720p HD, 1080p Full HD o 4K Ultra HD.",
        "Haz clic en el botón '🔴 Iniciar Grabación'. Verás el punto rojo parpadeante 'GRABANDO' y el cronómetro digital en segundos.",
        "Cuando termines la sesión o directo, haz clic en '⏹ Detener'.",
        "El archivo .webm se descargará de inmediato y de forma automática en tu carpeta de Descargas.",
      ],
      technicalDetails: [
        { label: "Códec de Video", value: "video/webm;codecs=vp9 (o VP8 según compatibilidad de hardware)" },
        { label: "Bitrates Automáticos", value: "480p: 1.5 Mbps | 720p: 3.5 Mbps | 1080p: 7.0 Mbps | 4K: 16.0 Mbps" },
        { label: "Marcas de Agua", value: "Ninguna (0% libre de logos externos)" },
        { label: "Límite de Tiempo", value: "Ilimitado (sujeto al espacio disponible en tu disco duro)" },
      ],
      commonMistakes: [
        {
          mistake: "Cerrar la pestaña del navegador antes de pulsar detener.",
          solution: "Siempre debes hacer clic en '⏹ Detener' para que el navegador cierre el contenedor de video y genere el archivo descargable.",
        },
        {
          mistake: "El video 4K se traba en computadores antiguos.",
          solution: "Si tu procesador no cuenta con aceleración gráfica por hardware para VP9 4K, graba en 1080p Full HD para un rendimiento 100% fluido a 60 fps.",
        },
      ],
    },
  },
  {
    id: "live_shopping",
    title: "Live Shopping & Tarjetas de Compra con Código QR",
    category: "Cabina CAM",
    icon: "cart",
    badge: "OneStream Live",
    targetTab: "CAM",
    shortDesc: "Tarjetas flotantes con foto contenida (56px/72px), precio tachado y código QR escaneable con celular.",
    content: {
      whatIs:
        "Una herramienta de venta en vivo inspirada en las principales cadenas de teletienda y plataformas como OneStream Live y TikTok Shop.",
      whatIsFor:
        "Permite comercializar productos en pleno directo. El espectador solo tiene que apuntar la cámara de su teléfono al monitor para abrir la pasarela de pago o tienda web.",
      howTo: [
        "En el dock, pulsa en la pestaña '🛍️ Live Shopping'.",
        "Para mostrar un producto en pantalla, activa su interruptor '👁️ EN PANTALLA'. La tarjeta aparecerá flotando sobre el video.",
        "Para añadir un producto nuevo, pulsa '+ AGREGAR PRODUCTO'.",
        "Rellena el enlace de compra (URL), título, precio actual, precio de oferta tachado y sube la foto.",
        "El sistema generará el Código QR escaneable automáticamente.",
        "Para ocultar la tarjeta del escenario, pulsa el botón '✕' de la esquina de la tarjeta o apaga su switch en el dock.",
      ],
      technicalDetails: [
        { label: "Dimensiones de Tarjeta", value: "Máximo 440px de ancho con esquinas redondeadas de 18px" },
        { label: "Miniaturas de Producto", value: "Restringidas estrictamente a 56x56 px (dock) y 72x72 px (escenario) con object-fit: contain" },
        { label: "Posiciones en Pantalla", value: "Abajo Centro (bottom-center), Abajo Izquierda, Abajo Derecha" },
        { label: "Monedas Soportadas", value: "USD ($), EUR (€), MXN ($), GBP (£), COP ($)" },
      ],
      commonMistakes: [
        {
          mistake: "La imagen del producto se veía gigante.",
          solution: "El sistema ahora aplica reglas de contención automática de 56px para que cualquier foto en alta resolución quede perfectamente encuadrada.",
        },
        {
          mistake: "El código QR no abre la tienda.",
          solution: "Asegúrate de escribir la URL completa comenzando con 'https://' (por ejemplo: https://mitienda.com/articulo).",
        },
      ],
    },
  },
  {
    id: "scheduled_banners",
    title: "Logos y Banners Programados en Pantalla con URLs",
    category: "Cabina CAM",
    icon: "megaphone",
    badge: "Programable",
    targetTab: "CAM",
    shortDesc: "Banners fijos o por segundos/minutos, con animaciones, texto copiable y enlaces web ejecutables.",
    content: {
      whatIs:
        "Un gestor de publicidad y branding que proyecta logotipos, banners de patrocinadores y llamados a la acción sobre las 4 esquinas del video.",
      whatIsFor:
        "Monetizar transmisiones con patrocinadores y mostrar tus redes sociales o promociones de forma periódica sin interrumpir tu discurso.",
      howTo: [
        "En el dock de CAM, abre la pestaña '📢 Banners & Logos'.",
        "Haz clic en '+ CREAR NUEVO BANNER'.",
        "Selecciona el modo: 'Fijo Permanente' o 'Cíclico Programado' (ej. mostrar cada 30 segundos durante 10 segundos).",
        "Elige la ubicación: Arriba Derecha, Arriba Izquierda, Abajo Derecha o Abajo Izquierda.",
        "Elige la animación: Deslizamiento (slide), Desvanecimiento (fade), Rebote (bounce) o Zoom.",
        "Opcional: Si colocas una URL ejecutable, al hacer clic sobre el banner en pantalla se abrirá la página web.",
        "Opcional: Si colocas texto copiable (ej. código de descuento), aparecerá un botón '📋 Copiar' para el usuario.",
      ],
      technicalDetails: [
        { label: "Formatos de Imagen", value: "PNG con canal alfa transparente, JPG, WebP, SVG" },
        { label: "Rango de Tamaño", value: "De 10% a 50% del ancho del monitor" },
        { label: "Opacidad", value: "Ajustable de 10% a 100%" },
        { label: "Precisión de Temporizador", value: "Tick interno por segundo con auto-rotación" },
      ],
      commonMistakes: [
        {
          mistake: "El banner no aparece en pantalla.",
          solution: "Verifica que el switch de ese banner esté en 'ON' y que el switch maestro '📢 Banners' de la barra maestra esté encendido.",
        },
        {
          mistake: "El fondo del logo tapa al streamer.",
          solution: "Sube siempre archivos en formato .PNG sin fondo blanco para que solo se vea la silueta de tu marca.",
        },
      ],
    },
  },
  {
    id: "teleprompter",
    title: "Teleprompter / Guion en Pantalla (Estilo OneStream Live)",
    category: "Herramientas de Estudio",
    icon: "media-text",
    badge: "Privado",
    targetTab: "CAM",
    shortDesc: "Guion de lectura semi-transparente sobre el video, con velocidad de scroll y control de texto en vivo.",
    content: {
      whatIs:
        "Un apuntador de lectura para el streamer que se proyecta directamente sobre su monitor de retorno sin salir en la señal pública que ven los espectadores.",
      whatIsFor:
        "Permite recitar discursos, presentar productos, mencionar patrocinadores o seguir una pauta de contenido mirando directamente al lente de la cámara sin perder el contacto visual.",
      howTo: [
        "En el dock, pulsa en '📜 Teleprompter'.",
        "Escribe o pega tu guion en la caja de texto 'Contenido del Guion'.",
        "Activa el interruptor 'Habilitar teleprompter en escenario'.",
        "Ajusta la velocidad de desplazamiento automático entre 1 (lento y pausado) y 5 (rápido).",
        "En pantalla dispondrás de botones flotantes de 'Pausar', 'Reanudar' y 'Reiniciar al Inicio'.",
      ],
      technicalDetails: [
        { label: "Visibilidad", value: "Privado para el Streamer (Capa overlay no transmitida a OBS si se usa captura de ventana limpia)" },
        { label: "Ajuste de Velocidad", value: "5 niveles de desplazamiento por segundo" },
        { label: "Estilo Visual", value: "Franja central negra traslúcida con tipografía sans-serif de alto contraste" },
      ],
      commonMistakes: [
        {
          mistake: "El texto se mueve demasiado rápido.",
          solution: "Baja la velocidad al nivel 1 o 2 y usa la barra espaciadora o el botón de pausa para respirar entre frases.",
        },
      ],
    },
  },
  {
    id: "stream_deck",
    title: "Stream Deck / Botonera de Acciones Personalizadas",
    category: "Herramientas de Estudio",
    icon: "controls-play",
    badge: "Botonera",
    targetTab: "CAM",
    shortDesc: "Botonera interactiva de macros con iconos, colores temáticos, tamaños y ubicación flotante.",
    content: {
      whatIs:
        "Una botonera virtual personalizable equivalente a un dispositivo físico tipo Stream Deck para disparar comandos y transiciones de 1 solo clic.",
      whatIsFor:
        "Agilizar la operación del directo: cambiar prompts de IA, activar sonidos, enviar alertas de prueba o cambiar vestuarios sin tener que escribir comandos largos.",
      howTo: [
        "En el dock de CAM, abre '⚡ Stream Deck'.",
        "Haz clic en '+ CREAR NUEVO BOTÓN'.",
        "Asigna un nombre, selecciona un icono emoji o sube una imagen PNG.",
        "Elige el color del botón y el tamaño: Pequeño (sm), Mediano (md) o Grande (lg).",
        "Elige la ubicación: en la consola inferior ('deck') o flotando directamente sobre la pantalla de video ('screen').",
        "Haz clic en el botón creado en cualquier momento para ejecutar su acción instantáneamente.",
      ],
      technicalDetails: [
        { label: "Tipos de Acción", value: "Prompt IA, Cambio Try-On, Disparo de Alerta, Control de Stream" },
        { label: "Posición en Pantalla", value: "Columna lateral derecha flotante con transparencia" },
        { label: "Límite de Botones", value: "Hasta 24 botones guardados localmente" },
      ],
      commonMistakes: [
        {
          mistake: "No veo los botones flotantes sobre el video.",
          solution: "Verifica que el switch '⚡ Botones' de la Barra Maestra de Capas esté en color verde encendido.",
        },
      ],
    },
  },
  {
    id: "multistream",
    title: "Multistreaming a 45+ Plataformas Simultáneas",
    category: "Integraciones",
    icon: "networking",
    badge: "45+ Redes",
    targetTab: "CAM",
    shortDesc: "Transmisión paralela hacia TikTok, YouTube, Facebook, Twitch, Instagram y servidores RTMP.",
    content: {
      whatIs:
        "Un sistema de referencia para organizar claves RTMP y preparar la salida simultánea hacia plataformas como YouTube, Twitch, Facebook, Kick, TikTok * e Instagram *.",
      whatIsFor:
        "Centraliza tus destinos y llaves de transmisión. En Versión 1 (Cabina + OBS) funciona como guía junto a OBS Studio; en Versión 2 SaaS enviará la señal directo en la nube.",
      howTo: [
        "En la cabina CAM, haz clic en 'MULTISTREAM' para revisar y guardar tus claves RTMP locales.",
        "Para transmitir hoy en Versión 1: conecta Virallive con OBS Studio usando 'VIRTUAL CAMERA / OBS' (/obs-stage) y emite desde OBS a tus destinos.",
        "Ten en cuenta las marcas (*): TikTok Live * e Instagram Live * solo se habilitan si tu cuenta cumple sus requisitos oficiales y te entrega clave RTMP activa.",
        "En Versión 2 SaaS podrás emitir a todas las redes marcadas con 1 solo clic directo en la nube sin abrir OBS.",
      ],
      technicalDetails: [
        { label: "Modo V1 Actual", value: "Cabina + OBS Studio (/obs-stage / Cámara Virtual + plugin Multi-RTMP)" },
        { label: "Modo V2 SaaS (Planificado)", value: "Servidor Media Nube (WebRTC → RTMP Multi-destino con FFmpeg)" },
        { label: "TikTok Live * / Instagram Live *", value: "Sujetos a aprobación LIVE Studio (+1.000 seg.) o Cuenta Profesional (Live Producer)" },
      ],
      commonMistakes: [
        {
          mistake: "Activar switches en el modal Multistream esperando que transmita sin OBS en V1.",
          solution: "En V1 la emisión real al aire sale por Cabina + OBS Studio. Los switches de MultiStream guardan tu configuración y quedan listos para el motor nube de V2 SaaS.",
        },
      ],
    },
  },
  {
    id: "tiktok_live",
    title: "TikTok Live con Marcas & Formato Vertical 9:16",
    category: "Módulos PRO",
    icon: "smartphone",
    badge: "9:16 Vertical",
    targetTab: "PRO",
    targetProSubTab: "tiktok_live",
    shortDesc: "Simulador de smartphone con Dynamic Island, 4 temas de marca, fondo verde por defecto y sincronización CAM.",
    content: {
      whatIs:
        "Un entorno dedicado en el menú principal (TIKTOK, junto a DÚO y CLIPS) para diseñar directos verticales con Logo PNG transparente, colores RGB personalizados, fondos limpios y simulación de audiencia.",
      whatIsFor:
        "Crear marcos de marca 9:16 listos para llevar a tu Cabina CAM o recortar en OBS Studio usando el Fondo Verde Chroma Key (#00FF00) sin textos estorbosos sobre el video.",
      howTo: [
        "En el menú superior, haz clic directamente en 'TIKTOK' (después de DÚO y CLIPS).",
        "En '1. Fondos para TikTok Live', elige Chroma Key o sube tu propia foto/video (el nombre del fondo no aparecerá sobre la pantalla en vivo).",
        "En '2. Estilo de Marco, Colores RGB y Logo PNG', elige una plantilla, cambia los colores con la paleta o selector RGB/HEX y sube tu logotipo .PNG transparente ajustando su tamaño.",
        "En '3. Personaliza Textos', define tu nombre, eslogan, reacciones, botón SHOP y rango de espectadores.",
        "Pulsa 'APLICAR MARCO Y FONDO A CABINA CAM (9:16)' para enviar todo el estilo y tu Logo PNG directo al monitor de CAM.",
      ],
      technicalDetails: [
        { label: "Ubicación en Menú", value: "Pestaña principal TIKTOK (después de DÚO y CLIPS)" },
        { label: "Personalización de Estilo", value: "12 colores rápidos + Selector RGB/HEX + Color de marco + Logo PNG transparente (20-48px)" },
        { label: "Fondo por Defecto", value: "Chroma Key Verde (#00FF00) limpio sin letreros en pantalla" },
      ],
      commonMistakes: [
        {
          mistake: "El logo subido tiene un cuadro blanco detrás.",
          solution: "Exporta tu logotipo en formato .PNG con fondo transparente para que se integre limpio sobre el marco y banner.",
        },
      ],
    },
  },
  {
    id: "unified_chat",
    title: "Unified Live Chat (Logos Oficiales & Google Sheets)",
    category: "Módulos PRO",
    icon: "format-chat",
    badge: "Sheets & Logos",
    targetTab: "PRO",
    targetProSubTab: "unified_chat",
    shortDesc: "Chat multired con logos reales de TikTok, YouTube, Twitch, Facebook, Instagram y comentarios pregrabados de Google Sheets.",
    content: {
      whatIs:
        "Un agregador de comentarios en una sola ventana que consolida los mensajes de todas tus redes sociales con sus logotipos oficiales reales y permite importar comentarios desde Google Sheets.",
      whatIsFor:
        "Moderar e interactuar con toda tu comunidad desde una sola pantalla sin cambiar de pestaña, proyectar preguntas de los usuarios en el stream con '📌 FIJAR EN PANTALLA' y simular comentarios orgánicos preparados en una hoja de cálculo.",
      howTo: [
        "En 'MODULOS PRO', selecciona '💬 Unified Live Chat'.",
        "Usa las pestañas superiores para filtrar por red (TikTok, YouTube, Twitch, Facebook, Instagram) o ver solo SuperChats.",
        "Cada mensaje incluye el logotipo oficial real de la plataforma de origen.",
        "Pulsa '📌 FIJAR EN PANTALLA' en cualquier mensaje para mostrarlo como tercio inferior en el monitor CAM.",
        "Para escribir un comentario en vivo: usa la subpestaña '✍️ Escribir Comentario', elige la red social, pon el autor, el mensaje y si es donación, y pulsa 'Publicar al Chat'.",
        "Para usar Google Sheets: entra en '📊 Google Sheets', pulsa '📋 Plantilla Google Sheets' para copiar las columnas (Usuario, Mensaje, Plataforma, Donacion), pega las filas en la caja y pulsa '📥 Procesar Pegado'.",
        "Pulsa '▶ Iniciar Auto-Lanzador' para que los comentarios de tu hoja se publiquen automáticamente cada 5s, 8s, 15s o 30s.",
      ],
      technicalDetails: [
        { label: "Logotipos", value: "Componentes vectoriales SVG oficiales de TikTok, YouTube, Twitch, Facebook e Instagram" },
        { label: "Formatos de Importación", value: "Google Sheets Copiar-Pegar (TSV), Archivos CSV, TSV y TXT delimitados" },
        { label: "Auto-Lanzador", value: "Temporizador configurable (5s, 8s, 15s, 30s) con bucle infinito opcional" },
        { label: "Tercio Inferior", value: "Monitor CAM overlay con avatar, nombre, badge de donación y logo oficial" },
      ],
      commonMistakes: [
        {
          mistake: "Las filas pegadas de Google Sheets no se importan.",
          solution: "Asegúrate de copiar al menos las dos primeras columnas: Usuario y Mensaje. La plataforma y donación son opcionales y toman TikTok por defecto.",
        },
      ],
    },
  },
  {
    id: "playlist_streaming",
    title: "Playlist Streaming (Transmisión Continua 24/7)",
    category: "Módulos PRO",
    icon: "controls-repeat",
    badge: "24/7 Loop",
    targetTab: "PRO",
    targetProSubTab: "playlist_stream",
    shortDesc: "Cola de videos pregrabados con duración total acumulada, bucle 24/7 y auto-avance entre pistas.",
    content: {
      whatIs:
        "Un programador de listas de video pregrabados que permite subir tus propios clips, fijar fecha/horas, activar prelanzamientos con cuenta regresiva y elegir 1 plataforma o MultiLive.",
      whatIsFor:
        "Organizar lanzamientos, clases o infomerciales con horarios calculados clip por clip. En Versión 1 se reproduce desde la Cabina hacia OBS; la emisión 24/7 autónoma en nube se ejecutará en Versión 2 SaaS.",
      howTo: [
        "Entra a 'PRO' -> 'Playlist Streaming (Loop 24/7)'.",
        "En '1. Plataforma de Destino', elige entre 'Una Plataforma' o 'MultiLive (Simultáneo)' teniendo en cuenta los requisitos (*) de TikTok Live e Instagram Live.",
        "En '2. Programar Horas & Prelanzamientos', escoge 'Programar Fecha y Hora', define inicio/fin y activa el switch de 'Prelanzamiento / Cuenta Regresiva' si quieres sala de espera.",
        "Pulsa '+ Subir Mis Videos' (MP4, WebM, MOV, MKV) o '+ Video por URL' y ordena tu cola con ↑ y ↓.",
        "Pulsa 'TRANSMITIR' o 'PROGRAMAR PLAYLIST EN VIVO' para cargar la secuencia en tu Cabina CAM y sacarla al aire por OBS.",
      ],
      technicalDetails: [
        { label: "Carga de Videos", value: "Múltiples archivos locales (lectura automática de duración) o enlace URL" },
        { label: "Horarios & Estreno", value: "Franjas horarias por clip + Prelanzamiento T-01:00 a T-15:00" },
        { label: "Nota V1 vs V2 SaaS", value: "V1 reproduce en Cabina + OBS; V2 SaaS ejecutará worker FFmpeg 24/7 en la nube" },
      ],
      commonMistakes: [
        {
          mistake: "Apagar el computador y esperar que siga transmitiendo en V1.",
          solution: "En Versión 1 (estudio local), tu computador y OBS deben permanecer encendidos. El streaming 24/7 autónomo sin PC llegará en Versión 2 SaaS.",
        },
      ],
    },
  },
  {
    id: "schedule_live",
    title: "Schedule or Go Live (Programador & Botón 1-Clic)",
    category: "Módulos PRO",
    icon: "calendar-alt",
    badge: "GO LIVE NOW",
    targetTab: "PRO",
    targetProSubTab: "schedule_live",
    shortDesc: "Botón hero para salir al aire al instante, reloj de cuenta regresiva en vivo y calendario de directos.",
    content: {
      whatIs:
        "El centro de programación y emisión en tiempo real de directos planificados o espontáneos.",
      whatIsFor:
        "Permite anunciar fechas de directos a tu audiencia con cuenta regresiva en vivo, o transmitir con 1 solo clic en el botón 'GO LIVE NOW'.",
      howTo: [
        "En 'MODULOS PRO', haz clic en '🗓️ Schedule or Go Live'.",
        "Si quieres transmitir de inmediato, haz clic en el gran botón '🔴 GO LIVE NOW'. El sistema iniciará la emisión en cabina CAM al instante.",
        "Revisa la tarjeta de 'Próximo Directo Programado' para consultar la cuenta regresiva con días, horas, minutos y segundos exactos.",
        "En la tabla inferior puedes consultar el calendario de transmisiones con sus títulos y plataformas asignadas.",
      ],
      technicalDetails: [
        { label: "Reloj", value: "Cuenta regresiva en vivo actualizada cada 1000ms" },
        { label: "Acción Instantánea", value: "Transición automática a pestaña CAM con encendido de stream" },
      ],
      commonMistakes: [
        {
          mistake: "La cuenta regresiva llegó a cero pero no salí al aire.",
          solution: "Puedes pulsar '🔴 GO LIVE NOW' manualmente o habilitar el auto-start en la configuración de la transmisión.",
        },
      ],
    },
  },
  {
    id: "tryon_virtual",
    title: "Probador Virtual Try-On en Tiempo Real (lucy-vton-3.6)",
    category: "Módulos PRO",
    icon: "products",
    badge: "Sección TRY ON",
    targetTab: "TRY_ON",
    shortDesc: "Probador de ropa con IA estilo espejo, fondo verde Chroma Key por defecto y grabación de video integrada.",
    content: {
      whatIs:
        "Un probador digital de alta tecnología impulsado por el modelo de IA `lucy-vton-3.6` que viste al streamer con ropa digital en tiempo real frente a su cámara.",
      whatIsFor:
        "Crear directos de moda, reseñas de ropa y venta de prendas sin tener que cambiarse físicamente de vestuario entre una prenda y otra.",
      howTo: [
        "En el menú superior, selecciona la pestaña 'TRY ON'.",
        "Verás el monitor dual: a la izquierda tu cámara de entrada y a la derecha la salida con IA.",
        "El fondo de salida inicia por defecto en '🟢 Chroma Key (Verde) #00FF00' para que no consumas créditos en standby.",
        "Haz clic en cualquier prenda del carrusel inferior (chaquetas, vestidos, sudaderas) para seleccionarla.",
        "Haz clic en '▶ Iniciar Probador en Vivo' para que la IA aplique la prenda sobre tu cuerpo en tiempo real.",
        "Para grabar video de la sesión: en la barra superior usa el control '📹 REC:', elige la resolución (480p a 4K) y pulsa '🔴 Grabar Video'.",
        "Al pulsar '⏹ Detener', tu archivo WebM de la prueba se descargará automáticamente.",
      ],
      technicalDetails: [
        { label: "Modelo de IA", value: "lucy-vton-3.6 (Decart Realtime Virtual Try-On)" },
        { label: "Carrusel de Prendas", value: "Hasta 10 prendas simultáneas con subida de ropa personalizada" },
        { label: "Fondos Dinámicos", value: "Reflejo en tiempo real en monitor de salida (Chroma Green, Oficina, Cyberpunk)" },
        { label: "Grabación Integrada", value: "MediaRecorder con selector de 480p a 4K UHD" },
      ],
      commonMistakes: [
        {
          mistake: "La prenda se ve desplazada respecto al cuerpo.",
          solution: "Sitúate a una distancia de plano medio (de cintura para arriba) con iluminación frontal uniforme y fondo despejado.",
        },
      ],
    },
  },
  {
    id: "voice_finance",
    title: "Voice Finance & Cambiador de Voz",
    category: "Módulos PRO",
    icon: "microphone",
    badge: "Audio DSP",
    targetTab: "PRO",
    targetProSubTab: "voice_finance",
    shortDesc: "Filtros de voz en vivo (Robot, Vintage, Deep, Reverb) y calculadora de costos por segundo.",
    content: {
      whatIs:
        "Un procesador digital de señal de audio (DSP) que transforma tu voz en tiempo real y calcula los costos de uso del servicio.",
      whatIsFor:
        "Adoptar personajes para directos lúdicos y monitorear el consumo de créditos para mantener un presupuesto controlado.",
      howTo: [
        "Entra a 'MODULOS PRO' -> '🎙️ Voice & Finance'.",
        "Selecciona un efecto de voz: Robot, Cyberpunk, Radio Vintage, Deep Male o High Pitch.",
        "Ajusta los deslizadores de Tono (Pitch), Reverb y Reducción de Ruido.",
        "Observa la calculadora financiera con el costo exacto por segundo y tu saldo de créditos restante.",
      ],
      technicalDetails: [
        { label: "Procesamiento", value: "Web Audio API de baja latencia (<25ms)" },
        { label: "Efectos Incluidos", value: "BiquadFilter, Convolver (Reverb), Pitch Shifter y DynamicsCompressor" },
      ],
      commonMistakes: [
        {
          mistake: "Se escucha un eco en mis auriculares.",
          solution: "Utiliza siempre auriculares para evitar que el micrófono capture el audio que sale de tus altavoces.",
        },
      ],
    },
  },
  {
    id: "skins_studio",
    title: "Gestor de Skins & Colección de Personajes",
    category: "Herramientas de Estudio",
    icon: "art",
    badge: "CREATE",
    targetTab: "CREATE",
    shortDesc: "Catálogo de avatares, vestuarios y presets guardados en CREATE, listos para aplicar a CAM o probar en Try-On.",
    content: {
      whatIs:
        "Un centro de gestión y colección de personajes, vestuarios y estilos generados con Google Gemini, ChatGPT o subidos desde imagen.",
      whatIsFor:
        "Guardar y organizar tus skins favoritos para activarlos con 1 solo clic en tu cámara en vivo o en el probador de ropa.",
      howTo: [
        "Entra a la cabina 'CREATE' desde la barra de navegación superior.",
        "Selecciona 'Mis Skins' para ver tu colección, buscar por nombre o filtrar por categoría.",
        "Diseña nuevos personajes con Gemini o ChatGPT y pulsa 'Guardar en Mis Skins'.",
        "Haz clic en 'Aplicar a CAM' en cualquier skin para encarnarlo al instante en tu transmisión.",
      ],
      technicalDetails: [
        { label: "Ubicación", value: "Cabina CREATE -> Pestaña 'Mis Skins'" },
        { label: "Capacidad", value: "Almacenamiento local ilimitado en tu navegador" },
        { label: "Integración Directa", value: "1 Clic a CAM en vivo o a cabina Try-On" },
      ],
      commonMistakes: [
        {
          mistake: "Buscar skins en el módulo PRO.",
          solution: "Ahora están centralizados en 'CREATE' junto a las herramientas de diseño de personajes y vestuario.",
        },
      ],
    },
  },
  {
    id: "obs_alerts",
    title: "OBS Studio WebSockets & Sistema de Alertas",
    category: "Integraciones",
    icon: "desktop",
    badge: "Browser Source",
    targetTab: "PRO",
    targetProSubTab: "obs_alerts",
    shortDesc: "Fuentes de navegador para OBS (/obs-overlay), bus de alertas de donaciones y control por WebSockets.",
    content: {
      whatIs:
        "El puente de conexión entre viralive.app y el software OBS Studio.",
      whatIsFor:
        "Permite incrustar la cabina, los tercios inferiores y las alertas gráficas dentro de las escenas de OBS mediante URLs de Browser Source.",
      howTo: [
        "En 'MODULOS PRO', pulsa en '📡 OBS & Alertas'.",
        "Copia la URL de Browser Source generada (ej. `http://localhost:3000/obs-overlay`).",
        "En OBS Studio, agrega una fuente de tipo 'Navegador', pega la URL y pon resolución 1920x1080.",
        "En el simulador de alertas, pulsa 'Simular Donación' para ver la animación en tu pantalla.",
      ],
      technicalDetails: [
        { label: "Rutas OBS", value: "/obs-overlay (alertas y tercios) y /obs-stage (monitor completo)" },
        { label: "Bus de Eventos", value: "Server-Sent Events y WebSockets en tiempo real (/api/alerts/stream)" },
      ],
      commonMistakes: [
        {
          mistake: "La fuente de navegador de OBS se ve con fondo blanco.",
          solution: "En las propiedades de la fuente de navegador en OBS, marca la opción 'Fondo transparente'.",
        },
      ],
    },
  },
  {
    id: "vcam_videocalls",
    title: "Cámara Virtual en Videollamadas (Zoom, Meet, Teams, WhatsApp)",
    category: "Integraciones",
    icon: "video-alt2",
    badge: "Videollamadas",
    targetTab: "CAM",
    shortDesc: "Guía paso a paso para transmitir tu cabina, ropa Try-On y fondos virtuales a Zoom, Meet, Teams y WhatsApp.",
    content: {
      whatIs:
        "El sistema de puente de video que convierte tu señal en vivo de Virallive (con tus filtros, ropa Try-On, fondos y tercios) en una cámara web virtual compatible con cualquier aplicación de videollamadas del mundo.",
      whatIsFor:
        "Permite que tus reuniones de Zoom, clases de Google Meet, llamadas corporativas de Microsoft Teams y videollamadas de ventas de WhatsApp Desktop o Web utilicen la imagen profesional de tu estudio sin marcas de agua ni software adicional costoso.",
      howTo: [
        "Paso 1: Abre la señal limpia de tu cabina pulsando 'Pop-out' o añade una fuente Navegador en OBS Studio con http://localhost:3000/obs-stage (1920x1080).",
        "Paso 2: En OBS Studio (esquina inferior derecha), haz clic en el botón 'Iniciar Cámara Virtual'.",
        "Paso 3 en Zoom: Ve a Configuración ⚙️ > Video > Cámara y selecciona 'OBS Virtual Camera'. Desactiva 'Reflejar mi video' si vas a mostrar texto o códigos QR.",
        "Paso 3 en Google Meet: Haz clic en los 3 puntos > Configuración > Video > Cámara y elige 'OBS Virtual Camera'. Ajusta resolución a 720p HD.",
        "Paso 3 en Microsoft Teams: Ve a Configuración > Dispositivos > Cámara y elige 'OBS Virtual Camera'. Desmarca fondos virtuales nativos de Teams.",
        "Paso 3 en WhatsApp Desktop (Windows): Ve a Ajustes de llamada > Dispositivos de Video y elige 'OBS Virtual Camera'.",
        "Paso 3 en WhatsApp Web: Al iniciar la videollamada, cuando el navegador te pida permiso, selecciona 'OBS Virtual Camera'.",
      ],
      technicalDetails: [
        { label: "Protocolo de Salida", value: "DirectShow Virtual Device (Windows) / CoreMedia (macOS) vía OBS Studio" },
        { label: "Latencia de Envío", value: "< 25 milisegundos en tiempo real local" },
        { label: "Resoluciones Compatibles", value: "1080p Full HD (1920x1080) y 720p HD (1280x720) a 60 FPS" },
        { label: "Aplicaciones Verificadas", value: "Zoom, Google Meet, Microsoft Teams, WhatsApp Desktop, WhatsApp Web, Discord, Skype, Slack" },
      ],
      commonMistakes: [
        {
          mistake: "La aplicación de videollamada muestra la pantalla negra o congelada.",
          solution: "Asegúrate de haber presionado 'Iniciar Cámara Virtual' en OBS Studio y que la ventana de la cabina esté abierta.",
        },
        {
          mistake: "En Zoom las letras de los banners se leen al revés.",
          solution: "En la configuración de video de Zoom, desmarca la casilla 'Reflejar mi video'. Tus espectadores siempre lo ven al derecho.",
        },
      ],
    },
  },
];

export function DocumentationCenterPanel({ onNavigateToTab }: DocumentationCenterPanelProps) {
  const [selectedDocId, setSelectedDocId] = useState<DocSectionId>("guia_maestra");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [docTab, setDocTab] = useState<"overview" | "steps" | "tech" | "faq">("overview");

  const categories = ["all", "Cabina CAM", "Módulos PRO", "Herramientas de Estudio", "Integraciones"];

  // Filtrado reactivo de módulos
  const filteredDocs = useMemo(() => {
    return DOC_ITEMS.filter((item) => {
      const matchesCategory = activeCategory === "all" || item.category === activeCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.shortDesc.toLowerCase().includes(q) ||
        item.content.whatIs.toLowerCase().includes(q) ||
        item.content.whatIsFor.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, searchQuery]);

  const activeDoc = DOC_ITEMS.find((d) => d.id === selectedDocId) || DOC_ITEMS[0];

  const handleJumpToModule = () => {
    if (onNavigateToTab) {
      onNavigateToTab(activeDoc.targetTab, activeDoc.targetProSubTab);
    }
  };

  return (
    <div style={{ maxWidth: 1380, width: "100%", minWidth: 0, margin: "0 auto", padding: "8px 0" }}>
      {/* CABECERA PRINCIPAL DEL CENTRO DE DOCUMENTACIÓN */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(24, 24, 38, 0.95) 0%, rgba(14, 14, 22, 0.98) 100%)",
          border: "1px solid var(--border-dark)",
          borderRadius: 16,
          padding: "20px 24px",
          marginBottom: 18,
          boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 12,
              background: "#131420",
              border: "1px solid rgba(255, 46, 147, 0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 20px rgba(168, 85, 247, 0.28)",
            }}
          >
            <ViraliveLogo variant="mark" height={34} />
          </div>
          <div style={{ minWidth: 0, flex: "1 1 220px" }}>
            <h1 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 900, color: "#FFFFFF" }}>
              Centro de Documentación &amp; Manual de Funciones
            </h1>
            <p style={{ margin: "4px 0 0 0", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
              Guía maestra paso a paso, casos de uso, condicionales (*) y solución de problemas para los {DOC_ITEMS.length} módulos de Virallive (V1 · Cabina + OBS).
            </p>
          </div>
        </div>

        {/* Buscador en tiempo real */}
        <div style={{ position: "relative", minWidth: "min(280px, 100%)", flex: "1 1 240px", maxWidth: 380 }}>
          <span
            style={{
              position: "absolute",
              left: 11,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#9CA3AF",
              display: "inline-flex",
              pointerEvents: "none",
            }}
          >
            <Dashicon name="search" size={15} />
          </span>
          <input
            type="text"
            className="pro-input-field"
            placeholder="Buscar módulo, Chroma Key, Sheets, 4K..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: "100%", paddingLeft: 34, fontSize: "0.82rem" }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              style={{
                position: "absolute",
                right: 10,
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                color: "#9CA3AF",
                cursor: "pointer",
                display: "inline-flex",
              }}
              aria-label="Limpiar búsqueda"
            >
              <Dashicon name="no-alt" size={16} />
            </button>
          )}
        </div>
      </div>

      {/* FILTROS DE CATEGORÍA */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`unified-filter-pill ${activeCategory === cat ? "active" : ""}`}
            onClick={() => setActiveCategory(cat)}
            style={{ fontSize: "0.76rem", padding: "6px 14px", minHeight: 40, display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <Dashicon name={cat === "all" ? "grid-view" : "book"} size={14} />
            <span>{cat === "all" ? `Todos los Módulos (${DOC_ITEMS.length})` : cat}</span>
          </button>
        ))}
      </div>

      {/* DISPOSICIÓN EN DOS COLUMNAS: SIDEBAR DE MÓDULOS (IZQ) Y CONTENIDO EN PROFUNDIDAD (DER) */}
      <div className="docs-two-col-grid">
        {/* COLUMNA IZQUIERDA: LISTA DE MÓDULOS */}
        <div
          style={{
            minWidth: 0,
            background: "rgba(18, 18, 28, 0.95)",
            border: "1px solid var(--border-dark)",
            borderRadius: 14,
            padding: 12,
            maxHeight: "75vh",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          {filteredDocs.length === 0 ? (
            <div style={{ padding: 20, textAlign: "center", color: "#9CA3AF", fontSize: "0.8rem" }}>
              No se encontraron módulos con &quot;{searchQuery}&quot;.
            </div>
          ) : (
            filteredDocs.map((item) => {
              const isSelected = selectedDocId === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedDocId(item.id);
                    setDocTab("overview");
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    borderRadius: 10,
                    cursor: "pointer",
                    background: isSelected ? "rgba(99, 102, 241, 0.2)" : "#161622",
                    border: isSelected ? "1px solid #6366F1" : "1px solid #282838",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 8, background: "rgba(99, 102, 241, 0.16)", color: "#A5B4FC", flexShrink: 0 }}>
                    <Dashicon name={item.icon} size={16} />
                  </span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 4 }}>
                      <strong
                        style={{
                          fontSize: "0.8rem",
                          color: isSelected ? "#FFFFFF" : "#E2E8F0",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {item.title}
                      </strong>
                      {item.badge && (
                        <span
                          style={{
                            fontSize: "0.6rem",
                            fontWeight: 800,
                            padding: "1px 5px",
                            borderRadius: 4,
                            backgroundColor:
                              item.badge === "Predeterminado"
                                ? "rgba(16, 185, 129, 0.2)"
                                : item.badge === "Siempre Visible"
                                ? "rgba(239, 68, 68, 0.2)"
                                : "rgba(99, 102, 241, 0.2)",
                            color:
                              item.badge === "Predeterminado"
                                ? "#6EE7B7"
                                : item.badge === "Siempre Visible"
                                ? "#FCA5A5"
                                : "#A5B4FC",
                            flexShrink: 0,
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: "0.68rem",
                        color: "#94A3B8",
                        display: "block",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        marginTop: 2,
                      }}
                    >
                      {item.shortDesc}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* COLUMNA DERECHA: DOCUMENTO COMPLETO EN PROFUNDIDAD DEL MÓDULO */}
        <div
          style={{
            minWidth: 0,
            background: "rgba(18, 18, 28, 0.95)",
            border: "1px solid var(--border-dark)",
            borderRadius: 14,
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 16,
            minHeight: "75vh",
          }}
        >
          {/* Cabecera del módulo activo */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: 12,
              borderBottom: "1px solid #282838",
              paddingBottom: 14,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 42, height: 42, borderRadius: 10, background: "rgba(99, 102, 241, 0.18)", border: "1px solid rgba(99, 102, 241, 0.4)", color: "#C7D2FE", flexShrink: 0 }}>
                <Dashicon name={activeDoc.icon} size={22} />
              </span>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: "0.7rem", color: "var(--accent-pink)", fontWeight: 800, textTransform: "uppercase" }}>
                    {activeDoc.category}
                  </span>
                  {activeDoc.badge && (
                    <span style={{ fontSize: "0.65rem", padding: "1px 6px", borderRadius: 4, background: "#312E81", color: "#C7D2FE", fontWeight: 800 }}>
                      {activeDoc.badge}
                    </span>
                  )}
                </div>
                <h2 style={{ margin: "2px 0 0 0", fontSize: "1.25rem", color: "#FFFFFF", fontWeight: 900 }}>
                  {activeDoc.title}
                </h2>
              </div>
            </div>

            <button
              type="button"
              className="btn-apply-cam-primary"
              style={{ padding: "8px 16px", fontSize: "0.78rem", display: "inline-flex", alignItems: "center", gap: 6 }}
              onClick={handleJumpToModule}
              title={`Ir directamente a la sección de ${activeDoc.title} en la aplicación`}
            >
              <Dashicon name="external" size={15} />
              <span>ABRIR ESTA FUNCIÓN</span>
            </button>
          </div>

          {/* Subpestañas del artículo */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, borderBottom: "1px solid #282838", paddingBottom: 8 }}>
            <button
              type="button"
              className={`pill-ctrl-button ${docTab === "overview" ? "active-pink" : ""}`}
              style={{ padding: "6px 12px", fontSize: "0.74rem", fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 6 }}
              onClick={() => setDocTab("overview")}
            >
              <Dashicon name="info" size={14} />
              <span>¿Qué es y Para qué sirve?</span>
            </button>
            <button
              type="button"
              className={`pill-ctrl-button ${docTab === "steps" ? "active-pink" : ""}`}
              style={{ padding: "6px 12px", fontSize: "0.74rem", fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 6 }}
              onClick={() => setDocTab("steps")}
            >
              <Dashicon name="admin-tools" size={14} />
              <span>Guía Paso a Paso</span>
            </button>
            <button
              type="button"
              className={`pill-ctrl-button ${docTab === "tech" ? "active-pink" : ""}`}
              style={{ padding: "6px 12px", fontSize: "0.74rem", fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 6 }}
              onClick={() => setDocTab("tech")}
            >
              <Dashicon name="admin-generic" size={14} />
              <span>Especificaciones Técnicas</span>
            </button>
            <button
              type="button"
              className={`pill-ctrl-button ${docTab === "faq" ? "active-pink" : ""}`}
              style={{ padding: "6px 12px", fontSize: "0.74rem", fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 6 }}
              onClick={() => setDocTab("faq")}
            >
              <Dashicon name="warning" size={14} />
              <span>Errores Comunes &amp; Solución</span>
            </button>
          </div>

          {/* PESTAÑA 1: QUÉ ES Y PARA QUÉ SIRVE */}
          {docTab === "overview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ background: "#151522", padding: 16, borderRadius: 10, border: "1px solid #282838" }}>
                <h4 style={{ margin: "0 0 6px 0", fontSize: "0.88rem", color: "#60A5FA", fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <Dashicon name="search" size={15} />
                  <span>¿Qué es?</span>
                </h4>
                <p style={{ margin: 0, fontSize: "0.82rem", color: "#E2E8F0", lineHeight: 1.5 }}>
                  {activeDoc.content.whatIs}
                </p>
              </div>

              <div style={{ background: "#151522", padding: 16, borderRadius: 10, border: "1px solid #282838" }}>
                <h4 style={{ margin: "0 0 6px 0", fontSize: "0.88rem", color: "#34D399", fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <Dashicon name="lightbulb" size={15} />
                  <span>¿Para qué sirve y cuál es su beneficio?</span>
                </h4>
                <p style={{ margin: 0, fontSize: "0.82rem", color: "#E2E8F0", lineHeight: 1.5 }}>
                  {activeDoc.content.whatIsFor}
                </p>
              </div>
            </div>
          )}

          {/* PESTAÑA 2: GUÍA PASO A PASO */}
          {docTab === "steps" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <h4 style={{ margin: "0 0 4px 0", fontSize: "0.88rem", color: "#F472B6", fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Dashicon name="controls-play" size={15} />
                <span>Cómo se utiliza (Instrucciones operativas paso a paso):</span>
              </h4>
              {activeDoc.content.howTo.map((step, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    background: "#151522",
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: "1px solid #282838",
                  }}
                >
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      backgroundColor: "#6366F1",
                      color: "#FFFFFF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.72rem",
                      fontWeight: 900,
                      flexShrink: 0,
                    }}
                  >
                    {idx + 1}
                  </span>
                  <span style={{ fontSize: "0.8rem", color: "#E2E8F0", lineHeight: 1.4 }}>
                    {step}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* PESTAÑA 3: ESPECIFICACIONES TÉCNICAS */}
          {docTab === "tech" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <h4 style={{ margin: "0 0 4px 0", fontSize: "0.88rem", color: "#FBBF24", fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Dashicon name="admin-generic" size={15} />
                <span>Parámetros y Detalles de Arquitectura:</span>
              </h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8 }}>
                {activeDoc.content.technicalDetails.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 6,
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: "#151522",
                      padding: "10px 14px",
                      borderRadius: 8,
                      border: "1px solid #282838",
                    }}
                  >
                    <span style={{ fontSize: "0.78rem", color: "#94A3B8", fontWeight: 700 }}>
                      {item.label}
                    </span>
                    <span style={{ fontSize: "0.8rem", color: "#67E8F9", fontWeight: 800, textAlign: "right" }}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PESTAÑA 4: ERRORES COMUNES & SOLUCIÓN */}
          {docTab === "faq" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <h4 style={{ margin: "0 0 4px 0", fontSize: "0.88rem", color: "#EF4444", fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Dashicon name="warning" size={15} />
                <span>Errores Frecuentes y Solución Rápida:</span>
              </h4>
              {activeDoc.content.commonMistakes.map((faq, idx) => (
                <div
                  key={idx}
                  style={{
                    background: "#1C141E",
                    padding: 14,
                    borderRadius: 10,
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: "#EF4444", display: "inline-flex" }}>
                      <Dashicon name="dismiss" size={15} />
                    </span>
                    <strong style={{ fontSize: "0.82rem", color: "#FCA5A5" }}>{faq.mistake}</strong>
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8, paddingLeft: 22 }}>
                    <span style={{ color: "#10B981", display: "inline-flex", marginTop: 2 }}>
                      <Dashicon name="yes-alt" size={14} />
                    </span>
                    <span style={{ fontSize: "0.78rem", color: "#E2E8F0", lineHeight: 1.4 }}>
                      {faq.solution}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

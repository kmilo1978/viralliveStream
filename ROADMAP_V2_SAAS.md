# Roadmap Oficial — Virallive Versión 2 (V2 SaaS)

> **Estado de Versión 1 (Actual):** `V1` opera como **Cabina Local + OBS Studio** (`spike-v0`).  
> Todos los módulos descritos en este documento quedan planificados para construirse de forma aislada en la **Versión 2 SaaS** (`v2-saas`), una vez congelada la `V1`.

---

## 1. Base SaaS Multi-Usuario & Cuentas
- Autenticación, espacios de trabajo por streamer/marca, control de planes/créditos por cliente y panel de administración.
- Almacenamiento en nube (S3 / Cloudflare R2) para avatares, logos PNG, fondos personalizados, videos pregrabados y clips procesados.

## 2. Motor MultiStream Nube Real (`WebRTC → RTMP Multi-destino`)
- Captura de 1 solo flujo WebRTC liviano desde el navegador hacia servidor media en nube (**LiveKit / MediaMTX + FFmpeg `-f tee`**).
- Réplica paralela sin re-codificación múltiple hacia **YouTube, Facebook, Twitch, Kick, X, RTMP Custom, TikTok `*` e Instagram `*`** sin obligar al usuario a instalar OBS.
- **Condicionales `*` en onboarding de destinos:**
  - **TikTok Live `*`:** Verificación guiada de elegibilidad LIVE Studio / clave RTMP aprobada (+1.000 seguidores o partner).
  - **Instagram Live `*`:** Verificación de Cuenta Profesional (Creador o Empresa) y enlace dinámico por sesión (Live Producer).

## 3. Playlist Streaming 24/7 Autónoma en Nube
- Worker de transmisión continua en servidor (**FFmpeg**) para reproducir playlists programadas por fecha/hora, con salas de espera de **Prelanzamiento (Premiere)** y bucle **24/7**, aunque el cliente apague su computador.

## 4. Conector Universal de Apps con `Composio.dev`
- Módulo **"Conectar Mis Cuentas y Apps"** con OAuth gestionado para clientes:
  - **Google Sheets real:** lectura en vivo de catálogos Live Shopping, pedidos y guiones de comentarios.
  - **Google Calendar & Gmail:** agenda automática de directos y envío de resúmenes/alertas.
  - **YouTube / TikTok (clips) / Instagram Business / Shopify & CRM:** publicación de clips grabados, captura de leads y sincronización de tienda.

## 5. Módulo Dashboard de Analítica, Métricas & Gráficas (Nuevo)
Panel central de inteligencia y resultados para creadores y marcas dentro de V2 SaaS:

### A. Tiempo y Horas de Reproducción
- **Horas transmitidas:** total acumulado en vivo + playlists 24/7 (diario, semanal, mensual).
- **Horas de visualización / retención:** minutos totales vistos por la audiencia, duración promedio de sesión por espectador y tasa de retención por bloque horario o clip.

### B. Rendimiento Comparativo por Plataforma
- Desglose en vivo e histórico por red (**TikTok `*`, YouTube, Instagram `*`, Facebook, Twitch, Kick, RTMP**):
  - Espectadores concurrentes promedio y pico máximo simultáneo.
  - Nuevos seguidores o suscriptores captados durante la emisión.
  - Porcentaje de participación de audiencia por red (`%` de tráfico).

### C. Métricas de Chat, Comentarios & IA
- Volumen total de comentarios por minuto (`CPM`) y por plataforma.
- Comentarios respondidos manualmente vs respondidos por el **Auto-Respondedor IA**.
- Conteo y monto acumulado de **SuperChats / Donaciones / Regalos** (COP y USD).
- Nube de palabras o preguntas más repetidas detectadas por IA para ajustar guiones y ofertas.

### D. Métricas de CTA, Live Shopping & Conversión
- **Clics en CTA y Banners:** clics totales y CTR por cada banner o botón flotante programado.
- **Live Shopping con QR:** impresiones del card de producto, **escaneos reales del código QR**, clics en enlaces de compra y atribución por producto / instante exacto del directo.
- **Embudo de Conversión:** `Espectadores Totales → Interacción en Chat → Escaneo QR / Clic CTA → Compra / Lead`.

### E. Gráficas Visuales, Salud Técnica & Exportación
- **Gráficas interactivas:**
  - Línea temporal minuto a minuto (correlación entre picos de audiencia, banners lanzados y escaneos QR).
  - Barras comparativas por red social y por día/hora de mayor audiencia.
  - Mapa de calor de mejores horarios para programar playlists y directos.
- **Salud técnica del stream:** FPS promedio, bitrate de salida RTMP, caídas evitadas y consumo exacto de créditos IA por sesión.
- **Filtros y reportes:** filtros por rango de fechas, tipo de cabina (`CAM`, `TRY ON`, `DÚO`, `CLIPS`, `PLAYLIST`) y exportación a **CSV / PDF / Google Sheets** (vía Composio.dev).

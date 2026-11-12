# DESIGN.md: MiPlataformaStream (DeluluStream Clean-Room Studio UI)

## Identidad y Direccion Visual (R-37)
- **Producto:** MiPlataformaStream (cabina de streaming y generacion de personajes en vivo para creadores y live-commerce sobre la API oficial de Decart).
- **Direccion aprobada por el fundador:** Replicacion limpia (clean-room) de la arquitectura visual, ergonomia y flujo de **DeluluStream**, manteniendo la estetica pitch-black con acentos neon magenta/pink (`#FF2E93`), tarjeta de previsualizacion hero con reticulas angulares en las esquinas, base de controles acoplados al monitor (selector de camara, microfono, medidor de nivel VU y barra de sesion libre), dock izquierdo de presets y prompts con subcategorias iconicas, catalogo interactivo `EXPLORE` en rejilla de 6 columnas con contadores de me gusta, y constructor `CREATE` con conmutador de modo y acordeones de etiquetas clicables.
- **Integracion de Nuevos Modulos Pro:** Incorporacion limpia y accesible sin romper el flujo del estudio en la pestana `MODULOS PRO`:
  1. Probador Virtual de Ropa en Vivo (`lucy-vton-3.6`)
  2. Clips Pregrabados en Cola Asincrona (`Queue API MP4`)
  3. Integracion OBS Studio v5 + Lua + Alertas en Pantalla
  4. Modulador de Voz IA (Web Audio FX + ElevenLabs) y Calculadora Financiera COP/Wompi.

## Dials de Energia
- **ENERGY:** 2 (tarjetas con bordes definidos `#24242C`, realces en rosa neon `#FF2E93` en elementos activos o en hover, y reticulas de encuadre en el monitor de video).
- **RHYTHM:** 2 (diseno asimetrico optimizado: en `CAM`, dock izquierdo de seleccion rapida y monitor hero central; en `EXPLORE`, rejilla fluida con filtros horizontales; en `CREATE`, barra lateral de atributos por acordeon y lienzo de previsualizacion con marco discontinuo).
- **MOTION:** 1 (transiciones rapidas de estado 150ms-200ms sin rebotes ni movimientos flotantes).

## Paleta Verificada WCAG AA (R-01, R-25, R-29)
- **Fondo General (`--bg`):** `#0A0A0C` (negro estudio profundo)
- **Superficie de Paneles (`--surface`):** `#121216` (contraste texto `#FFFFFF` = `19.78:1`)
- **Superficie de Tarjetas (`--surface-card`):** `#18181F`
- **Dock Lateral (`--surface-dock`):** `#111115`
- **Acento Rosa Neon (`--accent-pink`):** `#FF2E93` (contraste con `#0A0A0C` = `5.71:1` -> PASS WCAG AA)
- **Acento Rosa Profundo (`--accent-pink-deep`):** `#D81B60` (contraste con texto blanco `#FFFFFF` = `4.95:1` -> PASS WCAG AA)
- **Bordes Estructurales (`--border-dark`):** `#24242C`
- **Texto Principal (`--text-white`):** `#FFFFFF`
- **Texto Secundario (`--text-muted`):** `#8E8E93` (`6.21:1` sobre `#0A0A0C`)
- **Badges y Estados:** Activo `#34D399` (verde esmeralda), Alerta/Standby `#FF2E93` / `#F59E0B`.

## Componentes Clave Replicados
1. **Top Header**: Logotipo estilizado `MiPlataformaStream`, selector de navegacion principal (`CAM`, `EXPLORE`, `CREATE`, `MODULOS PRO`, `COMMUNITY`), badges de estado (`STREAMER MODE` en amarillo ambar, `GET PLUS` en rosa y avatar de usuario).
2. **CAM Workspace**:
   - Barra superior de aviso: Banner pildora para conectar a OBS o camara virtual.
   - Dock lateral izquierdo: Textarea para prompt personalizado con boton magico y limpiar, boton `EXECUTE` en rosa neon, barra de iconos por categoria (Personaje, Ropa, Efectos, Tijeras), recuadro de trazo discontinuo `+ ADD NEW`, y rejilla de tarjetas en 2 columnas con retratos.
   - Monitor Central Hero: Visor con 4 reticulas esquineras en rosa neon (`[ ]`), indicador `+ STANDBY` / `EN VIVO`, barra de controles integrada al pie (duracion de sesion, seleccion de camara, seleccion de microfono, vumetro de nivel de audio en vivo, boton de vista dividida y barra de progreso de sesion).
3. **EXPLORE Workspace**: Sub-filtros (`All`, `Characters`, `Outfits`, `Props`), buscador rapido, conmutador `NSFW: OFF`, contador de elementos, y rejilla responsiva de tarjetas con imagen de portada, insignia de me gusta `♥`, titulo y autor.
4. **CREATE Workspace**: Botones de seleccion dual (`FROM SCRATCH` con lapiz vs `FROM IMAGE` con subida), subcategorias iconicas, y acordeones de etiquetas interactivas (Tipo, Genero, Edad, Etnicidad, Ojos, Rasgos, Estilo, Atuendo) que al hacer clic se incorporan instantaneamente al prompt, cerrando con el boton de accion `CREATE` conectado a `lucy-image-2`.
5. **MODULOS PRO Workspace**: Sub-pestanas que dan acceso directo al probador virtual Try-On, procesamiento asincrono de clips, configuracion de OBS v5 y modulacion de voz / pasarela Wompi.

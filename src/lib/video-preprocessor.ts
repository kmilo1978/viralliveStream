export type CropAspectMode = "16:9" | "9:16" | "1:1" | "4:3" | "zoom";

export type VideoPreprocessorOptions = {
  fps: 15 | 24 | 25 | 30;
  mirror: boolean;
  freeze: boolean;
  cropMode: CropAspectMode;
  chromaKey?: boolean;
  chromaSimilarity?: number; // 0.15 a 0.85 (default: 0.35)
  chromaSmoothness?: number; // 0.05 a 0.30 (default: 0.12)
  spillReduction?: boolean; // default: true
  bgMediaUrl?: string | null;
  bgMediaType?: "image" | "video" | "none";
};

function dimensionsForCrop(cropMode: CropAspectMode): { width: number; height: number } {
  if (cropMode === "9:16") {
    return { width: 720, height: 1280 };
  }
  if (cropMode === "1:1") {
    return { width: 720, height: 720 };
  }
  if (cropMode === "4:3") {
    return { width: 960, height: 720 };
  }
  return { width: 1280, height: 720 };
}

/**
 * Preprocesador en navegador que aplica:
 * - Espejo, congelado de cuadro, recorte de relación de aspecto (16:9, 9:16, 1:1, 4:3, zoom)
 * - Chroma Key / Pantalla Verde en tiempo real con supresión de halo verde (despill)
 * - Composición de Fondos Virtuales (fotos o videos en bucle) detrás del streamer
 * - Control de FPS para salida WebRTC, monitor local y OBS Virtual Camera
 */
export class BrowserVideoPreprocessor {
  private sourceStream: MediaStream;
  private videoEl: HTMLVideoElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private outputStream: MediaStream;
  private timerId: number | null = null;
  private options: VideoPreprocessorOptions;
  private disposed = false;

  // Canvas auxiliar offscreen para recortar la silueta en Chroma Key
  private offscreenCanvas: HTMLCanvasElement | null = null;
  private offscreenCtx: CanvasRenderingContext2D | null = null;

  // Elementos de medios de fondo (foto o video en bucle)
  private bgImage: HTMLImageElement | null = null;
  private bgVideo: HTMLVideoElement | null = null;
  private currentBgUrl: string | null = null;
  private currentBgType: "image" | "video" | "none" = "none";

  constructor(sourceStream: MediaStream, initialOptions: VideoPreprocessorOptions) {
    this.sourceStream = sourceStream;
    this.options = { ...initialOptions };

    const dims = dimensionsForCrop(this.options.cropMode);
    this.canvas = document.createElement("canvas");
    this.canvas.width = dims.width;
    this.canvas.height = dims.height;

    const context = this.canvas.getContext("2d");
    if (!context) {
      throw new Error("Tu navegador no soporta canvas 2D para preprocesar video.");
    }
    this.ctx = context;

    this.videoEl = document.createElement("video");
    this.videoEl.muted = true;
    this.videoEl.playsInline = true;
    this.videoEl.autoplay = true;
    // Anclar elemento en el DOM de forma invisible para que Chromium nunca pause la decodificación por optimización
    this.videoEl.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;z-index:-9999;";
    this.videoEl.srcObject = sourceStream;
    if (typeof document !== "undefined" && document.body) {
      document.body.appendChild(this.videoEl);
    }
    void this.videoEl.play().catch(() => {});

    this.outputStream = this.canvas.captureStream(this.options.fps);
    for (const audioTrack of sourceStream.getAudioTracks()) {
      this.outputStream.addTrack(audioTrack);
    }

    if (this.options.chromaKey) {
      this.syncBackgroundMedia();
    }

    this.startLoop();
  }

  getStream(): MediaStream {
    return this.outputStream;
  }

  updateOptions(next: Partial<VideoPreprocessorOptions>): {
    needsTrackReplace: boolean;
    stream: MediaStream;
  } {
    const prevCrop = this.options.cropMode;
    const prevFps = this.options.fps;
    this.options = { ...this.options, ...next };

    const prevDims = dimensionsForCrop(prevCrop);
    const nextDims = dimensionsForCrop(this.options.cropMode);
    const dimsChanged = prevDims.width !== nextDims.width || prevDims.height !== nextDims.height;

    if (dimsChanged) {
      this.canvas.width = nextDims.width;
      this.canvas.height = nextDims.height;
      if (this.offscreenCanvas) {
        this.offscreenCanvas.width = nextDims.width;
        this.offscreenCanvas.height = nextDims.height;
      }
    }

    if (this.options.chromaKey) {
      this.syncBackgroundMedia();
    }

    let needsTrackReplace = false;
    if (dimsChanged || prevFps !== this.options.fps) {
      const prevVideoTracks = this.outputStream.getVideoTracks();
      const audioTracks = this.outputStream.getAudioTracks();
      const freshStream = this.canvas.captureStream(this.options.fps);
      for (const t of audioTracks) freshStream.addTrack(t);
      prevVideoTracks.forEach((t) => t.stop());
      this.outputStream = freshStream;
      needsTrackReplace = true;
      this.startLoop();
    }

    return { needsTrackReplace, stream: this.outputStream };
  }

  replaceAudioTracks(audioStream: MediaStream | null): void {
    const existingAudio = this.outputStream.getAudioTracks();
    existingAudio.forEach((t) => {
      this.outputStream.removeTrack(t);
    });
    const nextAudio = audioStream?.getAudioTracks() ?? this.sourceStream.getAudioTracks();
    for (const track of nextAudio) {
      this.outputStream.addTrack(track);
    }
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
    this.outputStream.getVideoTracks().forEach((t) => t.stop());
    this.videoEl.srcObject = null;
    if (this.videoEl.parentNode) {
      this.videoEl.parentNode.removeChild(this.videoEl);
    }

    if (this.bgVideo) {
      this.bgVideo.pause();
      this.bgVideo.src = "";
      this.bgVideo = null;
    }
    this.bgImage = null;
    this.offscreenCanvas = null;
    this.offscreenCtx = null;
  }

  private syncBackgroundMedia(): void {
    const url = this.options.bgMediaUrl || null;
    const type = this.options.bgMediaType || "none";

    if (url === this.currentBgUrl && type === this.currentBgType) return;

    this.currentBgUrl = url;
    this.currentBgType = type;

    if (this.bgVideo) {
      this.bgVideo.pause();
      this.bgVideo.src = "";
      this.bgVideo = null;
    }
    this.bgImage = null;

    if (!url || type === "none") return;

    if (type === "video") {
      const vid = document.createElement("video");
      vid.crossOrigin = "anonymous";
      vid.loop = true;
      vid.muted = true;
      vid.playsInline = true;
      vid.autoplay = true;
      vid.src = url;
      void vid.play().catch(() => {});
      this.bgVideo = vid;
    } else if (type === "image") {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = url;
      this.bgImage = img;
    }
  }

  private startLoop(): void {
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
    }
    const intervalMs = Math.max(16, Math.round(1000 / this.options.fps));
    this.timerId = window.setInterval(() => this.drawFrame(), intervalMs);
    this.drawFrame();
  }

  private drawCover(
    ctx: CanvasRenderingContext2D,
    media: HTMLImageElement | HTMLVideoElement,
    cw: number,
    ch: number,
  ): void {
    const mw = "naturalWidth" in media ? media.naturalWidth : media.videoWidth;
    const mh = "naturalHeight" in media ? media.naturalHeight : media.videoHeight;
    if (!mw || !mh) return;

    const mediaAspect = mw / mh;
    const canvasAspect = cw / ch;

    let sx = 0;
    let sy = 0;
    let sw = mw;
    let sh = mh;

    if (mediaAspect > canvasAspect) {
      sw = Math.round(mh * canvasAspect);
      sx = Math.round((mw - sw) / 2);
    } else {
      sh = Math.round(mw / canvasAspect);
      sy = Math.round((mh - sh) / 2);
    }
    ctx.drawImage(media, sx, sy, sw, sh, 0, 0, cw, ch);
  }

  private drawFrame(): void {
    if (this.disposed || this.options.freeze) return;
    const vw = this.videoEl.videoWidth;
    const vh = this.videoEl.videoHeight;
    if (vw === 0 || vh === 0) return;

    const cw = this.canvas.width;
    const ch = this.canvas.height;
    const targetAspect = cw / ch;
    const srcAspect = vw / vh;

    let sx = 0;
    let sy = 0;
    let sw = vw;
    let sh = vh;

    if (srcAspect > targetAspect) {
      sw = Math.round(vh * targetAspect);
      sx = Math.round((vw - sw) / 2);
    } else if (srcAspect < targetAspect) {
      sh = Math.round(vw / targetAspect);
      sy = Math.round((vh - sh) / 2);
    }

    if (this.options.cropMode === "zoom") {
      const zoomFactor = 1.32;
      const zW = Math.round(sw / zoomFactor);
      const zH = Math.round(sh / zoomFactor);
      sx += Math.round((sw - zW) / 2);
      sy += Math.round((sh - zH) / 2);
      sw = zW;
      sh = zH;
    }

    // Modo Chroma Key activo: Recorta el verde y proyecta el fondo detrás de la persona
    if (this.options.chromaKey) {
      this.syncBackgroundMedia();

      if (!this.offscreenCanvas) {
        this.offscreenCanvas = document.createElement("canvas");
        this.offscreenCtx = this.offscreenCanvas.getContext("2d", { willReadFrequently: true });
      }
      if (this.offscreenCanvas.width !== cw || this.offscreenCanvas.height !== ch) {
        this.offscreenCanvas.width = cw;
        this.offscreenCanvas.height = ch;
      }

      if (this.offscreenCtx) {
        // 1. Dibujar cámara en canvas auxiliar
        this.offscreenCtx.save();
        this.offscreenCtx.clearRect(0, 0, cw, ch);
        if (this.options.mirror) {
          this.offscreenCtx.translate(cw, 0);
          this.offscreenCtx.scale(-1, 1);
        }
        this.offscreenCtx.drawImage(this.videoEl, sx, sy, sw, sh, 0, 0, cw, ch);
        this.offscreenCtx.restore();

        // 2. Extraer pixels y aplicar filtro Chroma Key
        const imgData = this.offscreenCtx.getImageData(0, 0, cw, ch);
        const data = imgData.data;
        const total = data.length;
        const sim = this.options.chromaSimilarity ?? 0.35;
        const smooth = this.options.chromaSmoothness ?? 0.12;
        const despill = this.options.spillReduction !== false;

        for (let i = 0; i < total; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          const maxRB = r > b ? r : b;
          const diff = (g - maxRB) / 255;

          if (diff > sim) {
            // Fondo verde detectado: hacer transparente
            data[i + 3] = 0;
          } else if (diff > sim - smooth) {
            // Transición suave antialias
            const alphaFactor = (sim - diff) / smooth;
            data[i + 3] = Math.round(255 * alphaFactor);
            if (despill && g > maxRB) {
              data[i + 1] = maxRB;
            }
          } else if (despill && g > maxRB) {
            // Despill en bordes de cabello y hombros
            data[i + 1] = maxRB;
          }
        }
        this.offscreenCtx.putImageData(imgData, 0, 0);

        // 3. Componer lienzo final: FONDO DETRÁS, PERSONA DELANTE
        this.ctx.save();
        this.ctx.clearRect(0, 0, cw, ch);

        let bgDrawn = false;
        if (this.bgVideo && !this.bgVideo.paused && this.bgVideo.videoWidth > 0) {
          this.drawCover(this.ctx, this.bgVideo, cw, ch);
          bgDrawn = true;
        } else if (this.bgImage && this.bgImage.complete && this.bgImage.naturalWidth > 0) {
          this.drawCover(this.ctx, this.bgImage, cw, ch);
          bgDrawn = true;
        }

        if (!bgDrawn) {
          // Fondo verde de estudio por defecto (#00FF00) si no hay imagen
          this.ctx.fillStyle = "#00FF00";
          this.ctx.fillRect(0, 0, cw, ch);
        }

        // Superponer persona recortada
        this.ctx.drawImage(this.offscreenCanvas, 0, 0);
        this.ctx.restore();
        return;
      }
    }

    // Modo normal sin Chroma Key
    this.ctx.save();
    this.ctx.clearRect(0, 0, cw, ch);
    if (this.options.mirror) {
      this.ctx.translate(cw, 0);
      this.ctx.scale(-1, 1);
    }
    this.ctx.drawImage(this.videoEl, sx, sy, sw, sh, 0, 0, cw, ch);
    this.ctx.restore();
  }
}

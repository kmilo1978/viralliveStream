export type CropAspectMode = "16:9" | "9:16" | "1:1" | "4:3" | "zoom";

export type VideoPreprocessorOptions = {
  fps: 15 | 24 | 25 | 30;
  mirror: boolean;
  freeze: boolean;
  cropMode: CropAspectMode;
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
 * Preprocesador limpio en navegador (clean-room) que aplica espejo, congelado de cuadro,
 * recorte vertical 9:16 / zoom 1.3x y limite de FPS antes de enviar a WebRTC.
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
    this.videoEl.srcObject = sourceStream;
    void this.videoEl.play().catch(() => {});

    this.outputStream = this.canvas.captureStream(this.options.fps);
    for (const audioTrack of sourceStream.getAudioTracks()) {
      this.outputStream.addTrack(audioTrack);
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
  }

  private startLoop(): void {
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
    }
    const intervalMs = Math.max(16, Math.round(1000 / this.options.fps));
    this.timerId = window.setInterval(() => this.drawFrame(), intervalMs);
    this.drawFrame();
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

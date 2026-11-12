export type LocalVoiceFxPreset = "bypass" | "radio" | "robot" | "echo" | "deep";

export const LOCAL_VOICE_PRESETS: Array<{
  id: LocalVoiceFxPreset;
  label: string;
  description: string;
}> = [
  { id: "bypass", label: "Natural (Sin efecto)", description: "Audio original del microfono." },
  { id: "radio", label: "Radio / Podcast", description: "Voz calida comprimida estilo cabina." },
  { id: "robot", label: "Robot / Cibernetico", description: "Modulacion metalica en tiempo real." },
  { id: "echo", label: "Eco / Espacio", description: "Reverberacion corta para efectos." },
  { id: "deep", label: "Grave Profundo", description: "Refuerzo de graves y filtro calido." },
];

/**
 * Procesador de voz local en navegador usando Web Audio API (sin costo de API externa).
 */
export class LiveVoiceFxEngine {
  private ctx: AudioContext | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private dest: MediaStreamAudioDestinationNode | null = null;
  private monitorGain: GainNode | null = null;
  private micStream: MediaStream | null = null;
  private activeNodes: AudioNode[] = [];
  private oscNode: OscillatorNode | null = null;
  private preset: LocalVoiceFxPreset = "bypass";
  private monitorEnabled = false;

  async start(preset: LocalVoiceFxPreset, monitor = false): Promise<MediaStream> {
    this.stop();
    const mic = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: false,
    });
    this.micStream = mic;
    const ctx = new AudioContext();
    this.ctx = ctx;
    if (ctx.state === "suspended") {
      await ctx.resume();
    }

    this.source = ctx.createMediaStreamSource(mic);
    this.dest = ctx.createMediaStreamDestination();
    this.monitorGain = ctx.createGain();
    this.monitorGain.gain.value = monitor ? 0.9 : 0;
    this.monitorGain.connect(ctx.destination);
    this.monitorEnabled = monitor;

    this.applyPreset(preset);
    return this.dest.stream;
  }

  getProcessedStream(): MediaStream | null {
    return this.dest?.stream ?? null;
  }

  setMonitor(enabled: boolean): void {
    this.monitorEnabled = enabled;
    if (this.monitorGain && this.ctx) {
      this.monitorGain.gain.setTargetAtTime(enabled ? 0.9 : 0, this.ctx.currentTime, 0.02);
    }
  }

  applyPreset(nextPreset: LocalVoiceFxPreset): void {
    this.preset = nextPreset;
    if (!this.ctx || !this.source || !this.dest || !this.monitorGain) return;

    this.clearFxGraph();

    const connectOutput = (tail: AudioNode) => {
      if (!this.dest || !this.monitorGain) return;
      tail.connect(this.dest);
      tail.connect(this.monitorGain);
    };

    if (nextPreset === "bypass") {
      connectOutput(this.source);
      return;
    }

    if (nextPreset === "radio") {
      const highpass = this.ctx.createBiquadFilter();
      highpass.type = "highpass";
      highpass.frequency.value = 180;

      const lowpass = this.ctx.createBiquadFilter();
      lowpass.type = "lowpass";
      lowpass.frequency.value = 3400;

      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -24;
      comp.ratio.value = 8;

      this.source.connect(highpass);
      highpass.connect(lowpass);
      lowpass.connect(comp);
      connectOutput(comp);
      this.activeNodes = [highpass, lowpass, comp];
      return;
    }

    if (nextPreset === "deep") {
      const lowShelf = this.ctx.createBiquadFilter();
      lowShelf.type = "lowshelf";
      lowShelf.frequency.value = 220;
      lowShelf.gain.value = 12;

      const lowpass = this.ctx.createBiquadFilter();
      lowpass.type = "lowpass";
      lowpass.frequency.value = 1800;

      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -20;
      comp.ratio.value = 4;

      this.source.connect(lowShelf);
      lowShelf.connect(lowpass);
      lowpass.connect(comp);
      connectOutput(comp);
      this.activeNodes = [lowShelf, lowpass, comp];
      return;
    }

    if (nextPreset === "echo") {
      const dry = this.ctx.createGain();
      dry.gain.value = 0.85;
      const delay = this.ctx.createDelay(1.0);
      delay.delayTime.value = 0.22;
      const feedback = this.ctx.createGain();
      feedback.gain.value = 0.35;
      const mix = this.ctx.createGain();

      this.source.connect(dry);
      dry.connect(mix);

      this.source.connect(delay);
      delay.connect(feedback);
      feedback.connect(delay);
      delay.connect(mix);

      connectOutput(mix);
      this.activeNodes = [dry, delay, feedback, mix];
      return;
    }

    // "robot": ring modulator
    const carrier = this.ctx.createOscillator();
    carrier.type = "sawtooth";
    carrier.frequency.value = 58;
    const modGain = this.ctx.createGain();
    modGain.gain.value = 0;
    const carrierDepth = this.ctx.createGain();
    carrierDepth.gain.value = 0.9;
    carrier.connect(carrierDepth);
    carrierDepth.connect(modGain.gain);
    carrier.start();
    this.oscNode = carrier;

    this.source.connect(modGain);
    connectOutput(modGain);
    this.activeNodes = [modGain, carrierDepth];
  }

  getPreset(): LocalVoiceFxPreset {
    return this.preset;
  }

  isMonitorEnabled(): boolean {
    return this.monitorEnabled;
  }

  stop(): void {
    this.clearFxGraph();
    this.source?.disconnect();
    this.source = null;
    this.dest = null;
    this.monitorGain = null;
    if (this.ctx) {
      void this.ctx.close().catch(() => {});
      this.ctx = null;
    }
    this.micStream?.getTracks().forEach((t) => t.stop());
    this.micStream = null;
  }

  private clearFxGraph(): void {
    if (this.oscNode) {
      try {
        this.oscNode.stop();
        this.oscNode.disconnect();
      } catch {}
      this.oscNode = null;
    }
    try {
      this.source?.disconnect();
    } catch {}
    for (const node of this.activeNodes) {
      try {
        node.disconnect();
      } catch {}
    }
    this.activeNodes = [];
  }
}

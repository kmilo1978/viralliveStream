"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  GARMENT_EXTRACT_PROMPT,
  TRYON_TEMPLATES,
  type TryOnGarmentItem,
  type TryOnTemplate,
  type UsageLedgerEntry,
  DEFAULT_VIRTUAL_BACKGROUNDS,
  type VirtualBackgroundItem,
  RECORDING_RESOLUTIONS,
  type RecordingResolution,
} from "@/lib/studio-data";
import { Dashicon } from "@/components/Dashicons";

type TryOnStudioPanelProps = {
  sourceReady: boolean;
  isLive: boolean;
  isConnectedLive: boolean;
  sourceMode?: "camera" | "video_file";
  setSourceMode?: (mode: "camera" | "video_file") => void;
  localVideoFileUrl?: string | null;
  onVideoFileSelected?: (file: File | null) => void;
  startCamera?: () => Promise<void>;
  localStream?: MediaStream | null;
  remoteStream?: MediaStream | null;
  tryOnGarments?: TryOnGarmentItem[];
  selectedGarmentId?: string | null;
  onSelectGarment?: (garment: TryOnGarmentItem) => void;
  onAddCustomGarment?: (file: File) => void;
  onDeleteCustomGarment?: (id: string, e: React.MouseEvent) => void;
  onApplyTryOnLive: (opts: { prompt: string; garmentFile: File | null }) => Promise<void>;
  onStartTryOnSession: (opts: {
    prompt: string;
    garmentFile: File | null;
    verticalMirror: boolean;
  }) => Promise<void>;
  onStopTryOnSession?: () => void;
  onLogUsage: (entry: Omit<UsageLedgerEntry, "id" | "createdAt">) => void;
  onRefreshAccount: () => void;
  listenRemoteAudio?: boolean;
  onToggleRemoteAudio?: () => void;
};

export function TryOnStudioPanel({
  sourceReady,
  isLive,
  isConnectedLive,
  sourceMode = "camera",
  setSourceMode,
  localVideoFileUrl,
  onVideoFileSelected,
  startCamera,
  localStream,
  remoteStream,
  tryOnGarments = [],
  selectedGarmentId,
  onSelectGarment,
  onAddCustomGarment,
  onDeleteCustomGarment,
  onApplyTryOnLive,
  onStartTryOnSession,
  onStopTryOnSession,
  onLogUsage,
  onRefreshAccount,
  listenRemoteAudio = true,
  onToggleRemoteAudio,
}: TryOnStudioPanelProps) {
  const [slotFilter, setSlotFilter] = useState<"Todos" | TryOnTemplate["slot"]>("Todos");
  const [prompt, setPrompt] = useState<string>(TRYON_TEMPLATES[2].prompt);
  const [garmentFile, setGarmentFile] = useState<File | null>(null);
  const [garmentPreviewUrl, setGarmentPreviewUrl] = useState<string | null>(null);
  const [extractedPreviewUrl, setExtractedPreviewUrl] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [verticalMirror, setVerticalMirror] = useState(false);
  const [builderTop, setBuilderTop] = useState("black leather bomber jacket");
  const [builderAccessory, setBuilderAccessory] = useState("none");
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fondos Virtuales en el Probador
  const [virtualBackgrounds, setVirtualBackgrounds] = useState<VirtualBackgroundItem[]>(DEFAULT_VIRTUAL_BACKGROUNDS);
  const [selectedBgId, setSelectedBgId] = useState<string>("bg-chroma-green");
  const panelBgUploadRef = useRef<HTMLInputElement | null>(null);

  // Grabación de Video en Probador Virtual
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [recordingResolution, setRecordingResolution] = useState<RecordingResolution>("720p");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isRecording) {
      timer = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRecording]);

  // Aplicar Chroma Green como sufijo inicial si no está presente
  useEffect(() => {
    const chromaBg = virtualBackgrounds.find((b) => b.id === "bg-chroma-green");
    if (chromaBg && chromaBg.promptSuffix) {
      setPrompt((prev) => {
        if (!prev) return chromaBg.promptSuffix;
        if (prev.includes(chromaBg.promptSuffix)) return prev;
        return `${prev}, ${chromaBg.promptSuffix}`;
      });
    }
  }, [virtualBackgrounds]);

  const startRecording = useCallback(() => {
    const videoEl = isConnectedLive ? panelRemoteVideoRef.current : panelLocalVideoRef.current;
    if (!videoEl) {
      alert("No hay señal de video activa en el probador para grabar.");
      return;
    }
    try {
      let stream: MediaStream | null = null;
      if (localStream && localStream.getVideoTracks().length > 0) {
        stream = localStream;
      }
      if (!stream) {
        const capturedEl = videoEl as HTMLVideoElement & {
          captureStream?: (fps?: number) => MediaStream;
        };
        if (typeof capturedEl.captureStream === "function") {
          try {
            const s = capturedEl.captureStream(30);
            if (s && s.getVideoTracks().length > 0) stream = s;
          } catch {}
        }
      }
      if (!stream || stream.getVideoTracks().length === 0) {
        const fallbackCanvas = document.createElement("canvas");
        fallbackCanvas.width = recordingResolution === "4k" ? 3840 : recordingResolution === "1080p" ? 1920 : 1280;
        fallbackCanvas.height = recordingResolution === "4k" ? 2160 : recordingResolution === "1080p" ? 1080 : 720;
        const ctx = fallbackCanvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#0A0A10";
          ctx.fillRect(0, 0, fallbackCanvas.width, fallbackCanvas.height);
        }
        stream = fallbackCanvas.captureStream(30);
      }

      recordedChunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm";

      const bps =
        recordingResolution === "4k"
          ? 16000000
          : recordingResolution === "1080p"
          ? 7000000
          : recordingResolution === "720p"
          ? 3500000
          : 1500000;

      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: bps,
      });

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `grabacion_probador_${recordingResolution}_${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setStatusMsg(`🎉 Video del probador guardado en resolución ${recordingResolution}.`);
        setTimeout(() => setStatusMsg(null), 5000);
      };

      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingDuration(0);
    } catch (err) {
      alert(`Error al iniciar grabación en probador: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [isConnectedLive, localStream, recordingResolution]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }, []);


  const handleSelectBackground = useCallback(
    async (bg: VirtualBackgroundItem) => {
      setSelectedBgId(bg.id);
      let nextPrompt = prompt;
      virtualBackgrounds.forEach((b) => {
        if (b.promptSuffix && nextPrompt.includes(b.promptSuffix)) {
          nextPrompt = nextPrompt.replace(`, ${b.promptSuffix}`, "").replace(b.promptSuffix, "").trim();
        }
      });
      if (bg.promptSuffix) {
        nextPrompt = `${nextPrompt.replace(/,\s*$/, "")}, ${bg.promptSuffix}`;
      }
      setPrompt(nextPrompt);

      if (isConnectedLive) {
        try {
          await onApplyTryOnLive({ prompt: nextPrompt, garmentFile });
          setStatusMsg(`Fondo de escenario aplicado en vivo: ${bg.name}`);
        } catch (e) {
          console.error("Error aplicando fondo en probador:", e);
        }
      }
    },
    [garmentFile, isConnectedLive, onApplyTryOnLive, prompt, virtualBackgrounds],
  );

  const handleAddCustomBackground = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const cleanName = file.name.replace(/\.[^/.]+$/, "").slice(0, 18);
        const newBg: VirtualBackgroundItem = {
          id: `custom-bg-${Date.now()}`,
          name: cleanName || "Mi Fondo",
          category: "Personalizado",
          thumbnailSvg: "",
          customImageUrl: dataUrl,
          isCustom: true,
          promptSuffix:
            "in a customized room setting with lighting matching the uploaded background image",
          previewColor: "#3B82F6",
        };
        setVirtualBackgrounds((prev) => [...prev, newBg]);
        void handleSelectBackground(newBg);
      };
      reader.readAsDataURL(file);
    },
    [handleSelectBackground],
  );

  const handleDeleteCustomBackground = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setVirtualBackgrounds((prev) => prev.filter((b) => b.id !== id));
      if (selectedBgId === id) setSelectedBgId("bg-none");
    },
    [selectedBgId],
  );

  // Referencias a los videos en vivo dentro del probador
  const panelLocalVideoRef = useRef<HTMLVideoElement | null>(null);
  const panelRemoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const fileUploadInputRef = useRef<HTMLInputElement | null>(null);

  // Vincular flujo local
  useEffect(() => {
    if (panelLocalVideoRef.current && localStream) {
      panelLocalVideoRef.current.srcObject = localStream;
      panelLocalVideoRef.current.play().catch(() => {});
    }
  }, [localStream]);

  // Vincular flujo remoto de Decart
  useEffect(() => {
    if (panelRemoteVideoRef.current && remoteStream) {
      panelRemoteVideoRef.current.srcObject = remoteStream;
      panelRemoteVideoRef.current.muted = !listenRemoteAudio;
      panelRemoteVideoRef.current.volume = 1.0;
      panelRemoteVideoRef.current.play().catch(() => {});
    }
  }, [listenRemoteAudio, remoteStream]);

  useEffect(() => {
    return () => {
      if (garmentPreviewUrl) URL.revokeObjectURL(garmentPreviewUrl);
      if (extractedPreviewUrl) URL.revokeObjectURL(extractedPreviewUrl);
    };
  }, [extractedPreviewUrl, garmentPreviewUrl]);

  const visibleTemplates =
    slotFilter === "Todos"
      ? TRYON_TEMPLATES
      : TRYON_TEMPLATES.filter((t) => t.slot === slotFilter);

  const handleGarmentUpload = useCallback(
    (file: File | null) => {
      setErrorMsg(null);
      setStatusMsg(null);
      if (garmentPreviewUrl) URL.revokeObjectURL(garmentPreviewUrl);
      if (!file) {
        setGarmentFile(null);
        setGarmentPreviewUrl(null);
        return;
      }
      setGarmentFile(file);
      setGarmentPreviewUrl(URL.createObjectURL(file));
      if (!prompt.toLowerCase().includes("reference image")) {
        setPrompt(TRYON_TEMPLATES[0].prompt);
      }
      setStatusMsg(
        "Prenda cargada. Si la foto tiene un modelo puesto, usa 'Extraer solo la prenda' antes de iniciar.",
      );
    },
    [garmentPreviewUrl, prompt],
  );

  const handleExtractGarment = useCallback(async () => {
    if (!garmentFile) {
      setErrorMsg("Primero sube la foto de la prenda o del modelo con la ropa.");
      return;
    }
    setExtracting(true);
    setErrorMsg(null);
    setStatusMsg(null);

    try {
      const form = new FormData();
      form.append("prompt", GARMENT_EXTRACT_PROMPT);
      form.append("resolution", "480p");
      form.append("data", garmentFile);

      const res = await fetch("/api/process-image", { method: "POST", body: form });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error || "No se pudo extraer la prenda con lucy-image-2.");
      }

      const blob = await res.blob();
      const cleanFile = new File([blob], "prenda-limpia.png", { type: "image/png" });
      if (extractedPreviewUrl) URL.revokeObjectURL(extractedPreviewUrl);
      const url = URL.createObjectURL(blob);
      setExtractedPreviewUrl(url);
      setGarmentFile(cleanFile);
      if (garmentPreviewUrl) URL.revokeObjectURL(garmentPreviewUrl);
      setGarmentPreviewUrl(URL.createObjectURL(cleanFile));
      setPrompt(TRYON_TEMPLATES[0].prompt);
      setStatusMsg("Prenda aislada sobre fondo blanco (1 crédito) y lista para lucy-vton-3.6.");

      onLogUsage({
        kind: "image",
        modelId: "lucy-image-2",
        detail: "Extracción de prenda limpia Try-On (480p)",
        decartCredits: 1,
        usdCost: 0.01,
        copCost: 42,
      });
      onRefreshAccount();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error extrayendo prenda.");
    } finally {
      setExtracting(false);
    }
  }, [extractedPreviewUrl, garmentFile, garmentPreviewUrl, onLogUsage, onRefreshAccount]);

  const applyOutfitBuilder = useCallback(() => {
    const accClause =
      builderAccessory === "none" ? "" : ` Add ${builderAccessory} matching the outfit.`;
    const nextPrompt = `Substitute the current top with a ${builderTop}, preserving natural folds, lighting, and movement.${accClause}`;
    setPrompt(nextPrompt);
    setStatusMsg("Prompt de combinación Outfit Builder generado en inglés.");
  }, [builderAccessory, builderTop]);

  const handleRunTryOn = useCallback(async () => {
    setErrorMsg(null);
    setStatusMsg(null);
    if (!sourceReady) {
      setErrorMsg(
        "Primero activa la cámara web o carga un video pregrabado (MP4).",
      );
      return;
    }
    if (isConnectedLive) {
      await onApplyTryOnLive({ prompt, garmentFile });
      setStatusMsg("Prenda aplicada en vivo en el probador.");
    } else if (!isLive) {
      await onStartTryOnSession({ prompt, garmentFile, verticalMirror });
    } else {
      setErrorMsg("Espera unos segundos a que termine de conectar la sesión actual.");
    }
  }, [
    garmentFile,
    isConnectedLive,
    isLive,
    onApplyTryOnLive,
    onStartTryOnSession,
    prompt,
    sourceReady,
    verticalMirror,
  ]);

  return (
    <div className="cockpit-grid">
      {/* -------------------------------------------------------------
          MONITOR DE ESPEJO EN VIVO CON CARRUSEL DE PRENDAS (ESTILO DELULU & ESPEJO)
          ------------------------------------------------------------- */}
      <section className="studio-card" style={{ gridColumn: "1 / -1" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
          <div>
            <h2 style={{ margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <Dashicon name="products" size={20} color="#EC4899" />
              <span>Monitor de Probador Virtual en Vivo</span>
              <span className="nav-badge-new">lucy-vton-3.6</span>
            </h2>
            <p className="muted-copy" style={{ margin: "4px 0 0 0" }}>
              Prueba ropa en tiempo real sobre tu cámara web o sobre un video MP4 pregrabado en bucle.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {/* Selector de fuente */}
            {setSourceMode && (
              <select
                className="select-ctrl-pill"
                value={sourceMode}
                onChange={(e) => {
                  const m = e.target.value as "camera" | "video_file";
                  setSourceMode(m);
                  if (m === "camera" && startCamera) void startCamera();
                }}
              >
                <option value="camera">Cámara Web</option>
                <option value="video_file">Video MP4 (Bucle)</option>
              </select>
            )}

            {/* Cargar video pregrabado si aplica */}
            {sourceMode === "video_file" && onVideoFileSelected && (
              <label className="pill-ctrl-button" style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5 }}>
                <Dashicon name="upload" size={13} />
                <span>{localVideoFileUrl ? "Cambiar Video" : "Cargar MP4"}</span>
                <input
                  type="file"
                  accept="video/mp4,video/webm"
                  style={{ display: "none" }}
                  onChange={(e) => onVideoFileSelected(e.target.files?.[0] ?? null)}
                />
              </label>
            )}

            {/* Botón de audio */}
            {onToggleRemoteAudio && (
              <button
                className={`pill-ctrl-button ${listenRemoteAudio ? "active-pink" : ""}`}
                style={{ display: "inline-flex", alignItems: "center", gap: 5 }}
                onClick={onToggleRemoteAudio}
                title={listenRemoteAudio ? "Sonido activo al hablar" : "Sonido silenciado"}
              >
                <Dashicon name={listenRemoteAudio ? "controls-volumeon" : "controls-volumeoff"} size={13} />
                <span>{listenRemoteAudio ? "Sonido ON" : "Sonido Muted"}</span>
              </button>
            )}

                        {/* Grabación de Video en Probador Virtual */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(18, 18, 28, 0.8)", padding: "2px 8px", borderRadius: 8, border: "1px solid #374151" }}>
              {isRecording ? (
                <div className="rec-pulse-indicator" style={{ padding: "2px 8px" }}>
                  <span className="rec-pulse-dot" />
                  <span style={{ fontSize: "0.72rem", fontWeight: 800 }}>
                    REC {Math.floor(recordingDuration / 60).toString().padStart(2, "0")}:
                    {(recordingDuration % 60).toString().padStart(2, "0")}
                  </span>
                </div>
              ) : (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.72rem", color: "#9CA3AF", fontWeight: 700 }}>
                  <Dashicon name="video-alt2" size={13} /> REC:
                </span>
              )}

              <select
                className="select-ctrl-pill"
                style={{ borderColor: "#10B981", fontSize: "0.72rem", padding: "2px 6px" }}
                value={recordingResolution}
                onChange={(e) => setRecordingResolution(e.target.value as RecordingResolution)}
                title="Resolución de grabación del probador"
              >
                <option value="480p">480p</option>
                <option value="720p">720p</option>
                <option value="1080p">1080p</option>
                <option value="4k">4K</option>
              </select>

              {isRecording ? (
                <button
                  type="button"
                  className="btn-record-action recording"
                  style={{ padding: "4px 10px", fontSize: "0.72rem", display: "inline-flex", alignItems: "center", gap: 5 }}
                  onClick={stopRecording}
                  title="Detener grabación y guardar video del probador"
                >
                  <Dashicon name="controls-pause" size={13} />
                  <span>Detener</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-record-action"
                  style={{ padding: "4px 10px", fontSize: "0.72rem", display: "inline-flex", alignItems: "center", gap: 5 }}
                  onClick={startRecording}
                  title="Grabar video del probador virtual en resolución seleccionada"
                >
                  <span className="rec-dot-icon" />
                  <span>Grabar Video</span>
                </button>
              )}
            </div>

            {/* Botón de inicio/detención en vivo */}
            {isConnectedLive ? (
              <button
                className="btn btn-danger"
                style={{ minHeight: 34, padding: "4px 14px", fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 6 }}
                onClick={() => onStopTryOnSession?.()}
              >
                <Dashicon name="controls-pause" size={14} />
                <span>Detener Probador</span>
              </button>
            ) : (
              <button
                className="btn btn-primary"
                style={{ minHeight: 34, padding: "4px 14px", fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 6 }}
                onClick={handleRunTryOn}
                disabled={!sourceReady}
              >
                <Dashicon name="controls-play" size={14} />
                <span>Iniciar Probador en Vivo</span>
              </button>
            )}
          </div>
        </div>

        {/* Pantalla de monitor dual: Entrada vs Salida IA */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            backgroundColor: "#08080C",
            borderRadius: 16,
            border: "1px solid var(--border-dark)",
            padding: 10,
            minHeight: 280,
            position: "relative",
          }}
        >
          {/* Lado Entrada */}
          <div
            style={{
              position: "relative",
              borderRadius: 12,
              overflow: "hidden",
              backgroundColor: "#0E0E14",
              border: "1px solid var(--border-dark)",
              minHeight: 220,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <video
              ref={panelLocalVideoRef}
              autoPlay
              playsInline
              muted
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            <span
              style={{
                position: "absolute",
                top: 8,
                left: 8,
                fontSize: "0.68rem",
                padding: "2px 8px",
                borderRadius: 4,
                backgroundColor: "rgba(0,0,0,0.75)",
                color: "var(--text-white)",
                fontWeight: 800,
              }}
            >
              ENTRADA ({sourceMode === "camera" ? "Cámara Web" : "Video MP4"})
            </span>
          </div>

          {/* Lado Salida IA con Fondo Virtual y Chroma Key en Tiempo Real */}
          {(() => {
            const activeBg = virtualBackgrounds.find((b) => b.id === selectedBgId);
            return (
              <div
                style={{
                  position: "relative",
                  borderRadius: 12,
                  overflow: "hidden",
                  backgroundColor: activeBg?.id === "bg-chroma-green" ? "#00FF00" : "#0E0E14",
                  border: "2px solid var(--accent-pink)",
                  boxShadow: "0 0 20px rgba(255,46,147,0.15)",
                  minHeight: 220,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {/* Capa de Fondo Virtual Activo en Tiempo Real */}
                {activeBg && activeBg.id !== "bg-none" && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      zIndex: 1,
                      backgroundColor: activeBg.id === "bg-chroma-green" ? "#00FF00" : activeBg.previewColor || "#0E0E14",
                      backgroundImage: activeBg.customImageUrl ? `url(${activeBg.customImageUrl})` : undefined,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      filter: activeBg.id === "bg-chroma-green" ? "none" : "brightness(0.95)",
                    }}
                  />
                )}

                {/* Badge de Fondo Activo en Pantalla */}
                <div
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    zIndex: 10,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "3px 8px",
                    borderRadius: 6,
                    backgroundColor: activeBg?.id === "bg-chroma-green" ? "rgba(0, 0, 0, 0.75)" : "rgba(0,0,0,0.75)",
                    border: activeBg?.id === "bg-chroma-green" ? "1px solid #00FF00" : "1px solid rgba(255,255,255,0.2)",
                    color: activeBg?.id === "bg-chroma-green" ? "#00FF00" : "#FFFFFF",
                    fontSize: "0.68rem",
                    fontWeight: 800,
                    backdropFilter: "blur(4px)",
                  }}
                >
                  <Dashicon
                    name={activeBg?.id === "bg-chroma-green" ? "art" : "format-gallery"}
                    size={13}
                    color={activeBg?.id === "bg-chroma-green" ? "#00FF00" : "#A5B4FC"}
                  />
                  <span>{activeBg ? activeBg.name : "Fondo Original"}</span>
                </div>

                <video
                  ref={panelRemoteVideoRef}
                  autoPlay
                  playsInline
                  muted={!listenRemoteAudio}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: isConnectedLive ? "block" : "none",
                    position: "relative",
                    zIndex: 2,
                  }}
                />
                {!isConnectedLive && (
                  <div
                    style={{
                      position: "relative",
                      zIndex: 2,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 20,
                      textAlign: "center",
                      gap: 8,
                      backgroundColor: activeBg && activeBg.id !== "bg-none"
                        ? activeBg.id === "bg-chroma-green"
                          ? "rgba(0, 0, 0, 0.75)"
                          : "rgba(10, 10, 16, 0.78)"
                        : "transparent",
                      borderRadius: 12,
                      border: activeBg && activeBg.id !== "bg-none" ? "1px solid rgba(255, 255, 255, 0.2)" : "none",
                      backdropFilter: activeBg && activeBg.id !== "bg-none" ? "blur(4px)" : "none",
                      maxWidth: 320,
                    }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 44, height: 44, borderRadius: 12, background: activeBg?.id === "bg-chroma-green" ? "rgba(0, 255, 0, 0.14)" : "rgba(236, 72, 153, 0.14)", color: activeBg?.id === "bg-chroma-green" ? "#00FF00" : "var(--accent-pink)" }}>
                      <Dashicon name={activeBg?.id === "bg-chroma-green" ? "art" : "products"} size={24} />
                    </span>
                    <span style={{ fontSize: "0.82rem", fontWeight: 800, color: activeBg?.id === "bg-chroma-green" ? "#00FF00" : "var(--accent-pink)" }}>
                      {activeBg?.id === "bg-chroma-green" ? "CHROMA KEY VERDE ACTIVO (PREDETERMINADO)" : `SALIDA IA (${activeBg?.name || "Original"})`}
                    </span>
                    <span style={{ fontSize: "0.72rem", color: "#E5E7EB", maxWidth: 280, lineHeight: 1.3 }}>
                      {activeBg?.id === "bg-chroma-green"
                        ? "Fondo verde Chroma Key activo para aislar silueta y cambiar de escenario sin gastar créditos. Pulsa \"Iniciar Probador en Vivo\" para verte en tiempo real."
                        : "Elige una prenda en el carrusel de abajo y pulsa \"Iniciar Probador en Vivo\" para verte con la ropa puesta en tiempo real."}
                    </span>
                  </div>
                )}
                {isConnectedLive && (
                  <span
                    style={{
                      position: "absolute",
                      top: 8,
                      left: 8,
                      zIndex: 10,
                      fontSize: "0.68rem",
                      padding: "2px 8px",
                      borderRadius: 4,
                      backgroundColor: "rgba(255,46,147,0.85)",
                      color: "#FFFFFF",
                      fontWeight: 900,
                    }}
                  >
                    ● EN VIVO (lucy-vton-3.6)
                  </span>
                )}
              </div>
            );
          })()}
        </div>

        {/* CARRUSEL DE PRENDAS (HASTA 10 PRENDAS) TIPO ESPEJO (media_1794365631037_a0cfac23.jpg) */}
        <div style={{ marginTop: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.78rem", fontWeight: 800, color: "var(--accent-pink)", letterSpacing: "0.05em" }}>
              <Dashicon name="products" size={15} /> CARRUSEL DE PRENDAS ({tryOnGarments.length}/10)
            </span>
            <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
              Haz clic en cualquier prenda para probártela al instante
            </span>
          </div>

          <div className="tryon-carousel-track" style={{ padding: "6px 2px" }}>
            {tryOnGarments.map((garment) => {
              const isActive = selectedGarmentId === garment.id;
              const thumbSrc = garment.customImageUrl || garment.thumbnailSvg;
              return (
                <div
                  key={garment.id}
                  className={`tryon-card-item ${isActive ? "active" : ""}`}
                  onClick={() => {
                    onSelectGarment?.(garment);
                    setPrompt(garment.prompt);
                  }}
                  title={`${garment.name} - Clic para probar en vivo`}
                >
                  {garment.isCustom && onDeleteCustomGarment && (
                    <button
                      className="tryon-delete-badge"
                      onClick={(e) => onDeleteCustomGarment(garment.id, e)}
                      title="Eliminar prenda personalizada"
                    >
                      ×
                    </button>
                  )}
                  <div className="tryon-card-thumb">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={thumbSrc} alt={garment.name} />
                  </div>
                  <span className="tryon-card-label">{garment.name}</span>
                </div>
              );
            })}

            {tryOnGarments.length < 10 && onAddCustomGarment && (
              <>
                <div
                  className="tryon-add-card"
                  onClick={() => fileUploadInputRef.current?.click()}
                  title="Subir prenda personalizada (PNG / JPG)"
                >
                  <span style={{ fontSize: "1.3rem", lineHeight: 1 }}>+</span>
                  <span>Agregar Prenda</span>
                </div>
                <input
                  ref={fileUploadInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onAddCustomGarment(f);
                    e.target.value = "";
                  }}
                />
              </>
            )}
          </div>
        </div>

        {/* PANEL DE FONDOS DE ESCENARIO EN EL PROBADOR VIRTUAL */}
        <div className="bg-dock-panel" style={{ marginTop: 12 }}>
          <div className="bg-dock-header">
            <span className="bg-dock-title" style={{ display: "inline-flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <Dashicon name="format-gallery" size={15} color="#A5B4FC" />
              <span>Fondos de Escenario para el Probador (Chroma & Estudio)</span>
              <span style={{ fontSize: "0.68rem", color: "var(--text-white)", opacity: 0.75 }}>
                (Prueba tus atuendos en diferentes ambientes o sobre Chroma Key Verde)
              </span>
            </span>
            <span style={{ fontSize: "0.72rem", color: "#3B82F6", fontWeight: 800 }}>
              {virtualBackgrounds.find((b) => b.id === selectedBgId)?.name || "Original"}
            </span>
          </div>

          <div className="bg-carousel-track">
            {virtualBackgrounds.map((bg) => {
              const isActive = selectedBgId === bg.id;
              const thumbSrc = bg.customImageUrl || bg.thumbnailSvg;
              return (
                <div
                  key={bg.id}
                  className={`bg-card-item ${isActive ? "active" : ""}`}
                  onClick={() => void handleSelectBackground(bg)}
                  title={`${bg.name} - Clic para probar outfit con este fondo`}
                >
                  {bg.isCustom && (
                    <button
                      className="tryon-delete-badge"
                      onClick={(e) => handleDeleteCustomBackground(bg.id, e)}
                      title="Eliminar fondo personalizado"
                    >
                      ×
                    </button>
                  )}
                  <div className="bg-card-thumb">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={thumbSrc} alt={bg.name} />
                  </div>
                  <span className="bg-card-label">{bg.name}</span>
                </div>
              );
            })}

            <div
              className="bg-add-card"
              onClick={() => panelBgUploadRef.current?.click()}
              title="Subir foto de fondo personalizada para el probador"
            >
              <span style={{ fontSize: "1.2rem", lineHeight: 1 }}>+</span>
              <span>Subir Fondo</span>
            </div>
            <input
              ref={panelBgUploadRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleAddCustomBackground(f);
                e.target.value = "";
              }}
            />
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          CATALOGO DE PRENDAS Y EXTRACTOR DE FOTOS
          ------------------------------------------------------------- */}
      <section className="studio-card" aria-label="Catalogo y armador de prendas Try-On">
        <h2>Catálogo de Estilos y Presets</h2>
        <p className="muted-copy">
          Filtra por tipo de prenda o combina piezas con el armador rápido sin requerir foto.
        </p>

        <div className="btn-row" style={{ marginBottom: 10 }}>
          {(["Todos", "Superior", "Conjunto", "Accesorio"] as const).map((slot) => (
            <button
              key={slot}
              type="button"
              className="btn"
              style={{
                minHeight: 34,
                padding: "4px 10px",
                fontSize: "0.8rem",
                background: slotFilter === slot ? "var(--accent)" : undefined,
                color: slotFilter === slot ? "var(--accent-text)" : undefined,
              }}
              onClick={() => setSlotFilter(slot)}
            >
              {slot}
            </button>
          ))}
        </div>

        <div className="presets-grid" style={{ marginBottom: 14 }}>
          {visibleTemplates.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              className={`preset-card ${prompt === tpl.prompt ? "active" : ""}`}
              onClick={() => {
                setPrompt(tpl.prompt);
                setErrorMsg(null);
                if (tpl.requiresGarmentImage && !garmentFile) {
                  setStatusMsg("Sube abajo la foto de la prenda para completar este modo.");
                }
              }}
            >
              <span className="preset-cat">{tpl.slot}</span>
              <span className="preset-name">{tpl.label}</span>
            </button>
          ))}
        </div>

        <div className="studio-subcard">
          <h3>Armador rápido de Outfit (Sin foto requerida)</h3>
          <div className="field-row">
            <label htmlFor="vton-top">Prenda superior</label>
            <select
              id="vton-top"
              className="select-control"
              value={builderTop}
              onChange={(e) => setBuilderTop(e.target.value)}
            >
              <option value="black leather bomber jacket with silver zipper">
                Chaqueta bomber cuero negro
              </option>
              <option value="crisp white tailored button-down linen shirt">
                Camisa blanca lino elegante
              </option>
              <option value="oversized emerald green fleece hoodie">
                Hoodie verde esmeralda oversized
              </option>
              <option value="classic blue denim trucker jacket with brass buttons">
                Chaqueta jean azul clásica
              </option>
              <option value="sleeveless black ribbed athletic tank top">
                Camiseta deportiva negra ajustada
              </option>
            </select>
          </div>
          <div className="field-row">
            <label htmlFor="vton-acc">Accesorio adicional</label>
            <select
              id="vton-acc"
              className="select-control"
              value={builderAccessory}
              onChange={(e) => setBuilderAccessory(e.target.value)}
            >
              <option value="none">Ningún accesorio</option>
              <option value="a matte black baseball cap">Gorra negra clásica</option>
              <option value="classic dark tortoiseshell sunglasses">Gafas oscuras</option>
              <option value="minimalist silver chain necklace">Cadena plateada sutil</option>
            </select>
          </div>
          <button type="button" className="btn" onClick={applyOutfitBuilder}>
            Combinar prendas en prompt
          </button>
        </div>
      </section>

      <section className="studio-card" aria-label="Foto de prenda y lanzamiento Try-On">
        <h2>Prenda de Referencia y Lanzamiento</h2>

        <div className="field-row">
          <label htmlFor="file-vton-garment">Subir foto de prenda (JPG / PNG / WebP)</label>
          <div className="btn-row">
            <input
              id="file-vton-garment"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="input-control"
              style={{ flex: 1 }}
              onChange={(e) => handleGarmentUpload(e.target.files?.[0] ?? null)}
            />
            {garmentFile && (
              <button
                type="button"
                className="btn"
                onClick={() => handleGarmentUpload(null)}
              >
                Quitar
              </button>
            )}
          </div>
        </div>

        {garmentPreviewUrl && (
          <div className="video-compare-grid" style={{ marginBottom: 12 }}>
            <div className="video-stage">
              <span className="stage-badge">Prenda activa</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={garmentPreviewUrl} alt="Prenda seleccionada para Try-On" />
            </div>
            {extractedPreviewUrl ? (
              <div className="video-stage">
                <span className="stage-badge">Extraída limpia</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={extractedPreviewUrl} alt="Prenda aislada sobre fondo blanco" />
              </div>
            ) : (
              <div className="video-stage">
                <span className="stage-badge">Extractor IA</span>
                <div className="empty-stage">
                  Si tu foto muestra a alguien usándola, extráela sobre fondo blanco con 1 clic.
                </div>
              </div>
            )}
          </div>
        )}

        <div className="btn-row" style={{ marginBottom: 12 }}>
          <button
            type="button"
            className="btn"
            onClick={handleExtractGarment}
            disabled={!garmentFile || extracting}
          >
            {extracting ? "Extrayendo..." : "Extraer solo la prenda (lucy-image-2 · 1 cr)"}
          </button>
        </div>

        <div className="field-row">
          <label htmlFor="vton-prompt-txt">Instrucción Try-On (inglés descriptivo)</label>
          <textarea
            id="vton-prompt-txt"
            className="textarea-control"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>

        <label className="checkbox-line">
          <input
            type="checkbox"
            checked={verticalMirror}
            onChange={(e) => setVerticalMirror(e.target.checked)}
          />
          <span>Recorte Espejo Digital Vertical (9:16 para celulares o pantallas de tienda)</span>
        </label>

        {errorMsg && <p className="alert alert-error">{errorMsg}</p>}
        {statusMsg && <p className="alert alert-ok">{statusMsg}</p>}

        <div className="btn-row" style={{ marginTop: 12 }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleRunTryOn}
            disabled={!sourceReady}
            style={{ width: "100%", padding: "10px 16px", fontWeight: 800 }}
          >
            {isConnectedLive
              ? "Aplicar prenda ahora en vivo"
              : "Iniciar Probador Virtual (lucy-vton-3.6 · 2 cr/s)"}
          </button>
        </div>
      </section>
    </div>
  );
}

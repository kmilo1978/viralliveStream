"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_SAFE_PROMPT, OFFICIAL_PROMPT_PRESETS } from "@/lib/models";
import {
  DEFAULT_VIRTUAL_BACKGROUNDS,
  moderatePromptForDecart,
  QUEUE_VIDEO_MODELS,
  type QueueJobRecord,
  type QueueModelId,
  type VirtualBackgroundItem,
} from "@/lib/studio-data";
import { Dashicon } from "@/components/Dashicons";

const STORAGE_KEY = "miplataformastream.queueJobs.v1";

type QueueClipsPanelProps = {
  onLoadCompletedIntoMonitor: (videoUrl: string, fileName: string) => void;
  onRefreshAccount: () => void;
};

export function QueueClipsPanel({
  onLoadCompletedIntoMonitor,
  onRefreshAccount,
}: QueueClipsPanelProps) {
  const [modelId, setModelId] = useState<QueueModelId>("lucy-restyle-2");
  const [prompt, setPrompt] = useState<string>(DEFAULT_SAFE_PROMPT);
  const [enhancePrompt, setEnhancePrompt] = useState(true);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [refFile, setRefFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [jobs, setJobs] = useState<QueueJobRecord[]>([]);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});

  // Monitor Dual para Clips (Entrada vs Salida IA)
  const [inputVideoUrl, setInputVideoUrl] = useState<string | null>(null);
  const [activeOutputUrl, setActiveOutputUrl] = useState<string | null>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [dualAspect, setDualAspect] = useState<"16:9" | "9:16">("16:9");
  const [dualIsPlaying, setDualIsPlaying] = useState<boolean>(false);
  const [dualLoop, setDualLoop] = useState<boolean>(true);

  // Fondos Virtuales para Clips
  const [virtualBackgrounds, setVirtualBackgrounds] = useState<VirtualBackgroundItem[]>(DEFAULT_VIRTUAL_BACKGROUNDS);
  const [selectedBgId, setSelectedBgId] = useState<string>("bg-none");
  const clipBgUploadRef = useRef<HTMLInputElement | null>(null);

  const inputVideoRef = useRef<HTMLVideoElement | null>(null);
  const outputVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as QueueJobRecord[];
        if (Array.isArray(parsed)) setJobs(parsed);
      }
    } catch {
      // Ignore malformed storage
    }
  }, []);

  const persistJobs = useCallback((nextJobs: QueueJobRecord[]) => {
    setJobs(nextJobs);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextJobs.slice(0, 20)));
    } catch {
      // Ignore storage limits
    }
  }, []);

  const refreshJobStatus = useCallback(
    async (jobId: string) => {
      try {
        const res = await fetch(`/api/queue/status?jobId=${encodeURIComponent(jobId)}`);
        const data = (await res.json()) as {
          ok?: boolean;
          status?: QueueJobRecord["status"];
          error?: string;
        };
        if (!res.ok || !data.status) {
          throw new Error(data.error || "Error consultando trabajo en Decart.");
        }
        setJobs((prev) => {
          const updated = prev.map((j) =>
            j.jobId === jobId ? { ...j, status: data.status! } : j,
          );
          try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated.slice(0, 20)));
          } catch {}
          return updated;
        });
        if (data.status === "completed") {
          onRefreshAccount();
          // Cargar automáticamente en el monitor de salida si es el trabajo activo
          void loadCompletedVideoById(jobId);
        }
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Error consultando cola.");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onRefreshAccount],
  );

  const loadCompletedVideoById = useCallback(async (jobId: string) => {
    try {
      const res = await fetch(`/api/queue/result?jobId=${encodeURIComponent(jobId)}`);
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setPreviewUrls((prev) => ({ ...prev, [jobId]: url }));
      setActiveOutputUrl(url);
      setActiveJobId(jobId);
    } catch {}
  }, []);

  // Auto-poll trabajos activos cada 4 segundos mientras haya pending o processing
  useEffect(() => {
    const active = jobs.filter((j) => j.status === "pending" || j.status === "processing");
    if (active.length === 0) return;

    const timer = window.setInterval(() => {
      for (const job of active) {
        void refreshJobStatus(job.jobId);
      }
    }, 4000);
    return () => window.clearInterval(timer);
  }, [jobs, refreshJobStatus]);

  const handleSelectVideoFile = (file: File | null) => {
    if (inputVideoUrl) URL.revokeObjectURL(inputVideoUrl);
    setVideoFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setInputVideoUrl(url);
    } else {
      setInputVideoUrl(null);
    }
  };

  const handleSelectClipBackground = (bg: VirtualBackgroundItem) => {
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
  };

  const toggleDualPlayback = () => {
    const next = !dualIsPlaying;
    setDualIsPlaying(next);
    if (inputVideoRef.current) {
      if (next) inputVideoRef.current.play().catch(() => {});
      else inputVideoRef.current.pause();
    }
    if (outputVideoRef.current) {
      if (next) outputVideoRef.current.play().catch(() => {});
      else outputVideoRef.current.pause();
    }
  };

  const handleSubmit = useCallback(async () => {
    setErrorMsg(null);
    setInfoMsg(null);
    const mod = moderatePromptForDecart(prompt);
    if (!mod.ok) {
      setErrorMsg(mod.reason || "Prompt inválido.");
      return;
    }
    if (!videoFile) {
      setErrorMsg("Selecciona primero un video MP4 o WebM (máximo 200 MB).");
      return;
    }

    setSubmitting(true);
    try {
      const form = new FormData();
      form.append("modelId", modelId);
      form.append("prompt", prompt.trim());
      form.append("enhance_prompt", String(enhancePrompt));
      form.append("data", videoFile);
      if (refFile) form.append("reference_image", refFile);

      const res = await fetch("/api/queue/submit", { method: "POST", body: form });
      const data = (await res.json()) as {
        ok?: boolean;
        job_id?: string;
        status?: QueueJobRecord["status"];
        error?: string;
      };
      if (!res.ok || !data.job_id) {
        throw new Error(data.error || "No se pudo enviar el video a la cola de Decart.");
      }

      const nextRecord: QueueJobRecord = {
        jobId: data.job_id,
        modelId,
        prompt: prompt.trim(),
        fileName: videoFile.name,
        status: data.status ?? "pending",
        createdAt: new Date().toISOString(),
      };
      persistJobs([nextRecord, ...jobs]);
      setActiveJobId(data.job_id);
      setActiveOutputUrl(null);
      setInfoMsg(
        `Clip enviado a la cola (${data.job_id}). Se actualizará en la pantalla de salida en cuanto termine el renderizado.`,
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error enviando video a Queue API.");
    } finally {
      setSubmitting(false);
    }
  }, [enhancePrompt, jobs, modelId, persistJobs, prompt, refFile, videoFile]);

  const loadCompletedVideo = useCallback(
    async (job: QueueJobRecord, sendToLoop: boolean) => {
      setErrorMsg(null);
      try {
        let url = previewUrls[job.jobId];
        if (!url) {
          const res = await fetch(`/api/queue/result?jobId=${encodeURIComponent(job.jobId)}`);
          if (!res.ok) {
            throw new Error("No se pudo descargar el MP4 terminado desde Decart.");
          }
          const blob = await res.blob();
          url = URL.createObjectURL(blob);
          setPreviewUrls((prev) => ({ ...prev, [job.jobId]: url }));
        }
        setActiveOutputUrl(url);
        setActiveJobId(job.jobId);
        if (sendToLoop) {
          onLoadCompletedIntoMonitor(url, `${job.fileName} (IA)`);
        }
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Error descargando resultado.");
      }
    },
    [onLoadCompletedIntoMonitor, previewUrls],
  );

  const selectedModelMeta =
    QUEUE_VIDEO_MODELS.find((m) => m.id === modelId) ?? QUEUE_VIDEO_MODELS[0];

  return (
    <div className="cockpit-grid">
      {/* -------------------------------------------------------------
          HERO DUAL MONITOR: ENTRADA (ORIGINAL) VS SALIDA IA (PROCESADO)
          ------------------------------------------------------------- */}
      <section className="studio-card queue-hero-monitor" style={{ gridColumn: "1 / -1" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 8, background: "rgba(236, 72, 153, 0.16)", color: "#EC4899", flexShrink: 0 }}>
              <Dashicon name="format-video" size={18} />
            </span>
            <h2 style={{ margin: 0, fontSize: "1.1rem" }}>
              Monitor Dual de Clips Pregrabados (Entrada vs Salida IA)
            </h2>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span className={`tag-pill ${submitting ? "active" : ""}`} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: submitting ? "#FBBF24" : activeOutputUrl ? "#10B981" : "#94A3B8",
                }}
              />
              <span>{submitting ? "SUBIENDO..." : activeOutputUrl ? "SALIDA LISTA" : "STANDBY"}</span>
            </span>
          </div>
        </div>

        <div className="queue-monitor-screens">
          {/* Pantalla 1: ENTRADA (Video Original MP4) */}
          <div className={`queue-feed-box ${dualAspect === "9:16" ? "aspect-9-16" : ""}`}>
            <span className="queue-feed-badge" style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <Dashicon name="video-alt3" size={13} /> ENTRADA (Clip Original MP4)
            </span>
            {inputVideoUrl ? (
              <video
                ref={inputVideoRef}
                src={inputVideoUrl}
                playsInline
                loop={dualLoop}
                controls
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            ) : (
              <div style={{ textAlign: "center", padding: 20, color: "var(--text-secondary)" }}>
                <div style={{ marginBottom: 8, color: "#94A3B8", display: "flex", justifyContent: "center" }}>
                  <Dashicon name="upload" size={28} />
                </div>
                <p style={{ margin: 0, fontSize: "0.82rem" }}>
                  Selecciona un archivo MP4 abajo para previsualizar aquí el clip original
                </p>
              </div>
            )}
          </div>

          {/* Pantalla 2: SALIDA IA (Video Procesado Decart 720p) */}
          <div className={`queue-feed-box ${dualAspect === "9:16" ? "aspect-9-16" : ""}`}>
            <span className="queue-feed-badge out-ai" style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <Dashicon name="star-filled" size={13} /> SALIDA IA ({modelId} · Decart 720p)
            </span>
            {activeOutputUrl ? (
              <video
                ref={outputVideoRef}
                src={activeOutputUrl}
                playsInline
                loop={dualLoop}
                controls
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            ) : submitting ? (
              <div style={{ textAlign: "center", padding: 20, color: "var(--accent-pink)" }}>
                <div style={{ marginBottom: 8, display: "flex", justifyContent: "center" }}>
                  <Dashicon name="clock" size={28} />
                </div>
                <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 700 }}>
                  Procesando en servidores de Decart...
                </p>
                <span style={{ fontSize: "0.72rem", opacity: 0.8 }}>
                  La salida aparecerá aquí automáticamente al completarse
                </span>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: 20, color: "var(--text-secondary)" }}>
                <div style={{ marginBottom: 8, color: "#EC4899", display: "flex", justifyContent: "center" }}>
                  <Dashicon name="art" size={28} />
                </div>
                <p style={{ margin: 0, fontSize: "0.82rem" }}>
                  Aquí se reproducirá el clip transformado con máxima nitidez 720p
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Barra de controles del Monitor Dual */}
        <div className="queue-monitor-controls">
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              className={`pill-ctrl-button ${dualIsPlaying ? "active-pink" : ""}`}
              style={{ display: "inline-flex", alignItems: "center", gap: 5 }}
              onClick={toggleDualPlayback}
              disabled={!inputVideoUrl && !activeOutputUrl}
              title="Reproducir o pausar ambos videos sincronizados"
            >
              <Dashicon name={dualIsPlaying ? "controls-pause" : "controls-play"} size={13} />
              <span>{dualIsPlaying ? "Pausar Ambos" : "Reproducir Ambos"}</span>
            </button>

            <button
              type="button"
              className={`pill-ctrl-button ${dualLoop ? "active-pink" : ""}`}
              style={{ display: "inline-flex", alignItems: "center", gap: 5 }}
              onClick={() => setDualLoop((prev) => !prev)}
              title="Alternar reproducción continua en bucle"
            >
              <Dashicon name="controls-repeat" size={13} />
              <span>Bucle: {dualLoop ? "ON" : "OFF"}</span>
            </button>

            <select
              className="select-ctrl-pill"
              value={dualAspect}
              onChange={(e) => setDualAspect(e.target.value as "16:9" | "9:16")}
            >
              <option value="16:9">16:9 Panorámico</option>
              <option value="9:16">9:16 Vertical (TikTok/Reels)</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {activeOutputUrl && (
              <>
                <button
                  type="button"
                  className="pill-ctrl-button active-pink"
                  style={{ display: "inline-flex", alignItems: "center", gap: 5 }}
                  onClick={() => onLoadCompletedIntoMonitor(activeOutputUrl, `Clip IA (${modelId})`)}
                  title="Enviar este video procesado a la cabina CAM para transmitirlo en bucle"
                >
                  <Dashicon name="controls-play" size={13} />
                  <span>Enviar a Cabina CAM en Bucle</span>
                </button>
                <a
                  href={activeOutputUrl}
                  download="clip-ia-salida.mp4"
                  className="pill-ctrl-button"
                  style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5 }}
                  title="Descargar archivo MP4 a tu computador"
                >
                  <Dashicon name="download" size={13} />
                  <span>Descargar MP4</span>
                </a>
              </>
            )}
          </div>
        </div>

        {/* SELECTOR DE FONDOS VIRTUALES PARA EL CLIP */}
        <div className="bg-dock-panel" style={{ marginTop: 14 }}>
          <div className="bg-dock-header">
            <span className="bg-dock-title" style={{ display: "inline-flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <Dashicon name="format-gallery" size={15} color="#A5B4FC" />
              <span>Fondos Virtuales para el Clip (Chroma Key & Escenarios)</span>
              <span style={{ fontSize: "0.68rem", color: "var(--text-white)", opacity: 0.75 }}>
                - Haz clic para aplicar el fondo a la instrucción antes de procesar el video
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
                  onClick={() => handleSelectClipBackground(bg)}
                  title={`${bg.name} - Clic para agregar fondo al clip`}
                >
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
              onClick={() => clipBgUploadRef.current?.click()}
              title="Subir foto de fondo personalizada para el clip"
            >
              <span style={{ fontSize: "1.2rem", lineHeight: 1 }}>+</span>
              <span>Subir Fondo</span>
            </div>
            <input
              ref={clipBgUploadRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    const dataUrl = ev.target?.result as string;
                    const cleanName = f.name.replace(/\.[^/.]+$/, "").slice(0, 18);
                    const newBg: VirtualBackgroundItem = {
                      id: `custom-bg-${Date.now()}`,
                      name: cleanName || "Mi Fondo",
                      category: "Personalizado",
                      thumbnailSvg: "",
                      customImageUrl: dataUrl,
                      isCustom: true,
                      promptSuffix:
                        "in a customized room setting with lighting and ambient atmosphere matching the uploaded background image",
                      previewColor: "#3B82F6",
                    };
                    setVirtualBackgrounds((prev) => [...prev, newBg]);
                    handleSelectClipBackground(newBg);
                  };
                  reader.readAsDataURL(f);
                }
                e.target.value = "";
              }}
            />
          </div>
        </div>
      </section>

      {/* Formulario de envío */}
      <section className="studio-card" aria-label="Enviar video a la cola Decart">
        <h2>Configurar y Procesar Clip</h2>
        <p className="muted-copy">
          Sube un video MP4 o WebM (hasta 200 MB, proporción 16:9 o 9:16) para que Decart lo
          procese a 720p en segundo plano con máxima calidad.
        </p>

        <div className="field-row">
          <label htmlFor="q-model">Modelo de procesamiento</label>
          <select
            id="q-model"
            className="select-control"
            value={modelId}
            onChange={(e) => setModelId(e.target.value as QueueModelId)}
          >
            {QUEUE_VIDEO_MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
          <span className="metric-label">{selectedModelMeta.notes}</span>
        </div>

        <div className="field-row">
          <label htmlFor="q-video">Archivo de video fuente (MP4 / WebM, max 200 MB)</label>
          <input
            id="q-video"
            type="file"
            accept="video/mp4,video/webm"
            className="input-control"
            onChange={(e) => handleSelectVideoFile(e.target.files?.[0] ?? null)}
          />
        </div>

        <div className="field-row">
          <label htmlFor="q-ref">Imagen de referencia opcional (rostro o prenda)</label>
          <input
            id="q-ref"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="input-control"
            onChange={(e) => setRefFile(e.target.files?.[0] ?? null)}
          />
        </div>

        <div className="field-row">
          <label htmlFor="q-prompt">Instrucción para el clip (inglés)</label>
          <textarea
            id="q-prompt"
            className="textarea-control"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <div className="btn-row">
            {OFFICIAL_PROMPT_PRESETS.slice(0, 4).map((p) => (
              <button
                key={p.id}
                type="button"
                className="btn"
                style={{ minHeight: 32, padding: "4px 8px", fontSize: "0.78rem" }}
                onClick={() => setPrompt(p.prompt)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <label className="checkbox-line">
          <input
            type="checkbox"
            checked={enhancePrompt}
            onChange={(e) => setEnhancePrompt(e.target.checked)}
          />
          <span>Mejorar instrucción automáticamente (enhance)</span>
        </label>

        {errorMsg && <p className="alert alert-error">{errorMsg}</p>}
        {infoMsg && <p className="alert alert-ok">{infoMsg}</p>}

        <div className="btn-row" style={{ marginTop: 12 }}>
          <button
            type="button"
            className="btn btn-accent"
            onClick={handleSubmit}
            disabled={submitting || !videoFile}
          >
            {submitting
              ? "Subiendo a Decart..."
              : `Procesar video en cola (${selectedModelMeta.decartCreditsPerSec} cr/s)`}
          </button>
        </div>
      </section>

      {/* Historial de trabajos */}
      <section className="studio-card" aria-label="Historial de trabajos en cola">
        <h2>Historial de Clips en Cola ({jobs.length})</h2>
        {jobs.length === 0 ? (
          <div className="studio-subcard">
            <p className="muted-copy" style={{ margin: 0 }}>
              Aún no has enviado videos a la cola asíncrona. Cuando proceses uno aquí podrás ver su
              estado, cargarlo en el monitor superior, descargarlo o enviarlo en bucle a la cabina.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {jobs.map((job) => (
              <div key={job.jobId} className="studio-subcard">
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <strong>{job.fileName}</strong>
                  <span className={`tag-pill ${job.status === "completed" ? "active" : ""}`}>
                    {job.status}
                  </span>
                </div>
                <div className="metric-label" style={{ marginTop: 4 }}>
                  {job.modelId} · ID: {job.jobId}
                </div>
                <p className="muted-copy" style={{ marginTop: 6, marginBottom: 8, fontSize: "0.8rem" }}>
                  {job.prompt}
                </p>

                <div className="btn-row">
                  <button
                    type="button"
                    className="btn"
                    onClick={() => void refreshJobStatus(job.jobId)}
                  >
                    Actualizar estado
                  </button>
                  {job.status === "completed" && (
                    <>
                      <button
                        type="button"
                        className="btn"
                        style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                        onClick={() => void loadCompletedVideo(job, false)}
                        title="Ver en la pantalla de salida del monitor superior"
                      >
                        <Dashicon name="visibility" size={14} />
                        <span>Ver en Monitor Dual</span>
                      </button>
                      <button
                        type="button"
                        className="btn btn-accent"
                        style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                        onClick={() => void loadCompletedVideo(job, true)}
                      >
                        <Dashicon name="controls-play" size={14} />
                        <span>Enviar a cabina en bucle</span>
                      </button>
                      <a
                        href={`/api/queue/result?jobId=${encodeURIComponent(job.jobId)}`}
                        download={`clip-${job.jobId}.mp4`}
                        className="btn"
                        style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                      >
                        <Dashicon name="download" size={14} />
                        <span>Descargar MP4</span>
                      </a>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

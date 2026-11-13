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

type ClipAspectRatio = "16:9" | "9:16" | "1:1" | "4:5" | "4:3" | "21:9";
type ClipResolution = "480p" | "720p" | "1080p" | "4k";
type ClipFitMode = "contain" | "cover";
type ClipContainerFormat = "mp4" | "webm" | "mov";

const CLIP_ASPECT_OPTIONS: Array<{
  id: ClipAspectRatio;
  label: string;
  shortLabel: string;
  cssClass: string;
  ratioNum: number;
  platformHint: string;
}> = [
  { id: "16:9", label: "16:9 Panorámico (YouTube / Twitch)", shortLabel: "16:9", cssClass: "aspect-16-9", ratioNum: 16 / 9, platformHint: "YouTube / Twitch" },
  { id: "9:16", label: "9:16 Vertical (TikTok / Reels / Shorts)", shortLabel: "9:16", cssClass: "aspect-9-16", ratioNum: 9 / 16, platformHint: "TikTok / Reels" },
  { id: "1:1", label: "1:1 Cuadrado (Instagram Feed / Ads)", shortLabel: "1:1", cssClass: "aspect-1-1", ratioNum: 1, platformHint: "Instagram / Ads" },
  { id: "4:5", label: "4:5 Retrato Social (Instagram / FB)", shortLabel: "4:5", cssClass: "aspect-4-5", ratioNum: 4 / 5, platformHint: "IG / Facebook" },
  { id: "4:3", label: "4:3 Clásico (Presentación / Retro)", shortLabel: "4:3", cssClass: "aspect-4-3", ratioNum: 4 / 3, platformHint: "Presentación / TV" },
  { id: "21:9", label: "21:9 Cine Ultrawide", shortLabel: "21:9", cssClass: "aspect-21-9", ratioNum: 21 / 9, platformHint: "Cine Ultrawide" },
];

const CLIP_RESOLUTION_BASE: Record<ClipResolution, { label: string; shortSide: number }> = {
  "480p": { label: "480p (SD Ligero)", shortSide: 480 },
  "720p": { label: "720p (HD Nativo IA)", shortSide: 720 },
  "1080p": { label: "1080p (Full HD)", shortSide: 1080 },
  "4k": { label: "4K (Ultra HD)", shortSide: 2160 },
};

const CLIP_FORMAT_OPTIONS: Array<{ id: ClipContainerFormat; label: string }> = [
  { id: "mp4", label: "MP4 (Universal H.264)" },
  { id: "webm", label: "WebM (Web / VP9)" },
  { id: "mov", label: "MOV (Edición Pro)" },
];

function getClipPixelDimensions(aspect: ClipAspectRatio, resolution: ClipResolution): { width: number; height: number } {
  const shortSide = CLIP_RESOLUTION_BASE[resolution].shortSide;
  const preset = CLIP_ASPECT_OPTIONS.find((opt) => opt.id === aspect) ?? CLIP_ASPECT_OPTIONS[0];
  const r = preset.ratioNum;
  const makeEven = (val: number) => Math.round(val / 2) * 2;
  if (r >= 1) {
    return { width: makeEven(shortSide * r), height: shortSide };
  }
  return { width: shortSide, height: makeEven(shortSide / r) };
}

type QueueClipsPanelProps = {
  onLoadCompletedIntoMonitor: (videoUrl: string, fileName: string) => void;
  onRefreshAccount: () => void;
  dockMode?: boolean;
};

export function QueueClipsPanel({
  onLoadCompletedIntoMonitor,
  onRefreshAccount,
  dockMode = false,
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
  const [dualAspect, setDualAspect] = useState<ClipAspectRatio>("16:9");
  const [dualResolution, setDualResolution] = useState<ClipResolution>("720p");
  const [dualFitMode, setDualFitMode] = useState<ClipFitMode>("contain");
  const [exportFormat, setExportFormat] = useState<ClipContainerFormat>("mp4");
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
  const activeAspectPreset =
    CLIP_ASPECT_OPTIONS.find((opt) => opt.id === dualAspect) ?? CLIP_ASPECT_OPTIONS[0];
  const activePixelDims = getClipPixelDimensions(dualAspect, dualResolution);

  if (dockMode) {
    return (
      <div className="queue-clips-dock-panel" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {errorMsg && (
          <div className="screen-limit-toast" style={{ background: "var(--danger-red)", padding: "8px 12px", borderRadius: 8, fontSize: "0.75rem", color: "#FFF" }}>
            <span>{errorMsg}</span>
            <button type="button" onClick={() => setErrorMsg(null)} style={{ background: "transparent", border: "none", color: "#FFF", marginLeft: 8, cursor: "pointer" }}>✕</button>
          </div>
        )}
        {infoMsg && (
          <div className="screen-limit-toast" style={{ background: "var(--ok-green)", padding: "8px 12px", borderRadius: 8, fontSize: "0.75rem", color: "#FFF" }}>
            <span>{infoMsg}</span>
            <button type="button" onClick={() => setInfoMsg(null)} style={{ background: "transparent", border: "none", color: "#FFF", marginLeft: 8, cursor: "pointer" }}>✕</button>
          </div>
        )}

        {/* Tarjeta de Configuración del Clip */}
        <div className="studio-dock-card" style={{ padding: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "#FFFFFF", display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Dashicon name="format-video" size={14} color="#EC4899" />
              <span>Configurar Clip IA</span>
            </span>
            <span className="tag-pill" style={{ fontSize: "0.62rem" }}>
              {dualAspect} · {dualResolution}
            </span>
          </div>

          {/* Modelo IA */}
          <div style={{ marginBottom: 10 }}>
            <label style={{ display: "block", fontSize: "0.7rem", color: "#94A3B8", fontWeight: 700, marginBottom: 4 }}>
              Modelo de Procesamiento:
            </label>
            <select
              className="select-control"
              value={modelId}
              onChange={(e) => setModelId(e.target.value as QueueModelId)}
              style={{ width: "100%", fontSize: "0.74rem", padding: "6px 8px" }}
            >
              {QUEUE_VIDEO_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label} ({m.decartCreditsPerSec} cr/s)
                </option>
              ))}
            </select>
            <span style={{ display: "block", fontSize: "0.64rem", color: "#64748B", marginTop: 2 }}>
              {selectedModelMeta.notes}
            </span>
          </div>

          {/* Archivo de Video Original */}
          <div style={{ marginBottom: 10 }}>
            <label style={{ display: "block", fontSize: "0.7rem", color: "#94A3B8", fontWeight: 700, marginBottom: 4 }}>
              Subir Video Original (MP4 / WebM / MOV):
            </label>
            <input
              type="file"
              accept="video/mp4,video/webm,video/quicktime,video/x-matroska,video/ogg,.mp4,.webm,.mov,.mkv,.m4v"
              className="input-control"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                handleSelectVideoFile(f);
                if (f) {
                  const u = URL.createObjectURL(f);
                  onLoadCompletedIntoMonitor(u, f.name);
                }
              }}
              style={{ width: "100%", fontSize: "0.72rem", padding: "4px" }}
            />
            {videoFile && (
              <span style={{ display: "block", fontSize: "0.66rem", color: "#10B981", marginTop: 2, fontWeight: 700 }}>
                ✓ {videoFile.name} ({(videoFile.size / (1024 * 1024)).toFixed(1)} MB)
              </span>
            )}
          </div>

          {/* Imagen de Referencia Opcional */}
          <div style={{ marginBottom: 10 }}>
            <label style={{ display: "block", fontSize: "0.7rem", color: "#94A3B8", fontWeight: 700, marginBottom: 4 }}>
              Imagen de Referencia (Opcional):
            </label>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="input-control"
              onChange={(e) => setRefFile(e.target.files?.[0] ?? null)}
              style={{ width: "100%", fontSize: "0.72rem", padding: "4px" }}
            />
          </div>

          {/* Prompt / Instrucción de Estilo */}
          <div style={{ marginBottom: 10 }}>
            <label style={{ display: "block", fontSize: "0.7rem", color: "#94A3B8", fontWeight: 700, marginBottom: 4 }}>
              Instrucción para el Clip:
            </label>
            <textarea
              className="textarea-control"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              style={{ width: "100%", minHeight: 48, fontSize: "0.74rem", padding: "6px" }}
            />
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
              {OFFICIAL_PROMPT_PRESETS.slice(0, 3).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="btn"
                  style={{ fontSize: "0.62rem", padding: "2px 6px", minHeight: 20 }}
                  onClick={() => setPrompt(p.prompt)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Formato & Proporción */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 10 }}>
            <div>
              <label style={{ display: "block", fontSize: "0.68rem", color: "#94A3B8", fontWeight: 700, marginBottom: 2 }}>
                Proporción:
              </label>
              <select
                className="select-control"
                value={dualAspect}
                onChange={(e) => setDualAspect(e.target.value as ClipAspectRatio)}
                style={{ width: "100%", fontSize: "0.72rem", padding: "4px" }}
              >
                {CLIP_ASPECT_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.shortLabel} ({opt.platformHint})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.68rem", color: "#94A3B8", fontWeight: 700, marginBottom: 2 }}>
                Resolución:
              </label>
              <select
                className="select-control"
                value={dualResolution}
                onChange={(e) => setDualResolution(e.target.value as ClipResolution)}
                style={{ width: "100%", fontSize: "0.72rem", padding: "4px" }}
              >
                {(Object.keys(CLIP_RESOLUTION_BASE) as ClipResolution[]).map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label className="checkbox-line" style={{ fontSize: "0.7rem", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
            <input
              type="checkbox"
              checked={enhancePrompt}
              onChange={(e) => setEnhancePrompt(e.target.checked)}
            />
            <span>Mejorar prompt automáticamente</span>
          </label>

          {/* Botón Submit */}
          <button
            type="button"
            className="btn-execute running"
            onClick={handleSubmit}
            disabled={submitting || !videoFile}
            style={{ width: "100%", fontSize: "0.76rem", padding: "9px 12px", cursor: submitting || !videoFile ? "not-allowed" : "pointer" }}
          >
            {submitting ? "SUBIENDO VIDEO A COLA..." : `PROCESAR CLIP (${selectedModelMeta.decartCreditsPerSec} cr/s)`}
          </button>
        </div>

        {/* Historial de Clips en Cola */}
        <div className="studio-dock-card" style={{ padding: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "#FFFFFF", display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Dashicon name="clock" size={14} color="#60A5FA" />
              <span>Historial en Cola ({jobs.length})</span>
            </span>
          </div>

          {jobs.length === 0 ? (
            <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--text-muted)", textAlign: "center", padding: "10px 4px" }}>
              Aún no has procesado clips. Sube un video arriba para enviar a la cola.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 320, overflowY: "auto" }}>
              {jobs.map((job) => (
                <div
                  key={job.jobId}
                  style={{
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: 8,
                    padding: 8,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
                    <strong style={{ fontSize: "0.74rem", color: "#FFFFFF", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 160 }}>
                      {job.fileName}
                    </strong>
                    <span
                      className={`tag-pill ${job.status === "completed" ? "active" : ""}`}
                      style={{ fontSize: "0.62rem", padding: "1px 6px" }}
                    >
                      {job.status}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.64rem", color: "#94A3B8", marginTop: 2 }}>
                    {job.modelId} · ID: {job.jobId.slice(0, 8)}...
                  </div>
                  <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
                    {job.status === "completed" && (
                      <>
                        <button
                          type="button"
                          className="btn"
                          style={{ fontSize: "0.65rem", padding: "3px 7px", background: "rgba(236,72,153,0.2)", borderColor: "#EC4899", color: "#F472B6" }}
                          onClick={() => void loadCompletedVideo(job, true)}
                          title="Cargar video en el monitor central"
                        >
                          ▶ Cargar al Monitor
                        </button>
                        <a
                          href={`/api/queue/result?jobId=${encodeURIComponent(job.jobId)}`}
                          download={`clip-${job.jobId}.mp4`}
                          className="btn"
                          style={{ fontSize: "0.65rem", padding: "3px 7px", textDecoration: "none" }}
                        >
                          ⬇ Descargar
                        </a>
                      </>
                    )}
                    <button
                      type="button"
                      className="btn"
                      style={{ fontSize: "0.62rem", padding: "2px 5px" }}
                      onClick={() => void refreshJobStatus(job.jobId)}
                      title="Actualizar estado"
                    >
                      ↻
                    </button>
                    <button
                      type="button"
                      className="btn"
                      style={{ fontSize: "0.62rem", padding: "2px 5px", color: "#EF4444" }}
                      onClick={() => persistJobs(jobs.filter((j) => j.jobId !== job.jobId))}
                      title="Eliminar de la lista"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

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
              Monitor Dual de Clips Pregrabados (Original vs Video Mejorado)
            </h2>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span className="tag-pill" title="Dimensiones y formato seleccionados para el clip">
              {activePixelDims.width}×{activePixelDims.height}px · {dualAspect} · {exportFormat.toUpperCase()}
            </span>
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
          {/* Pantalla 1: ENTRADA (Video Original) */}
          <div className={`queue-feed-box ${activeAspectPreset.cssClass}`}>
            {inputVideoUrl ? (
              <video
                ref={inputVideoRef}
                src={inputVideoUrl}
                playsInline
                loop={dualLoop}
                controls
                style={{ width: "100%", height: "100%", objectFit: dualFitMode }}
              />
            ) : (
              <div style={{ textAlign: "center", padding: 20, color: "var(--text-secondary)" }}>
                <div style={{ marginBottom: 8, color: "#94A3B8", display: "flex", justifyContent: "center" }}>
                  <Dashicon name="upload" size={28} />
                </div>
                <p style={{ margin: 0, fontSize: "0.82rem" }}>
                  Selecciona un archivo de video (MP4, WebM o MOV) abajo para previsualizar en {dualAspect}
                </p>
              </div>
            )}
          </div>

          {/* Pantalla 2: SALIDA IA (Video Procesado) */}
          <div className={`queue-feed-box ${activeAspectPreset.cssClass}`}>
            {activeOutputUrl ? (
              <video
                ref={outputVideoRef}
                src={activeOutputUrl}
                playsInline
                loop={dualLoop}
                controls
                style={{ width: "100%", height: "100%", objectFit: dualFitMode }}
              />
            ) : submitting ? (
              <div style={{ textAlign: "center", padding: 20, color: "var(--accent-pink)" }}>
                <div style={{ marginBottom: 8, display: "flex", justifyContent: "center" }}>
                  <Dashicon name="clock" size={28} />
                </div>
                <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 700 }}>
                  Procesando video con IA...
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
              aria-label="Formato o proporción del clip"
              value={dualAspect}
              onChange={(e) => setDualAspect(e.target.value as ClipAspectRatio)}
              title="Proporción de pantalla para redes sociales o streaming"
            >
              {CLIP_ASPECT_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>

            <select
              className="select-ctrl-pill"
              aria-label="Resolución del clip"
              value={dualResolution}
              onChange={(e) => setDualResolution(e.target.value as ClipResolution)}
              title="Tamaño / Resolución de salida del clip"
            >
              {(Object.keys(CLIP_RESOLUTION_BASE) as ClipResolution[]).map((resKey) => (
                <option key={resKey} value={resKey}>
                  {CLIP_RESOLUTION_BASE[resKey].label}
                </option>
              ))}
            </select>

            <select
              className="select-ctrl-pill"
              aria-label="Formato de archivo del clip"
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as ClipContainerFormat)}
              title="Contenedor / extensión de archivo de descarga"
            >
              {CLIP_FORMAT_OPTIONS.map((fmt) => (
                <option key={fmt.id} value={fmt.id}>
                  {fmt.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              className={`pill-ctrl-button ${dualFitMode === "cover" ? "active-pink" : ""}`}
              onClick={() => setDualFitMode((prev) => (prev === "contain" ? "cover" : "contain"))}
              title="Alternar entre ver video completo (Contain) o rellenar todo el recuadro (Cover)"
            >
              <span>Encuadre: {dualFitMode === "contain" ? "Completo" : "Rellenar"}</span>
            </button>
          </div>

          <div className="queue-aspect-quick-strip" role="group" aria-label="Accesos rápidos de proporción">
            {CLIP_ASPECT_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={`pill-ctrl-button ${dualAspect === opt.id ? "active-pink" : ""}`}
                onClick={() => setDualAspect(opt.id)}
                title={`${opt.label} (${getClipPixelDimensions(opt.id, dualResolution).width}×${getClipPixelDimensions(opt.id, dualResolution).height})`}
              >
                <span>{opt.shortLabel}</span>
                <span style={{ opacity: 0.72, fontSize: "0.7rem" }}>· {opt.platformHint}</span>
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {activeOutputUrl && (
              <>
                <button
                  type="button"
                  className="pill-ctrl-button active-pink"
                  style={{ display: "inline-flex", alignItems: "center", gap: 5 }}
                  onClick={() => onLoadCompletedIntoMonitor(activeOutputUrl, "Clip IA HD")}
                  title="Enviar este video procesado a la cabina CAM para transmitirlo en bucle"
                >
                  <Dashicon name="controls-play" size={13} />
                  <span>Enviar a Cabina CAM en Bucle</span>
                </button>
                <a
                  href={activeOutputUrl}
                  download={`clip-ia-${dualAspect.replace(":", "x")}-${dualResolution}.${exportFormat}`}
                  className="pill-ctrl-button"
                  style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5 }}
                  title={`Descargar archivo ${exportFormat.toUpperCase()} (${activePixelDims.width}×${activePixelDims.height})`}
                >
                  <Dashicon name="download" size={13} />
                  <span>Descargar {exportFormat.toUpperCase()}</span>
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
      <section className="studio-card" aria-label="Configurar y procesar clip de video">
        <h2>Configurar y Procesar Clip</h2>
        <p className="muted-copy">
          Sube un video MP4, WebM, MOV, M4V o MKV (hasta 200 MB, cualquier proporción: 16:9, 9:16, 1:1, 4:5, 4:3 o 21:9) para
          procesarlo en segundo plano con máxima calidad.
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
          <label htmlFor="q-video">Archivo de video fuente (MP4 / WebM / MOV / M4V / MKV, máx 200 MB)</label>
          <input
            id="q-video"
            type="file"
            accept="video/mp4,video/webm,video/quicktime,video/x-matroska,video/ogg,.mp4,.webm,.mov,.mkv,.m4v"
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
              ? "Subiendo video..."
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

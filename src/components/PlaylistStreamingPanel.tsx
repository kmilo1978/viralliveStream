"use client";

import React, { useRef, useState } from "react";
import {
  DEFAULT_STREAMING_PLAYLIST,
  type PlaylistStreamingItem,
} from "@/lib/studio-data";
import { Dashicon } from "@/components/Dashicons";
import { SocialIcon, type SocialNetworkName } from "@/components/PlatformLogos";

export type PlaylistTargetPlatformId =
  | "tiktok"
  | "youtube"
  | "instagram"
  | "facebook"
  | "twitch"
  | "twitter-x"
  | "custom_rtmp";

export type PlaylistBroadcastMeta = {
  broadcastMode: "single" | "multilive";
  selectedPlatforms: PlaylistTargetPlatformId[];
  scheduleMode: "now" | "scheduled";
  scheduledDate: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  enablePreLaunch: boolean;
  preLaunchMinutes: number;
  preLaunchTitle: string;
  customRtmpUrl?: string;
};

interface PlaylistStreamingPanelProps {
  onLoadClipToMonitor?: (videoUrl: string) => void;
  onStartPlaylistStream?: (
    playlist: PlaylistStreamingItem[],
    loop: boolean,
    meta?: PlaylistBroadcastMeta
  ) => void;
}

const PLAYLIST_PLATFORM_OPTIONS: Array<{
  id: PlaylistTargetPlatformId;
  label: string;
  social?: SocialNetworkName;
  color: string;
}> = [
  { id: "tiktok", label: "TikTok Live", social: "tiktok", color: "#FE2C55" },
  { id: "youtube", label: "YouTube Live", social: "youtube", color: "#EF4444" },
  { id: "instagram", label: "Instagram Live", social: "instagram", color: "#EC4899" },
  { id: "facebook", label: "Facebook Live", social: "facebook", color: "#3B82F6" },
  { id: "twitch", label: "Twitch", social: "twitch", color: "#A855F7" },
  { id: "twitter-x", label: "X Live", social: "twitter-x", color: "#E2E8F0" },
  { id: "custom_rtmp", label: "RTMP Custom", color: "#10B981" },
];

const DEFAULT_CUSTOM_THUMB =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 96' width='160' height='96'><rect width='160' height='96' fill='%23141628'/><circle cx='80' cy='44' r='16' fill='%23EC4899' fill-opacity='0.28'/><polygon points='75,36 90,44 75,52' fill='%23FFFFFF'/><text x='80' y='80' text-anchor='middle' fill='%23CBD5E1' font-size='10' font-family='sans-serif' font-weight='bold'>VIDEO PROPIO</text></svg>";

function readLocalVideoMetadata(file: File): Promise<{ durationSeconds: number; thumbnailUrl: string }> {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const vid = document.createElement("video");
    let settled = false;

    const finish = (duration: number, thumb: string) => {
      if (settled) return;
      settled = true;
      URL.revokeObjectURL(objectUrl);
      resolve({ durationSeconds: duration, thumbnailUrl: thumb });
    };

    const fallbackTimer = window.setTimeout(() => finish(30, DEFAULT_CUSTOM_THUMB), 2200);

    vid.preload = "metadata";
    vid.muted = true;
    vid.src = objectUrl;
    vid.onloadedmetadata = () => {
      window.clearTimeout(fallbackTimer);
      const rawDur = Number.isFinite(vid.duration) && vid.duration > 0 ? Math.round(vid.duration) : 30;
      finish(Math.max(1, rawDur), DEFAULT_CUSTOM_THUMB);
    };
    vid.onerror = () => {
      window.clearTimeout(fallbackTimer);
      finish(30, DEFAULT_CUSTOM_THUMB);
    };
  });
}

function addSecondsToClock(hhmm: string, offsetSec: number): string {
  const [hRaw, mRaw] = hhmm.split(":").map((n) => Number.parseInt(n, 10));
  const h = Number.isFinite(hRaw) ? hRaw : 18;
  const m = Number.isFinite(mRaw) ? mRaw : 0;
  const totalSec = (h * 3600 + m * 60 + offsetSec) % 86400;
  const hh = Math.floor(totalSec / 3600).toString().padStart(2, "0");
  const mm = Math.floor((totalSec % 3600) / 60).toString().padStart(2, "0");
  const ss = Math.floor(totalSec % 60).toString().padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

export function PlaylistStreamingPanel({
  onLoadClipToMonitor,
  onStartPlaylistStream,
}: PlaylistStreamingPanelProps) {
  const [playlist, setPlaylist] = useState<PlaylistStreamingItem[]>(DEFAULT_STREAMING_PLAYLIST);
  const [isLoopEnabled, setIsLoopEnabled] = useState<boolean>(true);
  const [isPlayingLive, setIsPlayingLive] = useState<boolean>(false);
  const [currentClipIndex, setCurrentClipIndex] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Destino: Una plataforma o MultiLive
  const [broadcastMode, setBroadcastMode] = useState<"single" | "multilive">("multilive");
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlaylistTargetPlatformId[]>([
    "tiktok",
    "youtube",
    "instagram",
  ]);
  const [customRtmpUrl, setCustomRtmpUrl] = useState<string>("rtmp://live.server.app/live");

  // Programación de horas
  const [scheduleMode, setScheduleMode] = useState<"now" | "scheduled">("now");
  const [scheduledDate, setScheduledDate] = useState<string>("2026-11-13");
  const [scheduledStartTime, setScheduledStartTime] = useState<string>("18:00");
  const [scheduledEndTime, setScheduledEndTime] = useState<string>("20:00");
  const [autoStartAtHour, setAutoStartAtHour] = useState<boolean>(true);

  // Prelanzamientos / Estreno con cuenta regresiva
  const [enablePreLaunch, setEnablePreLaunch] = useState<boolean>(false);
  const [preLaunchMinutes, setPreLaunchMinutes] = useState<number>(5);
  const [preLaunchTitle, setPreLaunchTitle] = useState<string>("¡Estrenamos en vivo en minutos!");

  // Agregar video propio (Archivo local o URL)
  const [showUrlAdder, setShowUrlAdder] = useState<boolean>(false);
  const [urlInput, setUrlInput] = useState<string>("");
  const [urlTitle, setUrlTitle] = useState<string>("");
  const [urlCategory, setUrlCategory] = useState<string>("Propio");
  const [urlDuration, setUrlDuration] = useState<number>(45);
  const fileUploadRef = useRef<HTMLInputElement | null>(null);

  const totalDuration = playlist.reduce((acc, curr) => acc + curr.durationSeconds, 0);

  const showToast = (msg: string, ms = 3500) => {
    setToastMessage(msg);
    window.setTimeout(() => setToastMessage(null), ms);
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleToggleBroadcastMode = (mode: "single" | "multilive") => {
    setBroadcastMode(mode);
    if (mode === "single" && selectedPlatforms.length > 1) {
      setSelectedPlatforms([selectedPlatforms[0]]);
    } else if (mode === "multilive" && selectedPlatforms.length < 2) {
      setSelectedPlatforms(["tiktok", "youtube", "instagram"]);
    }
  };

  const handleSelectPlatform = (id: PlaylistTargetPlatformId) => {
    if (broadcastMode === "single") {
      setSelectedPlatforms([id]);
      return;
    }
    setSelectedPlatforms((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev; // Siempre dejar al menos 1 destino activo
        return prev.filter((item) => item !== id);
      }
      return [...prev, id];
    });
  };

  const handleUploadOwnVideos = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const addedItems: PlaylistStreamingItem[] = [];

    for (let i = 0; i < files.length; i += 1) {
      const file = files[i];
      const videoUrl = URL.createObjectURL(file);
      const cleanName = file.name.replace(/\.[^/.]+$/, "").slice(0, 48) || `Video Propio ${i + 1}`;
      const meta = await readLocalVideoMetadata(file);

      addedItems.push({
        id: `own-clip-${Date.now()}-${i}`,
        title: cleanName,
        durationSeconds: meta.durationSeconds,
        videoUrl,
        thumbnailUrl: meta.thumbnailUrl,
        category: "Video Propio",
        order: playlist.length + i + 1,
      });
    }

    setPlaylist((prev) => [...prev, ...addedItems]);
    showToast(`🎬 ${addedItems.length} video(s) propio(s) agregado(s) a la playlist.`);
  };

  const handleAddByUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    const nextItem: PlaylistStreamingItem = {
      id: `url-clip-${Date.now()}`,
      title: urlTitle.trim() || "Clip Externo MP4",
      durationSeconds: Math.max(5, Number(urlDuration) || 30),
      videoUrl: urlInput.trim(),
      thumbnailUrl: DEFAULT_CUSTOM_THUMB,
      category: urlCategory || "Propio",
      order: playlist.length + 1,
    };
    setPlaylist((prev) => [...prev, nextItem]);
    setUrlInput("");
    setUrlTitle("");
    setShowUrlAdder(false);
    showToast(`🔗 "${nextItem.title}" agregado a la cola de reproducción.`);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const next = [...playlist];
    const temp = next[index - 1];
    next[index - 1] = next[index];
    next[index] = temp;
    setPlaylist(next);
  };

  const handleMoveDown = (index: number) => {
    if (index === playlist.length - 1) return;
    const next = [...playlist];
    const temp = next[index + 1];
    next[index + 1] = next[index];
    next[index] = temp;
    setPlaylist(next);
  };

  const handleDeleteClip = (id: string) => {
    setPlaylist((prev) => prev.filter((p) => p.id !== id));
  };

  const handleStartStreaming = () => {
    setIsPlayingLive(true);
    setCurrentClipIndex(0);
    const meta: PlaylistBroadcastMeta = {
      broadcastMode,
      selectedPlatforms,
      scheduleMode,
      scheduledDate,
      scheduledStartTime,
      scheduledEndTime,
      enablePreLaunch,
      preLaunchMinutes,
      preLaunchTitle,
      customRtmpUrl: selectedPlatforms.includes("custom_rtmp") ? customRtmpUrl : undefined,
    };

    if (onStartPlaylistStream) {
      onStartPlaylistStream(playlist, isLoopEnabled, meta);
    }
    const current = playlist[0];
    if (current && onLoadClipToMonitor) {
      onLoadClipToMonitor(current.videoUrl);
    }
    const platSummary =
      broadcastMode === "multilive"
        ? `MultiLive (${selectedPlatforms.length} plataformas)`
        : PLAYLIST_PLATFORM_OPTIONS.find((p) => p.id === selectedPlatforms[0])?.label || "Plataforma";
    const scheduleSummary =
      scheduleMode === "scheduled"
        ? `programado para ${scheduledDate} a las ${scheduledStartTime}`
        : "iniciado en vivo ahora";
    const preLaunchText = enablePreLaunch ? ` con prelanzamiento de ${preLaunchMinutes} min` : "";
    showToast(`🚀 Playlist ${scheduleSummary} hacia ${platSummary}${preLaunchText}.`, 4200);
  };

  const handleStopStreaming = () => {
    setIsPlayingLive(false);
    showToast("⏹ Playlist Streaming detenido.", 3000);
  };

  // Calcular ventanas horarias acumuladas por clip
  const cumulativeOffsets: number[] = [];
  let runningSec = 0;
  for (const item of playlist) {
    cumulativeOffsets.push(runningSec);
    runningSec += item.durationSeconds;
  }

  return (
    <div className="playlist-streaming-container">
      {toastMessage && (
        <div className="screen-limit-toast" style={{ background: "#10B981" }}>
          <span>{toastMessage}</span>
          <button
            type="button"
            className="toast-close-btn"
            onClick={() => setToastMessage(null)}
          >
            ✕
          </button>
        </div>
      )}

      {/* Header explicativo */}
      <div className="pro-panel-header-banner">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 38, height: 38, borderRadius: 10, background: "rgba(99, 102, 241, 0.16)", color: "#A5B4FC", flexShrink: 0 }}>
              <Dashicon name="controls-repeat" size={20} />
            </span>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.15rem", color: "#FFFFFF" }}>
                Playlist Streaming (Tus Videos, Horarios, Prelanzamientos &amp; MultiLive)
              </h2>
              <p style={{ margin: "3px 0 0 0", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                Sube tus propios videos, programa la hora exacta, activa prelanzamiento con cuenta regresiva y elige transmitir en una sola red o en <strong>MultiLive</strong>.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {isPlayingLive ? (
            <button
              type="button"
              className="btn-apply-cam-primary"
              style={{ backgroundColor: "#EF4444", display: "inline-flex", alignItems: "center", gap: 6 }}
              onClick={handleStopStreaming}
            >
              <Dashicon name="controls-pause" size={15} />
              <span>DETENER EMISIÓN</span>
            </button>
          ) : (
            <button
              type="button"
              className="btn-apply-cam-primary"
              style={{ backgroundColor: scheduleMode === "scheduled" ? "#6366F1" : "#10B981", display: "inline-flex", alignItems: "center", gap: 6 }}
              onClick={handleStartStreaming}
              disabled={playlist.length === 0}
            >
              <Dashicon name={scheduleMode === "scheduled" ? "clock" : "controls-play"} size={15} />
              <span>{scheduleMode === "scheduled" ? "PROGRAMAR PLAYLIST EN VIVO" : "TRANSMITIR PLAYLIST EN VIVO"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Panel de Destino (Plataforma vs MultiLive), Programación Horaria y Prelanzamiento */}
      <div className="playlist-config-grid">
        {/* TARJETA A: PLATAFORMA DEL LIVE O MULTILIVE */}
        <div className="playlist-config-card">
          <div className="playlist-config-card-head">
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <Dashicon name="share" size={16} color="#EC4899" />
              <h3>1. Plataforma de Destino (Live Único o MultiLive)</h3>
            </div>
            <span className="playlist-badge-accent">
              {broadcastMode === "multilive"
                ? `MultiLive · ${selectedPlatforms.length} activas`
                : `Única · ${PLAYLIST_PLATFORM_OPTIONS.find((p) => p.id === selectedPlatforms[0])?.label}`}
            </span>
          </div>

          <div className="playlist-mode-switch-row" role="group" aria-label="Modo de plataformas">
            <button
              type="button"
              className={`pill-ctrl-button ${broadcastMode === "single" ? "active-pink" : ""}`}
              onClick={() => handleToggleBroadcastMode("single")}
            >
              <span>Una Plataforma</span>
            </button>
            <button
              type="button"
              className={`pill-ctrl-button ${broadcastMode === "multilive" ? "active-pink" : ""}`}
              onClick={() => handleToggleBroadcastMode("multilive")}
            >
              <span>MultiLive (Simultáneo)</span>
            </button>
            {broadcastMode === "multilive" && (
              <button
                type="button"
                className="pill-ctrl-button"
                style={{ fontSize: "0.72rem" }}
                onClick={() => setSelectedPlatforms(["tiktok", "youtube", "instagram", "facebook", "twitch"])}
              >
                Seleccionar 5 principales
              </button>
            )}
          </div>

          <div className="playlist-platforms-grid">
            {PLAYLIST_PLATFORM_OPTIONS.map((plat) => {
              const active = selectedPlatforms.includes(plat.id);
              return (
                <button
                  key={plat.id}
                  type="button"
                  className={`playlist-platform-btn ${active ? "active" : ""}`}
                  style={active ? { borderColor: plat.color, background: `${plat.color}1E` } : undefined}
                  onClick={() => handleSelectPlatform(plat.id)}
                  aria-pressed={active}
                >
                  {plat.social ? (
                    <SocialIcon network={plat.social} size={15} style={{ color: plat.color }} />
                  ) : (
                    <Dashicon name="networking" size={15} color={plat.color} />
                  )}
                  <span>{plat.label}</span>
                  {active && <span className="playlist-check-dot" style={{ background: plat.color }} />}
                </button>
              );
            })}
          </div>

          {selectedPlatforms.includes("custom_rtmp") && (
            <div style={{ marginTop: 8 }}>
              <label style={{ display: "block", fontSize: "0.7rem", color: "#94A3B8", marginBottom: 4 }}>
                Servidor RTMP Personalizado:
              </label>
              <input
                type="text"
                className="pro-input-field"
                value={customRtmpUrl}
                onChange={(e) => setCustomRtmpUrl(e.target.value)}
                placeholder="rtmp://tu-servidor/live"
              />
            </div>
          )}
        </div>

        {/* TARJETA B: PROGRAMAR HORAS Y PRELANZAMIENTO */}
        <div className="playlist-config-card">
          <div className="playlist-config-card-head">
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <Dashicon name="clock" size={16} color="#60A5FA" />
              <h3>2. Programar Horas &amp; Prelanzamientos</h3>
            </div>
            <span className="playlist-badge-info">
              {scheduleMode === "scheduled"
                ? `${scheduledDate} · ${scheduledStartTime}`
                : "Salida Inmediata"}
            </span>
          </div>

          {/* Emitir ahora vs Programar fecha y hora */}
          <div className="playlist-mode-switch-row" role="group" aria-label="Modo de horario">
            <button
              type="button"
              className={`pill-ctrl-button ${scheduleMode === "now" ? "active-pink" : ""}`}
              onClick={() => setScheduleMode("now")}
            >
              <span>Emitir Ahora</span>
            </button>
            <button
              type="button"
              className={`pill-ctrl-button ${scheduleMode === "scheduled" ? "active-pink" : ""}`}
              onClick={() => setScheduleMode("scheduled")}
            >
              <span>Programar Fecha y Hora</span>
            </button>
          </div>

          {scheduleMode === "scheduled" && (
            <div className="playlist-schedule-inputs-row">
              <label className="playlist-field-wrap">
                <span>Fecha</span>
                <input
                  type="date"
                  aria-label="Fecha de emisión de la playlist"
                  className="pro-input-field"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                />
              </label>
              <label className="playlist-field-wrap">
                <span>Hora Inicio</span>
                <input
                  type="time"
                  aria-label="Hora de inicio de la playlist"
                  className="pro-input-field"
                  value={scheduledStartTime}
                  onChange={(e) => setScheduledStartTime(e.target.value)}
                />
              </label>
              <label className="playlist-field-wrap">
                <span>Hora Fin</span>
                <input
                  type="time"
                  aria-label="Hora de fin de la playlist"
                  className="pro-input-field"
                  value={scheduledEndTime}
                  onChange={(e) => setScheduledEndTime(e.target.value)}
                />
              </label>
              <label className="playlist-inline-check">
                <input
                  type="checkbox"
                  checked={autoStartAtHour}
                  onChange={(e) => setAutoStartAtHour(e.target.checked)}
                />
                <span>Inicio automático puntual</span>
              </label>
            </div>
          )}

          {/* Bloque Prelanzamiento (Premiere / Sala de espera) */}
          <div className={`playlist-prelaunch-box ${enablePreLaunch ? "active" : ""}`}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Dashicon name="megaphone" size={15} color={enablePreLaunch ? "#FBBF24" : "#94A3B8"} />
                <strong style={{ fontSize: "0.78rem", color: "#FFFFFF" }}>
                  Prelanzamiento / Cuenta Regresiva (Premiere)
                </strong>
              </div>
              <div
                role="switch"
                aria-checked={enablePreLaunch}
                aria-label="Activar prelanzamiento con cuenta regresiva"
                className={`switchy-toggle ${enablePreLaunch ? "active-green" : ""}`}
                onClick={() => setEnablePreLaunch((v) => !v)}
              >
                <div className="switchy-thumb" />
              </div>
            </div>

            {enablePreLaunch ? (
              <div className="playlist-prelaunch-fields">
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <label className="playlist-field-wrap" style={{ minWidth: 140 }}>
                    <span>Cuenta regresiva previa</span>
                    <select
                      aria-label="Duración del prelanzamiento"
                      className="select-ctrl-pill"
                      value={preLaunchMinutes}
                      onChange={(e) => setPreLaunchMinutes(Number(e.target.value))}
                    >
                      <option value={1}>1 min antes (T-01:00)</option>
                      <option value={3}>3 min antes (T-03:00)</option>
                      <option value={5}>5 min antes (T-05:00)</option>
                      <option value={10}>10 min antes (T-10:00)</option>
                      <option value={15}>15 min antes (T-15:00)</option>
                    </select>
                  </label>

                  <label className="playlist-field-wrap" style={{ flex: 1, minWidth: 180 }}>
                    <span>Mensaje en Sala de Espera</span>
                    <input
                      type="text"
                      aria-label="Mensaje de prelanzamiento"
                      className="pro-input-field"
                      value={preLaunchTitle}
                      onChange={(e) => setPreLaunchTitle(e.target.value)}
                      placeholder="Ej: ¡Estrenamos en vivo en minutos!"
                    />
                  </label>
                </div>

                <div className="playlist-prelaunch-preview-strip">
                  <span className="prelaunch-timer-pill">PRELANZAMIENTO T-{preLaunchMinutes.toString().padStart(2, "0")}:00</span>
                  <span style={{ fontSize: "0.72rem", color: "#FDE68A" }}>{preLaunchTitle}</span>
                </div>
              </div>
            ) : (
              <p style={{ margin: "4px 0 0 0", fontSize: "0.7rem", color: "#94A3B8" }}>
                Activa el prelanzamiento para abrir la sala de espera y notificar audiencia con cuenta regresiva antes de iniciar tu primer clip.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Barra de métricas y subida de videos propios */}
      <div className="playlist-summary-bar">
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <div className="summary-metric-pill">
            <span className="metric-label">CLIPS EN COLA:</span>
            <strong className="metric-val">{playlist.length} videos</strong>
          </div>

          <div className="summary-metric-pill">
            <span className="metric-label">DURACIÓN TOTAL:</span>
            <strong className="metric-val">{formatSeconds(totalDuration)} min</strong>
          </div>

          <div className="summary-metric-pill">
            <span className="metric-label">ESTADO:</span>
            <strong className="metric-val" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: isPlayingLive ? "var(--ok-green)" : "#9CA3AF" }}>
              <Dashicon name={isPlayingLive ? "controls-play" : "controls-pause"} size={14} />
              <span>
                {isPlayingLive
                  ? "EN EMISIÓN"
                  : scheduleMode === "scheduled"
                  ? "PROGRAMADO"
                  : "STANDBY"}
              </span>
            </strong>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <label className="pill-ctrl-button active-pink" style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Dashicon name="upload" size={14} />
            <span>+ Subir Mis Videos</span>
            <input
              ref={fileUploadRef}
              type="file"
              multiple
              accept="video/mp4,video/webm,video/quicktime,video/x-matroska,.mp4,.webm,.mov,.mkv,.m4v"
              aria-label="Subir videos propios a la playlist"
              style={{ display: "none" }}
              onChange={(e) => {
                void handleUploadOwnVideos(e.target.files);
                e.target.value = "";
              }}
            />
          </label>

          <button
            type="button"
            className="pill-ctrl-button"
            style={{ display: "inline-flex", alignItems: "center", gap: 5 }}
            onClick={() => setShowUrlAdder((v) => !v)}
          >
            <Dashicon name="rest-api" size={13} />
            <span>+ Video por URL</span>
          </button>

          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.76rem", cursor: "pointer", fontWeight: 700 }}>
            <input
              type="checkbox"
              checked={isLoopEnabled}
              onChange={(e) => setIsLoopEnabled(e.target.checked)}
            />
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <Dashicon name="controls-repeat" size={14} color="#60A5FA" />
              <span>Bucle 24/7</span>
            </span>
          </label>
        </div>
      </div>

      {/* Formulario rápido para agregar clip por URL */}
      {showUrlAdder && (
        <form onSubmit={handleAddByUrl} className="playlist-url-adder-form">
          <input
            type="text"
            className="pro-input-field"
            value={urlTitle}
            onChange={(e) => setUrlTitle(e.target.value)}
            placeholder="Título del video (Ej: Lanzamiento Producto)"
            required
          />
          <input
            type="url"
            className="pro-input-field"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://.../mi-video.mp4"
            required
          />
          <input
            type="number"
            min={5}
            max={7200}
            className="pro-input-field"
            style={{ width: 92 }}
            value={urlDuration}
            onChange={(e) => setUrlDuration(Number(e.target.value))}
            title="Duración en segundos"
          />
          <select
            className="select-ctrl-pill"
            value={urlCategory}
            onChange={(e) => setUrlCategory(e.target.value)}
          >
            <option value="Propio">Video Propio</option>
            <option value="Prelanzamiento">Prelanzamiento</option>
            <option value="Comercial">Comercial</option>
            <option value="Webinar">Webinar</option>
            <option value="Outro">Cierre</option>
          </select>
          <button type="submit" className="btn-apply-cam-primary" style={{ padding: "8px 14px" }}>
            Agregar a Cola
          </button>
        </form>
      )}

      {/* Lista interactiva de videos en la playlist */}
      <div className="playlist-track-list">
        {playlist.map((item, index) => {
          const isCurrentlyPlaying = isPlayingLive && currentClipIndex === index;
          const startClock = addSecondsToClock(scheduledStartTime, cumulativeOffsets[index] || 0);
          const endClock = addSecondsToClock(
            scheduledStartTime,
            (cumulativeOffsets[index] || 0) + item.durationSeconds
          );
          const isLocalBlob = item.videoUrl.startsWith("blob:");

          return (
            <div
              key={item.id}
              className={`playlist-track-item ${isCurrentlyPlaying ? "currently-playing" : ""}`}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                <span className="track-number-badge">#{index + 1}</span>

                <div className="track-thumb-preview">
                  {isLocalBlob ? (
                    <video
                      src={item.videoUrl}
                      muted
                      playsInline
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.thumbnailUrl} alt={item.title} />
                  )}
                  <span className="track-duration-tag">{formatSeconds(item.durationSeconds)}</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
                  <strong style={{ fontSize: "0.88rem", color: "#FFFFFF" }}>{item.title}</strong>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <span className="track-category-pill">{item.category}</span>
                    {scheduleMode === "scheduled" && (
                      <span className="playlist-slot-time-pill">
                        🕒 {startClock} → {endClock}
                      </span>
                    )}
                    <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                      {isLocalBlob ? "Archivo local subido" : `URL: ${item.videoUrl.split("/").pop()}`}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                {isCurrentlyPlaying && (
                  <span className="now-playing-badge">
                    <span className="rec-pulse-dot" /> EMITIENDO AHORA
                  </span>
                )}

                <button
                  type="button"
                  className="pill-ctrl-button"
                  style={{ padding: "4px 8px", fontSize: "0.72rem", display: "inline-flex", alignItems: "center", gap: 5 }}
                  onClick={() => onLoadClipToMonitor && onLoadClipToMonitor(item.videoUrl)}
                  title="Cargar este video directamente en el monitor de cabina CAM"
                >
                  <Dashicon name="visibility" size={13} />
                  <span>Probar en Monitor</span>
                </button>

                <button
                  type="button"
                  className="pill-ctrl-button"
                  style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                  title="Subir en el orden de reproducción"
                >
                  ↑
                </button>

                <button
                  type="button"
                  className="pill-ctrl-button"
                  style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                  onClick={() => handleMoveDown(index)}
                  disabled={index === playlist.length - 1}
                  title="Bajar en el orden de reproducción"
                >
                  ↓
                </button>

                <button
                  type="button"
                  className="tryon-delete-badge"
                  style={{ position: "static", width: 22, height: 22 }}
                  onClick={() => handleDeleteClip(item.id)}
                  title="Eliminar de la lista"
                >
                  ×
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

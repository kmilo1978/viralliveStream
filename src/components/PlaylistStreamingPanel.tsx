"use client";

import React, { useState } from "react";
import {
  DEFAULT_STREAMING_PLAYLIST,
  type PlaylistStreamingItem,
} from "@/lib/studio-data";
import { Dashicon } from "@/components/Dashicons";

interface PlaylistStreamingPanelProps {
  onLoadClipToMonitor?: (videoUrl: string) => void;
  onStartPlaylistStream?: (playlist: PlaylistStreamingItem[], loop: boolean) => void;
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

  const totalDuration = playlist.reduce((acc, curr) => acc + curr.durationSeconds, 0);

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
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
    if (onStartPlaylistStream) {
      onStartPlaylistStream(playlist, isLoopEnabled);
    }
    const current = playlist[0];
    if (current && onLoadClipToMonitor) {
      onLoadClipToMonitor(current.videoUrl);
    }
    setToastMessage("🚀 ¡Playlist Streaming iniciado con éxito! Transmitiendo clips en secuencia.");
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleStopStreaming = () => {
    setIsPlayingLive(false);
    setToastMessage("⏹ Playlist Streaming detenido.");
    setTimeout(() => setToastMessage(null), 3000);
  };

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
                Playlist Streaming (Transmisión Continua en Bucle)
              </h2>
              <p style={{ margin: "3px 0 0 0", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                Organiza videos y clips pregrabados para transmitirlos en bucle 24/7 o en una secuencia programada hacia más de 45 redes sociales al mismo tiempo (estilo OneStream Live).
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
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
              style={{ backgroundColor: "#10B981", display: "inline-flex", alignItems: "center", gap: 6 }}
              onClick={handleStartStreaming}
            >
              <Dashicon name="controls-play" size={15} />
              <span>TRANSMITIR PLAYLIST EN VIVO</span>
            </button>
          )}
        </div>
      </div>

      {/* Barra de métricas y configuración de la lista */}
      <div className="playlist-summary-bar">
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
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
              <span>{isPlayingLive ? "EN EMISIÓN" : "STANDBY"}</span>
            </strong>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.78rem", cursor: "pointer", fontWeight: 700 }}>
            <input
              type="checkbox"
              checked={isLoopEnabled}
              onChange={(e) => setIsLoopEnabled(e.target.checked)}
            />
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Dashicon name="controls-repeat" size={14} color="#60A5FA" />
              <span>Repetir en Bucle Continuo (24/7)</span>
            </span>
          </label>
        </div>
      </div>

      {/* Lista interactiva de videos en la playlist */}
      <div className="playlist-track-list">
        {playlist.map((item, index) => {
          const isCurrentlyPlaying = isPlayingLive && currentClipIndex === index;
          return (
            <div
              key={item.id}
              className={`playlist-track-item ${isCurrentlyPlaying ? "currently-playing" : ""}`}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span className="track-number-badge">#{index + 1}</span>

                <div className="track-thumb-preview">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.thumbnailUrl} alt={item.title} />
                  <span className="track-duration-tag">{formatSeconds(item.durationSeconds)}</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <strong style={{ fontSize: "0.88rem", color: "#FFFFFF" }}>{item.title}</strong>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span className="track-category-pill">{item.category}</span>
                    <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                      URL: {item.videoUrl.split("/").pop()}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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

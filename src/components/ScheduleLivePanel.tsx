"use client";

import React, { useState, useEffect } from "react";
import {
  DEFAULT_SCHEDULED_EVENTS,
  type ScheduledLiveEvent,
} from "@/lib/studio-data";
import { Dashicon } from "@/components/Dashicons";

interface ScheduleLivePanelProps {
  onGoLiveInstant?: () => void;
  isCurrentlyLive?: boolean;
}

export function ScheduleLivePanel({
  onGoLiveInstant,
  isCurrentlyLive,
}: ScheduleLivePanelProps) {
  const [events, setEvents] = useState<ScheduledLiveEvent[]>(DEFAULT_SCHEDULED_EVENTS);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>("");
  const [newDate, setNewDate] = useState<string>("2026-11-13");
  const [newTime, setNewTime] = useState<string>("18:00");
  const [newDesc, setNewDesc] = useState<string>("");
  const [newAutoStart, setNewAutoStart] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Cuenta regresiva animada para el próximo evento
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; mins: number; secs: number }>({
    days: 1,
    hours: 11,
    mins: 58,
    secs: 32,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.secs > 0) return { ...prev, secs: prev.secs - 1 };
        if (prev.mins > 0) return { ...prev, mins: prev.mins - 1, secs: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, mins: 59, secs: 59 };
        if (prev.days > 0) return { ...prev, days: prev.days - 1, hours: 23, mins: 59, secs: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleInstantGoLive = () => {
    if (onGoLiveInstant) {
      onGoLiveInstant();
    }
    setToastMessage("🚀 ¡Transmisión en vivo iniciada simultáneamente en todas las plataformas conectadas!");
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newEv: ScheduledLiveEvent = {
      id: `ev-${Date.now()}`,
      title: newTitle.trim(),
      scheduledDate: newDate,
      scheduledTime: newTime,
      destinationsCount: 5,
      platforms: ["tiktok", "youtube", "instagram", "facebook", "twitch"],
      description: newDesc.trim() || "Transmisión programada multidestino con Virallive.",
      status: "scheduled",
      autoStart: newAutoStart,
    };

    setEvents((prev) => [newEv, ...prev]);
    setShowAddModal(false);
    setNewTitle("");
    setNewDesc("");
    setToastMessage(`🗓️ Evento "${newEv.title}" programado con éxito.`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleDeleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((ev) => ev.id !== id));
  };

  return (
    <div className="schedule-live-panel-container">
      {toastMessage && (
        <div className="screen-limit-toast" style={{ background: "#EF4444" }}>
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

      {/* Cabecera explicativa */}
      <div className="pro-panel-header-banner">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 38, height: 38, borderRadius: 10, background: "rgba(59, 130, 246, 0.16)", color: "#60A5FA", flexShrink: 0 }}>
              <Dashicon name="calendar-alt" size={20} />
            </span>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.15rem", color: "#FFFFFF" }}>
                Schedule or Go Live (Planifica o Transmite al Instante)
              </h2>
              <p style={{ margin: "3px 0 0 0", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                &ldquo;Plan ahead or go live in the moment. One button is all it takes to start multiplatform streaming to the world.&rdquo; (OneStream Live).
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="btn-apply-cam-primary"
          style={{ backgroundColor: "#3B82F6" }}
          onClick={() => setShowAddModal(true)}
        >
          + PROGRAMAR NUEVA TRANSMISIÓN
        </button>
      </div>

      {/* HERO SECTION DE 1-CLIC GO LIVE & CUENTA REGRESIVA */}
      <div className="schedule-hero-banner">
        {/* Lado izquierdo: Botón Go Live Now */}
        <div className="go-live-now-cta-box">
          <span style={{ fontSize: "0.75rem", color: "#FCA5A5", fontWeight: 800, letterSpacing: "1px" }}>
            TRANSMISIÓN INMEDIATA MULTIPLATAFORMA
          </span>
          <h3 style={{ margin: "4px 0 10px 0", fontSize: "1.25rem", color: "#FFFFFF" }}>
            Un solo botón conecta tu señal con el mundo
          </h3>
          <p style={{ margin: "0 0 16px 0", fontSize: "0.78rem", color: "#E5E7EB", maxWidth: 420 }}>
            Inicia emisión en tiempo real a Facebook, YouTube, Instagram, TikTok y más de 45 redes simultáneas con un solo toque.
          </p>

          <button
            type="button"
            className={`btn-hero-go-live-now ${isCurrentlyLive ? "is-live" : ""}`}
            onClick={handleInstantGoLive}
          >
            <span className="rec-pulse-dot" style={{ width: 12, height: 12, backgroundColor: "#FFF" }} />
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <Dashicon name={isCurrentlyLive ? "controls-pause" : "controls-play"} size={16} />
              <span>{isCurrentlyLive ? "EN VIVO AHORA (DETENER)" : "GO LIVE NOW"}</span>
            </span>
          </button>
        </div>

        {/* Lado derecho: Widget de Cuenta Regresiva para el próximo directo */}
        <div className="next-event-countdown-widget">
          <span className="countdown-subtitle">PRÓXIMO DIRECTO PROGRAMADO:</span>
          <strong className="countdown-event-title">{events[0]?.title || "Sesión en Vivo"}</strong>

          <div className="countdown-clock-row">
            <div className="clock-unit-col">
              <span className="clock-num">{timeLeft.days.toString().padStart(2, "0")}</span>
              <span className="clock-lbl">DÍAS</span>
            </div>
            <span className="clock-separator">:</span>
            <div className="clock-unit-col">
              <span className="clock-num">{timeLeft.hours.toString().padStart(2, "0")}</span>
              <span className="clock-lbl">HORAS</span>
            </div>
            <span className="clock-separator">:</span>
            <div className="clock-unit-col">
              <span className="clock-num">{timeLeft.mins.toString().padStart(2, "0")}</span>
              <span className="clock-lbl">MIN</span>
            </div>
            <span className="clock-separator">:</span>
            <div className="clock-unit-col">
              <span className="clock-num">{timeLeft.secs.toString().padStart(2, "0")}</span>
              <span className="clock-lbl">SEG</span>
            </div>
          </div>

          <div className="countdown-footer-meta">
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <Dashicon name="calendar-alt" size={13} />
              <span>{events[0]?.scheduledDate} a las {events[0]?.scheduledTime} hrs</span>
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <Dashicon name="networking" size={13} />
              <span>{events[0]?.destinationsCount || 5} Redes Conectadas</span>
            </span>
          </div>
        </div>
      </div>

      {/* LISTA DE TRANSMISIONES PROGRAMADAS */}
      <div className="scheduled-events-section">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: "0.95rem", color: "#FFFFFF" }}>
            Transmisiones en Calendario ({events.length})
          </h3>
          <span style={{ fontSize: "0.74rem", color: "var(--text-secondary)" }}>
            Las transmisiones se iniciarán automáticamente si la opción Auto-Start está encendida.
          </span>
        </div>

        <div className="scheduled-events-table-wrap">
          {events.map((ev) => (
            <div key={ev.id} className="scheduled-event-card">
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div className="event-calendar-badge">
                  <span className="cal-month">{ev.scheduledDate.split("-")[1] === "11" ? "NOV" : "DIC"}</span>
                  <strong className="cal-day">{ev.scheduledDate.split("-")[2]}</strong>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <strong style={{ fontSize: "0.92rem", color: "#FFFFFF" }}>{ev.title}</strong>
                  <p style={{ margin: 0, fontSize: "0.74rem", color: "var(--text-secondary)" }}>
                    {ev.description}
                  </p>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4, flexWrap: "wrap" }}>
                    <span className="time-pill" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <Dashicon name="clock" size={12} /> {ev.scheduledTime} hrs
                    </span>
                    <span className="network-pill" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <Dashicon name="networking" size={12} /> {ev.platforms.join(", ").toUpperCase()}
                    </span>
                    {ev.autoStart && (
                      <span className="autostart-pill" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <Dashicon name="controls-play" size={12} /> Auto-Start Activo
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  type="button"
                  className="pill-ctrl-button"
                  style={{ backgroundColor: "#10B981", color: "#FFF", borderColor: "#10B981", fontWeight: 800 }}
                  onClick={handleInstantGoLive}
                  title="Emitir este evento ahora mismo"
                >
                  ▶ Transmitir Ahora
                </button>

                <button
                  type="button"
                  className="tryon-delete-badge"
                  style={{ position: "static", width: 22, height: 22 }}
                  onClick={() => handleDeleteEvent(ev.id)}
                  title="Eliminar evento programado"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL CREAR EVENTO PROGRAMADO */}
      {showAddModal && (
        <div className="multistream-modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="multistream-modal-card" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
            <div className="multistream-modal-header">
              <div>
                <h3 style={{ margin: 0, color: "#FFF", display: "flex", alignItems: "center", gap: 8 }}>
                  <Dashicon name="calendar-alt" size={18} color="#60A5FA" />
                  <span>Programar Transmisión Futura</span>
                </h3>
                <p style={{ margin: "4px 0 0 0", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                  Configura fecha, hora y plataformas de multidifusión automática.
                </p>
              </div>
              <button
                type="button"
                className="multistream-modal-close"
                onClick={() => setShowAddModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEvent} style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: "0.74rem", color: "var(--text-secondary)", fontWeight: 700 }}>
                  Título del Directo:
                </label>
                <input
                  type="text"
                  className="pro-input-field"
                  placeholder="Ej: Gran Lanzamiento de Primavera en Vivo"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: "0.74rem", color: "var(--text-secondary)", fontWeight: 700 }}>
                    Fecha de Emisión:
                  </label>
                  <input
                    type="date"
                    className="pro-input-field"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.74rem", color: "var(--text-secondary)", fontWeight: 700 }}>
                    Hora (HH:MM):
                  </label>
                  <input
                    type="time"
                    className="pro-input-field"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.74rem", color: "var(--text-secondary)", fontWeight: 700 }}>
                  Descripción / Notas:
                </label>
                <textarea
                  className="pro-textarea-field"
                  rows={2}
                  placeholder="Detalles sobre el evento, productos o invitados..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                />
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.78rem", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={newAutoStart}
                  onChange={(e) => setNewAutoStart(e.target.checked)}
                />
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <Dashicon name="controls-play" size={14} color="#60A5FA" />
                  <span>Auto-Start: Iniciar transmisión automáticamente al llegar la hora</span>
                </span>
              </label>

              <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  className="btn-modal-cancel"
                  style={{ flex: 1 }}
                  onClick={() => setShowAddModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-apply-cam-primary"
                  style={{ flex: 2, backgroundColor: "#3B82F6" }}
                >
                  Guardar y Programar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

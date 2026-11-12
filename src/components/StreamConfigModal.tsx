"use client";

import React, { useState } from "react";
import {
  type ViewerRangeOption,
  DEFAULT_VIEWER_RANGES,
} from "@/lib/studio-data";
import {
  PlatformLogo,
  InstagramLogo,
  TikTokLogo,
  YouTubeLogo,
  TwitchLogo,
} from "@/components/PlatformLogos";
import { Dashicon } from "@/components/Dashicons";

export type StreamPlatform = "instagram" | "tiktok" | "youtube" | "twitch";

export interface StreamConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedViewerRange: ViewerRangeOption;
  onSelectViewerRange: (range: ViewerRangeOption) => void;
  recordStreamEnabled: boolean;
  onToggleRecordStream: (enabled: boolean) => void;
  onStartStream: (platform: StreamPlatform) => void;
  isConnectedLive: boolean;
  phoneMockupMode: boolean;
  onTogglePhoneMockupMode: (enabled: boolean) => void;
  cropAspect: "9:16" | "16:9" | "1:1";
  onSelectCropAspect: (aspect: "9:16" | "16:9" | "1:1") => void;
  mobileOnly916?: boolean;
  streamerName: string;
  onChangeStreamerName: (name: string) => void;
}

export function StreamConfigModal({
  isOpen,
  onClose,
  selectedViewerRange,
  onSelectViewerRange,
  recordStreamEnabled,
  onToggleRecordStream,
  onStartStream,
  isConnectedLive,
  phoneMockupMode,
  onTogglePhoneMockupMode,
  cropAspect,
  onSelectCropAspect,
  mobileOnly916 = false,
  streamerName,
  onChangeStreamerName,
}: StreamConfigModalProps) {
  const [activeTab, setActiveTab] = useState<"Profile" | "Stream" | "Camera" | "Comments">("Stream");
  const [selectedPlatform, setSelectedPlatform] = useState<StreamPlatform>("instagram");
  const [isBookmarked, setIsBookmarked] = useState(true);

  if (!isOpen) return null;

  const platforms: { id: StreamPlatform; name: string; brandColor: string }[] = [
    { id: "instagram", name: "Instagram", brandColor: "#E1306C" },
    { id: "tiktok", name: "TikTok", brandColor: "#FE2C55" },
    { id: "youtube", name: "YouTube", brandColor: "#FF0000" },
    { id: "twitch", name: "Twitch", brandColor: "#9146FF" },
  ];

  const currentPlatformObj = platforms.find((p) => p.id === selectedPlatform) || platforms[0];

  return (
    <div
      className="stream-config-modal-backdrop"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0, 0, 0, 0.82)",
        backdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        className="stream-config-modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 420,
          background: "linear-gradient(180deg, #181822 0%, #0F0F17 100%)",
          borderRadius: 28,
          border: "1px solid rgba(255, 255, 255, 0.12)",
          boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 40px rgba(236, 72, 153, 0.2)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Glow de ambientación superior */}
        <div
          style={{
            position: "absolute",
            top: -60,
            left: "50%",
            transform: "translateX(-50%)",
            width: 240,
            height: 120,
            background: "radial-gradient(ellipse at center, rgba(236, 72, 153, 0.35) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* 1. HEADER (IDÉNTICO A LA FOTO DEL USUARIO) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 20px 14px 20px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            position: "relative",
            zIndex: 10,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              border: "none",
              borderRadius: 12,
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF",
              fontSize: "1.2rem",
              cursor: "pointer",
              transition: "background 0.2s ease",
            }}
            title="Volver"
          >
            ‹
          </button>

          <div style={{ textAlign: "center" }}>
            <h2
              style={{
                margin: 0,
                fontSize: "1rem",
                fontWeight: 800,
                color: "#FFFFFF",
                letterSpacing: "0.2px",
              }}
            >
              Stream Config
            </h2>
            <p
              style={{
                margin: "2px 0 0 0",
                fontSize: "0.72rem",
                color: "#94A3B8",
              }}
            >
              Set up your live stream
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsBookmarked(!isBookmarked)}
            style={{
              background: isBookmarked ? "rgba(236, 72, 153, 0.18)" : "rgba(255, 255, 255, 0.08)",
              border: isBookmarked ? "1px solid rgba(236, 72, 153, 0.5)" : "none",
              borderRadius: 12,
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: isBookmarked ? "#EC4899" : "#FFFFFF",
              fontSize: "1.1rem",
              cursor: "pointer",
            }}
            title={isBookmarked ? "Configuración guardada" : "Guardar como preset"}
          >
            🔖
          </button>
        </div>

        {/* 2. SUB-BARRA DE PESTAÑAS (PROFILE, STREAM, CAMERA, COMMENTS) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(72px, 1fr))",
            gap: 6,
            padding: "12px 16px",
            background: "rgba(10, 10, 16, 0.5)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
          }}
        >
          {(["Profile", "Stream", "Camera", "Comments"] as const).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: "8px 0",
                  borderRadius: 10,
                  border: "none",
                  background: isActive ? "linear-gradient(135deg, #EC4899 0%, #BE185D 100%)" : "rgba(255, 255, 255, 0.05)",
                  color: isActive ? "#FFFFFF" : "#94A3B8",
                  fontSize: "0.74rem",
                  fontWeight: isActive ? 800 : 600,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: isActive ? "0 4px 12px rgba(236, 72, 153, 0.35)" : "none",
                }}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* 3. CONTENIDO DINÁMICO POR PESTAÑA */}
        <div
          style={{
            padding: "16px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
            maxHeight: "68vh",
            overflowY: "auto",
          }}
        >
          {/* ===================== TAB STREAM (PRINCIPAL) ===================== */}
          {activeTab === "Stream" && (
            <>
              {/* Tarjeta de Plataforma Seleccionada */}
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: 16,
                  padding: "14px 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: currentPlatformObj.brandColor,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: `0 4px 14px ${currentPlatformObj.brandColor}66`,
                    }}
                  >
                    <PlatformLogo platform={selectedPlatform} size={24} />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "#FFFFFF" }}>
                        {currentPlatformObj.name}
                      </span>
                      <span
                        style={{
                          fontSize: "0.62rem",
                          fontWeight: 900,
                          color: "#EF4444",
                          background: "rgba(239, 68, 68, 0.15)",
                          padding: "1px 6px",
                          borderRadius: 6,
                          letterSpacing: "0.5px",
                        }}
                      >
                        ● LIVE
                      </span>
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "#94A3B8", marginTop: 2 }}>
                      Ready to stream
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "#10B981",
                      boxShadow: "0 0 10px #10B981",
                    }}
                  />
                  <select
                    value={selectedPlatform}
                    onChange={(e) => setSelectedPlatform(e.target.value as StreamPlatform)}
                    style={{
                      background: "rgba(255, 255, 255, 0.08)",
                      border: "none",
                      color: "#FFFFFF",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      borderRadius: 8,
                      padding: "4px 8px",
                      cursor: "pointer",
                      outline: "none",
                    }}
                  >
                    {platforms.map((p) => (
                      <option key={p.id} value={p.id} style={{ background: "#181822", color: "#FFF" }}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sección VIEWER RANGE (Rejilla de 8 pastillas idéntica a la imagen del usuario) */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <Dashicon name="groups" size={16} color="#EC4899" />
                  <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "#FFFFFF" }}>
                    Viewer Range
                  </span>
                </div>
                <div style={{ fontSize: "0.7rem", color: "#94A3B8", marginBottom: 10 }}>
                  Select your target audience size
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: 8,
                  }}
                >
                  {DEFAULT_VIEWER_RANGES.map((range) => {
                    const isSelected = selectedViewerRange.id === range.id;
                    return (
                      <button
                        key={range.id}
                        type="button"
                        onClick={() => onSelectViewerRange(range)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                          padding: "10px 12px",
                          borderRadius: 14,
                          background: isSelected
                            ? "rgba(236, 72, 153, 0.12)"
                            : "rgba(255, 255, 255, 0.04)",
                          border: isSelected
                            ? "1.5px solid #EC4899"
                            : "1px solid rgba(255, 255, 255, 0.08)",
                          color: isSelected ? "#FFFFFF" : "#CBD5E1",
                          fontSize: "0.78rem",
                          fontWeight: isSelected ? 800 : 600,
                          cursor: "pointer",
                          transition: "all 0.18s ease",
                          boxShadow: isSelected ? "0 0 14px rgba(236, 72, 153, 0.25)" : "none",
                        }}
                      >
                        <Dashicon name="groups" size={14} style={{ opacity: isSelected ? 1 : 0.65 }} />
                        <span>{range.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sección RECORD STREAM (Switch idéntico a la imagen) */}
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: 16,
                  padding: "14px 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      background: "rgba(255, 255, 255, 0.06)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#EC4899",
                    }}
                  >
                    <Dashicon name="video-alt2" size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "#FFFFFF" }}>
                      Record Stream
                    </div>
                    <div style={{ fontSize: "0.68rem", color: "#94A3B8", marginTop: 2 }}>
                      Save recording to gallery when stream ends
                    </div>
                  </div>
                </div>

                <label
                  style={{
                    position: "relative",
                    display: "inline-block",
                    width: 44,
                    height: 24,
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={recordStreamEnabled}
                    onChange={(e) => onToggleRecordStream(e.target.checked)}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      inset: 0,
                      backgroundColor: recordStreamEnabled ? "#EC4899" : "rgba(255, 255, 255, 0.2)",
                      borderRadius: 24,
                      transition: "0.3s",
                      boxShadow: recordStreamEnabled ? "0 0 10px rgba(236, 72, 153, 0.6)" : "none",
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        height: 18,
                        width: 18,
                        left: 3,
                        bottom: 3,
                        backgroundColor: "#FFFFFF",
                        borderRadius: "50%",
                        transition: "0.3s",
                        transform: recordStreamEnabled ? "translateX(20px)" : "translateX(0)",
                      }}
                    />
                  </span>
                </label>
              </div>

              {/* BOTÓN VIBRANTE PRINCIPAL (Start Instagram Stream) */}
              <button
                type="button"
                onClick={() => {
                  onStartStream(selectedPlatform);
                  onClose();
                }}
                style={{
                  width: "100%",
                  padding: "14px 20px",
                  borderRadius: 16,
                  border: "none",
                  background: isConnectedLive
                    ? "linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)"
                    : "linear-gradient(135deg, #EC4899 0%, #E11D48 100%)",
                  color: "#FFFFFF",
                  fontSize: "0.92rem",
                  fontWeight: 900,
                  cursor: "pointer",
                  boxShadow: "0 8px 24px rgba(236, 72, 153, 0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  letterSpacing: "0.3px",
                  transition: "transform 0.15s ease",
                }}
              >
                <span>{isConnectedLive ? "⏹ Detener Transmisión" : `Start ${currentPlatformObj.name} Stream`}</span>
                <span>➔</span>
              </button>
            </>
          )}

          {/* ===================== TAB CAMERA ===================== */}
          {activeTab === "Camera" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 800, color: "#FFFFFF" }}>
                  Formato de Pantalla &amp; Monitor:
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(96px, 1fr))", gap: 8, marginTop: 8 }}>
                  {(mobileOnly916 ? (["9:16"] as const) : (["9:16", "16:9", "1:1"] as const)).map((aspect) => (
                    <button
                      key={aspect}
                      type="button"
                      onClick={() => onSelectCropAspect(aspect)}
                      style={{
                        padding: "10px 8px",
                        borderRadius: 12,
                        background: (mobileOnly916 ? "9:16" : cropAspect) === aspect ? "rgba(236, 72, 153, 0.15)" : "rgba(255, 255, 255, 0.05)",
                        border: (mobileOnly916 ? "9:16" : cropAspect) === aspect ? "1.5px solid #EC4899" : "1px solid rgba(255, 255, 255, 0.1)",
                        color: "#FFFFFF",
                        fontSize: "0.78rem",
                        fontWeight: 800,
                        cursor: "pointer",
                      }}
                    >
                      {aspect === "9:16"
                        ? mobileOnly916
                          ? "📱 9:16 Vertical (Único en Móvil)"
                          : "📱 9:16 Móvil"
                        : aspect === "16:9"
                          ? "🖥️ 16:9 Panorámico"
                          : "⏹️ 1:1 Cuadrado"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Marco de Smartphone Delulu Stream Toggle (solo escritorio/tablet) */}
              {!mobileOnly916 && (
                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: 14,
                    padding: "12px 14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.82rem", fontWeight: 800, color: "#FFFFFF" }}>
                      <Dashicon name="smartphone" size={15} color="#EC4899" />
                      <span>Marco de Smartphone (Virallive Mockup)</span>
                    </div>
                    <div style={{ fontSize: "0.68rem", color: "#94A3B8" }}>
                      Chasis iPhone con Dynamic Island y neón exterior
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={phoneMockupMode}
                    onChange={(e) => onTogglePhoneMockupMode(e.target.checked)}
                    style={{ width: 20, height: 20, accentColor: "#EC4899", cursor: "pointer" }}
                  />
                </div>
              )}
            </div>
          )}

          {/* ===================== TAB COMMENTS ===================== */}
          {activeTab === "Comments" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ fontSize: "0.8rem", color: "#94A3B8" }}>
                Los comentarios y reacciones con IA se simulan con estética de vidrio esmerilado, avatares circulares y checkmarks azules.
              </div>
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.04)",
                  borderRadius: 12,
                  padding: 12,
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.74rem", fontWeight: 800, color: "#FFF", marginBottom: 6 }}>
                  <Dashicon name="format-chat" size={14} color="#EC4899" />
                  <span>Ejemplo en Vivo:</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#3B82F6", color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 900 }}>
                    S
                  </div>
                  <div>
                    <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#FFF" }}>ShotCaller ✓</span>
                    <p style={{ margin: 0, fontSize: "0.7rem", color: "#E2E8F0" }}>Keep it up! You&apos;re the best! 🔥</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================== TAB PROFILE ===================== */}
          {activeTab === "Profile" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 800, color: "#FFFFFF" }}>
                  Nombre del Streamer:
                </label>
                <input
                  type="text"
                  value={streamerName}
                  onChange={(e) => onChangeStreamerName(e.target.value)}
                  style={{
                    width: "100%",
                    background: "rgba(255, 255, 255, 0.06)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: 10,
                    padding: "8px 12px",
                    color: "#FFFFFF",
                    fontSize: "0.82rem",
                    marginTop: 6,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

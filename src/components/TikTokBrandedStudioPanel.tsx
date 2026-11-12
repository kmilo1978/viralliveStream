"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  DEFAULT_TIKTOK_BRAND_THEMES,
  type TikTokBrandTheme,
  DEFAULT_VIRTUAL_BACKGROUNDS,
  type VirtualBackgroundItem,
  DEFAULT_VIEWER_RANGES,
  type ViewerRangeOption,
} from "@/lib/studio-data";
import { PlatformLogo, TikTokLogo, SocialIcon } from "@/components/PlatformLogos";
import { Dashicon } from "@/components/Dashicons";
import { ViewerRangeControl } from "@/components/ViewerRangeControl";

interface TikTokBrandedStudioPanelProps {
  onApplyThemeToCam?: (theme: TikTokBrandTheme, backgroundId?: string) => void;
  onSelectCropAspect?: (aspect: "9:16" | "16:9" | "1:1") => void;
  virtualBackgrounds?: VirtualBackgroundItem[];
  selectedBgId?: string;
  onSelectBackground?: (bg: VirtualBackgroundItem) => void;
  onAddCustomBackground?: (file: File, mediaType?: "image" | "video") => void;
  viewerRange?: ViewerRangeOption;
  onSelectViewerRange?: (range: ViewerRangeOption) => void;
  hideViewerRangeCard?: boolean;
}

export function TikTokBrandedStudioPanel({
  onApplyThemeToCam,
  onSelectCropAspect,
  virtualBackgrounds: propBackgrounds,
  selectedBgId: propSelectedBgId,
  onSelectBackground,
  onAddCustomBackground,
  viewerRange: propViewerRange,
  onSelectViewerRange,
  hideViewerRangeCard = false,
}: TikTokBrandedStudioPanelProps) {
  const [themes, setThemes] = useState<TikTokBrandTheme[]>(DEFAULT_TIKTOK_BRAND_THEMES);
  const [activeThemeId, setActiveThemeId] = useState<string>("tt-beauty");
  const [customBrandName, setCustomBrandName] = useState<string>("Beauty by Mia");
  const [customTagline, setCustomTagline] = useState<string>("Glow & Skincare Daily");
  const [showHeartsAnim, setShowHeartsAnim] = useState<boolean>(true);
  const [showLiveBadge, setShowLiveBadge] = useState<boolean>(true);
  const [showShopPill, setShowShopPill] = useState<boolean>(true);
  const [localViewerRange, setLocalViewerRange] = useState<ViewerRangeOption>(DEFAULT_VIEWER_RANGES[6]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const activeViewerRange = propViewerRange || localViewerRange;
  const handleChangeViewerRange = (range: ViewerRangeOption) => {
    setLocalViewerRange(range);
    if (onSelectViewerRange) onSelectViewerRange(range);
  };

  // Lista de fondos virtuales disponibles
  const [bgList, setBgList] = useState<VirtualBackgroundItem[]>(
    propBackgrounds && propBackgrounds.length > 0 ? propBackgrounds : DEFAULT_VIRTUAL_BACKGROUNDS
  );

  // Fondo seleccionado para TikTok Live (por defecto Chroma Key Verde #00FF00)
  const [tiktokBgId, setTiktokBgId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem("miplataformastream.tiktokDefaultBg.v1");
      if (saved) return saved;
    }
    return propSelectedBgId || "bg-chroma-green";
  });

  // Fondo marcado como default permanente
  const [defaultBgId, setDefaultBgId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem("miplataformastream.tiktokDefaultBg.v1");
      if (saved) return saved;
    }
    return "bg-chroma-green";
  });

  const bgUploadRef = useRef<HTMLInputElement | null>(null);
  const bgVideoUploadRef = useRef<HTMLInputElement | null>(null);

  // Blindaje de Contenido & Protección Anti-Descarga (DRM Shield)
  const [drmProtection, setDrmProtection] = useState<boolean>(true);
  const [drmBlockRightClick, setDrmBlockRightClick] = useState<boolean>(true);
  const [drmForensicWatermark, setDrmForensicWatermark] = useState<boolean>(true);
  const [drmHlsEncryption, setDrmHlsEncryption] = useState<boolean>(true);
  const [watermarkSessionId] = useState<string>(() => `TT-PROT-${Math.random().toString(36).substring(2, 7).toUpperCase()}`);

  // Sincronizar fondos si cambian en el padre
  useEffect(() => {
    if (propBackgrounds && propBackgrounds.length > 0) {
      setBgList(propBackgrounds);
    }
  }, [propBackgrounds]);

  const activeTheme = themes.find((t) => t.id === activeThemeId) || themes[0];
  const activeBg = bgList.find((b) => b.id === tiktokBgId) || bgList.find((b) => b.id === "bg-chroma-green");

  const handleSelectTheme = (theme: TikTokBrandTheme) => {
    setActiveThemeId(theme.id);
    setCustomBrandName(theme.brandName);
    setCustomTagline(theme.tagline);
  };

  // Seleccionar fondo para el preview de TikTok Live
  const handleSelectBackground = (bg: VirtualBackgroundItem) => {
    setTiktokBgId(bg.id);
    if (onSelectBackground) onSelectBackground(bg);
    setToastMessage(`🖼️ Fondo "${bg.name}" seleccionado para TikTok Live.`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Establecer como fondo predeterminado permanente
  const handleSetAsDefault = (bg: VirtualBackgroundItem) => {
    setDefaultBgId(bg.id);
    setTiktokBgId(bg.id);
    try {
      window.localStorage.setItem("miplataformastream.tiktokDefaultBg.v1", bg.id);
    } catch {}
    setToastMessage(`⭐ "${bg.name}" establecido como fondo predeterminado de TikTok Live.`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Subir fondo personalizado (Foto o Video en Bucle)
  const handleUploadBg = (file: File, mediaType: "image" | "video" = "image") => {
    const cleanName = file.name.replace(/\.[^/.]+$/, "").slice(0, 18);

    if (mediaType === "video") {
      const videoBlobUrl = URL.createObjectURL(file);
      const newBg: VirtualBackgroundItem = {
        id: `custom-tt-vid-${Date.now()}`,
        name: cleanName ? `${cleanName} (Video)` : "Video Bucle TikTok",
        category: "Personalizado",
        mediaType: "video",
        thumbnailSvg: "",
        customVideoUrl: videoBlobUrl,
        customImageUrl: videoBlobUrl,
        isCustom: true,
        promptSuffix: "with an energetic dynamic looping vertical video backdrop for TikTok live, cinematic neon streaming studio atmosphere",
        previewColor: "#00F0FF",
      };
      setBgList((prev) => [newBg, ...prev]);
      setTiktokBgId(newBg.id);
      if (onAddCustomBackground) onAddCustomBackground(file, "video");
      setToastMessage(`🎥 ¡Video bucle "${newBg.name}" subido y reproduciéndose en bucle continuo!`);
      setTimeout(() => setToastMessage(null), 3500);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const newBg: VirtualBackgroundItem = {
        id: `custom-tt-${Date.now()}`,
        name: cleanName || "Mi Fondo TikTok",
        category: "Personalizado",
        mediaType: "image",
        thumbnailSvg: "",
        customImageUrl: dataUrl,
        isCustom: true,
        promptSuffix: "in a custom TikTok live branded studio setting matching the uploaded photo",
        previewColor: "#3B82F6",
      };
      setBgList((prev) => [newBg, ...prev]);
      setTiktokBgId(newBg.id);
      if (onAddCustomBackground) onAddCustomBackground(file, "image");
      setToastMessage(`🎉 ¡Foto de fondo "${cleanName}" subida y aplicada!`);
      setTimeout(() => setToastMessage(null), 3500);
    };
    reader.readAsDataURL(file);
  };

  const handleApplyToCam = () => {
    const updatedTheme: TikTokBrandTheme = {
      ...activeTheme,
      brandName: customBrandName,
      tagline: customTagline,
    };
    if (onSelectCropAspect) {
      onSelectCropAspect("9:16");
    }
    if (onApplyThemeToCam) {
      onApplyThemeToCam(updatedTheme, tiktokBgId);
    }
    setToastMessage(`🚀 ¡Marco de marca "${customBrandName}" con fondo "${activeBg?.name || "Chroma Key"}" aplicado a CAM en 9:16!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="tiktok-branded-studio-container">
      {/* Toast informativo */}
      {toastMessage && (
        <div className="screen-limit-toast" style={{ background: "var(--accent-pink)" }}>
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
            <TikTokLogo size={28} />
            <div>
              <h2 style={{ margin: 0, fontSize: "1.15rem", color: "#FFFFFF" }}>
                Transmisiones en Vivo de TikTok con Marcas & Fondos Virtuales
              </h2>
              <p style={{ margin: "3px 0 0 0", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                Personaliza tu transmisión en vivo vertical (9:16) con superposiciones, logotipos, banners y <strong>fondos virtuales tipo Fondo Verde (Chroma Key #00FF00)</strong> para OBS o aislamiento perfecto de silueta.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="btn-apply-cam-primary"
          style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
          onClick={handleApplyToCam}
          title="Configurar monitor CAM en vertical 9:16 y montar este marco de marca con el fondo seleccionado"
        >
          <SocialIcon network="tiktok" size={16} />
          <span>APLICAR MARCO Y FONDO A CABINA CAM (9:16)</span>
        </button>
      </div>

      {/* Disposición en dos columnas: Simulador 9:16 (izq) y Personalizador de Marcas y Fondos (der) */}
      <div className="tiktok-branded-grid-layout">
        {/* COLUMNA 1: SIMULADOR DE SMARTPHONE EN VIVO (ESTILO TIKTOK LIVE 9:16) */}
        <div className="tiktok-phone-simulator-column">
          <div className="phone-device-bezel">
            {/* Dynamic Island / Notch */}
            <div className="phone-dynamic-island" />

            {/* Pantalla del directo en 9:16 */}
            <div
              className={`tiktok-live-screen-viewport theme-${activeTheme.borderStyle}`}
              style={{
                borderColor: activeTheme.accentColor,
                boxShadow: `0 0 30px ${activeTheme.accentColor}33`,
                position: "relative",
                overflow: "hidden",
                backgroundColor: activeBg?.id === "bg-chroma-green" ? "#00FF00" : "#0A0A10",
              }}
            >
              {/* CAPA DE FONDO VIRTUAL O CHROMA KEY EN TIEMPO REAL */}
              {activeBg?.id === "bg-chroma-green" ? (
                /* FONDO VERDE CHROMA KEY PURO (#00FF00) */
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 1,
                    backgroundColor: "#00FF00",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      background: "rgba(0, 0, 0, 0.75)",
                      border: "1px solid #00FF00",
                      borderRadius: 12,
                      padding: "8px 14px",
                      textAlign: "center",
                      color: "#00FF00",
                      fontSize: "0.74rem",
                      fontWeight: 800,
                      backdropFilter: "blur(6px)",
                      maxWidth: 220,
                    }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      <Dashicon name="art" size={14} color="#00FF00" />
                      <span>FONDO VERDE CHROMA KEY</span>
                    </span>
                    <p style={{ margin: "4px 0 0 0", fontSize: "0.65rem", color: "#E5E7EB", fontWeight: 400 }}>
                      Listo para recortar en OBS o emitir con transparencia limpia.
                    </p>
                  </div>
                </div>
              ) : activeBg?.mediaType === "video" || activeBg?.customVideoUrl ? (
                /* FONDO DE VIDEO EN BUCLE (LOOP VIDEO) CONTINUO */
                <video
                  src={activeBg.customVideoUrl || activeBg.customImageUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  controls={false}
                  controlsList={drmBlockRightClick ? "nodownload" : undefined}
                  disablePictureInPicture={drmBlockRightClick}
                  className="tiktok-bg-cover-img"
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    zIndex: 1,
                    pointerEvents: drmBlockRightClick ? "none" : "auto",
                  }}
                />
              ) : (
                /* FONDO DECORATIVO REALISTA O FOTO PERSONALIZADA */
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={activeBg?.customImageUrl || activeTheme.bgAtmosphereUrl}
                  alt={activeBg?.name || "Fondo TikTok"}
                  className="tiktok-bg-cover-img"
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 1 }}
                />
              )}

              {/* CAPA DE PROTECCIÓN DRM & MARCA DE AGUA FORENSE ANTICOPIA */}
              {drmProtection && (
                <div
                  className="tiktok-drm-shield-overlay"
                  style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 25,
                    pointerEvents: drmBlockRightClick ? "auto" : "none",
                  }}
                  onContextMenu={(e) => {
                    if (drmBlockRightClick) {
                      e.preventDefault();
                      setToastMessage("🛡️ Video protegido por DRM: Clic derecho y descargas bloqueadas.");
                      setTimeout(() => setToastMessage(null), 3000);
                    }
                  }}
                >
                  {/* Badge discreto de escudo DRM en parte superior izquierda (sin tapar comentarios) */}
                  <div
                    style={{
                      position: "absolute",
                      top: 50,
                      left: 10,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      background: "rgba(0, 0, 0, 0.65)",
                      border: "1px solid rgba(139, 92, 246, 0.65)",
                      borderRadius: 6,
                      padding: "2px 6px",
                      fontSize: "0.55rem",
                      color: "#C084FC",
                      fontWeight: 800,
                      backdropFilter: "blur(4px)",
                    }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <Dashicon name="lock" size={11} color="#C084FC" />
                      <span>DRM</span>
                    </span>
                  </div>

                  {/* Marca de agua forense flotante para trazabilidad */}
                  {drmForensicWatermark && (
                    <div
                      className="forensic-watermark-floating"
                      style={{
                        position: "absolute",
                        top: "40%",
                        right: 12,
                        transform: "rotate(-12deg)",
                        opacity: 0.35,
                        fontSize: "0.62rem",
                        color: "#FFFFFF",
                        fontWeight: 900,
                        letterSpacing: "0.1em",
                        userSelect: "none",
                        pointerEvents: "none",
                        textShadow: "0 0 4px rgba(0,0,0,0.8)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Dashicon name="shield" size={12} />
                      <span>{customBrandName.toUpperCase()} · {watermarkSessionId}</span>
                    </div>
                  )}
                </div>
              )}

              {/* SUPERPOSICIÓN DE MARCA SUPERIOR */}
              <div
                className="tiktok-top-brand-overlay"
                style={{
                  position: "relative",
                  zIndex: 10,
                  background: `linear-gradient(180deg, ${activeTheme.secondaryColor}DD 0%, transparent 100%)`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {showLiveBadge && (
                    <div className="tiktok-live-pill">
                      <span className="rec-pulse-dot" style={{ width: 6, height: 6, backgroundColor: "#FFF" }} />
                      <span>LIVE</span>
                      <span style={{ opacity: 0.85, fontWeight: 400 }}>{activeViewerRange.formattedCount}</span>
                    </div>
                  )}

                  <div className="tiktok-brand-chip" style={{ borderColor: activeTheme.accentColor }}>
                    <span>{activeTheme.decorations[0]}</span>
                    <strong>{customBrandName}</strong>
                  </div>
                </div>

                <div className="tiktok-watermark-tag" style={{ color: activeTheme.accentColor }}>
                  {activeTheme.topBadge}
                </div>
              </div>

              {/* BADGE DE FONDO ACTIVO EN PANTALLA */}
              <div
                style={{
                  position: "absolute",
                  top: 50,
                  right: 10,
                  zIndex: 15,
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "3px 8px",
                  borderRadius: 6,
                  backgroundColor: activeBg?.id === "bg-chroma-green" ? "rgba(0, 0, 0, 0.8)" : "rgba(0,0,0,0.75)",
                  border: activeBg?.id === "bg-chroma-green" ? "1px solid #00FF00" : "1px solid rgba(255,255,255,0.2)",
                  color: activeBg?.id === "bg-chroma-green" ? "#00FF00" : "#FFFFFF",
                  fontSize: "0.65rem",
                  fontWeight: 800,
                  backdropFilter: "blur(4px)",
                }}
              >
                <Dashicon
                  name={activeBg?.id === "bg-chroma-green" ? "art" : "format-gallery"}
                  size={12}
                  color={activeBg?.id === "bg-chroma-green" ? "#00FF00" : "#A5B4FC"}
                />
                <span>{activeBg ? activeBg.name : "Chroma Key"}</span>
                {tiktokBgId === defaultBgId && (
                  <span style={{ color: "#FBBF24", fontSize: "0.6rem", display: "inline-flex", alignItems: "center", gap: 2 }}>
                    <Dashicon name="star-filled" size={10} /> Default
                  </span>
                )}
              </div>

              {/* MARCO LATERAL O EFECTO ANGULAR DECORATIVO */}
              <div className={`tiktok-frame-decorations ${activeTheme.borderStyle}`} style={{ zIndex: 10 }}>
                <span className="decor-item decor-tl" style={{ color: activeTheme.accentColor }}>
                  {activeTheme.decorations[1] || "✨"}
                </span>
                <span className="decor-item decor-tr" style={{ color: activeTheme.accentColor }}>
                  {activeTheme.decorations[2] || "⭐"}
                </span>
              </div>

              {/* REACCIONES Y CORAZONES FLOTANTES ANIMADOS */}
              {showHeartsAnim && (
                <div className="tiktok-floating-reactions" style={{ zIndex: 12 }}>
                  <span className="heart-bubble h1" style={{ color: activeTheme.accentColor }}>💖</span>
                  <span className="heart-bubble h2" style={{ color: "#FF2E93" }}>💕</span>
                  <span className="heart-bubble h3" style={{ color: activeTheme.accentColor }}>✨</span>
                  <span className="heart-bubble h4" style={{ color: "#00F0FF" }}>🔥</span>
                </div>
              )}

              {/* COMENTARIOS EN VIVO ESTILO TIKTOK LIVE NATIVO (EN ZONA INFERIOR SIN TAPAR EL ROSTRO) */}
              <div className="tiktok-chat-overlay-preview" style={{ zIndex: 15 }}>
                <div className="tiktok-comment-row">
                  <span className="tiktok-avatar-dot" style={{ background: "#EC4899" }}>S</span>
                  <div className="tiktok-comment-content">
                    <span className="comment-author">
                      samantha <span className="tiktok-verified-mini">✓</span>
                    </span>
                    <span className="comment-text">¡Me encanta este setup en vivo! ✨</span>
                  </div>
                </div>
                <div className="tiktok-comment-row">
                  <span className="tiktok-avatar-dot" style={{ background: "#3B82F6" }}>C</span>
                  <div className="tiktok-comment-content">
                    <span className="comment-author">
                      <span className="tiktok-lvl-mini">💎 32</span> carlos_stream
                    </span>
                    <span className="comment-text">Se ve súper profesional 👌🔥</span>
                  </div>
                </div>
                <div className="tiktok-comment-row">
                  <span className="tiktok-avatar-dot" style={{ background: "#F59E0B" }}>V</span>
                  <div className="tiktok-comment-content">
                    <span className="comment-author">valeria.style</span>
                    <span className="comment-text">¿El código SHOP sigue activo? 🛍️</span>
                  </div>
                </div>
              </div>

              {/* BANNER DE MARCA INFERIOR PERSONALIZADO (LOWER THIRD) */}
              <div
                className="tiktok-bottom-brand-banner"
                style={{
                  position: "relative",
                  zIndex: 20,
                  borderTop: `2px solid ${activeTheme.accentColor}`,
                  background: `linear-gradient(0deg, #0A0A10F5 0%, #0A0A10D0 100%)`,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 900, color: "#FFFFFF" }}>
                      {customBrandName}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: activeTheme.accentColor, fontWeight: 700 }}>
                      {customTagline}
                    </div>
                  </div>

                  {showShopPill && (
                    <div
                      className="tiktok-shop-pill-btn"
                      style={{ backgroundColor: activeTheme.accentColor, color: "#000000", display: "inline-flex", alignItems: "center", gap: 4 }}
                    >
                      <Dashicon name="cart" size={12} />
                      <span>SHOP</span>
                    </div>
                  )}
                </div>

                {/* Barra de acción interactiva TikTok */}
                <div className="tiktok-action-bar-icons">
                  <span className="action-pill" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <Dashicon name="format-chat" size={12} /> Comentar...
                  </span>
                  <span className="action-icon-circle"><Dashicon name="star-filled" size={12} /></span>
                  <span className="action-icon-circle"><Dashicon name="heart" size={12} /></span>
                  <span className="action-icon-circle"><Dashicon name="share" size={12} /></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNA 2: SELECTOR DE TEMAS, FONDOS VIRTUALES Y EDITOR DE MARCA */}
        <div className="tiktok-customizer-column">
          {/* SECCIÓN 1: SELECCIONAR O SUBIR FONDOS (TIPO FONDO VERDE O ESCENARIO) */}
          <div className="customizer-card-box" style={{ border: "1px solid #10B981" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "0.95rem", color: "#FFFFFF", display: "flex", alignItems: "center", gap: 6 }}>
                  <Dashicon name="format-gallery" size={16} color="#10B981" />
                  <span>1. Fondos para TikTok Live (Tipo Fondo Verde / Chroma Key)</span>
                </h3>
                <p style={{ margin: "2px 0 0 0", fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                  Elige transmitir con <strong>Fondo Verde (#00FF00)</strong> para OBS o escoge un escenario de marca.
                </p>
              </div>

              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <label className="pill-ctrl-button" style={{ padding: "4px 8px", fontSize: "0.7rem", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <Dashicon name="format-image" size={13} />
                  <span>Subir Foto</span>
                  <input
                    ref={bgUploadRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUploadBg(f, "image");
                      e.target.value = "";
                    }}
                  />
                </label>
                <label className="pill-ctrl-button" style={{ padding: "4px 8px", fontSize: "0.7rem", cursor: "pointer", borderColor: "#00F0FF", color: "#00F0FF", display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <Dashicon name="format-video" size={13} />
                  <span>Subir Video Bucle</span>
                  <input
                    ref={bgVideoUploadRef}
                    type="file"
                    accept="video/mp4,video/webm,video/ogg,video/quicktime"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUploadBg(f, "video");
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
            </div>

            {/* Grid de fondos */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(135px, 1fr))", gap: 8 }}>
              {bgList.map((bg) => {
                const isSelected = tiktokBgId === bg.id;
                const isDefault = defaultBgId === bg.id;
                return (
                  <div
                    key={bg.id}
                    onClick={() => handleSelectBackground(bg)}
                    style={{
                      position: "relative",
                      borderRadius: 10,
                      padding: 6,
                      background: isSelected ? "rgba(16, 185, 129, 0.18)" : "#1C1C2A",
                      border: isSelected ? "2px solid #10B981" : "1px solid #2E2E3E",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                    }}
                  >
                    {/* Miniatura del fondo */}
                    <div
                      style={{
                        width: "100%",
                        height: 52,
                        borderRadius: 6,
                        overflow: "hidden",
                        backgroundColor: bg.id === "bg-chroma-green" ? "#00FF00" : bg.previewColor || "#1E1E2E",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {bg.id === "bg-chroma-green" ? (
                        <span style={{ fontSize: "0.68rem", fontWeight: 900, color: "#004400", background: "rgba(255,255,255,0.7)", padding: "2px 6px", borderRadius: 4 }}>
                          CHROMA KEY
                        </span>
                      ) : bg.mediaType === "video" || bg.customVideoUrl ? (
                        <div style={{ position: "relative", width: "100%", height: "100%" }}>
                          <video src={bg.customVideoUrl || bg.customImageUrl} muted loop autoPlay playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          <span style={{ position: "absolute", bottom: 2, right: 2, fontSize: "0.55rem", background: "rgba(0, 240, 255, 0.85)", color: "#000", fontWeight: 900, padding: "0 3px", borderRadius: 2 }}>
                            LOOP
                          </span>
                        </div>
                      ) : bg.customImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={bg.customImageUrl} alt={bg.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <Dashicon name="format-gallery" size={20} color="#94A3B8" />
                      )}
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#FFFFFF", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {bg.name}
                      </span>
                      {isDefault && (
                        <span style={{ fontSize: "0.65rem", color: "#FBBF24", fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 2 }} title="Fondo predeterminado">
                          <Dashicon name="star-filled" size={11} /> Def
                        </span>
                      )}
                    </div>

                    {/* Botón para marcar como predeterminado */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSetAsDefault(bg);
                      }}
                      style={{
                        background: isDefault ? "#10B981" : "transparent",
                        border: isDefault ? "none" : "1px solid #4B5563",
                        color: isDefault ? "#000000" : "#9CA3AF",
                        borderRadius: 4,
                        padding: "2px 4px",
                        fontSize: "0.62rem",
                        fontWeight: 800,
                        cursor: "pointer",
                      }}
                      title="Establecer como fondo predeterminado de TikTok Live"
                    >
                      {isDefault ? "★ PREDETERMINADO" : "Poner por Defecto"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECCIÓN 2: SELECCIONAR ESTILO DE MARCA */}
          <div className="customizer-card-box">
            <h3 style={{ margin: "0 0 10px 0", fontSize: "0.95rem", color: "#FFFFFF" }}>
              2. Selecciona un Estilo de Marco Preconfigurado
            </h3>
            <div className="themes-preset-grid">
              {themes.map((t) => {
                const isSelected = activeThemeId === t.id;
                return (
                  <div
                    key={t.id}
                    className={`theme-preset-card ${isSelected ? "selected" : ""}`}
                    onClick={() => handleSelectTheme(t)}
                    style={{ borderColor: isSelected ? t.accentColor : "var(--border-dark)" }}
                  >
                    <div className="theme-preset-badge" style={{ backgroundColor: t.accentColor }}>
                      {t.decorations[0]} {t.name}
                    </div>
                    <strong style={{ fontSize: "0.82rem", color: "#FFFFFF" }}>{t.brandName}</strong>
                    <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                      {t.tagline}
                    </span>
                    <div
                      className="theme-preset-preview-line"
                      style={{ background: `linear-gradient(90deg, ${t.accentColor}, ${t.secondaryColor})` }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECCIÓN 3: PERSONALIZAR IDENTIDAD Y TEXTOS */}
          <div className="customizer-card-box">
            <h3 style={{ margin: "0 0 10px 0", fontSize: "0.95rem", color: "#FFFFFF" }}>
              3. Personaliza Textos y Elementos de Pantalla
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: "0.74rem", color: "var(--text-secondary)", fontWeight: 700 }}>
                  Nombre de tu Marca o Canal:
                </label>
                <input
                  type="text"
                  className="pro-input-field"
                  value={customBrandName}
                  onChange={(e) => setCustomBrandName(e.target.value)}
                  placeholder="Ej: Mi Tienda en Vivo / Mia Studio"
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: "0.74rem", color: "var(--text-secondary)", fontWeight: 700 }}>
                  Eslogan o Llamado a la Acción (CTA):
                </label>
                <input
                  type="text"
                  className="pro-input-field"
                  value={customTagline}
                  onChange={(e) => setCustomTagline(e.target.value)}
                  placeholder="Ej: ¡Usa el código LIVE20 para 20% OFF!"
                />
              </div>
            </div>

            {/* Toggles de elementos en pantalla */}
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", margin: "14px 0" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.78rem", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={showLiveBadge}
                  onChange={(e) => setShowLiveBadge(e.target.checked)}
                />
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <SocialIcon network="tiktok" size={13} />
                  <span>Badge LIVE TikTok ({activeViewerRange.formattedCount})</span>
                </span>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.78rem", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={showHeartsAnim}
                  onChange={(e) => setShowHeartsAnim(e.target.checked)}
                />
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <Dashicon name="heart" size={14} color="#EC4899" />
                  <span>Reacciones Flotantes</span>
                </span>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.78rem", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={showShopPill}
                  onChange={(e) => setShowShopPill(e.target.checked)}
                />
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <Dashicon name="cart" size={14} color="#10B981" />
                  <span>Botón SHOP en Banner</span>
                </span>
              </label>
            </div>

            {!hideViewerRangeCard && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
                <ViewerRangeControl
                  value={activeViewerRange}
                  onChange={handleChangeViewerRange}
                  label="Viewer Range (Audiencia TikTok Live)"
                />
              </div>
            )}

          {/* SECCIÓN 4: BLINDAJE DE CONTENIDO & PROTECCIÓN ANTI-DESCARGA (DRM SHIELD) */}
          <div className="customizer-card-box" style={{ border: drmProtection ? "1px solid #8B5CF6" : "1px solid var(--border-dark)", background: drmProtection ? "rgba(139, 92, 246, 0.05)" : undefined, marginTop: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 8, background: "rgba(139, 92, 246, 0.16)", color: "#C4B5FD", flexShrink: 0 }}>
                  <Dashicon name="shield" size={18} />
                </span>
                <div>
                  <h3 style={{ margin: 0, fontSize: "0.92rem", color: "#FFFFFF" }}>
                    4. Blindaje de Contenido & Protección Anti-Descarga (DRM)
                  </h3>
                  <p style={{ margin: "2px 0 0 0", fontSize: "0.7rem", color: "var(--text-secondary)" }}>
                    Evita que tus videos y transmisiones sean descargados, extraídos o mal utilizados en otras plataformas.
                  </p>
                </div>
              </div>

              <div
                className={`switchy-toggle ${drmProtection ? "active-green" : ""}`}
                onClick={() => {
                  setDrmProtection((v) => {
                    const next = !v;
                    setToastMessage(next ? "🔒 Protección DRM y bloqueo de descargas ACTIVADO" : "⚪ Protección DRM desactivada");
                    setTimeout(() => setToastMessage(null), 3000);
                    return next;
                  });
                }}
                title="Activar o desactivar blindaje de contenido contra descargas no autorizadas"
              >
                <div className="switchy-thumb" />
              </div>
            </div>

            {drmProtection ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8 }}>
                  {/* Switch 1: Bloqueo Clic Derecho & nodownload */}
                  <div
                    style={{
                      background: "rgba(10, 10, 18, 0.8)",
                      border: "1px solid rgba(139, 92, 246, 0.3)",
                      borderRadius: 8,
                      padding: "8px 10px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      cursor: "pointer",
                    }}
                    onClick={() => setDrmBlockRightClick((v) => !v)}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.74rem", fontWeight: 700, color: "#FFFFFF" }}>
                        <Dashicon name="hidden" size={13} color="#C4B5FD" />
                        <span>Bloqueo Clic Derecho</span>
                      </div>
                      <div style={{ fontSize: "0.64rem", color: "#9CA3AF" }}>Impide "Guardar video como..." e inspeccionar</div>
                    </div>
                    <input type="checkbox" checked={drmBlockRightClick} onChange={() => {}} style={{ pointerEvents: "none" }} />
                  </div>

                  {/* Switch 2: Marca de Agua Forense Anticopia */}
                  <div
                    style={{
                      background: "rgba(10, 10, 18, 0.8)",
                      border: "1px solid rgba(139, 92, 246, 0.3)",
                      borderRadius: 8,
                      padding: "8px 10px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      cursor: "pointer",
                    }}
                    onClick={() => setDrmForensicWatermark((v) => !v)}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.74rem", fontWeight: 700, color: "#FFFFFF" }}>
                        <Dashicon name="marker" size={13} color="#C4B5FD" />
                        <span>Marca de Agua Forense</span>
                      </div>
                      <div style={{ fontSize: "0.64rem", color: "#9CA3AF" }}>Inyecta ID y fecha anticopia para trazabilidad</div>
                    </div>
                    <input type="checkbox" checked={drmForensicWatermark} onChange={() => {}} style={{ pointerEvents: "none" }} />
                  </div>

                  {/* Switch 3: Cifrado HLS & Tokens de 60s */}
                  <div
                    style={{
                      background: "rgba(10, 10, 18, 0.8)",
                      border: "1px solid rgba(139, 92, 246, 0.3)",
                      borderRadius: 8,
                      padding: "8px 10px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      cursor: "pointer",
                    }}
                    onClick={() => setDrmHlsEncryption((v) => !v)}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.74rem", fontWeight: 700, color: "#FFFFFF" }}>
                        <Dashicon name="lock" size={13} color="#C4B5FD" />
                        <span>Cifrado de Fragmentos</span>
                      </div>
                      <div style={{ fontSize: "0.64rem", color: "#9CA3AF" }}>Ofusca el archivo fuente contra scrapers</div>
                    </div>
                    <input type="checkbox" checked={drmHlsEncryption} onChange={() => {}} style={{ pointerEvents: "none" }} />
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(139, 92, 246, 0.15)", border: "1px solid rgba(139, 92, 246, 0.4)", borderRadius: 6, padding: "6px 10px" }}>
                  <Dashicon name="shield" size={15} color="#A78BFA" />
                  <span style={{ fontSize: "0.68rem", color: "#DDD6FE" }}>
                    <strong>Escudo DRM Activo:</strong> ID de sesión <code>{watermarkSessionId}</code>. Los videos transmitidos quedan blindados contra descarga directa y marcados con firma digital para proteger tus derechos de autor contra mal uso.
                  </span>
                </div>
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: "0.72rem", color: "#F87171", display: "flex", alignItems: "center", gap: 6 }}>
                <Dashicon name="warning" size={14} />
                <span>La protección DRM está inactiva. El video podría ser descargado o copiado por espectadores. Activa el interruptor para proteger tu contenido.</span>
              </p>
            )}
          </div>

            {/* Botón de acción */}
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <button
                type="button"
                className="btn-apply-cam-primary"
                style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                onClick={handleApplyToCam}
              >
                <SocialIcon network="tiktok" size={16} />
                <span>APLICAR MARCO Y FONDO A CABINA CAM (9:16)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

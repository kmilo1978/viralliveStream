"use client";

import React, { useState, useEffect, useRef } from "react";
import { type UnifiedChatMessage, type ViewerRangeOption, DEFAULT_VIEWER_RANGES } from "@/lib/studio-data";
import { PlatformLogo } from "@/components/PlatformLogos";
import { getFaceAvatarUrl } from "@/lib/avatar-helper";

interface RealFeelLiveChatOverlayProps {
  messages?: UnifiedChatMessage[];
  onPinMessage?: (msg: UnifiedChatMessage | null) => void;
  pinnedMessageId?: string | null;
  viewerRange?: ViewerRangeOption;
  showHearts?: boolean;
  showBottomBar?: boolean;
  showLiveGoal?: boolean;
  streamerName?: string;
  bottomPadding?: number;
  maxVisible?: number;
  compactMode?: boolean;
  externalMessageToPush?: { nonce: number; text: string } | null;
  hasPipCamera?: boolean;
}

type HeartParticle = {
  id: number;
  emoji: string;
  leftOffset: number; // percentage offset
  size: number;
  animDuration: number;
};

const SAMPLE_CHAT_BANK: Omit<UnifiedChatMessage, "id">[] = [
  {
    platform: "tiktok",
    author: "JustHereToDance",
    avatarLetter: "J",
    avatarColor: "#EC4899",
    avatarUrl: "/avatars/female_1.svg",
    gender: "female",
    isVerified: false,
    badgeIcon: "✨",
    userLevel: 18,
    message: "I'm enjoying your content so much! 🎉",
    timestamp: "Ahora",
  },
  {
    platform: "youtube",
    author: "ShotCaller",
    avatarLetter: "S",
    avatarColor: "#3B82F6",
    avatarUrl: "/avatars/male_1.svg",
    gender: "male",
    isVerified: true,
    badgeIcon: "🔥",
    userLevel: 42,
    message: "Keep it up! You're the best! 🔥",
    timestamp: "Ahora",
  },
  {
    platform: "instagram",
    author: "LightShowLaura",
    avatarLetter: "L",
    avatarColor: "#F59E0B",
    avatarUrl: "/avatars/female_2.svg",
    gender: "female",
    isVerified: false,
    badgeIcon: "✨",
    userLevel: 25,
    message: "This setup is next level! 🔥✨",
    timestamp: "Ahora",
  },
  {
    platform: "facebook",
    author: "HappyHourHarry",
    avatarLetter: "H",
    avatarColor: "#EF4444",
    avatarUrl: "/avatars/male_2.svg",
    gender: "male",
    isVerified: false,
    badgeIcon: "👍",
    userLevel: 31,
    message: "Hey everyone! smash that like button! 👍",
    timestamp: "Ahora",
  },
  {
    platform: "twitch",
    author: "SongSeeker",
    avatarLetter: "S",
    avatarColor: "#A855F7",
    avatarUrl: "/avatars/female_3.svg",
    gender: "female",
    isVerified: false,
    badgeIcon: "🎶",
    message: "What's the name of this track? It's a banger!",
    timestamp: "Ahora",
  },
  {
    platform: "tiktok",
    author: "DJ_Fan",
    avatarLetter: "D",
    avatarColor: "#10B981",
    avatarUrl: "/avatars/male_3.svg",
    gender: "male",
    isVerified: true,
    badgeIcon: "🎧",
    message: "You're the best DJ on this platform! 🎧🔥",
    timestamp: "Ahora",
  },
  {
    platform: "youtube",
    author: "GlobalGuest",
    avatarLetter: "G",
    avatarColor: "#EAB308",
    avatarUrl: "/avatars/male_4.svg",
    gender: "male",
    isVerified: false,
    badgeIcon: "🇪🇸",
    message: "Checking in from Spain! ¡Hola! 🇪🇸❤️",
    timestamp: "Ahora",
  },
  {
    platform: "instagram",
    author: "SofiaModaStudio",
    avatarLetter: "S",
    avatarColor: "#F43F5E",
    avatarUrl: "/avatars/female_4.svg",
    gender: "female",
    isVerified: true,
    badgeIcon: "🛍️",
    userLevel: 34,
    message: "¿El código sigue activo? ¡Lo quiero! 👗",
    timestamp: "Ahora",
  },
  {
    platform: "facebook",
    author: "CarlosGamer_99",
    avatarLetter: "C",
    avatarColor: "#06B6D4",
    avatarUrl: "/avatars/male_5.svg",
    gender: "male",
    isVerified: false,
    badgeIcon: "🚀",
    userLevel: 21,
    message: "¡Saludos desde Colombia! Se ve súper nítido 🇨🇴",
    timestamp: "Ahora",
  },
  {
    platform: "twitch",
    author: "Lucas_Trends",
    avatarLetter: "L",
    avatarColor: "#8B5CF6",
    avatarUrl: "/avatars/male_6.svg",
    gender: "male",
    isVerified: false,
    badgeIcon: "🌹",
    userLevel: 49,
    isDonation: true,
    donationAmount: "10x Rosas",
    message: "¡Mandando 10x Rosas! 🌹🌹",
    timestamp: "Ahora",
  },
];

export function RealFeelLiveChatOverlay({
  messages: propMessages,
  onPinMessage,
  pinnedMessageId,
  viewerRange = DEFAULT_VIEWER_RANGES[6], // 49K-51K por defecto (50.7K)
  showHearts = true,
  showBottomBar = false,
  showLiveGoal = true,
  streamerName = "Maddy",
  bottomPadding = 0,
  maxVisible = 4,
  compactMode = false,
  externalMessageToPush = null,
  hasPipCamera = false,
}: RealFeelLiveChatOverlayProps) {
  const [localMessages, setLocalMessages] = useState<UnifiedChatMessage[]>(() =>
    propMessages && propMessages.length > 0
      ? propMessages.slice(0, 5)
      : SAMPLE_CHAT_BANK.slice(0, 4).map((item, idx) => ({
          ...item,
          id: `initial-live-${idx}`,
        }))
  );
  const [chatInputText, setChatInputText] = useState("");
  const [likesCount, setLikesCount] = useState(50740);
  const [hearts, setHearts] = useState<HeartParticle[]>([]);
  const nextHeartIdRef = useRef(1);
  const sampleBank = SAMPLE_CHAT_BANK;

  // Actualizar si llegan mensajes externos explícitos
  useEffect(() => {
    if (propMessages && propMessages.length > 0) {
      setLocalMessages(propMessages.slice(0, 5));
    }
  }, [propMessages]);

  // Empujar comentario rápido desde la barra externa debajo del monitor
  useEffect(() => {
    if (!externalMessageToPush || !externalMessageToPush.text.trim()) return;
    const userMsg: UnifiedChatMessage = {
      id: `chat-ext-${externalMessageToPush.nonce}`,
      platform: "tiktok",
      author: streamerName || "Tú (Streamer)",
      avatarLetter: (streamerName || "T").charAt(0).toUpperCase(),
      avatarColor: "#EC4899",
      avatarUrl: getFaceAvatarUrl(streamerName || "Tú (Streamer)"),
      isVerified: true,
      badgeIcon: "👑",
      message: externalMessageToPush.text.trim(),
      timestamp: "Ahora",
    };
    setLocalMessages((prev) => [...prev.slice(-5), userMsg]);
  }, [externalMessageToPush, streamerName]);

  // Generador de comentarios continuo sincronizado con viewerRange
  useEffect(() => {
    const interval = setInterval(() => {
      const randomItem = sampleBank[Math.floor(Math.random() * sampleBank.length)];
      const newComment: UnifiedChatMessage = {
        ...randomItem,
        id: `stream-msg-${Date.now()}-${Math.random()}`,
        avatarUrl: randomItem.avatarUrl || getFaceAvatarUrl(randomItem.author, randomItem.gender),
        timestamp: "Ahora",
      };

      setLocalMessages((prev) => {
        const next = [...prev, newComment];
        // Mantener los últimos 6 comentarios para evitar sobrecargar la pantalla
        return next.slice(-6);
      });
    }, viewerRange.chatSpeedMs);

    return () => clearInterval(interval);
  }, [viewerRange]);

  // Generador de corazones flotantes continuo
  useEffect(() => {
    if (!showHearts) return;

    const heartEmojis = ["❤️", "💖", "🔥", "✨", "💕", "⭐", "🎉"];
    const intervalMs = Math.max(300, 2000 / (viewerRange.heartsPerSec || 5));

    const heartTimer = setInterval(() => {
      const emoji = heartEmojis[Math.floor(Math.random() * heartEmojis.length)];
      const id = nextHeartIdRef.current++;
      const leftOffset = Math.floor(Math.random() * 40) - 20; // -20px a +20px
      const size = Math.floor(Math.random() * 12) + 18; // 18px a 30px
      const animDuration = (Math.random() * 0.8 + 1.8); // 1.8s a 2.6s

      setHearts((prev) => [...prev.slice(-15), { id, emoji, leftOffset, size, animDuration }]);
      setLikesCount((prev) => prev + 1);

      // Limpiar corazón tras animación
      setTimeout(() => {
        setHearts((prev) => prev.filter((h) => h.id !== id));
      }, animDuration * 1000);
    }, intervalMs);

    return () => clearInterval(heartTimer);
  }, [showHearts, viewerRange]);

  // Ráfaga al hacer clic (Tap-to-Like)
  const triggerLikeBurst = () => {
    setLikesCount((prev) => prev + 5);
    const burstEmojis = ["❤️", "💖", "🔥", "✨", "💕"];
    for (let i = 0; i < 4; i++) {
      setTimeout(() => {
        const id = nextHeartIdRef.current++;
        const emoji = burstEmojis[Math.floor(Math.random() * burstEmojis.length)];
        const leftOffset = Math.floor(Math.random() * 50) - 25;
        const size = Math.floor(Math.random() * 14) + 22;
        const animDuration = 2.0;

        setHearts((prev) => [...prev.slice(-15), { id, emoji, leftOffset, size, animDuration }]);
        setTimeout(() => {
          setHearts((prev) => prev.filter((h) => h.id !== id));
        }, animDuration * 1000);
      }, i * 120);
    }
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInputText.trim()) return;

    const userMsg: UnifiedChatMessage = {
      id: `chat-user-${Date.now()}`,
      platform: "tiktok",
      author: streamerName || "Tú (Streamer)",
      avatarLetter: (streamerName || "T").charAt(0).toUpperCase(),
      avatarColor: "#EC4899",
      avatarUrl: getFaceAvatarUrl(streamerName || "Tú (Streamer)"),
      isVerified: true,
      badgeIcon: "👑",
      message: chatInputText.trim(),
      timestamp: "Ahora",
    };

    setLocalMessages((prev) => [...prev.slice(-5), userMsg]);
    setChatInputText("");
    triggerLikeBurst();
  };

  return (
    <div
      className="real-feel-live-chat-overlay"
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: `12px 12px ${bottomPadding > 0 ? bottomPadding : 10}px`,
        zIndex: 35,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      }}
    >

      {/* 1. HEADER SUPERIOR CON METAS DE LIVE */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: "100%", position: "relative", zIndex: 1 }}>
        {/* Lado izquierdo: Streamer info si aplica */}
        <div />

        {/* Lado derecho: LIVE Goal & Gift Hub estilo imágenes del usuario */}
        {showLiveGoal && (
          <div className="real-feel-goal-gift-col" style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, pointerEvents: "auto" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "rgba(0, 0, 0, 0.55)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255, 255, 255, 0.14)",
                borderRadius: 20,
                padding: "3px 10px 3px 6px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
              }}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #EC4899, #8B5CF6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.65rem",
                }}
              >
                🎯
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "0.62rem", color: "#FBBF24", fontWeight: 800 }}>
                  META: 50K LIKES
                </span>
                <div
                  style={{
                    width: 70,
                    height: 4,
                    borderRadius: 2,
                    background: "rgba(255,255,255,0.2)",
                    overflow: "hidden",
                    marginTop: 1,
                  }}
                >
                  <div
                    style={{
                      width: "84%",
                      height: "100%",
                      background: "linear-gradient(90deg, #EC4899, #F59E0B)",
                      borderRadius: 2,
                    }}
                  />
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                background: "rgba(20, 20, 35, 0.65)",
                backdropFilter: "blur(6px)",
                border: "1px solid rgba(236, 72, 153, 0.38)",
                borderRadius: 14,
                padding: "2px 8px",
                fontSize: "0.62rem",
                color: "#F472B6",
                fontWeight: 800,
                cursor: "pointer",
              }}
              onClick={triggerLikeBurst}
              title="Haz clic para enviar corazones"
            >
              <span>🎁 EXPLORE GIFT HUB</span>
            </div>
          </div>
        )}
      </div>

      {/* BLOQUE INFERIOR ANCLADO AL PIE (MANTIENE EL CHAT ABAJO SIN TAPAR A LA PERSONA) */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%", marginTop: "auto", position: "relative", zIndex: 2 }}>
        {/* 2. ZONA INFERIOR: CHAT ESTILO TIKTOK EN EL TERCIO INFERIOR */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            width: "100%",
            gap: 10,
          }}
        >
          {/* COLUMNA IZQUIERDA: FEED DE COMENTARIOS TIKTOK LIVE (PROPORCIONAL EN 16:9 Y COMPACTO EN MÓVIL) */}
          <div
            className="real-feel-chat-feed-col"
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              gap: compactMode ? 5 : 8,
              maxWidth: compactMode ? (hasPipCamera ? "calc(100% - 132px)" : "85%") : "480px",
              maxHeight: compactMode ? 235 : 320,
              overflow: "hidden",
              pointerEvents: "auto",
              maskImage: "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.85) 4%, #000 10%, #000 100%)",
              WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.85) 4%, #000 10%, #000 100%)",
            }}
          >
          {localMessages.slice(-maxVisible).map((msg) => {
            const isPinned = pinnedMessageId === msg.id;
            return (
              <div
                key={msg.id}
                className="tiktok-live-msg-row"
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: compactMode ? 6 : 9,
                  background: isPinned
                    ? "linear-gradient(90deg, rgba(236, 72, 153, 0.42) 0%, rgba(15, 15, 25, 0.62) 100%)"
                    : msg.isDonation
                    ? "linear-gradient(90deg, rgba(16, 185, 129, 0.32) 0%, rgba(15, 15, 25, 0.5) 100%)"
                    : "rgba(0, 0, 0, 0.32)",
                  backdropFilter: "blur(6px)",
                  WebkitBackdropFilter: "blur(6px)",
                  border: isPinned
                    ? "1px solid rgba(236, 72, 153, 0.72)"
                    : msg.isDonation
                    ? "1px solid rgba(16, 185, 129, 0.52)"
                    : "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: compactMode ? 11 : 14,
                  padding: compactMode ? "4px 8px 4px 5px" : "7px 12px 7px 8px",
                  transition: "all 0.22s ease",
                  animation: "slideUpFade 0.28s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                {/* Avatar circular con cara real (Hombre / Mujer) */}
                <div
                  className="chat-face-avatar-circle"
                  style={{
                    width: compactMode ? 20 : 32,
                    height: compactMode ? 20 : 32,
                    minWidth: compactMode ? 20 : 32,
                    borderRadius: "50%",
                    backgroundColor: msg.avatarColor || "#1E293B",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: compactMode ? "1.5px solid rgba(255, 255, 255, 0.45)" : "2px solid rgba(255, 255, 255, 0.65)",
                    marginTop: 1,
                    overflow: "hidden",
                    flexShrink: 0,
                    boxShadow: "0 2px 6px rgba(0,0,0,0.55)",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={msg.avatarUrl || getFaceAvatarUrl(msg.author, msg.gender)}
                    alt={msg.author}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.style.display = "none";
                      if (target.parentElement) {
                        target.parentElement.innerText = (msg.avatarLetter || msg.author.charAt(0)).toUpperCase();
                        target.parentElement.style.fontSize = compactMode ? "0.62rem" : "0.82rem";
                        target.parentElement.style.fontWeight = "900";
                        target.parentElement.style.color = "#FFFFFF";
                      }
                    }}
                  />
                </div>

                {/* Contenido del comentario con estilo TikTok Live limpio */}
                <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: compactMode ? 4 : 6, flexWrap: "wrap" }}>
                    {msg.userLevel && (
                      <span
                        style={{
                          background: msg.userLevel >= 35
                            ? "linear-gradient(90deg, #6366F1, #EC4899)"
                            : "rgba(56, 189, 248, 0.24)",
                          border: "1px solid rgba(255, 255, 255, 0.2)",
                          color: "#FFFFFF",
                          fontSize: compactMode ? "0.54rem" : "0.68rem",
                          fontWeight: 800,
                          padding: compactMode ? "0px 4px" : "1px 6px",
                          borderRadius: 5,
                          lineHeight: 1.35,
                        }}
                      >
                        💎 {msg.userLevel}
                      </span>
                    )}

                    {msg.platform !== "tiktok" && (
                      <PlatformLogo platform={msg.platform} size={compactMode ? 11 : 14} />
                    )}

                    <span
                      style={{
                        fontSize: compactMode ? "0.67rem" : "0.92rem",
                        fontWeight: 700,
                        color: msg.isVerified ? "#7DD3FC" : "rgba(255, 255, 255, 0.88)",
                        letterSpacing: "-0.01em",
                        textShadow: "0 1px 3px rgba(0,0,0,0.95)",
                      }}
                    >
                      {msg.author}
                    </span>

                    {/* Insignia verificada azul estilo TikTok */}
                    {msg.isVerified && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: compactMode ? 11 : 15,
                          height: compactMode ? 11 : 15,
                          borderRadius: "50%",
                          backgroundColor: "#3B82F6",
                          color: "#FFFFFF",
                          fontSize: compactMode ? "0.5rem" : "0.65rem",
                          fontWeight: 900,
                        }}
                        title="Usuario Verificado"
                      >
                        ✓
                      </span>
                    )}

                    {msg.isDonation && (
                      <span
                        style={{
                          background: "linear-gradient(90deg, #10B981, #059669)",
                          color: "#FFFFFF",
                          padding: compactMode ? "0px 5px" : "2px 7px",
                          borderRadius: 6,
                          fontSize: compactMode ? "0.55rem" : "0.72rem",
                          fontWeight: 800,
                        }}
                      >
                        {msg.donationAmount}
                      </span>
                    )}
                  </div>

                  <span
                    style={{
                      fontSize: compactMode ? "0.72rem" : "0.98rem",
                      color: "#FFFFFF",
                      marginTop: 2,
                      lineHeight: compactMode ? 1.24 : 1.34,
                      fontWeight: 500,
                      textShadow: "0 1px 3px rgba(0,0,0,0.95)",
                      wordBreak: "break-word",
                    }}
                  >
                    {msg.message}
                  </span>
                </div>

                {/* Botón discreto para fijar comentario (visible sutilmente al pasar mouse) */}
                {onPinMessage && (
                  <button
                    type="button"
                    className="tiktok-msg-pin-btn"
                    style={{
                      background: "transparent",
                      border: "none",
                      color: isPinned ? "#EC4899" : "rgba(255,255,255,0.28)",
                      fontSize: compactMode ? "0.62rem" : "0.82rem",
                      cursor: "pointer",
                      padding: 1,
                      marginLeft: "auto",
                      opacity: isPinned ? 1 : 0.45,
                    }}
                    onClick={() => onPinMessage(isPinned ? null : msg)}
                    title={isPinned ? "Desfijar de pantalla" : "Fijar comentario"}
                  >
                    📌
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* COLUMNA DERECHA: PARTÍCULAS DE CORAZONES FLOTANTES & CONTADOR DE LIKES COMPACTO */}
        {showHearts && (
          <div
            className="real-feel-hearts-col"
            style={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
              pointerEvents: "auto",
              paddingBottom: 2,
              marginBottom: hasPipCamera && !compactMode ? 215 : 0,
            }}
          >
            {/* Contenedor de partículas flotantes animadas */}
            <div
              style={{
                position: "absolute",
                bottom: 42,
                right: 0,
                width: 56,
                height: 190,
                pointerEvents: "none",
                overflow: "hidden",
              }}
            >
              {hearts.map((h) => (
                <span
                  key={h.id}
                  style={{
                    position: "absolute",
                    bottom: 0,
                    right: 16 + h.leftOffset,
                    fontSize: `${h.size}px`,
                    animation: `floatUpHeart ${h.animDuration}s ease-in forwards`,
                    filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.5))",
                  }}
                >
                  {h.emoji}
                </span>
              ))}
            </div>

            {/* Botón flotante de Likes interactivo compacto */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
                cursor: "pointer",
                userSelect: "none",
              }}
              onClick={triggerLikeBurst}
              title="Toca para enviar ráfaga de likes"
            >
              <div
                style={{
                  width: compactMode ? 36 : 44,
                  height: compactMode ? 36 : 44,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, rgba(236, 72, 153, 0.92) 0%, rgba(220, 38, 38, 0.92) 100%)",
                  boxShadow: "0 4px 16px rgba(236, 72, 153, 0.65)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: compactMode ? "1.05rem" : "1.3rem",
                  transition: "transform 0.15s ease",
                }}
                onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.88)")}
                onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
              >
                ❤️
              </div>
              <span
                style={{
                  fontSize: compactMode ? "0.6rem" : "0.74rem",
                  fontWeight: 800,
                  color: "#FFFFFF",
                  textShadow: "0 1px 3px rgba(0,0,0,0.9)",
                  background: "rgba(0,0,0,0.48)",
                  padding: compactMode ? "1px 5px" : "2px 7px",
                  borderRadius: 8,
                }}
              >
                {(likesCount / 1000).toFixed(1)}K
              </span>
            </div>
          </div>
        )}
      </div>

        {/* 3. BARRA INFERIOR: INPUT "ADD A COMMENT..." Y BOTONES DE ACCIÓN (Alineada estrictamente a la izquierda sin tapar la cámara PiP) */}
        {showBottomBar && (
          <form
            className="real-feel-chat-input-form"
            onSubmit={handleSendChat}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              width: "100%",
              maxWidth: compactMode ? "74%" : "480px",
              alignSelf: "flex-start",
              marginTop: 2,
              pointerEvents: "auto",
            }}
          >
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(0, 0, 0, 0.55)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.16)",
                borderRadius: 22,
                padding: "5px 14px",
              }}
            >
              <span style={{ fontSize: "0.85rem", opacity: 0.6 }}>💬</span>
              <input
                type="text"
                placeholder="Add a comment... (Presiona Enter)"
                value={chatInputText}
                onChange={(e) => setChatInputText(e.target.value)}
                style={{
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "#FFFFFF",
                  fontSize: "0.74rem",
                  width: "100%",
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #EC4899, #8B5CF6)",
                border: "none",
                color: "#FFFFFF",
                fontSize: "0.82rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
              }}
              title="Enviar comentario en directo"
            >
              ➤
            </button>
          </form>
        )}
      </div>

      {/* Animaciones CSS en línea para asegurar renderizado perfecto */}
      <style jsx>{`
        @keyframes slideUpFade {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes floatUpHeart {
          0% {
            transform: translateY(0) scale(0.7) rotate(0deg);
            opacity: 0.9;
          }
          50% {
            transform: translateY(-80px) scale(1.1) rotate(15deg);
            opacity: 1;
          }
          100% {
            transform: translateY(-180px) scale(1.3) rotate(-15deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

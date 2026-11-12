"use client";

import React, { useId } from "react";

interface ViraliveLogoProps {
  variant?: "header" | "full" | "mark";
  height?: number;
  showAppDomain?: boolean;
  className?: string;
}

/**
 * Logotipo vectorial oficial de Virallive / viralive.app
 * (V degradada púrpura-rosa con play central, anillo orbital, ondas de transmisión e insignia LIVE).
 */
export function ViraliveLogo({
  variant = "header",
  height = 34,
  showAppDomain = false,
  className = "",
}: ViraliveLogoProps) {
  const uid = useId().replace(/:/g, "");
  const gradMain = `vl-grad-${uid}`;
  const gradOrbit = `vl-orbit-${uid}`;
  const gradText = `vl-text-${uid}`;

  if (variant === "mark") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 64 52"
        width={Math.round((height * 64) / 52)}
        height={height}
        className={className}
        style={{ flexShrink: 0, display: "block" }}
        aria-label="Virallive logo"
      >
        <defs>
          <linearGradient id={gradMain} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6D28D9" />
            <stop offset="50%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#FF1F7A" />
          </linearGradient>
          <linearGradient id={gradOrbit} x1="0%" y1="60%" x2="100%" y2="20%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#FF2E93" />
          </linearGradient>
        </defs>
        {/* Aro orbital trasero */}
        <path
          d="M9 31C3 24 14 14 34 11C49 9 58 14 55 22C52 31 35 40 18 41C10 41 6 37 9 31Z"
          fill="none"
          stroke={`url(#${gradOrbit})`}
          strokeWidth="2.8"
          strokeLinecap="round"
        />
        {/* V principal */}
        <path
          d="M11 8H22.5L30.5 29L38.5 8H50L35.2 44.5C34.2 46.8 32.3 48 30.5 48C28.7 48 26.8 46.8 25.8 44.5L11 8Z"
          fill={`url(#${gradMain})`}
        />
        {/* Triangulo Play central blanco */}
        <path
          d="M27.2 14.5C27.2 13.4 28.4 12.7 29.4 13.3L36.2 17.5C37.1 18 37.1 19.3 36.2 19.9L29.4 24.1C28.4 24.7 27.2 24 27.2 22.9V14.5Z"
          fill="#FFFFFF"
        />
        {/* Ondas de senal superior derecha */}
        <path d="M47 10.5C50.5 11.2 53 13.7 53.7 17.2" fill="none" stroke="#FF2E93" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M49 5.5C54.2 6.6 58 10.4 59.1 15.6" fill="none" stroke="#FF2E93" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    );
  }

  if (variant === "full") {
    return (
      <div
        className={className}
        style={{
          display: "inline-flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
          lineHeight: 1,
        }}
      >
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 88 52"
            width={Math.round((height * 88) / 52)}
            height={height}
            style={{ flexShrink: 0, display: "block" }}
            aria-label="Virallive"
          >
            <defs>
              <linearGradient id={gradMain} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6D28D9" />
                <stop offset="50%" stopColor="#A855F7" />
                <stop offset="100%" stopColor="#FF1F7A" />
              </linearGradient>
              <linearGradient id={gradOrbit} x1="0%" y1="60%" x2="100%" y2="20%">
                <stop offset="0%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#FF2E93" />
              </linearGradient>
            </defs>
            <path
              d="M7 32C2 24 14 14 34 11C49 9 57 14 54 23C51 32 34 40 16 41C9 41 6 37 7 32Z"
              fill="none"
              stroke={`url(#${gradOrbit})`}
              strokeWidth="2.8"
              strokeLinecap="round"
            />
            <path
              d="M10 8H21.5L29.5 29L37.5 8H49L34.2 44.5C33.2 46.8 31.3 48 29.5 48C27.7 48 25.8 46.8 24.8 44.5L10 8Z"
              fill={`url(#${gradMain})`}
            />
            <path
              d="M26.2 14.5C26.2 13.4 27.4 12.7 28.4 13.3L35.2 17.5C36.1 18 36.1 19.3 35.2 19.9L28.4 24.1C27.4 24.7 26.2 24 26.2 22.9V14.5Z"
              fill="#FFFFFF"
            />
            <path d="M47 10.5C50.5 11.2 53 13.7 53.7 17.2" fill="none" stroke="#FF2E93" strokeWidth="2.4" strokeLinecap="round" />
            <path d="M49 5.5C54.2 6.6 58 10.4 59.1 15.6" fill="none" stroke="#FF2E93" strokeWidth="2.4" strokeLinecap="round" />
            {/* Insignia LIVE rosa */}
            <rect x="52" y="21" width="34" height="15" rx="7.5" fill="#FF1F7A" />
            <circle cx="59.5" cy="28.5" r="2.6" fill="#FFFFFF" />
            <text
              x="65"
              y="31.5"
              fill="#FFFFFF"
              fontSize="8.5"
              fontWeight="900"
              fontFamily="system-ui, -apple-system, sans-serif"
              letterSpacing="0.5"
            >
              LIVE
            </text>
          </svg>
        </div>

        <div style={{ display: "inline-flex", alignItems: "baseline", gap: 3 }}>
          <span
            style={{
              fontWeight: 900,
              fontSize: Math.round(height * 0.52),
              letterSpacing: "-0.03em",
              color: "#FFFFFF",
            }}
          >
            Viral
          </span>
          <span
            style={{
              fontWeight: 900,
              fontSize: Math.round(height * 0.52),
              letterSpacing: "-0.03em",
              background: "linear-gradient(90deg, #9333EA 0%, #FF2E93 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            live
          </span>
          {showAppDomain && (
            <span style={{ fontSize: Math.max(11, Math.round(height * 0.3)), color: "#9CA3AF", fontWeight: 700 }}>
              .app
            </span>
          )}
        </div>
        <span
          style={{
            fontSize: "0.62rem",
            letterSpacing: "0.22em",
            color: "#D1D5DB",
            fontWeight: 700,
          }}
        >
          STREAM · CREA · CONECTA
        </span>
      </div>
    );
  }

  // Variante "header" horizontal compacta (para barra superior y Drawer movil)
  return (
    <span
      className={`virallive-logo-header ${className}`.trim()}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        lineHeight: 1,
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 64 52"
        width={Math.round((height * 64) / 52)}
        height={height}
        style={{ flexShrink: 0, display: "block" }}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradMain} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6D28D9" />
            <stop offset="50%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#FF1F7A" />
          </linearGradient>
          <linearGradient id={gradOrbit} x1="0%" y1="60%" x2="100%" y2="20%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#FF2E93" />
          </linearGradient>
          <linearGradient id={gradText} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#FF2E93" />
          </linearGradient>
        </defs>
        <path
          d="M9 31C3 24 14 14 34 11C49 9 58 14 55 22C52 31 35 40 18 41C10 41 6 37 9 31Z"
          fill="none"
          stroke={`url(#${gradOrbit})`}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M11 8H22.5L30.5 29L38.5 8H50L35.2 44.5C34.2 46.8 32.3 48 30.5 48C28.7 48 26.8 46.8 25.8 44.5L11 8Z"
          fill={`url(#${gradMain})`}
        />
        <path
          d="M27.2 14.5C27.2 13.4 28.4 12.7 29.4 13.3L36.2 17.5C37.1 18 37.1 19.3 36.2 19.9L29.4 24.1C28.4 24.7 27.2 24 27.2 22.9V14.5Z"
          fill="#FFFFFF"
        />
        <path d="M47 10.5C50.5 11.2 53 13.7 53.7 17.2" fill="none" stroke="#FF2E93" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M49 5.5C54.2 6.6 58 10.4 59.1 15.6" fill="none" stroke="#FF2E93" strokeWidth="2.5" strokeLinecap="round" />
      </svg>

      <span className="virallive-logo-wordmark-wrap" style={{ display: "inline-flex", alignItems: "baseline", gap: 2 }}>
        <span className="virallive-logo-wordmark" style={{ fontWeight: 900, fontSize: "1.12rem", letterSpacing: "-0.03em", color: "#FFFFFF" }}>
          Viral
        </span>
        <span
          className="virallive-logo-wordmark"
          style={{
            fontWeight: 900,
            fontSize: "1.12rem",
            letterSpacing: "-0.03em",
            background: "linear-gradient(90deg, #A855F7 0%, #FF2E93 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          live
        </span>
        <span className="virallive-logo-domain" style={{ fontWeight: 700, fontSize: "0.78rem", color: "#CBD5E1" }}>
          .app
        </span>
      </span>

      <span
        className="virallive-logo-live-pill"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          background: "#FF1F7A",
          color: "#FFFFFF",
          padding: "2px 6px",
          borderRadius: 999,
          fontSize: "0.58rem",
          fontWeight: 900,
          letterSpacing: "0.05em",
        }}
      >
        <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#FFFFFF" }} />
        LIVE
      </span>
    </span>
  );
}

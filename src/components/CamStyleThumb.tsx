"use client";

import React from "react";
import type { CamStylePresetItem } from "@/lib/studio-data";

type CamStyleThumbProps = {
  styleItem: CamStylePresetItem;
};

export function CamStyleThumb({ styleItem }: CamStyleThumbProps) {
  const { id, motif, bgFrom, bgTo, accent, skinTint, hairTint, shirtTint } = styleItem;
  const gradId = `cam-st-${id}`;

  if (motif === "snow") {
    return (
      <svg viewBox="0 0 120 120" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" aria-hidden="true" style={{ display: "block" }}>
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0284C7" />
            <stop offset="65%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#E0F2FE" />
          </linearGradient>
        </defs>
        <rect width="120" height="120" fill={`url(#${gradId})`} />
        <circle cx="94" cy="22" r="16" fill="rgba(255,255,255,0.45)" />
        {/* Copo de nieve cristalino central */}
        <g stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" opacity="0.95">
          <line x1="60" y1="22" x2="60" y2="82" />
          <line x1="34" y1="37" x2="86" y2="67" />
          <line x1="86" y1="37" x2="34" y2="67" />
          <polyline points="52,29 60,36 68,29" fill="none" />
          <polyline points="52,75 60,68 68,75" fill="none" />
          <polyline points="40,47 46,44 45,37" fill="none" />
          <polyline points="80,57 74,60 75,67" fill="none" />
          <polyline points="80,47 74,44 75,37" fill="none" />
          <polyline points="40,57 46,60 45,67" fill="none" />
        </g>
        {/* Partículas de nieve y banco de nieve inferior */}
        <g fill="#FFFFFF" opacity="0.88">
          <circle cx="18" cy="26" r="2.2" />
          <circle cx="28" cy="64" r="1.6" />
          <circle cx="96" cy="54" r="2.4" />
          <circle cx="78" cy="20" r="1.8" />
          <circle cx="42" cy="84" r="2" />
        </g>
        <path d="M0 98 Q26 86 58 94 T120 90 L120 120 L0 120 Z" fill="#F0F9FF" opacity="0.92" />
      </svg>
    );
  }

  if (motif === "firebreath") {
    return (
      <svg viewBox="0 0 120 120" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" aria-hidden="true" style={{ display: "block" }}>
        <defs>
          <radialGradient id={gradId} cx="68%" cy="52%" r="60%">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="38%" stopColor="#F97316" />
            <stop offset="76%" stopColor="#7C2D12" />
            <stop offset="100%" stopColor="#050507" />
          </radialGradient>
        </defs>
        <rect width="120" height="120" fill="#060507" />
        {/* Silueta lateral iluminada */}
        <path
          d="M8 22 C24 24 30 34 26 42 L34 50 L26 55 L30 61 L25 66 C30 74 28 84 18 92 L8 102"
          fill="none"
          stroke="#FB923C"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        {/* Chorro de fuego */}
        <path d="M27 59 Q64 42 114 26 L116 94 Q64 78 27 61 Z" fill={`url(#${gradId})`} opacity="0.92" />
        <path d="M30 60 Q68 50 106 42 Q84 62 108 78 Q66 70 30 60 Z" fill="#FDE047" opacity="0.7" />
        <g fill="#FDBA74">
          <circle cx="72" cy="30" r="1.8" />
          <circle cx="96" cy="20" r="1.5" />
          <circle cx="88" cy="96" r="2" />
          <circle cx="106" cy="86" r="1.4" />
        </g>
      </svg>
    );
  }

  if (motif === "torch") {
    return (
      <svg viewBox="0 0 120 120" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" aria-hidden="true" style={{ display: "block" }}>
        <defs>
          <radialGradient id={gradId} cx="50%" cy="54%" r="55%">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="45%" stopColor="#F97316" />
            <stop offset="82%" stopColor="#7C2D12" />
            <stop offset="100%" stopColor="#070506" />
          </radialGradient>
        </defs>
        <rect width="120" height="120" fill="#080507" />
        {/* Aura de llamas */}
        <path
          d="M60 12 C74 26 86 38 82 58 C88 68 82 88 74 106 L46 106 C38 88 32 68 38 58 C34 38 46 26 60 12 Z"
          fill={`url(#${gradId})`}
        />
        {/* Silueta en llamas */}
        <circle cx="60" cy="34" r="9" fill="#0B0605" stroke="#FDE047" strokeWidth="1.8" />
        <path
          d="M47 48 C48 42 72 42 73 48 L78 74 L72 75 L69 58 L67 104 L61 104 L60 76 L59 104 L53 104 L51 58 L48 75 L42 74 Z"
          fill="#0B0605"
          stroke="#FBBF24"
          strokeWidth="1.6"
        />
        <g fill="#FDE047" opacity="0.85">
          <circle cx="34" cy="40" r="1.5" />
          <circle cx="88" cy="36" r="1.8" />
          <circle cx="28" cy="76" r="1.4" />
          <circle cx="92" cy="78" r="1.6" />
        </g>
      </svg>
    );
  }

  if (motif === "deep") {
    return (
      <svg viewBox="0 0 120 120" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" aria-hidden="true" style={{ display: "block" }}>
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0EA5E9" />
            <stop offset="45%" stopColor="#0369A1" />
            <stop offset="100%" stopColor="#04152B" />
          </linearGradient>
        </defs>
        <rect width="120" height="120" fill={`url(#${gradId})`} />
        {/* Haces de luz solar submarinos */}
        <polygon points="48,0 74,0 98,116 24,116" fill="rgba(186,230,253,0.22)" />
        <polygon points="55,0 67,0 78,116 44,116" fill="rgba(224,242,254,0.28)" />
        <ellipse cx="60" cy="6" rx="44" ry="8" fill="rgba(224,242,254,0.45)" />
        {/* Burbujas ascendentes */}
        <g fill="rgba(224,242,254,0.28)" stroke="#BAE6FD" strokeWidth="1.2">
          <circle cx="60" cy="48" r="4.5" />
          <circle cx="53" cy="64" r="3.2" />
          <circle cx="66" cy="76" r="3.8" />
          <circle cx="58" cy="90" r="2.6" />
          <circle cx="63" cy="30" r="2.4" />
        </g>
        {/* Fondo marino oscuro */}
        <path d="M0 100 L18 92 L34 104 L88 102 L106 88 L120 98 L120 120 L0 120 Z" fill="#031022" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 120 120"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      style={{
        display: "block",
        filter: motif === "manga" ? "grayscale(1) contrast(1.25)" : undefined,
      }}
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={bgFrom} />
          <stop offset="100%" stopColor={bgTo} />
        </linearGradient>
      </defs>

      {/* Fondo del setup de streaming */}
      <rect width="120" height="120" fill={`url(#${gradId})`} />

      {/* Monitores y luces de fondo del cuarto */}
      <rect x="10" y="34" width="26" height="30" rx="3" fill="rgba(15,23,42,0.75)" stroke={accent} strokeWidth="1.2" strokeOpacity="0.65" />
      <rect x="84" y="34" width="26" height="30" rx="3" fill="rgba(15,23,42,0.75)" stroke={accent} strokeWidth="1.2" strokeOpacity="0.65" />
      <rect x="38" y="10" width="44" height="8" rx="3" fill="rgba(0,0,0,0.55)" stroke={accent} strokeWidth="1" strokeOpacity="0.7" />
      <line x1="12" y1="22" x2="108" y2="22" stroke="rgba(255,255,255,0.16)" strokeWidth="1.2" />

      {/* Efectos especiales según estética */}
      {motif === "lightning" && (
        <g stroke="#7DD3FC" strokeWidth="2.2" fill="none" strokeLinecap="round">
          <polyline points="16,16 26,38 19,44 30,68" />
          <polyline points="104,16 94,38 101,44 90,68" />
        </g>
      )}
      {motif === "cyber" && (
        <g stroke={accent} strokeWidth="1.5" strokeOpacity="0.55" strokeDasharray="3 3">
          <line x1="22" y1="8" x2="22" y2="85" />
          <line x1="98" y1="12" x2="98" y2="88" />
          <polygon points="92,48 99,44 106,48 106,56 99,60 92,56" fill="none" />
        </g>
      )}
      {motif === "manga" && (
        <g stroke="rgba(0,0,0,0.35)" strokeWidth="1">
          <line x1="0" y1="12" x2="28" y2="30" />
          <line x1="120" y1="12" x2="92" y2="30" />
          <line x1="0" y1="88" x2="26" y2="72" />
          <line x1="120" y1="88" x2="94" y2="72" />
        </g>
      )}

      {/* Silla gamer detrás */}
      <path d="M36 92 L41 44 C42 37 48 34 60 34 C72 34 78 37 79 44 L84 92 Z" fill="rgba(17,24,39,0.88)" stroke="rgba(255,255,255,0.14)" strokeWidth="1.2" />

      {/* Torso / Traje o Armadura */}
      <path
        d="M32 104 C33 84 44 76 60 76 C76 76 87 84 88 104 Z"
        fill={shirtTint}
        stroke={motif === "cartoon" || motif === "manga" ? "#09090B" : "rgba(0,0,0,0.45)"}
        strokeWidth={motif === "cartoon" ? "2.4" : "1.4"}
      />
      {motif === "armor" && (
        <g fill="rgba(255,255,255,0.12)" stroke={accent} strokeWidth="1.2">
          <path d="M33 88 Q42 75 50 81 L46 93 Z" />
          <path d="M87 88 Q78 75 70 81 L74 93 Z" />
        </g>
      )}
      {motif === "sports" && (
        <path d="M51 77 L60 88 L69 77" fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
      )}

      {/* Cabeza según morfología (voxel / brick / estándar) */}
      {motif === "voxel" ? (
        <g>
          <rect x="44" y="42" width="32" height="32" rx="2" fill={skinTint} stroke="#111827" strokeWidth="1.8" />
          <rect x="44" y="42" width="32" height="10" fill={hairTint} />
          <rect x="50" y="57" width="6" height="5" fill="#1E293B" />
          <rect x="64" y="57" width="6" height="5" fill="#1E293B" />
        </g>
      ) : motif === "brick" ? (
        <g>
          <rect x="53" y="36" width="14" height="6" rx="1.5" fill={skinTint} stroke="#111827" strokeWidth="1.4" />
          <rect x="46" y="42" width="28" height="30" rx="7" fill={skinTint} stroke="#111827" strokeWidth="1.8" />
          <circle cx="54" cy="56" r="2.2" fill="#111827" />
          <circle cx="66" cy="56" r="2.2" fill="#111827" />
          <path d="M53 63 Q60 68 67 63" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" />
        </g>
      ) : (
        <g>
          {/* Cabello */}
          <path d="M43 54 C42 38 51 34 60 34 C69 34 78 38 77 54 Z" fill={hairTint} />
          {/* Rostro */}
          <ellipse
            cx="60"
            cy="57"
            rx="15.5"
            ry="17.5"
            fill={skinTint}
            stroke={motif === "cartoon" || motif === "manga" ? "#09090B" : "rgba(0,0,0,0.35)"}
            strokeWidth={motif === "cartoon" ? "2.2" : "1.2"}
          />
          {/* Flequillo / Pelo */}
          <path d="M45 50 C49 41 71 41 75 50 C70 46 52 46 45 50 Z" fill={hairTint} />
          {/* Ojos / Visor */}
          {motif === "cyber" ? (
            <g fill="#09090B" stroke={accent} strokeWidth="1.2">
              <rect x="48" y="53" width="10" height="5" rx="1.5" />
              <rect x="62" y="53" width="10" height="5" rx="1.5" />
            </g>
          ) : (
            <g>
              <circle cx="54" cy="56" r={motif === "anime" ? "2.6" : "2.1"} fill="#111827" />
              <circle cx="66" cy="56" r={motif === "anime" ? "2.6" : "2.1"} fill="#111827" />
              {motif === "anime" && (
                <>
                  <circle cx="53.3" cy="55.1" r="0.9" fill="#FFFFFF" />
                  <circle cx="65.3" cy="55.1" r="0.9" fill="#FFFFFF" />
                </>
              )}
            </g>
          )}
        </g>
      )}

      {/* Audífonos de streamer */}
      <path d="M41 56 C41 37 79 37 79 56" fill="none" stroke="#18181B" strokeWidth="3.5" />
      <rect x="38" y="50" width="6" height="14" rx="3" fill="#27272A" stroke={accent} strokeWidth="1.2" />
      <rect x="76" y="50" width="6" height="14" rx="3" fill="#27272A" stroke={accent} strokeWidth="1.2" />

      {/* Micrófono de estudio + escritorio en primer plano */}
      <rect x="26" y="96" width="68" height="24" rx="3" fill="#0F172A" />
      <rect x="55" y="79" width="10" height="18" rx="5" fill="#1E293B" stroke="rgba(255,255,255,0.28)" strokeWidth="1" />
      <line x1="60" y1="97" x2="60" y2="112" stroke="#475569" strokeWidth="2.5" />
    </svg>
  );
}

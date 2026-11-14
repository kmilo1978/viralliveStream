"use client";

import React from "react";

interface LogoProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Logotipo oficial de TikTok (Nota musical estilizada con efecto cyan/magenta sobre fondo oscuro)
 */
export function TikTokLogo({ size = 18, className = "", style = {} }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ verticalAlign: "middle", flexShrink: 0, borderRadius: 4, ...style }}
      aria-label="TikTok"
    >
      <rect width="24" height="24" rx="5" fill="#010101" />
      <g>
        {/* Sombra Cyan */}
        <path
          d="M16.8 6.2a4.9 4.9 0 0 1-3.3-3.4v-.3h-2.2v13.6a2.9 2.9 0 1 1-3.5-2.8v-2.4a5.3 5.3 0 1 0 5.7 5.2V8.5a8.2 8.2 0 0 0 4.3 1.6V7.8a6.4 6.4 0 0 1-1-1.6z"
          fill="#25F4EE"
        />
        {/* Sombra Roja/Magenta */}
        <path
          d="M17.6 6.8a4.9 4.9 0 0 1-3.3-3.4v-.3h-2.2v13.6a2.9 2.9 0 1 1-3.5-2.8v-2.4a5.3 5.3 0 1 0 5.7 5.2V9.1a8.2 8.2 0 0 0 4.3 1.6V8.4a6.4 6.4 0 0 1-1-1.6z"
          fill="#FE2C55"
        />
        {/* Nota principal blanca */}
        <path
          d="M17.2 6.5a4.9 4.9 0 0 1-3.3-3.4v-.3h-2.2v13.6a2.9 2.9 0 1 1-3.5-2.8v-2.4a5.3 5.3 0 1 0 5.7 5.2V8.8a8.2 8.2 0 0 0 4.3 1.6V8.1a6.4 6.4 0 0 1-1-1.6z"
          fill="#FFFFFF"
        />
      </g>
    </svg>
  );
}

/**
 * Logotipo oficial de YouTube (Botón rojo con triángulo blanco centrado)
 */
export function YouTubeLogo({ size = 18, className = "", style = {} }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ verticalAlign: "middle", flexShrink: 0, borderRadius: 4, ...style }}
      aria-label="YouTube"
    >
      <rect width="24" height="24" rx="5" fill="#FF0000" />
      <path d="M10 8.5L16 12L10 15.5V8.5Z" fill="#FFFFFF" />
    </svg>
  );
}

/**
 * Logotipo oficial de Twitch (Glitch speech bubble morado con ojos característicos)
 */
export function TwitchLogo({ size = 18, className = "", style = {} }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ verticalAlign: "middle", flexShrink: 0, borderRadius: 4, ...style }}
      aria-label="Twitch"
    >
      <rect width="24" height="24" rx="5" fill="#9146FF" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5 4L3.5 7.5V18.5H7.5V21.5L10.5 18.5H13.5L18.5 13.5V4H5ZM17 12.5L14.5 15H11.5L9 17.5V15H6.5V5.5H17V12.5Z"
        fill="#FFFFFF"
      />
      <rect x="13.5" y="8" width="1.8" height="4.5" fill="#FFFFFF" />
      <rect x="9.5" y="8" width="1.8" height="4.5" fill="#FFFFFF" />
    </svg>
  );
}

/**
 * Logotipo oficial de Facebook (Azul institucional #1877F2 con 'f' blanca auténtica)
 */
export function FacebookLogo({ size = 18, className = "", style = {} }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ verticalAlign: "middle", flexShrink: 0, borderRadius: 4, ...style }}
      aria-label="Facebook"
    >
      <rect width="24" height="24" rx="5" fill="#1877F2" />
      <path
        d="M15.5 12.5H13V20H9.5V12.5H8V9.5H9.5V7.5C9.5 5.5 10.7 4 13.5 4H16V7H14.2C13.4 7 13 7.4 13 8.2V9.5H16L15.5 12.5Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

/**
 * Logotipo oficial de Instagram (Cámara con gradiente característico)
 */
export function InstagramLogo({ size = 18, className = "", style = {} }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ verticalAlign: "middle", flexShrink: 0, borderRadius: 4, ...style }}
      aria-label="Instagram"
    >
      <defs>
        <radialGradient id="ig-official-grad" cx="20%" cy="100%" r="130%">
          <stop offset="0%" stopColor="#FFDC80" />
          <stop offset="20%" stopColor="#FCAF45" />
          <stop offset="40%" stopColor="#F77737" />
          <stop offset="60%" stopColor="#F56040" />
          <stop offset="80%" stopColor="#FD1D1D" />
          <stop offset="100%" stopColor="#C13584" />
        </radialGradient>
      </defs>
      <rect width="24" height="24" rx="5" fill="url(#ig-official-grad)" />
      <rect x="5.5" y="5.5" width="13" height="13" rx="3.5" stroke="#FFFFFF" strokeWidth="1.8" fill="none" />
      <circle cx="12" cy="12" r="3.2" stroke="#FFFFFF" strokeWidth="1.8" fill="none" />
      <circle cx="15.8" cy="8.2" r="0.9" fill="#FFFFFF" />
    </svg>
  );
}

/**
 * Logotipo de Kick (Verde Neón con K retro)
 */
export function KickLogo({ size = 18, className = "", style = {} }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ verticalAlign: "middle", flexShrink: 0, borderRadius: 4, ...style }}
      aria-label="Kick"
    >
      <rect width="24" height="24" rx="5" fill="#53FC18" />
      <path d="M6.5 5.5H10.5V10.5L14.5 5.5H18.5L13.5 12L19 18.5H14.5L10.5 13.5V18.5H6.5V5.5Z" fill="#000000" />
    </svg>
  );
}

/**
 * Despachador universal de logotipos de plataformas
 */
export function PlatformLogo({
  platform,
  size = 18,
  className = "",
  style = {},
}: {
  platform: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const p = platform.toLowerCase();
  switch (p) {
    case "tiktok":
      return <TikTokLogo size={size} className={className} style={style} />;
    case "youtube":
      return <YouTubeLogo size={size} className={className} style={style} />;
    case "twitch":
      return <TwitchLogo size={size} className={className} style={style} />;
    case "facebook":
      return <FacebookLogo size={size} className={className} style={style} />;
    case "instagram":
      return <InstagramLogo size={size} className={className} style={style} />;
    case "kick":
      return <KickLogo size={size} className={className} style={style} />;
    case "x":
    case "twitter":
      return <SocialIcon network="twitter-x" size={size} className={className} style={style} />;
    case "linkedin":
      return <SocialIcon network="linkedin" size={size} className={className} style={style} />;
    case "whatsapp":
      return <SocialIcon network="whatsapp" size={size} className={className} style={style} />;
    case "discord":
      return <SocialIcon network="discord" size={size} className={className} style={style} />;
    default:
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          width={size}
          height={size}
          fill="currentColor"
          className={className}
          style={{ verticalAlign: "middle", flexShrink: 0, ...style }}
          aria-hidden="true"
        >
          <path d="M14.5 12c1.66 0 3 1.34 3 3s-1.34 3-3 3s-3-1.34-3-3c0-.24.03-.46.09-.69l-4.38-2.3c-.55.61-1.33.99-2.21.99c-1.66 0-3-1.34-3-3s1.34-3 3-3c.88 0 1.66.39 2.21.99l4.38-2.3c-.06-.23-.09-.45-.09-.69c0-1.66 1.34-3 3-3s3 1.34 3 3s-1.34 3-3 3c-.88 0-1.66-.39-2.21-.99l-4.38 2.3a2.67 2.67 0 0 1 0 1.38l4.38 2.3c.55-.61 1.33-.99 2.21-.99" />
        </svg>
      );
  }
}

export type SocialNetworkName =
  | "instagram"
  | "youtube"
  | "linkedin"
  | "twitter-x"
  | "tiktok"
  | "facebook"
  | "twitch"
  | "whatsapp"
  | "discord"
  | "telegram";

const SOCIAL_ICON_PATHS: Record<Exclude<SocialNetworkName, "twitch">, string> = {
  telegram:
    "M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8.287 5.906q-1.168.486-4.666 2.01-.567.225-.595.442c-.03.243.275.339.69.47l.175.055c.408.133.958.288 1.243.294q.39.01.868-.32 3.269-2.206 3.374-2.23c.05-.012.1-.03.136.002s.034.09.02.106c-.05.06-1.077 1.01-1.637 1.53l-.22.206q-.298.279-.08.528l1.47 1.096q.628.468 1.12.468c.32 0 .54-.265.644-.563.26-1.226.772-3.642.905-5.04q.02-.218-.088-.344a.4.4 0 0 0-.256-.123q-.16-.015-.558.15",
  instagram:
    "M8 0C5.829 0 5.556.01 4.703.048C3.85.088 3.269.222 2.76.42a3.9 3.9 0 0 0-1.417.923A3.9 3.9 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7C.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297c.04.852.174 1.433.372 1.942c.205.526.478.972.923 1.417c.444.445.89.719 1.416.923c.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.9 3.9 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417c.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.9 3.9 0 0 0-.923-1.417A3.9 3.9 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046c.78.035 1.204.166 1.486.275c.373.145.64.319.92.599s.453.546.598.92c.11.281.24.705.275 1.485c.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.5 2.5 0 0 1-.599.919c-.28.28-.546.453-.92.598c-.28.11-.704.24-1.485.276c-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.5 2.5 0 0 1-.92-.598a2.5 2.5 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485c-.038-.843-.046-1.096-.046-3.233s.008-2.388.046-3.231c.036-.78.166-1.204.276-1.486c.145-.373.319-.64.599-.92s.546-.453.92-.598c.282-.11.705-.24 1.485-.276c.738-.034 1.024-.044 2.515-.045zm4.988 1.328a.96.96 0 1 0 0 1.92a.96.96 0 0 0 0-1.92m-4.27 1.122a4.109 4.109 0 1 0 0 8.217a4.109 4.109 0 0 0 0-8.217m0 1.441a2.667 2.667 0 1 1 0 5.334a2.667 2.667 0 0 1 0-5.334",
  youtube:
    "M8.051 1.999h.089c.822.003 4.987.033 6.11.335a2.01 2.01 0 0 1 1.415 1.42c.101.38.172.883.22 1.402l.01.104l.022.26l.008.104c.065.914.073 1.77.074 1.957v.075c-.001.194-.01 1.108-.082 2.06l-.008.105l-.009.104c-.05.572-.124 1.14-.235 1.558a2.01 2.01 0 0 1-1.415 1.42c-1.16.312-5.569.334-6.18.335h-.142c-.309 0-1.587-.006-2.927-.052l-.17-.006l-.087-.004l-.171-.007l-.171-.007c-1.11-.049-2.167-.128-2.654-.26a2.01 2.01 0 0 1-1.415-1.419c-.111-.417-.185-.986-.235-1.558L.09 9.82l-.008-.104A31 31 0 0 1 0 7.68v-.123c.002-.215.01-.958.064-1.778l.007-.103l.003-.052l.008-.104l.022-.26l.01-.104c.048-.519.119-1.023.22-1.402a2.01 2.01 0 0 1 1.415-1.42c.487-.13 1.544-.21 2.654-.26l.17-.007l.172-.006l.086-.003l.171-.007A100 100 0 0 1 7.858 2zM6.4 5.209v4.818l4.157-2.408z",
  linkedin:
    "M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854zm4.943 12.248V6.169H2.542v7.225zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248c-.015-.709-.52-1.248-1.342-1.248S2.4 3.226 2.4 3.934c0 .694.521 1.248 1.327 1.248zm4.908 8.212V9.359c0-.216.016-.432.08-.586c.173-.431.568-.878 1.232-.878c.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252c-1.274 0-1.845.7-2.165 1.193v.025h-.016l.016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225z",
  "twitter-x":
    "M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07l-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75Zm-.86 13.028h1.36L4.323 2.145H2.865z",
  tiktok:
    "M9 0h1.98c.144.715.54 1.617 1.235 2.512C12.895 3.389 13.797 4 15 4v2c-1.753 0-3.07-.814-4-1.829V11a5 5 0 1 1-5-5v2a3 3 0 1 0 3 3z",
  facebook:
    "M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131c.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951",
  whatsapp:
    "M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144l-2.494.654l.666-2.433l-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931a6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646c-.182-.065-.315-.099-.445.099c-.133.197-.513.646-.627.775c-.114.133-.232.148-.43.05c-.197-.1-.836-.308-1.592-.985c-.59-.525-.985-1.175-1.103-1.372c-.114-.198-.011-.304.088-.403c.087-.088.197-.232.296-.346c.1-.114.133-.198.198-.33c.065-.134.034-.248-.015-.347c-.05-.099-.445-1.076-.612-1.47c-.16-.389-.323-.335-.445-.34c-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992c.47.205.84.326 1.129.418c.475.152.904.129 1.246.08c.38-.058 1.171-.48 1.338-.943c.164-.464.164-.86.114-.943c-.049-.084-.182-.133-.38-.232",
  discord:
    "M13.545 2.907a13.2 13.2 0 0 0-3.257-1.011a.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.2 12.2 0 0 0-3.658 0a8 8 0 0 0-.412-.833a.05.05 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.04.04 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032q.003.022.021.037a13.3 13.3 0 0 0 3.995 2.02a.05.05 0 0 0 .056-.019q.463-.63.818-1.329a.05.05 0 0 0-.01-.059l-.018-.011a9 9 0 0 1-1.248-.595a.05.05 0 0 1-.02-.066l.015-.019q.127-.095.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.05.05 0 0 1 .053.007q.121.1.248.195a.05.05 0 0 1-.004.085a8 8 0 0 1-1.249.594a.05.05 0 0 0-.03.03a.05.05 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019a13.2 13.2 0 0 0 4.001-2.02a.05.05 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.03.03 0 0 0-.02-.019m-8.198 7.307c-.789 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.45.73 1.438 1.613c0 .888-.637 1.612-1.438 1.612m5.316 0c-.788 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.451.73 1.438 1.613c0 .888-.631 1.612-1.438 1.612",
};

/**
 * Iconos sociales vectoriales oficiales (colección icons0.dev/?q=social)
 */
export function SocialIcon({
  network,
  size = 16,
  className = "",
  style = {},
}: {
  network: SocialNetworkName;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  if (network === "twitch") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        width={size}
        height={size}
        fill="currentColor"
        className={className}
        style={{ verticalAlign: "middle", flexShrink: 0, ...style }}
        aria-hidden="true"
      >
        <path d="M3.857 0L1 2.857v10.286h3.429V16l2.857-2.857H9.57L14.714 8V0zm9.714 7.429l-2.285 2.285H9l-2 2v-2H4.429V1.143h9.142z" />
        <path d="M11.857 3.143h-1.143V6.57h1.143zm-3.143 0H7.571V6.57h1.143z" />
      </svg>
    );
  }
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      width={size}
      height={size}
      fill="currentColor"
      className={className}
      style={{ verticalAlign: "middle", flexShrink: 0, ...style }}
      aria-hidden="true"
    >
      <path d={SOCIAL_ICON_PATHS[network]} />
    </svg>
  );
}

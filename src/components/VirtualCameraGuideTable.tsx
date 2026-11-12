"use client";

import React, { useState } from "react";
import { Dashicon } from "@/components/Dashicons";
import { SocialIcon } from "@/components/PlatformLogos";

export interface VirtualCameraGuideTableProps {
  onOpenPopout?: () => void;
  compact?: boolean;
}

export function VirtualCameraGuideTable({ onOpenPopout, compact = false }: VirtualCameraGuideTableProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<string>("all");

  const getStageUrl = () => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/obs-stage`;
    }
    return "http://localhost:3000/obs-stage";
  };

  const handleCopy = (text: string, key: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    }
  };

  const apps = [
    {
      id: "zoom",
      name: "Zoom",
      badgeColor: "#2D8CFF",
      icon: "video-alt3",
      activationPath: "Configuración ⚙️ > Video > Cámara: Eliges \"OBS Virtual Camera\"",
      tip: "En Zoom, desactiva 'Reflejar mi video' si vas a mostrar texto o códigos QR para que tu audiencia los lea correctamente.",
    },
    {
      id: "meet",
      name: "Google Meet",
      badgeColor: "#00AC47",
      icon: "groups",
      activationPath: "Configuración (3 puntos) > Video > Cámara: Eliges \"OBS Virtual Camera\"",
      tip: "En Google Meet, ajusta la resolución de envío a 720p (Alta Definición) en la pestaña de Video para máxima nitidez.",
    },
    {
      id: "teams",
      name: "Microsoft Teams",
      badgeColor: "#6264A7",
      icon: "networking",
      activationPath: "Configuración > Dispositivos > Cámara: Eliges \"OBS Virtual Camera\"",
      tip: "En Teams, desmarca cualquier filtro de fondo nativo (desenfoque o fondo virtual de Teams) para usar el fondo de Virallive.",
    },
    {
      id: "wa-desktop",
      name: "WhatsApp Desktop (Windows)",
      badgeColor: "#25D366",
      isWhatsApp: true,
      activationPath: "Ajustes de llamada > Dispositivos de Video: Eliges \"OBS Virtual Camera\"",
      tip: "Ideal para atención al cliente y ventas con ropa Try-On o fondos profesionales en llamadas uno a uno.",
    },
    {
      id: "wa-web",
      name: "WhatsApp Web",
      badgeColor: "#128C7E",
      isWhatsApp: true,
      activationPath: "Al iniciar videollamada, el navegador te pide permiso y eliges \"OBS Virtual Camera\"",
      tip: "Asegúrate de permitir el acceso a la cámara en el candado de la barra de direcciones de tu navegador.",
    },
  ];

  const filteredApps = selectedApp === "all" ? apps : apps.filter((a) => a.id === selectedApp);

  return (
    <div
      className="vcam-step-by-step-guide"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: compact ? 12 : 16,
        background: "rgba(14, 15, 24, 0.96)",
        border: "1px solid rgba(236, 72, 153, 0.4)",
        borderRadius: 18,
        padding: compact ? "14px 16px" : "20px 22px",
        boxShadow: "0 12px 36px rgba(0,0,0,0.65), 0 0 24px rgba(236, 72, 153, 0.2)",
        color: "#FFFFFF",
      }}
    >
      {/* TÍTULO Y BADGE */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(236, 72, 153, 0.4)",
            }}
          >
            <Dashicon name="video-alt2" size={18} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: compact ? "0.95rem" : "1.08rem", fontWeight: 900, color: "#FFFFFF" }}>
              Cámara Virtual para Videollamadas &amp; Transmisión
            </h4>
            <span style={{ fontSize: "0.74rem", color: "#94A3B8" }}>
              Usa tus fondos, probador Try-On y capas en <strong>Zoom, Google Meet, Teams y WhatsApp</strong>
            </span>
          </div>
        </div>
        <span
          style={{
            fontSize: "0.68rem",
            fontWeight: 800,
            background: "rgba(16, 185, 129, 0.15)",
            border: "1px solid #10B981",
            color: "#4ADE80",
            padding: "4px 10px",
            borderRadius: 999,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ADE80", boxShadow: "0 0 8px #4ADE80" }} />
          Señal 100% Compatible
        </span>
      </div>

      {/* PASO 1 Y PASO 2 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
        {/* Paso 1 */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: 14,
            padding: "12px 14px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 22, height: 22, borderRadius: "50%", background: "#EC4899", color: "#FFF", fontSize: "0.72rem", fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>1</span>
            <strong style={{ fontSize: "0.84rem", color: "#F472B6" }}>Abrir la señal limpia de tu Cabina</strong>
          </div>
          <p style={{ margin: 0, fontSize: "0.74rem", color: "#CBD5E1", lineHeight: 1.45 }}>
            Abre la ventana desacoplada o agrega una fuente <strong>Navegador (Browser Source)</strong> en OBS Studio:
          </p>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input
              type="text"
              readOnly
              value={getStageUrl()}
              style={{
                flex: 1,
                minWidth: 0,
                background: "#08080E",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: 8,
                padding: "6px 10px",
                color: "#4ADE80",
                fontSize: "0.72rem",
                fontFamily: "monospace",
              }}
            />
            <button
              type="button"
              onClick={() => handleCopy(getStageUrl(), "stageUrl")}
              style={{
                flex: "0 0 auto",
                padding: "6px 12px",
                background: copiedKey === "stageUrl" ? "#10B981" : "rgba(236, 72, 153, 0.2)",
                border: "1px solid #EC4899",
                borderRadius: 8,
                color: "#FFF",
                fontSize: "0.72rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Dashicon name={copiedKey === "stageUrl" ? "yes-alt" : "clipboard"} size={13} />
              <span>{copiedKey === "stageUrl" ? "¡Copiado!" : "Copiar"}</span>
            </button>
            {onOpenPopout ? (
              <button
                type="button"
                onClick={onOpenPopout}
                style={{
                  flex: "0 0 auto",
                  padding: "6px 10px",
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: 8,
                  color: "#FFF",
                  fontSize: "0.72rem",
                  cursor: "pointer",
                }}
                title="Abrir ventana externa"
              >
                Pop-out ↗
              </button>
            ) : (
              <a
                href="/obs-stage"
                target="_blank"
                rel="noreferrer"
                style={{
                  flex: "0 0 auto",
                  padding: "6px 10px",
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: 8,
                  color: "#FFF",
                  fontSize: "0.72rem",
                  textDecoration: "none",
                }}
                title="Abrir ventana externa"
              >
                Pop-out ↗
              </a>
            )}
          </div>
        </div>

        {/* Paso 2 */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: 14,
            padding: "12px 14px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 22, height: 22, borderRadius: "50%", background: "#8B5CF6", color: "#FFF", fontSize: "0.72rem", fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>2</span>
            <strong style={{ fontSize: "0.84rem", color: "#A78BFA" }}>Activar Cámara Virtual en OBS Studio</strong>
          </div>
          <p style={{ margin: 0, fontSize: "0.74rem", color: "#CBD5E1", lineHeight: 1.45 }}>
            En OBS Studio, ve al panel de controles en la esquina inferior derecha y haz clic en:
          </p>
          <div
            style={{
              padding: "8px 12px",
              background: "linear-gradient(90deg, rgba(37, 99, 235, 0.25) 0%, rgba(139, 92, 246, 0.25) 100%)",
              border: "1.5px solid #3B82F6",
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: "1rem" }}>📹</span>
              <strong style={{ fontSize: "0.82rem", color: "#60A5FA" }}>&quot;Iniciar Cámara Virtual&quot;</strong>
            </div>
            <span style={{ fontSize: "0.68rem", color: "#93C5FD", background: "rgba(59, 130, 246, 0.2)", padding: "2px 8px", borderRadius: 6 }}>1 Clic</span>
          </div>
        </div>
      </div>

      {/* PASO 3: TABLA EXACTA DE LA IMAGEN */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 22, height: 22, borderRadius: "50%", background: "#10B981", color: "#FFF", fontSize: "0.72rem", fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>3</span>
            <strong style={{ fontSize: "0.88rem", color: "#FFFFFF" }}>
              Seleccionarlo en tu aplicación de videollamada:
            </strong>
          </div>

          {/* Filtro rápido de app */}
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setSelectedApp("all")}
              style={{
                padding: "3px 8px",
                borderRadius: 6,
                border: "none",
                background: selectedApp === "all" ? "#EC4899" : "rgba(255, 255, 255, 0.08)",
                color: "#FFF",
                fontSize: "0.68rem",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Todas
            </button>
            {apps.map((app) => (
              <button
                key={app.id}
                type="button"
                onClick={() => setSelectedApp(app.id)}
                style={{
                  padding: "3px 8px",
                  borderRadius: 6,
                  border: "none",
                  background: selectedApp === app.id ? app.badgeColor : "rgba(255, 255, 255, 0.08)",
                  color: "#FFF",
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {app.name.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>

        {/* TABLA ESTILIZADA IDÉNTICA A LA IMAGEN */}
        <div
          style={{
            overflowX: "auto",
            borderRadius: 12,
            border: "1px solid rgba(255, 255, 255, 0.12)",
            background: "#0A0B12",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.78rem" }}>
            <thead>
              <tr style={{ background: "rgba(255, 255, 255, 0.06)", borderBottom: "1px solid rgba(255, 255, 255, 0.1)" }}>
                <th style={{ padding: "10px 14px", fontWeight: 800, color: "#E2E8F0", width: "32%" }}>Aplicación</th>
                <th style={{ padding: "10px 14px", fontWeight: 800, color: "#E2E8F0" }}>Dónde se activa en la app</th>
              </tr>
            </thead>
            <tbody>
              {filteredApps.map((app, idx) => (
                <tr
                  key={app.id}
                  style={{
                    borderBottom: idx === filteredApps.length - 1 ? "none" : "1px solid rgba(255, 255, 255, 0.05)",
                    background: idx % 2 === 0 ? "rgba(255, 255, 255, 0.01)" : "rgba(255, 255, 255, 0.03)",
                    transition: "background 0.15s ease",
                  }}
                >
                  <td style={{ padding: "10px 14px", verticalAlign: "middle" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          background: app.badgeColor,
                          boxShadow: `0 0 8px ${app.badgeColor}`,
                          flexShrink: 0,
                        }}
                      />
                      <strong style={{ color: "#FFFFFF", fontSize: "0.82rem" }}>{app.name}</strong>
                    </div>
                  </td>
                  <td style={{ padding: "10px 14px", color: "#CBD5E1", lineHeight: 1.45 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      <span style={{ fontStyle: "italic", color: "#F1F5F9" }}>
                        {app.activationPath}
                      </span>
                      {selectedApp !== "all" && (
                        <span style={{ fontSize: "0.7rem", color: "#94A3B8", marginTop: 2 }}>
                          💡 Consejo: {app.tip}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

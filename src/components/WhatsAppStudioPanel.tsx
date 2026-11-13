"use client";

import React, { useState, useEffect, useId } from "react";
import { Dashicon } from "./Dashicons";
import { SocialIcon } from "./PlatformLogos";
import { generateQrCodeDataUrl } from "@/lib/qr-helper";
import type { WhatsAppConfig, WhatsAppIntegrationMode } from "@/lib/studio-data";

interface WhatsAppStudioPanelProps {
  config: WhatsAppConfig;
  onChangeConfig: (newConfig: WhatsAppConfig) => void;
  onToggleOnScreen: () => void;
  activeCabinName?: "CAM" | "TRY ON" | "DÚO";
}

export function WhatsAppStudioPanel({
  config,
  onChangeConfig,
  onToggleOnScreen,
  activeCabinName = "CAM",
}: WhatsAppStudioPanelProps) {
  const [activeTab, setActiveTab] = useState<WhatsAppIntegrationMode>(config.mode || "number");
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string>(config.qrCodeDataUrl || "");

  // Simulador de prueba de Agente IA
  const [simQuery, setSimQuery] = useState<string>("¡Hola! Me interesó la prenda que mostraron en el stream, ¿tienen talla M y cuánto cuesta?");
  const [simResponse, setSimResponse] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // Generar link oficial de WhatsApp (wa.me)
  const cleanPhone = config.phoneNumber.replace(/[^0-9]/g, "");
  const waLink = cleanPhone
    ? `https://wa.me/${cleanPhone}${config.defaultMessage ? `?text=${encodeURIComponent(config.defaultMessage)}` : ""}`
    : "https://wa.me/";

  // Generar código QR dinámicamente cada vez que cambia el teléfono o mensaje
  useEffect(() => {
    let active = true;
    const updateQr = async () => {
      if (cleanPhone) {
        const dataUrl = await generateQrCodeDataUrl(waLink);
        if (active) {
          setQrUrl(dataUrl);
          if (dataUrl !== config.qrCodeDataUrl) {
            onChangeConfig({ ...config, qrCodeDataUrl: dataUrl });
          }
        }
      }
    };
    void updateQr();
    return () => {
      active = false;
    };
  }, [cleanPhone, config, onChangeConfig, waLink]);

  const handleCopy = (text: string, label: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopyFeedback(`¡${label} copiado al portapapeles!`);
      setTimeout(() => setCopyFeedback(null), 2500);
    }
  };

  const handleSimulateAiResponse = () => {
    if (!simQuery.trim()) return;
    setIsSimulating(true);
    setSimResponse(null);

    setTimeout(() => {
      const responses = [
        `¡Hola! 👋 Qué gusto que estés viendo nuestra transmisión en vivo. Sí, tenemos disponibilidad en talla M. El precio especial de la transmisión es de $49.99 USD con envío prioritario. ¿A qué ciudad te gustaría recibirlo? 📦`,
        `¡Hola! 🛍️ Gracias por escribirnos desde la cabina en vivo. Ese producto cuenta con garantía oficial y 15% de descuento por la transmisión. ¿Deseas que te enviemos el enlace de pago directo o prefieres pagar contra entrega?`,
        `¡Excelente elección! 🎉 La prenda que viste en el stream cuenta con tela stretch de alta calidad. En talla M nos quedan las últimas 3 unidades. Si me confirmas tus datos en este chat te apartamos el pedido de inmediato.`,
      ];
      const randomReply = responses[Math.floor(Math.random() * responses.length)];
      setSimResponse(randomReply);
      setIsSimulating(false);
    }, 900);
  };

  const phoneInputId = useId();
  const defaultMsgInputId = useId();
  const ctaInputId = useId();
  const posSelectId = useId();
  const webhookUrlInputId = useId();
  const apiKeyInputId = useId();
  const aiPromptTextareaId = useId();

  return (
    <div className="studio-dock-card whatsapp-studio-panel">
      {/* 1. ENCABEZADO OFICIAL DE WHATSAPP */}
      <div className="studio-dock-card-header" style={{ alignItems: "flex-start", gap: 12 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flex: 1, minWidth: 0 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF",
              flexShrink: 0,
              boxShadow: "0 4px 12px rgba(37, 211, 102, 0.35)",
            }}
          >
            <SocialIcon network="whatsapp" size={20} />
          </div>
          <div className="studio-dock-header-info">
            <h3 className="studio-dock-header-title" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span>WhatsApp Live & Agente IA</span>
              <span
                style={{
                  fontSize: "0.62rem",
                  padding: "2px 6px",
                  borderRadius: 6,
                  background: "rgba(37, 211, 102, 0.15)",
                  color: "#25D366",
                  fontWeight: 800,
                  border: "1px solid rgba(37, 211, 102, 0.3)",
                }}
              >
                Activo en {activeCabinName}
              </span>
            </h3>
            <p className="studio-dock-header-subtitle">
              Atiende compras y prospectos en vivo por QR, número directo o con tu Agente IA 24/7.
            </p>
          </div>
        </div>

        {/* Interruptor maestro de pantalla */}
        <button
          type="button"
          className={`studio-action-button ${config.showOnScreen ? "active-green" : ""}`}
          style={{
            borderColor: config.showOnScreen ? "#25D366" : "rgba(37, 211, 102, 0.4)",
            color: config.showOnScreen ? "#FFFFFF" : "#25D366",
            background: config.showOnScreen ? "#25D366" : "rgba(37, 211, 102, 0.1)",
            padding: "6px 12px",
            fontSize: "0.75rem",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontWeight: 800,
          }}
          onClick={onToggleOnScreen}
          title={config.showOnScreen ? "Ocultar WhatsApp del monitor" : "Proyectar WhatsApp y QR en el monitor de video"}
        >
          <SocialIcon network="whatsapp" size={14} />
          <span>{config.showOnScreen ? "EN PANTALLA: ON" : "EN PANTALLA: OFF"}</span>
        </button>
      </div>

      {copyFeedback && (
        <div className="copy-feedback-toast" style={{ margin: "4px 0 10px 0" }}>
          {copyFeedback}
        </div>
      )}

      {/* 2. PESTAÑAS DE INTEGRACIÓN: NÚMERO, QR O AGENTE IA */}
      <div className="whatsapp-tabs-row" style={{ marginTop: 6, marginBottom: 12 }}>
        <button
          type="button"
          className={`whatsapp-tab-pill ${activeTab === "number" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("number");
            onChangeConfig({ ...config, mode: "number" });
          }}
          style={{ gap: 6 }}
        >
          <Dashicon name="smartphone" size={13} />
          <span>1. Por Número</span>
        </button>

        <button
          type="button"
          className={`whatsapp-tab-pill ${activeTab === "qr" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("qr");
            onChangeConfig({ ...config, mode: "qr" });
          }}
          style={{ gap: 6 }}
        >
          <Dashicon name="visibility" size={13} />
          <span>2. Código QR</span>
        </button>

        <button
          type="button"
          className={`whatsapp-tab-pill ${activeTab === "api" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("api");
            onChangeConfig({ ...config, mode: "api" });
          }}
          style={{ gap: 6 }}
        >
          <Dashicon name="admin-generic" size={13} />
          <span>3. API & Agente IA</span>
        </button>
      </div>

      {/* 3. CONTENIDO SEGÚN MODO SELECCIONADO */}

      {/* MODO 1: POR NÚMERO DIRECTO */}
      {activeTab === "number" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div className="studio-input-group">
            <label htmlFor={phoneInputId} className="studio-input-label">
              <span>Número de WhatsApp (con código de país)</span>
              <span style={{ color: "#25D366" }}>* Oficial</span>
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                id={phoneInputId}
                type="text"
                className="studio-input"
                placeholder="+57 300 123 4567 o +1 555 234 5678"
                value={config.phoneNumber}
                onChange={(e) => onChangeConfig({ ...config, phoneNumber: e.target.value })}
                style={{ flex: 1, borderColor: "rgba(37, 211, 102, 0.4)" }}
              />
            </div>
          </div>

          <div className="studio-input-group" style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
            <label htmlFor={defaultMsgInputId} className="studio-input-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
              <span style={{ fontWeight: 700, color: "#E2E8F0" }}>Mensaje Inicial Predeterminado</span>
              <span className="muted-hint" style={{ fontSize: "0.72rem", color: "#94A3B8" }}>El cliente lo envía con 1 toque</span>
            </label>
            <textarea
              id={defaultMsgInputId}
              className="studio-textarea"
              rows={3}
              value={config.defaultMessage}
              onChange={(e) => onChangeConfig({ ...config, defaultMessage: e.target.value })}
              placeholder="Ej: ¡Hola! Te vi en vivo en la transmisión y quiero comprar / más información."
              style={{ fontSize: "0.84rem", minHeight: 74, width: "100%", display: "block" }}
            />
          </div>

          <div
            style={{
              padding: "10px 12px",
              background: "rgba(18, 140, 126, 0.12)",
              border: "1px solid rgba(37, 211, 102, 0.3)",
              borderRadius: 10,
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "#25D366" }}>
                Enlace Directo Generado (wa.me)
              </span>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  type="button"
                  className="pill-ctrl-button"
                  style={{ padding: "2px 8px", fontSize: "0.7rem", height: 26 }}
                  onClick={() => handleCopy(waLink, "Enlace de WhatsApp")}
                >
                  <Dashicon name="clipboard" size={11} />
                  <span>Copiar</span>
                </button>
                <button
                  type="button"
                  className="pill-ctrl-button active-pink"
                  style={{ padding: "2px 8px", fontSize: "0.7rem", height: 26, background: "#25D366", borderColor: "#25D366", color: "#FFF" }}
                  onClick={() => window.open(waLink, "_blank")}
                >
                  <Dashicon name="external" size={11} />
                  <span>Probar</span>
                </button>
              </div>
            </div>
            <div style={{ fontFamily: "monospace", fontSize: "0.72rem", color: "#E2E8F0", wordBreak: "break-all" }}>
              {waLink}
            </div>
          </div>
        </div>
      )}

      {/* MODO 2: POR CÓDIGO QR */}
      {activeTab === "qr" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: 12,
              background: "rgba(10, 10, 16, 0.7)",
              borderRadius: 12,
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <div
              style={{
                width: 96,
                height: 96,
                background: "#FFFFFF",
                borderRadius: 10,
                padding: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px solid #25D366",
                boxShadow: "0 4px 16px rgba(37, 211, 102, 0.3)",
                flexShrink: 0,
              }}
            >
              {qrUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrUrl} alt="WhatsApp QR Code" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              ) : (
                <span style={{ fontSize: "0.6rem", color: "#666" }}>Generando...</span>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "#FFFFFF" }}>
                Código QR Escaneable en Pantalla
              </span>
              <p style={{ margin: 0, fontSize: "0.72rem", color: "#94A3B8", lineHeight: 1.35 }}>
                Tus espectadores en TikTok, YouTube, Facebook o Twitch apuntan con su celular y abren el chat contigo al instante.
              </p>
              <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                <a
                  href={qrUrl}
                  download="whatsapp-qr-viralive.png"
                  className="pill-ctrl-button"
                  style={{ textDecoration: "none", padding: "3px 8px", fontSize: "0.7rem", height: 26 }}
                >
                  <Dashicon name="download" size={12} />
                  <span>Descargar PNG</span>
                </a>
                <button
                  type="button"
                  className="pill-ctrl-button active-pink"
                  style={{
                    padding: "3px 8px",
                    fontSize: "0.7rem",
                    height: 26,
                    background: config.showOnScreen ? "#EF4444" : "#25D366",
                    borderColor: config.showOnScreen ? "#EF4444" : "#25D366",
                    color: "#FFF",
                  }}
                  onClick={onToggleOnScreen}
                >
                  <Dashicon name="video-alt2" size={12} />
                  <span>{config.showOnScreen ? "Quitar de Pantalla" : "Mostrar en Pantalla"}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="studio-input-group">
            <label htmlFor={ctaInputId} className="studio-input-label">
              <span>Texto / Llamado a la Acción en Pantalla</span>
            </label>
            <input
              id={ctaInputId}
              type="text"
              className="studio-input"
              value={config.callToAction || "Escríbenos en vivo a WhatsApp"}
              onChange={(e) => onChangeConfig({ ...config, callToAction: e.target.value })}
              placeholder="Ej: Escríbenos para pedir o apartar tu talla"
            />
          </div>

          <div className="studio-input-group">
            <label htmlFor={posSelectId} className="studio-input-label">
              <span>Ubicación del Sticker en Pantalla</span>
            </label>
            <select
              id={posSelectId}
              className="studio-select"
              value={config.position || "bottom-left"}
              onChange={(e) =>
                onChangeConfig({
                  ...config,
                  position: e.target.value as WhatsAppConfig["position"],
                })
              }
            >
              <option value="bottom-left">Inferior Izquierda (Recomendado sin tapar chat)</option>
              <option value="bottom-right">Inferior Derecha</option>
              <option value="top-left">Superior Izquierda</option>
              <option value="top-right">Superior Derecha</option>
            </select>
          </div>
        </div>
      )}

      {/* MODO 3: POR API & AGENTE IA */}
      {activeTab === "api" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Switch Auto-responder con Agente IA */}
          <div
            style={{
              padding: "10px 12px",
              background: "rgba(37, 211, 102, 0.12)",
              border: "1px solid rgba(37, 211, 102, 0.35)",
              borderRadius: 12,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "#FFFFFF" }}>
                  Auto-responder con Agente IA
                </span>
                <span className="nav-badge-new" style={{ background: "#25D366", color: "#000" }}>24/7</span>
              </div>
              <p style={{ margin: "2px 0 0 0", fontSize: "0.72rem", color: "#A7F3D0" }}>
                Responde mensajes entrantes de WhatsApp automáticamente mientras estás en vivo.
              </p>
            </div>
            <div
              className={`switchy-toggle ${config.aiAgentEnabled ? "active-green" : ""}`}
              onClick={() => onChangeConfig({ ...config, aiAgentEnabled: !config.aiAgentEnabled })}
            >
              <div className="switchy-thumb" />
            </div>
          </div>

          {/* Selector de Proveedor API */}
          <div className="studio-input-group">
            <span className="studio-input-label">
              <span>Proveedor / Plataforma API de WhatsApp</span>
            </span>
            <div className="tiktok-tabs-row" style={{ marginTop: 2 }}>
              <button
                type="button"
                className={`tiktok-tab-btn ${config.apiProvider === "webhook" ? "active" : ""}`}
                onClick={() => onChangeConfig({ ...config, apiProvider: "webhook" })}
              >
                Webhook / n8n / Make
              </button>
              <button
                type="button"
                className={`tiktok-tab-btn ${config.apiProvider === "evolution_api" ? "active" : ""}`}
                onClick={() => onChangeConfig({ ...config, apiProvider: "evolution_api" })}
              >
                Evolution API
              </button>
              <button
                type="button"
                className={`tiktok-tab-btn ${config.apiProvider === "cloud_api" ? "active" : ""}`}
                onClick={() => onChangeConfig({ ...config, apiProvider: "cloud_api" })}
              >
                Meta Cloud API
              </button>
            </div>
          </div>

          <div className="studio-input-group">
            <label htmlFor={webhookUrlInputId} className="studio-input-label">
              <span>URL del Webhook de WhatsApp</span>
              <span className="muted-hint">Recibe los mensajes del chat</span>
            </label>
            <input
              id={webhookUrlInputId}
              type="text"
              className="studio-input"
              value={config.webhookUrl}
              onChange={(e) => onChangeConfig({ ...config, webhookUrl: e.target.value })}
              placeholder="https://tu-servidor.com/webhook/whatsapp o endpoint n8n"
            />
          </div>

          <div className="studio-input-group">
            <label htmlFor={apiKeyInputId} className="studio-input-label">
              <span>Token de Autenticación / API Key (Opcional)</span>
            </label>
            <input
              id={apiKeyInputId}
              type="password"
              className="studio-input"
              value={config.apiKey}
              onChange={(e) => onChangeConfig({ ...config, apiKey: e.target.value })}
              placeholder="Bearer token o WhatsApp Access Token"
            />
          </div>

          <div className="studio-input-group" style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
            <label htmlFor={aiPromptTextareaId} className="studio-input-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
              <span style={{ fontWeight: 700, color: "#E2E8F0" }}>Instrucciones del Agente IA (System Prompt de Ventas)</span>
              <span style={{ color: "#25D366", fontSize: "0.72rem", fontWeight: 700, background: "rgba(37,211,102,0.15)", padding: "2px 8px", borderRadius: 6, border: "1px solid rgba(37,211,102,0.3)" }}>Personalizable</span>
            </label>
            <textarea
              id={aiPromptTextareaId}
              className="studio-textarea"
              rows={5}
              value={config.aiSystemPrompt}
              onChange={(e) => onChangeConfig({ ...config, aiSystemPrompt: e.target.value })}
              placeholder="Define la personalidad, productos que vendes, precios y cómo cerrar la compra..."
              style={{ fontSize: "0.84rem", minHeight: 110, width: "100%", display: "block" }}
            />
          </div>

          {/* SIMULADOR INTERACTIVO DE AGENTE IA */}
          <div
            style={{
              padding: "10px 12px",
              background: "rgba(18, 18, 28, 0.95)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: 12,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.74rem", fontWeight: 800, color: "#25D366", display: "flex", alignItems: "center", gap: 5 }}>
                <Dashicon name="format-chat" size={13} />
                <span>Simulador de Prueba del Agente IA</span>
              </span>
              <button
                type="button"
                className="pill-ctrl-button active-pink"
                style={{
                  padding: "2px 8px",
                  fontSize: "0.7rem",
                  background: "#25D366",
                  borderColor: "#25D366",
                  color: "#000",
                  fontWeight: 800,
                }}
                onClick={handleSimulateAiResponse}
                disabled={isSimulating}
              >
                {isSimulating ? "Pensando..." : "Probar Respuesta"}
              </button>
            </div>

            <input
              type="text"
              className="studio-input"
              value={simQuery}
              onChange={(e) => setSimQuery(e.target.value)}
              placeholder="Escribe como un cliente..."
              style={{ fontSize: "0.76rem", padding: "5px 8px" }}
            />

            {simResponse && (
              <div
                style={{
                  padding: "8px 10px",
                  background: "rgba(37, 211, 102, 0.14)",
                  borderLeft: "3px solid #25D366",
                  borderRadius: 6,
                  fontSize: "0.76rem",
                  color: "#E2E8F0",
                  lineHeight: 1.35,
                }}
              >
                <div style={{ fontSize: "0.64rem", color: "#25D366", fontWeight: 800, marginBottom: 2 }}>
                  🤖 RESPUESTA EN VIVO DEL AGENTE IA DE WHATSAPP:
                </div>
                {simResponse}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { StreamAlertEvent } from "@/lib/alerts-bus";
import { OFFICIAL_PROMPT_PRESETS } from "@/lib/models";
import { generateCleanObsLuaScript, ObsWebSocketV5Client } from "@/lib/obs-client";
import { moderatePromptForDecart } from "@/lib/studio-data";

type ObsAlertsPanelProps = {
  obsSubscribeUrl: string;
  isConnectedLive: boolean;
  onOpenPopout: () => void;
  onApplyAlertEffect: (prompt: string, durationSec: number, label: string) => Promise<void>;
};

export function ObsAlertsPanel({
  obsSubscribeUrl,
  isConnectedLive,
  onOpenPopout,
  onApplyAlertEffect,
}: ObsAlertsPanelProps) {
  // OBS WebSocket v5
  const obsClientRef = useRef<ObsWebSocketV5Client | null>(null);
  const [obsWsUrl, setObsWsUrl] = useState("ws://127.0.0.1:4455");
  const [obsPassword, setObsPassword] = useState("");
  const [obsSceneName, setObsSceneName] = useState("viralive.app - En Vivo");
  const [obsBusy, setObsBusy] = useState(false);
  const [obsInfo, setObsInfo] = useState<string | null>(null);
  const [obsError, setObsError] = useState<string | null>(null);
  const [obsScenes, setObsScenes] = useState<string[]>([]);

  // Alertas + Twitch IRC (publico sin OAuth)
  const [alertViewer, setAlertViewer] = useState("SuscriptorPrueba");
  const [alertPresetId, setAlertPresetId] = useState("cyberpunk");
  const [alertDuration, setAlertDuration] = useState(10);
  const [alertAmountCop, setAlertAmountCop] = useState(10000);
  const [twitchChannel, setTwitchChannel] = useState("");
  const [twitchConnected, setTwitchConnected] = useState(false);
  const [twitchCooldownSec, setTwitchCooldownSec] = useState(15);
  const [recentAlerts, setRecentAlerts] = useState<StreamAlertEvent[]>([]);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [alertErr, setAlertErr] = useState<string | null>(null);

  const twitchWsRef = useRef<WebSocket | null>(null);
  const lastTriggerAtRef = useRef<number>(0);

  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  const overlayUrl = `${origin}/obs-overlay`;
  const webhookEndpoint = `${origin}/api/alerts/trigger`;

  useEffect(() => {
    const es = new EventSource("/api/alerts/stream");
    es.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data) as {
          type?: string;
          events?: StreamAlertEvent[];
          event?: StreamAlertEvent;
        };
        if (data.type === "init" && Array.isArray(data.events)) {
          setRecentAlerts(data.events);
        } else if (data.type === "alert" && data.event) {
          setRecentAlerts((prev) => [data.event!, ...prev].slice(0, 12));
          if (isConnectedLive) {
            void onApplyAlertEffect(
              data.event.prompt,
              data.event.durationSec,
              data.event.label,
            );
          }
        }
      } catch {
        // Ignore ping
      }
    };

    return () => {
      es.close();
    };
  }, [isConnectedLive, onApplyAlertEffect]);

  useEffect(() => {
    return () => {
      obsClientRef.current?.disconnect();
      twitchWsRef.current?.close();
    };
  }, []);

  const handleConnectObs = useCallback(async () => {
    setObsBusy(true);
    setObsError(null);
    setObsInfo(null);
    try {
      const client = new ObsWebSocketV5Client();
      const res = await client.connect(obsWsUrl.trim(), obsPassword);
      obsClientRef.current = client;
      setObsScenes(res.scenes);
      setObsInfo(
        `Conectado a OBS ${res.obsVersion}. Escenas encontradas (${res.scenes.length}): ${res.scenes.join(", ") || "ninguna"}.`,
      );
    } catch (err) {
      setObsError(err instanceof Error ? err.message : "No se pudo conectar a OBS Studio.");
    } finally {
      setObsBusy(false);
    }
  }, [obsPassword, obsWsUrl]);

  const handleCreateObsScene = useCallback(async () => {
    setObsBusy(true);
    setObsError(null);
    setObsInfo(null);
    try {
      if (!obsClientRef.current) {
        const client = new ObsWebSocketV5Client();
        await client.connect(obsWsUrl.trim(), obsPassword);
        obsClientRef.current = client;
      }
      const res = await obsClientRef.current.setupStreamScene({
        sceneName: obsSceneName.trim() || "viralive.app - En Vivo",
        stageUrl: obsSubscribeUrl || `${origin}/obs-stage?mode=opener`,
        overlayUrl,
      });
      setObsInfo(
        `${res.createdScene ? "Escena creada" : "Escena actualizada"} en OBS. Fuentes listas: ${res.sourcesAdded.join(" + ")}.`,
      );
    } catch (err) {
      setObsError(err instanceof Error ? err.message : "Error creando escena en OBS.");
    } finally {
      setObsBusy(false);
    }
  }, [obsPassword, obsSceneName, obsSubscribeUrl, obsWsUrl, origin, overlayUrl]);

  const handleDownloadLua = useCallback(() => {
    const content = generateCleanObsLuaScript(origin);
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "viralive_app_obs.lua";
    a.click();
    URL.revokeObjectURL(url);
  }, [origin]);

  const dispatchAlert = useCallback(
    async (params: {
      viewerName: string;
      label: string;
      prompt: string;
      durationSec: number;
      amountCop: number | null;
      source: "manual" | "webhook" | "twitch_irc";
    }) => {
      setAlertErr(null);
      setAlertMsg(null);
      const mod = moderatePromptForDecart(params.prompt);
      if (!mod.ok) {
        setAlertErr(mod.reason || "Prompt bloqueado por moderacion.");
        return;
      }
      const res = await fetch("/api/alerts/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      const data = (await res.json()) as { ok?: boolean; event?: StreamAlertEvent; error?: string };
      if (!res.ok || !data.event) {
        setAlertErr(data.error || "No se pudo disparar la alerta.");
        return;
      }
      if (typeof BroadcastChannel !== "undefined") {
        const ch = new BroadcastChannel("spike-v0-alerts");
        ch.postMessage(data.event);
        ch.close();
      }
      setAlertMsg(
        `Alerta enviada al overlay (/obs-overlay)${isConnectedLive ? " y aplicada en vivo" : " (inicia En Vivo para aplicar el filtro al video)"}.`,
      );
    },
    [isConnectedLive],
  );

  const toggleTwitchChat = useCallback(() => {
    setAlertErr(null);
    if (twitchConnected && twitchWsRef.current) {
      twitchWsRef.current.close();
      twitchWsRef.current = null;
      setTwitchConnected(false);
      setAlertMsg("Bot lector de chat Twitch desconectado.");
      return;
    }

    const cleanChannel = twitchChannel.trim().replace(/^#/, "").toLowerCase();
    if (!cleanChannel) {
      setAlertErr("Escribe el nombre del canal publico de Twitch (ej. ibai, rubius o tu canal).");
      return;
    }

    const ws = new WebSocket("wss://irc-ws.chat.twitch.tv:443");
    twitchWsRef.current = ws;

    ws.onopen = () => {
      const anonId = Math.floor(10000 + Math.random() * 89999);
      ws.send(`NICK justinfan${anonId}`);
      ws.send(`JOIN #${cleanChannel}`);
      setTwitchConnected(true);
      setAlertMsg(
        `Escuchando chat publico de #${cleanChannel}. Comandos validos: "!ia cyberpunk", "!ia robot", "!ia tokio", "!ia agua", etc.`,
      );
    };

    ws.onmessage = (ev) => {
      const lines = String(ev.data).split("\r\n");
      for (const line of lines) {
        if (line.startsWith("PING")) {
          ws.send("PONG :tmi.twitch.tv");
          continue;
        }
        const match = line.match(/^:([^!]+)![^ ]+ PRIVMSG #[^ ]+ :(.+)$/);
        if (!match) continue;
        const viewer = match[1];
        const text = match[2].trim();
        if (!text.toLowerCase().startsWith("!ia ")) continue;

        const now = Date.now();
        if (now - lastTriggerAtRef.current < twitchCooldownSec * 1000) continue;

        const query = text.slice(4).trim().toLowerCase();
        const found = OFFICIAL_PROMPT_PRESETS.find(
          (p) =>
            !p.requiresReferenceImage &&
            (p.label.toLowerCase().includes(query) || p.id.toLowerCase().includes(query)),
        );
        if (!found) continue;

        lastTriggerAtRef.current = now;
        void dispatchAlert({
          viewerName: viewer,
          label: found.label,
          prompt: found.prompt,
          durationSec: 10,
          amountCop: null,
          source: "twitch_irc",
        });
      }
    };

    ws.onerror = () => {
      setAlertErr("No fue posible conectar al chat IRC de Twitch.");
      setTwitchConnected(false);
    };

    ws.onclose = () => {
      setTwitchConnected(false);
    };
  }, [dispatchAlert, twitchChannel, twitchConnected, twitchCooldownSec]);

  const selectedPreset =
    OFFICIAL_PROMPT_PRESETS.find((p) => p.id === alertPresetId) ?? OFFICIAL_PROMPT_PRESETS[0];

  return (
    <div className="cockpit-grid">
      {/* COLUMNA IZQUIERDA: AUTOMATIZACION REAL OBS (WEBSOCKET V5 + LUA) */}
      <section className="studio-card" aria-label="Automatizacion OBS Studio">
        <h2>Automatizacion OBS Studio (Fase V2 · WebSocket v5 + Script Lua)</h2>
        <p className="muted-copy">
          Conecta directo desde aqui con tu OBS abierto en Windows (OBS 28+ incluye WebSocket v5 en
          Herramientas -&gt; Configuracion del servidor WebSocket) para crear la escena y el
          overlay sin copiar codigo propietario.
        </p>

        <div className="field-row">
          <label htmlFor="obs-ws-url">Direccion WebSocket de OBS</label>
          <input
            id="obs-ws-url"
            type="text"
            className="input-control"
            value={obsWsUrl}
            onChange={(e) => setObsWsUrl(e.target.value)}
          />
        </div>

        <div className="metrics-grid" style={{ marginTop: 0, marginBottom: 10 }}>
          <div className="field-row" style={{ marginBottom: 0 }}>
            <label htmlFor="obs-ws-pass">Contrasena WebSocket (si activaste)</label>
            <input
              id="obs-ws-pass"
              type="password"
              className="input-control"
              placeholder="Opcional"
              value={obsPassword}
              onChange={(e) => setObsPassword(e.target.value)}
            />
          </div>
          <div className="field-row" style={{ marginBottom: 0 }}>
            <label htmlFor="obs-scene">Nombre escena en OBS</label>
            <input
              id="obs-scene"
              type="text"
              className="input-control"
              value={obsSceneName}
              onChange={(e) => setObsSceneName(e.target.value)}
            />
          </div>
        </div>

        <div className="btn-row" style={{ marginBottom: 12 }}>
          <button type="button" className="btn" onClick={handleConnectObs} disabled={obsBusy}>
            Conectar y verificar OBS
          </button>
          <button
            type="button"
            className="btn btn-accent"
            onClick={handleCreateObsScene}
            disabled={obsBusy}
          >
            Crear escena y fuentes en OBS (1 clic)
          </button>
          <button type="button" className="btn" onClick={handleDownloadLua}>
            Descargar script Lua limpio
          </button>
        </div>

        {obsScenes.length > 0 && (
          <p className="muted-copy" style={{ fontSize: "0.8rem" }}>
            Escenas detectadas: {obsScenes.join(", ")}
          </p>
        )}
        {obsError && <p className="alert alert-error">{obsError}</p>}
        {obsInfo && <p className="alert alert-ok">{obsInfo}</p>}

        <div className="studio-subcard" style={{ marginTop: 12 }}>
          <h3>Salidas directas para OBS</h3>
          <div className="btn-row" style={{ marginBottom: 8 }}>
            <button type="button" className="btn" onClick={onOpenPopout}>
              Abrir ventana Pop-out limpia (Captura de Ventana)
            </button>
            <a href="/obs-overlay?preview=1" target="_blank" rel="noreferrer" className="btn">
              Previsualizar Overlay Alertas
            </a>
          </div>
          <div className="field-row" style={{ marginBottom: 0 }}>
            <label htmlFor="obs-overlay-url">URL Overlay transparente para Browser Source (1280x720)</label>
            <input id="obs-overlay-url" type="text" readOnly className="input-control" value={overlayUrl} />
          </div>
        </div>

        <div className="studio-subcard" style={{ marginTop: 12 }}>
          <h3>Camara Virtual Windows 11 y App Electron (Estado tecnico)</h3>
          <p className="muted-copy" style={{ marginBottom: 0, fontSize: "0.82rem" }}>
            En este equipo ya tienes OBS instalado, pero crear un controlador nativo de Camara
            Virtual Windows 11 (`MFCreateVirtualCamera`) requiere compilacion C++ (MSVC/Windows
            SDK) y certificado digital EV firmado para que Chrome/Zoom/Teams lo acepten. Mientras no
            se compile y firme ese instalador nativo, usa OBS Browser Source o Pop-out WGC arriba y
            activa la propia Camara Virtual integrada dentro de OBS.
          </p>
        </div>
      </section>

      {/* COLUMNA DERECHA: ALERTAS DE CHAT EN VIVO + WEBHOOKS */}
      <section className="studio-card" aria-label="Alertas en vivo y chat">
        <h2>Alertas Interactivas, Webhook y Chat Twitch (V1.5 / V2)</h2>
        <p className="muted-copy">
          Permite que espectadores o donaciones activen efectos temporales en vivo con moderacion
          previa y cuenta regresiva visible en el overlay de OBS.
        </p>

        <div className="studio-subcard" style={{ marginBottom: 12 }}>
          <h3>1. Bot de Chat Publico Twitch (Sin clave OAuth)</h3>
          <div className="btn-row">
            <input
              aria-label="Canal de Twitch"
              type="text"
              className="input-control"
              style={{ flex: 1 }}
              placeholder="Nombre del canal de Twitch"
              value={twitchChannel}
              onChange={(e) => setTwitchChannel(e.target.value)}
            />
            <button
              type="button"
              className={`btn ${twitchConnected ? "btn-danger" : "btn-accent"}`}
              onClick={toggleTwitchChat}
            >
              {twitchConnected ? "Desconectar Twitch" : "Conectar Chat Twitch"}
            </button>
          </div>
          <div className="field-row" style={{ marginTop: 8, marginBottom: 0 }}>
            <label htmlFor="twitch-cd">Espera minima anti-spam entre comandos (segundos)</label>
            <input
              id="twitch-cd"
              type="number"
              min={5}
              max={120}
              className="input-control"
              value={twitchCooldownSec}
              onChange={(e) => setTwitchCooldownSec(Math.max(5, Number(e.target.value) || 15))}
            />
          </div>
        </div>

        <div className="studio-subcard" style={{ marginBottom: 12 }}>
          <h3>2. Simular Alerta o Conectar Webhook (Kick / StreamElements / Donaciones)</h3>
          <div className="metrics-grid" style={{ marginTop: 0, marginBottom: 8 }}>
            <div className="field-row" style={{ marginBottom: 0 }}>
              <label htmlFor="alt-viewer">Nombre espectador</label>
              <input
                id="alt-viewer"
                type="text"
                className="input-control"
                value={alertViewer}
                onChange={(e) => setAlertViewer(e.target.value)}
              />
            </div>
            <div className="field-row" style={{ marginBottom: 0 }}>
              <label htmlFor="alt-preset">Efecto a activar</label>
              <select
                id="alt-preset"
                className="select-control"
                value={alertPresetId}
                onChange={(e) => setAlertPresetId(e.target.value)}
              >
                {OFFICIAL_PROMPT_PRESETS.filter((p) => !p.requiresReferenceImage).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="metrics-grid" style={{ marginTop: 0, marginBottom: 8 }}>
            <div className="field-row" style={{ marginBottom: 0 }}>
              <label htmlFor="alt-dur">Duracion temporal (seg)</label>
              <input
                id="alt-dur"
                type="number"
                min={5}
                max={30}
                className="input-control"
                value={alertDuration}
                onChange={(e) => setAlertDuration(Number(e.target.value) || 10)}
              />
            </div>
            <div className="field-row" style={{ marginBottom: 0 }}>
              <label htmlFor="alt-cop">Donacion simbolica (COP)</label>
              <input
                id="alt-cop"
                type="number"
                min={0}
                step={1000}
                className="input-control"
                value={alertAmountCop}
                onChange={(e) => setAlertAmountCop(Number(e.target.value) || 0)}
              />
            </div>
          </div>

          <button
            type="button"
            className="btn btn-accent"
            onClick={() =>
              void dispatchAlert({
                viewerName: alertViewer,
                label: selectedPreset.label,
                prompt: selectedPreset.prompt,
                durationSec: alertDuration,
                amountCop: alertAmountCop > 0 ? alertAmountCop : null,
                source: "manual",
              })
            }
          >
            Disparar alerta de prueba ahora
          </button>

          <p className="muted-copy" style={{ marginTop: 8, marginBottom: 0, fontSize: "0.78rem" }}>
            Endpoint Webhook POST: <code>{webhookEndpoint}</code> (opcionalmente protegido con{" "}
            <code>ALERT_WEBHOOK_SECRET</code> en <code>.env.local</code>).
          </p>
        </div>

        {alertErr && <p className="alert alert-error">{alertErr}</p>}
        {alertMsg && <p className="alert alert-ok">{alertMsg}</p>}

        <h3>Ultimas alertas recibidas ({recentAlerts.length})</h3>
        {recentAlerts.length === 0 ? (
          <p className="muted-copy" style={{ margin: 0 }}>
            Sin alertas recientes todavia.
          </p>
        ) : (
          <div style={{ display: "grid", gap: 6 }}>
            {recentAlerts.slice(0, 5).map((al) => (
              <div key={al.id} className="studio-subcard" style={{ padding: "8px 10px" }}>
                <strong>{al.viewerName}</strong> activo <strong>{al.label}</strong> ({al.durationSec}
                s · {al.source})
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

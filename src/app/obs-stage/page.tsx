"use client";

import { createDecartClient, type RealTimeSubscribeClient } from "@decartai/sdk";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

declare global {
  interface Window {
    __spikeOutputStream?: MediaStream | null;
  }
}

function ObsStageInner() {
  const params = useSearchParams();
  const mode = params.get("mode") ?? (params.get("sub") ? "subscribe" : "opener");
  const subToken = params.get("sub") ?? "";

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const subClientRef = useRef<RealTimeSubscribeClient | null>(null);
  const [statusText, setStatusText] = useState("Esperando senal de video...");
  const [hasFrames, setHasFrames] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const attachStream = useCallback((stream: MediaStream | null) => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    if (!stream) {
      videoEl.srcObject = null;
      setHasFrames(false);
      setStatusText("Sin flujo activo en este momento.");
      return;
    }
    videoEl.srcObject = stream;
    videoEl.play().catch(() => {});
  }, []);

  // Modo 1: Ventana limpia abierta desde el panel principal (sin gastar otro cupo Decart)
  useEffect(() => {
    if (mode !== "opener") return;

    const pullFromOpener = () => {
      try {
        const openerStream = window.opener?.__spikeOutputStream ?? null;
        if (openerStream && openerStream.active) {
          attachStream(openerStream);
          setErrorText(null);
        } else if (!window.opener) {
          setErrorText(
            "Esta vista se abrio sin referencia a la ventana principal. Abrela usando el boton en http://localhost:3000.",
          );
        }
      } catch {
        setErrorText("No fue posible leer el flujo de la ventana principal.");
      }
    };

    pullFromOpener();
    const timer = window.setInterval(pullFromOpener, 1000);
    const channel =
      typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("spike-v0-obs") : null;
    if (channel) {
      channel.onmessage = () => pullFromOpener();
    }

    return () => {
      window.clearInterval(timer);
      channel?.close();
    };
  }, [attachStream, mode]);

  // Modo 2: Suscriptor WebRTC dentro de OBS Browser Source o Custom Dock
  const connectSubscriber = useCallback(async () => {
    if (!subToken) {
      setErrorText("Falta el parametro ?sub= en la URL para conectar OBS Browser Source.");
      return;
    }
    setErrorText(null);
    setStatusText("Conectando a sala Decart de solo lectura...");

    try {
      if (subClientRef.current) {
        subClientRef.current.disconnect();
        subClientRef.current = null;
      }

      const client = createDecartClient({
        apiKeyProvider: async () => {
          const res = await fetch("/api/realtime-token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ purpose: "subscribe", maxSessionDuration: 180 }),
          });
          const data = (await res.json()) as { apiKey?: string; error?: string };
          if (!res.ok || !data.apiKey) {
            throw new Error(data.error || "No se pudo obtener token de suscripcion.");
          }
          return data.apiKey;
        },
      });

      const subscriber = await client.realtime.subscribe({
        token: subToken,
        onRemoteStream: (stream) => {
          attachStream(stream);
        },
        onConnectionChange: (state) => {
          if (state === "connected" || state === "generating") {
            setStatusText("Conectado. Esperando primer cuadro...");
          } else if (state === "disconnected") {
            setHasFrames(false);
            setStatusText("Transmision desconectada.");
          } else {
            setStatusText(`Estado de conexion: ${state}`);
          }
        },
      });

      subscriber.on("error", (err) => {
        setErrorText(err.message || "Error recibiendo stream WebRTC en OBS.");
      });

      subClientRef.current = subscriber;
    } catch (err) {
      setErrorText(
        err instanceof Error ? err.message : "No fue posible suscribirse al stream en OBS.",
      );
    }
  }, [attachStream, subToken]);

  useEffect(() => {
    if (mode !== "subscribe") return;
    void connectSubscriber();
    return () => {
      subClientRef.current?.disconnect();
      subClientRef.current = null;
    };
  }, [connectSubscriber, mode]);

  return (
    <main className="obs-stage-root">
      <video
        ref={videoRef}
        className="obs-stage-video"
        autoPlay
        playsInline
        muted={false}
        onLoadedData={() => setHasFrames(true)}
        onPlaying={() => setHasFrames(true)}
      />

      {!hasFrames && (
        <div className="obs-stage-status">
          <div className="studio-card" style={{ maxWidth: 520 }}>
            <h2>Escenario limpio para OBS ({mode === "subscribe" ? "Browser Source" : "Pop-out"})</h2>
            <p className="muted-copy">{statusText}</p>
            {errorText && <p className="alert alert-error">{errorText}</p>}
            {mode === "subscribe" && (
              <div className="btn-row" style={{ justifyContent: "center", marginTop: 12 }}>
                <button type="button" className="btn btn-accent" onClick={connectSubscriber}>
                  Reintentar conexion OBS
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

export default function ObsStagePage() {
  return (
    <Suspense
      fallback={
        <main className="obs-stage-root">
          <p className="panel-desc">Cargando escenario limpio para OBS...</p>
        </main>
      }
    >
      <ObsStageInner />
    </Suspense>
  );
}

"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { StreamAlertEvent } from "@/lib/alerts-bus";

function ObsOverlayInner() {
  const params = useSearchParams();
  const isPreview = params.get("preview") === "1";

  const [activeAlert, setActiveAlert] = useState<StreamAlertEvent | null>(
    isPreview
      ? {
          id: "preview",
          source: "manual",
          viewerName: "CamiloStream",
          label: "Cyberpunk Neon",
          prompt: "Restyle to Cyberpunk.",
          durationSec: 12,
          amountCop: 10000,
          createdAt: new Date().toISOString(),
        }
      : null,
  );
  const [remainingSec, setRemainingSec] = useState<number>(isPreview ? 12 : 0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isPreview) return;
    const prevHtmlBg = document.documentElement.style.background;
    const prevBodyBg = document.body.style.background;
    document.documentElement.style.background = "transparent";
    document.body.style.background = "transparent";
    return () => {
      document.documentElement.style.background = prevHtmlBg;
      document.body.style.background = prevBodyBg;
    };
  }, [isPreview]);

  useEffect(() => {
    const showAlert = (event: StreamAlertEvent) => {
      setActiveAlert(event);
      setRemainingSec(event.durationSec);
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
      }
      timerRef.current = window.setInterval(() => {
        setRemainingSec((prev) => {
          if (prev <= 1) {
            if (timerRef.current !== null) {
              window.clearInterval(timerRef.current);
              timerRef.current = null;
            }
            setActiveAlert(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    };

    const es = new EventSource("/api/alerts/stream");
    es.onmessage = (msg) => {
      try {
        const parsed = JSON.parse(msg.data) as {
          type?: string;
          event?: StreamAlertEvent;
        };
        if (parsed.type === "alert" && parsed.event) {
          showAlert(parsed.event);
        }
      } catch {
        // Ignore heartbeat or malformed chunks
      }
    };

    const ch =
      typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("spike-v0-alerts") : null;
    if (ch) {
      ch.onmessage = (e) => {
        if (e.data && typeof e.data === "object" && "prompt" in e.data) {
          showAlert(e.data as StreamAlertEvent);
        }
      };
    }

    return () => {
      es.close();
      ch?.close();
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
      }
    };
  }, []);

  return (
    <main className="obs-overlay-root">
      {activeAlert ? (
        <div className="obs-alert-banner" role="status" aria-live="polite">
          <div className="obs-alert-head">
            <span className="obs-alert-badge">EFECTO ACTIVO · {remainingSec}s</span>
            {activeAlert.amountCop !== null && (
              <span className="obs-alert-amount">
                ${activeAlert.amountCop.toLocaleString("es-CO")} COP
              </span>
            )}
          </div>
          <div className="obs-alert-title">
            {activeAlert.viewerName} activo: <strong>{activeAlert.label}</strong>
          </div>
          <div className="obs-alert-sub">viralive.app · {activeAlert.source}</div>
        </div>
      ) : null}
    </main>
  );
}

export default function ObsOverlayPage() {
  return (
    <Suspense fallback={<main className="obs-overlay-root" />}>
      <ObsOverlayInner />
    </Suspense>
  );
}

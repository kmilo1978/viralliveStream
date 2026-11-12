"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  calculateColombiaEconomics,
  type UsageLedgerEntry,
} from "@/lib/studio-data";
import {
  LiveVoiceFxEngine,
  LOCAL_VOICE_PRESETS,
  type LocalVoiceFxPreset,
} from "@/lib/voice-fx";

type VoiceFinancePanelProps = {
  accountCredits: number | null;
  usageLedger: UsageLedgerEntry[];
  onClearLedger: () => void;
  onProcessedAudioStream: (stream: MediaStream | null) => void;
};

export function VoiceFinancePanel({
  accountCredits,
  usageLedger,
  onClearLedger,
  onProcessedAudioStream,
}: VoiceFinancePanelProps) {
  // Audio local Web Audio
  const voiceEngineRef = useRef<LiveVoiceFxEngine | null>(null);
  const [fxActive, setFxActive] = useState(false);
  const [fxPreset, setFxPreset] = useState<LocalVoiceFxPreset>("radio");
  const [monitorAudio, setMonitorAudio] = useState(false);
  const [routeToLive, setRouteToLive] = useState(true);
  const [voiceMsg, setVoiceMsg] = useState<string | null>(null);
  const [voiceErr, setVoiceErr] = useState<string | null>(null);

  // ElevenLabs Speech-to-Speech status & test
  const [s2sConfigured, setS2sConfigured] = useState<boolean | null>(null);
  const [voiceId, setVoiceId] = useState("21m00Tcm4TlvDq8ikWAM");
  const [audioClipFile, setAudioClipFile] = useState<File | null>(null);
  const [s2sLoading, setS2sLoading] = useState(false);
  const [s2sResultUrl, setS2sResultUrl] = useState<string | null>(null);

  // Calculadora economica COP
  const [trmCop, setTrmCop] = useState(4150);
  const [spreadPct, setSpreadPct] = useState(3);
  const [packCop, setPackCop] = useState(100_000);
  const [apiBudgetShare, setApiBudgetShare] = useState(50);

  useEffect(() => {
    void fetch("/api/voice/status")
      .then((r) => r.json())
      .then((d: { elevenLabsConfigured?: boolean; defaultVoiceId?: string }) => {
        setS2sConfigured(Boolean(d.elevenLabsConfigured));
        if (d.defaultVoiceId) setVoiceId(d.defaultVoiceId);
      })
      .catch(() => setS2sConfigured(false));

    return () => {
      voiceEngineRef.current?.stop();
      if (s2sResultUrl) URL.revokeObjectURL(s2sResultUrl);
    };
  }, [s2sResultUrl]);

  const toggleVoiceFx = useCallback(async () => {
    setVoiceErr(null);
    setVoiceMsg(null);
    if (fxActive && voiceEngineRef.current) {
      voiceEngineRef.current.stop();
      voiceEngineRef.current = null;
      setFxActive(false);
      onProcessedAudioStream(null);
      setVoiceMsg("Procesador de voz local detenido.");
      return;
    }

    try {
      const engine = new LiveVoiceFxEngine();
      const outStream = await engine.start(fxPreset, monitorAudio);
      voiceEngineRef.current = engine;
      setFxActive(true);
      if (routeToLive) {
        onProcessedAudioStream(outStream);
      }
      setVoiceMsg("Procesador de voz local activo en tiempo real.");
    } catch (err) {
      setVoiceErr(
        err instanceof Error
          ? `No se pudo abrir el microfono: ${err.message}`
          : "Error iniciando microfono.",
      );
    }
  }, [fxActive, fxPreset, monitorAudio, onProcessedAudioStream, routeToLive]);

  const handlePresetChange = useCallback((next: LocalVoiceFxPreset) => {
    setFxPreset(next);
    voiceEngineRef.current?.applyPreset(next);
  }, []);

  const handleTransformSpeechToSpeech = useCallback(async () => {
    setVoiceErr(null);
    if (!audioClipFile) {
      setVoiceErr("Adjunta primero un archivo de audio corto (WAV o MP3).");
      return;
    }
    setS2sLoading(true);
    try {
      const form = new FormData();
      form.append("audio", audioClipFile);
      form.append("voiceId", voiceId.trim());
      const res = await fetch("/api/voice/transform", { method: "POST", body: form });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error || "Error ejecutando Speech-to-Speech.");
      }
      const outBlob = await res.blob();
      if (s2sResultUrl) URL.revokeObjectURL(s2sResultUrl);
      setS2sResultUrl(URL.createObjectURL(outBlob));
      setVoiceMsg("Clip transformado con ElevenLabs Speech-to-Speech.");
    } catch (err) {
      setVoiceErr(err instanceof Error ? err.message : "Error de audio IA externo.");
    } finally {
      setS2sLoading(false);
    }
  }, [audioClipFile, s2sResultUrl, voiceId]);

  const economics = useMemo(
    () =>
      calculateColombiaEconomics({
        priceCop: packCop,
        trmCopPerUsd: trmCop,
        exchangeSpreadPct: spreadPct,
        apiSharePctOfNet: apiBudgetShare,
      }),
    [apiBudgetShare, packCop, spreadPct, trmCop],
  );

  const ledgerTotals = useMemo(() => {
    return usageLedger.reduce(
      (acc, item) => ({
        credits: acc.credits + item.decartCredits,
        usd: acc.usd + item.usdCost,
        cop: acc.cop + item.copCost,
      }),
      { credits: 0, usd: 0, cop: 0 },
    );
  }, [usageLedger]);

  return (
    <div className="cockpit-grid">
      {/* COLUMNA IZQUIERDA: VOZ EN VIVO + ELEVENLABS S2S */}
      <section className="studio-card" aria-label="Modulo de Voz IA y Efectos">
        <h2>Modulo de Cambio de Voz (Fase V3)</h2>
        <p className="muted-copy">
          Decart no incluye modelo propio de cambio de voz. Aqui tienes dos niveles claros: efectos
          locales inmediatos en tu navegador (gratis) y conector oficial externo Speech-to-Speech
          cuando configures tu llave.
        </p>

        <div className="studio-subcard" style={{ marginBottom: 12 }}>
          <h3>1. Efectos de Audio Local en Tiempo Real (Gratis · Web Audio)</h3>
          <div className="field-row">
            <label htmlFor="voice-fx-preset">Perfil de voz local</label>
            <select
              id="voice-fx-preset"
              className="select-control"
              value={fxPreset}
              onChange={(e) => handlePresetChange(e.target.value as LocalVoiceFxPreset)}
            >
              {LOCAL_VOICE_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label} · {p.description}
                </option>
              ))}
            </select>
          </div>

          <label className="checkbox-line">
            <input
              type="checkbox"
              checked={monitorAudio}
              onChange={(e) => {
                setMonitorAudio(e.target.checked);
                voiceEngineRef.current?.setMonitor(e.target.checked);
              }}
            />
            <span>Escuchar mi propia voz procesada (usar audifonos para evitar eco)</span>
          </label>

          <label className="checkbox-line">
            <input
              type="checkbox"
              checked={routeToLive}
              onChange={(e) => {
                setRouteToLive(e.target.checked);
                if (fxActive) {
                  onProcessedAudioStream(
                    e.target.checked ? voiceEngineRef.current?.getProcessedStream() ?? null : null,
                  );
                }
              }}
            />
            <span>Enviar esta pista de audio procesada hacia Decart En Vivo</span>
          </label>

          <button
            type="button"
            className={`btn ${fxActive ? "btn-danger" : "btn-accent"}`}
            onClick={toggleVoiceFx}
          >
            {fxActive ? "Apagar procesador de voz local" : "Encender procesador de voz local"}
          </button>
        </div>

        <div className="studio-subcard">
          <h3>2. Voz Neuronal Speech-to-Speech (ElevenLabs)</h3>
          {s2sConfigured === false ? (
            <p className="alert alert-error" style={{ marginBottom: 8 }}>
              Conector listo, pero falta configurar <code>ELEVENLABS_API_KEY</code> en{" "}
              <code>spike-v0/.env.local</code>. Sin esa clave externa no se inventan voces ni se
              gasta saldo ajeno.
            </p>
          ) : (
            <p className="alert alert-ok" style={{ marginBottom: 8 }}>
              Estado de conector:{" "}
              {s2sConfigured === null
                ? "Verificando servidor..."
                : "ELEVENLABS_API_KEY detectada en servidor."}
            </p>
          )}

          <div className="field-row">
            <label htmlFor="s2s-voice-id">Voice ID de ElevenLabs</label>
            <input
              id="s2s-voice-id"
              type="text"
              className="input-control"
              value={voiceId}
              onChange={(e) => setVoiceId(e.target.value)}
            />
          </div>

          <div className="field-row">
            <label htmlFor="s2s-file">Clip de voz a transformar (MP3 / WAV, max 15 MB)</label>
            <input
              id="s2s-file"
              type="file"
              accept="audio/*"
              className="input-control"
              onChange={(e) => setAudioClipFile(e.target.files?.[0] ?? null)}
            />
          </div>

          <button
            type="button"
            className="btn"
            onClick={handleTransformSpeechToSpeech}
            disabled={s2sLoading || !s2sConfigured || !audioClipFile}
          >
            {s2sLoading ? "Transformando audio..." : "Transformar clip con ElevenLabs"}
          </button>

          {s2sResultUrl && (
            <audio controls src={s2sResultUrl} style={{ width: "100%", marginTop: 10 }} />
          )}
        </div>

        {voiceErr && <p className="alert alert-error">{voiceErr}</p>}
        {voiceMsg && <p className="alert alert-ok">{voiceMsg}</p>}
      </section>

      {/* COLUMNA DERECHA: ECONOMIA COP COLOMBIA + REGISTRO DE CONSUMO + B2B */}
      <section className="studio-card" aria-label="Finanzas en Pesos Colombianos">
        <h2>Calculadora Comercial en COP y Control de Gasto (Colombia)</h2>
        <p className="muted-copy">
          Simula paquetes reales en pesos colombianos incluyendo comisiones aproximadas de pasarela
          (Wompi ~2.65% + $700 + IVA), retencion y margen tras pagar USD a Decart.
        </p>

        <div className="metrics-grid" style={{ marginTop: 0, marginBottom: 10 }}>
          <div className="field-row" style={{ marginBottom: 0 }}>
            <label htmlFor="fin-pack">Precio paquete cliente (COP)</label>
            <input
              id="fin-pack"
              type="number"
              min={20000}
              step={10000}
              className="input-control"
              value={packCop}
              onChange={(e) => setPackCop(Number(e.target.value) || 50000)}
            />
          </div>
          <div className="field-row" style={{ marginBottom: 0 }}>
            <label htmlFor="fin-trm">TRM USD actual (COP)</label>
            <input
              id="fin-trm"
              type="number"
              min={2500}
              step={50}
              className="input-control"
              value={trmCop}
              onChange={(e) => setTrmCop(Number(e.target.value) || 4150)}
            />
          </div>
        </div>

        <div className="metrics-grid" style={{ marginTop: 0, marginBottom: 10 }}>
          <div className="field-row" style={{ marginBottom: 0 }}>
            <label htmlFor="fin-spread">Spread bancario + 4x1000 (%)</label>
            <input
              id="fin-spread"
              type="number"
              min={0}
              max={15}
              step={0.5}
              className="input-control"
              value={spreadPct}
              onChange={(e) => setSpreadPct(Number(e.target.value) || 0)}
            />
          </div>
          <div className="field-row" style={{ marginBottom: 0 }}>
            <label htmlFor="fin-share">% del neto destinado a Decart</label>
            <input
              id="fin-share"
              type="number"
              min={15}
              max={85}
              className="input-control"
              value={apiBudgetShare}
              onChange={(e) => setApiBudgetShare(Math.min(85, Math.max(15, Number(e.target.value) || 50)))}
            />
          </div>
        </div>

        <div className="btn-row" style={{ marginBottom: 10 }}>
          {[50_000, 100_000, 250_000].map((v) => (
            <button
              key={v}
              type="button"
              className="btn"
              style={{ minHeight: 32, padding: "4px 8px", fontSize: "0.8rem" }}
              onClick={() => setPackCop(v)}
            >
              ${v.toLocaleString("es-CO")} COP
            </button>
          ))}
        </div>

        <div className="metrics-grid" style={{ marginBottom: 12 }}>
          <div className="metric-card">
            <span className="metric-label">Recibes neto tras pasarela</span>
            <div className="metric-value">
              ${economics.netReceivedCop.toLocaleString("es-CO")}
            </div>
          </div>
          <div className="metric-card">
            <span className="metric-label">Creditos Decart en pack</span>
            <div className="metric-value">
              {economics.decartCreditsIncluded.toLocaleString("es-CO")} cr
            </div>
          </div>
          <div className="metric-card">
            <span className="metric-label">Tiempo aprox. Eco / Pro</span>
            <div className="metric-value">
              {economics.minutesEco}m / {economics.minutesPro}m
            </div>
          </div>
          <div className="metric-card">
            <span className="metric-label">Ganancia neta ({economics.marginPercent}%)</span>
            <div className="metric-value">${economics.netProfitCop.toLocaleString("es-CO")}</div>
          </div>
        </div>

        <div className="studio-subcard" style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0 }}>Registro local de consumo ({usageLedger.length})</h3>
            {usageLedger.length > 0 && (
              <button type="button" className="btn" onClick={onClearLedger}>
                Limpiar historial
              </button>
            )}
          </div>
          <p className="muted-copy" style={{ marginTop: 6, marginBottom: 6 }}>
            Saldo Decart actual:{" "}
            <strong>{accountCredits !== null ? `${accountCredits} cr` : "sin consultar"}</strong> ·
            Total registrado aqui: <strong>{ledgerTotals.credits} cr</strong> (~$
            {ledgerTotals.usd.toFixed(2)} USD / $
            {Math.round(ledgerTotals.usd * trmCop).toLocaleString("es-CO")} COP).
          </p>
          {usageLedger.slice(0, 5).map((item) => (
            <div key={item.id} className="metric-label" style={{ marginTop: 4 }}>
              [{item.kind}] {item.modelId}: {item.detail} ({item.decartCredits} cr)
            </div>
          ))}
        </div>

        <div className="studio-subcard">
          <h3>Portal B2B / Revendedores (Restriccion legal V3)</h3>
          <p className="muted-copy" style={{ marginBottom: 0, fontSize: "0.8rem" }}>
            De acuerdo con los Terminos de Servicio de Decart (secciones 3.6c y 3.6f), no esta
            permitido revender ni sublicenciar su API a agencias terceras sin un contrato comercial
            escrito (*Order Form*). Puedes vender tu propia app por creditos COP a usuarios finales;
            la consola multi-revendedor se activara unicamente cuando firmes ese acuerdo y conectes
            PostgreSQL + Redis.
          </p>
        </div>
      </section>
    </div>
  );
}

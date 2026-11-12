"use client";

import { useCallback, useState } from "react";
import { DEFAULT_SAFE_PROMPT, OFFICIAL_PROMPT_PRESETS } from "@/lib/models";
import {
  dataUrlToFile,
  fileToCompactDataUrl,
  moderatePromptForDecart,
  type SavedSkinPreset,
  type UsageLedgerEntry,
} from "@/lib/studio-data";

type SkinsStudioPanelProps = {
  skins: SavedSkinPreset[];
  onSaveSkin: (skin: SavedSkinPreset) => void;
  onDeleteSkin: (skinId: string) => void;
  onApplySkinToLive: (opts: {
    prompt: string;
    modelId: SavedSkinPreset["modelId"];
    refFile: File | null;
  }) => void;
  sourceReady: boolean;
  captureSourceSnapshot: () => Promise<File | null>;
  onLogUsage: (entry: Omit<UsageLedgerEntry, "id" | "createdAt">) => void;
  onRefreshAccount: () => void;
};

export function SkinsStudioPanel({
  skins,
  onSaveSkin,
  onDeleteSkin,
  onApplySkinToLive,
  sourceReady,
  captureSourceSnapshot,
  onLogUsage,
  onRefreshAccount,
}: SkinsStudioPanelProps) {
  const [skinName, setSkinName] = useState("");
  const [skinCategory, setSkinCategory] = useState<SavedSkinPreset["category"]>("Personaje");
  const [skinModel, setSkinModel] = useState<SavedSkinPreset["modelId"]>("lucy-2.6");
  const [skinPrompt, setSkinPrompt] = useState<string>(OFFICIAL_PROMPT_PRESETS[4].prompt);
  const [skinImageDataUrl, setSkinImageDataUrl] = useState<string | undefined>(undefined);
  const [skinMsg, setSkinMsg] = useState<string | null>(null);
  const [skinErr, setSkinErr] = useState<string | null>(null);

  // Estudio de Imagen (lucy-image-2)
  const [studioInputFile, setStudioInputFile] = useState<File | null>(null);
  const [studioInputUrl, setStudioInputUrl] = useState<string | null>(null);
  const [imgRes, setImgRes] = useState<"480p" | "720p">("480p");
  const [imgPrompt, setImgPrompt] = useState(DEFAULT_SAFE_PROMPT);
  const [imgLoading, setImgLoading] = useState(false);
  const [imgError, setImgError] = useState<string | null>(null);
  const [imgResultBlob, setImgResultBlob] = useState<Blob | null>(null);
  const [imgPreviewUrl, setImgPreviewUrl] = useState<string | null>(null);

  const handleCaptureForImageStudio = useCallback(async () => {
    setImgError(null);
    const snap = await captureSourceSnapshot();
    if (!snap) {
      setImgError("Primero enciende tu camara, video o pantalla en la ventana 1. En Vivo.");
      return;
    }
    if (studioInputUrl) URL.revokeObjectURL(studioInputUrl);
    setStudioInputFile(snap);
    setStudioInputUrl(URL.createObjectURL(snap));
  }, [captureSourceSnapshot, studioInputUrl]);

  const handleRunImageStudio = useCallback(async () => {
    setImgError(null);
    const mod = moderatePromptForDecart(imgPrompt);
    if (!mod.ok) {
      setImgError(mod.reason || "Prompt invalido.");
      return;
    }
    if (!studioInputFile) {
      setImgError("Sube una foto o captura un cuadro de la camara antes de transformar.");
      return;
    }

    setImgLoading(true);
    try {
      const form = new FormData();
      form.append("prompt", imgPrompt.trim());
      form.append("resolution", imgRes);
      form.append("data", studioInputFile);

      const res = await fetch("/api/process-image", { method: "POST", body: form });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error || "Error generando imagen con lucy-image-2.");
      }

      const outBlob = await res.blob();
      setImgResultBlob(outBlob);
      if (imgPreviewUrl) URL.revokeObjectURL(imgPreviewUrl);
      setImgPreviewUrl(URL.createObjectURL(outBlob));

      const credits = imgRes === "720p" ? 2 : 1;
      onLogUsage({
        kind: "image",
        modelId: "lucy-image-2",
        detail: `Imagen estudio ${imgRes}`,
        decartCredits: credits,
        usdCost: Number((credits * 0.01).toFixed(2)),
        copCost: credits * 42,
      });
      onRefreshAccount();
    } catch (err) {
      setImgError(err instanceof Error ? err.message : "No se pudo procesar la imagen.");
    } finally {
      setImgLoading(false);
    }
  }, [imgPreviewUrl, imgPrompt, imgRes, onLogUsage, onRefreshAccount, studioInputFile]);

  const handleSaveGeneratedAsSkin = useCallback(async () => {
    if (!imgResultBlob) return;
    try {
      const file = new File([imgResultBlob], "avatar-ia.png", { type: "image/png" });
      const dataUrl = await fileToCompactDataUrl(file);
      setSkinImageDataUrl(dataUrl);
      setSkinModel("lucy-2.6");
      setSkinPrompt(
        "Substitute the character in the video with the person in the reference image, matching their exact facial features, hair style, and clothing while preserving pose and room background.",
      );
      if (!skinName.trim()) {
        setSkinName(`Avatar ${skins.length + 1}`);
      }
      setSkinMsg("Avatar cargado en el formulario de Skin. Pulsa Guardar Skin.");
    } catch (err) {
      setSkinErr(err instanceof Error ? err.message : "Error preparando miniatura.");
    }
  }, [imgResultBlob, skinName, skins.length]);

  const handleCreateSkin = useCallback(() => {
    setSkinErr(null);
    setSkinMsg(null);
    const nameClean = skinName.trim();
    if (!nameClean) {
      setSkinErr("Ponle un nombre a tu Skin o Preset guardado.");
      return;
    }
    const mod = moderatePromptForDecart(skinPrompt);
    if (!mod.ok) {
      setSkinErr(mod.reason || "Prompt invalido.");
      return;
    }
    onSaveSkin({
      id: `skin_${Date.now()}`,
      name: nameClean,
      category: skinCategory,
      prompt: skinPrompt.trim(),
      modelId: skinModel,
      refImageDataUrl: skinImageDataUrl,
      createdAt: new Date().toISOString(),
    });
    setSkinName("");
    setSkinImageDataUrl(undefined);
    setSkinMsg(`Skin "${nameClean}" guardado en este navegador.`);
  }, [onSaveSkin, skinCategory, skinImageDataUrl, skinModel, skinName, skinPrompt]);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* BLOQUE 1: MIS SKINS Y PRESETS PERSONALIZADOS */}
      <section className="studio-card" aria-label="Mis Skins Guardados">
        <h2>Mis Skins y Presets Guardados ({skins.length})</h2>
        <p className="muted-copy">
          Crea tus propios estilos o personajes con su imagen de referencia y activalos en 1 clic
          dentro de la cabina en vivo (se guardan localmente en tu navegador).
        </p>

        <div className="cockpit-grid">
          <div>
            <div className="field-row">
              <label htmlFor="skin-name">Nombre del Skin / Preset</label>
              <input
                id="skin-name"
                type="text"
                className="input-control"
                placeholder="Ej. Mi Avatar Cibernetico"
                value={skinName}
                onChange={(e) => setSkinName(e.target.value)}
              />
            </div>

            <div className="metrics-grid" style={{ marginTop: 0, marginBottom: 10 }}>
              <div className="field-row" style={{ marginBottom: 0 }}>
                <label htmlFor="skin-cat">Categoria</label>
                <select
                  id="skin-cat"
                  className="select-control"
                  value={skinCategory}
                  onChange={(e) => setSkinCategory(e.target.value as SavedSkinPreset["category"])}
                >
                  <option value="Personaje">Personaje</option>
                  <option value="Estilo">Estilo</option>
                  <option value="Fondo">Fondo</option>
                  <option value="VFX">VFX</option>
                  <option value="Try-On">Try-On</option>
                </select>
              </div>
              <div className="field-row" style={{ marginBottom: 0 }}>
                <label htmlFor="skin-mod">Motor recomendado</label>
                <select
                  id="skin-mod"
                  className="select-control"
                  value={skinModel}
                  onChange={(e) => setSkinModel(e.target.value as SavedSkinPreset["modelId"])}
                >
                  <option value="lucy-2.6">lucy-2.6 (Personajes/Escena)</option>
                  <option value="lucy-restyle-2">lucy-restyle-2 (Solo estilo 1 cr/s)</option>
                  <option value="lucy-vton-3.6">lucy-vton-3.6 (Ropa Try-On)</option>
                  <option value="lucy-2.5">lucy-2.5 (Personajes estable)</option>
                </select>
              </div>
            </div>

            <div className="field-row">
              <label htmlFor="skin-prompt">Prompt (ingles)</label>
              <textarea
                id="skin-prompt"
                className="textarea-control"
                value={skinPrompt}
                onChange={(e) => setSkinPrompt(e.target.value)}
              />
            </div>

            <div className="field-row">
              <label htmlFor="skin-ref-file">Imagen de referencia opcional del Skin</label>
              <div className="btn-row">
                <input
                  id="skin-ref-file"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="input-control"
                  style={{ flex: 1 }}
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const compact = await fileToCompactDataUrl(f);
                    setSkinImageDataUrl(compact);
                  }}
                />
                {skinImageDataUrl && (
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setSkinImageDataUrl(undefined)}
                  >
                    Quitar imagen
                  </button>
                )}
              </div>
            </div>

            {skinImageDataUrl && (
              <img
                src={skinImageDataUrl}
                alt="Miniatura de Skin personalizado"
                style={{
                  width: 84,
                  height: 84,
                  objectFit: "cover",
                  borderRadius: 8,
                  border: "2px solid #000",
                  marginBottom: 10,
                }}
              />
            )}

            {skinErr && <p className="alert alert-error">{skinErr}</p>}
            {skinMsg && <p className="alert alert-ok">{skinMsg}</p>}

            <button type="button" className="btn btn-accent" onClick={handleCreateSkin}>
              Guardar Skin personal
            </button>
          </div>

          <div>
            {skins.length === 0 ? (
              <div className="studio-subcard">
                <p className="muted-copy" style={{ margin: 0 }}>
                  Todavia no tienes Skins guardados. Crea uno a la izquierda o genera un personaje
                  abajo con lucy-image-2 y guardalo aqui.
                </p>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {skins.map((skin) => (
                  <div key={skin.id} className="studio-subcard">
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      {skin.refImageDataUrl && (
                        <img
                          src={skin.refImageDataUrl}
                          alt={skin.name}
                          style={{
                            width: 56,
                            height: 56,
                            objectFit: "cover",
                            borderRadius: 6,
                            border: "2px solid #000",
                          }}
                        />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="preset-cat">
                          {skin.category} · {skin.modelId}
                        </div>
                        <div style={{ fontWeight: 700 }}>{skin.name}</div>
                        <div className="muted-copy" style={{ margin: 0, fontSize: "0.78rem" }}>
                          {skin.prompt.slice(0, 90)}
                          {skin.prompt.length > 90 ? "..." : ""}
                        </div>
                      </div>
                    </div>
                    <div className="btn-row" style={{ marginTop: 8 }}>
                      <button
                        type="button"
                        className="btn btn-accent"
                        onClick={() =>
                          onApplySkinToLive({
                            prompt: skin.prompt,
                            modelId: skin.modelId,
                            refFile: skin.refImageDataUrl
                              ? dataUrlToFile(skin.refImageDataUrl, `${skin.id}.jpg`)
                              : null,
                          })
                        }
                      >
                        Enviar a En Vivo
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => onDeleteSkin(skin.id)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* BLOQUE 2: ESTUDIO DE IMAGEN (lucy-image-2) */}
      <section className="studio-card" aria-label="Estudio de Imagen">
        <h2>Estudio de Imagen y Generador de Personajes (lucy-image-2 · 1 o 2 cr)</h2>
        <p className="muted-copy">
          Prueba estilos o crea un avatar desde tu foto antes de abrir la transmision por segundo.
        </p>

        <div className="cockpit-grid">
          <div className="video-compare-grid">
            <div className="video-stage">
              <span className="stage-badge">Entrada</span>
              {studioInputUrl ? (
                <img src={studioInputUrl} alt="Imagen de entrada seleccionada" />
              ) : (
                <div className="empty-stage">
                  Sube una foto o captura un cuadro de tu camara activa.
                </div>
              )}
            </div>
            <div className="video-stage">
              <span className="stage-badge">Resultado IA ({imgRes})</span>
              {imgPreviewUrl ? (
                <img src={imgPreviewUrl} alt="Imagen transformada por Decart" />
              ) : (
                <div className="empty-stage">
                  {imgLoading ? "Procesando imagen..." : "Aqui aparecera el resultado."}
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="btn-row" style={{ marginBottom: 12 }}>
              <button
                type="button"
                className="btn"
                onClick={handleCaptureForImageStudio}
                disabled={!sourceReady}
              >
                Capturar cuadro de fuente activa
              </button>
              <input
                aria-label="Subir foto para Estudio de Imagen"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="input-control"
                style={{ flex: 1 }}
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  if (!f) return;
                  if (studioInputUrl) URL.revokeObjectURL(studioInputUrl);
                  setStudioInputFile(f);
                  setStudioInputUrl(URL.createObjectURL(f));
                }}
              />
            </div>

            <div className="field-row">
              <label htmlFor="img-prompt-box">Instruccion para editar la imagen</label>
              <textarea
                id="img-prompt-box"
                className="textarea-control"
                value={imgPrompt}
                onChange={(e) => setImgPrompt(e.target.value)}
              />
            </div>

            <div className="field-row">
              <label htmlFor="sel-studio-res">Resolucion</label>
              <select
                id="sel-studio-res"
                className="select-control"
                value={imgRes}
                onChange={(e) => setImgRes(e.target.value as "480p" | "720p")}
              >
                <option value="480p">480p (1 credito Decart = $0.01 USD)</option>
                <option value="720p">720p (2 creditos Decart = $0.02 USD)</option>
              </select>
            </div>

            <div className="btn-row">
              <button
                type="button"
                className="btn btn-accent"
                onClick={handleRunImageStudio}
                disabled={imgLoading || !studioInputFile}
              >
                {imgLoading ? "Generando..." : `Generar imagen (${imgRes})`}
              </button>

              {imgPreviewUrl && (
                <a href={imgPreviewUrl} download="resultado-estudio.png" className="btn">
                  Descargar PNG
                </a>
              )}

              {imgResultBlob && (
                <>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => {
                      const file = new File([imgResultBlob], "referencia-ia.png", {
                        type: "image/png",
                      });
                      onApplySkinToLive({
                        prompt:
                          "Substitute the character in the video with the person in the reference image, matching their exact facial features, hair style, and clothing while preserving pose and room background.",
                        modelId: "lucy-2.6",
                        refFile: file,
                      });
                    }}
                  >
                    Usar como referencia en En Vivo
                  </button>
                  <button type="button" className="btn" onClick={handleSaveGeneratedAsSkin}>
                    Preparar como Skin
                  </button>
                </>
              )}
            </div>

            {imgError && <p className="alert alert-error">{imgError}</p>}
          </div>
        </div>
      </section>
    </div>
  );
}

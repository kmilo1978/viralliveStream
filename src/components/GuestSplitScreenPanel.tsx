"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  type GuestSimItem,
  DEFAULT_GUEST_PRESETS,
  type ViewerRangeOption,
  fileToCompactDataUrl,
} from "@/lib/studio-data";

const CUSTOM_GUESTS_STORAGE_KEY = "miplataformastream.customDuoGuests.v2";

const GUEST_BG_SWATCHES = [
  { id: "indigo", label: "Índigo VIP", value: "linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%)", dot: "#4338CA" },
  { id: "pink", label: "Rosa Glam", value: "linear-gradient(135deg, #831843 0%, #BE185D 50%, #F43F5E 100%)", dot: "#EC4899" },
  { id: "cyan", label: "Azul Tech", value: "linear-gradient(135deg, #0F172A 0%, #1D4ED8 60%, #0284C7 100%)", dot: "#0284C7" },
  { id: "emerald", label: "Esmeralda Pro", value: "linear-gradient(135deg, #064E3B 0%, #047857 55%, #10B981 100%)", dot: "#10B981" },
  { id: "obsidian", label: "Oscuro Neutro", value: "linear-gradient(135deg, #18181B 0%, #27272A 100%)", dot: "#3F3F46" },
];
import { Dashicon } from "@/components/Dashicons";
import { ViewerRangeControl } from "@/components/ViewerRangeControl";

export interface GuestSplitScreenConfig {
  active: boolean;
  layout: "vertical" | "horizontal" | "pip";
  selectedGuest: GuestSimItem;
  currentPromptIndex: number;
  autoRotatePrompts: boolean;
  guestMuted: boolean;
  guestVolume: number;
  viewerRange: ViewerRangeOption;
  customVideoUrl?: string;
  customVideoName?: string;
  guestSourceMode?: "preset" | "video_file";
  isGuestSpeaking: boolean;
}

interface GuestSplitScreenPanelProps {
  config: GuestSplitScreenConfig;
  onChangeConfig: (newConfig: GuestSplitScreenConfig) => void;
  hostSourceMode?: "camera" | "video_file";
  hostVideoUrl?: string | null;
  hostVideoName?: string | null;
  onChangeHostSourceMode?: (mode: "camera" | "video_file") => void;
  onUploadHostVideo?: (file: File | null) => void;
  onClose?: () => void;
}

export function GuestSplitScreenPanel({
  config,
  onChangeConfig,
  hostSourceMode = "camera",
  hostVideoUrl = null,
  hostVideoName = null,
  onChangeHostSourceMode,
  onUploadHostVideo,
  onClose,
}: GuestSplitScreenPanelProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const hostFileInputRef = useRef<HTMLInputElement | null>(null);
  const avatarFileInputRef = useRef<HTMLInputElement | null>(null);
  const configRef = useRef(config);
  configRef.current = config;

  // Perfiles personalizados + edición directa de cualquier perfil
  const [guestProfiles, setGuestProfiles] = useState<GuestSimItem[]>(DEFAULT_GUEST_PRESETS);
  const [editorMode, setEditorMode] = useState<"closed" | "edit" | "create">("closed");
  const [draftName, setDraftName] = useState("");
  const [draftHandle, setDraftHandle] = useState("");
  const [draftRole, setDraftRole] = useState("");
  const [draftStatusText, setDraftStatusText] = useState("🟢 En directo (Co-Host)");
  const [draftVerified, setDraftVerified] = useState(true);
  const [draftPosterBg, setDraftPosterBg] = useState(GUEST_BG_SWATCHES[0].value);
  const [draftAvatarUrl, setDraftAvatarUrl] = useState<string | undefined>(undefined);
  const [draftPromptsText, setDraftPromptsText] = useState("");
  const [editingQuoteInline, setEditingQuoteInline] = useState(false);
  const [inlineQuoteText, setInlineQuoteText] = useState("");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CUSTOM_GUESTS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as GuestSimItem[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setGuestProfiles(parsed);
        }
      }
    } catch {
      // Ignorar JSON inválido en storage
    }
  }, []);

  const persistGuestProfiles = (list: GuestSimItem[]) => {
    setGuestProfiles(list);
    try {
      window.localStorage.setItem(CUSTOM_GUESTS_STORAGE_KEY, JSON.stringify(list));
    } catch {
      // Ignorar si localStorage está lleno
    }
  };

  const openProfileEditor = (mode: "edit" | "create") => {
    setEditorMode(mode);
    if (mode === "edit") {
      const g = config.selectedGuest;
      setDraftName(g.name);
      setDraftHandle(g.handle);
      setDraftRole(g.role);
      setDraftStatusText(g.statusText);
      setDraftVerified(g.isVerified);
      setDraftPosterBg(g.posterBg);
      setDraftAvatarUrl(g.avatarUrl);
      setDraftPromptsText(g.speechPrompts.join("\n"));
    } else {
      setDraftName("");
      setDraftHandle("");
      setDraftRole("Co-Host Personalizado");
      setDraftStatusText("🟢 En directo (Co-Host)");
      setDraftVerified(true);
      setDraftPosterBg(GUEST_BG_SWATCHES[1].value);
      setDraftAvatarUrl(undefined);
      setDraftPromptsText("¡Hola a toda la audiencia conectada en el directo!\n¿Qué opinan de lo que estamos viendo hoy en pantalla?");
    }
  };

  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compactUrl = await fileToCompactDataUrl(file, 160);
      setDraftAvatarUrl(compactUrl);
    } catch {
      // Fallback FileReader directo si falla compresión
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (typeof ev.target?.result === "string") setDraftAvatarUrl(ev.target.result);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  };

  const handleSaveGuestProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = draftName.trim();
    if (!cleanName) return;

    const cleanHandleRaw = draftHandle.trim() || `@${cleanName.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;
    const cleanHandle = cleanHandleRaw.startsWith("@") ? cleanHandleRaw : `@${cleanHandleRaw}`;
    const prompts = draftPromptsText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    const basePrompts =
      prompts.length > 0
        ? prompts
        : ["¡Hola a todos! Gracias por sumarse a este directo 🙌", "¿Qué les parece lo que estamos mostrando hoy?"];

    const isCreating = editorMode === "create";
    const targetId = isCreating ? `guest-custom-${Date.now()}` : config.selectedGuest.id;
    const savedProfile: GuestSimItem = {
      id: targetId,
      name: cleanName,
      handle: cleanHandle,
      role: draftRole.trim() || "Co-Host Invitado",
      posterBg: draftPosterBg,
      avatarUrl: draftAvatarUrl,
      customVideoUrl: !isCreating ? config.selectedGuest.customVideoUrl : undefined,
      isVerified: draftVerified,
      statusText: draftStatusText.trim() || "🟢 En directo (Co-Host)",
      speechPrompts: basePrompts,
    };

    const exists = guestProfiles.some((item) => item.id === targetId);
    const updatedList = exists
      ? guestProfiles.map((item) => (item.id === targetId ? savedProfile : item))
      : [...guestProfiles, savedProfile];

    persistGuestProfiles(updatedList);
    onChangeConfig({
      ...config,
      selectedGuest: savedProfile,
      currentPromptIndex: 0,
      isGuestSpeaking: true,
    });
    setEditorMode("closed");
  };

  const handleDeleteCustomGuest = (guestId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = guestProfiles.filter((item) => item.id !== guestId);
    const nextList = filtered.length > 0 ? filtered : DEFAULT_GUEST_PRESETS;
    persistGuestProfiles(nextList);
    if (config.selectedGuest.id === guestId) {
      onChangeConfig({
        ...config,
        selectedGuest: nextList[0],
        currentPromptIndex: 0,
      });
    }
  };

  // Rotación automática de diálogo del invitado usando referencia fresca
  useEffect(() => {
    if (!config.active || !config.autoRotatePrompts) return;

    let speakTimeout: ReturnType<typeof setTimeout> | null = null;
    const interval = setInterval(() => {
      const latest = configRef.current;
      const total = latest.selectedGuest.speechPrompts.length;
      const nextIdx = (latest.currentPromptIndex + 1) % total;

      onChangeConfig({
        ...latest,
        currentPromptIndex: nextIdx,
        isGuestSpeaking: true,
      });

      speakTimeout = setTimeout(() => {
        const current = configRef.current;
        onChangeConfig({
          ...current,
          currentPromptIndex: nextIdx,
          isGuestSpeaking: false,
        });
      }, 5000);
    }, 14000);

    return () => {
      clearInterval(interval);
      if (speakTimeout) clearTimeout(speakTimeout);
    };
  }, [config.active, config.autoRotatePrompts, onChangeConfig]);

  const handleSelectPreset = (guest: GuestSimItem) => {
    onChangeConfig({
      ...config,
      selectedGuest: guest,
      currentPromptIndex: 0,
      isGuestSpeaking: true,
    });
  };

  const handleNextPrompt = () => {
    const total = config.selectedGuest.speechPrompts.length;
    const nextIdx = (config.currentPromptIndex + 1) % total;
    onChangeConfig({
      ...config,
      currentPromptIndex: nextIdx,
      isGuestSpeaking: true,
    });

    setTimeout(() => {
      const latest = configRef.current;
      onChangeConfig({
        ...latest,
        currentPromptIndex: nextIdx,
        isGuestSpeaking: false,
      });
    }, 4500);
  };

  const handleCustomVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (config.customVideoUrl) {
      URL.revokeObjectURL(config.customVideoUrl);
    }
    const url = URL.createObjectURL(file);
    const customGuest: GuestSimItem = {
      id: `guest-custom-${Date.now()}`,
      name: file.name.replace(/\.[^/.]+$/, ""),
      handle: "@mi_invitado_vip",
      role: "Video MP4 Pregrabado",
      posterBg: "linear-gradient(135deg, #18181B 0%, #27272A 100%)",
      customVideoUrl: url,
      isVerified: true,
      statusText: "Pregrabado (MP4)",
      speechPrompts: [
        "¡Hola a todos! Gracias por invitarme a este directo 🙌",
        "¿Cuál es el siguiente paso que vas a mostrar en pantalla?",
        "¡Un saludo especial a toda la audiencia conectada en el chat!",
      ],
    };

    onChangeConfig({
      ...config,
      selectedGuest: customGuest,
      customVideoUrl: url,
      customVideoName: file.name,
      guestSourceMode: "video_file",
      currentPromptIndex: 0,
    });
    e.target.value = "";
  };

  const handleHostFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file && onUploadHostVideo) {
      onUploadHostVideo(file);
    }
    e.target.value = "";
  };

  const isHostPreRecorded = hostSourceMode === "video_file";
  const isGuestPreRecorded =
    (config.guestSourceMode ?? (config.customVideoUrl ? "video_file" : "preset")) === "video_file";

  const duoMixMode: "both_live" | "mixed" | "both_recorded" =
    isHostPreRecorded && isGuestPreRecorded
      ? "both_recorded"
      : !isHostPreRecorded && !isGuestPreRecorded
        ? "both_live"
        : "mixed";

  const applyDuoMixMode = (mode: "both_live" | "mixed" | "both_recorded") => {
    if (mode === "both_live") {
      onChangeHostSourceMode?.("camera");
      onChangeConfig({ ...config, guestSourceMode: "preset" });
    } else if (mode === "mixed") {
      // Mantiene cualquiera que ya sea pregrabado, o deja Tú en vivo + Invitado pregrabado
      if (isHostPreRecorded && !isGuestPreRecorded) return;
      onChangeHostSourceMode?.("camera");
      onChangeConfig({ ...config, guestSourceMode: "video_file" });
    } else {
      onChangeHostSourceMode?.("video_file");
      onChangeConfig({ ...config, guestSourceMode: "video_file" });
    }
  };

  const getGuestIconName = (guestId: string) => {
    if (guestId === "guest-cristiano") return "star-filled" as const;
    if (guestId === "guest-mia") return "art" as const;
    if (guestId === "guest-alex") return "desktop" as const;
    return "cart" as const;
  };

  const promptsTotal = config.selectedGuest.speechPrompts.length;
  const activePromptText =
    config.selectedGuest.speechPrompts[config.currentPromptIndex] ||
    config.selectedGuest.speechPrompts[0];

  return (
    <div className="studio-dock-card duo-panel-card">
      {/* 1. CABECERA LIMPIA CON SWITCH REAL */}
      <div className="duo-panel-header">
        <div className="duo-panel-title-wrap">
          <span className="duo-panel-badge-icon">
            <Dashicon name="groups" size={16} />
          </span>
          <div style={{ minWidth: 0 }}>
            <h3 className="duo-panel-title">Dúo &amp; Co-Host</h3>
            <p className="duo-panel-subtitle">Pantalla dividida en vivo</p>
          </div>
        </div>

        <div className="duo-master-switch-wrap">
          <span className={`duo-switch-status-tag ${config.active ? "on" : ""}`}>
            {config.active ? "ON" : "OFF"}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={config.active}
            aria-label="Activar o desactivar pantalla dividida Dúo"
            className={`switchy-toggle ${config.active ? "active-green" : ""}`}
            onClick={() => onChangeConfig({ ...config, active: !config.active })}
          >
            <div className="switchy-thumb" />
          </button>
        </div>
      </div>

      {/* 2. SELECTOR SEGMENTADO EN 1 FILA (VERTICAL · BATALLA · PIP) */}
      <div className="duo-section-block">
        <div className="duo-section-label">Modo de pantalla</div>
        <div className="duo-layout-segmented" role="radiogroup" aria-label="Modo de pantalla dividida">
          {(
            [
              { id: "vertical", label: "Vertical", sub: "50 / 50", icon: "smartphone" },
              { id: "horizontal", label: "Batalla PK", sub: "Lado / Lado", icon: "groups" },
              { id: "pip", label: "Flotante PiP", sub: "Esquina", icon: "grid-view" },
            ] as const
          ).map((mode) => (
            <button
              key={mode.id}
              type="button"
              className={`duo-layout-pill ${config.layout === mode.id ? "active" : ""}`}
              onClick={() => onChangeConfig({ ...config, layout: mode.id })}
            >
              <span className="duo-layout-pill-top">
                <Dashicon name={mode.icon} size={13} />
                <span>{mode.label}</span>
              </span>
              <span className="duo-layout-pill-sub">{mode.sub}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. FUENTES DE VIDEO DÚO: VIVO + PREGRABADO O AMBOS PREGRABADOS */}
      <div className="duo-section-block duo-sources-card">
        <div className="duo-section-label">Fuentes de video (Vivo o Pregrabado)</div>

        <div className="duo-combo-row" role="group" aria-label="Combinación de fuentes en Dúo">
          <button
            type="button"
            className={`duo-combo-pill ${duoMixMode === "both_live" ? "active" : ""}`}
            onClick={() => applyDuoMixMode("both_live")}
          >
            <span>2 En Vivo</span>
          </button>
          <button
            type="button"
            className={`duo-combo-pill ${duoMixMode === "mixed" ? "active" : ""}`}
            onClick={() => applyDuoMixMode("mixed")}
          >
            <span>1 Vivo + 1 MP4</span>
          </button>
          <button
            type="button"
            className={`duo-combo-pill ${duoMixMode === "both_recorded" ? "active" : ""}`}
            onClick={() => applyDuoMixMode("both_recorded")}
          >
            <span>2 Pregrabados</span>
          </button>
        </div>

        <div className="duo-sources-grid">
          {/* Cuadro 1: Tú (Anfitrión) */}
          <div className="duo-source-box">
            <div className="duo-source-box-head">
              <span className="duo-source-title">1. Tú (Host)</span>
              <span className={`duo-source-badge ${isHostPreRecorded ? "mp4" : "live"}`}>
                {isHostPreRecorded ? "MP4" : "En Vivo"}
              </span>
            </div>
            <div className="duo-source-toggle-row">
              <button
                type="button"
                className={`duo-source-toggle-btn ${!isHostPreRecorded ? "active" : ""}`}
                onClick={() => onChangeHostSourceMode?.("camera")}
              >
                En Vivo
              </button>
              <button
                type="button"
                className={`duo-source-toggle-btn ${isHostPreRecorded ? "active" : ""}`}
                onClick={() => onChangeHostSourceMode?.("video_file")}
              >
                Pregrabado
              </button>
            </div>
            <label className="duo-upload-mp4-pill" title="Subir video MP4/WebM para tu cuadro en Dúo">
              <Dashicon name="upload" size={12} />
              <span>{hostVideoUrl ? "Cambiar MP4 Tú" : "Subir MP4 Tú"}</span>
              <input
                ref={hostFileInputRef}
                type="file"
                accept="video/mp4,video/webm"
                aria-label="Subir video pregrabado del anfitrión"
                style={{ display: "none" }}
                onChange={handleHostFileUpload}
              />
            </label>
            <span className="duo-source-file-hint">
              {hostVideoUrl
                ? `✓ ${hostVideoName || "Video MP4 cargado"}`
                : isHostPreRecorded
                  ? "Sube un MP4 para tu cuadro"
                  : "Cámara web en directo"}
            </span>
          </div>

          {/* Cuadro 2: Invitado (Co-Host) */}
          <div className="duo-source-box">
            <div className="duo-source-box-head">
              <span className="duo-source-title">2. Invitado</span>
              <span className={`duo-source-badge ${isGuestPreRecorded ? "mp4" : "live"}`}>
                {isGuestPreRecorded ? "MP4" : "En Vivo"}
              </span>
            </div>
            <div className="duo-source-toggle-row">
              <button
                type="button"
                className={`duo-source-toggle-btn ${!isGuestPreRecorded ? "active" : ""}`}
                onClick={() => onChangeConfig({ ...config, guestSourceMode: "preset" })}
              >
                En Vivo
              </button>
              <button
                type="button"
                className={`duo-source-toggle-btn ${isGuestPreRecorded ? "active" : ""}`}
                onClick={() => onChangeConfig({ ...config, guestSourceMode: "video_file" })}
              >
                Pregrabado
              </button>
            </div>
            <label className="duo-upload-mp4-pill" title="Subir video MP4/WebM personalizado como invitado">
              <Dashicon name="upload" size={12} />
              <span>{config.customVideoUrl ? "Cambiar MP4 Invitado" : "Subir MP4 Invitado"}</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/webm"
                aria-label="Subir video pregrabado del invitado"
                style={{ display: "none" }}
                onChange={handleCustomVideoUpload}
              />
            </label>
            <span className="duo-source-file-hint">
              {config.customVideoUrl
                ? `✓ ${config.customVideoName || config.selectedGuest.name}`
                : isGuestPreRecorded
                  ? "Sube un MP4 para invitado"
                  : config.selectedGuest.name}
            </span>
          </div>
        </div>
      </div>

      {/* 4. PERFIL DE INVITADO PERSONALIZABLE EN DIRECTO */}
      <div className="duo-section-block">
        <div className="duo-section-header-row">
          <span className="duo-section-label">Perfil de invitado en directo</span>
          <div className="duo-profile-actions-row">
            <button
              type="button"
              className={`duo-action-mini-pill ${editorMode === "edit" ? "active" : ""}`}
              onClick={() => (editorMode === "edit" ? setEditorMode("closed") : openProfileEditor("edit"))}
              title="Editar nombre, foto, rol, verificado y diálogo del invitado activo"
            >
              ✎ Personalizar
            </button>
            <button
              type="button"
              className={`duo-action-mini-pill ${editorMode === "create" ? "active" : ""}`}
              onClick={() => (editorMode === "create" ? setEditorMode("closed") : openProfileEditor("create"))}
              title="Crear un nuevo perfil de invitado guardado"
            >
              + Nuevo
            </button>
          </div>
        </div>

        {editorMode !== "closed" && (
          <form className="duo-profile-editor-card" onSubmit={handleSaveGuestProfile}>
            <div className="duo-editor-top-title">
              <span>{editorMode === "create" ? "Crear perfil de invitado" : `Editando: ${config.selectedGuest.name}`}</span>
            </div>

            <div className="duo-editor-avatar-row">
              <div className="duo-guest-avatar is-preview" style={{ background: draftPosterBg }}>
                {draftAvatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={draftAvatarUrl} alt="Avatar invitado" className="duo-guest-avatar-img" />
                ) : (
                  <Dashicon name="admin-users" size={16} />
                )}
              </div>
              <div className="duo-editor-avatar-btns">
                <label className="duo-action-mini-pill" style={{ cursor: "pointer" }}>
                  <span>{draftAvatarUrl ? "Cambiar foto" : "Subir foto"}</span>
                  <input
                    ref={avatarFileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(ev) => void handleUploadAvatar(ev)}
                  />
                </label>
                {draftAvatarUrl && (
                  <button
                    type="button"
                    className="duo-action-mini-pill"
                    onClick={() => setDraftAvatarUrl(undefined)}
                  >
                    Quitar foto
                  </button>
                )}
              </div>
            </div>

            <div className="duo-editor-grid-2">
              <label className="duo-editor-field">
                <span>Nombre visible</span>
                <input
                  type="text"
                  required
                  placeholder="Ej: Camila Store"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                />
              </label>
              <label className="duo-editor-field">
                <span>Usuario (@handle)</span>
                <input
                  type="text"
                  placeholder="Ej: @camila_live"
                  value={draftHandle}
                  onChange={(e) => setDraftHandle(e.target.value)}
                />
              </label>
            </div>

            <div className="duo-editor-grid-2">
              <label className="duo-editor-field">
                <span>Rol / Bio corta</span>
                <input
                  type="text"
                  placeholder="Ej: Invitada Moda VIP"
                  value={draftRole}
                  onChange={(e) => setDraftRole(e.target.value)}
                />
              </label>
              <label className="duo-editor-field">
                <span>Etiqueta de estado</span>
                <input
                  type="text"
                  placeholder="Ej: 🟢 En directo (Co-Host)"
                  value={draftStatusText}
                  onChange={(e) => setDraftStatusText(e.target.value)}
                />
              </label>
            </div>

            <div className="duo-editor-inline-bar">
              <div className="duo-swatch-row" aria-label="Color de fondo del invitado">
                {GUEST_BG_SWATCHES.map((sw) => (
                  <button
                    key={sw.id}
                    type="button"
                    className={`duo-swatch-dot ${draftPosterBg === sw.value ? "selected" : ""}`}
                    style={{ background: sw.dot }}
                    title={sw.label}
                    aria-label={sw.label}
                    onClick={() => setDraftPosterBg(sw.value)}
                  />
                ))}
              </div>
              <div className="duo-inline-switch">
                <span>Verificado ✓</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={draftVerified}
                  aria-label="Insignia de invitado verificado"
                  className={`switchy-toggle compact-switch ${draftVerified ? "active-green" : ""}`}
                  onClick={() => setDraftVerified((v) => !v)}
                >
                  <div className="switchy-thumb" />
                </button>
              </div>
            </div>

            <label className="duo-editor-field">
              <span>Frases en pantalla (1 por línea)</span>
              <textarea
                rows={2}
                placeholder="¡Hola a todos! Bienvenidos al directo..."
                value={draftPromptsText}
                onChange={(e) => setDraftPromptsText(e.target.value)}
              />
            </label>

            <div className="duo-editor-submit-row">
              <button type="submit" className="duo-save-profile-btn">
                Guardar y aplicar
              </button>
              <button
                type="button"
                className="duo-cancel-profile-btn"
                onClick={() => setEditorMode("closed")}
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        <div className="duo-guest-list">
          {guestProfiles.map((guest) => {
            const isSelected = config.selectedGuest.id === guest.id;
            const isDefaultPreset = DEFAULT_GUEST_PRESETS.some((def) => def.id === guest.id);
            return (
              <div
                key={guest.id}
                role="button"
                tabIndex={0}
                className={`duo-guest-row ${isSelected ? "selected" : ""}`}
                onClick={() => handleSelectPreset(guest)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleSelectPreset(guest);
                  }
                }}
              >
                <div className="duo-guest-avatar" style={{ background: guest.posterBg }}>
                  {guest.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={guest.avatarUrl} alt={guest.name} className="duo-guest-avatar-img" />
                  ) : (
                    <Dashicon name={getGuestIconName(guest.id)} size={14} />
                  )}
                </div>
                <div className="duo-guest-meta">
                  <span className="duo-guest-name-line">
                    <span className="duo-guest-name">{guest.name}</span>
                    {guest.isVerified && <span className="duo-verified-tick">✓</span>}
                  </span>
                  <span className="duo-guest-role">{guest.role}</span>
                </div>
                <div className="duo-guest-row-right">
                  {!isDefaultPreset && (
                    <button
                      type="button"
                      className="duo-guest-delete-btn"
                      title="Eliminar perfil personalizado"
                      aria-label={`Eliminar perfil ${guest.name}`}
                      onClick={(e) => handleDeleteCustomGuest(guest.id, e)}
                    >
                      ×
                    </button>
                  )}
                  <span className={`duo-guest-radio ${isSelected ? "checked" : ""}`}>
                    {isSelected ? "Activo" : "Elegir"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. DIÁLOGO DEL INVITADO CON SWITCH AUTO-AVANZAR Y EDICIÓN RÁPIDA */}
      <div className="duo-dialogue-card">
        <div className="duo-dialogue-top">
          <span className="duo-dialogue-heading">
            <Dashicon name="format-chat" size={13} color="#60A5FA" />
            <span>Diálogo ({config.currentPromptIndex + 1}/{promptsTotal})</span>
          </span>

          <div className="duo-dialogue-controls-right">
            <button
              type="button"
              className={`duo-action-mini-pill ${editingQuoteInline ? "active" : ""}`}
              onClick={() => {
                if (editingQuoteInline) {
                  setEditingQuoteInline(false);
                } else {
                  setInlineQuoteText(activePromptText);
                  setEditingQuoteInline(true);
                }
              }}
              title="Editar el texto que dice el invitado ahora"
            >
              ✎ Texto
            </button>
            <div className="duo-inline-switch">
              <span>Auto 14s</span>
              <button
                type="button"
                role="switch"
                aria-checked={config.autoRotatePrompts}
                aria-label="Auto-avanzar diálogo cada 14 segundos"
                className={`switchy-toggle compact-switch ${config.autoRotatePrompts ? "active" : ""}`}
                onClick={() => onChangeConfig({ ...config, autoRotatePrompts: !config.autoRotatePrompts })}
              >
                <div className="switchy-thumb" />
              </button>
            </div>
          </div>
        </div>

        {editingQuoteInline ? (
          <div className="duo-inline-quote-editor">
            <textarea
              rows={2}
              className="duo-inline-quote-textarea"
              value={inlineQuoteText}
              onChange={(e) => setInlineQuoteText(e.target.value)}
            />
            <div className="duo-editor-submit-row">
              <button
                type="button"
                className="duo-save-profile-btn"
                onClick={() => {
                  const trimmed = inlineQuoteText.trim();
                  if (!trimmed) return;
                  const nextPrompts = [...config.selectedGuest.speechPrompts];
                  nextPrompts[config.currentPromptIndex] = trimmed;
                  const updatedGuest: GuestSimItem = {
                    ...config.selectedGuest,
                    speechPrompts: nextPrompts,
                  };
                  persistGuestProfiles(
                    guestProfiles.map((g) => (g.id === updatedGuest.id ? updatedGuest : g)),
                  );
                  onChangeConfig({ ...config, selectedGuest: updatedGuest, isGuestSpeaking: true });
                  setEditingQuoteInline(false);
                }}
              >
                Aplicar frase
              </button>
              <button
                type="button"
                className="duo-cancel-profile-btn"
                onClick={() => setEditingQuoteInline(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="duo-dialogue-quote">&quot;{activePromptText}&quot;</div>
        )}

        <button type="button" className="duo-next-dialogue-btn" onClick={handleNextPrompt}>
          <span>Siguiente diálogo</span>
          <Dashicon name="controls-forward" size={13} />
        </button>
      </div>

      {/* 5. AUDIENCIA SIMULADA EN GRILLA SIMÉTRICA 4x2 */}
      <ViewerRangeControl
        value={config.viewerRange}
        onChange={(viewerRange) => onChangeConfig({ ...config, viewerRange })}
      />

      {/* 6. AUDIO DEL INVITADO CON SWITCH REAL */}
      <div className="duo-audio-footer">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Dashicon
            name={config.guestMuted ? "controls-volumeoff" : "controls-volumeon"}
            size={15}
            color={config.guestMuted ? "#94A3B8" : "#10B981"}
          />
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#F1F5F9" }}>
            {config.guestMuted ? "Audio muteado" : "Audio del invitado"}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 2, height: 14 }}>
            {[1, 2, 3, 4].map((i) => (
              <span
                key={i}
                style={{
                  width: 3,
                  height: config.isGuestSpeaking && !config.guestMuted ? `${i * 2 + 4}px` : "4px",
                  backgroundColor: config.isGuestSpeaking && !config.guestMuted ? "#10B981" : "#475569",
                  borderRadius: 2,
                  transition: "height 0.15s ease",
                }}
              />
            ))}
          </div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={!config.guestMuted}
          aria-label="Activar audio del invitado"
          className={`switchy-toggle compact-switch ${!config.guestMuted ? "active-green" : ""}`}
          onClick={() => onChangeConfig({ ...config, guestMuted: !config.guestMuted })}
        >
          <div className="switchy-thumb" />
        </button>
      </div>

      {onClose && (
        <button type="button" className="pill-ctrl-button" style={{ width: "100%", justifyContent: "center" }} onClick={onClose}>
          Cerrar Panel
        </button>
      )}
    </div>
  );
}

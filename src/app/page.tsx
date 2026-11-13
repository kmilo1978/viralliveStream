"use client";

import {
  createDecartClient,
  models,
  resolveFpsNumber,
  type RealTimeClient,
} from "@decartai/sdk";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ObsAlertsPanel } from "@/components/ObsAlertsPanel";
import { QueueClipsPanel } from "@/components/QueueClipsPanel";
import { SkinsStudioPanel } from "@/components/SkinsStudioPanel";
import { VoiceFinancePanel } from "@/components/VoiceFinancePanel";
import { TikTokBrandedStudioPanel } from "@/components/TikTokBrandedStudioPanel";
import { PlaylistStreamingPanel } from "@/components/PlaylistStreamingPanel";
import { UnifiedLiveChatPanel, UnifiedLiveChatProvider } from "@/components/UnifiedLiveChatPanel";
import { ScheduleLivePanel } from "@/components/ScheduleLivePanel";
import { SettingsStudioPanel } from "@/components/SettingsStudioPanel";
import { WhatsAppStudioPanel } from "@/components/WhatsAppStudioPanel";
import { RealFeelLiveChatOverlay } from "@/components/RealFeelLiveChatOverlay";
import { getFaceAvatarUrl } from "@/lib/avatar-helper";
import { GuestSplitScreenPanel, type GuestSplitScreenConfig } from "@/components/GuestSplitScreenPanel";
import { VirtualCameraGuideTable } from "@/components/VirtualCameraGuideTable";
import { StreamConfigModal } from "@/components/StreamConfigModal";
import { ViewerRangeControl } from "@/components/ViewerRangeControl";
import { Dashicon, type DashiconName } from "@/components/Dashicons";
import { ViraliveLogo } from "@/components/ViraliveLogo";
import { CamStyleThumb } from "@/components/CamStyleThumb";
import { PlatformLogo, SocialIcon, type SocialNetworkName } from "@/components/PlatformLogos";
import {
  DEFAULT_SAFE_PROMPT,
  OFFICIAL_PROMPT_PRESETS,
  REFERENCE_SWAP_PROMPT,
  SPIKE_MODELS,
  type PromptPreset,
  type AiEngineProvider,
  REALTIME_FACE_ENGINES,
  type SpikeRealtimeModelId,
} from "@/lib/models";
import {
  dataUrlToFile,
  moderatePromptForDecart,
  type SavedSkinPreset,
  type UsageLedgerEntry,
  EXPLORE_CATALOG_ITEMS,
  CAM_STYLE_PRESETS,
  CAM_VFX_PRESETS,
  getCamStyleGroup,
  type CamStyleGroup,
  DELULU_BUILDER_SECTIONS,
  DELULU_WARDROBE_SECTIONS,
  WARDROBE_RANDOM_OUTFIT_PRESETS,
  DELULU_ACCESSORIES_SECTIONS,
  ACCESSORIES_RANDOM_PRESETS,
  type BuilderChipSection,
  type WardrobePresetIdea,
  type ExploreCardItem,
  DEFAULT_TRYON_CAROUSEL,
  type TryOnGarmentItem,
  DEFAULT_ACTION_BUTTONS,
  type CustomActionButton,
  type ButtonSize,
  type ButtonPlacement,
  type ButtonActionType,
  DEFAULT_VIRTUAL_BACKGROUNDS,
  type VirtualBackgroundItem,
  DEFAULT_SCHEDULED_OVERLAYS,
  type ScheduledOverlayItem,
  type OverlayPosition,
  type OverlayAnimation,
  RECORDING_RESOLUTIONS,
  type RecordingResolution,
  DEFAULT_TELEPROMPTER_SCRIPT,
  DEFAULT_MULTISTREAM_DESTINATIONS,
  type MultistreamDestination,
  ALL_45_MULTISTREAM_PLATFORMS,
  DEFAULT_SHOPPABLE_PRODUCTS,
  type ShoppableProductItem,
  type ShoppableProductPosition,
  type ShoppableScheduleMode,
  type CurrencyOption,
  DEFAULT_TIKTOK_BRAND_THEMES,
  type TikTokBrandTheme,
  type UnifiedChatMessage,
  type PlaylistStreamingItem,
  type ScheduledLiveEvent,
  DEFAULT_WHATSAPP_CONFIG,
  type WhatsAppConfig,
  DEFAULT_GUEST_PRESETS,
  DEFAULT_VIEWER_RANGES,
  type ViewerRangeOption,
  type GuestSimItem,
} from "@/lib/studio-data";
import { generateQrCodeDataUrl } from "@/lib/qr-helper";
import {
  BrowserVideoPreprocessor,
  type CropAspectMode,
  type VideoPreprocessorOptions,
} from "@/lib/video-preprocessor";

declare global {
  interface Window {
    __spikeOutputStream?: MediaStream | null;
  }
}

type MainNavigationTab =
  | "CAM"
  | "TRY_ON"
  | "DUO"
  | "CLIPS"
  | "TIKTOK_LIVE"
  | "EXPLORE"
  | "CREATE"
  | "PRO"
  | "SETTINGS";

const MAIN_NAV_ITEMS: {
  id: MainNavigationTab;
  group: "live" | "studio" | "system";
  label: string;
  shortLabel: string;
  drawerLabel: string;
  icon: DashiconName;
  badge?: string;
}[] = [
  { id: "CAM", group: "live", label: "CAM", shortLabel: "CAM", drawerLabel: "CAM · Cabina en Vivo", icon: "video-alt3" },
  { id: "TRY_ON", group: "live", label: "TRY ON", shortLabel: "TRY ON", drawerLabel: "TRY ON · Probador Virtual", icon: "products" },
  { id: "DUO", group: "live", label: "DÚO", shortLabel: "DÚO", drawerLabel: "DÚO · Pantalla Dividida", icon: "groups" },
  { id: "CLIPS", group: "live", label: "CLIPS PREGRABADOS", shortLabel: "CLIPS", drawerLabel: "CLIPS · Videos Pregrabados", icon: "video-alt2" },
  { id: "TIKTOK_LIVE", group: "live", label: "TIKTOK CON MARCAS", shortLabel: "TIKTOK", drawerLabel: "TIKTOK · Live con Marcas", icon: "smartphone" },
  { id: "EXPLORE", group: "studio", label: "EXPLORE", shortLabel: "EXPLORE", drawerLabel: "EXPLORE · Catálogo IA", icon: "search" },
  { id: "CREATE", group: "studio", label: "CREATE", shortLabel: "CREATE", drawerLabel: "CREATE · Crear Personaje", icon: "edit" },
  { id: "PRO", group: "studio", label: "MODULOS PRO", shortLabel: "PRO", drawerLabel: "MÓDULOS PRO · Redes & Chat", icon: "star-filled", badge: "PRO" },
  { id: "SETTINGS", group: "system", label: "CONFIGURACIÓN", shortLabel: "AJUSTES", drawerLabel: "CONFIGURACIÓN · APIs, OBS y Docs", icon: "admin-generic" },
];

type BuilderDraftCategory = "outfit" | "props";
const CREATE_CATEGORY_CONFIG: Record<
  BuilderDraftCategory,
  {
    promptLabel: string;
    promptPlaceholder: string;
    sections: BuilderChipSection[];
    presets: WardrobePresetIdea[];
    emptyHint: string;
    resultAlt: string;
    downloadName: string;
    camBtnLabel: string;
    camPromptPrefix: string;
    randomTitle: string;
    clearTitle: string;
    ledgerPrefix: string;
  }
> = {
  outfit: {
    promptLabel: "DESCRIBE YOUR OUTFIT",
    promptPlaceholder: "A glowing techwear jacket with neon trim and oversized hood...",
    sections: DELULU_WARDROBE_SECTIONS,
    presets: WARDROBE_RANDOM_OUTFIT_PRESETS,
    emptyHint:
      "Selecciona tipo de prenda, color, material, estilo, corte y detalles o añade notas en Custom Additions y pulsa CREATE.",
    resultAlt: "Vestuario generado",
    downloadName: "vestuario-decart.png",
    camBtnLabel: "USAR EN CAM",
    camPromptPrefix: "Dress the person in:",
    randomTitle: "Generar idea de vestuario",
    clearTitle: "Limpiar vestuario",
    ledgerPrefix: "Wardrobe",
  },
  props: {
    promptLabel: "DESCRIBE YOUR ACCESSORY",
    promptPlaceholder: "A floating crystal pendant with sparkling magical aura...",
    sections: DELULU_ACCESSORIES_SECTIONS,
    presets: ACCESSORIES_RANDOM_PRESETS,
    emptyHint:
      "Selecciona tipo de accesorio, color, material, tamaño, estilo y efectos o añade notas en Custom Additions y pulsa CREATE.",
    resultAlt: "Accesorio generado",
    downloadName: "accesorio-decart.png",
    camBtnLabel: "USAR ACCESORIO EN CAM",
    camPromptPrefix: "Add this accessory to the person in the scene:",
    randomTitle: "Generar idea de accesorio",
    clearTitle: "Limpiar accesorio",
    ledgerPrefix: "Accessory",
  },
};
type ProSubTab =
  | "playlist_stream"
  | "unified_chat"
  | "schedule_live"
  | "obs_alerts"
  | "voice_finance";
type StudioDockTab =
  | "backgrounds"
  | "shopping"
  | "banners"
  | "teleprompter"
  | "deck"
  | "recording"
  | "chat"
  | "whatsapp";
type SourceMode = "camera" | "video_file";

type AccountStatusState = {
  loading: boolean;
  error: string | null;
  credits: number | null;
  quotaLimit: number | null;
  quotaActive: number | null;
};

type LiveTelemetry = {
  connectionState: string;
  billedSeconds: number;
  ttffMs: number | null;
  g2gMs: number | null;
  rttMs: number | null;
  fpsOut: number | null;
  qualityVerdict: string | null;
  limitingFactor: string | null;
};

const SKINS_STORAGE_KEY = "miplataformastream.skins.v1";
const LEDGER_STORAGE_KEY = "miplataformastream.usageLedger.v1";

const DEFAULT_PREPROC: VideoPreprocessorOptions = {
  fps: 30,
  mirror: false,
  freeze: false,
  cropMode: "16:9",
};

export default function StudioDeluluPage() {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const recordedVideoRef = useRef<HTMLVideoElement | null>(null);
  const refFileInputRef = useRef<HTMLInputElement | null>(null);
  const createFileInputRef = useRef<HTMLInputElement | null>(null);

  const realtimeClientRef = useRef<RealTimeClient | null>(null);
  const rawStreamRef = useRef<MediaStream | null>(null);
  const preprocRef = useRef<BrowserVideoPreprocessor | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioAnalyserRef = useRef<AnalyserNode | null>(null);
  const audioRafRef = useRef<number | null>(null);

  const alertRestoreTimerRef = useRef<number | null>(null);
  const baseStateBeforeAlertRef = useRef<{ prompt: string; image: File | null } | null>(null);

  // Navegación principal viralive.app
  const [activeTab, setActiveTab] = useState<MainNavigationTab>("CAM");
  const [proSubTab, setProSubTab] = useState<ProSubTab>("playlist_stream");
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const mobileMenuBtnRef = useRef<HTMLButtonElement | null>(null);
  const [activeTikTokTheme, setActiveTikTokTheme] = useState<TikTokBrandTheme | null>(null);
  const [pinnedChatMessage, setPinnedChatMessage] = useState<UnifiedChatMessage | null>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && mobileMenuOpen) {
        setMobileMenuOpen(false);
        mobileMenuBtnRef.current?.focus();
      }
    };
    const onResize = () => {
      if (window.innerWidth >= 768 && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
    };
  }, [mobileMenuOpen]);

  // Dock de CAM y Filtro de Cabina Try-On
  const [dockCategory, setDockCategory] = useState<"Persona" | "Ropa" | "Estilo" | "Edicion">("Persona");
  const [camStyleSearch, setCamStyleSearch] = useState<string>("");
  const [camStyleGroup, setCamStyleGroup] = useState<"Todos" | CamStyleGroup>("Todos");
  const [layersExpanded, setLayersExpanded] = useState<boolean>(false);
  const [lastActionFeedback, setLastActionFeedback] = useState<{ badge: string; text: string } | null>(null);
  const [monitorInView, setMonitorInView] = useState<boolean>(true);
  const stageHeroRef = useRef<HTMLElement | null>(null);
  const [tryOnCatFilter, setTryOnCatFilter] = useState<"Todo" | "Casual" | "Elegante" | "Personalizada">("Todo");
  const [selectedPresetId, setSelectedPresetId] = useState<string>("ref-swap");
  const [splitView, setSplitView] = useState<boolean>(false);
  const [streamerMode, setStreamerMode] = useState<boolean>(false);
  const [showObsModal, setShowObsModal] = useState<boolean>(false);

  // Audio VU meter (0 a 100)
  const [vuLevel, setVuLevel] = useState<number>(0);

  // Control de fuentes
  const [sourceMode, setSourceMode] = useState<SourceMode>("camera");
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedAudioId, setSelectedAudioId] = useState<string>("");
  const [localVideoFileUrl, setLocalVideoFileUrl] = useState<string | null>(null);
  const [localVideoFileName, setLocalVideoFileName] = useState<string | null>(null);
  const [sourceError, setSourceError] = useState<string | null>(null);

  // Parámetros de IA
  const [selectedModelId, setSelectedModelId] = useState<SpikeRealtimeModelId>("lucy-2.6");
  const [activeAiEngine, setActiveAiEngine] = useState<AiEngineProvider>("decart");
  const [promptText, setPromptText] = useState<string>(REFERENCE_SWAP_PROMPT);
  const [refImageFile, setRefImageFile] = useState<File | null>(null);
  const [refImageDataUrl, setRefImageDataUrl] = useState<string | null>(null);
  const [enhancePrompt, setEnhancePrompt] = useState<boolean>(false);
  const [useFastMode, setUseFastMode] = useState<boolean>(false);
  const [maxDurationSec, setMaxDurationSec] = useState<number>(30);
  const [includeAudio, setIncludeAudio] = useState<boolean>(false);
  const [listenRemoteAudio, setListenRemoteAudio] = useState<boolean>(false);
  const [mirrorInput, setMirrorInput] = useState<boolean>(false);
  const [preprocOpts, setPreprocOpts] = useState<VideoPreprocessorOptions>(DEFAULT_PREPROC);

  // Carrusel Try-On (hasta 10 prendas estilo espejo)
  const TRYON_STORAGE_KEY = "miplataformastream.tryonGarments.v1";
  const [tryOnGarments, setTryOnGarments] = useState<TryOnGarmentItem[]>(DEFAULT_TRYON_CAROUSEL);
  const [selectedGarmentId, setSelectedGarmentId] = useState<string | null>(null);
  const [showTryOnCarousel, setShowTryOnCarousel] = useState<boolean>(true);
  const tryOnUploadInputRef = useRef<HTMLInputElement | null>(null);

  // Fondos Virtuales (Chroma Key & Escenarios)
  const BG_STORAGE_KEY = "miplataformastream.virtualBackgrounds.v2";
  const [virtualBackgrounds, setVirtualBackgrounds] = useState<VirtualBackgroundItem[]>(DEFAULT_VIRTUAL_BACKGROUNDS);
  const [selectedBgId, setSelectedBgId] = useState<string>("bg-none");
  const bgUploadInputRef = useRef<HTMLInputElement | null>(null);
  const bgVideoUploadInputRef = useRef<HTMLInputElement | null>(null);

  // Botonera de acciones personalizadas (Stream Deck)
  const BUTTONS_STORAGE_KEY = "miplataformastream.customActionButtons.v1";
  const [actionButtons, setActionButtons] = useState<CustomActionButton[]>(DEFAULT_ACTION_BUTTONS);
  const [showAddButtonModal, setShowAddButtonModal] = useState<boolean>(false);
  const [editingButtonId, setEditingButtonId] = useState<string | null>(null);
  const [newBtnLabel, setNewBtnLabel] = useState<string>("");
  const [newBtnIcon, setNewBtnIcon] = useState<string>("⚡");
  const [newBtnColor, setNewBtnColor] = useState<string>("#8B5CF6");
  const [newBtnType, setNewBtnType] = useState<ButtonActionType>("prompt");
  const [newBtnPayload, setNewBtnPayload] = useState<string>("");
  const [newBtnUrl, setNewBtnUrl] = useState<string>("");
  const [newBtnSize, setNewBtnSize] = useState<ButtonSize>("md");
  const [newBtnPlacement, setNewBtnPlacement] = useState<ButtonPlacement>("deck");
  const [newBtnImageUrl, setNewBtnImageUrl] = useState<string>("");
  const [deckFilterPlacement, setDeckFilterPlacement] = useState<"all" | "deck" | "screen">("all");
  const btnImageUploadInputRef = useRef<HTMLInputElement | null>(null);

  // Logos y Banners Programados en Pantalla
  const OVERLAYS_STORAGE_KEY = "miplataformastream.scheduledOverlays.v1";
  const [scheduledOverlays, setScheduledOverlays] = useState<ScheduledOverlayItem[]>(DEFAULT_SCHEDULED_OVERLAYS.map((o) => ({ ...o, enabled: false })));
  const [overlayTick, setOverlayTick] = useState<number>(0);
  const [showAddBannerModal, setShowAddBannerModal] = useState<boolean>(false);
  const [newBannerName, setNewBannerName] = useState<string>("");
  const [newBannerImageUrl, setNewBannerImageUrl] = useState<string>("");
  const [newBannerTargetUrl, setNewBannerTargetUrl] = useState<string>("");
  const [newBannerText, setNewBannerText] = useState<string>("");
  const [newBannerCopyText, setNewBannerCopyText] = useState<string>("");
  const [copiedBannerId, setCopiedBannerId] = useState<string | null>(null);
  const [newBannerPosition, setNewBannerPosition] = useState<OverlayPosition>("top-right");
  const [newBannerSize, setNewBannerSize] = useState<number>(22);
  const [newBannerOpacity, setNewBannerOpacity] = useState<number>(0.9);
  const [newBannerMode, setNewBannerMode] = useState<"permanent" | "timed_cycle">("timed_cycle");
  const [newBannerIntervalSec, setNewBannerIntervalSec] = useState<number>(30);
  const [newBannerDurationSec, setNewBannerDurationSec] = useState<number>(10);
  const [newBannerAnim, setNewBannerAnim] = useState<OverlayAnimation>("slide");
  const bannerUploadInputRef = useRef<HTMLInputElement | null>(null);

  // Grabación de Video en Cabina y Selección de Resolución
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [recordingResolution, setRecordingResolution] = useState<RecordingResolution>("720p");
  const startRecordingRef = useRef<() => void>(() => {});
  const stopRecordingRef = useRef<() => void>(() => {});
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Teleprompter / Guion en Pantalla (Estilo OneStream Live - HUD Privado Exclusivo del Streamer)
  const [teleprompterActive, setTeleprompterActive] = useState<boolean>(false);
  const [teleprompterScript, setTeleprompterScript] = useState<string>(DEFAULT_TELEPROMPTER_SCRIPT);
  const [teleprompterSpeed, setTeleprompterSpeed] = useState<number>(2);
  const [teleprompterFontSize, setTeleprompterFontSize] = useState<number>(20);
  const [teleprompterPlaying, setTeleprompterPlaying] = useState<boolean>(false);
  const [teleprompterScrollY, setTeleprompterScrollY] = useState<number>(0);
  const [teleprompterMirror, setTeleprompterMirror] = useState<boolean>(false);
  const [teleprompterPosition, setTeleprompterPosition] = useState<"top" | "center" | "dock">("top");
  const [teleprompterOpacity, setTeleprompterOpacity] = useState<number>(0.75);

  // Importación de archivos (.TXT, .PDF) y gestión de guiones largos
  const [isScriptEditorExpanded, setIsScriptEditorExpanded] = useState<boolean>(false);
  const [scriptInsertMode, setScriptInsertMode] = useState<"replace" | "append">("replace");
  const [isParsingPdf, setIsParsingPdf] = useState<boolean>(false);
  const txtFileInputRef = useRef<HTMLInputElement | null>(null);
  const pdfFileInputRef = useRef<HTMLInputElement | null>(null);

  // Multistreaming a 45+ Plataformas (Estilo OneStream Live)
  const MULTISTREAM_STORAGE_KEY = "miplataformastream.multistreamDestinations.v1";
  const [multistreamDestinations, setMultistreamDestinations] = useState<MultistreamDestination[]>(DEFAULT_MULTISTREAM_DESTINATIONS);
  const [showMultistreamModal, setShowMultistreamModal] = useState<boolean>(false);
  const [showAll45PlatformsList, setShowAll45PlatformsList] = useState<boolean>(false);
  const [editingStreamKeyDestId, setEditingStreamKeyDestId] = useState<string | null>(null);

  // Shoppable Product Cards (Tarjetas de Productos Comprables en Vivo)
  const PRODUCTS_STORAGE_KEY = "miplataformastream.shoppableProducts.v1";
  const [shoppableProducts, setShoppableProducts] = useState<ShoppableProductItem[]>(DEFAULT_SHOPPABLE_PRODUCTS);
  const [activeProductId, setActiveProductId] = useState<string | null>(null);
  const [showProductModal, setShowProductModal] = useState<boolean>(false);
  const [showProductCatalogModal, setShowProductCatalogModal] = useState<boolean>(false);

  // WhatsApp en Vivo (QR, Número y Agente IA)
  const WHATSAPP_STORAGE_KEY = "miplataformastream.whatsappConfig.v1";
  const [whatsappConfig, setWhatsappConfig] = useState<WhatsAppConfig>(DEFAULT_WHATSAPP_CONFIG);
  const [showWhatsAppBubblePopover, setShowWhatsAppBubblePopover] = useState<boolean>(false);

  // Personalización de idioma de comentarios y chat IA: "es" | "en" | "both" (Español por defecto)
  const CHAT_LANGUAGE_STORAGE_KEY = "miplataformastream.chatLanguage.v1";
  const [chatLanguage, setChatLanguage] = useState<"es" | "en" | "both">("es");

  // Formulario nuevo producto
  const [newProdTitle, setNewProdTitle] = useState<string>("");
  const [newProdSubtitle, setNewProdSubtitle] = useState<string>("");
  const [newProdLink, setNewProdLink] = useState<string>("https://onestream.live/shop/headphones");
  const [newProdCurrency, setNewProdCurrency] = useState<CurrencyOption>("USD");
  const [newProdPrice, setNewProdPrice] = useState<string>("49.99");
  const [newProdComparePrice, setNewProdComparePrice] = useState<string>("59.99");
  const [newProdImageUrl, setNewProdImageUrl] = useState<string>("/products/headphones.jpg");
  const [newProdPosition, setNewProdPosition] = useState<ShoppableProductPosition>("bottom-center");
  const productUploadInputRef = useRef<HTMLInputElement | null>(null);

  // Programación y Ubicación de Live Shopping (Manual, Intervalo o # de veces con 3 Espacios en Pantalla)
  const [liveShopScheduleMode, setLiveShopScheduleMode] = useState<ShoppableScheduleMode>("manual");
  const [liveShopIntervalMinutes, setLiveShopIntervalMinutes] = useState<number>(2);
  const [liveShopDisplaySeconds, setLiveShopDisplaySeconds] = useState<number>(15);
  const [liveShopRepeatCount, setLiveShopRepeatCount] = useState<number>(3);
  const [liveShopCurrentCount, setLiveShopCurrentCount] = useState<number>(0);
  const [liveShopNextCountdown, setLiveShopNextCountdown] = useState<number>(0);
  const [liveShopStatusText, setLiveShopStatusText] = useState<string>("");
  const [liveShopGlobalPosition, setLiveShopGlobalPosition] = useState<ShoppableProductPosition>("bottom-center");

  // UX Limpia y Distribución de Funcionalidades en CAM (abre Chat IA con Agente IA en derecha por defecto)
  const [activeStudioTab, setActiveStudioTab] = useState<StudioDockTab>("chat");
  const [isDockStackedView, setIsDockStackedView] = useState<boolean>(false);

  // Límite de elementos activos en pantalla (Máximo 4 simultáneos para permitir dúo + chat + shopping + fondo)
  const MAX_ONSCREEN_ELEMENTS = 4;
  const [limitWarningMessage, setLimitWarningMessage] = useState<string | null>(null);

  // Split Screen & Invitado Co-Host (Dúo / Batalla PK)
  const [guestSplitConfig, setGuestSplitConfig] = useState<GuestSplitScreenConfig>({
    active: false,
    layout: "vertical",
    selectedGuest: DEFAULT_GUEST_PRESETS[0],
    currentPromptIndex: 0,
    autoRotatePrompts: false,
    guestMuted: true,
    guestVolume: 80,
    viewerRange: DEFAULT_VIEWER_RANGES[6], // 49K-51K (50.7K)
    isGuestSpeaking: false,
  });
  const [realFeelChatEnabled, setRealFeelChatEnabled] = useState<boolean>(false);
  const [underMonitorChatText, setUnderMonitorChatText] = useState<string>("");
  const [underMonitorChatPush, setUnderMonitorChatPush] = useState<{ nonce: number; text: string } | null>(null);
  const underMonitorNonceRef = useRef<number>(1);

  const handleSendUnderMonitorChat = useCallback(
    (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      const text = underMonitorChatText.trim();
      if (!text) return;
      setRealFeelChatEnabled(true);
      setUnderMonitorChatPush({
        nonce: underMonitorNonceRef.current++,
        text,
      });
      setUnderMonitorChatText("");
    },
    [underMonitorChatText],
  );
  const [phoneFrameMode, setPhoneFrameMode] = useState<boolean>(false);
  const [phoneMockupMode, setPhoneMockupMode] = useState<boolean>(true);
  const [mobileViewScale, setMobileViewScale] = useState<"md" | "lg" | "xl">("lg"); // Escala de la versión móvil ("md": 400px, "lg": 480px, "xl": 560px)
  const [isMobileViewport, setIsMobileViewport] = useState<boolean>(false);
  const [showStreamConfigModal, setShowStreamConfigModal] = useState<boolean>(false);
  const [streamerName, setStreamerName] = useState<string>("Maddy");

  // Previsualización de Fondos en el momento sin gastar créditos
  const [bgPreviewEnabled, setBgPreviewEnabled] = useState<boolean>(false);
  const [bgPreviewMode, setBgPreviewMode] = useState<"backdrop" | "pip_camera">("pip_camera");
  const [screenButtonsVisible, setScreenButtonsVisible] = useState<boolean>(false);
  const [hudLiveVisible, setHudLiveVisible] = useState<boolean>(false);
  const [showPhoneHudBar, setShowPhoneHudBar] = useState<boolean>(false);
  const [showPhoneAmbientFx, setShowPhoneAmbientFx] = useState<boolean>(false);
  const [showPhoneMockupBottomDock, setShowPhoneMockupBottomDock] = useState<boolean>(false);

  const effectiveCropMode: CropAspectMode = isMobileViewport ? "9:16" : preprocOpts.cropMode;
  const showPhoneMockupFrame = !isMobileViewport && phoneMockupMode && effectiveCropMode === "9:16";
  const isCockpitTab =
    activeTab === "CAM" ||
    activeTab === "TRY_ON" ||
    activeTab === "DUO" ||
    activeTab === "CLIPS" ||
    activeTab === "TIKTOK_LIVE";
  const isDuoSplitActive = Boolean(guestSplitConfig.active || splitView);
  const splitChatComposerToLeftInDuo = activeTab === "DUO" && !isMobileViewport && activeStudioTab === "chat";
  const isHostVideoFileActive = sourceMode === "video_file" && Boolean(localVideoFileUrl);
  const isGuestVideoFileActive =
    Boolean(guestSplitConfig.customVideoUrl) &&
    (guestSplitConfig.guestSourceMode ?? "video_file") === "video_file";
  const selectedGarmentObj = tryOnGarments.find((g) => g.id === selectedGarmentId) || null;
  const filteredTryOnGarments = useMemo(() => {
    if (tryOnCatFilter === "Todo") return tryOnGarments;
    if (tryOnCatFilter === "Personalizada") {
      return tryOnGarments.filter((g) => g.isCustom || g.category === "Personalizada");
    }
    if (tryOnCatFilter === "Casual") {
      return tryOnGarments.filter((g) => ["Casual", "Urbano", "Western"].includes(g.category));
    }
    return tryOnGarments.filter((g) => ["Elegante", "Fantasía"].includes(g.category));
  }, [tryOnCatFilter, tryOnGarments]);

  const navigateToMainTab = useCallback(
    (tab: MainNavigationTab) => {
      setMobileMenuOpen(false);
      if (tab === "TRY_ON") {
        setActiveTab("TRY_ON");
        setSelectedModelId("lucy-vton-3.6");
        setGuestSplitConfig((prev) => ({ ...prev, active: false }));
        setSplitView(false);
        setActiveStudioTab("backgrounds");
        const garment = tryOnGarments.find((g) => g.id === selectedGarmentId) || tryOnGarments[0];
        if (garment && !selectedGarmentId) {
          setSelectedGarmentId(garment.id);
          setPromptText(garment.prompt);
        }
        return;
      }
      if (tab === "DUO") {
        setActiveTab("DUO");
        setGuestSplitConfig((prev) => ({ ...prev, active: false }));
        setSplitView(false);
        setActiveStudioTab("chat");
        return;
      }
      if (tab === "CLIPS") {
        setActiveTab("CLIPS");
        setGuestSplitConfig((prev) => ({ ...prev, active: false }));
        setSplitView(false);
        return;
      }
      if (tab === "TIKTOK_LIVE") {
        setActiveTab("TIKTOK_LIVE");
        setGuestSplitConfig((prev) => ({ ...prev, active: false }));
        setSplitView(false);
        setPreprocOpts((prev) => ({ ...prev, cropMode: "9:16" }));
        setPhoneMockupMode(true);
        if (!activeTikTokTheme) {
          setActiveTikTokTheme(DEFAULT_TIKTOK_BRAND_THEMES[0]);
        }
        return;
      }
      if (tab === "CAM") {
        if (activeTab === "DUO") {
          setGuestSplitConfig((prev) => ({ ...prev, active: false }));
          setSplitView(false);
        }
        if (activeTab === "TRY_ON" && selectedModelId === "lucy-vton-3.6") {
          setSelectedModelId("lucy-2.6");
        }
        setActiveTab("CAM");
        return;
      }
      setActiveTab(tab);
    },
    [activeTab, selectedGarmentId, selectedModelId, tryOnGarments],
  );

  // Estado de sesión y telemetría
  const [streamBusy, setStreamBusy] = useState<boolean>(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [streamInfo, setStreamInfo] = useState<string | null>(null);
  const [subscribeToken, setSubscribeToken] = useState<string | null>(null);

  const [telemetry, setTelemetry] = useState<LiveTelemetry>({
    connectionState: "desconectado",
    billedSeconds: 0,
    ttffMs: null,
    g2gMs: null,
    rttMs: null,
    fpsOut: null,
    qualityVerdict: null,
    limitingFactor: null,
  });

  const [account, setAccount] = useState<AccountStatusState>({
    loading: false,
    error: null,
    credits: null,
    quotaLimit: null,
    quotaActive: null,
  });

  // Local storage
  const [savedSkins, setSavedSkins] = useState<SavedSkinPreset[]>([]);
  const [skinSearchQuery, setSkinSearchQuery] = useState<string>("");
  const [skinCategoryFilter, setSkinCategoryFilter] = useState<string>("all");
  const filteredSkins = useMemo(() => {
    return savedSkins.filter((s) => {
      if (skinCategoryFilter !== "all" && s.category !== skinCategoryFilter) return false;
      if (skinSearchQuery.trim()) {
        const q = skinSearchQuery.toLowerCase();
        return (
          s.name.toLowerCase().includes(q) ||
          s.prompt.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [savedSkins, skinCategoryFilter, skinSearchQuery]);
  const [usageLedger, setUsageLedger] = useState<UsageLedgerEntry[]>([]);

  // EXPLORE Workspace
  const [exploreCategory, setExploreCategory] = useState<"All" | "Characters" | "Outfits" | "Props">("All");
  const [exploreSearch, setExploreSearch] = useState<string>("");
  const [exploreNsfw, setExploreNsfw] = useState<boolean>(false);
  const [exploreToast, setExploreToast] = useState<string | null>(null);
  const [userExploreItems, setUserExploreItems] = useState<ExploreCardItem[]>([]);
  const [showUploadExploreModal, setShowUploadExploreModal] = useState<boolean>(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadAuthor, setUploadAuthor] = useState("Camilo");
  const [uploadCategory, setUploadCategory] = useState<"Characters" | "Outfits" | "Props">("Characters");
  const [uploadPrompt, setUploadPrompt] = useState(
    "Substitute the character in the video with a stylish protagonist, cinematic studio lighting.",
  );
  const [uploadModelId, setUploadModelId] = useState<"lucy-2.6" | "lucy-restyle-2" | "lucy-vton-3.6">("lucy-2.6");
  const [uploadCoverDataUrl, setUploadCoverDataUrl] = useState<string | null>(null);
  const [uploadIsNsfw, setUploadIsNsfw] = useState(false);
  const [uploadBadge, setUploadBadge] = useState("PROPIO");

  // CREATE Workspace (Delulu Builder: Characters, Wardrobe, Accessories & Saved Skins)
  const [createMode, setCreateMode] = useState<"scratch" | "image">("scratch");
  const [createCategory, setCreateCategory] = useState<"person" | "outfit" | "props" | "saved_skins">("person");
  const skinUploadInputRef = useRef<HTMLInputElement | null>(null);
  const [skinSavedFeedback, setSkinSavedFeedback] = useState<boolean>(false);
  const [createPrompt, setCreatePrompt] = useState<string>(
    "A retro-futuristic space officer with chunky white visor and clean neon armor",
  );
  const [createSelectedChips, setCreateSelectedChips] = useState<Record<string, string>>({
    character_type: "HUMAN",
    style: "REALISTIC",
    outfit: "FUTURISTIC",
  });
  const [categoryDrafts, setCategoryDrafts] = useState<
    Record<
      "outfit" | "props",
      {
        prompt: string;
        chips: Record<string, string>;
        multi: string[];
        customAdditions: string;
        presetIdx: number;
      }
    >
  >({
    outfit: { prompt: "", chips: {}, multi: [], customAdditions: "", presetIdx: 0 },
    props: { prompt: "", chips: {}, multi: [], customAdditions: "", presetIdx: 0 },
  });
  const [collapsedBuilderSections, setCollapsedBuilderSections] = useState<Record<string, boolean>>({});
  const [createSourceFile, setCreateSourceFile] = useState<File | null>(null);
  const [createGenerating, setCreateGenerating] = useState<boolean>(false);
  const [createResultUrl, setCreateResultUrl] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createEngine, setCreateEngine] = useState<"gemini" | "chatgpt">("gemini");
  const [createEngineName, setCreateEngineName] = useState<string>("Google Gemini (Imagen 3)");
  const [customAiApiKey, setCustomAiApiKey] = useState<string>("");
  const [showAiKeyInput, setShowAiKeyInput] = useState<boolean>(false);

  const isLive =
    telemetry.connectionState !== "desconectado" && telemetry.connectionState !== "disconnected";
  const isConnectedLive =
    telemetry.connectionState === "connected" || telemetry.connectionState === "generating";

  const activeModelInfo = useMemo(
    () => SPIKE_MODELS.find((m) => m.id === selectedModelId) ?? SPIKE_MODELS[0],
    [selectedModelId],
  );

  const EXPLORE_STORAGE_KEY = "miplataformastream.exploreUserItems.v1";

  // Cargar persistencia
  useEffect(() => {
    try {
      const rawSkins = window.localStorage.getItem(SKINS_STORAGE_KEY);
      if (rawSkins) {
        const parsed = JSON.parse(rawSkins) as SavedSkinPreset[];
        if (Array.isArray(parsed)) setSavedSkins(parsed);
      }
      const rawLedger = window.localStorage.getItem(LEDGER_STORAGE_KEY);
      if (rawLedger) {
        const parsed = JSON.parse(rawLedger) as UsageLedgerEntry[];
        if (Array.isArray(parsed)) setUsageLedger(parsed);
      }
      const rawExplore = window.localStorage.getItem(EXPLORE_STORAGE_KEY);
      if (rawExplore) {
        const parsed = JSON.parse(rawExplore) as ExploreCardItem[];
        if (Array.isArray(parsed)) setUserExploreItems(parsed);
      }
    } catch {
      // Ignorar error de JSON local
    }
  }, []);

  const appendLedgerEntry = useCallback(
    (entry: Omit<UsageLedgerEntry, "id" | "createdAt">) => {
      const full: UsageLedgerEntry = {
        ...entry,
        id: `use_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        createdAt: new Date().toISOString(),
      };
      setUsageLedger((prev) => {
        const next = [full, ...prev].slice(0, 60);
        try {
          window.localStorage.setItem(LEDGER_STORAGE_KEY, JSON.stringify(next));
        } catch {}
        return next;
      });
    },
    [],
  );

  const refreshAccountStatus = useCallback(async () => {
    setAccount((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const res = await fetch("/api/account-status", { cache: "no-store" });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        credits?: number | null;
        quota?: { limit: number | null; active: number | null } | null;
      };
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "No fue posible consultar saldo.");
      }
      setAccount({
        loading: false,
        error: null,
        credits: typeof data.credits === "number" ? data.credits : null,
        quotaLimit: data.quota?.limit ?? null,
        quotaActive: data.quota?.active ?? null,
      });
    } catch (err) {
      setAccount((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : "Error de red al consultar saldo.",
      }));
    }
  }, []);

  useEffect(() => {
    void refreshAccountStatus();
  }, [refreshAccountStatus]);

  // Enumerar dispositivos de audio y video
  const enumerateDevices = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) return;
    try {
      const list = await navigator.mediaDevices.enumerateDevices();
      const cams = list.filter((d) => d.kind === "videoinput");
      const mics = list.filter((d) => d.kind === "audioinput");
      setCameraDevices(cams);
      setAudioDevices(mics);
      if (!selectedCameraId && cams[0]) setSelectedCameraId(cams[0].deviceId);
      if (!selectedAudioId && mics[0]) setSelectedAudioId(mics[0].deviceId);
    } catch {
      // Ignorar permisos
    }
  }, [selectedAudioId, selectedCameraId]);

  useEffect(() => {
    void enumerateDevices();
  }, [enumerateDevices]);

  // Audio VU Meter con Web Audio API
  const setupVuMeter = useCallback((stream: MediaStream) => {
    if (audioRafRef.current) {
      cancelAnimationFrame(audioRafRef.current);
      audioRafRef.current = null;
    }
    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) {
      setVuLevel(0);
      return;
    }
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = audioCtxRef.current ?? new AudioCtx();
      audioCtxRef.current = ctx;
      if (ctx.state === "suspended") void ctx.resume();

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.5;
      audioAnalyserRef.current = analyser;

      const source = ctx.createMediaStreamSource(new MediaStream([audioTrack]));
      source.connect(analyser);

      const buffer = new Uint8Array(analyser.frequencyBinCount);
      const loop = () => {
        analyser.getByteFrequencyData(buffer);
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) sum += buffer[i];
        const avg = sum / buffer.length;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        setVuLevel(normalized);
        audioRafRef.current = requestAnimationFrame(loop);
      };
      audioRafRef.current = requestAnimationFrame(loop);
    } catch {
      setVuLevel(0);
    }
  }, []);

  const tearDownVuMeter = useCallback(() => {
    if (audioRafRef.current) {
      cancelAnimationFrame(audioRafRef.current);
      audioRafRef.current = null;
    }
    setVuLevel(0);
  }, []);

  // Preprocesador de video
  const stopLocalSource = useCallback(() => {
    tearDownVuMeter();
    if (preprocRef.current) {
      preprocRef.current.dispose();
      preprocRef.current = null;
    }
    if (rawStreamRef.current) {
      rawStreamRef.current.getTracks().forEach((t) => t.stop());
      rawStreamRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
  }, [tearDownVuMeter]);

  const attachNewLocalStream = useCallback(
    async (stream: MediaStream) => {
      stopLocalSource();
      rawStreamRef.current = stream;

      const rawFps = resolveFpsNumber(models.realtime(selectedModelId).fps);
      const targetFps: 15 | 24 | 25 | 30 = rawFps === 25 ? 25 : 30;
      const opts: VideoPreprocessorOptions = {
        ...preprocOpts,
        fps: targetFps,
        mirror: mirrorInput,
      };

      const preproc = new BrowserVideoPreprocessor(stream, opts);
      preprocRef.current = preproc;
      const processedStream = preproc.getStream();
      localStreamRef.current = processedStream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = processedStream;
        await localVideoRef.current.play().catch(() => {});
      }

      setupVuMeter(stream);
    },
    [mirrorInput, preprocOpts, selectedModelId, setupVuMeter, stopLocalSource],
  );

  // Iniciar cámara
  const startCamera = useCallback(async () => {
    setSourceError(null);
    setSourceMode("camera");
    try {
      const spec = models.realtime(selectedModelId);
      const rawFps = resolveFpsNumber(spec.fps);
      const targetFps: 15 | 24 | 25 | 30 = rawFps === 25 ? 25 : 30;
      const constraints: MediaStreamConstraints = {
        video: selectedCameraId
          ? {
              deviceId: { exact: selectedCameraId },
              width: { ideal: spec.width },
              height: { ideal: spec.height },
              frameRate: { ideal: targetFps, max: targetFps },
            }
          : {
              width: { ideal: spec.width },
              height: { ideal: spec.height },
              frameRate: { ideal: targetFps, max: targetFps },
            },
        audio: includeAudio
          ? selectedAudioId
            ? {
                deviceId: { exact: selectedAudioId },
                echoCancellation: true,
                noiseSuppression: true,
              }
            : { echoCancellation: true, noiseSuppression: true }
          : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      await attachNewLocalStream(stream);
      void enumerateDevices();
    } catch (err) {
      setSourceError(
        err instanceof Error
          ? `No se pudo abrir la cámara: ${err.message}. Verifica permisos.`
          : "Error abriendo cámara.",
      );
    }
  }, [attachNewLocalStream, enumerateDevices, includeAudio, selectedAudioId, selectedCameraId, selectedModelId]);

  // Iniciar video pregrabado
  const handleVideoFileSelected = useCallback(
    (file: File | null) => {
      if (!file) return;
      setSourceError(null);
      stopLocalSource();
      if (localVideoFileUrl) URL.revokeObjectURL(localVideoFileUrl);
      setLocalVideoFileUrl(URL.createObjectURL(file));
      setLocalVideoFileName(file.name);
      setSourceMode("video_file");
    },
    [localVideoFileUrl, stopLocalSource],
  );

  const captureFromVideoElement = useCallback(async () => {
    setSourceError(null);
    const el = recordedVideoRef.current as
      | (HTMLVideoElement & {
          captureStream?: (fps?: number) => MediaStream;
          webkitCaptureStream?: (fps?: number) => MediaStream;
        })
      | null;
    if (!el || !localVideoFileUrl) {
      setSourceError("Primero selecciona un archivo de video MP4 o WebM.");
      return;
    }
    try {
      el.loop = true;
      el.muted = true;
      await el.play();
      const captureFn = el.captureStream ?? el.webkitCaptureStream;
      if (typeof captureFn !== "function") {
        throw new Error("Tu navegador no soporta captureStream.");
      }
      const rawFps = resolveFpsNumber(models.realtime(selectedModelId).fps);
      const stream = captureFn.call(el, rawFps);

      // Si el audio está habilitado, capturamos el micrófono del usuario y lo mezclamos con el video
      if (includeAudio) {
        try {
          const micStream = await navigator.mediaDevices.getUserMedia({
            audio: selectedAudioId
              ? { deviceId: { exact: selectedAudioId }, echoCancellation: true, noiseSuppression: true }
              : { echoCancellation: true, noiseSuppression: true },
          });
          for (const audioTrack of micStream.getAudioTracks()) {
            stream.addTrack(audioTrack);
          }
        } catch {
          // Si el micrófono no está accesible, el video pregrabado continúa
        }
      }

      await attachNewLocalStream(stream);
    } catch (err) {
      setSourceError(err instanceof Error ? err.message : "Error capturando video.");
    }
  }, [attachNewLocalStream, includeAudio, localVideoFileUrl, selectedAudioId, selectedModelId]);

  const captureSourceSnapshot = useCallback(async (): Promise<File | null> => {
    const videoEl = localVideoRef.current;
    if (!videoEl || videoEl.videoWidth === 0) return null;
    const canvas = document.createElement("canvas");
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/png"));
    if (!blob) return null;
    return new File([blob], "captura-cabina.png", { type: "image/png" });
  }, []);

  // Detener sesión en vivo
  const stopRealtime = useCallback(() => {
    if (alertRestoreTimerRef.current !== null) {
      window.clearTimeout(alertRestoreTimerRef.current);
      alertRestoreTimerRef.current = null;
    }
    baseStateBeforeAlertRef.current = null;
    if (realtimeClientRef.current) {
      realtimeClientRef.current.disconnect();
      realtimeClientRef.current = null;
    }
    remoteStreamRef.current = null;
    window.__spikeOutputStream = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (typeof BroadcastChannel !== "undefined") {
      const ch = new BroadcastChannel("spike-v0-obs");
      ch.postMessage("stream-stopped");
      ch.close();
    }
    setSubscribeToken(null);
    setTelemetry((prev) => ({
      ...prev,
      connectionState: "desconectado",
      g2gMs: null,
      rttMs: null,
      fpsOut: null,
    }));
    void refreshAccountStatus();
  }, [refreshAccountStatus]);

  // Conectar sesión en vivo con Decart WebRTC
  const startRealtime = useCallback(async () => {
    if (streamBusy) return;
    setStreamBusy(true);
    setStreamError(null);
    setStreamInfo(null);

    const targetPrompt = promptText.trim() || DEFAULT_SAFE_PROMPT;
    try {
      const mod = moderatePromptForDecart(targetPrompt);
      if (!mod.ok) throw new Error(mod.reason || "Instrucción bloqueada.");

      const videoTracks = localStreamRef.current?.getVideoTracks() ?? [];
      if (
        !localStreamRef.current ||
        videoTracks.length === 0 ||
        videoTracks.every((t) => t.readyState !== "live")
      ) {
        throw new Error("Primero enciende la cámara o carga un video pregrabado.");
      }

      if (realtimeClientRef.current) stopRealtime();

      setTelemetry({
        connectionState: "connecting",
        billedSeconds: 0,
        ttffMs: null,
        g2gMs: null,
        rttMs: null,
        fpsOut: null,
        qualityVerdict: null,
        limitingFactor: null,
      });

      const modelSpec = models.realtime(selectedModelId);
      const fastActive = useFastMode && activeModelInfo.supportsFast;
      const ratePerSec =
        fastActive && activeModelInfo.fastCreditsPerSec
          ? activeModelInfo.fastCreditsPerSec
          : activeModelInfo.decartCreditsPerSec;

      const client = createDecartClient({
        apiKeyProvider: async () => {
          const res = await fetch("/api/realtime-token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              purpose: "publish",
              modelId: selectedModelId,
              maxSessionDuration: maxDurationSec,
            }),
          });
          const data = (await res.json()) as { apiKey?: string; error?: string };
          if (!res.ok || !data.apiKey) {
            throw new Error(data.error || "Error obteniendo token de Decart.");
          }
          return data.apiKey;
        },
      });

      const rt = await client.realtime.connect(localStreamRef.current, {
        model: modelSpec,
        mirror: mirrorInput,
        speed: fastActive ? "fast" : undefined,
        retries: 2,
        capacityRetryBudgetMs: 25_000,
        onCapacityWait: ({ retryAfterMs }) => {
          setStreamInfo(
            `Capacidad ocupada en Decart. Reintentando en ${Math.round(retryAfterMs / 1000)} s...`,
          );
        },
        initialState: {
          prompt: { text: targetPrompt, enhance: enhancePrompt },
          image: refImageFile ?? undefined,
        },
        onRemoteStream: (outStream) => {
          // Si Decart retorna únicamente video IA (al ser modelo generativo visual),
          // inyectamos la pista de audio del micrófono para que tu voz se escuche
          // en el monitor local y viaje íntegra hacia OBS / Cámara Virtual.
          const localAudioTracks =
            rawStreamRef.current?.getAudioTracks() ?? localStreamRef.current?.getAudioTracks() ?? [];
          if (outStream.getAudioTracks().length === 0 && localAudioTracks.length > 0) {
            localAudioTracks.forEach((track) => {
              try {
                outStream.addTrack(track.clone());
              } catch {}
            });
          }

          remoteStreamRef.current = outStream;
          window.__spikeOutputStream = outStream;
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = outStream;
            remoteVideoRef.current.muted = !listenRemoteAudio;
            remoteVideoRef.current.volume = 1.0;
            remoteVideoRef.current.play().catch(() => {});
          }
          if (typeof BroadcastChannel !== "undefined") {
            const ch = new BroadcastChannel("spike-v0-obs");
            ch.postMessage("stream-ready");
            ch.close();
          }
        },
        onConnectionChange: (state) => {
          const normalized = state === "disconnected" ? "desconectado" : state;
          setTelemetry((prev) => ({
            ...prev,
            connectionState: normalized,
            ...(normalized === "desconectado" ? { g2gMs: null, rttMs: null, fpsOut: null } : {}),
          }));
          const activeRt = realtimeClientRef.current;
          if ((state === "connected" || state === "generating") && activeRt?.subscribeToken) {
            setSubscribeToken(activeRt.subscribeToken);
          }
        },
        onConnectionQuality: ({ quality, limitingFactor }) => {
          setTelemetry((prev) => ({ ...prev, qualityVerdict: quality, limitingFactor }));
        },
      });

      rt.on("stats", (s) => {
        setTelemetry((prev) => ({
          ...prev,
          ttffMs: s.glassToGlass?.ttffMs ?? prev.ttffMs,
          g2gMs: s.glassToGlass?.medianMs ?? null,
          rttMs:
            s.connection?.currentRoundTripTime != null
              ? Math.round(s.connection.currentRoundTripTime * 1000)
              : null,
          fpsOut: s.video?.framesPerSecond ? Math.round(s.video.framesPerSecond) : null,
        }));
      });

      rt.on("generationTick", ({ seconds }) => {
        setTelemetry((prev) => ({ ...prev, billedSeconds: seconds }));
      });

      rt.on("generationEnded", ({ seconds, reason }) => {
        setStreamInfo(`Sesión finalizada tras ${seconds} s (${reason}).`);
        if (seconds > 0) {
          const credits = seconds * ratePerSec;
          appendLedgerEntry({
            kind: "realtime",
            modelId: selectedModelId,
            detail: `Sesión en vivo (${seconds}s)`,
            decartCredits: credits,
            usdCost: Number((credits * 0.01).toFixed(2)),
            copCost: credits * 42,
          });
        }
        void refreshAccountStatus();
      });

      rt.on("sessionEnded", ({ reason }) => {
        realtimeClientRef.current = null;
        remoteStreamRef.current = null;
        window.__spikeOutputStream = null;
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
        setSubscribeToken(null);
        setStreamInfo(null);

        let friendlyReason = `Decart cerró la sesión: ${reason}.`;
        if (reason === "policy_violation") {
          friendlyReason =
            "Decart cerró la sesión por política de seguridad (policy_violation). Decart prohíbe generar celebridades reales (ej. Mbappé, futbolistas, actores), marcas protegidas, o imágenes/cámara con poca ropa o contenido sensible. Usa personajes ficticios y ropa convencional.";
        } else if (reason === "quota_exceeded") {
          friendlyReason =
            "Tu cuenta en Decart ha alcanzado el límite de saldo o cuota de tiempo disponible.";
        }
        setStreamError(friendlyReason);
        setTelemetry((prev) => ({
          ...prev,
          connectionState: "desconectado",
          g2gMs: null,
          rttMs: null,
          fpsOut: null,
        }));
        void refreshAccountStatus();
      });

      rt.on("error", (err) => {
        setStreamInfo(null);
        const msg = err.message ?? "Error en el motor de IA.";
        setStreamError(
          msg.toLowerCase().includes("copyrighted ip")
            ? `Decart rechazó el prompt por derechos de autor. Usa descripciones genéricas.`
            : `Error Decart: ${msg}`,
        );
      });

      realtimeClientRef.current = rt;
      if (rt.subscribeToken) setSubscribeToken(rt.subscribeToken);
      setStreamInfo(`En directo con tope automático de ${maxDurationSec} s.`);
      void refreshAccountStatus();
    } catch (err) {
      setTelemetry((prev) => ({
        ...prev,
        connectionState: "desconectado",
        g2gMs: null,
        rttMs: null,
        fpsOut: null,
      }));
      setStreamError(
        err instanceof Error ? err.message : "No fue posible iniciar la transmisión en vivo.",
      );
    } finally {
      setStreamBusy(false);
    }
  }, [
    activeModelInfo.decartCreditsPerSec,
    activeModelInfo.fastCreditsPerSec,
    activeModelInfo.supportsFast,
    appendLedgerEntry,
    enhancePrompt,
    maxDurationSec,
    mirrorInput,
    promptText,
    refImageFile,
    refreshAccountStatus,
    selectedModelId,
    stopRealtime,
    streamBusy,
    useFastMode,
  ]);

  // Aplicar cambios en vivo
  const applyLiveChanges = useCallback(async () => {
    const rt = realtimeClientRef.current;
    if (!rt || !rt.isConnected()) {
      void startRealtime();
      return;
    }
    const cleanPrompt = promptText.trim() || DEFAULT_SAFE_PROMPT;
    const mod = moderatePromptForDecart(cleanPrompt);
    if (!mod.ok) {
      setStreamError(mod.reason || "Prompt bloqueado.");
      return;
    }
    setStreamError(null);
    try {
      await rt.set({
        prompt: cleanPrompt,
        enhance: enhancePrompt,
        image: refImageFile ?? null,
      });
      setStreamInfo("Transformación actualizada en vivo.");
      setLastActionFeedback({ badge: "EN VIVO", text: `Ejecutado: ${cleanPrompt.slice(0, 42)}...` });
    } catch (err) {
      setStreamError(err instanceof Error ? err.message : "Error actualizando en vivo.");
    }
  }, [enhancePrompt, promptText, refImageFile, startRealtime]);

  // Selección de foto de referencia
  const handleReferenceImageSelected = useCallback(
    (file: File | null) => {
      setRefImageFile(file);
      if (!file) {
        setRefImageDataUrl(null);
        if (refFileInputRef.current) refFileInputRef.current.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => setRefImageDataUrl(e.target?.result as string);
      reader.readAsDataURL(file);

      setSelectedModelId("lucy-2.6");
      setPromptText(REFERENCE_SWAP_PROMPT);
      setSelectedPresetId("ref-swap");
      setStreamInfo("Foto cargada: motor configurado para sustitución facial y corporal.");
    },
    [],
  );

  // Selección de preset del dock
  const handleSelectPreset = useCallback(
    (preset: PromptPreset) => {
      setSelectedPresetId(preset.id);
      setPromptText(preset.prompt);
      setSelectedModelId(preset.suggestedModel);
      setLastActionFeedback({
        badge: preset.category === "VFX" ? "VFX" : preset.category,
        text: `${preset.label} listo (${preset.suggestedModel})`,
      });

      if (preset.requiresReferenceImage) {
        if (!refImageFile && refFileInputRef.current) {
          refFileInputRef.current.click();
        }
      } else {
        setRefImageFile(null);
        setRefImageDataUrl(null);
      }

      if (isConnectedLive) {
        const rt = realtimeClientRef.current;
        if (rt && rt.isConnected()) {
          void rt.set({
            prompt: preset.prompt,
            enhance: enhancePrompt,
            image: preset.requiresReferenceImage ? refImageFile : null,
          });
          setStreamInfo(`Preset "${preset.label}" aplicado en vivo.`);
        }
      }
    },
    [enhancePrompt, isConnectedLive, refImageFile],
  );

  // Cargar preset desde Explore hacia CAM
  const handleLoadExploreItem = useCallback(
    (item: ExploreCardItem) => {
      setPromptText(item.prompt);
      setSelectedModelId(item.modelId);
      setSelectedPresetId(item.id);
      if (item.avatarBg && item.avatarBg.startsWith("data:")) {
        setRefImageDataUrl(item.avatarBg);
        setRefImageFile(dataUrlToFile(item.avatarBg, `${item.title.toLowerCase().replace(/\s+/g, "-")}.png`));
      }
      setActiveTab("CAM");
      setExploreToast(`"${item.title}" cargado en Cabina CAM.`);
      setTimeout(() => setExploreToast(null), 3000);
    },
    [],
  );

  // Publicar nuevo personaje en Explore
  const handleSaveExploreItem = useCallback(
    (item: ExploreCardItem) => {
      setUserExploreItems((prev) => {
        const next = [item, ...prev];
        try {
          window.localStorage.setItem(EXPLORE_STORAGE_KEY, JSON.stringify(next));
        } catch {}
        return next;
      });
      setShowUploadExploreModal(false);
      setExploreToast(`"${item.title}" publicado en Explore.`);
      setTimeout(() => setExploreToast(null), 3000);
    },
    [],
  );

  // Creador Delulu (Characters, Wardrobe & Accessories builder + Lucy Image 2)
  const composeCategoryPrompt = useCallback(
    (category: BuilderDraftCategory, chips: Record<string, string>, multi: string[]): string => {
      if (category === "outfit") {
        const noun = (chips.clothing_type || "outfit").toLowerCase();
        const descriptors: string[] = [];
        if (chips.wardrobe_style) descriptors.push(chips.wardrobe_style.toLowerCase());
        if (chips.wardrobe_fit) descriptors.push(chips.wardrobe_fit.toLowerCase());
        if (chips.wardrobe_color) descriptors.push(chips.wardrobe_color.toLowerCase());
        if (chips.wardrobe_material) descriptors.push(chips.wardrobe_material.toLowerCase());
        const headline = descriptors.length > 0 ? `A ${descriptors.join(" ")} ${noun}` : `A ${noun}`;
        const detailSuffix =
          multi.length > 0 ? ` featuring ${multi.map((d) => d.toLowerCase()).join(", ")}` : "";
        return `${headline}${detailSuffix}, studio fashion product photo, neutral backdrop.`;
      }

      const item = (chips.acc_type || "accessory").toLowerCase();
      const descriptors: string[] = [];
      if (chips.acc_size) descriptors.push(chips.acc_size.toLowerCase());
      if (chips.acc_style) descriptors.push(chips.acc_style.toLowerCase());
      if (chips.acc_color) descriptors.push(chips.acc_color.toLowerCase());
      if (chips.acc_material) descriptors.push(chips.acc_material.toLowerCase());
      const activeEffects = multi.filter((ef) => ef !== "NONE");
      const headline = descriptors.length > 0 ? `A ${descriptors.join(" ")} ${item}` : `A ${item}`;
      const effectSuffix =
        activeEffects.length > 0
          ? ` with ${activeEffects.map((ef) => ef.toLowerCase()).join(", ")} effect`
          : "";
      return `${headline}${effectSuffix}, studio macro product photo, dark neutral backdrop.`;
    },
    [],
  );

  const handleToggleBuilderSection = useCallback((sectionId: string) => {
    setCollapsedBuilderSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  }, []);

  const handleToggleChip = useCallback((sectionId: string, option: string) => {
    setCreateSelectedChips((prev) => {
      const current = prev[sectionId];
      const next = current === option ? "" : option;
      const updated = { ...prev, [sectionId]: next };

      const parts: string[] = [];
      if (updated.character_type) parts.push(updated.character_type.toLowerCase());
      if (updated.gender) parts.push(`gender ${updated.gender.toLowerCase()}`);
      if (updated.age_group) parts.push(updated.age_group.toLowerCase());
      if (updated.ethnicity) parts.push(updated.ethnicity.toLowerCase());
      if (updated.eyes) parts.push(`with ${updated.eyes.toLowerCase()} eyes`);
      if (updated.face_features) parts.push(`${updated.face_features.toLowerCase()} facial features`);
      if (updated.style) parts.push(`${updated.style.toLowerCase()} visual style`);
      if (updated.outfit) parts.push(`wearing ${updated.outfit.toLowerCase()} clothing`);

      const autoPrompt = parts.length > 0 ? `A ${parts.join(", ")}, cinematic studio lighting.` : "";
      if (autoPrompt) setCreatePrompt(autoPrompt);

      return updated;
    });
  }, []);

  const handleToggleDraftChip = useCallback(
    (category: BuilderDraftCategory, sectionId: string, option: string, multiSelect?: boolean) => {
      setCategoryDrafts((prev) => {
        const draft = prev[category];
        let nextChips = draft.chips;
        let nextMulti = draft.multi;

        if (multiSelect) {
          if (option === "NONE") {
            nextMulti = draft.multi.includes("NONE") ? [] : ["NONE"];
          } else {
            const withoutNone = draft.multi.filter((item) => item !== "NONE");
            nextMulti = withoutNone.includes(option)
              ? withoutNone.filter((item) => item !== option)
              : [...withoutNone, option];
          }
        } else {
          nextChips = {
            ...draft.chips,
            [sectionId]: draft.chips[sectionId] === option ? "" : option,
          };
        }

        const hasAny = Object.values(nextChips).some(Boolean) || nextMulti.length > 0;
        const nextPrompt = hasAny ? composeCategoryPrompt(category, nextChips, nextMulti) : "";
        return {
          ...prev,
          [category]: {
            ...draft,
            chips: nextChips,
            multi: nextMulti,
            prompt: nextPrompt,
          },
        };
      });
    },
    [composeCategoryPrompt],
  );

  const handleUpdateDraftText = useCallback(
    (category: BuilderDraftCategory, field: "prompt" | "customAdditions", value: string) => {
      setCategoryDrafts((prev) => ({
        ...prev,
        [category]: { ...prev[category], [field]: value },
      }));
    },
    [],
  );

  const handleRandomizeDraft = useCallback((category: BuilderDraftCategory) => {
    const presets = CREATE_CATEGORY_CONFIG[category].presets;
    setCategoryDrafts((prev) => {
      const draft = prev[category];
      const preset = presets[draft.presetIdx % presets.length];
      return {
        ...prev,
        [category]: {
          prompt: preset.prompt,
          chips: { ...preset.chips },
          multi: [...preset.details],
          customAdditions: preset.customAdditions ?? "",
          presetIdx: (draft.presetIdx + 1) % presets.length,
        },
      };
    });
    setCreateError(null);
  }, []);

  const handleClearDraft = useCallback((category: BuilderDraftCategory) => {
    setCategoryDrafts((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        prompt: "",
        chips: {},
        multi: [],
        customAdditions: "",
      },
    }));
    setCreateError(null);
  }, []);

  const createStudioSeedFile = useCallback(async (): Promise<File> => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#16161f";
      ctx.fillRect(0, 0, 512, 512);
    }
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) throw new Error("No se pudo preparar el lienzo base para la generación.");
    return new File([blob], "studio-seed.png", { type: "image/png" });
  }, []);

  const handleGenerateCharacterImage = useCallback(async () => {
    if (createGenerating) return;

    const isDraftCat = createCategory === "outfit" || createCategory === "props";
    const activeDraft = isDraftCat ? categoryDrafts[createCategory] : null;
    const basePrompt =
      isDraftCat && activeDraft
        ? activeDraft.prompt.trim() ||
          (Object.values(activeDraft.chips).some(Boolean) || activeDraft.multi.length > 0
            ? composeCategoryPrompt(createCategory, activeDraft.chips, activeDraft.multi)
            : "")
        : createPrompt.trim();
    const extraNotes = activeDraft ? activeDraft.customAdditions.trim() : "";
    const finalPrompt = [basePrompt, extraNotes].filter(Boolean).join(", ");

    if (!finalPrompt) {
      setCreateError(
        createCategory === "outfit"
          ? "Describe tu vestuario o selecciona etiquetas en Wardrobe antes de crear."
          : createCategory === "props"
            ? "Describe tu accesorio o selecciona etiquetas en Accesorios antes de crear."
            : "Describe tu personaje o selecciona atributos antes de crear.",
      );
      return;
    }

    if (createMode === "image" && !createSourceFile) {
      setCreateError("Selecciona una imagen base para usar FROM IMAGE.");
      createFileInputRef.current?.click();
      return;
    }

    setCreateGenerating(true);
    setCreateError(null);
    try {
      const res = await fetch("/api/create-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: finalPrompt,
          category: createCategory,
          engine: createEngine,
          apiKey: customAiApiKey.trim() || undefined,
          chips: activeDraft?.chips,
          multi: activeDraft?.multi,
        }),
      });

      if (!res.ok) {
        const errData = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(errData.error || `No se pudo generar con ${createEngine === "gemini" ? "Google Gemini" : "ChatGPT"}.`);
      }

      const data = (await res.json()) as { success: boolean; imageUrl: string; engineName?: string };
      if (!data.imageUrl) {
        throw new Error("No se recibió la imagen generada.");
      }

      const prefix = isDraftCat ? CREATE_CATEGORY_CONFIG[createCategory].ledgerPrefix : "Creación";
      setCreateResultUrl(data.imageUrl);
      setCreateEngineName(data.engineName || (createEngine === "gemini" ? "Google Gemini (Imagen 3)" : "OpenAI ChatGPT (DALL-E 3)"));

      appendLedgerEntry({
        kind: "image",
        modelId: createEngine === "gemini" ? "gemini-imagen-3" : "openai-dalle-3",
        detail: `${prefix} (${createEngine === "gemini" ? "Gemini" : "ChatGPT"}): ${finalPrompt.slice(0, 30)}...`,
        decartCredits: 0,
        usdCost: 0,
        copCost: 0,
      });
      void refreshAccountStatus();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : `Error generando con ${createEngine === "gemini" ? "Google Gemini" : "ChatGPT"}.`);
    } finally {
      setCreateGenerating(false);
    }
  }, [
    appendLedgerEntry,
    categoryDrafts,
    composeCategoryPrompt,
    createCategory,
    createEngine,
    createGenerating,
    createPrompt,
    customAiApiKey,
    refreshAccountStatus,
  ]);

  // Cargar prendas guardadas del carrusel Try-On
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(TRYON_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as TryOnGarmentItem[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTryOnGarments(parsed);
        }
      }
    } catch {}
  }, []);

  const persistTryOnGarments = useCallback((items: TryOnGarmentItem[]) => {
    setTryOnGarments(items);
    try {
      window.localStorage.setItem(TRYON_STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, []);

  const handleSelectGarment = useCallback(
    async (garment: TryOnGarmentItem) => {
      setSelectedGarmentId(garment.id);
      setSelectedModelId("lucy-vton-3.6");
      setPromptText(garment.prompt);

      let targetFile: File | null = null;
      if (garment.customImageUrl) {
        setRefImageDataUrl(garment.customImageUrl);
        targetFile = dataUrlToFile(garment.customImageUrl, `${garment.id}.png`);
        setRefImageFile(targetFile);
      } else {
        setRefImageFile(null);
        setRefImageDataUrl(null);
      }

      // Si ya está transmitiendo en vivo por WebRTC, cambiamos la ropa en tiempo real
      if (isConnectedLive && realtimeClientRef.current?.isConnected()) {
        try {
          await realtimeClientRef.current.set({
            prompt: garment.prompt,
            enhance: enhancePrompt,
            image: targetFile ?? undefined,
          });
          setStreamInfo(`Prenda aplicada en vivo: ${garment.name}`);
        } catch (e) {
          console.error("Error aplicando prenda en vivo:", e);
        }
      }
    },
    [enhancePrompt, isConnectedLive],
  );

  const handleAddCustomGarment = useCallback(
    (file: File) => {
      if (tryOnGarments.length >= 10) {
        alert(
          "Has alcanzado el límite máximo de 10 prendas en el carrusel. Elimina una prenda personalizada para agregar otra.",
        );
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const cleanName = file.name.replace(/\.[^/.]+$/, "").slice(0, 18);
        const newGarment: TryOnGarmentItem = {
          id: `custom-garment-${Date.now()}`,
          name: cleanName || "Mi Prenda",
          category: "Personalizada",
          prompt:
            "Substitute the person's upper clothing with the exact garment shown in the reference image, preserving natural fabric folds, body silhouette, and lighting.",
          customImageUrl: dataUrl,
          isCustom: true,
        };
        const updated = [...tryOnGarments, newGarment];
        persistTryOnGarments(updated);
        void handleSelectGarment(newGarment);
      };
      reader.readAsDataURL(file);
    },
    [handleSelectGarment, persistTryOnGarments, tryOnGarments],
  );

  const handleDeleteCustomGarment = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const updated = tryOnGarments.filter((g) => g.id !== id);
      persistTryOnGarments(updated);
      if (selectedGarmentId === id) setSelectedGarmentId(null);
    },
    [persistTryOnGarments, selectedGarmentId, tryOnGarments],
  );

  const handleUseWardrobeResultInTryOn = useCallback(() => {
    if (!createResultUrl) return;
    const outfitDraft = categoryDrafts.outfit;
    const labelType = outfitDraft.chips.clothing_type || "Wardrobe Outfit";
    const builtPrompt =
      [
        outfitDraft.prompt.trim() ||
          composeCategoryPrompt("outfit", outfitDraft.chips, outfitDraft.multi),
        outfitDraft.customAdditions.trim(),
      ]
        .filter(Boolean)
        .join(", ") ||
      "Substitute the person's outfit with the custom wardrobe garment shown in the reference image.";

    const customGarment: TryOnGarmentItem = {
      id: `wardrobe-garment-${Date.now()}`,
      name: labelType.slice(0, 18),
      category: "Personalizada",
      prompt: `Substitute the person's outfit with ${builtPrompt}`,
      customImageUrl: createResultUrl,
      isCustom: true,
    };

    if (tryOnGarments.length < 10) {
      const updated = [...tryOnGarments, customGarment];
      persistTryOnGarments(updated);
    }
    void handleSelectGarment(customGarment);
    setActiveTab("TRY_ON");
  }, [
    categoryDrafts.outfit,
    composeCategoryPrompt,
    createResultUrl,
    handleSelectGarment,
    persistTryOnGarments,
    tryOnGarments,
  ]);

  // Cargar fondos virtuales guardados
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(BG_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as VirtualBackgroundItem[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge presets with latest DEFAULT_VIRTUAL_BACKGROUNDS to guarantee realistic photos
          const mergedDefaults = DEFAULT_VIRTUAL_BACKGROUNDS.map((def) => {
            const existing = parsed.find((p) => p.id === def.id);
            return existing ? { ...existing, customImageUrl: def.customImageUrl || existing.customImageUrl } : def;
          });
          const customItems = parsed.filter((p) => p.isCustom);
          setVirtualBackgrounds([...mergedDefaults, ...customItems]);
          return;
        }
      }
    } catch {}
    setVirtualBackgrounds(DEFAULT_VIRTUAL_BACKGROUNDS);
  }, []);

  const persistVirtualBackgrounds = useCallback((items: VirtualBackgroundItem[]) => {
    setVirtualBackgrounds(items);
    try {
      window.localStorage.setItem(BG_STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, []);

  // Cargar configuración de WhatsApp y generar QR inicial
  useEffect(() => {
    let isCancelled = false;
    async function initWhatsAppConfig() {
      try {
        const stored = window.localStorage.getItem(WHATSAPP_STORAGE_KEY);
        let cfg: WhatsAppConfig = DEFAULT_WHATSAPP_CONFIG;
        if (stored) {
          const parsed = JSON.parse(stored) as Partial<WhatsAppConfig>;
          cfg = { ...DEFAULT_WHATSAPP_CONFIG, ...parsed, showOnScreen: false };
        }
        const cleanPhone = cfg.phoneNumber.replace(/[^0-9]/g, "");
        const waLink = cleanPhone
          ? `https://wa.me/${cleanPhone}${cfg.defaultMessage ? `?text=${encodeURIComponent(cfg.defaultMessage)}` : ""}`
          : "https://wa.me/";
        if (!cfg.qrCodeDataUrl) {
          const qr = await generateQrCodeDataUrl(waLink);
          cfg.qrCodeDataUrl = qr;
        }
        if (!isCancelled) setWhatsappConfig(cfg);
      } catch {}
    }
    void initWhatsAppConfig();
    return () => {
      isCancelled = true;
    };
  }, []);

  const persistWhatsAppConfig = useCallback((cfg: WhatsAppConfig) => {
    setWhatsappConfig(cfg);
    try {
      window.localStorage.setItem(WHATSAPP_STORAGE_KEY, JSON.stringify(cfg));
    } catch {}
  }, []);

  // Cargar preferencia de idioma de chat guardada (Español por defecto)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(CHAT_LANGUAGE_STORAGE_KEY);
      if (stored === "es" || stored === "en" || stored === "both") {
        setChatLanguage(stored);
      }
    } catch {}
  }, []);

  const handleUpdateChatLanguage = useCallback((lang: "es" | "en" | "both") => {
    setChatLanguage(lang);
    try {
      window.localStorage.setItem(CHAT_LANGUAGE_STORAGE_KEY, lang);
    } catch {}
  }, []);

  // Contador de elementos públicos activos en pantalla para prevenir sobrecarga visual de la audiencia (Máximo 3)
  // Nota: El Teleprompter NO suma aquí porque es un HUD privado exclusivo del streamer (la audiencia no lo ve)
  const countActiveOnScreen = useCallback(() => {
    let count = 0;
    if (activeProductId && shoppableProducts.some((p) => p.id === activeProductId && p.enabled)) count++;
    if (whatsappConfig.showOnScreen) count++;
    if (scheduledOverlays.some((o) => o.enabled)) count++;
    if (selectedBgId && selectedBgId !== "bg-none" && bgPreviewEnabled) count++;
    if (screenButtonsVisible && actionButtons.some((b) => b.placement && b.placement !== "deck")) count++;
    return count;
  }, [
    actionButtons,
    activeProductId,
    bgPreviewEnabled,
    scheduledOverlays,
    screenButtonsVisible,
    selectedBgId,
    shoppableProducts,
    whatsappConfig.showOnScreen,
  ]);

  const requestEnableOnScreen = useCallback((): boolean => {
    const current = countActiveOnScreen();
    if (current >= MAX_ONSCREEN_ELEMENTS) {
      setLimitWarningMessage(
        `⚠️ Límite de ${MAX_ONSCREEN_ELEMENTS} elementos en pantalla alcanzado para evitar sobrecargar el directo. Desactiva una capa para habilitar esta.`
      );
      setTimeout(() => setLimitWarningMessage(null), 4200);
      return false;
    }
    return true;
  }, [countActiveOnScreen]);

  const handleToggleWhatsAppOnScreen = useCallback(() => {
    setWhatsappConfig((prev) => {
      if (!prev.showOnScreen) {
        if (!requestEnableOnScreen()) return prev;
        const updated = { ...prev, showOnScreen: true };
        try {
          window.localStorage.setItem(WHATSAPP_STORAGE_KEY, JSON.stringify(updated));
        } catch {}
        return updated;
      }
      const updated = { ...prev, showOnScreen: false };
      try {
        window.localStorage.setItem(WHATSAPP_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, [requestEnableOnScreen]);

  const handleSelectBackground = useCallback(
    async (bg: VirtualBackgroundItem) => {
      setSelectedBgId(bg.id);
      let nextPrompt = promptText;
      virtualBackgrounds.forEach((b) => {
        if (b.promptSuffix && nextPrompt.includes(b.promptSuffix)) {
          nextPrompt = nextPrompt.replace(`, ${b.promptSuffix}`, "").replace(b.promptSuffix, "").trim();
        }
      });
      if (bg.promptSuffix) {
        nextPrompt = `${nextPrompt.replace(/,\s*$/, "")}, ${bg.promptSuffix}`;
      }
      setPromptText(nextPrompt);

      let targetRefFile = refImageFile;
      if (bg.customImageUrl) {
        setRefImageDataUrl(bg.customImageUrl);
        try {
          if (bg.customImageUrl.startsWith("data:")) {
            targetRefFile = dataUrlToFile(bg.customImageUrl, `bg-${bg.id}.jpg`);
          } else {
            const res = await fetch(bg.customImageUrl);
            const blob = await res.blob();
            targetRefFile = new File([blob], `bg-${bg.id}.jpg`, { type: blob.type || "image/jpeg" });
          }
          setRefImageFile(targetRefFile);
        } catch {
          targetRefFile = dataUrlToFile(bg.customImageUrl, `bg-${bg.id}.png`);
          setRefImageFile(targetRefFile);
        }
      }

      if (bg.id === "bg-none") {
        setBgPreviewEnabled(false);
        setStreamInfo("Fondo desactivado (Cámara limpia)");
      } else {
        if (!bgPreviewEnabled) {
          if (!requestEnableOnScreen()) return;
        }
        setBgPreviewEnabled(true);
        setStreamInfo(`✨ Previsualización en pantalla de "${bg.name}" (0 créditos consumidos)`);
      }

      if (isConnectedLive && realtimeClientRef.current?.isConnected()) {
        try {
          await realtimeClientRef.current.set({
            prompt: nextPrompt,
            enhance: enhancePrompt,
            image: targetRefFile ?? undefined,
          });
          setStreamInfo(`Fondo aplicado en vivo con IA: ${bg.name}`);
        } catch (e) {
          console.error("Error aplicando fondo en vivo:", e);
        }
      }
    },
    [bgPreviewEnabled, enhancePrompt, isConnectedLive, promptText, refImageFile, requestEnableOnScreen, virtualBackgrounds],
  );

  const handleAddCustomBackground = useCallback(
    (file: File, mediaType: "image" | "video" = "image") => {
      const cleanName = file.name.replace(/\.[^/.]+$/, "").slice(0, 18);
      if (mediaType === "video") {
        const videoBlobUrl = URL.createObjectURL(file);
        const newBg: VirtualBackgroundItem = {
          id: `custom-bg-vid-${Date.now()}`,
          name: cleanName || "Video Fondo",
          category: "Personalizado",
          mediaType: "video",
          thumbnailSvg: "",
          customVideoUrl: videoBlobUrl,
          isCustom: true,
          promptSuffix:
            "with an energetic dynamic looping video backdrop, ambient room glow reflecting the moving video colors, cinematic live streaming atmosphere",
          previewColor: "#00F0FF",
        };
        const updated = [...virtualBackgrounds, newBg];
        persistVirtualBackgrounds(updated);
        void handleSelectBackground(newBg);
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          const newBg: VirtualBackgroundItem = {
            id: `custom-bg-${Date.now()}`,
            name: cleanName || "Mi Fondo",
            category: "Personalizado",
            mediaType: "image",
            thumbnailSvg: "",
            customImageUrl: dataUrl,
            isCustom: true,
            promptSuffix:
              "in a customized room setting with lighting and ambient atmosphere matching the reference background image",
            previewColor: "#3B82F6",
          };
          const updated = [...virtualBackgrounds, newBg];
          persistVirtualBackgrounds(updated);
          void handleSelectBackground(newBg);
        };
        reader.readAsDataURL(file);
      }
    },
    [handleSelectBackground, persistVirtualBackgrounds, virtualBackgrounds],
  );

  const handleDeleteCustomBackground = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const updated = virtualBackgrounds.filter((b) => b.id !== id);
      persistVirtualBackgrounds(updated);
      if (selectedBgId === id) setSelectedBgId("bg-none");
    },
    [persistVirtualBackgrounds, selectedBgId, virtualBackgrounds],
  );

  // Cargar botones personalizados guardados (migrando cualquier botón con placement en pantalla a "deck")
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(BUTTONS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CustomActionButton[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          const hasOnScreen = parsed.some((b) => b.placement && b.placement !== "deck");
          const sanitized = parsed.map((b) => {
            if (!hasOnScreen && (b.id === "act-screen-magic" || b.id === "act-turbo-boost")) {
              return { ...b, placement: "screen-top-right" as const };
            }
            if (b.placement === "screen-bottom-left") {
              return { ...b, placement: "screen-top-right" as const };
            }
            return b;
          });
          setActionButtons(sanitized);
          try {
            window.localStorage.setItem(BUTTONS_STORAGE_KEY, JSON.stringify(sanitized));
          } catch {}
          return;
        }
      }
    } catch {}
  }, []);

  const persistActionButtons = useCallback((items: CustomActionButton[]) => {
    setActionButtons(items);
    try {
      window.localStorage.setItem(BUTTONS_STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, []);

  const handleExecuteActionButton = useCallback(
    async (btn: CustomActionButton) => {
      // 1. Confirmación visual inmediata en monitor (HUD)
      setLastActionFeedback({
        badge: btn.icon || (btn.url ? "🔗" : "⚡"),
        text: btn.url ? `${btn.label}: Abriendo enlace externo` : `${btn.label}: ¡Acción ejecutada!`,
      });
      setTimeout(() => setLastActionFeedback(null), 3500);

      // 2. Si es de tipo enlace o tiene URL asignada, abrir enlace en navegador
      if (btn.actionType === "url" || (btn.url && btn.url.trim() !== "")) {
        const rawTarget = (btn.url || btn.payload || "").trim();
        if (rawTarget) {
          const formattedUrl =
            rawTarget.startsWith("http://") || rawTarget.startsWith("https://")
              ? rawTarget
              : `https://${rawTarget}`;
          if (typeof window !== "undefined") {
            window.open(formattedUrl, "_blank", "noopener,noreferrer");
          }
          setStreamInfo(`Enlace abierto: ${btn.label} (${formattedUrl})`);
          return;
        }
      }

      // 3. Ejecutar según tipo de acción
      if (btn.actionType === "prompt") {
        setPromptText(btn.payload);
        setStreamInfo(`Prompt aplicado: ${btn.label}`);
        if (isConnectedLive && realtimeClientRef.current?.isConnected()) {
          try {
            await realtimeClientRef.current.set({
              prompt: btn.payload,
              enhance: enhancePrompt,
              image: refImageFile ?? undefined,
            });
          } catch (e) {
            console.error("Error ejecutando acción de prompt:", e);
          }
        } else if (isLive) {
          void applyLiveChanges();
        }
      } else if (btn.actionType === "tryon") {
        const garment = tryOnGarments.find((g) => g.id === btn.payload);
        if (garment) {
          void handleSelectGarment(garment);
          setStreamInfo(`Prenda Try-On aplicada: ${garment.name}`);
        }
      } else if (btn.actionType === "control") {
        if (btn.payload === "toggle_mirror") {
          setMirrorInput((prev) => {
            const next = !prev;
            setStreamInfo(`Modo espejo: ${next ? "Activado" : "Desactivado"}`);
            return next;
          });
        } else if (btn.payload === "toggle_audio") {
          setListenRemoteAudio((prev) => {
            const next = !prev;
            if (remoteVideoRef.current) {
              remoteVideoRef.current.muted = !next;
              remoteVideoRef.current.volume = 1.0;
            }
            setStreamInfo(`Audio retorno: ${next ? "Activado" : "Silenciado"}`);
            return next;
          });
        } else if (btn.payload === "toggle_split") {
          setSplitView((prev) => !prev);
        } else if (btn.payload === "toggle_shop") {
          setActiveProductId((prev) => {
            const next = prev ? null : (shoppableProducts[0]?.id || null);
            setStreamInfo(`Live Shopping: ${next ? "Mostrado en pantalla" : "Ocultado"}`);
            return next;
          });
        } else if (btn.payload === "toggle_whatsapp") {
          setWhatsappConfig((prev) => {
            const next = !prev.showOnScreen;
            setStreamInfo(`WhatsApp QR: ${next ? "Mostrado en pantalla" : "Ocultado"}`);
            return { ...prev, showOnScreen: next };
          });
        } else if (btn.payload === "toggle_rec") {
          if (isRecording) {
            stopRecordingRef.current?.();
            setStreamInfo("Grabación finalizada y guardada");
          } else {
            startRecordingRef.current?.();
            setStreamInfo("Grabación iniciada");
          }
        }
      } else if (btn.actionType === "alert") {
        setStreamInfo(`Alerta en vivo: ${btn.label}`);
      }
    },
    [
      applyLiveChanges,
      enhancePrompt,
      handleSelectGarment,
      isConnectedLive,
      isLive,
      isRecording,
      refImageFile,
      shoppableProducts,
      tryOnGarments,
    ],
  );

  const handleOpenEditButton = useCallback((btn: CustomActionButton, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingButtonId(btn.id);
    setNewBtnLabel(btn.label);
    setNewBtnIcon(btn.icon || "⚡");
    setNewBtnColor(btn.color || "#8B5CF6");
    setNewBtnType(btn.actionType);
    setNewBtnPayload(btn.payload || "");
    setNewBtnUrl(btn.url || "");
    setNewBtnImageUrl(btn.customImageUrl || "");
    setNewBtnSize(btn.size || "md");
    setNewBtnPlacement(btn.placement || "deck");
    setShowAddButtonModal(true);
  }, []);

  const handleOpenCreateButton = useCallback(() => {
    setEditingButtonId(null);
    setNewBtnLabel("");
    setNewBtnIcon("⚡");
    setNewBtnColor("#8B5CF6");
    setNewBtnType("prompt");
    setNewBtnPayload("");
    setNewBtnUrl("");
    setNewBtnImageUrl("");
    setNewBtnSize("md");
    setNewBtnPlacement("deck");
    setShowAddButtonModal(true);
  }, []);

  const handleSaveCustomButton = useCallback(() => {
    if (!newBtnLabel.trim()) return;

    const resolvedType = newBtnType;
    const resolvedPayload =
      resolvedType === "url"
        ? newBtnUrl.trim() || newBtnPayload.trim()
        : newBtnPayload.trim() || (resolvedType === "prompt" ? promptText : "toggle_mirror");

    if (editingButtonId) {
      const updated = actionButtons.map((btn) => {
        if (btn.id === editingButtonId) {
          return {
            ...btn,
            label: newBtnLabel.trim(),
            icon: newBtnIcon || "⚡",
            color: newBtnColor || "#8B5CF6",
            actionType: resolvedType,
            payload: resolvedPayload,
            url: newBtnUrl.trim() || undefined,
            customImageUrl: newBtnImageUrl.trim() ? newBtnImageUrl.trim() : undefined,
            size: newBtnSize,
            placement: newBtnPlacement,
          };
        }
        return btn;
      });
      persistActionButtons(updated);
      setStreamInfo(`Botón actualizado: ${newBtnLabel.trim()}`);
    } else {
      const newBtn: CustomActionButton = {
        id: `btn-custom-${Date.now()}`,
        label: newBtnLabel.trim(),
        icon: newBtnIcon || "⚡",
        color: newBtnColor || "#8B5CF6",
        actionType: resolvedType,
        payload: resolvedPayload,
        url: newBtnUrl.trim() || undefined,
        customImageUrl: newBtnImageUrl.trim() ? newBtnImageUrl.trim() : undefined,
        size: newBtnSize,
        placement: newBtnPlacement,
      };
      const updated = [...actionButtons, newBtn];
      persistActionButtons(updated);
      setStreamInfo(`Botón creado: ${newBtnLabel.trim()}`);
    }

    if (newBtnPlacement !== "deck") {
      setScreenButtonsVisible(true);
    }

    setShowAddButtonModal(false);
    setEditingButtonId(null);
    setNewBtnLabel("");
    setNewBtnPayload("");
    setNewBtnUrl("");
    setNewBtnImageUrl("");
    setNewBtnSize("md");
    setNewBtnPlacement("deck");
  }, [
    actionButtons,
    editingButtonId,
    newBtnColor,
    newBtnIcon,
    newBtnImageUrl,
    newBtnLabel,
    newBtnPayload,
    newBtnPlacement,
    newBtnSize,
    newBtnType,
    newBtnUrl,
    persistActionButtons,
    promptText,
  ]);

  const handleDeleteActionButton = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const updated = actionButtons.filter((b) => b.id !== id);
      persistActionButtons(updated);
    },
    [actionButtons, persistActionButtons],
  );

  const handleBtnImageFileSelected = useCallback((file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === "string") {
        setNewBtnImageUrl(e.target.result);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const handleSelectAspectRatio = useCallback(
    (mode: CropAspectMode) => {
      const targetMode: CropAspectMode = isMobileViewport ? "9:16" : mode;
      setPreprocOpts((prev) => ({ ...prev, cropMode: targetMode }));
      if (preprocRef.current) {
        preprocRef.current.updateOptions({ cropMode: targetMode });
      }
    },
    [isMobileViewport],
  );

  // En móvil (<= 767 px) forzar automáticamente formato vertical único 9:16
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 767px)");
    const syncViewport = () => {
      const mobile = mq.matches;
      setIsMobileViewport(mobile);
      if (mobile) {
        setPreprocOpts((prev) => (prev.cropMode === "9:16" ? prev : { ...prev, cropMode: "9:16" }));
        if (preprocRef.current) {
          preprocRef.current.updateOptions({ cropMode: "9:16" });
        }
      }
    };
    syncViewport();
    mq.addEventListener("change", syncViewport);
    return () => mq.removeEventListener("change", syncViewport);
  }, []);

  // Detectar si el monitor real (.delulu-monitor-container) sigue visible al hacer scroll
  useEffect(() => {
    if (!isCockpitTab) {
      setMonitorInView(true);
      return;
    }
    const checkMonitorVisibility = () => {
      const mon = stageHeroRef.current?.querySelector(".delulu-monitor-container");
      if (!mon) {
        setMonitorInView(true);
        return;
      }
      const rect = mon.getBoundingClientRect();
      setMonitorInView(rect.bottom > 110 && rect.top < window.innerHeight - 40);
    };
    checkMonitorVisibility();
    window.addEventListener("scroll", checkMonitorVisibility, { passive: true });
    window.addEventListener("resize", checkMonitorVisibility, { passive: true });
    return () => {
      window.removeEventListener("scroll", checkMonitorVisibility);
      window.removeEventListener("resize", checkMonitorVisibility);
    };
  }, [isCockpitTab, activeTab]);

  // Reloj de animación y ciclo para overlays programados (actualiza cada segundo)
  useEffect(() => {
    const timer = window.setInterval(() => {
      setOverlayTick((t) => (t + 1) % 86400);
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  // Cargar overlays guardados
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(OVERLAYS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ScheduledOverlayItem[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setScheduledOverlays(parsed.map((item) => ({ ...item, enabled: false })));
        }
      }
    } catch {}
  }, []);

  const persistScheduledOverlays = useCallback((items: ScheduledOverlayItem[]) => {
    setScheduledOverlays(items);
    try {
      window.localStorage.setItem(OVERLAYS_STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, []);

  const isOverlayVisible = useCallback((item: ScheduledOverlayItem, currentTick: number) => {
    if (!item.enabled) return false;
    if (item.displayMode === "permanent") return true;
    const cycle = Math.max(5, item.intervalSeconds);
    const elapsed = currentTick % cycle;
    return elapsed < item.durationSeconds;
  }, []);

  const handleToggleOverlay = useCallback(
    (id: string) => {
      const target = scheduledOverlays.find((o) => o.id === id);
      if (!target) return;
      const willEnable = !target.enabled;
      const anyOtherEnabled = scheduledOverlays.some((o) => o.id !== id && o.enabled);
      if (willEnable && !anyOtherEnabled) {
        if (!requestEnableOnScreen()) return;
      }
      const updated = scheduledOverlays.map((item) =>
        item.id === id ? { ...item, enabled: !item.enabled } : item,
      );
      persistScheduledOverlays(updated);
    },
    [persistScheduledOverlays, requestEnableOnScreen, scheduledOverlays],
  );

  const handleToggleBgMaster = useCallback(() => {
    if (bgPreviewEnabled && selectedBgId !== "bg-none") {
      setBgPreviewEnabled(false);
      setStreamInfo("Capa de fondo desactivada");
    } else {
      if (!requestEnableOnScreen()) return;
      if (!selectedBgId || selectedBgId === "bg-none") {
        setSelectedBgId("bg-chroma-green");
      }
      setBgPreviewEnabled(true);
      setStreamInfo("Capa de fondo activada (0 créditos consumidos)");
    }
  }, [bgPreviewEnabled, requestEnableOnScreen, selectedBgId]);

  const handleToggleShoppingMaster = useCallback(() => {
    if (activeProductId) {
      setActiveProductId(null);
      setStreamInfo("Tarjeta de producto ocultada");
    } else {
      if (!requestEnableOnScreen()) return;
      const first = shoppableProducts.find((p) => p.enabled) || shoppableProducts[0];
      if (first) {
        setActiveProductId(first.id);
        setStreamInfo(`Tarjeta de compra en pantalla: ${first.title}`);
      } else {
        setShowProductModal(true);
      }
    }
  }, [activeProductId, requestEnableOnScreen, shoppableProducts]);

  const handleToggleBannersMaster = useCallback(() => {
    const anyEnabled = scheduledOverlays.some((o) => o.enabled);
    if (anyEnabled) {
      const updated = scheduledOverlays.map((o) => ({ ...o, enabled: false }));
      persistScheduledOverlays(updated);
      setStreamInfo("Banners desactivados en pantalla");
    } else {
      if (!requestEnableOnScreen()) return;
      const updated = scheduledOverlays.map((o, idx) => ({ ...o, enabled: idx === 0 }));
      persistScheduledOverlays(updated);
      setStreamInfo("Banners activados en pantalla");
    }
  }, [persistScheduledOverlays, requestEnableOnScreen, scheduledOverlays]);

  const handleTogglePrompterMaster = useCallback(() => {
    if (teleprompterActive) {
      setTeleprompterActive(false);
      setStreamInfo("Teleprompter ocultado");
    } else {
      setTeleprompterActive(true);
      setStreamInfo("Teleprompter activado (🔒 HUD Privado sólo visible para ti)");
    }
  }, [teleprompterActive]);

  // Métricas reactivas del guion (palabras, caracteres, párrafos y tiempo estimado de lectura en vivo)
  const scriptMetrics = useMemo(() => {
    const text = teleprompterScript.trim();
    if (!text) {
      return { words: 0, chars: 0, paragraphs: 0, readTimeMinutes: 0 };
    }
    const words = text.split(/\s+/).filter(Boolean).length;
    const chars = teleprompterScript.length;
    const paragraphs = text.split(/\n+/).filter((p) => p.trim().length > 0).length;
    const readTimeMinutes = Math.max(1, Math.round(words / 130)); // ~130 palabras por minuto al hablar en vivo
    return { words, chars, paragraphs, readTimeMinutes };
  }, [teleprompterScript]);

  const handleUploadTxt = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = (event.target?.result as string) || "";
        if (scriptInsertMode === "append" && teleprompterScript.trim()) {
          setTeleprompterScript((prev) => prev + "\n\n" + content);
        } else {
          setTeleprompterScript(content);
        }
        const words = content.trim().split(/\s+/).filter(Boolean).length;
        const readTime = Math.max(1, Math.round(words / 130));
        setStreamInfo(`✓ Archivo .TXT cargado: ${file.name} (${words} palabras, ~${readTime} min de lectura)`);
      };
      reader.readAsText(file, "UTF-8");
      e.target.value = "";
    },
    [scriptInsertMode, teleprompterScript]
  );

  const handleUploadPdf = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setIsParsingPdf(true);
      setStreamInfo(`⏳ Extrayendo texto de ${file.name}...`);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/parse-pdf", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (data.success && data.text) {
          if (scriptInsertMode === "append" && teleprompterScript.trim()) {
            setTeleprompterScript((prev) => prev + "\n\n" + data.text);
          } else {
            setTeleprompterScript(data.text);
          }
          setStreamInfo(
            `✓ PDF importado: ${data.filename} (${data.numPages} págs, ${data.wordCount} palabras, ~${data.readingTimeMinutes} min de lectura)`
          );
        } else {
          setStreamInfo(`⚠️ ${data.error || "No se pudo extraer texto del PDF"}`);
        }
      } catch {
        setStreamInfo("⚠️ Error al conectar con el servidor para procesar el PDF");
      } finally {
        setIsParsingPdf(false);
        e.target.value = "";
      }
    },
    [scriptInsertMode, teleprompterScript]
  );

  const handlePasteClipboard = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text || !text.trim()) {
        setStreamInfo("⚠️ El portapapeles está vacío o no contiene texto legible");
        return;
      }
      if (scriptInsertMode === "append" && teleprompterScript.trim()) {
        setTeleprompterScript((prev) => prev + "\n\n" + text);
      } else {
        setTeleprompterScript(text);
      }
      const words = text.trim().split(/\s+/).filter(Boolean).length;
      const readTime = Math.max(1, Math.round(words / 130));
      setStreamInfo(`✓ Texto largo pegado del portapapeles (${words} palabras, ~${readTime} min de lectura)`);
    } catch {
      setStreamInfo("⚠️ No se pudo acceder al portapapeles. Usa Ctrl+V directamente en el área de texto.");
    }
  }, [scriptInsertMode, teleprompterScript]);

  const handleClearScript = useCallback(() => {
    setTeleprompterScript("");
    setStreamInfo("Guion vaciado. Escribe, pega o importa tu nuevo texto.");
  }, []);

  const handleToggleButtonsMaster = useCallback(() => {
    if (screenButtonsVisible) {
      setScreenButtonsVisible(false);
      setStreamInfo("Botones flotantes ocultados");
    } else {
      if (!requestEnableOnScreen()) return;
      setActionButtons((prev) => {
        const hasOnScreen = prev.some((b) => b.placement && b.placement !== "deck");
        if (hasOnScreen) return prev;
        const updated = prev.map((b) => {
          if (b.id === "act-screen-magic" || b.id === "act-turbo-boost") {
            return { ...b, placement: "screen-top-right" as const };
          }
          return b;
        });
        persistActionButtons(updated);
        return updated;
      });
      setScreenButtonsVisible(true);
      setStreamInfo("Botones flotantes activados en pantalla");
    }
  }, [persistActionButtons, requestEnableOnScreen, screenButtonsVisible]);

  const handleDeleteOverlay = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const updated = scheduledOverlays.filter((item) => item.id !== id);
      persistScheduledOverlays(updated);
    },
    [persistScheduledOverlays, scheduledOverlays],
  );

  const handleExecuteBannerUrl = useCallback((item: ScheduledOverlayItem) => {
    if (!item.targetUrl) return;
    try {
      const url = item.targetUrl.startsWith("http") ? item.targetUrl : `https://${item.targetUrl}`;
      window.open(url, "_blank", "noopener,noreferrer");
      setStreamInfo(`🚀 Abriendo enlace ejecutable de banner: ${url}`);
      setTimeout(() => setStreamInfo(null), 4000);
    } catch {
      // ignore
    }
  }, []);

  const handleCopyBannerText = useCallback((item: ScheduledOverlayItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const textToCopy = item.copyableText || item.customText || item.targetUrl || item.name;
    if (!textToCopy) return;
    try {
      void navigator.clipboard.writeText(textToCopy);
      setCopiedBannerId(item.id);
      setTimeout(() => setCopiedBannerId(null), 2500);
      setStreamInfo(`📋 ¡Texto copiado al portapapeles: "${textToCopy}"!`);
      setTimeout(() => setStreamInfo(null), 3000);
    } catch {
      // fallback
    }
  }, []);

  const handleCreateOverlay = useCallback(() => {
    let finalImageUrl = newBannerImageUrl.trim();
    if (!finalImageUrl && newBannerText.trim()) {
      const text = encodeURIComponent(newBannerText.trim());
      const copy = newBannerCopyText.trim() ? encodeURIComponent(`Código: ${newBannerCopyText.trim()}`) : "";
      finalImageUrl = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 80" width="500" height="80"><rect width="500" height="80" rx="16" fill="%2312121C" fill-opacity="0.92" stroke="%23FF2E93" stroke-width="2.5"/><text x="24" y="36" fill="%23FFFFFF" font-size="16" font-family="sans-serif" font-weight="900">${text}</text>${copy ? `<text x="24" y="60" fill="%2300F0FF" font-size="13" font-family="sans-serif" font-weight="700">${copy}</text>` : ""}</svg>`;
    }

    if (!newBannerName.trim() || !finalImageUrl) {
      alert("Escribe un nombre y selecciona una imagen o escribe un texto para el banner.");
      return;
    }
    const newOverlay: ScheduledOverlayItem = {
      id: `ovl-custom-${Date.now()}`,
      name: newBannerName.trim(),
      imageUrl: finalImageUrl,
      targetUrl: newBannerTargetUrl.trim() || undefined,
      customText: newBannerText.trim() || undefined,
      copyableText: newBannerCopyText.trim() || undefined,
      position: newBannerPosition,
      sizePercent: newBannerSize,
      opacity: newBannerOpacity,
      displayMode: newBannerMode,
      intervalSeconds: newBannerIntervalSec,
      durationSeconds: newBannerDurationSec,
      animation: newBannerAnim,
      enabled: true,
    };
    const updated = [...scheduledOverlays, newOverlay];
    persistScheduledOverlays(updated);
    setShowAddBannerModal(false);
    setNewBannerName("");
    setNewBannerImageUrl("");
    setNewBannerTargetUrl("");
    setNewBannerText("");
    setNewBannerCopyText("");
  }, [
    newBannerAnim,
    newBannerCopyText,
    newBannerDurationSec,
    newBannerImageUrl,
    newBannerIntervalSec,
    newBannerMode,
    newBannerName,
    newBannerOpacity,
    newBannerPosition,
    newBannerSize,
    newBannerTargetUrl,
    newBannerText,
    persistScheduledOverlays,
    scheduledOverlays,
  ]);

  // Funciones de Grabación de Video en Cabina
  const startRecording = useCallback(() => {
    const videoEl = isConnectedLive ? remoteVideoRef.current : localVideoRef.current;
    if (!videoEl) {
      alert("No hay señal de video activa en pantalla para grabar.");
      return;
    }

    try {
      let stream: MediaStream | null = null;
      if (localStreamRef.current && localStreamRef.current.getVideoTracks().length > 0) {
        stream = localStreamRef.current;
      }

      if (!stream) {
        const capturedEl = videoEl as HTMLVideoElement & {
          captureStream?: (fps?: number) => MediaStream;
          mozCaptureStream?: (fps?: number) => MediaStream;
        };
        if (typeof capturedEl.captureStream === "function") {
          try {
            const s = capturedEl.captureStream(30);
            if (s && s.getVideoTracks().length > 0) stream = s;
          } catch {}
        }
      }

      if (!stream || stream.getVideoTracks().length === 0) {
        const fallbackCanvas = document.createElement("canvas");
        fallbackCanvas.width = recordingResolution === "4k" ? 3840 : recordingResolution === "1080p" ? 1920 : 1280;
        fallbackCanvas.height = recordingResolution === "4k" ? 2160 : recordingResolution === "1080p" ? 1080 : 720;
        const ctx = fallbackCanvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#0A0A10";
          ctx.fillRect(0, 0, fallbackCanvas.width, fallbackCanvas.height);
        }
        stream = fallbackCanvas.captureStream(30);
      }

      recordedChunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm";

      const bps =
        recordingResolution === "4k"
          ? 16000000
          : recordingResolution === "1080p"
          ? 7000000
          : recordingResolution === "720p"
          ? 3500000
          : 1500000;

      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: bps,
      });

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `grabacion_stream_${recordingResolution}_${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setStreamInfo(`🎉 Grabación completada y guardada en resolución ${recordingResolution}.`);
        setTimeout(() => setStreamInfo(null), 5000);
      };

      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingDuration(0);
    } catch (err) {
      alert(`Error al iniciar grabación: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [isConnectedLive, recordingResolution]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  startRecordingRef.current = startRecording;
  stopRecordingRef.current = stopRecording;

  // Timer de duración de grabación
  useEffect(() => {
    let t: number | undefined;
    if (isRecording) {
      t = window.setInterval(() => {
        setRecordingDuration((d) => d + 1);
      }, 1000);
    }
    return () => {
      if (t) window.clearInterval(t);
    };
  }, [isRecording]);

  // Auto-scroll del Teleprompter en pantalla
  useEffect(() => {
    if (!teleprompterActive || !teleprompterPlaying) return;
    const interval = window.setInterval(() => {
      setTeleprompterScrollY((prev) => {
        if (prev > 2400) return 0;
        return prev + teleprompterSpeed;
      });
    }, 100);
    return () => window.clearInterval(interval);
  }, [teleprompterActive, teleprompterPlaying, teleprompterSpeed]);

  // Cargar y persistir destinos multistream
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(MULTISTREAM_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as MultistreamDestination[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMultistreamDestinations(parsed);
          return;
        }
      }
    } catch {}
    setMultistreamDestinations(DEFAULT_MULTISTREAM_DESTINATIONS);
  }, []);

  const persistMultistreamDestinations = useCallback((items: MultistreamDestination[]) => {
    setMultistreamDestinations(items);
    try {
      window.localStorage.setItem(MULTISTREAM_STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, []);

  const handleToggleMultistream = useCallback(
    (id: string) => {
      const updated = multistreamDestinations.map((d) =>
        d.id === id ? { ...d, enabled: !d.enabled, status: (!d.enabled ? "live" : "idle") as MultistreamDestination["status"] } : d,
      );
      persistMultistreamDestinations(updated);
    },
    [multistreamDestinations, persistMultistreamDestinations],
  );

  const handleSaveStreamKey = useCallback(
    (id: string, key: string) => {
      const updated = multistreamDestinations.map((d) => (d.id === id ? { ...d, streamKey: key } : d));
      persistMultistreamDestinations(updated);
      setEditingStreamKeyDestId(null);
    },
    [multistreamDestinations, persistMultistreamDestinations],
  );

  // Cargar productos y generar sus códigos QR
  useEffect(() => {
    let isCancelled = false;
    async function initProducts() {
      try {
        const stored = window.localStorage.getItem(PRODUCTS_STORAGE_KEY);
        let items: ShoppableProductItem[] = DEFAULT_SHOPPABLE_PRODUCTS;
        if (stored) {
          const parsed = JSON.parse(stored) as ShoppableProductItem[];
          if (Array.isArray(parsed) && parsed.length > 0) items = parsed;
        }
        const updated = await Promise.all(
          items.map(async (p) => {
            if (!p.qrCodeDataUrl) {
              const qr = await generateQrCodeDataUrl(p.linkUrl);
              return { ...p, qrCodeDataUrl: qr };
            }
            return p;
          }),
        );
        if (!isCancelled) setShoppableProducts(updated);
      } catch {}
    }
    void initProducts();
    return () => {
      isCancelled = true;
    };
  }, []);

  const persistShoppableProducts = useCallback((items: ShoppableProductItem[]) => {
    setShoppableProducts(items);
    try {
      window.localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, []);

  const handleCreateOrUpdateProduct = useCallback(async () => {
    const title = newProdTitle.trim() || "Producto Destacado";
    const link = newProdLink.trim() || "https://onestream.live";
    const priceNum = parseFloat(newProdPrice) || 0;
    const compareNum = newProdComparePrice ? parseFloat(newProdComparePrice) : undefined;
    const qr = await generateQrCodeDataUrl(link);
    const currencySymbols: Record<CurrencyOption, string> = {
      USD: "$",
      COP: "COP $",
      EUR: "€",
      MXN: "$",
      GBP: "£",
    };
    const newProd: ShoppableProductItem = {
      id: `prod-${Date.now()}`,
      title,
      subtitle: newProdSubtitle.trim() || undefined,
      linkUrl: link,
      currency: newProdCurrency,
      currencySymbol: currencySymbols[newProdCurrency] || "$",
      price: priceNum,
      compareAtPrice: compareNum,
      imageUrl: newProdImageUrl || "/products/headphones.jpg",
      qrCodeDataUrl: qr,
      position: newProdPosition,
      enabled: true,
      scansCount: 0,
      clicksCount: 0,
    };
    const updated = [newProd, ...shoppableProducts];
    persistShoppableProducts(updated);
    setActiveProductId(newProd.id);
    setShowProductModal(false);
    setNewProdTitle("");
    setNewProdSubtitle("");
    setStreamInfo(`🛍️ Tarjeta de producto creada: "${title}" con QR escaneable en pantalla.`);
  }, [
    newProdComparePrice,
    newProdCurrency,
    newProdImageUrl,
    newProdLink,
    newProdPosition,
    newProdPrice,
    newProdSubtitle,
    newProdTitle,
    persistShoppableProducts,
    shoppableProducts,
  ]);

  const handleDeleteProduct = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const updated = shoppableProducts.filter((p) => p.id !== id);
      persistShoppableProducts(updated);
      if (activeProductId === id) setActiveProductId(null);
    },
    [activeProductId, persistShoppableProducts, shoppableProducts],
  );

  const activeDestinations = multistreamDestinations.filter((d) => d.enabled);
  const totalMultistreamViewers = activeDestinations.reduce((acc, curr) => acc + (curr.viewers || 0), 18400);
  const activeProduct = shoppableProducts.find((p) => p.id === activeProductId);

  const handleSelectLiveShopPosition = useCallback(
    (pos: ShoppableProductPosition) => {
      setLiveShopGlobalPosition(pos);
      if (activeProductId) {
        const updated = shoppableProducts.map((p) => (p.id === activeProductId ? { ...p, position: pos } : p));
        persistShoppableProducts(updated);
      }
      const label = pos.includes("bottom")
        ? "Abajo (Zona marcada)"
        : pos.includes("middle")
        ? "En el Medio"
        : "Arriba";
      setStreamInfo(`📍 Shop QR ubicado en: ${label}`);
    },
    [activeProductId, persistShoppableProducts, shoppableProducts],
  );

  // Control de Temporizador y Emisión Programada para Live Shopping (Intervalo o Número de veces)
  useEffect(() => {
    if (liveShopScheduleMode === "manual") {
      setLiveShopNextCountdown(0);
      setLiveShopStatusText("");
      return;
    }

    // Inicializar cuenta regresiva inicial si es 0
    if (liveShopNextCountdown <= 0) {
      const initialWait = activeProductId ? liveShopDisplaySeconds : liveShopIntervalMinutes * 60;
      setLiveShopNextCountdown(initialWait);
    }

    const timer = setInterval(() => {
      setLiveShopNextCountdown((prev) => {
        if (prev <= 1) {
          if (activeProductId) {
            // El banner estaba visible -> se oculta
            setActiveProductId(null);
            if (liveShopScheduleMode === "count") {
              if (liveShopCurrentCount >= liveShopRepeatCount) {
                // Se completaron todas las repeticiones
                setLiveShopScheduleMode("manual");
                setLiveShopStatusText(`✅ Finalizaron los ${liveShopRepeatCount} pases de Shop QR`);
                setStreamInfo(`✅ Transmisión: Se completaron los ${liveShopRepeatCount} pases programados de Shop QR.`);
                return 0;
              }
            }
            const nextWait = liveShopIntervalMinutes * 60;
            const m = Math.floor(nextWait / 60);
            const s = nextWait % 60;
            setLiveShopStatusText(`⏳ Próximo pase en ${m}:${s.toString().padStart(2, "0")}`);
            return nextWait;
          } else {
            // El banner estaba oculto -> se activa en pantalla
            const firstProd = shoppableProducts[0];
            if (firstProd) {
              setActiveProductId(firstProd.id);
              if (liveShopScheduleMode === "count") {
                setLiveShopCurrentCount((c) => {
                  const nextCount = c + 1;
                  setLiveShopStatusText(`📊 Pase ${nextCount} de ${liveShopRepeatCount} en pantalla (${liveShopDisplaySeconds}s)`);
                  return nextCount;
                });
              } else {
                setLiveShopStatusText(`🟢 En pantalla por ${liveShopDisplaySeconds}s`);
              }
            }
            return liveShopDisplaySeconds;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [
    liveShopScheduleMode,
    liveShopIntervalMinutes,
    liveShopDisplaySeconds,
    liveShopRepeatCount,
    liveShopCurrentCount,
    activeProductId,
    shoppableProducts,
    liveShopNextCountdown,
  ]);



  // Iniciar cámara por defecto al montar si no hay fuente
  useEffect(() => {
    if (!localStreamRef.current && sourceMode === "camera") {
      void startCamera();
    }
  }, [sourceMode, startCamera]);

  return (
    <div className="viralive-app-shell" style={{ minHeight: "100vh", backgroundColor: "var(--bg)", color: "var(--text-white)", display: "flex", flexDirection: "column" }}>
      {/* -------------------------------------------------------------
          CABECERA PRINCIPAL RESPONSIVE (HORIZONTAL EN PC/TABLETA, HAMBURGUESA EN MÓVIL)
          ------------------------------------------------------------- */}
      <header className="delulu-header">
        <div className="delulu-header-left">
          <button
            type="button"
            className="delulu-brand"
            style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer" }}
            onClick={() => navigateToMainTab("CAM")}
            aria-label="Ir al inicio de Virallive / viralive.app"
          >
            <ViraliveLogo variant="header" height={34} />
          </button>

          <nav className="delulu-nav-tabs" aria-label="Navegación principal">
            {MAIN_NAV_ITEMS.map((item, idx) => {
              const prevGroup = idx > 0 ? MAIN_NAV_ITEMS[idx - 1].group : item.group;
              return (
                <div key={item.id} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  {idx > 0 && item.group !== prevGroup && (
                    <span className="nav-group-divider" aria-hidden="true" />
                  )}
                  <button
                    type="button"
                    className={`delulu-nav-tab ${activeTab === item.id ? "active" : ""}`}
                    onClick={() => navigateToMainTab(item.id)}
                  >
                    <Dashicon name={item.icon} size={15} />
                    {item.label !== item.shortLabel ? (
                      <>
                        <span className="nav-label-full">{item.label}</span>
                        <span className="nav-label-short">{item.shortLabel}</span>
                      </>
                    ) : (
                      <span>{item.label}</span>
                    )}
                    {item.badge && <span className="nav-badge-new">{item.badge}</span>}
                  </button>
                </div>
              );
            })}
          </nav>
        </div>

        <div className="delulu-header-actions">
          <button
            type="button"
            className="btn-streamer-mode"
            onClick={() => setStreamerMode((prev) => !prev)}
            title="Modo Streamer oculta credenciales y costos en pantalla"
          >
            <Dashicon name={streamerMode ? "lock" : "unlock"} size={14} />
            <span>{streamerMode ? "STREAMER ON" : "STREAMER MODE"}</span>
          </button>

          <button
            type="button"
            className="btn-get-plus"
            onClick={() => setActiveTab("PRO")}
            title="Saldo actual de créditos Decart"
          >
            <span>{`${account.credits ?? 714} CR`}</span>
          </button>

          <button
            type="button"
            className="user-avatar-btn"
            onClick={() => void refreshAccountStatus()}
            title="Usuario Activo · Clic para refrescar saldo"
            aria-label="Refrescar saldo de cuenta"
          >
            V
          </button>

          <button
            ref={mobileMenuBtnRef}
            type="button"
            id="mobile-menu-toggle"
            className="mobile-hamburger-btn"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-drawer-nav"
            aria-label={mobileMenuOpen ? "Cerrar menú de navegación" : "Abrir menú de navegación"}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
          >
            <Dashicon name={mobileMenuOpen ? "no-alt" : "menu-alt"} size={18} />
            <span>{mobileMenuOpen ? "Cerrar" : "Menú"}</span>
          </button>
        </div>
      </header>

      {/* Menú desplegable móvil (fuera de header para respetar position: fixed en todo el viewport) */}
      {mobileMenuOpen && (
        <>
          <div
            className="mobile-nav-backdrop"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <nav id="mobile-drawer-nav" className="mobile-drawer-nav" aria-label="Menú móvil">
            <div className="mobile-drawer-section-label">EN VIVO · CABINAS</div>
            <div className="mobile-drawer-links">
              {MAIN_NAV_ITEMS.filter((i) => i.group === "live").map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`mobile-drawer-link ${activeTab === item.id ? "active" : ""}`}
                  onClick={() => navigateToMainTab(item.id)}
                >
                  <Dashicon name={item.icon} size={18} />
                  <span>{item.drawerLabel}</span>
                </button>
              ))}
            </div>

            <div className="mobile-drawer-section-label">ESTUDIO IA Y AJUSTES</div>
            <div className="mobile-drawer-links">
              {MAIN_NAV_ITEMS.filter((i) => i.group !== "live").map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`mobile-drawer-link ${activeTab === item.id ? "active" : ""}`}
                  onClick={() => navigateToMainTab(item.id)}
                >
                  <Dashicon name={item.icon} size={18} />
                  <span>{item.drawerLabel}</span>
                </button>
              ))}
            </div>

            <div className="mobile-drawer-quick-actions">
              <button
                type="button"
                className={`mobile-drawer-action-btn ${streamerMode ? "active" : ""}`}
                onClick={() => {
                  setStreamerMode((prev) => !prev);
                  setMobileMenuOpen(false);
                }}
              >
                <Dashicon name={streamerMode ? "lock" : "unlock"} size={16} />
                <span>{streamerMode ? "Streamer ON" : "Modo Streamer"}</span>
              </button>
              <button
                type="button"
                className="mobile-drawer-action-btn"
                onClick={() => {
                  setShowObsModal(true);
                  setMobileMenuOpen(false);
                }}
              >
                <Dashicon name="video-alt2" size={16} />
                <span>OBS / Virtual Cam</span>
              </button>
            </div>

            <div className="mobile-drawer-social">
              <span className="mobile-drawer-social-title">Canales sociales de viralive.app</span>
              <div className="mobile-drawer-social-row">
                {(
                  [
                    { net: "tiktok", label: "TikTok" },
                    { net: "instagram", label: "Instagram" },
                    { net: "youtube", label: "YouTube" },
                    { net: "facebook", label: "Facebook" },
                    { net: "twitter-x", label: "X" },
                    { net: "linkedin", label: "LinkedIn" },
                  ] as const
                ).map((s) => (
                  <button
                    key={s.net}
                    type="button"
                    className="mobile-social-icon-btn"
                    aria-label={s.label}
                    title={`${s.label} en TikTok Live con Marcas`}
                    onClick={() => {
                      setActiveTab("TIKTOK_LIVE");
                      setMobileMenuOpen(false);
                    }}
                  >
                    <SocialIcon network={s.net as SocialNetworkName} size={18} />
                  </button>
                ))}
              </div>
            </div>
          </nav>
        </>
      )}

      {/* Input oculto para subir fotos de referencia */}
      <input
        ref={refFileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => handleReferenceImageSelected(e.target.files?.[0] ?? null)}
      />

      {/* Input oculto para subir prendas al carrusel Try-On */}
      <input
        ref={tryOnUploadInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleAddCustomGarment(file);
          e.target.value = "";
        }}
      />

      {/* Toast de Explore */}
      {exploreToast && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 100,
            backgroundColor: "var(--accent-pink-deep)",
            color: "#FFFFFF",
            padding: "10px 18px",
            borderRadius: 999,
            fontWeight: 800,
            fontSize: "0.82rem",
            boxShadow: "0 6px 20px rgba(0,0,0,0.6)",
          }}
        >
          ✓ {exploreToast}
        </div>
      )}

      {/* Barra flotante rápida cuando el monitor queda fuera de pantalla al hacer scroll */}
      {isCockpitTab && !monitorInView && (
        <div className="floating-monitor-hud" role="region" aria-label="Acceso rápido al monitor">
          <div className="floating-hud-info">
            <span className={`live-indicator-dot ${isConnectedLive ? "active" : ""}`} />
            <span className="floating-hud-text">
              {lastActionFeedback
                ? `${lastActionFeedback.badge}: ${lastActionFeedback.text}`
                : activeTab === "DUO"
                  ? `DÚO · ${guestSplitConfig.layout === "horizontal" ? "Batalla PK" : guestSplitConfig.layout === "pip" ? "Flotante PiP" : "Vertical 50/50"}`
                  : `${selectedModelId} · Listo para ejecutar`}
            </span>
          </div>
          <div className="floating-hud-actions">
            <button
              type="button"
              className="floating-hud-exec-btn"
              disabled={streamBusy}
              onClick={isConnectedLive ? applyLiveChanges : isLive ? applyLiveChanges : startRealtime}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Dashicon name="controls-play" size={12} color="#FFFFFF" /> <span>{isConnectedLive ? "Aplicar" : "Execute"}</span></span>
            </button>
            <button
              type="button"
              className="floating-hud-top-btn"
              onClick={() => stageHeroRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Dashicon name="visibility" size={12} /> <span>Ver Monitor</span></span>
            </button>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          VISTA 1: CABINAS EN VIVO COMPARTIDAS (CAM · TRY ON · DÚO)
          ------------------------------------------------------------- */}
      {isCockpitTab && (
        <UnifiedLiveChatProvider
          cropMode={effectiveCropMode}
          chatLanguage={chatLanguage}
          onLanguageChange={handleUpdateChatLanguage}
          onPinCommentToScreen={(msg) => {
            setPinnedChatMessage(msg);
            if (msg) {
              setLastActionFeedback({
                badge: "CHAT FIJO",
                text: `${msg.author}: ${msg.message.slice(0, 34)}`,
              });
            }
          }}
          pinnedCommentId={pinnedChatMessage?.id}
          pinnedMessage={pinnedChatMessage}
        >
        <div className="cam-workspace-layout">
          {/* BARRA LATERAL IZQUIERDA PARAMETRIZADA POR MODO (CAM / TRY ON / DÚO) */}
          <aside className="cam-sidebar-dock">
            <div className="dock-header-row">
              <span
                style={{
                  fontSize: "0.74rem",
                  fontWeight: 800,
                  color: "var(--text-muted)",
                  letterSpacing: "0.06em",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span>
                  {activeTab === "TRY_ON"
                    ? "CABINA TRY-ON"
                    : activeTab === "DUO"
                      ? "CABINA DÚO · SPLIT"
                      : activeTab === "CLIPS"
                        ? "CABINA CLIPS PREGRABADOS"
                        : activeTab === "TIKTOK_LIVE"
                          ? "CABINA TIKTOK CON MARCAS"
                          : "CONTROLES EN VIVO"}
                </span>
                {activeTab === "TRY_ON" && (
                  <span className="nav-badge-new" style={{ fontSize: "0.58rem" }}>VTON 3.6</span>
                )}
                {activeTab === "CLIPS" && (
                  <span className="nav-badge-new" style={{ fontSize: "0.58rem", background: "linear-gradient(135deg, #EC4899, #8B5CF6)" }}>ASYNC IA</span>
                )}
                {activeTab === "TIKTOK_LIVE" && (
                  <span className="nav-badge-new" style={{ fontSize: "0.58rem", background: "linear-gradient(135deg, #FF0050, #00F0FF)" }}>BRAND 9:16</span>
                )}
              </span>
              <button
                className="dock-collapse-btn"
                title="Conectar OBS o abrir pantalla completa"
                onClick={() => setShowObsModal(true)}
                style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
              >
                <Dashicon name="admin-generic" size={14} />
                <span>OBS</span>
              </button>
            </div>

            {activeTab === "DUO" ? (
              <>
                <button
                  className={`btn-execute ${isConnectedLive ? "running" : ""}`}
                  onClick={isConnectedLive ? stopRealtime : isLive ? applyLiveChanges : startRealtime}
                  disabled={streamBusy}
                >
                  {streamBusy ? (
                    "CONECTANDO..."
                  ) : isConnectedLive ? (
                    "DETENER EN VIVO"
                  ) : isLive ? (
                    "APLICAR CAMBIO (EXECUTE)"
                  ) : (
                    <>
                      <Dashicon name="controls-play" size={15} />
                      <span>TRANSMITIR DÚO EN VIVO</span>
                    </>
                  )}
                </button>

                <GuestSplitScreenPanel
                  config={guestSplitConfig}
                  onChangeConfig={(newCfg) => {
                    setGuestSplitConfig(newCfg);
                    setSplitView(newCfg.active);
                    setLastActionFeedback({
                      badge: "DÚO",
                      text: `${newCfg.active ? "ON" : "OFF"} · ${newCfg.layout === "horizontal" ? "Batalla PK" : newCfg.layout === "pip" ? "PiP" : "Vertical"} · ${newCfg.selectedGuest.name}`,
                    });
                  }}
                  hostSourceMode={sourceMode}
                  hostVideoUrl={localVideoFileUrl}
                  hostVideoName={localVideoFileName}
                  onChangeHostSourceMode={(mode) => {
                    setSourceMode(mode);
                    if (mode === "camera") void startCamera();
                  }}
                  onUploadHostVideo={(file) => {
                    handleVideoFileSelected(file);
                    setTimeout(() => void captureFromVideoElement(), 200);
                  }}
                />

                {splitChatComposerToLeftInDuo && (
                  <div className="studio-dock-card duo-left-composer-slot" style={{ padding: 12 }}>
                    <UnifiedLiveChatPanel
                      compactSidebar
                      sectionMode="composer"
                      cropMode={effectiveCropMode}
                      onPinCommentToScreen={(msg) => setPinnedChatMessage(msg)}
                      pinnedCommentId={pinnedChatMessage?.id}
                      pinnedMessage={pinnedChatMessage}
                    />
                  </div>
                )}
              </>
            ) : activeTab === "CLIPS" ? (
              <QueueClipsPanel
                dockMode={true}
                onLoadCompletedIntoMonitor={(videoUrl, fileName) => {
                  setLocalVideoFileUrl(videoUrl);
                  if (fileName) setLocalVideoFileName(fileName);
                  setSourceMode("video_file");
                  setStreamInfo(`🎬 Clip "${fileName || "video"}" listo en el monitor central.`);
                }}
                onRefreshAccount={refreshAccountStatus}
              />
            ) : activeTab === "TIKTOK_LIVE" ? (
              <TikTokBrandedStudioPanel
                dockMode={true}
                activeThemeId={activeTikTokTheme?.id}
                viewerRange={guestSplitConfig.viewerRange}
                onSelectViewerRange={(viewerRange) => setGuestSplitConfig((prev) => ({ ...prev, viewerRange }))}
                onApplyThemeToCam={(theme, bgId) => {
                  setActiveTikTokTheme(theme);
                  setPreprocOpts((prev) => ({ ...prev, cropMode: "9:16" }));
                  setPhoneMockupMode(true);
                  if (bgId) {
                    setSelectedBgId(bgId);
                    setBgPreviewEnabled(true);
                  }
                  setStreamInfo(`📱 Marca TikTok "${theme.brandName}" activa en el monitor 9:16.`);
                }}
                onThemeChange={(theme) => {
                  setActiveTikTokTheme(theme);
                }}
                onSelectCropAspect={(aspect) => {
                  setPreprocOpts((prev) => ({ ...prev, cropMode: aspect as CropAspectMode }));
                }}
                virtualBackgrounds={virtualBackgrounds}
                selectedBgId={selectedBgId}
                onSelectBackground={(bg) => {
                  setSelectedBgId(bg.id);
                  setBgPreviewEnabled(true);
                  setStreamInfo(`Fondo "${bg.name}" seleccionado.`);
                }}
                onAddCustomBackground={handleAddCustomBackground}
                hideViewerRangeCard={true}
              />
            ) : (
              <>
                {/* Prompt input card (CAM / TRY ON) */}
                <div className="dock-prompt-card">
                  <textarea
                    className="dock-prompt-textarea"
                    placeholder={
                      activeTab === "TRY_ON"
                        ? "Describe la prenda u outfit para Try-On..."
                        : "Enter custom text..."
                    }
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                  />
                  <div className="dock-prompt-actions">
                    <button
                      className="btn-prompt-icon"
                      title={
                        activeTab === "TRY_ON"
                          ? "Restablecer prompt de la prenda seleccionada"
                          : "Restablecer prompt seguro predeterminado"
                      }
                      onClick={() =>
                        setPromptText(
                          activeTab === "TRY_ON"
                            ? (selectedGarmentObj?.prompt || DEFAULT_TRYON_CAROUSEL[0].prompt)
                            : DEFAULT_SAFE_PROMPT,
                        )
                      }
                      aria-label="Restablecer prompt"
                    >
                      <Dashicon name="controls-repeat" size={14} />
                    </button>
                    <button
                      className="btn-prompt-icon"
                      title="Mejora automática de prompt (enhance)"
                      onClick={() => setEnhancePrompt((prev) => !prev)}
                      style={{ color: enhancePrompt ? "var(--accent-pink)" : "var(--text-muted)" }}
                      aria-label="Mejorar prompt"
                    >
                      <Dashicon name="star-filled" size={14} />
                    </button>
                  </div>
                </div>

                {/* Selector de Motor de IA en Vivo (Decart, DeepFaceLive o Deep-Live-Cam) */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, margin: "4px 0 6px" }}>
                  <span style={{ fontSize: "0.66rem", color: "#94A3B8", fontWeight: 800 }}>MOTOR IA:</span>
                  <div style={{ display: "flex", gap: 4, flex: 1, justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      className={`pill-ctrl-button ${activeAiEngine === "decart" ? "active-pink" : ""}`}
                      style={{ padding: "3px 8px", fontSize: "0.66rem", fontWeight: 700 }}
                      onClick={() => setActiveAiEngine("decart")}
                      title="Decart AI Cloud Realtime (Lucy 2.6)"
                    >
                      Decart
                    </button>
                    <button
                      type="button"
                      className={`pill-ctrl-button ${activeAiEngine === "deepfacelive" ? "active-pink" : ""}`}
                      style={{ padding: "3px 8px", fontSize: "0.66rem", fontWeight: 700 }}
                      onClick={() => setActiveAiEngine("deepfacelive")}
                      title="DeepFaceLive Local Engine (DFM Models · 0 CR · 15-35ms)"
                    >
                      DeepFaceLive
                    </button>
                    <button
                      type="button"
                      className={`pill-ctrl-button ${activeAiEngine === "deeplivecam" ? "active-pink" : ""}`}
                      style={{ padding: "3px 8px", fontSize: "0.66rem", fontWeight: 700 }}
                      onClick={() => setActiveAiEngine("deeplivecam")}
                      title="Deep-Live-Cam 1-Click Face Swap (InsightFace + GFPGAN · 0 CR)"
                    >
                      Deep-Live-Cam
                    </button>
                  </div>
                </div>

                {/* Botón EXECUTE principal */}
                <button
                  className={`btn-execute ${isConnectedLive ? "running" : ""}`}
                  onClick={isConnectedLive ? stopRealtime : isLive ? applyLiveChanges : startRealtime}
                  disabled={streamBusy}
                >
                  {streamBusy ? (
                    "CONECTANDO..."
                  ) : isConnectedLive ? (
                    "DETENER EN VIVO"
                  ) : isLive ? (
                    activeTab === "TRY_ON" ? "APLICAR PRENDA (TRY ON)" : "APLICAR CAMBIO (EXECUTE)"
                  ) : (
                    <>
                      <Dashicon name="controls-play" size={15} />
                      <span>{activeTab === "TRY_ON" ? "EXECUTE TRY-ON" : "EXECUTE"}</span>
                    </>
                  )}
                </button>
              </>
            )}

            {activeTab === "TRY_ON" && (
              <>
                <div className="dock-category-icons-row">
                  {(
                    [
                      { id: "Todo", icon: "grid-view", label: "Todas las prendas" },
                      { id: "Casual", icon: "tag", label: "Casual y Urbano" },
                      { id: "Elegante", icon: "products", label: "Elegante y Fantasía" },
                      { id: "Personalizada", icon: "upload", label: "Mis Prendas" },
                    ] as const
                  ).map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      className={`dock-cat-icon-btn ${tryOnCatFilter === cat.id ? "active" : ""}`}
                      onClick={() => setTryOnCatFilter(cat.id)}
                      title={cat.label}
                      aria-label={cat.label}
                    >
                      <Dashicon name={cat.icon} size={18} />
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  className="card-add-new-preset"
                  onClick={() => tryOnUploadInputRef.current?.click()}
                >
                  <Dashicon name="plus" size={18} />
                  <span>SUBIR PRENDA</span>
                </button>

                <div className="dock-preset-cards-grid">
                  {filteredTryOnGarments.map((garment) => {
                    const isSelected = selectedGarmentId === garment.id;
                    const thumbSrc = garment.customImageUrl || garment.thumbnailSvg;
                    return (
                      <div
                        key={garment.id}
                        className={`delulu-preset-card ${isSelected ? "selected" : ""}`}
                        onClick={() => void handleSelectGarment(garment)}
                        title={`${garment.name} (${garment.category}) - Probar en vivo`}
                      >
                        {garment.isCustom && (
                          <button
                            type="button"
                            className="tryon-delete-badge"
                            onClick={(e) => handleDeleteCustomGarment(garment.id, e)}
                            title="Eliminar prenda personalizada"
                          >
                            ×
                          </button>
                        )}
                        <div
                          className="preset-card-thumb"
                          style={{
                            backgroundColor: "#F8FAFC",
                            padding: garment.customImageUrl ? 0 : 8,
                          }}
                        >
                          {thumbSrc ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={thumbSrc}
                              alt={garment.name}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: garment.customImageUrl ? "cover" : "contain",
                              }}
                            />
                          ) : (
                            <Dashicon name="products" size={24} color="#EC4899" />
                          )}
                        </div>
                        <div className="preset-card-label">{garment.name}</div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {activeTab === "CAM" && (
              <>
                {/* Fila de subcategorías con iconos Dashicons */}
                <div className="dock-category-icons-row">
                  <button
                    className={`dock-cat-icon-btn ${dockCategory === "Persona" ? "active" : ""}`}
                    onClick={() => setDockCategory("Persona")}
                    title="Personajes y Avatares"
                    aria-label="Personajes y Avatares"
                  >
                    <Dashicon name="admin-users" size={18} />
                  </button>
                  <button
                    className={`dock-cat-icon-btn ${dockCategory === "Ropa" ? "active" : ""}`}
                    onClick={() => setDockCategory("Ropa")}
                    title="Ropa y Outfits (VTON)"
                    aria-label="Ropa y Outfits"
                  >
                    <Dashicon name="products" size={18} />
                  </button>
                  <button
                    type="button"
                    className={`dock-cat-icon-btn ${dockCategory === "Estilo" ? "active" : ""}`}
                    onClick={() => setDockCategory("Estilo")}
                    title="Estilos Visuales (45 presets)"
                    aria-label="Style"
                  >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="M12 3L14.2 8.8L20 11L14.2 13.2L12 19L9.8 13.2L4 11L9.8 8.8L12 3Z"
                        stroke="currentColor"
                        strokeWidth="1.9"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M19 3V7M17 5H21M5 17V20M3.5 18.5H6.5"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className={`dock-cat-icon-btn ${dockCategory === "Edicion" ? "active" : ""}`}
                    onClick={() => setDockCategory("Edicion")}
                    title="VFX y Efectos Especiales"
                    aria-label="VFX"
                  >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="M15 4L20 9L8 21H3V16L15 4Z"
                        stroke="currentColor"
                        strokeWidth="1.9"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M12.5 6.5L17.5 11.5M5 5V8M3.5 6.5H6.5"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </div>

                {dockCategory === "Estilo" ? (
                  <div className="cam-style-catalog-box">
                    <div className="cam-style-toolbar">
                      <input
                        type="search"
                        className="cam-style-search-input"
                        placeholder="Buscar entre 45 estilos..."
                        aria-label="Buscar estilo visual"
                        value={camStyleSearch}
                        onChange={(e) => setCamStyleSearch(e.target.value)}
                      />
                      <button
                        type="button"
                        className="cam-style-top-btn"
                        title="Volver arriba"
                        aria-label="Volver arriba"
                        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                      >
                        ^
                      </button>
                    </div>

                    <div className="cam-style-filter-chips" role="tablist" aria-label="Filtrar categoría de estilos">
                      {(["Todos", "Anime", "Series", "Games", "Deportes", "Cine"] as const).map((grp) => (
                        <button
                          key={grp}
                          type="button"
                          className={`cam-style-filter-chip ${camStyleGroup === grp ? "active" : ""}`}
                          onClick={() => setCamStyleGroup(grp)}
                        >
                          {grp}
                        </button>
                      ))}
                    </div>

                    {(() => {
                      const q = camStyleSearch.trim().toLowerCase();
                      const visibleStyles = CAM_STYLE_PRESETS.filter((st) => {
                        const matchGroup = camStyleGroup === "Todos" || getCamStyleGroup(st) === camStyleGroup;
                        if (!matchGroup) return false;
                        if (!q) return true;
                        return (
                          st.label.toLowerCase().includes(q) ||
                          st.keywords.toLowerCase().includes(q) ||
                          st.prompt.toLowerCase().includes(q)
                        );
                      });

                      return visibleStyles.length > 0 ? (
                        <div className="dock-style-cards-grid">
                          {visibleStyles.map((styleItem) => {
                            const isSelected = selectedPresetId === styleItem.id;
                            return (
                              <button
                                key={styleItem.id}
                                type="button"
                                className={`cam-style-card ${isSelected ? "selected" : ""}`}
                                onClick={() => handleSelectPreset(styleItem)}
                                title={`${styleItem.label} · ${styleItem.suggestedModel}`}
                              >
                                <div className="cam-style-thumb-box">
                                  <CamStyleThumb styleItem={styleItem} />
                                </div>
                                <span className="cam-style-label">{styleItem.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="cam-style-empty-msg">
                          Sin coincidencias para &ldquo;{camStyleSearch}&rdquo;.{" "}
                          <button
                            type="button"
                            className="cam-style-clear-link"
                            onClick={() => {
                              setCamStyleSearch("");
                              setCamStyleGroup("Todos");
                            }}
                          >
                            Ver los 45 estilos
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                ) : dockCategory === "Edicion" ? (
                  <div className="cam-style-catalog-box">
                    <div className="dock-style-cards-grid">
                      {CAM_VFX_PRESETS.map((vfxItem) => {
                        const isSelected = selectedPresetId === vfxItem.id;
                        return (
                          <button
                            key={vfxItem.id}
                            type="button"
                            className={`cam-style-card ${isSelected ? "selected" : ""}`}
                            onClick={() => handleSelectPreset(vfxItem)}
                            title={`${vfxItem.label} · ${vfxItem.suggestedModel}`}
                          >
                            <div className="cam-style-thumb-box">
                              <CamStyleThumb styleItem={vfxItem} />
                            </div>
                            <span className="cam-style-label">{vfxItem.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="cam-vfx-quick-row">
                      {OFFICIAL_PROMPT_PRESETS.filter((p) => p.category === "Edicion").map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          className={`pill-ctrl-button ${selectedPresetId === preset.id ? "active-pink" : ""}`}
                          onClick={() => handleSelectPreset(preset)}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Recuadro + ADD NEW */}
                    <button
                      className="card-add-new-preset"
                      onClick={() => {
                        if (refFileInputRef.current) refFileInputRef.current.click();
                      }}
                    >
                      <Dashicon name="plus" size={18} />
                      <span>ADD NEW</span>
                    </button>

                    {/* Rejilla de tarjetas en 2 columnas */}
                    <div className="dock-preset-cards-grid">
                      {/* Tarjeta de imagen de referencia activa */}
                      <div
                        className={`delulu-preset-card ${selectedPresetId === "ref-swap" ? "selected" : ""}`}
                        onClick={() => {
                          setSelectedPresetId("ref-swap");
                          setSelectedModelId("lucy-2.6");
                          setPromptText(REFERENCE_SWAP_PROMPT);
                          if (!refImageFile && refFileInputRef.current) {
                            refFileInputRef.current.click();
                          }
                        }}
                      >
                        <div
                          className="preset-card-thumb"
                          style={{
                            backgroundColor: "#18181F",
                            backgroundImage: refImageDataUrl ? `url(${refImageDataUrl})` : "none",
                          }}
                        >
                          {!refImageDataUrl && (
                            <span style={{ fontSize: "0.75rem", color: "var(--accent-pink)", fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 6 }}>
                              <Dashicon name="camera" size={15} />
                              <span>SUBIR FOTO</span>
                            </span>
                          )}
                        </div>
                        <div className="preset-card-label">REFERENCE IMAGE</div>
                      </div>

                      {/* Presets oficiales filtrados */}
                      {OFFICIAL_PROMPT_PRESETS.filter((p) => {
                        if (dockCategory === "Persona") return p.category === "Personaje";
                        if (dockCategory === "Ropa") return p.id.includes("clothes") || p.category === "Personaje";
                        if (dockCategory === "Edicion") return p.category === "Edicion" || p.category === "VFX";
                        return true;
                      }).map((preset) => (
                        <div
                          key={preset.id}
                          className={`delulu-preset-card ${selectedPresetId === preset.id ? "selected" : ""}`}
                          onClick={() => handleSelectPreset(preset)}
                        >
                          <div
                            className="preset-card-thumb"
                            style={{
                              background:
                                preset.category === "Personaje"
                                  ? "linear-gradient(135deg, #1E40AF 0%, #172554 100%)"
                                  : preset.category === "Fondo"
                                    ? "linear-gradient(135deg, #065F46 0%, #047857 100%)"
                                    : "linear-gradient(135deg, #374151 0%, #111827 100%)",
                              color: "#E2E8F0",
                            }}
                          >
                            <Dashicon
                              name={
                                preset.category === "Personaje"
                                  ? "admin-users"
                                  : preset.category === "Fondo"
                                    ? "format-gallery"
                                    : "admin-tools"
                              }
                              size={22}
                            />
                          </div>
                          <div className="preset-card-label">{preset.label}</div>
                        </div>
                      ))}

                      {/* Skins guardados por el usuario */}
                      {savedSkins.map((skin) => (
                        <div
                          key={skin.id}
                          className={`delulu-preset-card ${selectedPresetId === skin.id ? "selected" : ""}`}
                          onClick={() => {
                            setSelectedPresetId(skin.id);
                            setPromptText(skin.prompt);
                            setSelectedModelId(skin.modelId);
                            if (skin.refImageDataUrl) {
                              setRefImageDataUrl(skin.refImageDataUrl);
                              setRefImageFile(dataUrlToFile(skin.refImageDataUrl));
                            }
                          }}
                        >
                          <div
                            className="preset-card-thumb"
                            style={{
                              backgroundImage: skin.refImageDataUrl ? `url(${skin.refImageDataUrl})` : "none",
                              background: !skin.refImageDataUrl
                                ? "linear-gradient(135deg, #831843 0%, #500724 100%)"
                                : undefined,
                              color: "#FBBF24",
                            }}
                          >
                            {!skin.refImageDataUrl && <Dashicon name="star-filled" size={20} />}
                          </div>
                          <div className="preset-card-label">{skin.name}</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}

            {activeTab !== "DUO" && activeTab !== "CLIPS" && (
              <div className="viewer-range-dock-card">
                <ViewerRangeControl
                  compact
                  label="Viewer Range · Audiencia"
                  value={guestSplitConfig.viewerRange}
                  onChange={(viewerRange) => setGuestSplitConfig((prev) => ({ ...prev, viewerRange }))}
                />
              </div>
            )}
          </aside>

          {/* MONITOR CENTRAL HERO CON RETICULAS EN ESQUINAS Y CONTROLES AL PIE */}
          <main ref={stageHeroRef} className="cam-stage-hero">
            {/* TOAST DE ALERTA DE LÍMITE DE CAPAS EN PANTALLA (PREVIENE SOBRECARGA UX) */}
            {limitWarningMessage && (
              <div className="screen-limit-toast">
                <span>{limitWarningMessage}</span>
                <button
                  type="button"
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#FFFFFF",
                    fontWeight: 900,
                    fontSize: "1.1rem",
                    cursor: "pointer",
                    marginLeft: 8,
                    lineHeight: 1,
                  }}
                  onClick={() => setLimitWarningMessage(null)}
                  title="Cerrar aviso"
                >
                  ✕
                </button>
              </div>
            )}
            {/* Barra superior de conexión: OBS, Multistream 45+ y Live Shopping */}
            <div className="stage-top-pills-row">
              <div className="alert-install-vcam-pill vcam-full-span" onClick={() => setShowObsModal(true)} style={{ margin: 0 }}>
                <span className="vcam-pill-prefix" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <Dashicon name="share" size={14} />
                  <span className="vcam-prefix-desktop">TRANSMITE EN CUALQUIER APP O LLAMADA</span>
                </span>
                <span className="alert-vcam-cta">VIRTUAL CAMERA / OBS</span>
              </div>

              {/* Botón Multistream OneStream 45+ */}
              <button
                type="button"
                className="multistream-stage-pill"
                onClick={() => setShowMultistreamModal(true)}
                title="Configurar y transmitir simultáneamente a 45+ redes sociales (Facebook, Instagram, TikTok, YouTube, etc.)"
              >
                <span className="multistream-dot-live" />
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                  <SocialIcon network="tiktok" size={14} />
                  <span>MULTISTREAM ({activeDestinations.length} Redes)</span>
                </span>
              </button>

              {/* Botón Shoppable Product Cards */}
              <button
                type="button"
                className="multistream-stage-pill"
                style={{ borderColor: "rgba(168, 85, 247, 0.6)", color: "#E9D5FF" }}
                onClick={() => setShowProductCatalogModal(true)}
                title="Mostrar y vender productos con código QR en pantalla"
              >
                <Dashicon name="cart" size={14} />
                <span>LIVE SHOPPING ({activeProduct ? `1 Activo: ${activeProduct.title}` : "Sin producto"})</span>
              </button>

              {/* Botón Stream Config */}
              <button
                type="button"
                className="multistream-stage-pill"
                style={{ borderColor: "#EC4899", color: "#F472B6", background: "rgba(236, 72, 153, 0.12)" }}
                onClick={() => setShowStreamConfigModal(true)}
                title="Configurar transmisión (Audiencia, Grabación y Plataforma) en viralive.app"
              >
                <Dashicon name="admin-generic" size={14} />
                <span>STREAM CONFIG</span>
              </button>

              {/* Selector de Tamaño de Monitor (Normal, Grande, Extra Grande) disponible en CAM, TRY ON y DÚO en cualquier formato */}
              {!isMobileViewport && (
                <>
                  {effectiveCropMode === "9:16" && (
                    <button
                      type="button"
                      className={`multistream-stage-pill ${phoneMockupMode ? "active-pink" : ""}`}
                      onClick={() => setPhoneMockupMode(!phoneMockupMode)}
                      title="Alternar entre marco de smartphone realista o escenario completo vertical"
                    >
                      <Dashicon name={phoneMockupMode ? "smartphone" : "desktop"} size={14} />
                      <span>{phoneMockupMode ? "VISTA MÓVIL" : "ESCENARIO"}</span>
                    </button>
                  )}

                  {/* Selector de Tamaño para CAM, TRY ON y DÚO en cualquier formato */}
                  <div className="mobile-size-pills-group" title="Tamaño del monitor en pantalla (CAM, Try-On y Dúo)">
                    <span className="mobile-size-pills-label">TAMAÑO:</span>
                    {[
                      { id: "md", label: "Normal (M)", tip: effectiveCropMode === "9:16" ? "400px ancho" : "1020px panorámico" },
                      { id: "lg", label: "Grande (L)", tip: effectiveCropMode === "9:16" ? "480px ancho - Recomendado" : "1240px panorámico - Recomendado" },
                      { id: "xl", label: "Extra Grande (XL)", tip: effectiveCropMode === "9:16" ? "560px ancho - Máxima visibilidad" : "1400px panorámico - Máxima visibilidad" },
                    ].map((sz) => (
                      <button
                        key={sz.id}
                        type="button"
                        className={`mobile-size-opt-btn ${mobileViewScale === sz.id ? "active" : ""}`}
                        onClick={() => {
                          setMobileViewScale(sz.id as any);
                          setStreamInfo(`Tamaño ajustado a: ${sz.label}`);
                        }}
                        title={sz.tip}
                      >
                        {sz.label}
                      </button>
                    ))}
                  </div>

                  {effectiveCropMode === "9:16" && phoneMockupMode && (
                    <button
                      type="button"
                      className={`multistream-stage-pill ${showPhoneMockupBottomDock ? "active-pink" : ""}`}
                      onClick={() => setShowPhoneMockupBottomDock(!showPhoneMockupBottomDock)}
                      title="Mostrar u ocultar los comandos inferiores duplicados (+Guests, Config, Share) dentro del marco móvil"
                    >
                      <Dashicon name="menu-alt" size={14} />
                      <span>{showPhoneMockupBottomDock ? "COMANDOS MÓVIL: ON" : "COMANDOS MÓVIL: OFF"}</span>
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Monitor con esquinas neon rosa y formato de pantalla dinámico */}
            <div style={{ position: "relative", width: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>

              <div className={`delulu-monitor-container aspect-${effectiveCropMode.replace(":", "-")} ${showPhoneMockupFrame ? "in-phone-mockup" : ""} scale-${mobileViewScale} ${isDuoSplitActive ? "has-duo-split" : ""}`}>
                {showPhoneMockupFrame ? (
                  <>
                    {/* Insignias LIVE y Viewers DENTRO del mockup móvil (esquina superior) */}
                    {hudLiveVisible && (
                    <>
                      <div className="neon-ambient-badge-live" style={{ position: "absolute", top: 8, left: 12, zIndex: 90 }}>
                        <span className="rec-pulse-dot" style={{ width: 8, height: 8, backgroundColor: "#FFFFFF" }} />
                        <span>● LIVE</span>
                      </div>
                      <div className="neon-ambient-badge-viewers" style={{ position: "absolute", top: 8, right: 12, zIndex: 90 }}>
                        <Dashicon name="visibility" size={13} />
                        <span>{guestSplitConfig.viewerRange.formattedCount}</span>
                      </div>
                    </>
                    )}

                    {/* Burbujas flotantes de reacciones DENTRO del mockup móvil */}
                    {showPhoneAmbientFx && (
                    <>
                      <div className="neon-ambient-bubble" style={{ position: "absolute", top: 120, left: 8, fontSize: "1.4rem", zIndex: 85 }}>❤️</div>
                      <div className="neon-ambient-bubble" style={{ position: "absolute", top: 250, left: 12, fontSize: "1.2rem", animationDelay: "1.2s", zIndex: 85 }}>👍</div>
                      <div className="neon-ambient-bubble" style={{ position: "absolute", top: 380, left: 6, fontSize: "1.3rem", animationDelay: "2.4s", zIndex: 85 }}>💬</div>
                      <div className="neon-ambient-bubble" style={{ position: "absolute", top: 150, right: 8, fontSize: "1.5rem", animationDelay: "0.8s", zIndex: 85 }}>✨</div>
                      <div className="neon-ambient-bubble" style={{ position: "absolute", top: 280, right: 10, fontSize: "1.3rem", animationDelay: "1.8s", zIndex: 85 }}>🔥</div>
                      <div className="neon-ambient-bubble" style={{ position: "absolute", top: 410, right: 6, fontSize: "1.4rem", animationDelay: "2.8s", zIndex: 85 }}>💖</div>
                    </>
                    )}

                    {/* Dynamic Island de Smartphone */}
                    <div className="phone-dynamic-island">
                      <span className="phone-island-cam" />
                      <span className="phone-island-dot" />
                    </div>

                    {/* HUD Superior Móvil del Teléfono (Fotos 5 y 7) */}
                    {showPhoneHudBar && (
                    <div className="phone-top-hud-bar">
                      <div className="phone-hud-user-row">
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span className="phone-hud-timer-badge">
                            {isRecording
                              ? `REC ${Math.floor(recordingDuration / 60).toString().padStart(2, "0")}:${(recordingDuration % 60).toString().padStart(2, "0")}`
                              : "00:21"}
                          </span>
                          <div className="phone-hud-user-chip">
                            <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#F43F5E", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFF", fontSize: "0.65rem", fontWeight: 800 }}>
                              M
                            </div>
                            <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#FFFFFF" }}>{streamerName || "Maddy"}</span>
                            <span style={{ color: "#3B82F6", fontSize: "0.68rem", fontWeight: 900 }}>✓</span>
                            <span style={{ fontSize: "0.62rem", color: "#CBD5E1", marginLeft: 2 }}>6 likes</span>
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(0,0,0,0.6)", padding: "2px 8px", borderRadius: 12, fontSize: "0.68rem", color: "#FFF", fontWeight: 800, border: "1px solid rgba(255,255,255,0.15)" }}>
                            <Dashicon name="heart" size={11} color="#EC4899" /> 6
                          </div>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(0,0,0,0.6)", padding: "2px 8px", borderRadius: 12, fontSize: "0.68rem", color: "#FFF", fontWeight: 800, border: "1px solid rgba(255,255,255,0.15)" }}>
                            <Dashicon name="visibility" size={11} /> {guestSplitConfig.viewerRange.formattedCount}
                          </div>
                          <button
                            type="button"
                            onClick={() => (isConnectedLive ? stopRealtime() : void startRealtime())}
                            style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.2)", color: "#FFF", fontSize: "0.68rem", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                            title="Salir / Standby"
                          >
                            <Dashicon name="dismiss" size={12} />
                          </button>
                        </div>
                      </div>

                      <div className="phone-hud-subnav-row">
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Dashicon name="format-chat" size={11} /> Chat &amp; Interview</span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Dashicon name="star-filled" size={11} color="#FBBF24" /> Weekly Ranking</span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><Dashicon name="admin-home" size={11} /> ›</span>
                      </div>

                      <div className="phone-hud-goals-row">
                        <div className="phone-hud-goal-pill" onClick={() => setShowStreamConfigModal(true)} title="Configurar metas de stream">
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Dashicon name="performance" size={12} color="#60A5FA" /> Add LIVE goal</span>
                        </div>
                        <div className="phone-hud-goal-pill" onClick={() => setShowProductCatalogModal(true)} title="Explorar regalos y tienda">
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Dashicon name="cart" size={12} color="#EC4899" /> EXPLORE GIFT HUB</span>
                        </div>
                      </div>
                    </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="monitor-reticle reticle-tl" />
                    <div className="monitor-reticle reticle-tr" />
                    <div className="monitor-reticle reticle-bl" />
                    <div className="monitor-reticle reticle-br" />

                    {/* Insignia LIVE y Contador de Espectadores Multistream (Estilo OneStream Live) */}
                    <div
                      className="monitor-live-top-bar"
                      style={{
                        position: "absolute",
                        top: 14,
                        left: 14,
                        zIndex: 60,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          backgroundColor: "#DC2626",
                          borderRadius: 6,
                          padding: "3px 8px",
                          boxShadow: "0 2px 8px rgba(220, 38, 38, 0.6)",
                        }}
                      >
                        <span className="rec-pulse-dot" style={{ width: 6, height: 6, backgroundColor: "#FFFFFF" }} />
                        <span style={{ fontSize: "0.7rem", fontWeight: 900, color: "#FFFFFF", letterSpacing: "1px" }}>
                          LIVE
                        </span>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                          backgroundColor: "rgba(0, 0, 0, 0.75)",
                          border: "1px solid rgba(255, 255, 255, 0.2)",
                          borderRadius: 6,
                          padding: "3px 8px",
                          color: "#FFFFFF",
                          fontSize: "0.72rem",
                          fontWeight: 800,
                          backdropFilter: "blur(6px)",
                        }}
                        title={`Audiencia total en vivo (${activeDestinations.length} plataformas conectadas)`}
                      >
                        <Dashicon name="visibility" size={13} />
                        <span>{(totalMultistreamViewers / 1000).toFixed(1)}K</span>
                      </div>
                    </div>
                  </>
                )}

              {/* CAPA DE LOGOS Y BANNERS PROGRAMADOS EN PANTALLA */}
              <div className="monitor-overlay-layer">
                {scheduledOverlays.map((item) => {
                  const visible = isOverlayVisible(item, overlayTick);
                  return (
                    <div
                      key={item.id}
                      className={`scheduled-overlay-element pos-${item.position} anim-${item.animation} ${visible ? "visible" : "hidden"} ${item.targetUrl ? "clickable-banner" : ""}`}
                      style={{
                        width: `${item.sizePercent}%`,
                        opacity: visible ? item.opacity : 0,
                        pointerEvents: visible && item.targetUrl ? "auto" : "none",
                      }}
                      onClick={(e) => {
                        if (item.targetUrl) {
                          e.stopPropagation();
                          handleExecuteBannerUrl(item);
                        }
                      }}
                      title={`${item.name} (${item.displayMode === "permanent" ? "Fijo" : `Cada ${item.intervalSeconds}s por ${item.durationSeconds}s`})${item.targetUrl ? ` · 🔗 Clic para abrir: ${item.targetUrl}` : ""}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.imageUrl} alt={item.name} />
                      {item.targetUrl && (
                        <span className="banner-link-indicator" title={`URL Ejecutable: ${item.targetUrl}`} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <Dashicon name="external" size={11} /> URL
                        </span>
                      )}
                      {item.copyableText && (
                        <button
                          type="button"
                          className={`banner-copy-btn ${copiedBannerId === item.id ? "copied" : ""}`}
                          onClick={(e) => handleCopyBannerText(item, e)}
                          title={`Copiar texto: "${item.copyableText}"`}
                          style={{ position: "absolute", bottom: -8, right: 8, pointerEvents: "auto", display: "inline-flex", alignItems: "center", gap: 4 }}
                        >
                          <Dashicon name={copiedBannerId === item.id ? "yes-alt" : "clipboard"} size={11} />
                          <span>{copiedBannerId === item.id ? "¡Copiado!" : "Copiar"}</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Badge de Grabación en Vivo con Parpadeo */}
              {isRecording && (
                <div
                  style={{
                    position: "absolute",
                    top: 14,
                    right: 14,
                    zIndex: 60,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    backgroundColor: "rgba(0,0,0,0.85)",
                    border: "1px solid #EF4444",
                    borderRadius: 20,
                    padding: "4px 12px",
                    boxShadow: "0 0 14px rgba(239, 68, 68, 0.6)",
                  }}
                >
                  <span className="rec-pulse-dot" />
                  <span style={{ fontSize: "0.75rem", fontWeight: 900, color: "#EF4444", letterSpacing: "1px" }}>
                    REC {Math.floor(recordingDuration / 60).toString().padStart(2, "0")}:
                    {(recordingDuration % 60).toString().padStart(2, "0")}
                  </span>
                  <span style={{ fontSize: "0.68rem", color: "#9CA3AF" }}>({recordingResolution})</span>
                </div>
              )}

              {/* TELEPROMPTER EN PANTALLA (HUD PRIVADO EXCLUSIVO DEL STREAMER - INVISIBLE PARA LA AUDIENCIA Y OBS) */}
              {teleprompterActive && teleprompterPosition !== "dock" && (
                <div
                  className={`teleprompter-stage-overlay pos-${teleprompterPosition} ${teleprompterMirror ? "mirror-mode" : ""}`}
                  style={{ backgroundColor: `rgba(0, 0, 0, ${teleprompterOpacity})` }}
                >
                  <div className="teleprompter-private-badge">
                    <span className="teleprompter-private-badge-tag">
                      <Dashicon name="lock" size={11} color="#10B981" />
                      <span>HUD PRIVADO STREAMER</span>
                    </span>
                    <span className="teleprompter-private-badge-desc">
                      Solo visible para ti • Invisible en OBS y para los espectadores
                    </span>
                  </div>

                  <button
                    type="button"
                    className="teleprompter-nav-arrow arrow-prev"
                    onClick={() => setTeleprompterScrollY((y) => Math.max(0, y - 60))}
                    title="Retroceder guion"
                  >
                    ‹
                  </button>

                  <div className="teleprompter-text-viewport">
                    <div
                      className="teleprompter-text-content"
                      style={{
                        transform: `translateY(-${teleprompterScrollY}px)`,
                        fontSize: `${teleprompterFontSize}px`,
                      }}
                    >
                      {teleprompterScript.split("\n").map((line, idx) => (
                        <p key={idx} style={{ margin: "6px 0" }}>
                          {line || "\u00A0"}
                        </p>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="teleprompter-nav-arrow arrow-next"
                    onClick={() => setTeleprompterScrollY((y) => y + 60)}
                    title="Avanzar guion"
                  >
                    ›
                  </button>

                  <div className="teleprompter-hud-controls">
                    <button
                      type="button"
                      className="teleprompter-hud-btn"
                      style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
                      onClick={() => setTeleprompterPlaying((p) => !p)}
                    >
                      <Dashicon name={teleprompterPlaying ? "controls-pause" : "controls-play"} size={12} />
                      <span>{teleprompterPlaying ? "Pausar" : "Reanudar"}</span>
                    </button>
                    <button
                      type="button"
                      className="teleprompter-hud-btn"
                      onClick={() => setTeleprompterScrollY(0)}
                    >
                      ↺ Inicio
                    </button>
                    <button
                      type="button"
                      className="teleprompter-hud-btn"
                      style={{ color: "var(--accent-pink)", display: "inline-flex", alignItems: "center", gap: 4 }}
                      onClick={() => setTeleprompterActive(false)}
                    >
                      <Dashicon name="no-alt" size={12} />
                      <span>Ocultar</span>
                    </button>
                  </div>
                </div>
              )}

              {/* BOTONES INTERACTIVOS FLOTANTES UBICADOS EN PANTALLA (agrupados por posición para evitar solapamientos) */}
              {screenButtonsVisible && (
                <>
                  {(
                    [
                      "screen-top-left",
                      "screen-top-center",
                      "screen-top-right",
                      "screen-center-left",
                      "screen-center-right",
                      "screen-bottom-left",
                      "screen-bottom-center",
                      "screen-bottom-right",
                    ] as const
                  ).map((placementKey) => {
                    const placedButtons = actionButtons.filter((btn) => btn.placement === placementKey);
                    if (placedButtons.length === 0) return null;
                    return (
                      <div key={placementKey} className={`screen-floating-actions-group pos-${placementKey}`}>
                        {placedButtons.map((btn) => {
                          const btnSize = btn.size || "md";
                          return (
                            <button
                              key={btn.id}
                              type="button"
                              className={`screen-floating-action-btn size-${btnSize}`}
                              style={{ borderColor: btn.color }}
                              onClick={() => void handleExecuteActionButton(btn)}
                              title={`Botón en pantalla: ${btn.label}${btn.url ? ` | Enlace: ${btn.url}` : ""}`}
                            >
                              {btn.customImageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={btn.customImageUrl} alt={btn.label} />
                              ) : (
                                <span className="floating-icon">{btn.icon}</span>
                              )}
                              <span>{btn.label}</span>
                              {btn.url && <span className="floating-url-badge">↗</span>}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </>
              )}

              {/* Badge de estado en monitor con audiencia sincronizada (sólo en modo estudio panorámico) */}
              {!showPhoneMockupFrame && (
                <div className={`badge-monitor-status ${isConnectedLive ? "live" : ""}`}>
                  <span className={`live-indicator-dot ${isConnectedLive ? "active" : ""}`} />
                  <span>{isConnectedLive ? "EN VIVO" : "+ STANDBY"}</span>
                  <span style={{ marginLeft: 6, opacity: 0.9, fontWeight: 700, fontSize: "0.68rem", display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <Dashicon name="visibility" size={12} /> {guestSplitConfig.viewerRange.formattedCount}
                  </span>
                </div>
              )}

              {/* VISTA DIVIDIDA (SPLIT SCREEN / DÚO CON INVITADO CO-HOST: VIVO + PREGRABADO O AMBOS PREGRABADOS) */}
              {isDuoSplitActive ? (() => {
                const renderDuoHostMedia = (showBgBackdrop: boolean) => (
                  <>
                    {showBgBackdrop && selectedBgId && selectedBgId !== "bg-none" && bgPreviewEnabled && (
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          backgroundImage: `url(${virtualBackgrounds.find((b) => b.id === selectedBgId)?.customImageUrl || ""})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      />
                    )}
                    {isHostVideoFileActive ? (
                      <video
                        key={localVideoFileUrl}
                        src={localVideoFileUrl ?? undefined}
                        autoPlay
                        loop
                        muted={!listenRemoteAudio}
                        playsInline
                        className="monitor-video-feed"
                        style={{
                          position: "absolute",
                          inset: 0,
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          transform: mirrorInput ? "scaleX(-1)" : "none",
                          zIndex: 1,
                        }}
                      />
                    ) : (
                      <>
                        {/* Standby visual del Host en Dúo */}
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "radial-gradient(circle at center, rgba(236,72,153,0.18) 0%, rgba(10,10,18,0.95) 75%)",
                            color: "#FFFFFF",
                            padding: 12,
                            zIndex: 1,
                          }}
                        >
                          <div
                            style={{
                              width: 52,
                              height: 52,
                              borderRadius: "50%",
                              background: "linear-gradient(135deg, #EC4899, #8B5CF6)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "1.25rem",
                              fontWeight: 800,
                              boxShadow: "0 0 20px rgba(236, 72, 153, 0.4)",
                              marginBottom: 8,
                            }}
                          >
                            {streamerName ? streamerName.charAt(0).toUpperCase() : "M"}
                          </div>
                          <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "#FFFFFF" }}>
                            {streamerName || "Maddy (Tú)"}
                          </span>
                          <span style={{ fontSize: "0.66rem", color: "rgba(255,255,255,0.7)", marginTop: 2 }}>
                            Host · Cámara en Standby
                          </span>
                          <button
                            type="button"
                            onClick={() => void startCamera()}
                            style={{
                              marginTop: 8,
                              padding: "4px 10px",
                              borderRadius: 12,
                              background: "rgba(255, 255, 255, 0.12)",
                              border: "1px solid rgba(255, 255, 255, 0.25)",
                              color: "#FFFFFF",
                              fontSize: "0.68rem",
                              fontWeight: 700,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <Dashicon name="video-alt2" size={11} color="#EC4899" />
                            <span>Activar Cámara</span>
                          </button>
                        </div>

                        <video
                          ref={localVideoRef}
                          autoPlay
                          playsInline
                          muted
                          className="monitor-video-feed"
                          style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            transform: mirrorInput ? "scaleX(-1)" : "none",
                            zIndex: 2,
                          }}
                        />
                      </>
                    )}
                    {guestSplitConfig.layout === "horizontal" && (
                      <div className="duo-stage-source-tag host">
                        {isHostVideoFileActive ? "TÚ · MP4" : "TÚ · VIVO"}
                      </div>
                    )}
                  </>
                );

                const renderDuoGuestMedia = (compactPip: boolean) => {
                  const guestIconName =
                    guestSplitConfig.selectedGuest.id === "guest-cristiano"
                      ? "star-filled"
                      : guestSplitConfig.selectedGuest.id === "guest-mia"
                        ? "art"
                        : guestSplitConfig.selectedGuest.id === "guest-alex"
                          ? "desktop"
                          : "cart";

                  if (isGuestVideoFileActive && guestSplitConfig.customVideoUrl) {
                    return (
                      <video
                        key={guestSplitConfig.customVideoUrl}
                        src={guestSplitConfig.customVideoUrl}
                        autoPlay
                        loop
                        muted={guestSplitConfig.guestMuted}
                        playsInline
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    );
                  }

                  if (compactPip) {
                    return (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", color: "#FFFFFF", padding: 8 }}>
                        {guestSplitConfig.selectedGuest.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={guestSplitConfig.selectedGuest.avatarUrl}
                            alt={guestSplitConfig.selectedGuest.name}
                            style={{ width: 42, height: 42, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(255,255,255,0.45)" }}
                          />
                        ) : (
                          <Dashicon name={guestIconName} size={26} />
                        )}
                        <span style={{ fontSize: "0.7rem", fontWeight: 800, marginTop: 4 }}>{guestSplitConfig.selectedGuest.name}</span>
                      </div>
                    );
                  }

                  return (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "100%",
                        height: "100%",
                        background: guestSplitConfig.selectedGuest.posterBg,
                        position: "relative",
                      }}
                    >
                      <div
                        style={{
                          width: 72,
                          height: 72,
                          borderRadius: "50%",
                          border: "3px solid rgba(255, 255, 255, 0.4)",
                          boxShadow: "0 0 25px rgba(236, 72, 153, 0.5)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#FFFFFF",
                          overflow: "hidden",
                        }}
                      >
                        {guestSplitConfig.selectedGuest.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={guestSplitConfig.selectedGuest.avatarUrl}
                            alt={guestSplitConfig.selectedGuest.name}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          <Dashicon name={guestIconName} size={36} />
                        )}
                      </div>
                      <span style={{ marginTop: 6, fontSize: "0.82rem", color: "#FFFFFF", fontWeight: 800 }}>
                        {guestSplitConfig.selectedGuest.name}
                      </span>
                    </div>
                  );
                };

                return (
                <div
                  className={`split-screen-guest-viewport ${guestSplitConfig.layout}`}
                  style={{
                    width: "100%",
                    height: "100%",
                    position: "relative",
                  }}
                >
                  {/* SI EL MODO ES VERTICAL (TOP / BOTTOM - IDÉNTICO A TIKTOK / INSTAGRAM LIVE) */}
                  {guestSplitConfig.layout === "vertical" ? (
                    <>
                      {/* 1. MITAD SUPERIOR: FEED DEL INVITADO (50% TOP) */}
                      <div
                        className="split-guest-half"
                        style={{
                          background: guestSplitConfig.selectedGuest.posterBg,
                          position: "relative",
                          width: "100%",
                          height: "50%",
                        }}
                      >
                        {renderDuoGuestMedia(false)}

                        {/* Badge superior del invitado */}
                        <div
                          className="split-guest-badge-pill"
                          style={{
                            position: "absolute",
                            top: 46,
                            left: 14,
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            background: "rgba(0, 0, 0, 0.65)",
                            backdropFilter: "blur(6px)",
                            borderRadius: 14,
                            padding: "2px 8px",
                            border: "1px solid rgba(255, 255, 255, 0.15)",
                            zIndex: 20,
                          }}
                        >
                          <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#FFFFFF" }}>
                            {guestSplitConfig.selectedGuest.name}
                          </span>
                          {guestSplitConfig.selectedGuest.isVerified && (
                            <span style={{ color: "#3B82F6", fontSize: "0.68rem", fontWeight: 900 }}>✓</span>
                          )}
                          <span style={{ fontSize: "0.6rem", color: isGuestVideoFileActive ? "#FCD34D" : "#93C5FD", fontWeight: 700 }}>
                            {isGuestVideoFileActive ? "MP4 Pregrabado" : guestSplitConfig.selectedGuest.statusText}
                          </span>
                        </div>

                        {/* Botones de acción del invitado a la derecha */}
                        <div className="guest-side-actions-bar">
                          <button
                            type="button"
                            className="guest-side-icon-btn"
                            onClick={() => setGuestSplitConfig(prev => ({ ...prev, guestMuted: !prev.guestMuted }))}
                            title={guestSplitConfig.guestMuted ? "Desmutear invitado" : "Mutear invitado"}
                          >
                            <Dashicon name={guestSplitConfig.guestMuted ? "controls-volumeoff" : "microphone"} size={14} />
                          </button>
                          <div className="guest-side-icon-btn" title="Cámara en vivo">
                            <Dashicon name="camera" size={14} />
                          </div>
                          <div className="guest-side-icon-btn" title="Filtro belleza activo">
                            <Dashicon name="art" size={14} />
                          </div>
                        </div>

                        {/* Burbuja de diálogo en vivo del invitado */}
                        <div className="guest-speech-bubble-overlay">
                          <div className="guest-bubble-speaker">
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                              <Dashicon name="format-chat" size={12} color="#60A5FA" />
                              <span>{guestSplitConfig.selectedGuest.name}</span>
                            </span>
                            <span style={{ opacity: 0.6 }}>· {isGuestVideoFileActive ? "MP4:" : "En directo:"}</span>
                            <div style={{ display: "inline-flex", alignItems: "center", gap: 2, marginLeft: 4 }}>
                              <span style={{ width: 3, height: 7, background: "#10B981", borderRadius: 2 }} />
                              <span style={{ width: 3, height: 11, background: "#10B981", borderRadius: 2 }} />
                              <span style={{ width: 3, height: 5, background: "#10B981", borderRadius: 2 }} />
                            </div>
                          </div>
                          <div className="guest-bubble-text">
                            &quot;{guestSplitConfig.selectedGuest.speechPrompts[guestSplitConfig.currentPromptIndex] || guestSplitConfig.selectedGuest.speechPrompts[0]}&quot;
                          </div>
                        </div>
                      </div>

                      {/* 2. MITAD INFERIOR: FEED DEL HOST / STREAMER (50% BOTTOM) */}
                      <div className="split-host-half" style={{ width: "100%", height: "50%", position: "relative" }}>
                        {renderDuoHostMedia(true)}
                        <div
                          className="split-host-mic-pill"
                          style={{
                            position: "absolute",
                            bottom: 8,
                            left: 10,
                            background: "rgba(0, 0, 0, 0.7)",
                            backdropFilter: "blur(6px)",
                            borderRadius: 10,
                            padding: "2px 8px",
                            fontSize: "0.65rem",
                            color: "#FFFFFF",
                            fontWeight: 800,
                            zIndex: 20,
                            border: "1px solid rgba(255, 255, 255, 0.15)",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                          }}
                        >
                          <Dashicon name="admin-users" size={11} /> {isHostVideoFileActive ? "Tú (MP4 Pregrabado)" : "Tú (Host en Vivo)"} · <Dashicon name="microphone" size={11} color="#10B981" /> Mic Activo
                        </div>
                      </div>
                    </>
                  ) : guestSplitConfig.layout === "pip" ? (
                    /* SI EL MODO ES FLOTANTE (PIP SOBRE EL HOST A PANTALLA COMPLETA) */
                    <>
                      <div className="split-host-half" style={{ width: "100%", height: "100%", position: "relative" }}>
                        {renderDuoHostMedia(false)}
                        <div className="split-host-mic-pill" style={{ position: "absolute", bottom: 10, left: 10, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)", padding: "3px 10px", borderRadius: 10, fontSize: "0.68rem", color: "#FFF", fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 5, border: "1px solid rgba(255,255,255,0.15)" }}>
                          <Dashicon name="admin-users" size={12} /> {isHostVideoFileActive ? "Tú (MP4)" : "Tú (Host)"} · <Dashicon name="microphone" size={12} color="#10B981" /> Mic Activo
                        </div>
                      </div>

                      {/* Ventana flotante PiP del Invitado Co-Host */}
                      <div
                        className="split-pip-floating-card"
                        style={{ background: guestSplitConfig.selectedGuest.posterBg }}
                      >
                        {renderDuoGuestMedia(true)}
                        <div className="split-pip-top-bar">
                          <span style={{ fontSize: "0.62rem", fontWeight: 800, color: "#FFFFFF" }}>
                            {guestSplitConfig.selectedGuest.name} {isGuestVideoFileActive ? "· MP4" : ""}
                          </span>
                          <button
                            type="button"
                            className="guest-side-icon-btn"
                            style={{ width: 24, height: 24 }}
                            onClick={() => setGuestSplitConfig((prev) => ({ ...prev, guestMuted: !prev.guestMuted }))}
                            title={guestSplitConfig.guestMuted ? "Desmutear invitado" : "Mutear invitado"}
                          >
                            <Dashicon name={guestSplitConfig.guestMuted ? "controls-volumeoff" : "microphone"} size={12} />
                          </button>
                        </div>
                        <div className="split-pip-speech-mini">
                          &quot;{guestSplitConfig.selectedGuest.speechPrompts[guestSplitConfig.currentPromptIndex] || guestSplitConfig.selectedGuest.speechPrompts[0]}&quot;
                        </div>
                      </div>
                    </>
                  ) : (
                    /* SI EL MODO ES HORIZONTAL (SIDE BY SIDE / BATALLA PK) */
                    <>
                      <div className="split-host-half" style={{ width: "50%", height: "100%", borderRight: "2px solid rgba(236, 72, 153, 0.6)", position: "relative" }}>
                        {renderDuoHostMedia(false)}
                        <div className="split-host-mic-pill" style={{ position: "absolute", bottom: 8, left: 8, background: "rgba(0,0,0,0.7)", padding: "2px 8px", borderRadius: 8, fontSize: "0.65rem", color: "#FFF", fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <Dashicon name="star-filled" size={11} color="#FBBF24" /> {isHostVideoFileActive ? "Tú (MP4)" : "Tú (Host)"}
                        </div>
                      </div>

                      <div className="split-guest-half" style={{ width: "50%", height: "100%", background: guestSplitConfig.selectedGuest.posterBg, position: "relative" }}>
                        {renderDuoGuestMedia(false)}
                        <div className="duo-stage-source-tag guest">
                          {isGuestVideoFileActive ? "INVITADO · MP4" : "INVITADO · VIVO"}
                        </div>
                        <div className="guest-speech-bubble-overlay">
                          <div className="guest-bubble-speaker">
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                              <Dashicon name="format-chat" size={12} color="#60A5FA" />
                              <span>{guestSplitConfig.selectedGuest.name}</span>
                            </span>
                          </div>
                          <div className="guest-bubble-text">
                            &quot;{guestSplitConfig.selectedGuest.speechPrompts[guestSplitConfig.currentPromptIndex]}&quot;
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                );
              })() : (
                <div style={{ width: "100%", height: "100%", position: "relative" }}>
                  {/* PREVISUALIZACIÓN DE FONDO VIRTUAL O VIDEO EN BUCLE A PANTALLA COMPLETA */}
                  {selectedBgId && selectedBgId !== "bg-none" && bgPreviewEnabled && !isConnectedLive && (
                    <div
                      className="monitor-full-bg-layer"
                      style={{
                        position: "absolute",
                        inset: 0,
                        overflow: "hidden",
                        zIndex: 0,
                      }}
                    >
                      {virtualBackgrounds.find((b) => b.id === selectedBgId)?.mediaType === "video" ? (
                        <video
                          src={virtualBackgrounds.find((b) => b.id === selectedBgId)?.customVideoUrl || virtualBackgrounds.find((b) => b.id === selectedBgId)?.customImageUrl}
                          autoPlay
                          loop
                          muted
                          playsInline
                          controls={false}
                          controlsList="nodownload"
                          disablePictureInPicture
                          onContextMenu={(e) => e.preventDefault()}
                          style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            pointerEvents: "none",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            backgroundImage: `url(${virtualBackgrounds.find((b) => b.id === selectedBgId)?.customImageUrl || ""})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }}
                        />
                      )}
                    </div>
                  )}

                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    muted={!listenRemoteAudio}
                    className="monitor-video-feed"
                    style={{ display: isConnectedLive ? "block" : "none" }}
                  />
                  {/* Video pregrabado o clip cargado en el monitor */}
                  {localVideoFileUrl && !isConnectedLive && (
                    <video
                      key={localVideoFileUrl}
                      src={localVideoFileUrl}
                      autoPlay
                      loop
                      muted={!listenRemoteAudio}
                      playsInline
                      controls={activeTab === "CLIPS"}
                      className="monitor-video-feed"
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        transform: mirrorInput ? "scaleX(-1)" : "none",
                        zIndex: 2,
                      }}
                    />
                  )}

                  {/* Standby visual si no hay stream activo todavía */}
                  {!isConnectedLive && !localVideoFileUrl && (!selectedBgId || selectedBgId === "bg-none" || !bgPreviewEnabled) && (
                    activeTab === "CLIPS" ? (
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "radial-gradient(circle at center, rgba(236,72,153,0.16) 0%, rgba(10,10,18,0.95) 80%)",
                          color: "#FFFFFF",
                          padding: 16,
                          zIndex: 1,
                        }}
                      >
                        <div
                          style={{
                            width: 64,
                            height: 64,
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, #EC4899, #8B5CF6)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "1.7rem",
                            boxShadow: "0 0 25px rgba(236, 72, 153, 0.45)",
                            marginBottom: 10,
                          }}
                        >
                          🎬
                        </div>
                        <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "#FFFFFF" }}>
                          Cabina de Clips Pregrabados
                        </span>
                        <span style={{ fontSize: "0.74rem", color: "rgba(255,255,255,0.7)", marginTop: 4, maxWidth: 320, textAlign: "center" }}>
                          Sube un video en la cabina izquierda o carga un clip terminado de la cola para reproducir aquí
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const fileInput = document.querySelector<HTMLInputElement>(".queue-clips-dock-panel input[type=file]");
                            fileInput?.click();
                          }}
                          style={{
                            marginTop: 12,
                            padding: "6px 14px",
                            borderRadius: 14,
                            background: "rgba(236, 72, 153, 0.2)",
                            border: "1px solid #EC4899",
                            color: "#FFFFFF",
                            fontSize: "0.74rem",
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                          }}
                        >
                          <Dashicon name="upload" size={13} color="#F472B6" />
                          <span>Seleccionar Video MP4 / WebM</span>
                        </button>
                      </div>
                    ) : (
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "radial-gradient(circle at center, rgba(236,72,153,0.12) 0%, rgba(10,10,18,0.92) 80%)",
                          color: "#FFFFFF",
                          padding: 16,
                          zIndex: 1,
                        }}
                      >
                        <div
                          style={{
                            width: 64,
                            height: 64,
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, #EC4899, #8B5CF6)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "1.5rem",
                            fontWeight: 800,
                            boxShadow: "0 0 25px rgba(236, 72, 153, 0.45)",
                            marginBottom: 10,
                          }}
                        >
                          {streamerName ? streamerName.charAt(0).toUpperCase() : "M"}
                        </div>
                        <span style={{ fontSize: "0.92rem", fontWeight: 800, color: "#FFFFFF" }}>
                          {streamerName || "Maddy"}
                        </span>
                        <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.7)", marginTop: 4 }}>
                          Cámara en espera · Pulsa Iniciar o Cargar MP4
                        </span>
                        <button
                          type="button"
                          onClick={() => void startCamera()}
                          style={{
                            marginTop: 10,
                            padding: "5px 12px",
                            borderRadius: 14,
                            background: "rgba(255, 255, 255, 0.12)",
                            border: "1px solid rgba(255, 255, 255, 0.25)",
                            color: "#FFFFFF",
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                          }}
                        >
                          <Dashicon name="video-alt2" size={12} color="#EC4899" />
                          <span>Activar Cámara</span>
                        </button>
                      </div>
                    )
                  )}

                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={
                      bgPreviewEnabled && !isConnectedLive && selectedBgId !== "bg-none" && bgPreviewMode === "pip_camera"
                        ? "monitor-pip-camera"
                        : "monitor-video-feed"
                    }
                    style={{
                      display:
                        isConnectedLive
                          ? "none"
                          : localVideoFileUrl
                          ? "none"
                          : bgPreviewEnabled && selectedBgId !== "bg-none" && bgPreviewMode === "backdrop"
                          ? "none"
                          : "block",
                      transform: mirrorInput ? "scaleX(-1)" : "none",
                      zIndex: 2,
                    }}
                  />
                </div>
              )}

              {/* COMENTARIO FIJADO DESDE UNIFIED LIVE CHAT */}
              {pinnedChatMessage && (
                <div className="monitor-pinned-chat-overlay" role="status" aria-live="polite">
                  <div className="monitor-pinned-chat-content">
                    <div
                      className="chat-avatar monitor-pinned-avatar"
                      style={{
                        backgroundColor: pinnedChatMessage.avatarColor,
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={pinnedChatMessage.avatarUrl || getFaceAvatarUrl(pinnedChatMessage.author, pinnedChatMessage.gender)}
                        alt={pinnedChatMessage.author}
                        style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.style.display = "none";
                          if (target.parentElement) {
                            target.parentElement.innerText = pinnedChatMessage.avatarLetter;
                          }
                        }}
                      />
                    </div>
                    <div className="monitor-pinned-text-col">
                      <div className="monitor-pinned-meta-row">
                        <PlatformLogo platform={pinnedChatMessage.platform} size={14} />
                        <span className="monitor-pinned-author">
                          {pinnedChatMessage.author}
                        </span>
                        {pinnedChatMessage.isDonation && (
                          <span className="donation-amount-badge" style={{ fontSize: "0.64rem", padding: "1px 5px" }}>
                            {pinnedChatMessage.donationAmount}
                          </span>
                        )}
                      </div>
                      <span className="monitor-pinned-message-text">{pinnedChatMessage.message}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="monitor-pinned-close-btn"
                    onClick={() => setPinnedChatMessage(null)}
                    aria-label="Desfijar comentario de la pantalla"
                    title="Desfijar de la pantalla"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* CHAT IA REAL-FEEL CON ESTÉTICA NATIVA TIKTOK LIVE (POSICIONADO EN LA ZONA INFERIOR SIN TAPAR A LA PERSONA) */}
              {realFeelChatEnabled && (
                <RealFeelLiveChatOverlay
                  onPinMessage={(msg) => setPinnedChatMessage(msg)}
                  pinnedMessageId={pinnedChatMessage?.id}
                  viewerRange={guestSplitConfig.viewerRange}
                  showHearts={true}
                  showBottomBar={false}
                  onOpenWhatsApp={() => setShowWhatsAppBubblePopover((prev) => !prev)}
                  showLiveGoal={!showPhoneMockupFrame}
                  streamerName={streamerName}
                  bottomPadding={showPhoneMockupFrame ? (activeProduct ? 76 : 14) : 14}
                  maxVisible={showPhoneMockupFrame ? 4 : 4}
                  compactMode={showPhoneMockupFrame}
                  hasActiveProduct={!!activeProduct}
                  hasPipCamera={
                    bgPreviewEnabled &&
                    !isConnectedLive &&
                    selectedBgId !== "bg-none" &&
                    bgPreviewMode === "pip_camera"
                  }
                  externalMessageToPush={underMonitorChatPush}
                  chatLanguage={chatLanguage}
                />
              )}

              {/* MARCO DE MARCA TIKTOK LIVE (FORMATO VERTICAL 9:16) */}
              {activeTikTokTheme && effectiveCropMode === "9:16" && (
                <div
                  className="monitor-tiktok-brand-overlay"
                  style={
                    showPhoneMockupFrame
                      ? {
                          justifyContent: "flex-start",
                          border: `2px solid ${activeTikTokTheme.accentColor}`,
                          borderRadius: 34,
                        }
                      : undefined
                  }
                >
                  {showPhoneMockupFrame ? (
                    <div
                      style={{
                        marginTop: 114,
                        marginLeft: 12,
                        marginRight: 12,
                        padding: "6px 12px",
                        borderRadius: 12,
                        background: `linear-gradient(90deg, ${activeTikTokTheme.secondaryColor}CC 0%, rgba(10,10,16,0.75) 100%)`,
                        border: `1px solid ${activeTikTokTheme.accentColor}88`,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        backdropFilter: "blur(6px)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {activeTikTokTheme.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={activeTikTokTheme.logoUrl}
                            alt={`${activeTikTokTheme.brandName} logo`}
                            style={{ width: 24, height: 24, objectFit: "contain", borderRadius: 4, flexShrink: 0 }}
                          />
                        ) : (
                          <span>{activeTikTokTheme.decorations[0]}</span>
                        )}
                        <div>
                          <div style={{ fontSize: "0.74rem", fontWeight: 900, color: "#FFFFFF", lineHeight: 1.1 }}>
                            {activeTikTokTheme.brandName}
                          </div>
                          <div style={{ fontSize: "0.62rem", color: activeTikTokTheme.accentColor, fontWeight: 700 }}>
                            {activeTikTokTheme.tagline}
                          </div>
                        </div>
                      </div>
                      <span
                        className="tiktok-shop-pill-btn"
                        style={{ backgroundColor: activeTikTokTheme.accentColor, color: "#000", fontSize: "0.62rem", padding: "3px 8px", display: "inline-flex", alignItems: "center", gap: 4 }}
                      >
                        <Dashicon name="cart" size={11} /> SHOP
                      </span>
                    </div>
                  ) : (
                    <>
                      <div
                        style={{
                          padding: "16px 14px",
                          background: `linear-gradient(180deg, ${activeTikTokTheme.secondaryColor}DD 0%, transparent 100%)`,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div className="tiktok-live-pill">
                            <span className="rec-pulse-dot" style={{ width: 6, height: 6, backgroundColor: "#FFF" }} />
                            <span>LIVE</span>
                            <span>{guestSplitConfig.viewerRange.formattedCount}</span>
                          </div>
                          <div className="tiktok-brand-chip" style={{ borderColor: activeTikTokTheme.accentColor }}>
                            {activeTikTokTheme.logoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={activeTikTokTheme.logoUrl}
                                alt={`${activeTikTokTheme.brandName} logo`}
                                style={{ width: 18, height: 18, objectFit: "contain", borderRadius: 4, flexShrink: 0 }}
                              />
                            ) : (
                              <span>{activeTikTokTheme.decorations[0]}</span>
                            )}
                            <strong>{activeTikTokTheme.brandName}</strong>
                          </div>
                        </div>
                        <span style={{ fontSize: "0.68rem", fontWeight: 900, color: activeTikTokTheme.accentColor }}>
                          {activeTikTokTheme.topBadge}
                        </span>
                      </div>

                      <div
                        style={{
                          padding: "12px 14px",
                          background: "linear-gradient(0deg, #0A0A10F5 0%, #0A0A10B0 100%)",
                          borderTop: `2px solid ${activeTikTokTheme.accentColor}`,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {activeTikTokTheme.logoUrl && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={activeTikTokTheme.logoUrl}
                                alt={`${activeTikTokTheme.brandName} logo PNG`}
                                style={{ width: 28, height: 28, objectFit: "contain", flexShrink: 0 }}
                              />
                            )}
                            <div>
                              <div style={{ fontSize: "0.85rem", fontWeight: 900, color: "#FFFFFF" }}>
                                {activeTikTokTheme.brandName}
                              </div>
                              <div style={{ fontSize: "0.72rem", color: activeTikTokTheme.accentColor, fontWeight: 700 }}>
                                {activeTikTokTheme.tagline}
                              </div>
                            </div>
                          </div>
                          <div
                            className="tiktok-shop-pill-btn"
                            style={{ backgroundColor: activeTikTokTheme.accentColor, color: "#000", display: "inline-flex", alignItems: "center", gap: 5 }}
                          >
                            <Dashicon name="cart" size={12} /> SHOP
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* TARJETA DE PRODUCTO COMPRABLE EN VIVO (SHOPPABLE PRODUCT CARD - ESTILO ONESTREAM LIVE) */}
              {activeProduct && (
                <div
                  className={`shoppable-product-card-stage pos-${liveShopGlobalPosition || activeProduct.position || "bottom-center"}`}
                  onClick={() => window.open(activeProduct.linkUrl, "_blank")}
                  title={`Clic para ver o comprar ${activeProduct.title} (${activeProduct.linkUrl})`}
                >
                  <button
                    type="button"
                    className="shoppable-close-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveProductId(null);
                    }}
                    title="Ocultar tarjeta de producto del escenario"
                  >
                    ×
                  </button>

                  <div className="shoppable-card-thumb-wrap">
                    <div className="shoppable-card-thumb-inner">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={activeProduct.imageUrl} alt={activeProduct.title} />
                    </div>
                  </div>

                  <div className="shoppable-card-details">
                    <div className="shoppable-live-badge-row">
                      <span className="shoppable-live-tag">
                        <Dashicon name="cart" size={10} />
                        <span>SHOP QR EN VIVO</span>
                      </span>
                    </div>
                    <div className="shoppable-card-title">{activeProduct.title}</div>
                    {activeProduct.subtitle && (
                      <div className="shoppable-card-sub">{activeProduct.subtitle}</div>
                    )}
                    <div className="shoppable-card-price-row">
                      <span className="shoppable-card-price-current">
                        {activeProduct.currencySymbol}{activeProduct.price.toFixed(2)}
                      </span>
                      {activeProduct.compareAtPrice && (
                        <span className="shoppable-card-price-compare">
                          {activeProduct.currencySymbol}{activeProduct.compareAtPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div
                    className="shoppable-card-qr-box"
                    title="Escanea este código QR con tu celular para abrir y comprar el producto"
                  >
                    {activeProduct.qrCodeDataUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={activeProduct.qrCodeDataUrl} alt="QR Escaneable de Compra" />
                    ) : (
                      <span style={{ fontSize: "0.6rem", color: "#6B7280", textAlign: "center" }}>
                        QR CODE
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* BURBUJA FLOTANTE DE WHATSAPP EN PANTALLA (SI ESTÁ ACTIVA EN CAPAS) */}
              {whatsappConfig.showOnScreen && (
                <div
                  className={`whatsapp-stage-floating-bubble pos-${whatsappConfig.position || "bottom-left"} ${showPhoneMockupFrame ? "in-mockup" : ""}`}
                  onClick={() => setShowWhatsAppBubblePopover((prev) => !prev)}
                  style={{
                    position: "absolute",
                    bottom: showPhoneMockupFrame ? 70 : 20,
                    left: 20,
                    zIndex: 56,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: "rgba(14, 20, 18, 0.92)",
                    backdropFilter: "blur(12px)",
                    border: "1.5px solid #25D366",
                    borderRadius: 24,
                    padding: "6px 12px",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.6), 0 0 16px rgba(37, 211, 102, 0.35)",
                    color: "#FFFFFF",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  }}
                  title={`Clic para abrir WhatsApp (${whatsappConfig.phoneNumber})`}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <SocialIcon network="whatsapp" size={17} />
                  </div>
                  <span>{whatsappConfig.callToAction || "WhatsApp"}</span>
                  {whatsappConfig.aiAgentEnabled && (
                    <span
                      style={{
                        background: "#25D366",
                        color: "#000",
                        fontSize: "0.58rem",
                        fontWeight: 900,
                        padding: "1px 5px",
                        borderRadius: 999,
                      }}
                    >
                      IA
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      persistWhatsAppConfig({ ...whatsappConfig, showOnScreen: false });
                    }}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#94A3B8",
                      fontSize: "0.9rem",
                      cursor: "pointer",
                      padding: "0 0 0 4px",
                      lineHeight: 1,
                    }}
                    title="Ocultar de pantalla"
                  >
                    ×
                  </button>
                </div>
              )}

              {/* Barra inferior móvil de acciones dentro del marco 9:16 de escritorio */}
              {showPhoneMockupFrame && showPhoneMockupBottomDock && (
                <div className="phone-bottom-actions-dock">
                  <div className="phone-bottom-tools-row">
                    <button type="button" className="phone-bottom-tool-item" onClick={() => navigateToMainTab("DUO")} title="Abrir cabina Co-Host en Dúo">
                      <div className="phone-bottom-tool-icon"><Dashicon name="groups" size={15} /></div>
                      <span>+Guests</span>
                    </button>
                    <button type="button" className="phone-bottom-tool-item" onClick={() => setShowProductCatalogModal(true)} title="Abrir productos para venta en vivo">
                      <div className="phone-bottom-tool-icon"><Dashicon name="cart" size={15} /></div>
                      <span>Business</span>
                    </button>
                    <button type="button" className="phone-bottom-tool-item" onClick={() => setShowStreamConfigModal(true)} title="Configurar transmisión y audiencia">
                      <div className="phone-bottom-tool-icon"><Dashicon name="admin-generic" size={15} /></div>
                      <span>Config</span>
                    </button>
                    <button type="button" className="phone-bottom-tool-item" onClick={() => navigateToMainTab("TIKTOK_LIVE")} title="Abrir página TikTok Live con Marcas">
                      <div className="phone-bottom-tool-icon"><Dashicon name="art" size={15} /></div>
                      <span>Brand</span>
                    </button>
                    <button type="button" className="phone-bottom-tool-item" onClick={() => setShowObsModal(true)} title="Compartir señal con OBS / Virtual Camera">
                      <div className="phone-bottom-tool-icon"><Dashicon name="share" size={15} /></div>
                      <span>Share</span>
                    </button>
                    <button type="button" className="phone-bottom-tool-item" onClick={() => navigateToMainTab("TRY_ON")} title="Abrir cabina Try-On en vivo">
                      <div className="phone-bottom-tool-icon"><Dashicon name="products" size={15} /></div>
                      <span>Try-On</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
            {/* Cierre del envoltorio relativo del monitor */}
            </div>

            {/* CASILLA DE COMENTARIOS DEBAJO DE LA PANTALLA CON BURBUJA DE WHATSAPP AL LADO */}
            <div
              className="under-monitor-comment-row"
              style={{
                width: "100%",
                maxWidth:
                  effectiveCropMode === "9:16"
                    ? mobileViewScale === "xl"
                      ? 560
                      : mobileViewScale === "lg"
                      ? 480
                      : 400
                    : mobileViewScale === "xl"
                    ? 1400
                    : mobileViewScale === "lg"
                    ? 1240
                    : 1020,
                display: "flex",
                alignItems: "center",
                gap: 10,
                margin: "8px 0 6px 0",
                zIndex: 25,
                position: "relative",
                boxSizing: "border-box",
                transition: "max-width 0.25s ease",
              }}
            >
                <form
                  className="under-monitor-chat-bar"
                  onSubmit={handleSendUnderMonitorChat}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 12px",
                    background: "rgba(18, 18, 28, 0.94)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    border: "1px solid rgba(255, 255, 255, 0.14)",
                    borderRadius: 24,
                    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.45)",
                    position: "relative",
                    boxSizing: "border-box",
                  }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", opacity: 0.8, flexShrink: 0 }}>
                    <Dashicon name="format-chat" size={16} color="rgba(255,255,255,0.8)" />
                  </span>
                  <input
                    type="text"
                    placeholder={
                      chatLanguage === "en"
                        ? "Add a comment..."
                        : chatLanguage === "both"
                        ? "Escribe un comentario / Add comment..."
                        : "Escribe un comentario..."
                    }
                    value={underMonitorChatText}
                    onChange={(e) => setUnderMonitorChatText(e.target.value)}
                    style={{
                      flex: 1,
                      minWidth: 100,
                      background: "transparent",
                      border: "none",
                      outline: "none",
                      color: "#FFFFFF",
                      fontSize: "0.82rem",
                      fontWeight: 500,
                    }}
                  />

                  {/* Selector rápido de idioma en la barra inferior (badge compacto de 1 clic para no robar espacio al input) */}
                  <button
                    type="button"
                    className="chat-lang-compact-badge active"
                    onClick={(e) => {
                      e.preventDefault();
                      const nextLang = chatLanguage === "es" ? "en" : chatLanguage === "en" ? "both" : "es";
                      handleUpdateChatLanguage(nextLang);
                    }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "4px 8px",
                      borderRadius: 12,
                      fontSize: "0.68rem",
                      fontWeight: 800,
                      background: "rgba(236, 72, 153, 0.18)",
                      border: "1px solid rgba(236, 72, 153, 0.5)",
                      color: "#FFFFFF",
                      cursor: "pointer",
                      flexShrink: 0,
                      whiteSpace: "nowrap",
                    }}
                    title={`Idioma actual: ${
                      chatLanguage === "es"
                        ? "Español (Clic para cambiar a Inglés)"
                        : chatLanguage === "en"
                        ? "English (Clic para cambiar a Ambos)"
                        : "Ambos idiomas (Clic para cambiar a Español)"
                    }`}
                  >
                    <span>{chatLanguage === "es" ? "🇪🇸 ES" : chatLanguage === "en" ? "🇺🇸 EN" : "🌎 Ambos"}</span>
                    <span style={{ fontSize: "0.55rem", opacity: 0.7 }}>▾</span>
                  </button>

                  <button
                    type="submit"
                    disabled={!underMonitorChatText.trim()}
                    style={{
                      width: 32,
                      height: 32,
                      minWidth: 32,
                      borderRadius: "50%",
                      background: underMonitorChatText.trim()
                        ? "linear-gradient(135deg, #EC4899, #8B5CF6)"
                        : "rgba(255, 255, 255, 0.12)",
                      border: "none",
                      color: "#FFFFFF",
                      fontSize: "0.85rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: underMonitorChatText.trim() ? "pointer" : "default",
                      boxShadow: underMonitorChatText.trim() ? "0 2px 8px rgba(236, 72, 153, 0.45)" : "none",
                      transition: "all 0.15s ease",
                      flexShrink: 0,
                    }}
                    title="Enviar comentario en vivo (o presiona Enter)"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                  </button>
                </form>

                {/* BURBUJA DE WHATSAPP AL LADO DE MENSAJES (Burbuja circular en vista móvil para maximizar el ancho del chat) */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <button
                    type="button"
                    className="whatsapp-bubble-beside-messages"
                    onClick={() => setShowWhatsAppBubblePopover((prev) => !prev)}
                    style={{
                      height: 42,
                      width: effectiveCropMode === "9:16" ? 42 : "auto",
                      minWidth: 42,
                      borderRadius: effectiveCropMode === "9:16" ? "50%" : 24,
                      padding: effectiveCropMode === "9:16" ? "0" : "0 12px",
                      justifyContent: "center",
                      background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
                      border: "1.5px solid rgba(255, 255, 255, 0.35)",
                      boxShadow: "0 4px 16px rgba(37, 211, 102, 0.45)",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      cursor: "pointer",
                      color: "#FFFFFF",
                      fontSize: "0.78rem",
                      fontWeight: 800,
                      transition: "all 0.2s ease",
                      userSelect: "none",
                      position: "relative",
                    }}
                    title="Escríbenos a WhatsApp en vivo"
                  >
                    <SocialIcon network="whatsapp" size={effectiveCropMode === "9:16" ? 22 : 18} />
                    {effectiveCropMode !== "9:16" && <span>WhatsApp</span>}
                    {whatsappConfig.aiAgentEnabled && (
                      <span
                        style={{
                          position: effectiveCropMode === "9:16" ? "absolute" : "static",
                          top: effectiveCropMode === "9:16" ? -2 : "auto",
                          right: effectiveCropMode === "9:16" ? -2 : "auto",
                          background: "#FFFFFF",
                          color: "#128C7E",
                          fontSize: "0.55rem",
                          fontWeight: 900,
                          padding: "1px 4px",
                          borderRadius: 999,
                          boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                        }}
                      >
                        IA
                      </span>
                    )}
                  </button>

                  {/* Popover al pulsar la burbuja de WhatsApp */}
                  {showWhatsAppBubblePopover && (
                    <div
                      className="whatsapp-bubble-popover"
                      style={{
                        position: "absolute",
                        bottom: "calc(100% + 10px)",
                        right: 0,
                        width: 290,
                        background: "rgba(15, 17, 26, 0.98)",
                        border: "1.5px solid #25D366",
                        borderRadius: 16,
                        padding: 14,
                        boxShadow: "0 14px 40px rgba(0,0,0,0.85), 0 0 20px rgba(37, 211, 102, 0.3)",
                        backdropFilter: "blur(14px)",
                        zIndex: 100,
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                        color: "#FFFFFF",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <SocialIcon network="whatsapp" size={16} />
                          <strong style={{ fontSize: "0.82rem", color: "#25D366" }}>
                            {whatsappConfig.callToAction || "Escríbenos a WhatsApp"}
                          </strong>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowWhatsAppBubblePopover(false)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#94A3B8",
                            cursor: "pointer",
                            fontSize: "1rem",
                            padding: 2,
                            lineHeight: 1,
                          }}
                        >
                          ✕
                        </button>
                      </div>

                      <div style={{ fontSize: "0.74rem", color: "#CBD5E1" }}>
                        Canal oficial: <strong style={{ color: "#FFFFFF" }}>{whatsappConfig.phoneNumber}</strong>
                      </div>

                      {whatsappConfig.aiAgentEnabled && (
                        <div style={{ fontSize: "0.68rem", color: "#A7F3D0", background: "rgba(37, 211, 102, 0.12)", border: "1px solid rgba(37, 211, 102, 0.3)", padding: "4px 8px", borderRadius: 6 }}>
                          🤖 Agente IA activo 24/7 para responder dudas sobre productos y ventas.
                        </div>
                      )}

                      {whatsappConfig.qrCodeDataUrl && (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "8px", background: "#FFFFFF", borderRadius: 10 }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={whatsappConfig.qrCodeDataUrl} alt="QR WhatsApp" style={{ width: 120, height: 120, display: "block" }} />
                          <span style={{ fontSize: "0.62rem", color: "#333", fontWeight: 700 }}>Apunta con tu cámara para abrir</span>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          const cleanPhone = whatsappConfig.phoneNumber.replace(/[^0-9]/g, "");
                          const waLink = cleanPhone
                            ? `https://wa.me/${cleanPhone}${whatsappConfig.defaultMessage ? `?text=${encodeURIComponent(whatsappConfig.defaultMessage)}` : ""}`
                            : "https://wa.me/";
                          window.open(waLink, "_blank");
                        }}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          borderRadius: 10,
                          background: "#25D366",
                          border: "none",
                          color: "#FFFFFF",
                          fontWeight: 800,
                          fontSize: "0.78rem",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                          boxShadow: "0 2px 10px rgba(37, 211, 102, 0.4)",
                        }}
                      >
                        <SocialIcon network="whatsapp" size={16} />
                        <span>Abrir Chat de WhatsApp ↗</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

            {/* Franja de estado compacta para móviles (<= 640px) que libera la vista de cámara */}
            <div className="mobile-stage-status-strip">
              <span className="mobile-status-chip">
                <span className={`live-indicator-dot ${isConnectedLive ? "active" : ""}`} />
                <span>{isConnectedLive ? "EN VIVO" : "STANDBY"}</span>
              </span>
              <span className="mobile-status-chip">
                <Dashicon name="admin-users" size={12} color="#60A5FA" />
                <span>{guestSplitConfig.viewerRange.formattedCount}</span>
              </span>
            </div>

            {lastActionFeedback && (
              <div className="stage-live-feedback-strip" role="status">
                <span className="stage-feedback-badge">{lastActionFeedback.badge}</span>
                <span className="stage-feedback-text">{lastActionFeedback.text}</span>
                <button
                  type="button"
                  className="stage-feedback-close"
                  onClick={() => setLastActionFeedback(null)}
                  aria-label="Cerrar confirmación"
                >
                  ×
                </button>
              </div>
            )}

            {/* Video oculto para archivo pregrabado */}
            <video
              ref={recordedVideoRef}
              src={localVideoFileUrl ?? undefined}
              playsInline
              muted
              loop
              style={{ display: "none" }}
            />

            {/* BARRA DE CONTROLES ACOPLADA AL PIE DEL MONITOR */}
            <div className="delulu-bottom-controls-bar">
              {/* Duración pill */}
              <button
                className="pill-ctrl-button"
                onClick={() => {
                  const options = [30, 60, 120, 300];
                  const nextIdx = (options.indexOf(maxDurationSec) + 1) % options.length;
                  setMaxDurationSec(options[nextIdx]);
                }}
                title="Tope máximo de duración de sesión"
              >
                <Dashicon name="clock" size={14} />
                <span>{maxDurationSec}s</span>
              </button>

              {/* Selector de fuente de video */}
              <select
                className="select-ctrl-pill"
                aria-label="Fuente de video"
                value={sourceMode}
                onChange={(e) => {
                  const mode = e.target.value as SourceMode;
                  setSourceMode(mode);
                  if (mode === "camera") void startCamera();
                }}
              >
                <option value="camera">Cámara Web</option>
                <option value="video_file">Video MP4 (Bucle)</option>
              </select>

              {/* Selector de tamaño y formato de pantalla (Móvil exclusivo 9:16) */}
              <select
                className="select-ctrl-pill"
                aria-label="Formato de pantalla"
                value={effectiveCropMode}
                disabled={isMobileViewport}
                onChange={(e) => handleSelectAspectRatio(e.target.value as CropAspectMode)}
                title={isMobileViewport ? "En versión móvil el formato único es 9:16 vertical" : "Configurar tamaño y formato de pantalla"}
              >
                {isMobileViewport ? (
                  <option value="9:16">9:16 Vertical</option>
                ) : (
                  <>
                    <option value="16:9">16:9 Panorámico</option>
                    <option value="9:16">9:16 Vertical (TikTok)</option>
                    <option value="1:1">1:1 Cuadrado</option>
                    <option value="4:3">4:3 Clásico</option>
                    <option value="zoom">Zoom 1.3x</option>
                  </>
                )}
              </select>

              {/* Selector de Resolución */}
              <select
                className="select-ctrl-pill"
                aria-label="Resolución de salida"
                style={{ borderColor: "#10B981", fontWeight: 800 }}
                value={recordingResolution}
                onChange={(e) => setRecordingResolution(e.target.value as RecordingResolution)}
                title="Resolución de pantalla y grabación"
              >
                <option value="480p">480p</option>
                <option value="720p">720p</option>
                <option value="1080p">1080p</option>
                <option value="4k">4K</option>
              </select>

              {/* Si es cámara: selector de dispositivo */}
              {sourceMode === "camera" && cameraDevices.length > 0 && (
                <select
                  className="select-ctrl-pill select-device-wide"
                  aria-label="Seleccionar cámara"
                  value={selectedCameraId}
                  onChange={(e) => {
                    setSelectedCameraId(e.target.value);
                    setTimeout(() => void startCamera(), 50);
                  }}
                >
                  {cameraDevices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Cámara ${d.deviceId.slice(0, 5)}`}
                    </option>
                  ))}
                </select>
              )}

              {/* Si es video pregrabado: botón de cargar */}
              {sourceMode === "video_file" && (
                <label className="pill-ctrl-button" style={{ cursor: "pointer" }}>
                  <Dashicon name="upload" size={14} />
                  <span>{localVideoFileUrl ? "Cambiar Video" : "Cargar MP4"}</span>
                  <input
                    type="file"
                    accept="video/mp4,video/webm"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      handleVideoFileSelected(e.target.files?.[0] ?? null);
                      setTimeout(() => void captureFromVideoElement(), 200);
                    }}
                  />
                </label>
              )}

              {/* Selector de micrófono */}
              <select
                className="select-ctrl-pill select-device-wide"
                aria-label="Seleccionar micrófono"
                style={{ borderColor: "var(--accent-pink)" }}
                value={selectedAudioId}
                onChange={(e) => {
                  const newId = e.target.value;
                  setSelectedAudioId(newId);
                  if (sourceMode === "camera") {
                    setTimeout(() => void startCamera(), 50);
                  } else if (sourceMode === "video_file") {
                    setTimeout(() => void captureFromVideoElement(), 50);
                  }
                }}
              >
                {audioDevices.length > 0 ? (
                  audioDevices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      Mic: {d.label || "Micrófono"}
                    </option>
                  ))
                ) : (
                  <option value="">Micrófono predeterminado</option>
                )}
              </select>

              {/* Botón de reproducción de sonido / retorno de audio */}
              <button
                className={`pill-ctrl-button ${listenRemoteAudio ? "active-pink" : ""}`}
                onClick={() => {
                  setListenRemoteAudio((prev) => {
                    const next = !prev;
                    if (remoteVideoRef.current) {
                      remoteVideoRef.current.muted = !next;
                      remoteVideoRef.current.volume = 1.0;
                    }
                    return next;
                  });
                }}
                title={
                  listenRemoteAudio
                    ? "Sonido activo al hablar (clic para silenciar altavoz)"
                    : "Sonido silenciado (clic para escuchar retorno)"
                }
              >
                <Dashicon name={listenRemoteAudio ? "controls-volumeon" : "controls-volumeoff"} size={14} />
                <span>{listenRemoteAudio ? "Sonido ON" : "Sonido OFF"}</span>
              </button>

              {/* VU meter de audio con niveles animados */}
              <div className="vu-meter-pill" title={`Nivel de audio en vivo: ${vuLevel}%`}>
                <div className={`vu-bar-col ${vuLevel > 5 ? "lvl-1" : ""}`} />
                <div className={`vu-bar-col ${vuLevel > 30 ? "lvl-2" : ""}`} />
                <div className={`vu-bar-col ${vuLevel > 60 ? "lvl-3" : ""}`} />
                <div className={`vu-bar-col ${vuLevel > 85 ? "lvl-4" : ""}`} />
              </div>

              {/* Espejo horizontal */}
              <button
                className={`pill-ctrl-button ${mirrorInput ? "active-pink" : ""}`}
                onClick={() => setMirrorInput((prev) => !prev)}
                title="Espejo horizontal (Mirror)"
                aria-label="Espejo horizontal"
              >
                <Dashicon name="image-flip-horizontal" size={15} />
                <span className="mobile-mirror-label">Espejo</span>
              </button>
            </div>

            {streamError && (
              <div
                style={{
                  backgroundColor: "rgba(239, 68, 68, 0.15)",
                  border: "1px solid var(--danger-red)",
                  color: "#FFFFFF",
                  padding: "8px 14px",
                  borderRadius: 10,
                  fontSize: "0.78rem",
                  maxWidth: 680,
                  textAlign: "center",
                }}
              >
                ⚠️ {streamError}
              </div>
            )}
            {streamInfo && !streamError && (
              <div
                style={{
                  backgroundColor: "rgba(52, 211, 153, 0.1)",
                  border: "1px solid var(--ok-green)",
                  color: "var(--ok-green)",
                  padding: "6px 14px",
                  borderRadius: 10,
                  fontSize: "0.75rem",
                  maxWidth: 680,
                  textAlign: "center",
                }}
              >
                ✓ {streamInfo}
              </div>
            )}

            {/* BANNER EXPANDIDO DE VIDEOLLAMADAS EN EL ESCENARIO (ZOOM, MEET, TEAMS, WHATSAPP) */}
            <div
              className="stage-videocall-banner-strip"
              onClick={() => setShowObsModal(true)}
              style={{
                width: "100%",
                maxWidth: effectiveCropMode === "9:16" ? (mobileViewScale === "xl" ? 560 : mobileViewScale === "lg" ? 480 : 400) : (mobileViewScale === "xl" ? 1400 : mobileViewScale === "lg" ? 1240 : 1020),
                margin: "12px auto 4px",
                background: "linear-gradient(90deg, rgba(236, 72, 153, 0.12) 0%, rgba(139, 92, 246, 0.15) 50%, rgba(59, 130, 246, 0.12) 100%)",
                border: "1px solid rgba(236, 72, 153, 0.35)",
                borderRadius: 14,
                padding: "8px 18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                cursor: "pointer",
                boxShadow: "0 4px 18px rgba(0, 0, 0, 0.35)",
                transition: "all 0.2s ease",
              }}
              title="Aprende a conectar tu cámara y transmisión en vivo a Zoom, Google Meet, Microsoft Teams y WhatsApp"
            >
              <div className="stage-videocall-left">
                <span className="stage-videocall-icon">
                  {activeTab === "TRY_ON"
                    ? "👗"
                    : activeTab === "DUO"
                      ? "👥"
                      : activeTab === "CLIPS"
                        ? "🎬"
                        : activeTab === "TIKTOK_LIVE"
                          ? "📱"
                          : "📹"}
                </span>
                <span className="stage-videocall-text">
                  Transmite en Videollamadas en Vivo:
                </span>
                <div className="stage-videocall-badges">
                  <span className="vcam-app-tag vcam-tag-zoom">Zoom</span>
                  <span className="vcam-app-tag vcam-tag-meet">Google Meet</span>
                  <span className="vcam-app-tag vcam-tag-teams">Teams</span>
                  <span className="vcam-app-tag vcam-tag-whatsapp">WhatsApp</span>
                </div>
              </div>
              <div className="stage-videocall-right">
                <span>Paso a Paso</span>
                <span className="stage-videocall-arrow">➔</span>
              </div>
            </div>
          </main>

          {/* =============================================================
              BARRA LATERAL DERECHA (CABINA DE CONTROL UX - ESTILO ONESTREAM LIVE)
              Agrupa capas maestras, grabación y herramientas a la derecha sin scrollbar horizontal
              ============================================================= */}
          <aside className="cam-right-studio-sidebar">
            {/* 1. CONTROL DE CAPAS EN PANTALLA COMPACTO EN 2 COLUMNAS */}
            <div className="studio-layers-manager-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <button
                  type="button"
                  className="studio-layers-header-toggle"
                  onClick={() => setLayersExpanded((prev) => !prev)}
                  aria-expanded={layersExpanded}
                >
                  <span style={{ color: "var(--accent-pink)", display: "inline-flex" }}>
                    <Dashicon name="shield" size={16} />
                  </span>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#FFFFFF" }}>
                    Capas en Pantalla
                  </span>
                  <span style={{ fontSize: "0.72rem", color: "#94A3B8" }}>
                    {layersExpanded ? "▴" : "▾"}
                  </span>
                </button>
                <span className={`layers-counter-pill ${countActiveOnScreen() >= MAX_ONSCREEN_ELEMENTS ? "limit-reached" : ""}`}>
                  {countActiveOnScreen()} / {MAX_ONSCREEN_ELEMENTS} máx
                </span>
              </div>

              {layersExpanded && (
              <div className="studio-layers-rows-grid">
                {/* Switch Fondo */}
                <div className="studio-layers-row-item" title="Alternar capa de fondo virtual en pantalla">
                  <div className="studio-layers-row-label">
                    <Dashicon name="format-gallery" size={14} />
                    <span>Fondo Virtual / Chroma</span>
                  </div>
                  <div
                    className={`switchy-toggle ${bgPreviewEnabled && selectedBgId !== "bg-none" ? "active-green" : ""}`}
                    onClick={handleToggleBgMaster}
                  >
                    <div className="switchy-thumb" />
                  </div>
                </div>

                {/* Switch WhatsApp Live */}
                <div className="studio-layers-row-item" title="Alternar código QR y contacto de WhatsApp en pantalla">
                  <div className="studio-layers-row-label">
                    <SocialIcon network="whatsapp" size={14} />
                    <span>WhatsApp Live QR</span>
                  </div>
                  <div
                    className={`switchy-toggle ${whatsappConfig.showOnScreen ? "active-green" : ""}`}
                    onClick={handleToggleWhatsAppOnScreen}
                  >
                    <div className="switchy-thumb" />
                  </div>
                </div>

                {/* Switch Shopping */}
                <div className="studio-layers-row-item" title="Alternar tarjeta de producto comprable con QR">
                  <div className="studio-layers-row-label">
                    <Dashicon name="cart" size={14} />
                    <span>Live Shopping con QR</span>
                  </div>
                  <div
                    className={`switchy-toggle ${activeProductId ? "active-green" : ""}`}
                    onClick={handleToggleShoppingMaster}
                  >
                    <div className="switchy-thumb" />
                  </div>
                </div>

                {/* Switch Banners */}
                <div className="studio-layers-row-item" title="Alternar logos y banners programados">
                  <div className="studio-layers-row-label">
                    <Dashicon name="megaphone" size={14} />
                    <span>Logos &amp; Banners</span>
                  </div>
                  <div
                    className={`switchy-toggle ${scheduledOverlays.some((o) => o.enabled) ? "active-green" : ""}`}
                    onClick={handleToggleBannersMaster}
                  >
                    <div className="switchy-thumb" />
                  </div>
                </div>

                {/* Switch Prompter (Herramienta Privada del Streamer) */}
                <div className="studio-layers-row-item" title="Alternar teleprompter / guion de lectura (Solo visible para ti, invisible para audiencia y OBS)">
                  <div className="studio-layers-row-label">
                    <Dashicon name="media-text" size={14} />
                    <span>Teleprompter / Guion</span>
                  </div>
                  <div
                    className={`switchy-toggle ${teleprompterActive ? "active-green" : ""}`}
                    onClick={handleTogglePrompterMaster}
                  >
                    <div className="switchy-thumb" />
                  </div>
                </div>

                {/* Switch Botones */}
                <div className="studio-layers-row-item" title="Alternar botones flotantes interactivos en pantalla">
                  <div className="studio-layers-row-label">
                    <Dashicon name="controls-play" size={14} />
                    <span>Botones Interactivos</span>
                  </div>
                  <div
                    className={`switchy-toggle ${screenButtonsVisible ? "active-green" : ""}`}
                    onClick={handleToggleButtonsMaster}
                  >
                    <div className="switchy-thumb" />
                  </div>
                </div>

                {/* Switch Chat IA & Reacciones en Vivo */}
                <div className="studio-layers-row-item" title="Alternar feed de Chat IA y corazones flotantes en vivo">
                  <div className="studio-layers-row-label">
                    <Dashicon name="format-chat" size={14} />
                    <span>Chat IA &amp; Reacciones</span>
                  </div>
                  <div
                    className={`switchy-toggle ${realFeelChatEnabled ? "active-green" : ""}`}
                    onClick={() => setRealFeelChatEnabled((prev) => !prev)}
                  >
                    <div className="switchy-thumb" />
                  </div>
                </div>

                {/* Switch Dúo / Pantalla Dividida */}
                <div className="studio-layers-row-item" title="Alternar pantalla dividida con invitado Co-Host">
                  <div className="studio-layers-row-label">
                    <Dashicon name="groups" size={14} />
                    <span>Dúo / Pantalla Dividida</span>
                  </div>
                  <div
                    className={`switchy-toggle ${isDuoSplitActive ? "active-green" : ""}`}
                    onClick={() => {
                      const next = !isDuoSplitActive;
                      setGuestSplitConfig((prev) => ({ ...prev, active: next }));
                      setSplitView(next);
                      if (next) setActiveTab("DUO");
                      else if (activeTab === "DUO") setActiveTab("CAM");
                    }}
                  >
                    <div className="switchy-thumb" />
                  </div>
                </div>

                {/* Switch HUD Superior Móvil (Timer, Usuario, Likes, Subnav, Goals) */}
                <div className="studio-layers-row-item" title="Alternar barra HUD superior del mockup móvil (timer, nombre, likes, viewers, chat, ranking, goals)">
                  <div className="studio-layers-row-label">
                    <Dashicon name="smartphone" size={14} />
                    <span>HUD Superior Móvil</span>
                  </div>
                  <div
                    className={`switchy-toggle ${showPhoneHudBar ? "active-green" : ""}`}
                    onClick={() => setShowPhoneHudBar((prev) => !prev)}
                  >
                    <div className="switchy-thumb" />
                  </div>
                </div>

                {/* Switch Insignias LIVE y Viewers Externas */}
                <div className="studio-layers-row-item" title="Alternar insignias flotantes LIVE y viewers fuera del mockup móvil">
                  <div className="studio-layers-row-label">
                    <Dashicon name="star-filled" size={14} />
                    <span>Insignias LIVE Externas</span>
                  </div>
                  <div
                    className={`switchy-toggle ${hudLiveVisible ? "active-green" : ""}`}
                    onClick={() => setHudLiveVisible((prev) => !prev)}
                  >
                    <div className="switchy-thumb" />
                  </div>
                </div>

                {/* Switch Burbujas y Reacciones Ambientales */}
                <div className="studio-layers-row-item" title="Alternar burbujas flotantes de emojis y reacciones alrededor del mockup">
                  <div className="studio-layers-row-label">
                    <Dashicon name="heart" size={14} />
                    <span>Burbujas y Reacciones</span>
                  </div>
                  <div
                    className={`switchy-toggle ${showPhoneAmbientFx ? "active-green" : ""}`}
                    onClick={() => setShowPhoneAmbientFx((prev) => !prev)}
                  >
                    <div className="switchy-thumb" />
                  </div>
                </div>
              </div>
              )}
            </div>

            {/* 2. NAVEGADOR CATEGORIZADO DE HERRAMIENTAS DE ESCENA (7 HERRAMIENTAS ÚNICAS) */}
            <div className="studio-tools-nav-section">
              <div className="studio-tools-nav-header">
                <span>HERRAMIENTAS DE ESCENA</span>
                <span className="studio-tools-nav-hint">
                  {isRecording ? `REC ${Math.floor(recordingDuration / 60).toString().padStart(2, "0")}:${(recordingDuration % 60).toString().padStart(2, "0")}` : "Sin Duplicados"}
                </span>
              </div>

              <div className="studio-tools-nav-grid">
                <button
                  type="button"
                  className={`studio-tools-nav-btn ${activeStudioTab === "backgrounds" ? "active" : ""}`}
                  onClick={() => setActiveStudioTab("backgrounds")}
                  title="Fondos Virtuales y Pantalla Verde Chroma Key"
                >
                  <Dashicon name="format-gallery" size={16} />
                  <span className="tool-label">Fondos</span>
                  <span className="tool-counter">{virtualBackgrounds.length}</span>
                </button>

                <button
                  type="button"
                  className={`studio-tools-nav-btn ${activeStudioTab === "whatsapp" ? "active" : ""}`}
                  onClick={() => setActiveStudioTab("whatsapp")}
                  title="WhatsApp en Vivo: Código QR, número directo y Agente IA de atención"
                >
                  <SocialIcon network="whatsapp" size={16} />
                  <span className="tool-label">WhatsApp</span>
                  <span className="tool-counter" style={{ color: whatsappConfig.showOnScreen ? "#25D366" : undefined }}>
                    {whatsappConfig.showOnScreen ? "LIVE" : "ON"}
                  </span>
                </button>

                <button
                  type="button"
                  className={`studio-tools-nav-btn ${activeStudioTab === "shopping" ? "active" : ""}`}
                  onClick={() => setActiveStudioTab("shopping")}
                  title="Tarjetas de compra y Live Shopping con QR"
                >
                  <Dashicon name="cart" size={16} />
                  <span className="tool-label">Shop QR</span>
                  <span className="tool-counter">{shoppableProducts.length}</span>
                </button>

                <button
                  type="button"
                  className={`studio-tools-nav-btn ${activeStudioTab === "banners" ? "active" : ""}`}
                  onClick={() => setActiveStudioTab("banners")}
                  title="Logos y Banners programados en pantalla"
                >
                  <Dashicon name="megaphone" size={16} />
                  <span className="tool-label">Banners</span>
                  <span className="tool-counter">{scheduledOverlays.length}</span>
                </button>

                <button
                  type="button"
                  className={`studio-tools-nav-btn ${activeStudioTab === "teleprompter" ? "active" : ""}`}
                  onClick={() => setActiveStudioTab("teleprompter")}
                  title="Teleprompter y Guion de lectura (Privado Streamer)"
                >
                  <Dashicon name="lock" size={16} color={teleprompterActive ? "#10B981" : undefined} />
                  <span className="tool-label">Guion 🔒</span>
                  <span className="tool-counter" style={{ color: teleprompterActive ? "#10B981" : undefined }}>
                    {teleprompterActive ? "ON" : "OFF"}
                  </span>
                </button>

                <button
                  type="button"
                  className={`studio-tools-nav-btn ${activeStudioTab === "deck" ? "active" : ""}`}
                  onClick={() => setActiveStudioTab("deck")}
                  title="Stream Deck y Botones de acción rápida"
                >
                  <Dashicon name="controls-play" size={16} />
                  <span className="tool-label">Deck</span>
                  <span className="tool-counter">{actionButtons.length}</span>
                </button>

                <button
                  type="button"
                  className={`studio-tools-nav-btn ${activeStudioTab === "chat" ? "active" : ""}`}
                  onClick={() => setActiveStudioTab("chat")}
                  title="Chat Unificado con Switches por red social y Agente IA"
                >
                  <Dashicon name="format-chat" size={16} />
                  <span className="tool-label">Chat IA</span>
                  <span className="tool-counter">{realFeelChatEnabled ? "ON" : "OFF"}</span>
                </button>

                <button
                  type="button"
                  className={`studio-tools-nav-btn ${activeStudioTab === "recording" ? "active" : ""}`}
                  onClick={() => setActiveStudioTab("recording")}
                  title="Panel de grabación y descargas"
                >
                  <Dashicon name="video-alt2" size={16} />
                  <span className="tool-label">Grabar</span>
                  <span className="tool-counter">{recordingResolution}</span>
                </button>
              </div>
            </div>

            {/* 4. CUERPO DE LA HERRAMIENTA ACTIVA EN LA BARRA DERECHA */}
            <div className="cam-right-tool-body">
              {(isDockStackedView || activeStudioTab === "backgrounds") && (
              <div className="studio-dock-card">
                {/* Cabecera limpia y elegante con jerarquía */}
                <div className="studio-dock-card-header">
                  <div className="studio-dock-header-info">
                    <h3 className="studio-dock-header-title">
                      <Dashicon name="format-gallery" size={16} />
                      <span>Fondos Virtuales</span>
                    </h3>
                    <p className="studio-dock-header-subtitle">
                      Chroma Key verde y escenarios virtuales para tu directo
                    </p>
                  </div>
                  <div className={`studio-dock-status-badge ${bgPreviewEnabled && selectedBgId !== "bg-none" ? "active-green" : ""}`}>
                    <span className="studio-dock-status-dot" />
                    <span>{bgPreviewEnabled && selectedBgId !== "bg-none" ? (virtualBackgrounds.find((b) => b.id === selectedBgId)?.name || "Activo") : "Sin Fondo"}</span>
                  </div>
                </div>

                {/* Control Segmentado de Modo de Cámara */}
                <div>
                  <div style={{ fontSize: "0.68rem", color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>
                    Modo de Proyección
                  </div>
                  <div className="studio-segmented-control">
                    <button
                      type="button"
                      className={`studio-segmented-btn ${bgPreviewEnabled && bgPreviewMode === "pip_camera" ? "active" : ""}`}
                      onClick={() => {
                        setBgPreviewMode("pip_camera");
                        setBgPreviewEnabled(true);
                      }}
                      title="Tu cámara en ventana flotante sobre el fondo"
                    >
                      <Dashicon name="grid-view" size={14} />
                      <span>Fondo + PiP</span>
                    </button>
                    <button
                      type="button"
                      className={`studio-segmented-btn ${bgPreviewEnabled && bgPreviewMode === "backdrop" ? "active" : ""}`}
                      onClick={() => {
                        setBgPreviewMode("backdrop");
                        setBgPreviewEnabled(true);
                      }}
                      title="Fondo a pantalla completa"
                    >
                      <Dashicon name="format-image" size={14} />
                      <span>Solo Fondo</span>
                    </button>
                    <button
                      type="button"
                      className={`studio-segmented-btn ${!bgPreviewEnabled ? "active" : ""}`}
                      onClick={() => setBgPreviewEnabled(false)}
                      title="Cámara limpia sin fondo"
                    >
                      <Dashicon name="camera" size={14} />
                      <span>Cámara Limpia</span>
                    </button>
                  </div>
                </div>

                {/* Acciones de Carga de Medios */}
                <div className="studio-actions-row">
                  <button
                    type="button"
                    className="studio-action-button"
                    onClick={() => bgUploadInputRef.current?.click()}
                    title="Subir foto de fondo personalizada (JPG / PNG)"
                  >
                    <Dashicon name="format-image" size={14} />
                    <span>Subir Foto</span>
                  </button>
                  <button
                    type="button"
                    className="studio-action-button primary"
                    onClick={() => bgVideoUploadInputRef.current?.click()}
                    title="Subir video de fondo en bucle (MP4 / WebM)"
                  >
                    <Dashicon name="video-alt2" size={14} />
                    <span>Subir Video Bucle</span>
                  </button>
                </div>

                {/* Rejilla de Fondos Virtuales */}
                <div className="studio-backgrounds-grid">
                  {virtualBackgrounds.map((bg) => {
                    const isActive = selectedBgId === bg.id && bgPreviewEnabled;
                    const thumbSrc = bg.customImageUrl || bg.thumbnailSvg;
                    return (
                      <div
                        key={bg.id}
                        className={`studio-bg-item-card ${isActive ? "active" : ""}`}
                        onClick={() => void handleSelectBackground(bg)}
                        title={`${bg.name} - Clic para cambiar el fondo`}
                      >
                        {bg.isCustom && (
                          <button
                            type="button"
                            className="tryon-delete-badge"
                            onClick={(e) => handleDeleteCustomBackground(bg.id, e)}
                            title="Eliminar fondo personalizado"
                          >
                            ×
                          </button>
                        )}
                        <div className="studio-bg-item-thumb">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={thumbSrc} alt={bg.name} />
                          {bg.mediaType === "video" && (
                            <span className="media-type-badge video" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                              <Dashicon name="format-video" size={11} /> LOOP
                            </span>
                          )}
                        </div>
                        <div className="studio-bg-item-footer">
                          <span className="studio-bg-item-name">{bg.name}</span>
                          {isActive && <span className="studio-bg-item-badge">ACTIVO</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <input
                  ref={bgUploadInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleAddCustomBackground(f, "image");
                    e.target.value = "";
                  }}
                />
                <input
                  ref={bgVideoUploadInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/ogg"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleAddCustomBackground(f, "video");
                    e.target.value = "";
                  }}
                />
              </div>
            )}

            {/* PANEL DE PRODUCTOS COMPRABLES (LIVE SHOPPING - ESTILO ONESTREAM LIVE) */}
            {(isDockStackedView || activeStudioTab === "shopping") && (
              <div className="studio-dock-card">
                <div className="studio-dock-card-header">
                  <div className="studio-dock-header-info">
                    <h3 className="studio-dock-header-title">
                      <Dashicon name="cart" size={16} />
                      <span>Live Shopping</span>
                    </h3>
                    <p className="studio-dock-header-subtitle">
                      Muestra productos y códigos QR en pantalla para venta instantánea
                    </p>
                  </div>
                  <button
                    type="button"
                    className="studio-action-button primary"
                    style={{ flex: "0 0 auto", padding: "6px 14px" }}
                    onClick={() => setShowProductModal(true)}
                    title="Agregar un nuevo producto para vender durante la transmisión"
                  >
                    <span>+ Nuevo Producto</span>
                  </button>
                </div>

                <div className="studio-actions-row">
                  <button
                    type="button"
                    className="studio-action-button"
                    onClick={() => setShowProductCatalogModal(true)}
                    title="Abrir catálogo completo de productos"
                  >
                    <Dashicon name="portfolio" size={14} />
                    <span>Catálogo ({shoppableProducts.length})</span>
                  </button>
                  {activeProduct && (
                    <button
                      type="button"
                      className="studio-action-button"
                      style={{ color: "#EF4444", borderColor: "rgba(239, 68, 68, 0.3)" }}
                      onClick={() => setActiveProductId(null)}
                      title="Ocultar producto de la pantalla"
                    >
                      <Dashicon name="no-alt" size={14} />
                      <span>Desactivar QR</span>
                    </button>
                  )}
                </div>

                {/* 1. SELECTOR DE UBICACIÓN EN PANTALLA (3 ESPACIOS: ABAJO, MEDIO, ARRIBA) */}
                <div
                  style={{
                    padding: "10px 12px",
                    borderRadius: 14,
                    backgroundColor: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--text-white)", display: "flex", alignItems: "center", gap: 6 }}>
                      <Dashicon name="desktop" size={13} color="var(--accent-pink)" />
                      <span>Ubicación en Pantalla (3 Espacios):</span>
                    </span>
                    <span style={{ fontSize: "0.68rem", color: "var(--accent-pink)", fontWeight: 700 }}>
                      {liveShopGlobalPosition.startsWith("bottom") ? "⬇️ Abajo (Zona Marcada)" : liveShopGlobalPosition.startsWith("middle") ? "⏺️ En el Medio" : "⬆️ Arriba"}
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                    <button
                      type="button"
                      className={`studio-action-button ${liveShopGlobalPosition.startsWith("bottom") ? "primary" : ""}`}
                      style={{ padding: "6px 8px", fontSize: "0.72rem", justifyContent: "center" }}
                      onClick={() => handleSelectLiveShopPosition("bottom-center")}
                      title="Abajo en el centro (rectángulo inferior marcado)"
                    >
                      <span>⬇️ Abajo</span>
                    </button>
                    <button
                      type="button"
                      className={`studio-action-button ${liveShopGlobalPosition.startsWith("middle") ? "primary" : ""}`}
                      style={{ padding: "6px 8px", fontSize: "0.72rem", justifyContent: "center" }}
                      onClick={() => handleSelectLiveShopPosition("middle-center")}
                      title="En el medio de la pantalla"
                    >
                      <span>⏺️ Medio</span>
                    </button>
                    <button
                      type="button"
                      className={`studio-action-button ${liveShopGlobalPosition.startsWith("top") ? "primary" : ""}`}
                      style={{ padding: "6px 8px", fontSize: "0.72rem", justifyContent: "center" }}
                      onClick={() => handleSelectLiveShopPosition("top-center")}
                      title="En la parte superior de la pantalla"
                    >
                      <span>⬆️ Arriba</span>
                    </button>
                  </div>
                </div>

                {/* 2. MODO DE EMISIÓN: MANUAL O PROGRAMADO (CADA X TIEMPO O # DE VECES) */}
                <div
                  style={{
                    padding: "10px 12px",
                    borderRadius: 14,
                    backgroundColor: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--text-white)", display: "flex", alignItems: "center", gap: 6 }}>
                      <Dashicon name="clock" size={13} color="#10B981" />
                      <span>Modo de Emisión:</span>
                    </span>
                    {liveShopStatusText && (
                      <span style={{ fontSize: "0.68rem", color: "#10B981", fontWeight: 800 }}>
                        {liveShopStatusText}
                      </span>
                    )}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                    <button
                      type="button"
                      className={`studio-action-button ${liveShopScheduleMode === "manual" ? "primary" : ""}`}
                      style={{ padding: "6px 6px", fontSize: "0.7rem", justifyContent: "center" }}
                      onClick={() => {
                        setLiveShopScheduleMode("manual");
                        setLiveShopStatusText("");
                      }}
                      title="Control manual: Activa o desactiva con los switches cuando desees"
                    >
                      <span>🔘 Manual</span>
                    </button>
                    <button
                      type="button"
                      className={`studio-action-button ${liveShopScheduleMode === "interval" ? "primary" : ""}`}
                      style={{ padding: "6px 6px", fontSize: "0.7rem", justifyContent: "center" }}
                      onClick={() => {
                        setLiveShopScheduleMode("interval");
                        setLiveShopNextCountdown(liveShopIntervalMinutes * 60);
                        setLiveShopStatusText(`⏳ Próximo pase en ${liveShopIntervalMinutes} min`);
                      }}
                      title="Programar para que aparezca automáticamente cada X tiempo"
                    >
                      <span>⏱️ Cada X min</span>
                    </button>
                    <button
                      type="button"
                      className={`studio-action-button ${liveShopScheduleMode === "count" ? "primary" : ""}`}
                      style={{ padding: "6px 6px", fontSize: "0.7rem", justifyContent: "center" }}
                      onClick={() => {
                        setLiveShopScheduleMode("count");
                        setLiveShopCurrentCount(0);
                        setLiveShopNextCountdown(liveShopIntervalMinutes * 60);
                        setLiveShopStatusText(`⏳ Pase 1 de ${liveShopRepeatCount} listo`);
                      }}
                      title="Programar para mostrarse un número exacto de veces en la transmisión"
                    >
                      <span>🔢 # de veces</span>
                    </button>
                  </div>

                  {/* AJUSTES SEGÚN MODO SELECCIONADO */}
                  {liveShopScheduleMode === "interval" && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                        padding: "8px 10px",
                        borderRadius: 10,
                        backgroundColor: "rgba(16, 185, 129, 0.08)",
                        border: "1px solid rgba(16, 185, 129, 0.25)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "0.7rem", color: "#E5E7EB" }}>Repetir cada:</span>
                        <div style={{ display: "flex", gap: 4 }}>
                          {[1, 2, 3, 5, 10].map((m) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => {
                                setLiveShopIntervalMinutes(m);
                                setLiveShopNextCountdown(m * 60);
                              }}
                              style={{
                                padding: "2px 7px",
                                fontSize: "0.68rem",
                                borderRadius: 6,
                                border: liveShopIntervalMinutes === m ? "1px solid #10B981" : "1px solid rgba(255,255,255,0.1)",
                                backgroundColor: liveShopIntervalMinutes === m ? "#10B981" : "rgba(255,255,255,0.05)",
                                color: "#FFFFFF",
                                cursor: "pointer",
                                fontWeight: 700,
                              }}
                            >
                              {m}m
                            </button>
                          ))}
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "0.7rem", color: "#E5E7EB" }}>Duración en pantalla:</span>
                        <div style={{ display: "flex", gap: 4 }}>
                          {[10, 15, 20, 30].map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setLiveShopDisplaySeconds(s)}
                              style={{
                                padding: "2px 7px",
                                fontSize: "0.68rem",
                                borderRadius: 6,
                                border: liveShopDisplaySeconds === s ? "1px solid var(--accent-pink)" : "1px solid rgba(255,255,255,0.1)",
                                backgroundColor: liveShopDisplaySeconds === s ? "var(--accent-pink)" : "rgba(255,255,255,0.05)",
                                color: "#FFFFFF",
                                cursor: "pointer",
                                fontWeight: 700,
                              }}
                            >
                              {s}s
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {liveShopScheduleMode === "count" && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                        padding: "8px 10px",
                        borderRadius: 10,
                        backgroundColor: "rgba(99, 102, 241, 0.08)",
                        border: "1px solid rgba(99, 102, 241, 0.25)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "0.7rem", color: "#E5E7EB" }}>Total repeticiones:</span>
                        <div style={{ display: "flex", gap: 4 }}>
                          {[1, 2, 3, 5, 8].map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => {
                                setLiveShopRepeatCount(c);
                                setLiveShopCurrentCount(0);
                              }}
                              style={{
                                padding: "2px 7px",
                                fontSize: "0.68rem",
                                borderRadius: 6,
                                border: liveShopRepeatCount === c ? "1px solid #6366F1" : "1px solid rgba(255,255,255,0.1)",
                                backgroundColor: liveShopRepeatCount === c ? "#6366F1" : "rgba(255,255,255,0.05)",
                                color: "#FFFFFF",
                                cursor: "pointer",
                                fontWeight: 700,
                              }}
                            >
                              {c}x
                            </button>
                          ))}
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "0.7rem", color: "#E5E7EB" }}>Duración visible:</span>
                        <div style={{ display: "flex", gap: 4 }}>
                          {[10, 15, 20, 30].map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setLiveShopDisplaySeconds(s)}
                              style={{
                                padding: "2px 7px",
                                fontSize: "0.68rem",
                                borderRadius: 6,
                                border: liveShopDisplaySeconds === s ? "1px solid var(--accent-pink)" : "1px solid rgba(255,255,255,0.1)",
                                backgroundColor: liveShopDisplaySeconds === s ? "var(--accent-pink)" : "rgba(255,255,255,0.05)",
                                color: "#FFFFFF",
                                cursor: "pointer",
                                fontWeight: 700,
                              }}
                            >
                              {s}s
                            </button>
                          ))}
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "0.7rem", color: "#E5E7EB" }}>Intervalo entre pases:</span>
                        <div style={{ display: "flex", gap: 4 }}>
                          {[1, 2, 3, 5].map((m) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => {
                                setLiveShopIntervalMinutes(m);
                                setLiveShopNextCountdown(m * 60);
                              }}
                              style={{
                                padding: "2px 7px",
                                fontSize: "0.68rem",
                                borderRadius: 6,
                                border: liveShopIntervalMinutes === m ? "1px solid #10B981" : "1px solid rgba(255,255,255,0.1)",
                                backgroundColor: liveShopIntervalMinutes === m ? "#10B981" : "rgba(255,255,255,0.05)",
                                color: "#FFFFFF",
                                cursor: "pointer",
                                fontWeight: 700,
                              }}
                            >
                              {m}m
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="shoppable-dock-grid">
                  {shoppableProducts.map((prod) => {
                    const isCardActive = activeProductId === prod.id;
                    return (
                      <div
                        key={prod.id}
                        className={`shoppable-grid-card ${isCardActive ? "active" : ""}`}
                      >
                        <div className="shoppable-grid-thumb">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={prod.imageUrl} alt={prod.title} />
                        </div>
                        <div className="shoppable-grid-info">
                          <strong style={{ fontSize: "0.82rem", color: "#FFFFFF" }}>{prod.title}</strong>
                          <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>
                            {prod.subtitle || "Producto en vivo"}
                          </span>
                          <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 2 }}>
                            <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--accent-pink)" }}>
                              {prod.currencySymbol}{prod.price.toFixed(2)}
                            </span>
                            {prod.compareAtPrice && (
                              <span style={{ fontSize: "0.72rem", textDecoration: "line-through", color: "#6B7280" }}>
                                {prod.currencySymbol}{prod.compareAtPrice.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="shoppable-grid-actions">
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: "0.68rem", fontWeight: 800, color: isCardActive ? "var(--ok-green)" : "#9CA3AF", display: "inline-flex", alignItems: "center", gap: 4 }}>
                              {isCardActive ? (
                                <>
                                  <Dashicon name="visibility" size={12} />
                                  <span>EN PANTALLA</span>
                                </>
                              ) : (
                                "OFF"
                              )}
                            </span>
                            <div
                              className={`switchy-toggle ${isCardActive ? "active-green" : ""}`}
                              onClick={() => {
                                if (isCardActive) {
                                  setActiveProductId(null);
                                } else {
                                  if (!requestEnableOnScreen()) return;
                                  setActiveProductId(prod.id);
                                }
                              }}
                              title="Mostrar u ocultar producto en la pantalla"
                            >
                              <div className="switchy-thumb" />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {(isDockStackedView || activeStudioTab === "banners") && (
              <div className="studio-dock-card">
                <div className="studio-dock-card-header">
                  <div className="studio-dock-header-info">
                    <h3 className="studio-dock-header-title">
                      <Dashicon name="megaphone" size={16} />
                      <span>Logos &amp; Banners</span>
                    </h3>
                    <p className="studio-dock-header-subtitle">
                      Superposiciones de marca programadas por intervalos
                    </p>
                  </div>
                  <button
                    type="button"
                    className="studio-action-button primary"
                    style={{ flex: "0 0 auto", padding: "6px 14px" }}
                    onClick={() => setShowAddBannerModal(true)}
                    title="Configurar un nuevo logo o banner programado"
                  >
                    <span>+ Nuevo Banner</span>
                  </button>
                </div>

              <div className="banner-cards-grid">
                {scheduledOverlays.map((item) => {
                  const visibleNow = isOverlayVisible(item, overlayTick);
                  return (
                    <div
                      key={item.id}
                      className={`banner-item-card ${item.enabled ? "enabled" : ""}`}
                    >
                      <div className="banner-item-preview-box">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.imageUrl} alt={item.name} />
                      </div>

                      <div className="banner-item-meta">
                        <strong style={{ color: "var(--text-white)", fontSize: "0.78rem" }}>
                          {item.name}
                        </strong>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span
                            style={{
                              fontSize: "0.68rem",
                              color: item.enabled
                                ? visibleNow
                                  ? "var(--ok-green)"
                                  : "#F59E0B"
                                : "var(--text-secondary)",
                              fontWeight: 800,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            {item.enabled ? (
                              visibleNow ? (
                                <>
                                  <Dashicon name="visibility" size={12} />
                                  <span>ON</span>
                                </>
                              ) : (
                                <>
                                  <Dashicon name="clock" size={12} />
                                  <span>EN CICLO</span>
                                </>
                              )
                            ) : (
                              "OFF"
                            )}
                          </span>
                          <div
                            className={`switchy-toggle ${item.enabled ? (visibleNow ? "active-green" : "active") : ""}`}
                            onClick={() => handleToggleOverlay(item.id)}
                            title="Alternar banner (Tipo switchy)"
                          >
                            <div className="switchy-thumb" />
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 4 }}>
                        <span className="banner-badge-pill" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <Dashicon name="marker" size={11} />
                          <span>{item.position.replace("-", " ").toUpperCase()}</span>
                        </span>
                        <span className="banner-badge-pill" style={{ color: "#F59E0B" }}>
                          {item.displayMode === "permanent"
                            ? "Fijo"
                            : `Cada ${item.intervalSeconds}s (${item.durationSeconds}s)`}
                        </span>
                        <button
                          type="button"
                          className="tryon-delete-badge"
                          style={{ position: "static", width: 18, height: 18 }}
                          onClick={(e) => handleDeleteOverlay(item.id, e)}
                          title="Eliminar este banner"
                        >
                          ×
                        </button>
                      </div>

                      {/* Botón copiar texto al gusto */}
                      {(item.copyableText || item.customText) && (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, marginTop: 4 }}>
                          <span
                            style={{
                              fontSize: "0.68rem",
                              color: "#9CA3AF",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              maxWidth: "140px",
                            }}
                            title={`Texto a copiar: ${item.copyableText || item.customText}`}
                          >
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Dashicon name="edit" size={11} /> <span>{item.copyableText || item.customText}</span></span>
                          </span>
                          <button
                            type="button"
                            className={`banner-copy-btn ${copiedBannerId === item.id ? "copied" : ""}`}
                            onClick={(e) => handleCopyBannerText(item, e)}
                            title="Copiar texto al gusto al portapapeles"
                            style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
                          >
                            <Dashicon name={copiedBannerId === item.id ? "yes-alt" : "clipboard"} size={12} />
                            <span>{copiedBannerId === item.id ? "¡Copiado!" : "Copiar"}</span>
                          </button>
                        </div>
                      )}

                      {item.targetUrl && (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, marginTop: 4 }}>
                          <span
                            style={{
                              fontSize: "0.68rem",
                              color: "var(--accent-pink)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              maxWidth: "130px",
                            }}
                            title={`URL Ejecutable: ${item.targetUrl}`}
                          >
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Dashicon name="networking" size={11} color="var(--accent-pink)" /> <span>{item.targetUrl.replace(/^https?:\/\//, "")}</span></span>
                          </span>
                          <button
                            type="button"
                            className="pill-ctrl-button"
                            style={{ padding: "2px 6px", fontSize: "0.65rem" }}
                            onClick={() => handleExecuteBannerUrl(item)}
                            title="Probar y abrir enlace ejecutable en nueva pestaña"
                          >
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Dashicon name="external" size={11} /> <span>Abrir</span></span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            )}

            {(isDockStackedView || activeStudioTab === "teleprompter") && (
              <div className="studio-dock-card">
                <div className="studio-dock-card-header">
                  <div className="studio-dock-header-info">
                    <h3 className="studio-dock-header-title">
                      <Dashicon name="lock" size={16} color="#10B981" />
                      <span>Teleprompter / Guion Privado</span>
                    </h3>
                    <p className="studio-dock-header-subtitle">
                      HUD de lectura exclusivo para el streamer (invisible para la audiencia y OBS)
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: "0.72rem", color: teleprompterActive ? "#22C55E" : "#94A3B8", fontWeight: 700 }}>
                      {teleprompterActive ? "EN PANTALLA" : "OCULTO"}
                    </span>
                    <div
                      className={`switchy-toggle ${teleprompterActive ? "active-green" : ""}`}
                      onClick={handleTogglePrompterMaster}
                      title="Activar / Desactivar Teleprompter en pantalla (Solo tú lo ves)"
                    >
                      <div className="switchy-thumb" />
                    </div>
                  </div>
                </div>

                {/* Banner de Privacidad Garantizada para el Streamer */}
                <div className="teleprompter-privacy-banner">
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Dashicon name="shield" size={16} color="#10B981" />
                    <strong style={{ color: "#34D399", fontSize: "0.78rem" }}>
                      100% Privado para el Streamer
                    </strong>
                    <span className="teleprompter-private-chip">🔒 Exclusivo Host</span>
                  </div>
                  <p style={{ margin: "5px 0 0 0", fontSize: "0.72rem", color: "#94A3B8", lineHeight: 1.45 }}>
                    Este guion solo lo ves tú en esta pantalla de control. <strong>OBS Virtual Camera, Google Meet, Zoom, TikTok y YouTube NO reciben este texto</strong>. La audiencia ve únicamente tu cámara y los gráficos públicos.
                  </p>
                </div>

                {/* Controles de Teleprompter */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>
                      Ubicación del HUD:
                    </label>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {[
                        { id: "top", label: "⬆️ Arriba (Junto a Cámara)", tip: "Ideal para mantener contacto visual" },
                        { id: "center", label: "⏺️ Centro Flotante", tip: "Posición centrada clásica" },
                        { id: "dock", label: "📌 Solo Panel Lateral", tip: "No se muestra sobre la imagen de la cámara" },
                      ].map((pos) => (
                        <button
                          key={pos.id}
                          type="button"
                          className={`pill-ctrl-button ${teleprompterPosition === pos.id ? "active-pink" : ""}`}
                          style={{ padding: "4px 8px", fontSize: "0.68rem" }}
                          onClick={() => setTeleprompterPosition(pos.id as any)}
                          title={pos.tip}
                        >
                          {pos.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>
                      Opacidad de Lectura:
                    </label>
                    <div style={{ display: "flex", gap: 4 }}>
                      {[
                        { val: 0.35, lbl: "35% Cristal" },
                        { val: 0.7, lbl: "70% Equilibrado" },
                        { val: 0.9, lbl: "90% Sólido" },
                      ].map((op) => (
                        <button
                          key={op.val}
                          type="button"
                          className={`pill-ctrl-button ${teleprompterOpacity === op.val ? "active-pink" : ""}`}
                          style={{ padding: "4px 8px", fontSize: "0.68rem" }}
                          onClick={() => setTeleprompterOpacity(op.val)}
                        >
                          {op.lbl}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>Velocidad:</label>
                    <div style={{ display: "flex", gap: 4 }}>
                      {[1, 2, 3, 5].map((spd) => (
                        <button
                          key={spd}
                          type="button"
                          className={`pill-ctrl-button ${teleprompterSpeed === spd ? "active-pink" : ""}`}
                          style={{ padding: "2px 8px", fontSize: "0.68rem" }}
                          onClick={() => setTeleprompterSpeed(spd)}
                        >
                          {spd}x
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>Tamaño Letra:</label>
                    <div style={{ display: "flex", gap: 4 }}>
                      {[
                        { size: 16, lbl: "S" },
                        { size: 20, lbl: "M" },
                        { size: 26, lbl: "L" },
                        { size: 32, lbl: "XL" },
                      ].map((sz) => (
                        <button
                          key={sz.size}
                          type="button"
                          className={`pill-ctrl-button ${teleprompterFontSize === sz.size ? "active-pink" : ""}`}
                          style={{ padding: "2px 8px", fontSize: "0.68rem" }}
                          onClick={() => setTeleprompterFontSize(sz.size)}
                        >
                          {sz.lbl}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>Modo Espejo (Prompter Vidrio):</label>
                    <button
                      type="button"
                      className={`pill-ctrl-button ${teleprompterMirror ? "active-pink" : ""}`}
                      style={{ padding: "2px 8px", fontSize: "0.68rem", display: "inline-flex", alignItems: "center", gap: 4 }}
                      onClick={() => setTeleprompterMirror((m) => !m)}
                    >
                      <Dashicon name="image-flip-horizontal" size={12} />
                      <span>{teleprompterMirror ? "Espejo Activo" : "Normal"}</span>
                    </button>
                  </div>
                </div>

                {/* Inputs ocultos para carga de archivos .txt y .pdf */}
                <input
                  ref={txtFileInputRef}
                  type="file"
                  accept=".txt,.text,.md"
                  style={{ display: "none" }}
                  onChange={handleUploadTxt}
                />
                <input
                  ref={pdfFileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  style={{ display: "none" }}
                  onChange={handleUploadPdf}
                />

                {/* Barra de herramientas para importar .txt, .pdf, pegar y gestionar textos largos */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--text-white)" }}>
                        Script Content (Guion de Transmisión):
                      </span>
                      {/* Modo de inserción: Reemplazar o Añadir al final */}
                      <div className="script-mode-pill-toggle">
                        <button
                          type="button"
                          className={`script-mode-opt-btn ${scriptInsertMode === "replace" ? "active" : ""}`}
                          onClick={() => setScriptInsertMode("replace")}
                          title="Al importar o pegar, reemplaza todo el guion actual"
                        >
                          Reemplazar
                        </button>
                        <button
                          type="button"
                          className={`script-mode-opt-btn ${scriptInsertMode === "append" ? "active" : ""}`}
                          onClick={() => setScriptInsertMode("append")}
                          title="Al importar o pegar, añade el texto al final del guion actual"
                        >
                          + Añadir al final
                        </button>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      {/* Botón Importar TXT */}
                      <button
                        type="button"
                        className="script-action-btn"
                        onClick={() => txtFileInputRef.current?.click()}
                        title="Cargar guion desde un archivo de texto (.txt, .md)"
                      >
                        <Dashicon name="media-text" size={12} color="#60A5FA" />
                        <span>Subir .TXT</span>
                      </button>

                      {/* Botón Importar PDF */}
                      <button
                        type="button"
                        className="script-action-btn"
                        onClick={() => pdfFileInputRef.current?.click()}
                        disabled={isParsingPdf}
                        title="Extraer texto de un documento PDF (.pdf)"
                        style={isParsingPdf ? { opacity: 0.6, cursor: "wait" } : {}}
                      >
                        <Dashicon name="upload" size={12} color="#F87171" />
                        <span>{isParsingPdf ? "Extrayendo..." : "Subir .PDF"}</span>
                      </button>

                      {/* Botón Pegar Portapapeles (para textos muy largos de Word/Docs/Notion) */}
                      <button
                        type="button"
                        className="script-action-btn"
                        onClick={handlePasteClipboard}
                        title="Pegar texto largo copiado desde Word, Docs, ChatGPT o Notion"
                      >
                        <Dashicon name="clipboard" size={12} color="#34D399" />
                        <span>Pegar Texto Largo</span>
                      </button>

                      {/* Botón Expandir / Reducir editor */}
                      <button
                        type="button"
                        className={`script-action-btn ${isScriptEditorExpanded ? "active-pink" : ""}`}
                        onClick={() => setIsScriptEditorExpanded((prev) => !prev)}
                        title={isScriptEditorExpanded ? "Modo compacto" : "Ampliar editor para textos largos"}
                      >
                        <span>{isScriptEditorExpanded ? "⤡ Reducir" : "⤢ Ampliar"}</span>
                      </button>

                      {/* Botón Vaciar */}
                      <button
                        type="button"
                        className="script-action-btn text-danger"
                        onClick={handleClearScript}
                        title="Vaciar todo el guion para escribir uno nuevo"
                      >
                        <Dashicon name="trash" size={12} color="#EF4444" />
                        <span>Vaciar</span>
                      </button>

                      {/* Botón Restablecer */}
                      <button
                        type="button"
                        className="script-action-btn text-muted"
                        onClick={() => setTeleprompterScript(DEFAULT_TELEPROMPTER_SCRIPT)}
                        title="Restablecer guion predeterminado del sistema"
                      >
                        ↺ Defecto
                      </button>
                    </div>
                  </div>

                  {/* Textarea del Guion con soporte para textos largos */}
                  <textarea
                    className={`script-editor-textarea ${isScriptEditorExpanded ? "expanded" : ""}`}
                    value={teleprompterScript}
                    onChange={(e) => setTeleprompterScript(e.target.value)}
                    placeholder="Escribe, pega aquí tu guion largo (Word, Docs, Notion) o importa un archivo .txt / .pdf con los botones superiores..."
                  />

                  {/* Barra de Métricas en Vivo del Guion */}
                  <div className="script-live-metrics-bar">
                    <span className="script-metric-badge" title="Palabras totales en el guion">
                      <strong>{scriptMetrics.words.toLocaleString()}</strong> palabras
                    </span>
                    <span className="script-metric-badge" title="Caracteres totales">
                      <strong>{scriptMetrics.chars.toLocaleString()}</strong> caracteres
                    </span>
                    <span className="script-metric-badge" title="Párrafos o bloques de texto">
                      <strong>{scriptMetrics.paragraphs}</strong> párrafos
                    </span>
                    <span className="script-metric-badge time-badge" title="Tiempo estimado de lectura a ritmo natural (~130 palabras por minuto)">
                      ⏱️ <strong>~{scriptMetrics.readTimeMinutes} min</strong> de lectura en vivo
                    </span>
                  </div>
                </div>
              </div>
            )}

            {(isDockStackedView || activeStudioTab === "deck") && (
              <div className="studio-dock-card">
                <div className="studio-dock-card-header">
                  <div className="studio-dock-header-info">
                    <h3 className="studio-dock-header-title">
                      <Dashicon name="controls-play" size={16} />
                      <span>Stream Deck ({actionButtons.length})</span>
                    </h3>
                    <p className="studio-dock-header-subtitle">
                      Disparadores de acción rápida para efectos, enlaces URL, sonido y pantalla
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <button
                      type="button"
                      className={`studio-action-button ${screenButtonsVisible ? "active-green" : ""}`}
                      style={{ flex: "0 0 auto", padding: "6px 12px", fontSize: "0.72rem" }}
                      onClick={handleToggleButtonsMaster}
                      title="Mostrar u ocultar los botones asignados a la pantalla"
                    >
                      <span>{screenButtonsVisible ? "📺 En Pantalla: ON" : "📺 En Pantalla: OFF"}</span>
                    </button>
                    <button
                      type="button"
                      className="studio-action-button primary"
                      style={{ flex: "0 0 auto", padding: "6px 14px" }}
                      onClick={handleOpenCreateButton}
                      title="Crear y personalizar un nuevo botón de acción rápida"
                    >
                      <span>+ Nuevo Botón</span>
                    </button>
                  </div>
                </div>

                {/* Filtros de ubicación para gestión rápida */}
                <div className="deck-filter-tabs">
                  <button
                    type="button"
                    className={`deck-filter-tab ${deckFilterPlacement === "all" ? "active" : ""}`}
                    onClick={() => setDeckFilterPlacement("all")}
                  >
                    Todos ({actionButtons.length})
                  </button>
                  <button
                    type="button"
                    className={`deck-filter-tab ${deckFilterPlacement === "deck" ? "active" : ""}`}
                    onClick={() => setDeckFilterPlacement("deck")}
                  >
                    📋 Botonera Deck ({actionButtons.filter((b) => !b.placement || b.placement === "deck").length})
                  </button>
                  <button
                    type="button"
                    className={`deck-filter-tab ${deckFilterPlacement === "screen" ? "active" : ""}`}
                    onClick={() => setDeckFilterPlacement("screen")}
                  >
                    📺 En Pantalla ({actionButtons.filter((b) => b.placement && b.placement !== "deck").length})
                  </button>
                </div>

                <div className="action-deck-grid">
                  {actionButtons
                    .filter((btn) => {
                      if (deckFilterPlacement === "deck") return !btn.placement || btn.placement === "deck";
                      if (deckFilterPlacement === "screen") return btn.placement && btn.placement !== "deck";
                      return true;
                    })
                    .map((btn) => {
                      const btnSize = btn.size || "md";
                      const placementLabel =
                        !btn.placement || btn.placement === "deck"
                          ? "Deck"
                          : btn.placement === "screen-top-center"
                          ? "Arriba Ctr"
                          : btn.placement === "screen-bottom-center"
                          ? "Abajo Ctr"
                          : btn.placement === "screen-top-left"
                          ? "Arriba Izq"
                          : btn.placement === "screen-top-right"
                          ? "Arriba Der"
                          : btn.placement === "screen-center-left"
                          ? "Centro Izq"
                          : btn.placement === "screen-center-right"
                          ? "Centro Der"
                          : btn.placement === "screen-bottom-left"
                          ? "Abajo Izq"
                          : "Abajo Der";

                      return (
                        <button
                          key={btn.id}
                          className={`custom-deck-btn size-${btnSize}`}
                          onClick={() => void handleExecuteActionButton(btn)}
                          style={{ borderColor: btn.color }}
                          title={`Acción: ${btn.actionType} | Ubicación: ${placementLabel} | Clic para ejecutar | ✎ Editar`}
                        >
                          <span
                            className="deck-btn-edit"
                            onClick={(e) => handleOpenEditButton(btn, e)}
                            title="Editar botón (nombre, color, enlace, imagen, ubicación)"
                          >
                            ✎
                          </span>
                          {btn.customImageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={btn.customImageUrl} alt={btn.label} className="deck-btn-img" />
                          ) : (
                            <span className="deck-btn-icon">{btn.icon}</span>
                          )}
                          <span>{btn.label}</span>
                          <span className="deck-btn-badges-row">
                            <span className="deck-btn-placement-pill">{placementLabel}</span>
                            {btn.url && <span className="deck-btn-url-pill">🔗 URL</span>}
                          </span>
                          <span
                            className="deck-btn-del"
                            onClick={(e) => handleDeleteActionButton(btn.id, e)}
                            title="Eliminar botón"
                          >
                            ×
                          </span>
                        </button>
                      );
                    })}
                </div>
              </div>
            )}

            {(isDockStackedView || activeStudioTab === "recording") && (
              <div className="studio-dock-card">
                <div className="studio-dock-card-header">
                  <div className="studio-dock-header-info">
                    <h3 className="studio-dock-header-title">
                      <Dashicon name="video-alt2" size={16} />
                      <span>Grabación de Video</span>
                    </h3>
                    <p className="studio-dock-header-subtitle">
                      Graba tu directo completo con todas las capas (Cámara, Banners, Fondos, QR)
                    </p>
                  </div>
                  <div className={`studio-dock-status-badge ${isRecording ? "active-green" : ""}`}>
                    <span className="studio-dock-status-dot" />
                    <span>{isRecording ? `REC ${Math.floor(recordingDuration / 60).toString().padStart(2, "0")}:${(recordingDuration % 60).toString().padStart(2, "0")}` : "Listo"}</span>
                  </div>
                </div>
                <div className="studio-recording-actions" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                  <select
                    className="select-ctrl-pill"
                    aria-label="Resolución de grabación"
                    style={{ padding: "5px 10px", fontSize: "0.72rem", borderColor: "rgba(255, 255, 255, 0.15)", background: "#181926" }}
                    value={recordingResolution}
                    onChange={(e) => setRecordingResolution(e.target.value as RecordingResolution)}
                    title="Cambiar resolución de grabación"
                  >
                    {RECORDING_RESOLUTIONS.map((res) => (
                      <option key={res.id} value={res.id}>
                        {res.label}
                      </option>
                    ))}
                  </select>

                  {isRecording ? (
                    <button
                      type="button"
                      className="btn-record-action recording"
                      style={{ padding: "6px 14px", fontSize: "0.74rem" }}
                      onClick={stopRecording}
                      title="Detener grabación y guardar video descargable"
                    >
                      <span>Detener</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn-record-action"
                      style={{ padding: "6px 14px", fontSize: "0.74rem" }}
                      onClick={startRecording}
                      title="Iniciar grabación de la transmisión"
                    >
                      <span className="rec-dot-icon" />
                      <span>Grabar Ahora</span>
                    </button>
                  )}
                </div>
                <div style={{ display: "flex", gap: 12, alignItems: "center", paddingTop: 8, borderTop: "1px solid rgba(255, 255, 255, 0.06)" }}>
                  <span style={{ fontSize: "0.72rem", color: "#94A3B8" }}>Formatos: WebM / VP9 / Opus · Sin marcas de agua · 480p, 720p HD, 1080p FHD, 4K</span>
                </div>
              </div>
            )}

            {/* Barra de progreso de sesión / Free Tier */}

              {/* PANEL DE CONTROL DE WHATSAPP (QR, NUMERO Y AGENTE IA) */}
              {(isDockStackedView || activeStudioTab === "whatsapp") && (
                <WhatsAppStudioPanel
                  config={whatsappConfig}
                  onChangeConfig={persistWhatsAppConfig}
                  onToggleOnScreen={handleToggleWhatsAppOnScreen}
                  activeCabinName={activeTab === "TRY_ON" ? "TRY ON" : activeTab === "DUO" ? "DÚO" : "CAM"}
                />
              )}

              {/* PANEL DE CHAT Y AGENTE IA CON SWITCHES DENTRO DE CAM */}
              {(isDockStackedView || activeStudioTab === "chat") && (
                <div className="studio-dock-card" style={{ padding: 12 }}>
                  <UnifiedLiveChatPanel
                    compactSidebar
                    sectionMode={splitChatComposerToLeftInDuo ? "feed" : "all"}
                    cropMode={effectiveCropMode}
                    chatOverlayEnabled={realFeelChatEnabled}
                    onToggleChatOverlay={() => setRealFeelChatEnabled((v) => !v)}
                    onPinCommentToScreen={(msg) => setPinnedChatMessage(msg)}
                    pinnedCommentId={pinnedChatMessage?.id}
                    pinnedMessage={pinnedChatMessage}
                  />
                </div>
              )}
            </div>

            {/* 5. BARRA DE SESIÓN / FREE TIER AL PIE DEL PANEL DERECHO */}
            <div className="delulu-free-tier-bar">
              <span className="tier-label">
                SESION ({telemetry.billedSeconds}s / {maxDurationSec}s)
              </span>
              <div className="tier-progress-track">
                <div
                  className="tier-progress-fill"
                  style={{
                    width: `${Math.min(100, (telemetry.billedSeconds / maxDurationSec) * 100)}%`,
                  }}
                />
              </div>
              <button className="btn-tier-upgrade" onClick={() => setActiveTab("PRO")}>
                UPGRADE
              </button>
            </div>

            {/* Mensajes de error o informativos */}
          </aside>
        </div>
        </UnifiedLiveChatProvider>
      )}

      {/* -------------------------------------------------------------
          VISTA 2: EXPLORE (CATALOGO EN REJILLA ESTILO DELULU)
          ------------------------------------------------------------- */}
      {activeTab === "EXPLORE" && (
        <section className="explore-workspace">
          {/* Barra superior de filtros */}
          <div className="explore-toolbar-row">
            <div className="explore-subtabs-row">
              {(["All", "Characters", "Outfits", "Props"] as const).map((cat) => (
                <button
                  key={cat}
                  className={`explore-subtab-btn ${exploreCategory === cat ? "active" : ""}`}
                  onClick={() => setExploreCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="explore-controls-right">
              <button
                className="btn-upload-explore"
                onClick={() => setShowUploadExploreModal(true)}
              >
                + SUBIR PERSONAJE
              </button>

              <input
                className="explore-search-input"
                placeholder="Buscar personajes..."
                value={exploreSearch}
                onChange={(e) => setExploreSearch(e.target.value)}
              />

              <button
                className={`btn-nsfw-toggle ${exploreNsfw ? "on" : ""}`}
                onClick={() => setExploreNsfw((prev) => !prev)}
              >
                NSFW: {exploreNsfw ? "ON" : "OFF"}
              </button>

              <span className="explore-count-label">
                {userExploreItems.length + EXPLORE_CATALOG_ITEMS.length} items
              </span>
            </div>
          </div>

          {/* Rejilla de tarjetas estilo Explore */}
          <div className="explore-cards-grid">
            {[...userExploreItems, ...EXPLORE_CATALOG_ITEMS].filter((item) => {
              if (exploreCategory !== "All" && item.category !== exploreCategory) return false;
              if (exploreSearch.trim()) {
                const q = exploreSearch.toLowerCase();
                return (
                  item.title.toLowerCase().includes(q) ||
                  item.author.toLowerCase().includes(q) ||
                  item.prompt.toLowerCase().includes(q)
                );
              }
              return true;
            }).map((item) => {
              const isHiddenNsfw = item.isNsfw && !exploreNsfw;
              const isCoverDataUrl = item.avatarBg?.startsWith("data:");
              return (
                <div
                  key={item.id}
                  className="explore-item-card"
                  style={{
                    background: isCoverDataUrl
                      ? `url(${item.avatarBg}) center/cover no-repeat`
                      : item.avatarBg,
                  }}
                  onClick={() => handleLoadExploreItem(item)}
                >
                  {/* Badges superiores */}
                  <div className="explore-card-top-badges">
                    {item.tagBadge ? (
                      <span className="badge-tag-pill">{item.tagBadge}</span>
                    ) : (
                      <div />
                    )}
                    <div className="badge-likes-pill" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <Dashicon name="heart" size={12} color="#F43F5E" />
                      <span>{item.likes}</span>
                    </div>
                  </div>

                  {/* Overlay NSFW si está oculto */}
                  {isHiddenNsfw && (
                    <div className="card-nsfw-overlay">
                      <span className="badge-hidden-nsfw" style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                        <Dashicon name="lock" size={12} /> HIDDEN NSFW
                      </span>
                    </div>
                  )}

                  {/* Footer con autor y nombre */}
                  <div className="explore-card-footer">
                    <div className="explore-author-avatar">{item.author.charAt(0).toUpperCase()}</div>
                    <div className="explore-card-texts">
                      <span className="explore-card-title">{item.title}</span>
                      <span className="explore-card-by">by {item.author}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* -------------------------------------------------------------
          VISTA 3: CREATE (CONSTRUCTOR DELULU CON ACORDEONES)
          ------------------------------------------------------------- */}
      {activeTab === "CREATE" && (
        <section className="create-workspace-layout">
          {/* Barra lateral de opciones y atributos */}
          <aside className="create-sidebar-builder">
            {/* SELECTOR DE MOTOR DE IA GENERATIVA (GEMINI / CHATGPT) */}
            <div
              className="create-engine-selector-box"
              style={{
                padding: "10px 12px",
                background: "rgba(15, 18, 30, 0.85)",
                borderRadius: 14,
                border: "1px solid rgba(255, 255, 255, 0.1)",
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <span
                  style={{
                    fontSize: "0.68rem",
                    fontWeight: 800,
                    color: "#94A3B8",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  IA Generativa
                </span>
                <button
                  type="button"
                  onClick={() => setShowAiKeyInput((prev) => !prev)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#C084FC",
                    fontSize: "0.66rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    padding: 0,
                  }}
                  title="Configurar clave API personalizada"
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Dashicon name="admin-tools" size={12} color="#C084FC" /> <span>{showAiKeyInput ? "Ocultar Key" : "API Key"}</span></span>
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                <button
                  type="button"
                  className={`btn-engine-pill ${createEngine === "gemini" ? "active-gemini" : ""}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    padding: "8px 6px",
                    borderRadius: 8,
                    fontSize: "0.74rem",
                    fontWeight: 800,
                    cursor: "pointer",
                    border:
                      createEngine === "gemini"
                        ? "1.5px solid #4285F4"
                        : "1px solid rgba(255,255,255,0.1)",
                    background:
                      createEngine === "gemini"
                        ? "rgba(66, 133, 244, 0.22)"
                        : "rgba(255,255,255,0.04)",
                    color: createEngine === "gemini" ? "#93C5FD" : "rgba(255,255,255,0.7)",
                    transition: "all 0.15s ease",
                  }}
                  onClick={() => {
                    setCreateEngine("gemini");
                    setCreateEngineName("Google Gemini (Imagen 3)");
                  }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Dashicon name="welcome-learn-more" size={14} color="#93C5FD" /> <span>Gemini 2.5</span></span>
                </button>
                <button
                  type="button"
                  className={`btn-engine-pill ${createEngine === "chatgpt" ? "active-chatgpt" : ""}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    padding: "8px 6px",
                    borderRadius: 8,
                    fontSize: "0.74rem",
                    fontWeight: 800,
                    cursor: "pointer",
                    border:
                      createEngine === "chatgpt"
                        ? "1.5px solid #10A37F"
                        : "1px solid rgba(255,255,255,0.1)",
                    background:
                      createEngine === "chatgpt"
                        ? "rgba(16, 163, 127, 0.22)"
                        : "rgba(255,255,255,0.04)",
                    color: createEngine === "chatgpt" ? "#6EE7B7" : "rgba(255,255,255,0.7)",
                    transition: "all 0.15s ease",
                  }}
                  onClick={() => {
                    setCreateEngine("chatgpt");
                    setCreateEngineName("OpenAI ChatGPT (DALL-E 3)");
                  }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Dashicon name="admin-generic" size={14} color="#6EE7B7" /> <span>ChatGPT 4o</span></span>
                </button>
              </div>

              {showAiKeyInput && (
                <div style={{ marginTop: 8 }}>
                  <input
                    type="password"
                    placeholder={`Pega tu API Key de ${createEngine === "gemini" ? "Google Gemini" : "OpenAI"} (Opcional)`}
                    value={customAiApiKey}
                    onChange={(e) => setCustomAiApiKey(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "5px 8px",
                      borderRadius: 6,
                      background: "rgba(0,0,0,0.5)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      color: "#FFFFFF",
                      fontSize: "0.7rem",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                  <span style={{ fontSize: "0.62rem", color: "#64748B", display: "block", marginTop: 2 }}>
                    Si no agregas una llave, se usará el motor inteligente integrado de alta resolución.
                  </span>
                </div>
              )}
            </div>

            {/* Toggle de Modo: FROM SCRATCH vs FROM IMAGE */}
            <div className="create-mode-switch-row">
              <button
                type="button"
                className={`btn-mode-toggle ${createMode === "scratch" ? "active" : ""}`}
                onClick={() => setCreateMode("scratch")}
              >
                <Dashicon name="edit" size={14} />
                <span>FROM SCRATCH</span>
              </button>
              <button
                type="button"
                className={`btn-mode-toggle ${createMode === "image" ? "active" : ""}`}
                onClick={() => {
                  setCreateMode("image");
                  if (createFileInputRef.current) createFileInputRef.current.click();
                }}
              >
                <Dashicon name="format-image" size={14} />
                <span>FROM IMAGE</span>
              </button>
            </div>

            <input
              ref={createFileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setCreateSourceFile(f);
                  const reader = new FileReader();
                  reader.onload = (ev) => setCreateResultUrl(ev.target?.result as string);
                  reader.readAsDataURL(f);
                }
              }}
            />

            {/* Sub-tabs: Persona, Wardrobe (Outfits), Accesorios (Props), Mis Skins */}
            <div className="create-subtabs-row">
              <button
                type="button"
                className={`create-subtab-icon-btn ${createCategory === "person" ? "active" : ""}`}
                onClick={() => setCreateCategory("person")}
                title="Characters (Personajes)"
                aria-label="Characters"
              >
                <Dashicon name="admin-users" size={18} />
              </button>
              <button
                type="button"
                className={`create-subtab-icon-btn ${createCategory === "outfit" ? "active" : ""}`}
                onClick={() => setCreateCategory("outfit")}
                title="Wardrobe (Outfits)"
                aria-label="Wardrobe"
              >
                <Dashicon name="products" size={18} />
              </button>
              <button
                type="button"
                className={`create-subtab-icon-btn ${createCategory === "props" ? "active" : ""}`}
                onClick={() => setCreateCategory("props")}
                title="Accesorios (Props)"
                aria-label="Accessories"
              >
                <Dashicon name="art" size={18} />
              </button>
              <button
                type="button"
                className={`create-subtab-icon-btn ${createCategory === "saved_skins" ? "active" : ""}`}
                onClick={() => setCreateCategory("saved_skins")}
                title={`Mis Skins Guardados (${savedSkins.length})`}
                aria-label="Mis Skins Guardados"
                style={{ position: "relative" }}
              >
                <Dashicon name="star-filled" size={18} color={createCategory === "saved_skins" ? "#FBBF24" : undefined} />
                {savedSkins.length > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      background: "#FBBF24",
                      color: "#000",
                      fontSize: "0.58rem",
                      fontWeight: 900,
                      borderRadius: 10,
                      padding: "1px 4px",
                      lineHeight: 1,
                    }}
                  >
                    {savedSkins.length}
                  </span>
                )}
              </button>
            </div>

            {createCategory === "saved_skins" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div
                  style={{
                    padding: "12px 14px",
                    background: "rgba(15, 18, 30, 0.85)",
                    borderRadius: 14,
                    border: "1px solid rgba(251, 191, 36, 0.3)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <Dashicon name="star-filled" size={18} color="#FBBF24" />
                    <strong style={{ fontSize: "0.92rem", color: "#FFFFFF" }}>Gestor de Skins</strong>
                  </div>
                  <p style={{ margin: 0, fontSize: "0.74rem", color: "#94A3B8", lineHeight: 1.4 }}>
                    Tus personajes, vestuarios y presets guardados listos para activar en vivo en CAM o en Try-On.
                  </p>
                </div>

                <div className="field-row" style={{ margin: 0 }}>
                  <label style={{ fontSize: "0.74rem", fontWeight: 700, color: "#E2E8F0" }}>Buscar en mi colección</label>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="Buscar por nombre o palabra clave..."
                    value={skinSearchQuery}
                    onChange={(e) => setSkinSearchQuery(e.target.value)}
                    style={{ fontSize: "0.78rem" }}
                  />
                </div>

                <div className="field-row" style={{ margin: 0 }}>
                  <label style={{ fontSize: "0.74rem", fontWeight: 700, color: "#E2E8F0" }}>Filtrar por categoría</label>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {[
                      { id: "all", label: "Todos" },
                      { id: "Personaje", label: "Personajes" },
                      { id: "Try-On", label: "Try-On" },
                      { id: "Estilo", label: "Estilos" },
                      { id: "VFX", label: "VFX" },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        className={`pill-ctrl-button ${skinCategoryFilter === cat.id ? "active-pink" : ""}`}
                        style={{ padding: "4px 8px", fontSize: "0.72rem" }}
                        onClick={() => setSkinCategoryFilter(cat.id)}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
                  <button
                    type="button"
                    className="btn"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      background: "rgba(255,255,255,0.06)",
                      borderColor: "rgba(255,255,255,0.15)",
                      minHeight: 36,
                      fontSize: "0.78rem",
                    }}
                    onClick={() => skinUploadInputRef.current?.click()}
                  >
                    <Dashicon name="upload" size={14} />
                    <span>Subir Skin desde Imagen</span>
                  </button>
                  <button
                    type="button"
                    className="btn"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      background: "linear-gradient(135deg, #4285F4 0%, #8B5CF6 100%)",
                      color: "#FFF",
                      minHeight: 36,
                      fontSize: "0.78rem",
                      border: "none",
                    }}
                    onClick={() => setCreateCategory("person")}
                  >
                    <Dashicon name="admin-users" size={14} />
                    <span>+ Diseñar con IA</span>
                  </button>
                </div>

                <input
                  ref={skinUploadInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        const dataUrl = ev.target?.result as string;
                        const cleanName = f.name.replace(/\.[^/.]+$/, "").slice(0, 24);
                        const newSkin: SavedSkinPreset = {
                          id: `skin-upload-${Date.now()}`,
                          name: cleanName || "Mi Skin",
                          category: "Personaje",
                          prompt: "Substitute the character with the person in the reference image",
                          modelId: "lucy-2.6",
                          refImageDataUrl: dataUrl,
                          createdAt: new Date().toISOString(),
                        };
                        const updated = [newSkin, ...savedSkins];
                        setSavedSkins(updated);
                        try {
                          window.localStorage.setItem(SKINS_STORAGE_KEY, JSON.stringify(updated));
                        } catch {}
                        setStreamInfo(`⭐ Skin "${newSkin.name}" guardado exitosamente.`);
                      };
                      reader.readAsDataURL(f);
                    }
                    e.target.value = "";
                  }}
                />
              </div>
            ) : createCategory === "outfit" || createCategory === "props" ? (
              (() => {
                const draftCfg = CREATE_CATEGORY_CONFIG[createCategory];
                const activeDraft = categoryDrafts[createCategory];
                const hasDraftInput =
                  activeDraft.prompt.trim().length > 0 ||
                  Object.values(activeDraft.chips).some(Boolean) ||
                  activeDraft.multi.length > 0 ||
                  activeDraft.customAdditions.trim().length > 0;
                return (
                  <>
                    {/* Prompt con botón aleatorio + limpiar */}
                    <div className="builder-accordion-group" style={{ borderTop: "none" }}>
                      <div className="builder-accordion-label">
                        <span>{draftCfg.promptLabel}</span>
                        <div className="create-prompt-actions">
                          {hasDraftInput && (
                            <button
                              type="button"
                              className="btn-prompt-icon"
                              onClick={() => handleClearDraft(createCategory)}
                              title={draftCfg.clearTitle}
                              aria-label={draftCfg.clearTitle}
                              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                            >
                              <Dashicon name="dismiss" size={12} />
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn-prompt-icon btn-prompt-cycle"
                            onClick={() => handleRandomizeDraft(createCategory)}
                            title={draftCfg.randomTitle}
                            aria-label={draftCfg.randomTitle}
                            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                          >
                            <Dashicon name="controls-repeat" size={12} />
                          </button>
                        </div>
                      </div>
                      <textarea
                        className="dock-prompt-textarea builder-custom-textarea"
                        placeholder={draftCfg.promptPlaceholder}
                        value={activeDraft.prompt}
                        onChange={(e) => handleUpdateDraftText(createCategory, "prompt", e.target.value)}
                      />
                    </div>

                    {/* Acordeones colapsables con single-select y multi-select dots */}
                    {draftCfg.sections.map((section) => {
                      const isCollapsed = Boolean(collapsedBuilderSections[section.id]);
                      const activeCount = section.multiSelect
                        ? activeDraft.multi.length
                        : activeDraft.chips[section.id]
                          ? 1
                          : 0;
                      return (
                        <div key={section.id} className="builder-accordion-group">
                          <button
                            type="button"
                            className={`builder-accordion-label builder-accordion-toggle ${isCollapsed ? "is-collapsed" : ""}`}
                            onClick={() => handleToggleBuilderSection(section.id)}
                            aria-expanded={!isCollapsed}
                          >
                            <span>
                              {section.label}
                              {activeCount > 0 && (
                                <span className="builder-section-count"> ({activeCount})</span>
                              )}
                            </span>
                            <svg
                              className="builder-accordion-chevron"
                              width="12"
                              height="12"
                              viewBox="0 0 12 12"
                              fill="none"
                              aria-hidden="true"
                            >
                              <path
                                d="M2.5 7.5L6 4L9.5 7.5"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                          {!isCollapsed && (
                            <div className="builder-chips-wrap">
                              {section.options.map((option) => {
                                const isSelected = section.multiSelect
                                  ? activeDraft.multi.includes(option)
                                  : activeDraft.chips[section.id] === option;
                                return (
                                  <button
                                    key={option}
                                    type="button"
                                    className={`builder-chip-pill ${isSelected ? "active" : ""} ${section.multiSelect ? "has-multi-dot" : ""}`}
                                    onClick={() =>
                                      handleToggleDraftChip(
                                        createCategory,
                                        section.id,
                                        option,
                                        section.multiSelect,
                                      )
                                    }
                                    aria-pressed={isSelected}
                                  >
                                    <span>{option}</span>
                                    {section.multiSelect && (
                                      <span className="builder-chip-dot" aria-hidden="true" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* CUSTOM ADDITIONS al final antes del botón CREATE */}
                    <div className="builder-accordion-group">
                      <span className="builder-accordion-label">CUSTOM ADDITIONS</span>
                      <textarea
                        className="dock-prompt-textarea builder-custom-textarea"
                        placeholder="Optional. Extra details to refine the result — colors, vibes, accessories, anything you'd add..."
                        value={activeDraft.customAdditions}
                        onChange={(e) =>
                          handleUpdateDraftText(createCategory, "customAdditions", e.target.value)
                        }
                      />
                    </div>
                  </>
                );
              })()
            ) : (
              <>
                {/* Prompt de descripción de personaje con botón de limpiar */}
                <div className="builder-accordion-group" style={{ borderTop: "none" }}>
                  <div className="builder-accordion-label">
                    <span>DESCRIBE YOUR CHARACTER</span>
                    <button
                      type="button"
                      className="btn-prompt-icon"
                      onClick={() => setCreatePrompt("")}
                      title="Limpiar descripción"
                      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                    >
                      <Dashicon name="dismiss" size={12} />
                    </button>
                  </div>
                  <textarea
                    className="dock-prompt-textarea builder-custom-textarea"
                    value={createPrompt}
                    onChange={(e) => setCreatePrompt(e.target.value)}
                  />
                </div>

                {/* Acordeones con chips interactivos Delulu */}
                {DELULU_BUILDER_SECTIONS.map((section) => {
                  const isCollapsed = Boolean(collapsedBuilderSections[section.id]);
                  return (
                    <div key={section.id} className="builder-accordion-group">
                      <button
                        type="button"
                        className={`builder-accordion-label builder-accordion-toggle ${isCollapsed ? "is-collapsed" : ""}`}
                        onClick={() => handleToggleBuilderSection(section.id)}
                        aria-expanded={!isCollapsed}
                      >
                        <span>{section.label}</span>
                        <svg
                          className="builder-accordion-chevron"
                          width="12"
                          height="12"
                          viewBox="0 0 12 12"
                          fill="none"
                          aria-hidden="true"
                        >
                          <path
                            d="M2.5 7.5L6 4L9.5 7.5"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                      {!isCollapsed && (
                        <div className="builder-chips-wrap">
                          {section.options.map((option) => {
                            const isSelected = createSelectedChips[section.id] === option;
                            return (
                              <button
                                key={option}
                                type="button"
                                className={`builder-chip-pill ${isSelected ? "active" : ""}`}
                                onClick={() => handleToggleChip(section.id, option)}
                              >
                                {option}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}

            {/* Botón de acción CREATE conectado a Gemini / ChatGPT */}
            {createCategory !== "saved_skins" && (() => {
              const isDraftCat = createCategory === "outfit" || createCategory === "props";
              const activeDraft = isDraftCat ? categoryDrafts[createCategory] : null;
              const isBuilderReady =
                !isDraftCat ||
                !activeDraft ||
                activeDraft.prompt.trim().length > 0 ||
                Object.values(activeDraft.chips).some(Boolean) ||
                activeDraft.multi.length > 0 ||
                activeDraft.customAdditions.trim().length > 0 ||
                Boolean(createSourceFile);
              return (
                <button
                  type="button"
                  className={`btn-create-submit ${!isBuilderReady ? "is-muted" : ""}`}
                  style={{
                    background:
                      createEngine === "gemini"
                        ? "linear-gradient(135deg, #4285F4 0%, #8B5CF6 100%)"
                        : "linear-gradient(135deg, #10A37F 0%, #2563EB 100%)",
                    border: "none",
                    boxShadow:
                      createEngine === "gemini"
                        ? "0 4px 14px rgba(66, 133, 244, 0.4)"
                        : "0 4px 14px rgba(16, 163, 127, 0.4)",
                  }}
                  onClick={handleGenerateCharacterImage}
                  disabled={createGenerating || !isBuilderReady}
                >
                  {createGenerating
                    ? `GENERANDO CON ${createEngine === "gemini" ? "GEMINI" : "CHATGPT"}...`
                    : `CREAR CON ${createEngine === "gemini" ? "GEMINI" : "CHATGPT"}`}
                </button>
              );
            })()}

            {createError && (
              <div style={{ color: "var(--danger-red)", fontSize: "0.75rem", textAlign: "center" }}>
                {createError}
              </div>
            )}
          </aside>

          {/* Lienzo central de previsualización */}
          <main className="create-stage-preview">
            {createCategory === "saved_skins" ? (
              <div style={{ width: "100%", maxWidth: 960, display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: 12 }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: "1.15rem", display: "flex", alignItems: "center", gap: 8 }}>
                      <Dashicon name="star-filled" size={18} color="#FBBF24" />
                      <span>Colección de Skins ({filteredSkins.length})</span>
                    </h2>
                    <span style={{ fontSize: "0.75rem", color: "#94A3B8" }}>
                      Selecciona cualquier skin para activarlo de inmediato en tu transmisión en vivo o probarlo en Try-On
                    </span>
                  </div>
                  {savedSkins.length > 0 && (
                    <button
                      type="button"
                      className="btn"
                      style={{ fontSize: "0.74rem", padding: "4px 12px", minHeight: 32 }}
                      onClick={() => setCreateCategory("person")}
                    >
                      <span>+ Diseñar Nuevo con IA</span>
                    </button>
                  )}
                </div>

                {filteredSkins.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "60px 20px", background: "rgba(15, 18, 30, 0.4)", borderRadius: 16, border: "1px dashed rgba(255,255,255,0.15)" }}>
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: 12, color: "#FBBF24" }}>
                      <Dashicon name="star-filled" size={36} />
                    </div>
                    <h3 style={{ margin: "0 0 6px 0", fontSize: "1rem", color: "#FFFFFF" }}>
                      {savedSkins.length === 0 ? "Aún no tienes skins guardados" : "No hay skins que coincidan con la búsqueda"}
                    </h3>
                    <p style={{ margin: "0 auto 16px auto", maxWidth: 420, fontSize: "0.8rem", color: "#94A3B8" }}>
                      {savedSkins.length === 0
                        ? "Genera personajes, vestuarios o accesorios con Google Gemini o ChatGPT en las pestañas de arriba y guárdalos aquí para tenerlos siempre a mano."
                        : "Intenta con otro término de búsqueda o cambia el filtro de categoría en la barra izquierda."}
                    </p>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => setCreateCategory("person")}
                      style={{ padding: "8px 18px", fontSize: "0.82rem" }}
                    >
                      Diseñar con IA ahora
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: 14 }}>
                    {filteredSkins.map((skin) => (
                      <div
                        key={skin.id}
                        style={{
                          background: "#121422",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: 14,
                          padding: 12,
                          display: "flex",
                          flexDirection: "column",
                          gap: 10,
                          transition: "border-color 0.2s ease",
                        }}
                      >
                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                          <div
                            style={{
                              width: 56,
                              height: 56,
                              borderRadius: 10,
                              overflow: "hidden",
                              background: "rgba(255,255,255,0.05)",
                              border: "1px solid rgba(255,255,255,0.1)",
                              flexShrink: 0,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {skin.refImageDataUrl ? (
                              <img
                                src={skin.refImageDataUrl}
                                alt={skin.name}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              />
                            ) : (
                              <Dashicon name="art" size={24} color="#A5B4FC" />
                            )}
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                              <strong style={{ fontSize: "0.86rem", color: "#FFFFFF", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {skin.name}
                              </strong>
                            </div>
                            <span
                              style={{
                                display: "inline-block",
                                fontSize: "0.62rem",
                                fontWeight: 800,
                                textTransform: "uppercase",
                                padding: "2px 6px",
                                borderRadius: 4,
                                background:
                                  skin.category === "Try-On"
                                    ? "rgba(236, 72, 153, 0.2)"
                                    : skin.category === "VFX"
                                    ? "rgba(59, 130, 246, 0.2)"
                                    : "rgba(168, 85, 247, 0.2)",
                                color:
                                  skin.category === "Try-On"
                                    ? "#F472B6"
                                    : skin.category === "VFX"
                                    ? "#93C5FD"
                                    : "#C084FC",
                              }}
                            >
                              {skin.category}
                            </span>
                          </div>
                        </div>

                        <p
                          style={{
                            margin: 0,
                            fontSize: "0.72rem",
                            color: "#94A3B8",
                            lineHeight: 1.35,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {skin.prompt}
                        </p>

                        <div style={{ display: "flex", gap: 6, marginTop: "auto", flexWrap: "wrap" }}>
                          <button
                            type="button"
                            className="btn btn-primary"
                            style={{ flex: 1, padding: "6px 8px", fontSize: "0.74rem", minHeight: 32 }}
                            onClick={() => {
                              setPromptText(skin.prompt);
                              setSelectedModelId(skin.modelId || "lucy-2.6");
                              if (skin.refImageDataUrl) {
                                setRefImageDataUrl(skin.refImageDataUrl);
                                setRefImageFile(dataUrlToFile(skin.refImageDataUrl, `${skin.name}.png`));
                                setSelectedPresetId("ref-swap");
                              }
                              setActiveTab("CAM");
                              setStreamInfo(`✨ Skin "${skin.name}" aplicado a la cámara en vivo.`);
                            }}
                          >
                            <span>Aplicar a CAM</span>
                          </button>
                          {skin.category === "Try-On" && (
                            <button
                              type="button"
                              className="btn"
                              style={{ padding: "6px 8px", fontSize: "0.74rem", minHeight: 32 }}
                              onClick={() => {
                                if (skin.refImageDataUrl) {
                                  const g: TryOnGarmentItem = {
                                    id: `garment-${skin.id}`,
                                    name: skin.name,
                                    category: "Outfit",
                                    prompt: skin.prompt,
                                    customImageUrl: skin.refImageDataUrl,
                                    isCustom: true,
                                  };
                                  setTryOnGarments((prev) => [g, ...prev]);
                                  void handleSelectGarment(g);
                                }
                                setActiveTab("TRY_ON");
                              }}
                              title="Usar en cabina Try-On"
                            >
                              <span>Try-On</span>
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn"
                            style={{ padding: "6px 8px", minHeight: 32, color: "#EF4444", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                            onClick={() => {
                              const updated = savedSkins.filter((s) => s.id !== skin.id);
                              setSavedSkins(updated);
                              try {
                                window.localStorage.setItem(SKINS_STORAGE_KEY, JSON.stringify(updated));
                              } catch {}
                            }}
                            title="Eliminar skin"
                          >
                            <Dashicon name="trash" size={14} color="#EF4444" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : createResultUrl ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 16,
                  maxWidth: 500,
                  width: "100%",
                }}
              >
                {/* Insignia del motor de IA utilizado */}
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 12px",
                    borderRadius: 14,
                    background:
                      createEngine === "gemini"
                        ? "rgba(66, 133, 244, 0.2)"
                        : "rgba(16, 163, 127, 0.2)",
                    border:
                      createEngine === "gemini"
                        ? "1px solid rgba(66, 133, 244, 0.6)"
                        : "1px solid rgba(16, 163, 127, 0.6)",
                    color: createEngine === "gemini" ? "#93C5FD" : "#6EE7B7",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                  }}
                >
                  <Dashicon name={createEngine === "gemini" ? "welcome-learn-more" : "admin-generic"} size={13} color={createEngine === "gemini" ? "#93C5FD" : "#6EE7B7"} />
                  <span>{createEngineName}</span>
                </div>

                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={createResultUrl}
                  alt={
                    createCategory === "outfit" || createCategory === "props"
                      ? CREATE_CATEGORY_CONFIG[createCategory].resultAlt
                      : "Personaje generado"
                  }
                  style={{
                    width: "100%",
                    borderRadius: 16,
                    border:
                      createEngine === "gemini"
                        ? "2px solid #4285F4"
                        : "2px solid #10A37F",
                    boxShadow:
                      createEngine === "gemini"
                        ? "0 10px 30px rgba(66, 133, 244, 0.35)"
                        : "0 10px 30px rgba(16, 163, 127, 0.35)",
                  }}
                />
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
                  {createCategory === "outfit" && (
                    <button
                      type="button"
                      className="pill-ctrl-button active-pink"
                      style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                      onClick={handleUseWardrobeResultInTryOn}
                    >
                      <Dashicon name="products" size={14} />
                      <span>USAR EN TRY-ON</span>
                    </button>
                  )}
                  <button
                    type="button"
                    className={`pill-ctrl-button ${createCategory === "outfit" ? "" : "active-pink"}`}
                    style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                    onClick={() => {
                      const isDraftCat = createCategory === "outfit" || createCategory === "props";
                      const activeDraft = isDraftCat ? categoryDrafts[createCategory] : null;
                      const cfg = isDraftCat ? CREATE_CATEGORY_CONFIG[createCategory] : null;
                      setRefImageDataUrl(createResultUrl);
                      setRefImageFile(
                        dataUrlToFile(
                          createResultUrl,
                          cfg ? cfg.downloadName : `personaje-${createEngine}.png`,
                        ),
                      );
                      setSelectedPresetId("ref-swap");
                      if (isDraftCat && activeDraft && cfg) {
                        const finalPrompt =
                          [
                            activeDraft.prompt.trim() ||
                              composeCategoryPrompt(createCategory, activeDraft.chips, activeDraft.multi),
                            activeDraft.customAdditions.trim(),
                          ]
                            .filter(Boolean)
                            .join(", ") || REFERENCE_SWAP_PROMPT;
                        setPromptText(`${cfg.camPromptPrefix} ${finalPrompt}`);
                      } else {
                        setPromptText(REFERENCE_SWAP_PROMPT);
                      }
                      setSelectedModelId("lucy-2.6");
                      setActiveTab("CAM");
                    }}
                  >
                    <Dashicon name="star-filled" size={14} />
                    <span>
                      {createCategory === "outfit" || createCategory === "props"
                        ? CREATE_CATEGORY_CONFIG[createCategory].camBtnLabel
                        : "USAR COMO PERSONAJE EN CAM"}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="pill-ctrl-button"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      borderColor: skinSavedFeedback ? "#10B981" : "rgba(251, 191, 36, 0.7)",
                      color: skinSavedFeedback ? "#10B981" : "#FBBF24",
                    }}
                    onClick={() => {
                      const isDraftCat = createCategory === "outfit" || createCategory === "props";
                      const activeDraft = isDraftCat ? categoryDrafts[createCategory] : null;
                      const finalPrompt =
                        [
                          isDraftCat && activeDraft
                            ? activeDraft.prompt.trim() || composeCategoryPrompt(createCategory, activeDraft.chips, activeDraft.multi)
                            : createPrompt.trim(),
                          isDraftCat && activeDraft ? activeDraft.customAdditions.trim() : "",
                        ]
                          .filter(Boolean)
                          .join(", ") || "Personaje estilizado con IA";
                      const defaultName =
                        isDraftCat && activeDraft && activeDraft.prompt.trim()
                          ? activeDraft.prompt.trim().slice(0, 24)
                          : `${createCategory === "outfit" ? "Outfit" : createCategory === "props" ? "Accesorio" : "Personaje"} ${createEngine === "gemini" ? "Gemini" : "ChatGPT"}`;
                      const newSkin: SavedSkinPreset = {
                        id: `skin-${Date.now()}`,
                        name: defaultName,
                        category: createCategory === "outfit" ? "Try-On" : createCategory === "props" ? "VFX" : "Personaje",
                        prompt: finalPrompt,
                        modelId: "lucy-2.6",
                        refImageDataUrl: createResultUrl,
                        createdAt: new Date().toISOString(),
                      };
                      const updated = [newSkin, ...savedSkins];
                      setSavedSkins(updated);
                      try {
                        window.localStorage.setItem(SKINS_STORAGE_KEY, JSON.stringify(updated));
                      } catch {}
                      setSkinSavedFeedback(true);
                      setTimeout(() => setSkinSavedFeedback(false), 3000);
                      setStreamInfo(`⭐ Skin "${newSkin.name}" guardado exitosamente en tu colección.`);
                    }}
                  >
                    <Dashicon name="star-filled" size={14} color={skinSavedFeedback ? "#10B981" : "#FBBF24"} />
                    <span>{skinSavedFeedback ? "¡GUARDADO EN SKINS!" : "GUARDAR EN MIS SKINS"}</span>
                  </button>
                  <a
                    href={createResultUrl}
                    download={
                      createCategory === "outfit"
                        ? `outfit-${createEngine}.png`
                        : createCategory === "props"
                          ? `accesorio-${createEngine}.png`
                          : `personaje-${createEngine}.png`
                    }
                    className="pill-ctrl-button"
                    style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}
                  >
                    <Dashicon name="download" size={14} />
                    <span>DESCARGAR</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="create-dashed-preview-box">
                <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 52, height: 52, borderRadius: 14, background: "rgba(236, 72, 153, 0.14)", color: "#EC4899" }}>
                  <Dashicon name={createCategory === "outfit" ? "products" : "art"} size={28} />
                </span>
                <span className="preview-main-heading">PREVIEW WILL APPEAR HERE</span>
                <span className="preview-sub-text">
                  {createCategory === "outfit" || createCategory === "props"
                    ? CREATE_CATEGORY_CONFIG[createCategory].emptyHint
                    : "Selecciona atributos con las etiquetas o escribe tu descripción y pulsa CREATE para generar tu personaje con IA en tiempo real."}
                </span>
                {(createCategory === "outfit" || createCategory === "props") &&
                  (() => {
                    const activeDraft = categoryDrafts[createCategory];
                    const hasAnySummary =
                      activeDraft.prompt.trim().length > 0 ||
                      Object.values(activeDraft.chips).some(Boolean) ||
                      activeDraft.multi.length > 0 ||
                      activeDraft.customAdditions.trim().length > 0;
                    if (!hasAnySummary) return null;
                    return (
                      <div className="wardrobe-preview-summary">
                        <div className="wardrobe-summary-pills">
                          {Object.values(activeDraft.chips)
                            .filter(Boolean)
                            .map((val) => (
                              <span key={val} className="wardrobe-summary-chip">
                                {val}
                              </span>
                            ))}
                          {activeDraft.multi.map((detail) => (
                            <span key={detail} className="wardrobe-summary-chip is-detail">
                              + {detail}
                            </span>
                          ))}
                        </div>
                        {(activeDraft.prompt.trim() || activeDraft.customAdditions.trim()) && (
                          <p className="wardrobe-summary-prompt">
                            {[activeDraft.prompt.trim(), activeDraft.customAdditions.trim()]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        )}
                      </div>
                    );
                  })()}
              </div>
            )}
          </main>
        </section>
      )}


      {/* -------------------------------------------------------------
          VISTA 4: MODULOS PRO (PLAYLIST, CHAT, SCHEDULE, OBS V2, VOZ, SKINS)
          ------------------------------------------------------------- */}
      {activeTab === "PRO" && (
        <section className="pro-workspace-layout">
          <div className="pro-subtabs-row">
            <button
              type="button"
              className={`pro-subtab-btn ${proSubTab === "playlist_stream" ? "active" : ""}`}
              onClick={() => setProSubTab("playlist_stream")}
            >
              <Dashicon name="controls-play" size={14} />
              <span>Playlist Streaming (Loop 24/7)</span>
            </button>
            <button
              type="button"
              className={`pro-subtab-btn ${proSubTab === "unified_chat" ? "active" : ""}`}
              onClick={() => setProSubTab("unified_chat")}
            >
              <Dashicon name="format-chat" size={14} />
              <span>Unified Live Chat</span>
            </button>
            <button
              type="button"
              className={`pro-subtab-btn ${proSubTab === "schedule_live" ? "active" : ""}`}
              onClick={() => setProSubTab("schedule_live")}
            >
              <Dashicon name="clock" size={14} />
              <span>Schedule or Go Live</span>
            </button>
            <button
              type="button"
              className={`pro-subtab-btn ${proSubTab === "obs_alerts" ? "active" : ""}`}
              onClick={() => setProSubTab("obs_alerts")}
            >
              <Dashicon name="desktop" size={14} />
              <span>OBS Studio &amp; Alertas V2</span>
            </button>
            <button
              type="button"
              className={`pro-subtab-btn ${proSubTab === "voice_finance" ? "active" : ""}`}
              onClick={() => setProSubTab("voice_finance")}
            >
              <Dashicon name="microphone" size={14} />
              <span>Voz IA &amp; Finanzas COP</span>
            </button>
          </div>

          <div>
            {proSubTab === "playlist_stream" && (
              <PlaylistStreamingPanel
                onLoadClipToMonitor={(url) => {
                  setLocalVideoFileUrl(url);
                  setSourceMode("video_file");
                  setActiveTab("CAM");
                  setStreamInfo("📼 Video de la playlist cargado en el monitor.");
                }}
                onStartPlaylistStream={(items, loop, meta) => {
                  if (items[0]) {
                    setLocalVideoFileUrl(items[0].videoUrl);
                    setSourceMode("video_file");
                  }
                  const destText =
                    meta?.broadcastMode === "single"
                      ? `1 plataforma (${meta.selectedPlatforms[0]})`
                      : `MultiLive (${meta?.selectedPlatforms.length || 3} plataformas)`;
                  const schedText =
                    meta?.scheduleMode === "scheduled"
                      ? ` · Programado ${meta.scheduledDate} ${meta.scheduledStartTime}`
                      : "";
                  const preText = meta?.enablePreLaunch
                    ? ` · Prelanzamiento ${meta.preLaunchMinutes}m`
                    : "";
                  setActiveTab("CAM");
                  setStreamInfo(`🚀 Playlist streaming ${loop ? "24/7" : "en cola"} hacia ${destText}${schedText}${preText}.`);
                }}
              />
            )}

            {proSubTab === "unified_chat" && (
              <UnifiedLiveChatPanel
                cropMode={effectiveCropMode}
                chatOverlayEnabled={realFeelChatEnabled}
                onToggleChatOverlay={() => setRealFeelChatEnabled((v) => !v)}
                onPinCommentToScreen={(msg) => setPinnedChatMessage(msg)}
                pinnedCommentId={pinnedChatMessage?.id}
                pinnedMessage={pinnedChatMessage}
                chatLanguage={chatLanguage}
                onLanguageChange={handleUpdateChatLanguage}
              />
            )}

            {proSubTab === "schedule_live" && (
              <ScheduleLivePanel
                onGoLiveInstant={() => {
                  setActiveTab("CAM");
                  void startRealtime();
                }}
                isCurrentlyLive={isConnectedLive}
              />
            )}

            {proSubTab === "obs_alerts" && (
              <ObsAlertsPanel
                obsSubscribeUrl={
                  typeof window !== "undefined"
                    ? `${window.location.origin}/obs-stage${subscribeToken ? `?token=${encodeURIComponent(subscribeToken)}` : ""}`
                    : ""
                }
                isConnectedLive={isConnectedLive}
                onOpenPopout={() => window.open("/obs-stage", "_blank")}
                onApplyAlertEffect={async (alertPrompt) => {
                  setPromptText(alertPrompt);
                  if (isConnectedLive) {
                    const rt = realtimeClientRef.current;
                    if (rt && rt.isConnected()) {
                      await rt.set({ prompt: alertPrompt, enhance: enhancePrompt, image: null });
                    }
                  }
                }}
              />
            )}

            {proSubTab === "voice_finance" && (
              <VoiceFinancePanel
                accountCredits={account.credits}
                usageLedger={usageLedger}
                onClearLedger={() => setUsageLedger([])}
                onProcessedAudioStream={(stream) => {
                  if (stream) setupVuMeter(stream);
                }}
              />
            )}
          </div>
        </section>
      )}

      {/* -------------------------------------------------------------
          VISTA 5: PANEL DE CONFIGURACIÓN & SETTINGS AVANZADOS (APIs, WhatsApp Técnico, Go Live, Voz/Finanzas, OBS, Docs)
          ------------------------------------------------------------- */}
      {activeTab === "SETTINGS" && (
        <SettingsStudioPanel
          accountCredits={account.credits}
          usageLedger={usageLedger}
          onClearLedger={() => setUsageLedger([])}
          whatsappConfig={whatsappConfig}
          onChangeWhatsAppConfig={persistWhatsAppConfig}
          onProcessedAudioStream={(stream) => {
            if (stream) setupVuMeter(stream);
          }}
          onNavigateToTab={(tab, subTab) => {
            if (subTab === "try_on") {
              navigateToMainTab("TRY_ON");
              return;
            }
            if (subTab === "queue") {
              navigateToMainTab("CLIPS");
              return;
            }
            if (subTab === "tiktok_live") {
              navigateToMainTab("TIKTOK_LIVE");
              return;
            }
            navigateToMainTab(tab === "DOCS" ? "SETTINGS" : tab);
            if (subTab) setProSubTab(subTab as ProSubTab);
          }}
        />
      )}

      {/* -------------------------------------------------------------
          MODAL OBS STUDIO / VIRTUAL CAMERA HELPER CON GUÍA PASO A PASO
          ------------------------------------------------------------- */}
      {showObsModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(10px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 20,
            overflowY: "auto",
          }}
          onClick={() => setShowObsModal(false)}
        >
          <div
            style={{
              position: "relative",
              maxWidth: 780,
              width: "100%",
              maxHeight: "92vh",
              overflowY: "auto",
              borderRadius: 20,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowObsModal(false)}
              style={{
                position: "absolute",
                top: 14,
                right: 14,
                zIndex: 10,
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "rgba(255, 255, 255, 0.12)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                color: "#FFFFFF",
                fontSize: "1.1rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title="Cerrar Guía"
            >
              ✕
            </button>
            <VirtualCameraGuideTable
              onOpenPopout={() => {
                if (typeof window !== "undefined") {
                  window.open("/obs-stage", "_blank", "width=1280,height=720");
                }
              }}
            />
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          MODAL SUBIR PERSONAJE A EXPLORE
          ------------------------------------------------------------- */}
      {showUploadExploreModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 20,
          }}
          onClick={() => setShowUploadExploreModal(false)}
        >
          <div
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--accent-pink)",
              borderRadius: 16,
              maxWidth: 540,
              width: "100%",
              padding: 24,
              boxShadow: "0 10px 40px var(--accent-pink-glow)",
              display: "flex",
              flexDirection: "column",
              gap: 14,
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800 }}>
                Publicar Nuevo Personaje en Explore
              </h3>
              <button
                className="btn-prompt-icon"
                onClick={() => setShowUploadExploreModal(false)}
                style={{ fontSize: "1.2rem" }}
              >
                ✕
              </button>
            </div>

            <div className="field-row">
              <label>Nombre del Personaje / Atuendo</label>
              <input
                className="input-control"
                placeholder="ej. Cyberpunk Assassin, Neon Streamer..."
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
              />
            </div>

            <div className="field-row">
              <label>Tu Nombre o Alias de Creador</label>
              <input
                className="input-control"
                placeholder="ej. Camilo, Estudio Creativo..."
                value={uploadAuthor}
                onChange={(e) => setUploadAuthor(e.target.value)}
              />
            </div>

            <div className="field-row">
              <label>Categoría</label>
              <select
                className="select-control"
                value={uploadCategory}
                onChange={(e) =>
                  setUploadCategory(e.target.value as "Characters" | "Outfits" | "Props")
                }
              >
                <option value="Characters">Characters (Personajes)</option>
                <option value="Outfits">Outfits (Prendas y Atuendos)</option>
                <option value="Props">Props (Accesorios)</option>
              </select>
            </div>

            <div className="field-row">
              <label>Foto de Portada / Imagen de Referencia</label>
              <input
                type="file"
                accept="image/*"
                className="input-control"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => setUploadCoverDataUrl(ev.target?.result as string);
                    reader.readAsDataURL(file);
                  }
                }}
              />
              {uploadCoverDataUrl && (
                <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 10 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={uploadCoverDataUrl}
                    alt="Previsualización"
                    style={{
                      width: 60,
                      height: 60,
                      objectFit: "cover",
                      borderRadius: 8,
                      border: "1px solid var(--accent-pink)",
                    }}
                  />
                  <span style={{ fontSize: "0.75rem", color: "var(--ok-green)" }}>
                    ✓ Foto cargada correctamente
                  </span>
                </div>
              )}
            </div>

            <div className="field-row">
              <label>Instrucción / Prompt en Inglés</label>
              <textarea
                className="textarea-control"
                rows={3}
                placeholder="Substitute the character in the video with..."
                value={uploadPrompt}
                onChange={(e) => setUploadPrompt(e.target.value)}
              />
            </div>

            <div className="field-row">
              <label>Motor de IA recomendado</label>
              <select
                className="select-control"
                value={uploadModelId}
                onChange={(e) =>
                  setUploadModelId(
                    e.target.value as "lucy-2.6" | "lucy-restyle-2" | "lucy-vton-3.6",
                  )
                }
              >
                <option value="lucy-2.6">Personajes y Rostros HD</option>
                <option value="lucy-vton-3.6">Probador Virtual de Ropa</option>
                <option value="lucy-restyle-2">Estilo Escénico Artístico</option>
              </select>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <label className="checkbox-line">
                <input
                  type="checkbox"
                  checked={uploadIsNsfw}
                  onChange={(e) => setUploadIsNsfw(e.target.checked)}
                />
                <span>Marcar como contenido para adultos (NSFW)</span>
              </label>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
              <button
                type="button"
                className="pill-ctrl-button"
                onClick={() => setShowUploadExploreModal(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="pill-ctrl-button active-pink"
                onClick={() => {
                  if (!uploadTitle.trim()) {
                    alert("Escribe un nombre para el personaje.");
                    return;
                  }
                  const newCard: ExploreCardItem = {
                    id: `usr-card-${Date.now()}`,
                    title: uploadTitle.trim(),
                    author: uploadAuthor.trim() || "Camilo",
                    likes: 1,
                    category: uploadCategory,
                    prompt: uploadPrompt.trim() || REFERENCE_SWAP_PROMPT,
                    modelId: uploadModelId,
                    isNsfw: uploadIsNsfw,
                    avatarBg:
                      uploadCoverDataUrl ||
                      "linear-gradient(135deg, #FF2E93 0%, #3B82F6 100%)",
                    tagBadge: uploadBadge,
                    requiresRefImage: !!uploadCoverDataUrl,
                  };
                  handleSaveExploreItem(newCard);
                }}
              >
                Publicar en Catálogo
              </button>
            </div>
          </div>
        </div>
      )}
      {/* -------------------------------------------------------------
          MODAL CREAR BOTÓN PERSONALIZADO (STREAM DECK)
          ------------------------------------------------------------- */}
      {showAddButtonModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 20,
          }}
          onClick={() => {
            setShowAddButtonModal(false);
            setEditingButtonId(null);
          }}
        >
          <div
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--accent-pink)",
              borderRadius: 16,
              maxWidth: 540,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: 24,
              boxShadow: "0 10px 40px var(--accent-pink-glow)",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, display: "flex", alignItems: "center", gap: 8 }}>
                <Dashicon name="controls-play" size={18} color="#EC4899" />
                <span>{editingButtonId ? `✎ Editar Botón: ${newBtnLabel || "Acción"}` : "Personalizar Nuevo Botón de Acción"}</span>
              </h3>
              <button
                className="btn-prompt-icon"
                onClick={() => {
                  setShowAddButtonModal(false);
                  setEditingButtonId(null);
                }}
                style={{ fontSize: "1.2rem" }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: 0 }}>
              {editingButtonId
                ? "Modifica el texto, enlace URL, imagen, iconos, colores o la ubicación de este botón."
                : "Crea un botón personalizado de 1 clic para abrir enlaces URL, cambiar estilo IA, prenda o controles."}
            </p>

            {/* Presets Rápidos de 1 Clic */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-white)" }}>
                Presets Rápidos (1-Clic para configurar icono, color y enlace/acción):
              </label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {[
                  { name: "WhatsApp", icon: "💬", color: "#25D366", type: "url" as const, url: "https://wa.me/573001234567" },
                  { name: "Instagram", icon: "📷", color: "#E1306C", type: "url" as const, url: "https://instagram.com/" },
                  { name: "TikTok", icon: "🎵", color: "#FE2C55", type: "url" as const, url: "https://tiktok.com/@" },
                  { name: "YouTube", icon: "▶️", color: "#FF0000", type: "url" as const, url: "https://youtube.com/" },
                  { name: "Tienda Web", icon: "🛍️", color: "#FF2E93", type: "url" as const, url: "https://mitienda.com" },
                  { name: "Cupón 20%", icon: "🎟️", color: "#F59E0B", type: "alert" as const, payload: "¡Código PROMO20 activado!" },
                  { name: "Neón Cyber", icon: "⚡", color: "#8B5CF6", type: "prompt" as const, payload: "Cyberpunk studio with vibrant neon magenta and cyan lighting" },
                  { name: "Espejo", icon: "🪞", color: "#3B82F6", type: "control" as const, payload: "toggle_mirror" },
                ].map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    className="pill-ctrl-button"
                    style={{ padding: "4px 8px", fontSize: "0.72rem", display: "inline-flex", alignItems: "center", gap: 4 }}
                    onClick={() => {
                      if (!newBtnLabel || newBtnLabel === "Nuevo Botón") setNewBtnLabel(preset.name);
                      setNewBtnIcon(preset.icon);
                      setNewBtnColor(preset.color);
                      setNewBtnType(preset.type);
                      if (preset.url) setNewBtnUrl(preset.url);
                      if (preset.payload) setNewBtnPayload(preset.payload);
                    }}
                  >
                    <span>{preset.icon}</span>
                    <span>{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Nombre del Botón */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-white)" }}>
                Nombre del Botón (Etiqueta):
              </label>
              <input
                type="text"
                className="input-prompt-hero"
                placeholder="Ej. Mi Tienda / WhatsApp / Ciberpunk Neón / Mute"
                value={newBtnLabel}
                onChange={(e) => setNewBtnLabel(e.target.value)}
                maxLength={24}
              />
            </div>

            {/* Enlace URL de Destino (Para URL o redirección externa) */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-white)", display: "flex", alignItems: "center", gap: 6 }}>
                <Dashicon name="admin-links" size={14} color="#60A5FA" />
                <span>Enlace URL de Destino (Opcional o para tipo Enlace URL):</span>
              </label>
              <input
                type="url"
                className="input-prompt-hero"
                placeholder="https://mitienda.com o https://wa.me/573001234567"
                value={newBtnUrl}
                onChange={(e) => {
                  setNewBtnUrl(e.target.value);
                  if (e.target.value && newBtnType !== "url" && !editingButtonId) {
                    setNewBtnType("url");
                  }
                }}
              />
              <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>
                Al hacer clic, el botón abrirá este enlace web en una nueva pestaña (WhatsApp, Instagram, tienda, etc.).
              </span>
            </div>

            {/* Iconos y Color */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-white)" }}>
                  Ícono o Emoji:
                </label>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {["⚡", "🤖", "👗", "🪞", "🔊", "✨", "🔥", "🎭", "🕶️", "💼", "🔗", "💬", "🛍️", "🎟️", "▶️"].map((ico) => (
                    <button
                      key={ico}
                      type="button"
                      className={`pill-ctrl-button ${newBtnIcon === ico ? "active-pink" : ""}`}
                      style={{ padding: "4px 8px", fontSize: "1rem" }}
                      onClick={() => setNewBtnIcon(ico)}
                    >
                      {ico}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-white)" }}>
                  Color del Botón:
                </label>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  {["#FF2E93", "#8B5CF6", "#3B82F6", "#10B981", "#25D366", "#F59E0B", "#EF4444", "#FE2C55"].map((c) => (
                    <div
                      key={c}
                      onClick={() => setNewBtnColor(c)}
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        backgroundColor: c,
                        cursor: "pointer",
                        border: newBtnColor === c ? "2px solid #FFFFFF" : "1px solid transparent",
                        boxShadow: newBtnColor === c ? `0 0 8px ${c}` : "none",
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Imagen PNG / Logo personalizada */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-white)" }}>
                  Imagen / Logo Personalizado (Opcional):
                </label>
                {newBtnImageUrl && (
                  <button
                    type="button"
                    style={{ fontSize: "0.7rem", color: "var(--danger-red)", background: "transparent", border: "none", cursor: "pointer" }}
                    onClick={() => setNewBtnImageUrl("")}
                  >
                    Quitar imagen
                  </button>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <input
                  type="file"
                  ref={btnImageUploadInputRef}
                  style={{ display: "none" }}
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleBtnImageFileSelected(f);
                  }}
                />
                <button
                  type="button"
                  className="pill-ctrl-button"
                  onClick={() => btnImageUploadInputRef.current?.click()}
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  <span>🖼️</span>
                  <span>{newBtnImageUrl ? "Cambiar Imagen" : "Subir Archivo (PNG/SVG)"}</span>
                </button>
                <input
                  type="text"
                  className="input-prompt-hero"
                  placeholder="O pega URL de imagen: https://.../icono.png"
                  value={newBtnImageUrl.startsWith("data:") ? "" : newBtnImageUrl}
                  onChange={(e) => setNewBtnImageUrl(e.target.value)}
                  style={{ flex: 1, minWidth: 200, fontSize: "0.74rem", padding: "6px 10px" }}
                />
              </div>
              {newBtnImageUrl && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, backgroundColor: "rgba(255,255,255,0.06)", padding: "4px 8px", borderRadius: 8 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={newBtnImageUrl}
                    alt="Preview botón"
                    style={{ width: 28, height: 28, objectFit: "contain", borderRadius: 4 }}
                  />
                  <span style={{ fontSize: "0.72rem", color: "var(--accent-pink)" }}>Imagen asignada ✓</span>
                </div>
              )}
            </div>

            {/* Configuración de Tamaño y Ubicación (9 Ubicaciones completas) */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-white)" }}>
                  Tamaño del Botón:
                </label>
                <select
                  className="select-model-dropdown"
                  value={newBtnSize}
                  onChange={(e) => setNewBtnSize(e.target.value as ButtonSize)}
                >
                  <option value="sm">Pequeño (36px)</option>
                  <option value="md">Mediano (48px - Estándar)</option>
                  <option value="lg">Grande (64px)</option>
                  <option value="xl">Extra Grande (84px)</option>
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-white)" }}>
                  Ubicación del Botón:
                </label>
                <select
                  className="select-model-dropdown"
                  value={newBtnPlacement}
                  onChange={(e) => setNewBtnPlacement(e.target.value as ButtonPlacement)}
                >
                  <optgroup label="📋 Botonera Inferior">
                    <option value="deck">📋 En la Botonera Inferior (Stream Deck)</option>
                  </optgroup>
                  <optgroup label="📺 Sobre la Pantalla / Video">
                    <option value="screen-top-left">↖ Flotante: Arriba Izquierda</option>
                    <option value="screen-top-center">⬆ Flotante: Arriba Centro (Banner Superior)</option>
                    <option value="screen-top-right">↗ Flotante: Arriba Derecha</option>
                    <option value="screen-center-left">⬅ Flotante: Centro Izquierda</option>
                    <option value="screen-center-right">➡ Flotante: Centro Derecha</option>
                    <option value="screen-bottom-left">↙ Flotante: Abajo Izquierda</option>
                    <option value="screen-bottom-center">⬇ Flotante: Abajo Centro (Lower-Third)</option>
                    <option value="screen-bottom-right">↘ Flotante: Abajo Derecha</option>
                  </optgroup>
                </select>
              </div>
            </div>

            {/* Tipo de Acción */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-white)" }}>
                Tipo de Acción al Hacer Clic:
              </label>
              <select
                className="select-model-dropdown"
                value={newBtnType}
                onChange={(e) => setNewBtnType(e.target.value as ButtonActionType)}
              >
                <option value="url">🔗 Abrir Enlace URL / Red Social / Tienda Web</option>
                <option value="prompt">🎨 Cambiar Prompt IA en vivo</option>
                <option value="control">🎛️ Control de Cabina (Mute / Espejo / Split / Rec / WhatsApp)</option>
                <option value="alert">🔔 Alerta / Notificación en Pantalla</option>
              </select>
            </div>

            {/* Parámetro de la Acción */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-white)" }}>
                {newBtnType === "url"
                  ? "Configuración de Enlace:"
                  : newBtnType === "prompt"
                  ? "Texto del Prompt a aplicar:"
                  : newBtnType === "alert"
                  ? "Texto de la Alerta en Pantalla:"
                  : "Comando de Control de Cabina:"}
              </label>
              {newBtnType === "url" ? (
                <div style={{ fontSize: "0.74rem", color: "var(--text-secondary)", backgroundColor: "rgba(255,255,255,0.03)", padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)" }}>
                  🔗 Al presionar el botón se abrirá la URL configurada arriba: <strong style={{ color: "var(--accent-pink)" }}>{newBtnUrl || "(Ingresa la URL en el campo superior)"}</strong>
                </div>
              ) : newBtnType === "prompt" ? (
                <textarea
                  className="input-prompt-hero"
                  rows={2}
                  placeholder="Ej: A futuristic warrior in neon armor, cinematic 8k"
                  value={newBtnPayload}
                  onChange={(e) => setNewBtnPayload(e.target.value)}
                />
              ) : newBtnType === "alert" ? (
                <input
                  type="text"
                  className="input-prompt-hero"
                  placeholder="Ej: ¡Nuevo suscriptor VIP en vivo!"
                  value={newBtnPayload}
                  onChange={(e) => setNewBtnPayload(e.target.value)}
                />
              ) : (
                <select
                  className="select-model-dropdown"
                  value={newBtnPayload || "toggle_mirror"}
                  onChange={(e) => setNewBtnPayload(e.target.value)}
                >
                  <option value="toggle_mirror">🪞 Alternar Efecto Espejo (Mirror)</option>
                  <option value="toggle_audio">🔊 Alternar Sonido On / Mute</option>
                  <option value="toggle_split">◫ Alternar Pantalla Dividida</option>
                  <option value="toggle_shop">🛍️ Alternar Banner de Compra (Live Shopping)</option>
                  <option value="toggle_whatsapp">💬 Alternar WhatsApp en Pantalla</option>
                  <option value="toggle_rec">⏺️ Iniciar / Detener Grabación de Video</option>
                </select>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
              <button
                type="button"
                className="pill-ctrl-button"
                onClick={() => {
                  setShowAddButtonModal(false);
                  setEditingButtonId(null);
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="pill-ctrl-button active-pink"
                onClick={handleSaveCustomButton}
              >
                {editingButtonId ? "Guardar Cambios ✓" : "Guardar Botón ✓"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* -------------------------------------------------------------
          MODAL CREAR / PROGRAMAR BANNER O LOGO EN PANTALLA
          ------------------------------------------------------------- */}
      {showAddBannerModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 20,
          }}
          onClick={() => setShowAddBannerModal(false)}
        >
          <div
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid #F59E0B",
              borderRadius: 16,
              maxWidth: 540,
              width: "100%",
              padding: 24,
              boxShadow: "0 10px 40px rgba(245, 158, 11, 0.35)",
              display: "flex",
              flexDirection: "column",
              gap: 14,
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <Dashicon name="tag" size={18} color="#EC4899" />
                  <span>Programar Logo o Banner en Pantalla</span>
                </span>
              </h3>
              <button
                className="btn-prompt-icon"
                onClick={() => setShowAddBannerModal(false)}
                style={{ fontSize: "1.2rem" }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: 0 }}>
              Agrega una marca de agua, logo o banner de patrocinador, elige en qué lugar de la pantalla debe salir y programa su tiempo de aparición en segundos o minutos.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-white)" }}>
                Nombre del Banner o Patrocinador:
              </label>
              <input
                type="text"
                className="input-prompt-hero"
                placeholder="Ej. Mi Marca / Sponsor Oficial / Redes Sociales"
                value={newBannerName}
                onChange={(e) => setNewBannerName(e.target.value)}
                maxLength={30}
              />
            </div>

            {/* Subida o selección de imagen */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-white)" }}>
                Imagen del Logo o Banner (PNG transparente o JPG):
              </label>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <button
                  type="button"
                  className="pill-ctrl-button active-pink"
                  onClick={() => bannerUploadInputRef.current?.click()}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <Dashicon name="upload" size={14} />
                    <span>Subir Archivo desde PC</span>
                  </span>
                </button>
                <input
                  ref={bannerUploadInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        setNewBannerImageUrl(ev.target?.result as string);
                        if (!newBannerName.trim()) {
                          setNewBannerName(file.name.replace(/\.[^/.]+$/, "").slice(0, 24));
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                {newBannerImageUrl && (
                  <span style={{ fontSize: "0.75rem", color: "var(--ok-green)", fontWeight: 800 }}>
                    ✓ Imagen cargada
                  </span>
                )}
              </div>

              {/* O ingresar URL directa de la imagen */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 4 }}>
                <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                  O pega la URL directa de la imagen en línea (PNG, JPG, WebP):
                </span>
                <input
                  type="url"
                  className="input-prompt-hero"
                  placeholder="https://ejemplo.com/banner.png"
                  value={newBannerImageUrl.startsWith("data:") ? "" : newBannerImageUrl}
                  onChange={(e) => setNewBannerImageUrl(e.target.value)}
                />
              </div>

              {newBannerImageUrl && (
                <div
                  style={{
                    width: "100%",
                    height: 70,
                    backgroundColor: "#0A0A10",
                    border: "1px solid var(--border-dark)",
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 6,
                    marginTop: 4,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={newBannerImageUrl} alt="Preview" style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
                </div>
              )}
            </div>

            {/* URL Ejecutable de Destino (Clic sobre el banner) */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                backgroundColor: "rgba(255, 46, 147, 0.08)",
                padding: 10,
                borderRadius: 10,
                border: "1px solid rgba(255, 46, 147, 0.25)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--accent-pink)" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <Dashicon name="networking" size={14} color="#60A5FA" />
                    <span>URL Ejecutable de Destino (Clic en Pantalla):</span>
                  </span>
                </label>
                {newBannerTargetUrl && (
                  <button
                    type="button"
                    style={{
                      fontSize: "0.68rem",
                      color: "var(--danger-red)",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                    }}
                    onClick={() => setNewBannerTargetUrl("")}
                  >
                    Quitar URL
                  </button>
                )}
              </div>
              <input
                type="url"
                className="input-prompt-hero"
                placeholder="https://mi-tienda.com, Discord, Instagram, Twitch o Patrocinador"
                value={newBannerTargetUrl}
                onChange={(e) => setNewBannerTargetUrl(e.target.value)}
              />
              <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 5 }}>
                <Dashicon name="external" size={12} color="#60A5FA" />
                <span>Al hacer clic sobre este banner en la pantalla de video, se ejecutará y abrirá este enlace en una nueva pestaña.</span>
              </span>
            </div>

            {/* Texto Personalizado del Banner y Texto a Copiar al Gusto */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                backgroundColor: "rgba(139, 92, 246, 0.08)",
                padding: 10,
                borderRadius: 10,
                border: "1px solid rgba(139, 92, 246, 0.25)",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--accent-purple)", display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <Dashicon name="edit" size={13} />
                  <span>Texto Personalizado del Banner (Al Gusto):</span>
                </label>
                <input
                  type="text"
                  className="input-prompt-hero"
                  placeholder="Ej. Código: PROMO50 · Síguenos en @viralive.app"
                  value={newBannerText}
                  onChange={(e) => setNewBannerText(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--accent-purple)" }}>
                  Texto a Copiar con 1 Clic (Cupón / Código / Enlace):
                </label>
                <input
                  type="text"
                  className="input-prompt-hero"
                  placeholder="Ej. PROMO50 (este texto se copiará al pulsar 'Copiar')"
                  value={newBannerCopyText}
                  onChange={(e) => setNewBannerCopyText(e.target.value)}
                />
                <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>
                  Si no subes imagen, se generará un banner gráfico automático con este texto.
                </span>
              </div>
            </div>

            {/* Posición en Pantalla */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-white)" }}>
                Lugar en la Pantalla (Ubicación):
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(105px, 1fr))", gap: 6 }}>
                {[
                  { id: "top-left", label: "↖ Arriba Izq" },
                  { id: "top-center", label: "⬆ Banner Superior" },
                  { id: "top-right", label: "↗ Arriba Der" },
                  { id: "bottom-left", label: "↙ Abajo Izq" },
                  { id: "bottom-center", label: "⬇ Banner Inferior" },
                  { id: "bottom-right", label: "↘ Abajo Der" },
                  { id: "center", label: "⏺ Centro" },
                ].map((pos) => (
                  <button
                    key={pos.id}
                    type="button"
                    className={`pill-ctrl-button ${newBannerPosition === pos.id ? "active-pink" : ""}`}
                    style={{ fontSize: "0.72rem", padding: "6px 8px" }}
                    onClick={() => setNewBannerPosition(pos.id as OverlayPosition)}
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tamaño y Animación */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-white)" }}>
                  Tamaño (% del ancho):
                </label>
                <select
                  className="select-model-dropdown"
                  value={newBannerSize}
                  onChange={(e) => setNewBannerSize(Number(e.target.value))}
                >
                  <option value={15}>Pequeño (15% - Logo marca)</option>
                  <option value={22}>Mediano (22% - Estándar)</option>
                  <option value={40}>Grande (40% - Sponsor destacado)</option>
                  <option value={62}>Banner Ancho (62% - Ticker inferior)</option>
                  <option value={85}>Completo (85% - Anuncio pantalla)</option>
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-white)" }}>
                  Animación de Entrada:
                </label>
                <select
                  className="select-model-dropdown"
                  value={newBannerAnim}
                  onChange={(e) => setNewBannerAnim(e.target.value as OverlayAnimation)}
                >
                  <option value="fade">Desvanecido (Fade In/Out)</option>
                  <option value="slide">Deslizar desde el borde (Slide)</option>
                  <option value="pop">Pop / Rebote suave</option>
                </select>
              </div>
            </div>

            {/* Modo de programación (Fijo vs Ciclo de tiempo) */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-white)", display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Dashicon name="clock" size={14} color="#60A5FA" />
                <span>Programación de Tiempo:</span>
              </label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  className={`pill-ctrl-button ${newBannerMode === "permanent" ? "active-pink" : ""}`}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                  onClick={() => setNewBannerMode("permanent")}
                >
                  <Dashicon name="visibility" size={14} />
                  <span>Siempre Fijo en Pantalla</span>
                </button>
                <button
                  type="button"
                  className={`pill-ctrl-button ${newBannerMode === "timed_cycle" ? "active-pink" : ""}`}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                  onClick={() => setNewBannerMode("timed_cycle")}
                >
                  <Dashicon name="clock" size={14} />
                  <span>Programado por Segundos/Minutos</span>
                </button>
              </div>
            </div>

            {newBannerMode === "timed_cycle" && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                  backgroundColor: "rgba(0,0,0,0.3)",
                  padding: 10,
                  borderRadius: 10,
                  border: "1px solid var(--border-dark)",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: "0.72rem", color: "var(--text-white)" }}>
                    Aparecer cada (Intervalo):
                  </label>
                  <select
                    className="select-model-dropdown"
                    value={newBannerIntervalSec}
                    onChange={(e) => setNewBannerIntervalSec(Number(e.target.value))}
                  >
                    <option value={15}>Cada 15 segundos</option>
                    <option value={30}>Cada 30 segundos</option>
                    <option value={60}>Cada 1 minuto (60s)</option>
                    <option value={120}>Cada 2 minutos</option>
                    <option value={300}>Cada 5 minutos</option>
                    <option value={600}>Cada 10 minutos</option>
                  </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: "0.72rem", color: "var(--text-white)" }}>
                    Permanecer en pantalla durante:
                  </label>
                  <select
                    className="select-model-dropdown"
                    value={newBannerDurationSec}
                    onChange={(e) => setNewBannerDurationSec(Number(e.target.value))}
                  >
                    <option value={5}>5 segundos</option>
                    <option value={10}>10 segundos</option>
                    <option value={15}>15 segundos</option>
                    <option value={20}>20 segundos</option>
                    <option value={30}>30 segundos</option>
                  </select>
                </div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
              <button
                type="button"
                className="pill-ctrl-button"
                onClick={() => setShowAddBannerModal(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="pill-ctrl-button active-pink"
                onClick={handleCreateOverlay}
              >
                Guardar y Activar Banner
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          MODAL MULTISTREAMING A 45+ PLATAFORMAS (ESTILO ONESTREAM LIVE)
          ------------------------------------------------------------- */}
      {showMultistreamModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.85)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={() => setShowMultistreamModal(false)}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              color: "#111827",
              borderRadius: 22,
              maxWidth: 480,
              width: "100%",
              padding: 24,
              boxShadow: "0 25px 60px rgba(0,0,0,0.7)",
              maxHeight: "92vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 8, background: "rgba(37, 99, 235, 0.12)", color: "#2563EB" }}>
                    <Dashicon name="networking" size={18} />
                  </span>
                  <h2 style={{ fontSize: "1.2rem", fontWeight: 900, color: "#111827", margin: 0 }}>
                    Go Live on 45+ Platforms
                  </h2>
                </div>
                <p style={{ fontSize: "0.78rem", color: "#6B7280", margin: "4px 0 0 0" }}>
                  Multistream a Facebook, Instagram, TikTok, YouTube y más de 45 redes simultáneamente.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowMultistreamModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.2rem",
                  color: "#9CA3AF",
                  cursor: "pointer",
                  padding: 4,
                }}
              >
                ✕
              </button>
            </div>

            {/* Aviso honesto Modo V1 (Cabina + OBS) vs V2 SaaS */}
            <div
              style={{
                backgroundColor: "#FFFBEB",
                border: "1px solid #FDE68A",
                borderRadius: 12,
                padding: "10px 12px",
                marginBottom: 12,
                fontSize: "0.74rem",
                lineHeight: 1.45,
                color: "#78350F",
              }}
            >
              <strong>Modo V1 Actual: Cabina + OBS Studio.</strong> Hoy transmites en directo conectando esta Cabina a <strong>OBS</strong> (<code>/obs-stage</code> o Cámara Virtual). La retransmisión MultiStream directa en nube sin OBS se ejecutará en la <strong>Versión 2 SaaS</strong>.
            </div>

            {/* Resumen de destinos configurados */}
            <div
              style={{
                backgroundColor: "#F0FDF4",
                border: "1px solid #BBF7D0",
                borderRadius: 12,
                padding: "8px 12px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.78rem", color: "#166534", fontWeight: 700 }}>
                <span className="multistream-dot-live" />
                <span>{activeDestinations.length} Destinos Configurados (Hoja de ruta V2)</span>
              </div>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: "0.82rem", fontWeight: 900, color: "#15803D" }}>
                <Dashicon name="desktop" size={14} /> Cabina + OBS en V1
              </span>
            </div>

            {/* Lista de Destinos (Estilo Imagen 1 de OneStream Live) */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {multistreamDestinations.map((dest) => {
                const isConditionalPlatform = dest.platform === "tiktok" || dest.platform === "instagram";
                const conditionalHint =
                  dest.platform === "tiktok"
                    ? "* Solo cuentas con LIVE Studio / Stream Key aprobada (+1.000 seg.)"
                    : dest.platform === "instagram"
                    ? "* Solo cuentas Profesionales (Creador/Empresa) con Live Producer"
                    : null;
                return (
                <div key={dest.id} style={{ display: "flex", flexDirection: "column" }}>
                  <div className="multistream-card-row">
                    <div className="multistream-dest-left">
                      <div className="multistream-dest-icon">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={dest.iconSvg} alt={dest.name} />
                      </div>
                      <div>
                        <div className="multistream-dest-name">
                          {dest.name}
                          {isConditionalPlatform ? " *" : ""}
                        </div>
                        <div style={{ fontSize: "0.68rem", color: dest.enabled ? "#16A34A" : "#9CA3AF", fontWeight: 600 }}>
                          {dest.enabled ? `● Guardado para OBS / V2 SaaS` : "Inactivo"}
                        </div>
                        {conditionalHint && (
                          <div style={{ fontSize: "0.65rem", color: "#B45309", fontWeight: 600, marginTop: 2 }}>
                            {conditionalHint}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <button
                        type="button"
                        onClick={() => setEditingStreamKeyDestId(editingStreamKeyDestId === dest.id ? null : dest.id)}
                        style={{
                          background: "#F3F4F6",
                          border: "1px solid #E5E7EB",
                          borderRadius: 8,
                          padding: "4px 8px",
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          color: "#4B5563",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                        title="Configurar URL RTMP y Clave de Transmisión"
                      >
                        <Dashicon name="admin-generic" size={12} />
                        <span>Clave</span>
                      </button>

                      {/* Switchy toggle de la plataforma */}
                      <label className="switchy-toggle">
                        <input
                          type="checkbox"
                          checked={dest.enabled}
                          onChange={() => handleToggleMultistream(dest.id)}
                        />
                        <span className="switchy-slider" />
                      </label>
                    </div>
                  </div>

                  {/* Acordeón para configurar Stream Key */}
                  {editingStreamKeyDestId === dest.id && (
                    <div
                      style={{
                        backgroundColor: "#F9FAFB",
                        border: "1px solid #E5E7EB",
                        borderRadius: 12,
                        padding: 12,
                        marginBottom: 10,
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      <div>
                        <label style={{ fontSize: "0.68rem", color: "#6B7280", fontWeight: 700, display: "block" }}>
                          Servidor RTMP:
                        </label>
                        <input
                          type="text"
                          value={dest.rtmpUrl}
                          readOnly
                          style={{
                            width: "100%",
                            padding: "6px 8px",
                            borderRadius: 6,
                            border: "1px solid #D1D5DB",
                            fontSize: "0.75rem",
                            backgroundColor: "#F3F4F6",
                            color: "#374151",
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: "0.68rem", color: "#6B7280", fontWeight: 700, display: "block" }}>
                          Clave de Transmisión (Stream Key):
                        </label>
                        <input
                          type="password"
                          defaultValue={dest.streamKey || ""}
                          placeholder="Pega aquí la clave de transmisión..."
                          onBlur={(e) => handleSaveStreamKey(dest.id, e.target.value)}
                          style={{
                            width: "100%",
                            padding: "6px 8px",
                            borderRadius: 6,
                            border: "1px solid #D1D5DB",
                            fontSize: "0.75rem",
                            backgroundColor: "#FFFFFF",
                            color: "#111827",
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                );
              })}
            </div>

            <div
              style={{
                marginTop: 10,
                padding: "8px 10px",
                borderRadius: 10,
                backgroundColor: "#F9FAFB",
                border: "1px dashed #D1D5DB",
                fontSize: "0.68rem",
                lineHeight: 1.45,
                color: "#4B5563",
              }}
            >
              <strong>* Condicionales de TikTok Live e Instagram Live:</strong> estas dos redes únicamente se habilitan si tu cuenta cumple los requisitos oficiales y te entrega clave RTMP activa (TikTok LIVE Studio / +1.000 seguidores; Instagram Cuenta Profesional / Live Producer).
            </div>

            {/* Ver catálogo completo de 45+ plataformas */}
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #E5E7EB" }}>
              <button
                type="button"
                onClick={() => setShowAll45PlatformsList((prev) => !prev)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 10,
                  backgroundColor: "#F3F4F6",
                  border: "1px solid #E5E7EB",
                  color: "#2563EB",
                  fontWeight: 700,
                  fontSize: "0.78rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <span>{showAll45PlatformsList ? "▲ Ocultar lista completa" : "▼ Ver las 45+ Plataformas Soportadas"}</span>
              </button>

              {showAll45PlatformsList && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 6,
                    maxHeight: 180,
                    overflowY: "auto",
                    padding: "10px 4px",
                    marginTop: 8,
                    fontSize: "0.72rem",
                    color: "#4B5563",
                  }}
                >
                  {ALL_45_MULTISTREAM_PLATFORMS.map((plat, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ color: "#2563EB", fontWeight: 800 }}>✓</span>
                      <span>{plat}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
              <button
                type="button"
                onClick={() => setShowMultistreamModal(false)}
                style={{
                  backgroundColor: "#2563EB",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 10,
                  padding: "8px 20px",
                  fontSize: "0.82rem",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Guardar y Aplicar Destinos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          MODAL CONFIGURAR TARJETA DE PRODUCTO (ESTILO ONESTREAM IMAGEN 2)
          ------------------------------------------------------------- */}
      {showProductModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.85)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={() => setShowProductModal(false)}
        >
          <div
            style={{
              backgroundColor: "#1C1C28",
              color: "#FFFFFF",
              borderRadius: 22,
              maxWidth: 420,
              width: "100%",
              padding: 24,
              boxShadow: "0 25px 60px rgba(0,0,0,0.85)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0, color: "#FFFFFF", display: "flex", alignItems: "center", gap: 8 }}>
                <Dashicon name="cart" size={18} color="#EC4899" />
                <span>Shoppable Product Card</span>
              </h2>
              <button
                type="button"
                onClick={() => setShowProductModal(false)}
                style={{ background: "none", border: "none", color: "#9CA3AF", fontSize: "1.2rem", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            {/* Formulario idéntico a la imagen 2 */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: "0.74rem", color: "#E5E7EB", fontWeight: 600, display: "block", marginBottom: 4 }}>
                  Link
                </label>
                <input
                  type="text"
                  className="input-control"
                  value={newProdLink}
                  onChange={(e) => setNewProdLink(e.target.value)}
                  placeholder="https://onestream.live/shop/product"
                  style={{ width: "100%", backgroundColor: "#2A2A38", border: "1px solid #3F3F54", borderRadius: 8, padding: "8px 10px", color: "#FFFFFF" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "0.74rem", color: "#E5E7EB", fontWeight: 600, display: "block", marginBottom: 4 }}>
                  Product Title
                </label>
                <input
                  type="text"
                  className="input-control"
                  value={newProdTitle}
                  onChange={(e) => setNewProdTitle(e.target.value)}
                  placeholder="Headphones"
                  style={{ width: "100%", backgroundColor: "#2A2A38", border: "1px solid #3F3F54", borderRadius: 8, padding: "8px 10px", color: "#FFFFFF" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "0.74rem", color: "#E5E7EB", fontWeight: 600, display: "block", marginBottom: 4 }}>
                  Subtitle / Características
                </label>
                <input
                  type="text"
                  className="input-control"
                  value={newProdSubtitle}
                  onChange={(e) => setNewProdSubtitle(e.target.value)}
                  placeholder="Active Noise Cancellation"
                  style={{ width: "100%", backgroundColor: "#2A2A38", border: "1px solid #3F3F54", borderRadius: 8, padding: "8px 10px", color: "#FFFFFF" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "0.74rem", color: "#E5E7EB", fontWeight: 600, display: "block", marginBottom: 4 }}>
                  Currency
                </label>
                <select
                  value={newProdCurrency}
                  onChange={(e) => setNewProdCurrency(e.target.value as CurrencyOption)}
                  style={{
                    width: "100%",
                    backgroundColor: "#2A2A38",
                    border: "1px solid #3F3F54",
                    borderRadius: 8,
                    padding: "8px 10px",
                    color: "#FFFFFF",
                    fontSize: "0.8rem",
                    cursor: "pointer",
                  }}
                >
                  <option value="USD">🇺🇸 US Dollar ($)</option>
                  <option value="COP">🇨🇴 Peso Colombiano (COP $)</option>
                  <option value="EUR">🇪🇺 Euro (€)</option>
                  <option value="MXN">🇲🇽 Peso Mexicano ($)</option>
                  <option value="GBP">🇬🇧 Libra Esterlina (£)</option>
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: "0.74rem", color: "#E5E7EB", fontWeight: 600, display: "block", marginBottom: 4 }}>
                    Price
                  </label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 10, top: 8, color: "#9CA3AF" }}>$</span>
                    <input
                      type="text"
                      value={newProdPrice}
                      onChange={(e) => setNewProdPrice(e.target.value)}
                      placeholder="49.99"
                      style={{
                        width: "100%",
                        backgroundColor: "#2A2A38",
                        border: "1px solid #3F3F54",
                        borderRadius: 8,
                        padding: "8px 10px 8px 24px",
                        color: "#FFFFFF",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "0.74rem", color: "#E5E7EB", fontWeight: 600, display: "block", marginBottom: 4 }}>
                    Compare at Price
                  </label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 10, top: 8, color: "#9CA3AF" }}>$</span>
                    <input
                      type="text"
                      value={newProdComparePrice}
                      onChange={(e) => setNewProdComparePrice(e.target.value)}
                      placeholder="59.99"
                      style={{
                        width: "100%",
                        backgroundColor: "#2A2A38",
                        border: "1px solid #3F3F54",
                        borderRadius: 8,
                        padding: "8px 10px 8px 24px",
                        color: "#FFFFFF",
                      }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.74rem", color: "#E5E7EB", fontWeight: 600, display: "block", marginBottom: 4 }}>
                  Images
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    onClick={() => productUploadInputRef.current?.click()}
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 12,
                      border: "2px dashed #4B5563",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      backgroundColor: "#2A2A38",
                      color: "#9CA3AF",
                    }}
                    title="Subir foto del producto"
                  >
                    <Dashicon name="upload" size={20} />
                  </div>

                  {newProdImageUrl && (
                    <div style={{ width: 64, height: 64, borderRadius: 12, overflow: "hidden", border: "2px solid #6366F1" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={newProdImageUrl} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  )}

                  <input
                    ref={productUploadInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        const reader = new FileReader();
                        reader.onload = (ev) => setNewProdImageUrl(ev.target?.result as string);
                        reader.readAsDataURL(f);
                      }
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.74rem", color: "#E5E7EB", fontWeight: 600, display: "block", marginBottom: 4 }}>
                  Posición en Pantalla (3 Espacios Clave):
                </label>
                <select
                  value={newProdPosition}
                  onChange={(e) => setNewProdPosition(e.target.value as ShoppableProductPosition)}
                  style={{
                    width: "100%",
                    backgroundColor: "#2A2A38",
                    border: "1px solid #3F3F54",
                    borderRadius: 8,
                    padding: "8px 10px",
                    color: "#FFFFFF",
                    fontSize: "0.8rem",
                  }}
                >
                  <option value="bottom-center">⬇️ Abajo Centro (Zona recomendada marcada)</option>
                  <option value="bottom-right">⬇️ Abajo Derecha</option>
                  <option value="middle-center">⏺️ En el Medio - Centro</option>
                  <option value="middle-right">⏺️ En el Medio - Derecha</option>
                  <option value="top-center">⬆️ Arriba - Superior Centro</option>
                  <option value="top-right">⬆️ Arriba - Superior Derecha</option>
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  className="pill-ctrl-button"
                  onClick={() => setShowProductModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="pill-ctrl-button active-pink"
                  onClick={handleCreateOrUpdateProduct}
                >
                  Guardar y Mostrar en Pantalla
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          MODAL CATÁLOGO DE PRODUCTOS (LIVE SHOPPING MANAGER)
          ------------------------------------------------------------- */}
      {showProductCatalogModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.85)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={() => setShowProductCatalogModal(false)}
        >
          <div
            style={{
              backgroundColor: "#181824",
              color: "#FFFFFF",
              borderRadius: 22,
              maxWidth: 520,
              width: "100%",
              padding: 24,
              boxShadow: "0 25px 60px rgba(0,0,0,0.85)",
              border: "1px solid rgba(168, 85, 247, 0.4)",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: "1.15rem", fontWeight: 800, margin: 0, color: "#FFFFFF", display: "flex", alignItems: "center", gap: 8 }}>
                  <Dashicon name="cart" size={18} color="#A78BFA" />
                  <span>Live Shopping & Product Cards</span>
                </h2>
                <p style={{ fontSize: "0.75rem", color: "#9CA3AF", margin: "4px 0 0 0" }}>
                  Activa en pantalla productos con precio, foto y código QR escaneable en directo.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowProductCatalogModal(false)}
                style={{ background: "none", border: "none", color: "#9CA3AF", fontSize: "1.2rem", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
              <button
                type="button"
                className="pill-ctrl-button active-pink"
                onClick={() => {
                  setShowProductCatalogModal(false);
                  setShowProductModal(true);
                }}
              >
                + AGREGAR NUEVO PRODUCTO
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {shoppableProducts.map((p) => {
                const isActive = activeProductId === p.id && p.enabled;
                return (
                  <div
                    key={p.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      backgroundColor: isActive ? "rgba(99, 102, 241, 0.18)" : "#222230",
                      border: isActive ? "2px solid #6366F1" : "1px solid #374151",
                      borderRadius: 14,
                      padding: "10px 14px",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 10,
                          overflow: "hidden",
                          border: "1px solid #4B5563",
                          flexShrink: 0,
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.imageUrl} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                      <div>
                        <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#FFFFFF" }}>{p.title}</div>
                        {p.subtitle && <div style={{ fontSize: "0.72rem", color: "#9CA3AF" }}>{p.subtitle}</div>}
                        <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#60A5FA", marginTop: 2 }}>
                          {p.currencySymbol}{p.price.toFixed(2)}
                          {p.compareAtPrice && (
                            <span style={{ fontSize: "0.72rem", color: "#9CA3AF", textDecoration: "line-through", marginLeft: 6 }}>
                              {p.currencySymbol}{p.compareAtPrice.toFixed(2)}
                            </span>
                          )}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                          <span style={{ fontSize: "0.68rem", backgroundColor: "rgba(236, 72, 153, 0.2)", color: "#F472B6", padding: "2px 7px", borderRadius: 5, fontWeight: 700 }}>
                            {p.position?.startsWith("bottom") ? "⬇️ Abajo (Zona Marcada)" : p.position?.startsWith("middle") ? "⏺️ En el Medio" : "⬆️ Arriba"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => {
                          if (isActive) {
                            setActiveProductId(null);
                          } else {
                            setActiveProductId(p.id);
                          }
                        }}
                        style={{
                          backgroundColor: isActive ? "#EF4444" : "#6366F1",
                          color: "#FFFFFF",
                          border: "none",
                          borderRadius: 8,
                          padding: "6px 12px",
                          fontSize: "0.74rem",
                          fontWeight: 800,
                          cursor: "pointer",
                        }}
                      >
                        {isActive ? "Quitar de Pantalla" : "Mostrar en Pantalla"}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleDeleteProduct(p.id, e)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#9CA3AF",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: 6,
                        }}
                        title="Eliminar producto"
                      >
                        <Dashicon name="trash" size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
              <button
                type="button"
                className="pill-ctrl-button"
                onClick={() => setShowProductCatalogModal(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL STREAM CONFIG (FOTO 6: CONFIGURAR TRANSMISIÓN, AUDIENCIA Y RECORDING ESTILO DELULU STREAM) */}
      <StreamConfigModal
        isOpen={showStreamConfigModal}
        onClose={() => setShowStreamConfigModal(false)}
        selectedViewerRange={guestSplitConfig.viewerRange}
        onSelectViewerRange={(range) => setGuestSplitConfig((prev) => ({ ...prev, viewerRange: range }))}
        recordStreamEnabled={isRecording}
        onToggleRecordStream={(enabled) => {
          if (enabled && !isRecording) startRecording();
          else if (!enabled && isRecording) stopRecording();
        }}
        onStartStream={(platform) => {
          if (isConnectedLive) {
            stopRealtime();
          } else {
            void startRealtime();
          }
          setStreamInfo(`🎉 ¡Transmisión en vivo configurada con éxito en ${platform.toUpperCase()}!`);
          setTimeout(() => setStreamInfo(null), 4000);
        }}
        isConnectedLive={isConnectedLive}
        phoneMockupMode={phoneMockupMode}
        onTogglePhoneMockupMode={setPhoneMockupMode}
        cropAspect={effectiveCropMode === "9:16" ? "9:16" : effectiveCropMode === "1:1" ? "1:1" : "16:9"}
        onSelectCropAspect={handleSelectAspectRatio}
        mobileOnly916={isMobileViewport}
        streamerName={streamerName}
        onChangeStreamerName={setStreamerName}
      />

      {/* PIE DE PÁGINA RESPONSIVE CON REDES SOCIALES (icons0.dev) */}
      <footer className="viralive-footer">
        <div className="viralive-footer-inner">
          <div className="viralive-footer-brand">
            <ViraliveLogo variant="full" height={36} showAppDomain />
          </div>

          <div className="viralive-footer-links" aria-label="Accesos rápidos de navegación">
            {MAIN_NAV_ITEMS.filter((i) => ["CAM", "TRY_ON", "DUO", "CLIPS", "TIKTOK_LIVE", "PRO", "SETTINGS"].includes(i.id)).map((item) => (
              <button key={item.id} type="button" className="footer-tab-link" onClick={() => navigateToMainTab(item.id)}>
                <Dashicon name={item.icon} size={14} />
                <span>{item.shortLabel}</span>
              </button>
            ))}
          </div>

          <div className="viralive-footer-socials" aria-label="Canales sociales compatibles">
            {(
              [
                { net: "tiktok", label: "TikTok" },
                { net: "instagram", label: "Instagram" },
                { net: "youtube", label: "YouTube" },
                { net: "facebook", label: "Facebook" },
                { net: "twitch", label: "Twitch" },
                { net: "twitter-x", label: "X" },
                { net: "linkedin", label: "LinkedIn" },
              ] as const
            ).map((s) => (
              <button
                key={s.net}
                type="button"
                className="footer-social-btn"
                aria-label={s.label}
                title={`Ir a ${s.label} en TikTok Live con Marcas`}
                onClick={() => setActiveTab("TIKTOK_LIVE")}
              >
                <SocialIcon network={s.net as SocialNetworkName} size={17} />
              </button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

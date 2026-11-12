"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import {
  DEFAULT_UNIFIED_CHAT_MESSAGES,
  type UnifiedChatMessage,
} from "@/lib/studio-data";
import { PlatformLogo } from "@/components/PlatformLogos";
import { Dashicon } from "@/components/Dashicons";
import {
  getFaceAvatarUrl,
  detectAvatarGender,
  FEMALE_AVATARS,
  MALE_AVATARS,
  SPECIAL_AVATARS,
  type AvatarGender,
} from "@/lib/avatar-helper";

export type MonitorCropMode = "16:9" | "9:16" | "1:1" | "4:3" | "zoom";
export type UnifiedChatSectionMode = "all" | "feed" | "composer";

const PINNED_MAX_CHARS = 180;
const getRecommendedPinChars = (cropMode: MonitorCropMode = "9:16"): number =>
  cropMode === "9:16" ? 110 : 160;

interface UnifiedLiveChatSharedProps {
  onPinCommentToScreen?: (message: UnifiedChatMessage | null) => void;
  pinnedCommentId?: string | null;
  pinnedMessage?: UnifiedChatMessage | null;
  cropMode?: MonitorCropMode;
}

interface UnifiedLiveChatPanelProps extends UnifiedLiveChatSharedProps {
  compactSidebar?: boolean;
  sectionMode?: UnifiedChatSectionMode;
  chatOverlayEnabled?: boolean;
  onToggleChatOverlay?: () => void;
}

type ChatPlatformKey = "tiktok" | "youtube" | "twitch" | "facebook" | "instagram";

const CHAT_PLATFORMS: ChatPlatformKey[] = ["tiktok", "youtube", "twitch", "facebook", "instagram"];

export type PreRecordedComment = {
  id: string;
  author: string;
  message: string;
  platform: "tiktok" | "youtube" | "twitch" | "facebook" | "instagram";
  avatarUrl?: string;
  gender?: AvatarGender;
  isDonation?: boolean;
  donationAmount?: string;
  sent?: boolean;
};

const DEFAULT_PRE_RECORDED: PreRecordedComment[] = [
  {
    id: "pr-1",
    author: "@mariana_fit",
    gender: "female",
    avatarUrl: "/avatars/female_1.svg",
    message: "¿Qué iluminación y cámara usas? ¡La calidad de imagen se ve increíble!",
    platform: "tiktok",
    isDonation: false,
  },
  {
    id: "pr-2",
    author: "CarlosGamer_99",
    gender: "male",
    avatarUrl: "/avatars/male_1.svg",
    message: "¡Ese micrófono se escucha súper limpio! Saludos desde Colombia 🇨🇴",
    platform: "twitch",
    isDonation: true,
    donationAmount: "$5.00",
  },
  {
    id: "pr-3",
    author: "Elena_TechReview",
    gender: "female",
    avatarUrl: "/avatars/female_2.svg",
    message: "¿Dónde puedo comprar los audífonos con cancelación de ruido que mostraste?",
    platform: "youtube",
    isDonation: false,
  },
  {
    id: "pr-4",
    author: "SofiaModaStudio",
    gender: "female",
    avatarUrl: "/avatars/female_3.svg",
    message: "¡El outfit te queda perfecto! ¿El código de descuento sigue activo?",
    platform: "instagram",
    isDonation: true,
    donationAmount: "$10.00",
  },
  {
    id: "pr-5",
    author: "PedroLiveStream",
    gender: "male",
    avatarUrl: "/avatars/male_2.svg",
    message: "Apoyando el directo como siempre crack, ¡sigue así!",
    platform: "facebook",
    isDonation: false,
  },
];

const platformMeta = {
  tiktok: { label: "TikTok", color: "#FE2C55" },
  youtube: { label: "YouTube", color: "#FF0000" },
  twitch: { label: "Twitch", color: "#9146FF" },
  facebook: { label: "Facebook", color: "#1877F2" },
  instagram: { label: "Instagram", color: "#E1306C" },
};

function useUnifiedLiveChatController({
  onPinCommentToScreen,
  pinnedCommentId,
  pinnedMessage = null,
  cropMode = "16:9",
}: UnifiedLiveChatSharedProps) {
  const [messages, setMessages] = useState<UnifiedChatMessage[]>(DEFAULT_UNIFIED_CHAT_MESSAGES);
  const [enabledPlatforms, setEnabledPlatforms] = useState<Record<ChatPlatformKey, boolean>>({
    tiktok: true,
    youtube: true,
    twitch: true,
    facebook: true,
    instagram: true,
  });
  const [onlyDonations, setOnlyDonations] = useState<boolean>(false);

  // Pestaña derecha: Escribir en vivo vs Google Sheets vs Agente IA
  const [composerTab, setComposerTab] = useState<"write_live" | "google_sheets" | "ai_agent">("ai_agent");

  // Agente IA de comentarios
  const [aiCommentsPrompt, setAiCommentsPrompt] = useState<string>(
    "Audiencia interesada en comprar, preguntando por el código de descuento, tiempo de envío y enviando superchats en TikTok y YouTube"
  );
  const [aiCommentCount, setAiCommentCount] = useState<number>(5);
  const [aiGenerating, setAiGenerating] = useState<boolean>(false);
  const [aiAutoResponderActive, setAiAutoResponderActive] = useState<boolean>(true);
  const [aiBotName, setAiBotName] = useState<string>("StreamBot IA 🤖");
  const [aiPersonaPrompt, setAiPersonaPrompt] = useState<string>(
    "Asistente oficial del canal. Amable, entusiasta, responde preguntas de precio y envíos, agradece donaciones y ofrece el cupón LIVE20 con 20% OFF."
  );

  // Formulario de escribir / personalizar fijado manual en vivo
  const [simulatedPlatform, setSimulatedPlatform] = useState<
    "tiktok" | "youtube" | "twitch" | "facebook" | "instagram"
  >("tiktok");
  const [simulatedAuthor, setSimulatedAuthor] = useState<string>("");
  const [simulatedText, setSimulatedText] = useState<string>("");
  const [pinOnPublish, setPinOnPublish] = useState<boolean>(true);
  const [editingPinnedId, setEditingPinnedId] = useState<string | null>(null);
  const [lastPinnedSnapshot, setLastPinnedSnapshot] = useState<UnifiedChatMessage | null>(null);
  const [isSuperChat, setIsSuperChat] = useState<boolean>(false);
  const [donationAmount, setDonationAmount] = useState<string>("$5.00");

  // Selección y personalización de Avatar de Rostro (Hombre / Mujer)
  const [simulatedGender, setSimulatedGender] = useState<AvatarGender>("female");
  const [simulatedAvatarUrl, setSimulatedAvatarUrl] = useState<string>("/avatars/female_1.svg");
  const [hasManuallyChosenAvatar, setHasManuallyChosenAvatar] = useState<boolean>(false);

  // Auto-detección inteligente del género al escribir el usuario (si no fue fijado manualmente)
  useEffect(() => {
    if (!hasManuallyChosenAvatar && simulatedAuthor.trim().length > 0) {
      const detected = detectAvatarGender(simulatedAuthor);
      setSimulatedGender(detected);
      setSimulatedAvatarUrl(getFaceAvatarUrl(simulatedAuthor, detected));
    }
  }, [simulatedAuthor, hasManuallyChosenAvatar]);

  const handleSelectGender = (gender: AvatarGender) => {
    setSimulatedGender(gender);
    setHasManuallyChosenAvatar(true);
    const list = gender === "female" ? FEMALE_AVATARS : MALE_AVATARS;
    setSimulatedAvatarUrl(list[0].url);
  };

  const handleSelectAvatarUrl = (url: string) => {
    setSimulatedAvatarUrl(url);
    setHasManuallyChosenAvatar(true);
  };

  const handleUploadCustomFaceImage = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        setSimulatedAvatarUrl(dataUrl);
        setHasManuallyChosenAvatar(true);
        setToastMessage("📸 ¡Foto de rostro cargada con éxito para el avatar!");
        setTimeout(() => setToastMessage(null), 3000);
      }
    };
    reader.readAsDataURL(file);
  };

  // Sincroniza referencia local del último mensaje fijado para re-fijarlo con 1 switch
  useEffect(() => {
    if (pinnedMessage) {
      setLastPinnedSnapshot(pinnedMessage);
    }
  }, [pinnedMessage]);

  // Google Sheets & Comentarios Pregrabados
  const [preRecordedList, setPreRecordedList] = useState<PreRecordedComment[]>(DEFAULT_PRE_RECORDED);
  const [sheetPasteText, setSheetPasteText] = useState<string>("");
  const [sheetPublicUrl, setSheetPublicUrl] = useState<string>("");
  const [showSheetModal, setShowSheetModal] = useState<boolean>(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);
  const [autoPlayIntervalSec, setAutoPlayIntervalSec] = useState<number>(8);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const togglePlatformSwitch = (plat: ChatPlatformKey) => {
    setEnabledPlatforms((prev) => ({ ...prev, [plat]: !prev[plat] }));
  };

  const resetAllPlatformSwitches = () => {
    setEnabledPlatforms({
      tiktok: true,
      youtube: true,
      twitch: true,
      facebook: true,
      instagram: true,
    });
    setOnlyDonations(false);
  };

  const recommendedPinChars = getRecommendedPinChars(cropMode);
  const manualCharCount = simulatedText.length;
  const remainingHardChars = Math.max(0, PINNED_MAX_CHARS - manualCharCount);
  const estimatedLines = Math.max(1, Math.ceil(Math.max(1, manualCharCount) / (cropMode === "9:16" ? 34 : 58)));

  const buildCustomChatMessage = (customId?: string): UnifiedChatMessage => {
    const cleanAuthor = simulatedAuthor.trim() || `@usuario_${Math.floor(Math.random() * 899 + 100)}`;
    const effectiveGender = simulatedGender || detectAvatarGender(cleanAuthor);
    const effectiveAvatar = simulatedAvatarUrl || getFaceAvatarUrl(cleanAuthor, effectiveGender);
    return {
      id: customId || `chat-${Date.now()}`,
      platform: simulatedPlatform,
      author: cleanAuthor,
      avatarLetter: cleanAuthor.replace("@", "").charAt(0).toUpperCase() || "U",
      avatarColor: platformMeta[simulatedPlatform].color,
      avatarUrl: effectiveAvatar,
      gender: effectiveGender,
      message: simulatedText.trim().slice(0, PINNED_MAX_CHARS),
      timestamp: "Ahora",
      isDonation: isSuperChat,
      donationAmount: isSuperChat ? donationAmount : undefined,
    };
  };

  const handleLoadIntoManualCustomizer = (msg: UnifiedChatMessage) => {
    setSimulatedPlatform(msg.platform);
    setSimulatedAuthor(msg.author);
    setSimulatedText(msg.message.slice(0, PINNED_MAX_CHARS));
    setIsSuperChat(Boolean(msg.isDonation));
    if (msg.donationAmount) setDonationAmount(msg.donationAmount);
    setEditingPinnedId(msg.id);
    setPinOnPublish(true);
    const g = msg.gender || detectAvatarGender(msg.author);
    setSimulatedGender(g);
    setSimulatedAvatarUrl(msg.avatarUrl || getFaceAvatarUrl(msg.author, g));
    setHasManuallyChosenAvatar(true);
    setComposerTab("write_live");
  };

  const handleApplyCustomPinOnly = () => {
    if (!simulatedText.trim()) return;
    const customId = editingPinnedId || `custom-pin-${Date.now()}`;
    const customMsg = buildCustomChatMessage(customId);
    setMessages((prev) => {
      const exists = prev.some((m) => m.id === customId);
      return exists ? prev.map((m) => (m.id === customId ? customMsg : m)) : prev;
    });
    if (onPinCommentToScreen) onPinCommentToScreen(customMsg);
    setEditingPinnedId(customId);
    setLastPinnedSnapshot(customMsg);
    setToastMessage(`📌 Mensaje personalizado fijado en pantalla (${customMsg.message.length}/${PINNED_MAX_CHARS} caracteres).`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleToggleMasterPinSwitch = () => {
    if (pinnedCommentId || pinnedMessage) {
      if (onPinCommentToScreen) onPinCommentToScreen(null);
      setToastMessage("Comentario fijado retirado del monitor.");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    if (simulatedText.trim()) {
      handleApplyCustomPinOnly();
      return;
    }
    const candidate = lastPinnedSnapshot || filteredMessages[0] || messages[0] || null;
    if (candidate && onPinCommentToScreen) {
      onPinCommentToScreen(candidate);
      setToastMessage(`📌 Comentario de ${candidate.author} fijado en pantalla.`);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleTogglePin = (msg: UnifiedChatMessage) => {
    const isPinned = pinnedCommentId === msg.id;
    if (isPinned) {
      if (onPinCommentToScreen) onPinCommentToScreen(null);
      setToastMessage("Comentario retirado del monitor.");
    } else {
      if (onPinCommentToScreen) onPinCommentToScreen(msg);
      setLastPinnedSnapshot(msg);
      setToastMessage(`📌 Comentario de ${msg.author} fijado en pantalla en vivo.`);
    }
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSendMessage = (e?: React.FormEvent, forcePin?: boolean) => {
    if (e) e.preventDefault();
    if (!simulatedText.trim()) return;

    const shouldPin = typeof forcePin === "boolean" ? forcePin : pinOnPublish;
    const newMsg = buildCustomChatMessage();

    setMessages((prev) => [newMsg, ...prev]);
    if (shouldPin) {
      if (onPinCommentToScreen) onPinCommentToScreen(newMsg);
      setLastPinnedSnapshot(newMsg);
      setEditingPinnedId(newMsg.id);
      setToastMessage(`📌 ¡Comentario de ${newMsg.author} publicado y fijado en pantalla!`);
    } else {
      setToastMessage(`💬 Comentario publicado en el feed.`);
    }
    setSimulatedText("");
    setEditingPinnedId(null);
    setTimeout(() => setToastMessage(null), 3000);

    // Auto-respondedor IA en tiempo real al comentario entrante
    if (aiAutoResponderActive) {
      setTimeout(() => {
        handleAiReplyToComment(newMsg);
      }, 1000);
    }
  };
  // =============================================================
  // AGENTE IA: RESPONDER AUTOMÁTICAMENTE EN TIEMPO REAL
  // =============================================================
  const handleAiReplyToComment = (targetMsg: UnifiedChatMessage) => {
    const textLower = targetMsg.message.toLowerCase();
    let reply = "";

    if (targetMsg.isDonation) {
      reply = `¡Muchísimas gracias por tu generoso SuperChat de ${targetMsg.donationAmount} ${targetMsg.author}! ❤️ Eres clave para seguir con este streaming de calidad. ¡Abrazo gigante! 🎉`;
    } else if (textLower.includes("precio") || textLower.includes("cuanto") || textLower.includes("costo") || textLower.includes("vale")) {
      reply = `¡Hola ${targetMsg.author}! El precio especial de la transmisión incluye 20% de descuento usando el código LIVE20 directo en el enlace en pantalla 🛍️🏷️`;
    } else if (textLower.includes("envio") || textLower.includes("entrega") || textLower.includes("donde")) {
      reply = `¡Saludos ${targetMsg.author}! Hacemos envíos garantizados nacionales e internacionales con entrega rápida y guía de rastreo en 24-48h 📦🚚`;
    } else if (textLower.includes("setup") || textLower.includes("pc") || textLower.includes("camara") || textLower.includes("microfono") || textLower.includes("fondo") || textLower.includes("luz")) {
      reply = `¡Gracias ${targetMsg.author}! Transmitimos en resolución 1080p con cámara virtual, iluminación LED de estudio y fondo Chroma Key verde en tiempo real 🎙️✨`;
    } else if (textLower.includes("descuento") || textLower.includes("cupon") || textLower.includes("codigo") || textLower.includes("oferta")) {
      reply = `¡Por supuesto ${targetMsg.author}! Puedes activar el cupón exclusivo LIVE20 escaneando el código QR visible en pantalla para tu descuento inmediato 💳⚡`;
    } else if (textLower.includes("talla") || textLower.includes("outfit") || textLower.includes("ropa") || textLower.includes("color")) {
      reply = `¡Hola ${targetMsg.author}! Tenemos todas las tallas desde S hasta XL disponibles en vivo con probador virtual en directo 👗✨`;
    } else {
      reply = `¡Muchas gracias por acompañarnos en el directo ${targetMsg.author}! Totalmente de acuerdo, gracias por compartir tu buena vibra con todo el chat 🙌🔥`;
    }

    const replyMsg: UnifiedChatMessage = {
      id: `ai-reply-${Date.now()}`,
      platform: targetMsg.platform,
      author: aiBotName,
      avatarLetter: "🤖",
      avatarColor: "#8B5CF6",
      avatarUrl: SPECIAL_AVATARS.bot,
      message: reply,
      timestamp: "Ahora mismo",
      isAiResponse: true,
      replyToAuthor: targetMsg.author,
      replyToText: targetMsg.message,
    };

    setMessages((prev) => [replyMsg, ...prev]);
    setToastMessage(`🤖 ${aiBotName} respondió en tiempo real a ${targetMsg.author}`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // =============================================================
  // AGENTE IA: GENERADOR DE COMENTARIOS A PARTIR DE UN PROMPT
  // =============================================================
  const handleGenerateAiComments = (overridePrompt?: string) => {
    const prompt = (overridePrompt || aiCommentsPrompt).trim();
    if (!prompt) return;

    setAiGenerating(true);

    setTimeout(() => {
      const pLower = prompt.toLowerCase();
      const count = aiCommentCount;
      const generatedList: UnifiedChatMessage[] = [];

      const sampleUsernames = [
        "@carlos_tech99", "@mariana_vlog", "@mateo_streamer", "@valeria.creativa",
        "@lucas_gadgets", "@daniela_style", "@juan_gamer_live", "@sofia_fitness",
        "@alvaro_online", "@camila_trend", "@nico_reviews", "@paula_live"
      ];

      const platforms: ("tiktok" | "youtube" | "twitch" | "facebook" | "instagram")[] = [
        "tiktok", "youtube", "twitch", "facebook", "instagram"
      ];

      const donationOptions = ["$2.00", "$5.00", "$10.00", "$20.00", "$50.00"];

      const questionBank: string[] = [];
      if (pLower.includes("precio") || pLower.includes("descuento") || pLower.includes("compr") || pLower.includes("tienda") || pLower.includes("cupon") || pLower.includes("oferta")) {
        questionBank.push(
          "¿El cupón de descuento LIVE20 aplica para envíos a todo el país?",
          "¿Dónde puedo comprar el producto que estás mostrando en pantalla?",
          "¡Acabo de entrar al directo! ¿Cuál es el precio especial de hoy?",
          "¿Tienen opción de pago con tarjeta o contra entrega?",
          "¿Cuánto tiempo tarda en llegar el envío a mi dirección?",
          "¡Aprovechando el descuento de una vez! ¿Hasta cuándo dura la oferta?"
        );
      }
      if (pLower.includes("gamer") || pLower.includes("setup") || pLower.includes("pc") || pLower.includes("juego") || pLower.includes("pantalla") || pLower.includes("fps")) {
        questionBank.push(
          "¿Qué tarjeta gráfica y procesador tienes en ese setup? Va súper fluido 🔥",
          "¡Ese monitor se ve brutal! ¿Es de 144Hz o 240Hz?",
          "¿El micrófono que usas tiene cancelación de ruido integrada?",
          "¿Cómo configuraste la iluminación neón de fondo? Se ve de locura 🎮",
          "¡Súbele a los FPS crack, directo de 10!"
        );
      }
      if (pLower.includes("ropa") || pLower.includes("moda") || pLower.includes("outfit") || pLower.includes("tryon") || pLower.includes("vestir") || pLower.includes("talla")) {
        questionBank.push(
          "¡Ese outfit te queda espectacular! ¿Tienen disponible en talla M y L?",
          "¿Qué tipo de tela es? ¿Se siente fresca para el clima cálido?",
          "¿Van a sacar más colores de la prenda que mostraste?",
          "Me encantó cómo probaste la ropa en el probador virtual en vivo ✨"
        );
      }
      if (pLower.includes("donac") || pLower.includes("superchat") || pLower.includes("apoy") || pLower.includes("bits") || pLower.includes("regalo") || pLower.includes("donar")) {
        questionBank.push(
          "Enviando un regalito para apoyar la transmisión, ¡el mejor streamer!",
          "¡SuperChat enviado! Saludos a toda la comunidad del chat 👋",
          "Te mando una donación para que sigas trayendo contenido de esta calidad ❤️",
          "¡Tremendo live! Ahí te dejé un SuperChat, sigue rompiéndola 🚀"
        );
      }

      const genericBank = [
        "¡Excelente calidad de transmisión! La resolución y los colores se ven nítidos.",
        "¿Cada cuánto haces directos a esta hora? Ya me suscribí al canal 🔔",
        "¡Saludos desde aquí! Primera vez en tu stream y la producción está genial 🙌",
        "Ese fondo de transmisión está increíble, ¿es pantalla verde o escenario real?",
        "¡Qué buena vibra el chat hoy! Compartiendo el directo con mis amigos 📲",
        "Me quedo hasta el final del stream, contenido de altísimo nivel."
      ];

      const pool = questionBank.length >= 3 ? [...questionBank, ...genericBank] : genericBank;
      const startOffset = Math.floor(Math.random() * platforms.length);

      for (let i = 0; i < count; i++) {
        const username = sampleUsernames[(i + Math.floor(Math.random() * sampleUsernames.length)) % sampleUsernames.length];
        const plat = platforms[(startOffset + i) % platforms.length];
        const text = pool[Math.floor(Math.random() * pool.length)];
        const isDon = Math.random() > 0.65 || pLower.includes("donac") || pLower.includes("superchat");
        const donAmount = isDon ? donationOptions[Math.floor(Math.random() * donationOptions.length)] : undefined;

        const g = detectAvatarGender(username);
        const avUrl = getFaceAvatarUrl(username, g);
        generatedList.push({
          id: `ai-gen-${Date.now()}-${i}`,
          platform: plat,
          author: username,
          avatarLetter: username.replace("@", "").charAt(0).toUpperCase(),
          avatarColor: platformMeta[plat]?.color || "#6366F1",
          avatarUrl: avUrl,
          gender: g,
          message: text,
          timestamp: `Hace ${i * 3 + 2}s`,
          isDonation: isDon,
          donationAmount: donAmount,
        });
      }

      setMessages((prev) => [...generatedList, ...prev]);
      setAiGenerating(false);
      setToastMessage(`✨ ¡${count} comentarios generados con IA según tu prompt!`);
      setTimeout(() => setToastMessage(null), 3500);

      if (aiAutoResponderActive && generatedList.length > 0) {
        setTimeout(() => {
          handleAiReplyToComment(generatedList[0]);
        }, 1200);
      }
    }, 700);
  };


  // Lanzar o fijar/desfijar un comentario pregrabado al feed en vivo
  const handleLaunchPreRecorded = (item: PreRecordedComment, pinToScreen: boolean = false) => {
    const sheetMsgId = `sheet-${item.id}`;
    if (pinToScreen && pinnedCommentId === sheetMsgId) {
      if (onPinCommentToScreen) onPinCommentToScreen(null);
      setToastMessage(`Comentario de ${item.author} desfijado del monitor.`);
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    const g = item.gender || detectAvatarGender(item.author);
    const avUrl = item.avatarUrl || getFaceAvatarUrl(item.author, g);
    const newMsg: UnifiedChatMessage = {
      id: pinToScreen ? sheetMsgId : `chat-${Date.now()}-${item.id}`,
      platform: item.platform,
      author: item.author,
      avatarLetter: item.author.replace("@", "").charAt(0).toUpperCase() || "U",
      avatarColor: platformMeta[item.platform]?.color || "#3B82F6",
      avatarUrl: avUrl,
      gender: g,
      message: item.message,
      timestamp: "Ahora",
      isDonation: item.isDonation,
      donationAmount: item.donationAmount,
    };

    setMessages((prev) => [newMsg, ...prev.filter((m) => m.id !== newMsg.id)]);
    setPreRecordedList((prev) =>
      prev.map((c) => (c.id === item.id ? { ...c, sent: true } : c))
    );

    if (pinToScreen) {
      if (onPinCommentToScreen) onPinCommentToScreen(newMsg);
      setLastPinnedSnapshot(newMsg);
      setToastMessage(`🚀 Comentario de ${item.author} lanzado y fijado en pantalla.`);
    } else {
      setToastMessage(`🚀 Comentario de ${item.author} enviado al feed.`);
    }
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Lanzar todos los pregrabados
  const handleLaunchAllPreRecorded = () => {
    const newItems: UnifiedChatMessage[] = preRecordedList.map((item, idx) => {
      const g = item.gender || detectAvatarGender(item.author);
      const avUrl = item.avatarUrl || getFaceAvatarUrl(item.author, g);
      return {
        id: `chat-bulk-${Date.now()}-${idx}`,
        platform: item.platform,
        author: item.author,
        avatarLetter: item.author.replace("@", "").charAt(0).toUpperCase() || "U",
        avatarColor: platformMeta[item.platform]?.color || "#3B82F6",
        avatarUrl: avUrl,
        gender: g,
        message: item.message,
        timestamp: `Hace ${idx * 15 + 5}s`,
        isDonation: item.isDonation,
        donationAmount: item.donationAmount,
      };
    });

    setMessages((prev) => [...newItems, ...prev]);
    setPreRecordedList((prev) => prev.map((c) => ({ ...c, sent: true })));
    setToastMessage(`🎉 ¡${newItems.length} comentarios de Google Sheets importados al chat en vivo!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Auto-lanzador secuencial
  useEffect(() => {
    if (isAutoPlaying) {
      autoPlayTimerRef.current = setInterval(() => {
        setPreRecordedList((currentList) => {
          const unsent = currentList.filter((c) => !c.sent);
          if (unsent.length === 0) {
            // Reiniciar para seguir ciclando
            const first = currentList[0];
            if (first) {
              const g = first.gender || detectAvatarGender(first.author);
              const avUrl = first.avatarUrl || getFaceAvatarUrl(first.author, g);
              const msg: UnifiedChatMessage = {
                id: `chat-auto-${Date.now()}`,
                platform: first.platform,
                author: first.author,
                avatarLetter: first.author.replace("@", "").charAt(0).toUpperCase() || "U",
                avatarColor: platformMeta[first.platform]?.color || "#3B82F6",
                avatarUrl: avUrl,
                gender: g,
                message: first.message,
                timestamp: "Ahora",
                isDonation: first.isDonation,
                donationAmount: first.donationAmount,
              };
              setMessages((prev) => [msg, ...prev]);
            }
            return currentList.map((c, i) => (i === 0 ? { ...c, sent: true } : { ...c, sent: false }));
          }
          const next = unsent[0];
          const g = next.gender || detectAvatarGender(next.author);
          const avUrl = next.avatarUrl || getFaceAvatarUrl(next.author, g);
          const msg: UnifiedChatMessage = {
            id: `chat-auto-${Date.now()}`,
            platform: next.platform,
            author: next.author,
            avatarLetter: next.author.replace("@", "").charAt(0).toUpperCase() || "U",
            avatarColor: platformMeta[next.platform]?.color || "#3B82F6",
            avatarUrl: avUrl,
            gender: g,
            message: next.message,
            timestamp: "Ahora",
            isDonation: next.isDonation,
            donationAmount: next.donationAmount,
          };
          setMessages((prev) => [msg, ...prev]);
          return currentList.map((c) => (c.id === next.id ? { ...c, sent: true } : c));
        });
      }, autoPlayIntervalSec * 1000);
    } else {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    }
    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    };
  }, [isAutoPlaying, autoPlayIntervalSec]);

  // Parsear texto pegado desde Google Sheets (TSV o CSV)
  const parseGoogleSheetText = (text: string) => {
    const lines = text.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) return;

    const parsed: PreRecordedComment[] = [];
    lines.forEach((line, index) => {
      // Ignorar encabezados comunes si existen
      const lower = line.toLowerCase();
      if (index === 0 && (lower.includes("usuario") || lower.includes("author") || lower.includes("mensaje"))) {
        return;
      }

      // Detectar separador (Tab si se copió de Google Sheet, coma si es CSV, punto y coma)
      const delimiter = line.includes("\t") ? "\t" : line.includes(";") ? ";" : ",";
      const parts = line.split(delimiter).map((p) => p.trim().replace(/^["']|["']$/g, ""));

      if (parts.length >= 2) {
        const author = parts[0] || `@usuario_${index + 1}`;
        const message = parts[1] || "";
        const platformRaw = (parts[2] || "tiktok").toLowerCase();
        const donationRaw = parts[3] || "";

        let validPlatform: "tiktok" | "youtube" | "twitch" | "facebook" | "instagram" = "tiktok";
        if (platformRaw.includes("you") || platformRaw.includes("yt")) validPlatform = "youtube";
        else if (platformRaw.includes("twi") || platformRaw.includes("ttv")) validPlatform = "twitch";
        else if (platformRaw.includes("face") || platformRaw.includes("fb")) validPlatform = "facebook";
        else if (platformRaw.includes("insta") || platformRaw.includes("ig")) validPlatform = "instagram";

        const g = detectAvatarGender(author);
        const avUrl = getFaceAvatarUrl(author, g);
        parsed.push({
          id: `sheet-${Date.now()}-${index}`,
          author,
          message,
          platform: validPlatform,
          gender: g,
          avatarUrl: avUrl,
          isDonation: donationRaw.length > 0 && donationRaw !== "0" && donationRaw !== "-",
          donationAmount: donationRaw || undefined,
          sent: false,
        });
      }
    });

    if (parsed.length > 0) {
      setPreRecordedList((prev) => [...parsed, ...prev]);
      setSheetPasteText("");
      setToastMessage(`✅ ¡${parsed.length} comentarios de Google Sheets importados con éxito!`);
      setTimeout(() => setToastMessage(null), 4000);
    } else {
      setToastMessage("⚠️ No se detectaron filas válidas. Usa el formato: Usuario | Mensaje | Plataforma | Donación");
      setTimeout(() => setToastMessage(null), 5000);
    }
  };

  // Cargar archivo CSV / TSV subido
  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        parseGoogleSheetText(content);
      }
    };
    reader.readAsText(file);
  };

  // Copiar plantilla de ejemplo de Google Sheets
  const handleCopySheetTemplate = () => {
    const template = `Usuario\tMensaje\tPlataforma\tDonacion
@mariana_fit\t¿Qué iluminación y cámara usas? ¡Se ve genial!\ttiktok\t
CarlosGamer_99\t¡Ese setup está increíble hermano!\ttwitch\t$5.00
Elena_Tech\t¿Dónde puedo comprar los audífonos con cancelación?\tyoutube\t
SofiaModaStudio\t¡El outfit te queda perfecto! ¿Tienes código de descuento?\tinstagram\t$10.00
PedroLiveStream\tApoyando la transmisión desde México, ¡sigue así crack!\tfacebook\t`;

    navigator.clipboard.writeText(template);
    setToastMessage("📋 ¡Formato de Google Sheets copiado al portapapeles! Pégalo en tu hoja de cálculo.");
    setTimeout(() => setToastMessage(null), 4000);
  };

  const filteredMessages = messages.filter((m) => {
    if (!enabledPlatforms[m.platform]) return false;
    if (onlyDonations && !m.isDonation) return false;
    return true;
  });

  const allPlatformsEnabled = CHAT_PLATFORMS.every((p) => enabledPlatforms[p]);

  return {
    messages,
    enabledPlatforms,
    onlyDonations,
    setOnlyDonations,
    composerTab,
    setComposerTab,
    aiCommentsPrompt,
    setAiCommentsPrompt,
    aiCommentCount,
    setAiCommentCount,
    aiGenerating,
    aiAutoResponderActive,
    setAiAutoResponderActive,
    aiBotName,
    setAiBotName,
    aiPersonaPrompt,
    setAiPersonaPrompt,
    simulatedPlatform,
    setSimulatedPlatform,
    simulatedAuthor,
    setSimulatedAuthor,
    simulatedText,
    setSimulatedText,
    simulatedGender,
    simulatedAvatarUrl,
    handleSelectGender,
    handleSelectAvatarUrl,
    handleUploadCustomFaceImage,
    pinOnPublish,
    setPinOnPublish,
    editingPinnedId,
    isSuperChat,
    setIsSuperChat,
    donationAmount,
    setDonationAmount,
    preRecordedList,
    sheetPasteText,
    setSheetPasteText,
    sheetPublicUrl,
    setSheetPublicUrl,
    showSheetModal,
    setShowSheetModal,
    isAutoPlaying,
    setIsAutoPlaying,
    autoPlayIntervalSec,
    setAutoPlayIntervalSec,
    toastMessage,
    setToastMessage,
    fileInputRef,
    recommendedPinChars,
    manualCharCount,
    remainingHardChars,
    estimatedLines,
    filteredMessages,
    allPlatformsEnabled,
    togglePlatformSwitch,
    resetAllPlatformSwitches,
    handleLoadIntoManualCustomizer,
    handleApplyCustomPinOnly,
    handleToggleMasterPinSwitch,
    handleTogglePin,
    handleSendMessage,
    handleAiReplyToComment,
    handleGenerateAiComments,
    handleLaunchPreRecorded,
    handleLaunchAllPreRecorded,
    parseGoogleSheetText,
    handleFileUpload,
    handleCopySheetTemplate,
    pinnedCommentId,
    pinnedMessage,
    cropMode,
  };
}

type UnifiedLiveChatController = ReturnType<typeof useUnifiedLiveChatController>;

const UnifiedLiveChatContext = createContext<UnifiedLiveChatController | null>(null);

export function UnifiedLiveChatProvider({
  children,
  ...props
}: UnifiedLiveChatSharedProps & { children: React.ReactNode }) {
  const controller = useUnifiedLiveChatController(props);
  return (
    <UnifiedLiveChatContext.Provider value={controller}>
      {children}
    </UnifiedLiveChatContext.Provider>
  );
}

function StandaloneChatPanelView({
  compactSidebar,
  sectionMode,
  chatOverlayEnabled,
  onToggleChatOverlay,
  ctrl,
}: {
  compactSidebar: boolean;
  sectionMode: UnifiedChatSectionMode;
  chatOverlayEnabled?: boolean;
  onToggleChatOverlay?: () => void;
  ctrl: UnifiedLiveChatController;
}) {
  const {
    messages,
    enabledPlatforms,
    onlyDonations,
    setOnlyDonations,
    composerTab,
    setComposerTab,
    aiCommentsPrompt,
    setAiCommentsPrompt,
    aiCommentCount,
    setAiCommentCount,
    aiGenerating,
    aiAutoResponderActive,
    setAiAutoResponderActive,
    aiBotName,
    setAiBotName,
    aiPersonaPrompt,
    setAiPersonaPrompt,
    simulatedPlatform,
    setSimulatedPlatform,
    simulatedAuthor,
    setSimulatedAuthor,
    simulatedText,
    setSimulatedText,
    simulatedGender,
    simulatedAvatarUrl,
    handleSelectGender,
    handleSelectAvatarUrl,
    handleUploadCustomFaceImage,
    pinOnPublish,
    setPinOnPublish,
    editingPinnedId,
    isSuperChat,
    setIsSuperChat,
    donationAmount,
    setDonationAmount,
    preRecordedList,
    sheetPasteText,
    setSheetPasteText,
    sheetPublicUrl,
    setSheetPublicUrl,
    showSheetModal,
    setShowSheetModal,
    isAutoPlaying,
    setIsAutoPlaying,
    autoPlayIntervalSec,
    setAutoPlayIntervalSec,
    toastMessage,
    setToastMessage,
    fileInputRef,
    recommendedPinChars,
    manualCharCount,
    remainingHardChars,
    estimatedLines,
    filteredMessages,
    allPlatformsEnabled,
    togglePlatformSwitch,
    resetAllPlatformSwitches,
    handleLoadIntoManualCustomizer,
    handleApplyCustomPinOnly,
    handleToggleMasterPinSwitch,
    handleTogglePin,
    handleSendMessage,
    handleAiReplyToComment,
    handleGenerateAiComments,
    handleLaunchPreRecorded,
    handleLaunchAllPreRecorded,
    parseGoogleSheetText,
    handleFileUpload,
    handleCopySheetTemplate,
    pinnedCommentId,
    pinnedMessage,
    cropMode,
  } = ctrl;

  const showFeedSection = sectionMode === "all" || sectionMode === "feed";
  const showComposerSection = sectionMode === "all" || sectionMode === "composer";

  return (
    <div className={`unified-chat-panel-container ${compactSidebar ? "is-compact-sidebar" : ""} section-mode-${sectionMode}`}>
      {/* Toast informativo (solo se renderiza una vez cuando hay split feed/composer) */}
      {toastMessage && sectionMode !== "composer" && (
        <div className="screen-limit-toast" style={{ background: "#2563EB" }}>
          <span>{toastMessage}</span>
          <button type="button" className="toast-close-btn" onClick={() => setToastMessage(null)}>
            ✕
          </button>
        </div>
      )}

      {/* Encabezado cuando el compositor vive en el panel izquierdo de DÚO */}
      {sectionMode === "composer" && (
        <div className="unified-left-composer-header">
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <Dashicon name="admin-tools" size={15} color="#C084FC" />
            <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "#FFFFFF" }}>
              Agente IA · Manual · Sheets (DÚO)
            </span>
          </div>
          <span style={{ fontSize: "0.65rem", color: "#94A3B8" }}>
            Sincronizado con el chat derecho
          </span>
        </div>
      )}

      {showFeedSection && (
        <>
      {/* Cabecera explicativa (completa en Módulos PRO o compacta con Switch maestro en CAM) */}
      {!compactSidebar ? (
        <div className="pro-panel-header-banner">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 38, height: 38, borderRadius: 10, background: "rgba(99, 102, 241, 0.16)", color: "#A5B4FC", flexShrink: 0 }}>
                <Dashicon name="format-chat" size={20} />
              </span>
              <div>
                <h2 style={{ margin: 0, fontSize: "1.15rem", color: "#FFFFFF" }}>
                  Unified Live Chat (Una Sola Ventana)
                </h2>
                <p style={{ margin: "3px 0 0 0", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                  Activa o silencia canales con <strong>interruptores Switch</strong> para moderar TikTok, YouTube, Twitch, Facebook e Instagram desde un solo lugar.
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              className="pill-ctrl-button"
              style={{ padding: "5px 12px", fontSize: "0.75rem", borderColor: "#10B981", color: "#6EE7B7", display: "inline-flex", alignItems: "center", gap: 6 }}
              onClick={handleCopySheetTemplate}
              title="Copiar plantilla de columnas para pegar en Google Sheets"
            >
              <Dashicon name="clipboard" size={14} />
              <span>Plantilla Google Sheets</span>
            </button>
            <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
              Mensajes: <strong>{messages.length}</strong>
            </span>
          </div>
        </div>
      ) : (
        onToggleChatOverlay && (
          <div className="unified-switch-row unified-overlay-master-card">
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              <Dashicon name="format-chat" size={15} color="#EC4899" />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "#FFFFFF" }}>Chat IA en Monitor</div>
                <div style={{ fontSize: "0.66rem", color: "#94A3B8" }}>Mostrar comentarios sobre el video</div>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={!!chatOverlayEnabled}
              aria-label="Mostrar chat en vivo sobre el monitor"
              className={`switchy-toggle compact-switch ${chatOverlayEnabled ? "active-green" : ""}`}
              onClick={onToggleChatOverlay}
            >
              <div className="switchy-thumb" />
            </button>
          </div>
        )
      )}

      {/* Control rápido de mensaje fijado en pantalla + acceso directo a personalizar manual */}
      <div className="unified-pin-master-bar">
        <div className="unified-pin-master-info">
          <Dashicon name="marker" size={14} color={pinnedCommentId ? "#60A5FA" : "#94A3B8"} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#FFFFFF" }}>
                {pinnedCommentId ? "Fijado en pantalla" : "Fijar mensaje en pantalla"}
              </span>
              {pinnedMessage && (
                <span className="unified-pin-char-pill">
                  {pinnedMessage.message.length}/{recommendedPinChars} car.
                </span>
              )}
            </div>
            <div className="unified-pin-master-preview">
              {pinnedMessage
                ? `${pinnedMessage.author}: ${pinnedMessage.message}`
                : "Activa el switch o personaliza un texto manual para fijarlo."}
            </div>
          </div>
        </div>

        <div className="unified-pin-master-actions">
          <button
            type="button"
            className="pill-ctrl-button"
            style={{ padding: "4px 9px", fontSize: "0.68rem", display: "inline-flex", alignItems: "center", gap: 4 }}
            onClick={() => {
              if (pinnedMessage) {
                handleLoadIntoManualCustomizer(pinnedMessage);
              } else {
                setPinOnPublish(true);
                setComposerTab("write_live");
              }
            }}
            title="Editar o escribir mensaje fijado manual con contador de caracteres"
          >
            <Dashicon name="edit" size={12} />
            <span>Personalizar</span>
          </button>

          <button
            type="button"
            role="switch"
            aria-checked={Boolean(pinnedCommentId)}
            aria-label="Fijar o quitar mensaje destacado en pantalla"
            className={`switchy-toggle compact-switch ${pinnedCommentId ? "active-green" : ""}`}
            onClick={handleToggleMasterPinSwitch}
          >
            <div className="switchy-thumb" />
          </button>
        </div>
      </div>

      {/* Barra superior de interruptores Switch por canal y SuperChats */}
      <div className="unified-switches-section">
        <div className="unified-switches-toolbar">
          <span className="unified-switches-heading">
            <Dashicon name="networking" size={14} color="#A5B4FC" />
            <span>Canales activos en el chat</span>
          </span>

          <div className="unified-switches-meta-controls">
            <div className="unified-inline-switch-pill">
              <Dashicon name="money-alt" size={13} color="#FBBF24" />
              <span>Solo SuperChats</span>
              <button
                type="button"
                role="switch"
                aria-checked={onlyDonations}
                aria-label="Filtrar solo SuperChats y donaciones"
                className={`switchy-toggle compact-switch ${onlyDonations ? "active" : ""}`}
                onClick={() => setOnlyDonations((prev) => !prev)}
              >
                <div className="switchy-thumb" />
              </button>
            </div>

            {(!allPlatformsEnabled || onlyDonations) && (
              <button
                type="button"
                className="unified-reset-switches-btn"
                onClick={resetAllPlatformSwitches}
              >
                Activar todas
              </button>
            )}
          </div>
        </div>

        <div className="unified-channel-switches-grid">
          {CHAT_PLATFORMS.map((plat) => {
            const isOn = enabledPlatforms[plat];
            const meta = platformMeta[plat];
            const count = messages.filter((m) => m.platform === plat).length;
            return (
              <div
                key={plat}
                className={`unified-channel-switch-card ${isOn ? "active" : ""}`}
                onClick={() => togglePlatformSwitch(plat)}
              >
                <div className="unified-channel-info">
                  <PlatformLogo platform={plat} size={16} />
                  <span className="unified-channel-name">{meta.label}</span>
                  <span className="unified-channel-count">{count}</span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isOn}
                  aria-label={`Activar comentarios de ${meta.label}`}
                  className={`switchy-toggle compact-switch ${isOn ? "active-green" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePlatformSwitch(plat);
                  }}
                >
                  <div className="switchy-thumb" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
        </>
      )}

      {/* Rejilla: Feed de mensajes y Compositor (Agente IA / Manual / Sheets) */}
      <div className={`unified-chat-grid ${!showFeedSection || !showComposerSection ? "single-pane-mode" : ""}`}>
        {/* LISTA DE MENSAJES UNIFICADOS */}
        {showFeedSection && (
        <div className="unified-chat-feed">
          {filteredMessages.length === 0 ? (
            <div style={{ textAlign: "center", padding: 24, color: "var(--text-secondary)" }}>
              <div style={{ display: "flex", justifyContent: "center", color: "#64748B" }}>
                <Dashicon name="format-chat" size={28} />
              </div>
              <p style={{ margin: "8px 0 10px 0", fontSize: "0.8rem" }}>
                No hay comentarios visibles con los interruptores actuales.
              </p>
              <button
                type="button"
                className="pill-ctrl-button active-pink"
                style={{ padding: "5px 12px", fontSize: "0.74rem" }}
                onClick={resetAllPlatformSwitches}
              >
                Reactivar todos los canales
              </button>
            </div>
          ) : (
            filteredMessages.map((msg) => {
              const isPinned = pinnedCommentId === msg.id;
              const meta = platformMeta[msg.platform];
              return (
                <div
                  key={msg.id}
                  className={`unified-chat-message-row ${isPinned ? "pinned" : ""} ${msg.isDonation ? "donation" : ""} ${msg.isAiResponse ? "ai-response-glow" : ""}`}
                  style={msg.isAiResponse ? { borderColor: "rgba(139, 92, 246, 0.7)", background: "rgba(139, 92, 246, 0.08)" } : undefined}
                >
                  <div
                    className="chat-avatar"
                    style={{
                      backgroundColor: msg.avatarColor || meta.color,
                      overflow: "hidden",
                      border: "1.5px solid rgba(255, 255, 255, 0.28)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={msg.avatarUrl || getFaceAvatarUrl(msg.author, msg.gender)}
                      alt={msg.author}
                      style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.style.display = "none";
                        if (target.parentElement) {
                          target.parentElement.innerText = msg.avatarLetter || msg.author.charAt(0).toUpperCase();
                        }
                      }}
                    />
                  </div>

                  <div className="chat-content-wrap">
                    <div className="chat-meta-header">
                      {/* ETIQUETA CON LOGOTIPO OFICIAL REAL */}
                      <span
                        className="chat-platform-tag"
                        style={{
                          backgroundColor: `${meta.color}1A`,
                          color: "#FFFFFF",
                          borderColor: `${meta.color}66`,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                        }}
                      >
                        <PlatformLogo platform={msg.platform} size={15} />
                        <span>{meta.label}</span>
                      </span>

                      <strong className="chat-author-name">{msg.author}</strong>

                      {msg.isAiResponse && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.62rem", backgroundColor: "rgba(139, 92, 246, 0.3)", color: "#C084FC", border: "1px solid #8B5CF6", borderRadius: 4, padding: "1px 6px", fontWeight: 800 }}>
                          <Dashicon name="admin-users" size={11} /> Streamer IA
                        </span>
                      )}

                      {msg.isDonation && (
                        <span className="donation-amount-badge" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <Dashicon name="money-alt" size={11} /> {msg.donationAmount}
                        </span>
                      )}

                      <span className="chat-time-tag">{msg.timestamp}</span>
                    </div>

                    {msg.replyToAuthor && (
                      <div style={{ fontSize: "0.68rem", color: "#A78BFA", margin: "2px 0 4px 0", fontStyle: "italic" }}>
                        ↳ Respondiendo en directo a {msg.replyToAuthor}:
                      </div>
                    )}

                    <p className="chat-message-body">{msg.message}</p>
                  </div>

                  <div className="chat-actions-col">
                    <div
                      className={`unified-pin-switch-pill ${isPinned ? "pinned" : ""}`}
                      onClick={() => handleTogglePin(msg)}
                      title={isPinned ? "Quitar comentario de la pantalla" : "Fijar este comentario sobre el video en vivo"}
                    >
                      <span>{isPinned ? "Fijado" : "Fijar"}</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={isPinned}
                        aria-label={`Fijar comentario de ${msg.author}`}
                        className={`switchy-toggle compact-switch ${isPinned ? "active-green" : ""}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTogglePin(msg);
                        }}
                      >
                        <div className="switchy-thumb" />
                      </button>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap", justifyContent: "flex-end" }}>
                      <button
                        type="button"
                        className="pill-ctrl-button"
                        style={{ padding: "3px 6px", fontSize: "0.64rem", display: "inline-flex", alignItems: "center", gap: 3 }}
                        onClick={() => handleLoadIntoManualCustomizer(msg)}
                        title="Personalizar texto manualmente antes o después de fijar"
                      >
                        <Dashicon name="edit" size={11} />
                        <span>Editar</span>
                      </button>

                      {!msg.isAiResponse && (
                        <button
                          type="button"
                          className="pill-ctrl-button"
                          style={{ padding: "3px 6px", fontSize: "0.64rem", borderColor: "#8B5CF6", color: "#C084FC", display: "inline-flex", alignItems: "center", gap: 3 }}
                          onClick={() => handleAiReplyToComment(msg)}
                          title="Generar respuesta inmediata con el Agente IA"
                        >
                          <Dashicon name="admin-tools" size={11} />
                          <span>Responder IA</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        )}

        {/* PESTAÑAS DEL COMPOSITOR (AGENTE IA vs MANUAL vs GOOGLE SHEETS) */}
        {showComposerSection && (
        <div className="unified-chat-simulator-box" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Switch segmentado del compositor */}
          <div className="unified-mode-switch-bar" role="tablist" aria-label="Modo de entrada de comentarios">
            <button
              type="button"
              role="tab"
              aria-selected={composerTab === "ai_agent"}
              className={`unified-mode-tab ${composerTab === "ai_agent" ? "active" : ""}`}
              onClick={() => setComposerTab("ai_agent")}
            >
              <Dashicon name="admin-tools" size={13} />
              <span>Agente IA</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={composerTab === "write_live"}
              className={`unified-mode-tab ${composerTab === "write_live" ? "active" : ""}`}
              onClick={() => setComposerTab("write_live")}
            >
              <Dashicon name="edit" size={13} />
              <span>Manual</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={composerTab === "google_sheets"}
              className={`unified-mode-tab ${composerTab === "google_sheets" ? "active" : ""}`}
              onClick={() => setComposerTab("google_sheets")}
            >
              <Dashicon name="chart-bar" size={13} />
              <span>Sheets ({preRecordedList.length})</span>
            </button>
          </div>

          {/* SUBPESTAÑA 0: AGENTE IA (GENERADOR POR PROMPT & AUTO-RESPONDEDOR) */}
          {composerTab === "ai_agent" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* BLOQUE A: GENERADOR DE COMENTARIOS A PARTIR DE UN PROMPT */}
              <div style={{ background: "rgba(20, 20, 32, 0.95)", border: "1px solid rgba(139, 92, 246, 0.4)", borderRadius: 10, padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Dashicon name="lightbulb" size={16} color="#C084FC" />
                    <strong style={{ fontSize: "0.84rem", color: "#FFFFFF" }}>Generar Comentarios con IA</strong>
                  </div>
                  <span style={{ fontSize: "0.65rem", color: "#C084FC", fontWeight: 700, background: "rgba(139, 92, 246, 0.2)", padding: "1px 6px", borderRadius: 4 }}>
                    Multi-Red Social
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: "0.7rem", color: "var(--text-secondary)" }}>
                  Describe el rol y actitud de la audiencia. La IA generará comentarios creíbles con perfiles y plataformas auténticas.
                </p>

                <textarea
                  className="pro-textarea-field"
                  rows={2}
                  placeholder="Ej: Audiencia apasionada preguntando por precios, características técnicas y enviando donaciones de SuperChat"
                  value={aiCommentsPrompt}
                  onChange={(e) => setAiCommentsPrompt(e.target.value)}
                />

                {/* Presets rápidos de prompt */}
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="pill-ctrl-button"
                    style={{ fontSize: "0.64rem", padding: "4px 8px", display: "inline-flex", alignItems: "center", gap: 4 }}
                    onClick={() => setAiCommentsPrompt("Audiencia preguntando por precio, envíos y código de descuento LIVE20")}
                  >
                    <Dashicon name="cart" size={12} /> Compradores & Descuentos
                  </button>
                  <button
                    type="button"
                    className="pill-ctrl-button"
                    style={{ fontSize: "0.64rem", padding: "4px 8px", display: "inline-flex", alignItems: "center", gap: 4 }}
                    onClick={() => setAiCommentsPrompt("Espectadores gamer preguntando por FPS, GPU y periféricos del stream")}
                  >
                    <Dashicon name="performance" size={12} /> Gamers & Setup
                  </button>
                  <button
                    type="button"
                    className="pill-ctrl-button"
                    style={{ fontSize: "0.64rem", padding: "4px 8px", display: "inline-flex", alignItems: "center", gap: 4 }}
                    onClick={() => setAiCommentsPrompt("Fans donando SuperChats de $5 a $50 y felicitando la calidad del directo")}
                  >
                    <Dashicon name="money-alt" size={12} /> Donaciones SuperChat
                  </button>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)", fontWeight: 700 }}>Cantidad:</span>
                    <select
                      className="select-ctrl-pill"
                      style={{ padding: "4px 8px", fontSize: "0.7rem" }}
                      value={aiCommentCount}
                      onChange={(e) => setAiCommentCount(Number(e.target.value))}
                    >
                      <option value={3}>3 Comentarios</option>
                      <option value={5}>5 Comentarios</option>
                      <option value={8}>8 Comentarios</option>
                      <option value={12}>12 Comentarios</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    className="pill-ctrl-button active-pink"
                    style={{ padding: "7px 14px", fontSize: "0.73rem", fontWeight: 800, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5, whiteSpace: "nowrap", flex: "1 1 auto", minHeight: 34, height: "auto", lineHeight: 1.2 }}
                    onClick={() => handleGenerateAiComments()}
                    disabled={aiGenerating}
                  >
                    <Dashicon name={aiGenerating ? "clock" : "lightbulb"} size={14} />
                    <span>{aiGenerating ? "Generando..." : "Generar Comentarios IA"}</span>
                  </button>
                </div>
              </div>

              {/* BLOQUE B: AUTO-RESPONDEDOR IA EN TIEMPO REAL CON SWITCH REAL */}
              <div style={{ background: "rgba(20, 20, 32, 0.95)", border: "1px solid var(--border-dark)", borderRadius: 10, padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                    <Dashicon name="admin-users" size={16} color="#60A5FA" />
                    <strong style={{ fontSize: "0.82rem", color: "#FFFFFF" }}>Auto-Respondedor IA</strong>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={aiAutoResponderActive}
                    aria-label="Activar Auto-Respondedor IA en tiempo real"
                    className={`switchy-toggle ${aiAutoResponderActive ? "active-green" : ""}`}
                    onClick={() => setAiAutoResponderActive((v) => !v)}
                    title="Activar / Desactivar respuestas automáticas inteligentes de la IA a los comentarios entrantes"
                  >
                    <div className="switchy-thumb" />
                  </button>
                </div>

                <p style={{ margin: 0, fontSize: "0.7rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: aiAutoResponderActive ? "#10B981" : "#94A3B8", flexShrink: 0 }} />
                  <span>
                    {aiAutoResponderActive
                      ? "Activo: La IA responde automáticamente a cualquier comentario entrante."
                      : "Inactivo: Solo responde cuando pulses Responder IA."}
                  </span>
                </p>

                <div className="unified-two-col-inputs">
                  <div>
                    <label style={{ fontSize: "0.68rem", color: "var(--text-secondary)", fontWeight: 700 }}>Nombre del Bot:</label>
                    <input
                      type="text"
                      className="pro-input-field"
                      style={{ fontSize: "0.72rem", padding: "4px 8px" }}
                      value={aiBotName}
                      onChange={(e) => setAiBotName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.68rem", color: "var(--text-secondary)", fontWeight: 700 }}>Personalidad IA:</label>
                    <input
                      type="text"
                      className="pro-input-field"
                      style={{ fontSize: "0.72rem", padding: "4px 8px" }}
                      value={aiPersonaPrompt}
                      onChange={(e) => setAiPersonaPrompt(e.target.value)}
                      title="Instrucción de comportamiento para las respuestas"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUBPESTAÑA 1: PERSONALIZAR Y FIJAR MANUAL EN VIVO */}
          {composerTab === "write_live" && (
            <div>
              <div style={{ marginBottom: 10 }}>
                <h3 style={{ margin: 0, fontSize: "0.92rem", color: "#FFFFFF" }}>
                  Personalizar y Fijar Manual
                </h3>
                <p style={{ margin: "2px 0 0 0", fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                  Escribe o edita tu propio mensaje, activa el switch para fijarlo y verifica que quepa completo en pantalla.
                </p>
              </div>

              <form onSubmit={(e) => handleSendMessage(e)} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div>
                  <label style={{ fontSize: "0.72rem", color: "var(--text-secondary)", fontWeight: 700 }}>
                    Red Social / Plataforma:
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(60px, 1fr))", gap: 6, marginTop: 4 }}>
                    {(["tiktok", "youtube", "twitch", "facebook", "instagram"] as const).map((plat) => (
                      <button
                        key={plat}
                        type="button"
                        onClick={() => setSimulatedPlatform(plat)}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 4,
                          padding: "6px 4px",
                          borderRadius: 8,
                          border: simulatedPlatform === plat ? "2px solid #6366F1" : "1px solid #374151",
                          backgroundColor: simulatedPlatform === plat ? "rgba(99, 102, 241, 0.2)" : "#1E1E2A",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <PlatformLogo platform={plat} size={20} />
                        <span style={{ fontSize: "0.65rem", color: "#FFFFFF", fontWeight: 700, textTransform: "capitalize" }}>
                          {plat}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="unified-two-col-inputs">
                  <div>
                    <label style={{ fontSize: "0.72rem", color: "var(--text-secondary)", fontWeight: 700 }}>
                      Usuario / Autor:
                    </label>
                    <input
                      type="text"
                      className="pro-input-field"
                      placeholder="Ej: @mariana_stream"
                      value={simulatedAuthor}
                      onChange={(e) => setSimulatedAuthor(e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "0.72rem", color: "var(--text-secondary)", fontWeight: 700 }}>
                      SuperChat / Donación:
                    </label>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 4 }}>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={isSuperChat}
                        aria-label="Marcar como SuperChat o donación"
                        className={`switchy-toggle compact-switch ${isSuperChat ? "active" : ""}`}
                        onClick={() => setIsSuperChat((v) => !v)}
                      >
                        <div className="switchy-thumb" />
                      </button>
                      {isSuperChat ? (
                        <input
                          type="text"
                          className="pro-input-field"
                          aria-label="Monto de SuperChat"
                          style={{ width: 72, padding: "4px 8px", fontSize: "0.72rem" }}
                          value={donationAmount}
                          onChange={(e) => setDonationAmount(e.target.value)}
                        />
                      ) : (
                        <span style={{ fontSize: "0.7rem", color: "#94A3B8" }}>Desactivado</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* SELECTOR DE GÉNERO Y ROSTRO DEL AVATAR (HOMBRE / MUJER) */}
                <div
                  className="avatar-face-selector-card"
                  style={{
                    background: "rgba(15, 23, 42, 0.65)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: 10,
                    padding: "8px 10px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: "0.74rem", fontWeight: 800, color: "#FFFFFF" }}>
                        Avatar del Comentario (Cara):
                      </span>
                      <span
                        style={{
                          fontSize: "0.68rem",
                          color: simulatedGender === "female" ? "#F472B6" : "#60A5FA",
                          fontWeight: 700,
                        }}
                      >
                        {simulatedGender === "female" ? "👩 Mujer" : "👨 Hombre"}
                      </span>
                    </div>

                    {/* Botones de Selección de Género */}
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <button
                        type="button"
                        className={`pill-ctrl-button ${simulatedGender === "female" ? "active-pink" : ""}`}
                        style={{ padding: "3px 8px", fontSize: "0.68rem", fontWeight: 700 }}
                        onClick={() => handleSelectGender("female")}
                      >
                        👩 Mujer
                      </button>
                      <button
                        type="button"
                        className={`pill-ctrl-button ${simulatedGender === "male" ? "active-cyan" : ""}`}
                        style={{ padding: "3px 8px", fontSize: "0.68rem", fontWeight: 700 }}
                        onClick={() => handleSelectGender("male")}
                      >
                        👨 Hombre
                      </button>
                    </div>
                  </div>

                  {/* Galería de 6 Caras según el género + Botón Subir Foto */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {(simulatedGender === "female" ? FEMALE_AVATARS : MALE_AVATARS).map((av) => (
                        <button
                          key={av.id}
                          type="button"
                          onClick={() => handleSelectAvatarUrl(av.url)}
                          title={av.label}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            padding: 0,
                            border: simulatedAvatarUrl === av.url ? "2px solid #00F0FF" : "1.5px solid rgba(255,255,255,0.2)",
                            boxShadow: simulatedAvatarUrl === av.url ? "0 0 8px #00F0FF" : "none",
                            background: "transparent",
                            cursor: "pointer",
                            overflow: "hidden",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.15s ease",
                          }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={av.url} alt={av.label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </button>
                      ))}
                    </div>

                    {/* Botón para subir foto propia */}
                    <label
                      className="pill-ctrl-button"
                      style={{
                        padding: "4px 8px",
                        fontSize: "0.68rem",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        marginLeft: "auto",
                      }}
                      title="Subir foto o imagen de rostro para este comentario"
                    >
                      <Dashicon name="format-image" size={13} />
                      <span>Subir Foto</span>
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadCustomFaceImage(file);
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                    <label htmlFor="manual-pin-message-input" style={{ fontSize: "0.72rem", color: "var(--text-secondary)", fontWeight: 700 }}>
                      Texto del Mensaje (aparece completo):
                    </label>
                    <span
                      className={`unified-char-counter ${
                        manualCharCount > recommendedPinChars ? "over-recommended" : "within-limit"
                      }`}
                    >
                      {manualCharCount} / {recommendedPinChars} rec. · {PINNED_MAX_CHARS} máx.
                    </span>
                  </div>
                  <textarea
                    id="manual-pin-message-input"
                    className="pro-textarea-field"
                    rows={3}
                    maxLength={PINNED_MAX_CHARS}
                    placeholder="Escribe el mensaje o anuncio manual que deseas ver completo en pantalla..."
                    value={simulatedText}
                    onChange={(e) => setSimulatedText(e.target.value)}
                  />
                  <div className="unified-char-meter-wrap">
                    <div className="unified-char-progress-track">
                      <div
                        className={`unified-char-progress-fill ${
                          manualCharCount > recommendedPinChars ? "amber" : "green"
                        }`}
                        style={{ width: `${Math.min(100, (manualCharCount / PINNED_MAX_CHARS) * 100)}%` }}
                      />
                    </div>
                    <div className="unified-char-guidance">
                      {manualCharCount === 0
                        ? `Hasta ${recommendedPinChars} caracteres recomendados en ${cropMode} (límite ${PINNED_MAX_CHARS}).`
                        : manualCharCount <= recommendedPinChars
                          ? `Se verá completo en ${estimatedLines} ${estimatedLines === 1 ? "línea" : "líneas"} (${remainingHardChars} restantes).`
                          : `Texto largo (${estimatedLines} líneas): se expande automático para mostrarse completo (${remainingHardChars} restantes).`}
                    </div>
                  </div>
                </div>

                {/* Switch principal para fijar directamente al monitor */}
                <div
                  className="unified-switch-row"
                  style={{ cursor: "pointer" }}
                  onClick={() => setPinOnPublish((v) => !v)}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: "0.76rem", fontWeight: 800, color: "#FFFFFF" }}>
                      Fijar en pantalla
                    </div>
                    <div style={{ fontSize: "0.66rem", color: "#94A3B8" }}>
                      Muestra este texto fijo sobre CAM, TRY ON y DÚO
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={pinOnPublish}
                    aria-label="Fijar comentario manual en pantalla"
                    className={`switchy-toggle compact-switch ${pinOnPublish ? "active-green" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setPinOnPublish((v) => !v);
                    }}
                  >
                    <div className="switchy-thumb" />
                  </button>
                </div>

                {simulatedText.trim() && (
                  <div className="unified-pin-live-preview">
                    <div style={{ fontSize: "0.64rem", fontWeight: 800, color: "#93C5FD", marginBottom: 3 }}>
                      Vista previa completa ({manualCharCount} caracteres · {cropMode}):
                    </div>
                    <div style={{ fontSize: "0.74rem", color: "#FFFFFF", lineHeight: 1.35, wordBreak: "break-word" }}>
                      <strong>{simulatedAuthor.trim() || "@usuario"}:</strong> {simulatedText}
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    type="submit"
                    className="btn-apply-cam-primary"
                    style={{ flex: 1, minWidth: 140, padding: "7px 12px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5 }}
                  >
                    <Dashicon name="format-chat" size={14} />
                    <span>{pinOnPublish ? "Publicar y Fijar" : "Publicar al Chat"}</span>
                  </button>
                  <button
                    type="button"
                    className="pill-ctrl-button active-pink"
                    style={{ flex: 1, minWidth: 140, padding: "7px 12px", fontSize: "0.74rem", fontWeight: 800, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5 }}
                    onClick={handleApplyCustomPinOnly}
                    disabled={!simulatedText.trim()}
                    title="Fija o actualiza este mensaje personalizado directamente en pantalla"
                  >
                    <Dashicon name="marker" size={14} />
                    <span>{editingPinnedId ? "Actualizar Fijado" : "Solo Fijar Manual"}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* SUBPESTAÑA 2: COMENTARIOS PREGRABADOS DESDE GOOGLE SHEETS */}
          {composerTab === "google_sheets" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "0.92rem", color: "#FFFFFF", display: "flex", alignItems: "center", gap: 6 }}>
                    <Dashicon name="chart-bar" size={15} color="#10B981" />
                    <span>Comentarios desde Google Sheets</span>
                  </h3>
                  <p style={{ margin: "2px 0 0 0", fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                    Copia tus filas en Google Sheets y pégalas aquí, o sube tu archivo CSV.
                  </p>
                </div>

                <button
                  type="button"
                  className="pill-ctrl-button"
                  style={{ padding: "4px 8px", fontSize: "0.68rem" }}
                  onClick={() => setShowSheetModal((prev) => !prev)}
                >
                  {showSheetModal ? "▲ Ocultar Pegado" : "▼ Pegar / Subir"}
                </button>
              </div>

              {/* Panel colapsable de importación / pegado */}
              {showSheetModal && (
                <div style={{ background: "#151522", border: "1px solid #2E2E3E", borderRadius: 10, padding: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                  <label style={{ fontSize: "0.7rem", color: "var(--text-secondary)", fontWeight: 700 }}>
                    Pega celdas copiadas de Google Sheets (Usuario, Mensaje, Plataforma, Donación):
                  </label>
                  <textarea
                    className="pro-textarea-field"
                    rows={3}
                    placeholder="Usuario	Mensaje	Plataforma	Donacion"
                    value={sheetPasteText}
                    onChange={(e) => setSheetPasteText(e.target.value)}
                  />

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        type="button"
                        className="pill-ctrl-button active-pink"
                        style={{ padding: "4px 10px", fontSize: "0.7rem", display: "inline-flex", alignItems: "center", gap: 5 }}
                        onClick={() => parseGoogleSheetText(sheetPasteText)}
                      >
                        <Dashicon name="download" size={13} />
                        <span>Procesar Pegado</span>
                      </button>

                      <label className="pill-ctrl-button" style={{ padding: "4px 10px", fontSize: "0.7rem", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5 }}>
                        <Dashicon name="upload" size={13} />
                        <span>Subir Archivo CSV</span>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".csv,.tsv,.txt"
                          style={{ display: "none" }}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleFileUpload(f);
                          }}
                        />
                      </label>
                    </div>

                    <button
                      type="button"
                      className="pill-ctrl-button"
                      style={{ padding: "4px 8px", fontSize: "0.68rem", display: "inline-flex", alignItems: "center", gap: 4 }}
                      onClick={handleCopySheetTemplate}
                    >
                      <Dashicon name="clipboard" size={13} />
                      <span>Copiar Formato</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Barra de control con Switch del Auto-Lanzador */}
              <div className="unified-sheets-control-bar">
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isAutoPlaying}
                      aria-label="Activar auto-lanzador de comentarios"
                      className={`switchy-toggle compact-switch ${isAutoPlaying ? "active-green" : ""}`}
                      onClick={() => setIsAutoPlaying((prev) => !prev)}
                      title="Lanza comentarios automáticamente en el tiempo configurado"
                    >
                      <div className="switchy-thumb" />
                    </button>
                    <span style={{ fontSize: "0.72rem", fontWeight: 700, color: isAutoPlaying ? "#6EE7B7" : "#CBD5E1" }}>
                      {isAutoPlaying ? "Auto-lanzando" : "Auto-lanzador"}
                    </span>
                  </div>

                  <select
                    className="select-ctrl-pill"
                    style={{ padding: "2px 6px", fontSize: "0.68rem" }}
                    value={autoPlayIntervalSec}
                    onChange={(e) => setAutoPlayIntervalSec(Number(e.target.value))}
                    title="Frecuencia de lanzamiento automático"
                  >
                    <option value={5}>Cada 5s</option>
                    <option value={8}>Cada 8s</option>
                    <option value={15}>Cada 15s</option>
                    <option value={30}>Cada 30s</option>
                  </select>
                </div>

                <button
                  type="button"
                  className="pill-ctrl-button"
                  style={{ padding: "4px 8px", fontSize: "0.7rem", color: "#60A5FA", display: "inline-flex", alignItems: "center", gap: 4 }}
                  onClick={handleLaunchAllPreRecorded}
                  title="Importa todos los comentarios de una sola vez"
                >
                  <Dashicon name="controls-play" size={13} />
                  <span>Enviar Todos ({preRecordedList.length})</span>
                </button>
              </div>

              {/* Lista de comentarios pregrabados (sin scroll atrapado) */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {preRecordedList.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                      background: item.sent ? "#171724" : "#1F1F30",
                      border: item.sent ? "1px solid #2E2E3E" : "1px solid #3F3F56",
                      borderRadius: 8,
                      padding: "6px 10px",
                      opacity: item.sent ? 0.75 : 1,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          overflow: "hidden",
                          flexShrink: 0,
                          border: "1px solid rgba(255,255,255,0.3)",
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.avatarUrl || getFaceAvatarUrl(item.author, item.gender)}
                          alt={item.author}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      </div>
                      <PlatformLogo platform={item.platform} size={18} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: "0.74rem", fontWeight: 800, color: "#FFFFFF" }}>{item.author}</span>
                          <span
                            style={{
                              fontSize: "0.6rem",
                              padding: "1px 4px",
                              borderRadius: 4,
                              background: item.gender === "female" ? "rgba(236,72,153,0.2)" : "rgba(59,130,246,0.2)",
                              color: item.gender === "female" ? "#F472B6" : "#60A5FA",
                            }}
                          >
                            {item.gender === "female" ? "👩" : "👨"}
                          </span>
                          {item.isDonation && (
                            <span className="donation-amount-badge" style={{ fontSize: "0.65rem", padding: "1px 4px", display: "inline-flex", alignItems: "center", gap: 3 }}>
                              <Dashicon name="money-alt" size={10} /> {item.donationAmount}
                            </span>
                          )}
                          {item.sent && (
                            <span style={{ fontSize: "0.62rem", color: "var(--ok-green)", fontWeight: 700 }}>
                              ✓ Enviado
                            </span>
                          )}
                        </div>
                        <p style={{ margin: 0, fontSize: "0.7rem", color: "#9CA3AF", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {item.message}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                      <button
                        type="button"
                        className="pill-ctrl-button"
                        style={{ padding: "2px 6px", fontSize: "0.65rem", display: "inline-flex", alignItems: "center", gap: 4 }}
                        onClick={() => handleLaunchPreRecorded(item, false)}
                        title="Enviar este comentario al chat"
                      >
                        <Dashicon name="controls-play" size={11} />
                        <span>Enviar</span>
                      </button>
                      <div
                        className={`unified-pin-switch-pill ${pinnedCommentId === `sheet-${item.id}` ? "pinned" : ""}`}
                        onClick={() => handleLaunchPreRecorded(item, true)}
                        title="Fijar o quitar de la pantalla del monitor"
                      >
                        <span>{pinnedCommentId === `sheet-${item.id}` ? "Fijado" : "Fijar"}</span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={pinnedCommentId === `sheet-${item.id}`}
                          aria-label={`Fijar comentario pregrabado de ${item.author}`}
                          className={`switchy-toggle compact-switch ${pinnedCommentId === `sheet-${item.id}` ? "active-green" : ""}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLaunchPreRecorded(item, true);
                          }}
                        >
                          <div className="switchy-thumb" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
}

export function UnifiedLiveChatPanel({
  compactSidebar = false,
  sectionMode = "all",
  chatOverlayEnabled,
  onToggleChatOverlay,
  ...sharedProps
}: UnifiedLiveChatPanelProps) {
  const parentCtrl = useContext(UnifiedLiveChatContext);
  if (parentCtrl) {
    return (
      <StandaloneChatPanelView
        compactSidebar={compactSidebar}
        sectionMode={sectionMode}
        chatOverlayEnabled={chatOverlayEnabled}
        onToggleChatOverlay={onToggleChatOverlay}
        ctrl={parentCtrl}
      />
    );
  }
  return (
    <UnifiedLiveChatPanelStandalone
      compactSidebar={compactSidebar}
      sectionMode={sectionMode}
      chatOverlayEnabled={chatOverlayEnabled}
      onToggleChatOverlay={onToggleChatOverlay}
      {...sharedProps}
    />
  );
}

function UnifiedLiveChatPanelStandalone({
  compactSidebar = false,
  sectionMode = "all",
  chatOverlayEnabled,
  onToggleChatOverlay,
  ...sharedProps
}: UnifiedLiveChatPanelProps) {
  const localCtrl = useUnifiedLiveChatController(sharedProps);
  return (
    <StandaloneChatPanelView
      compactSidebar={compactSidebar}
      sectionMode={sectionMode}
      chatOverlayEnabled={chatOverlayEnabled}
      onToggleChatOverlay={onToggleChatOverlay}
      ctrl={localCtrl}
    />
  );
}

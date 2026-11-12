import type { RealTimeModels } from "@decartai/sdk";

export type SpikeRealtimeModelId = Extract<
  RealTimeModels,
  "lucy-restyle-2" | "lucy-2.6" | "lucy-2.5" | "lucy-vton-3.6" | "lucy-vton-3.5" | "lucy-2.1"
>;

export type SpikeModelInfo = {
  id: SpikeRealtimeModelId;
  label: string;
  description: string;
  decartCreditsPerSec: number;
  fastCreditsPerSec: number | null;
  resolutionLabel: string;
  supportsFast: boolean;
  supportsImageRef: boolean;
};

export const SPIKE_MODELS: SpikeModelInfo[] = [
  {
    id: "lucy-restyle-2",
    label: "Estilo visual (lucy-restyle-2)",
    description:
      "Cambia el estilo artistico de toda la escena (anime, cyberpunk, plastilina). Tarifa base economica.",
    decartCreditsPerSec: 1,
    fastCreditsPerSec: null,
    resolutionLabel: "1280x704 · 25 fps",
    supportsFast: false,
    supportsImageRef: true,
  },
  {
    id: "lucy-2.6",
    label: "Personajes y edicion (lucy-2.6)",
    description: "Cambia personaje, ropa, fondo u objetos en directo con texto o imagen.",
    decartCreditsPerSec: 2,
    fastCreditsPerSec: 4,
    resolutionLabel: "1280x720 · 30 fps",
    supportsFast: true,
    supportsImageRef: true,
  },
  {
    id: "lucy-2.5",
    label: "Personajes y edicion (lucy-2.5)",
    description: "Modelo estable para transformacion de personajes y escena en tiempo real.",
    decartCreditsPerSec: 2,
    fastCreditsPerSec: 4,
    resolutionLabel: "1280x720 · 30 fps",
    supportsFast: true,
    supportsImageRef: true,
  },
  {
    id: "lucy-vton-3.6",
    label: "Probador virtual (lucy-vton-3.6)",
    description: "Prueba prendas de ropa sobre el cuerpo en vivo (ideal para ventas en directo).",
    decartCreditsPerSec: 2,
    fastCreditsPerSec: 4,
    resolutionLabel: "1280x720 · 30 fps",
    supportsFast: true,
    supportsImageRef: true,
  },
];

export const ALLOWED_REALTIME_MODEL_IDS: SpikeRealtimeModelId[] = [
  "lucy-restyle-2",
  "lucy-2.6",
  "lucy-2.5",
  "lucy-vton-3.6",
  "lucy-vton-3.5",
  "lucy-2.1",
];

export function isAllowedRealtimeModel(id: string): id is SpikeRealtimeModelId {
  return (ALLOWED_REALTIME_MODEL_IDS as string[]).includes(id);
}

export const DEFAULT_SAFE_PROMPT = "Restyle to animated movie.";

export const REFERENCE_SWAP_PROMPT =
  "Substitute the character in the video with the person in the reference image, matching their exact facial features, hair style, and clothing while preserving pose and room background.";

export type PromptPreset = {
  id: string;
  category: "Estilo" | "Personaje" | "Fondo" | "VFX" | "Edicion";
  label: string;
  prompt: string;
  suggestedModel: SpikeRealtimeModelId;
  requiresReferenceImage?: boolean;
};

export const OFFICIAL_PROMPT_PRESETS: PromptPreset[] = [
  {
    id: "animated-2d",
    category: "Estilo",
    label: "Animacion 2D",
    prompt: DEFAULT_SAFE_PROMPT,
    suggestedModel: "lucy-restyle-2",
  },
  {
    id: "cyberpunk",
    category: "Estilo",
    label: "Cyberpunk Neon",
    prompt: "Restyle to Cyberpunk.",
    suggestedModel: "lucy-restyle-2",
  },
  {
    id: "claymation",
    category: "Estilo",
    label: "Plastilina 3D",
    prompt: "Restyle to 3D clay stop-motion animation.",
    suggestedModel: "lucy-restyle-2",
  },
  {
    id: "pixel",
    category: "Estilo",
    label: "Pixel Art",
    prompt: "Restyle to pixel-art.",
    suggestedModel: "lucy-restyle-2",
  },
  {
    id: "robot",
    category: "Personaje",
    label: "Robot Futurista",
    prompt: "Substitute the character in the video with a futuristic robot.",
    suggestedModel: "lucy-2.6",
  },
  {
    id: "anime-char",
    category: "Personaje",
    label: "Avatar Anime",
    prompt: "Substitute the character in the video with an anime version of them.",
    suggestedModel: "lucy-2.6",
  },
  {
    id: "tokyo",
    category: "Fondo",
    label: "Tokio Nocturno",
    prompt: "Replace my background with a neon-lit Tokyo street at night.",
    suggestedModel: "lucy-2.6",
  },
  {
    id: "spaceship",
    category: "Fondo",
    label: "Nave Espacial",
    prompt: "Replace my background with the bridge of a spaceship overlooking Earth.",
    suggestedModel: "lucy-2.6",
  },
  {
    id: "underwater",
    category: "VFX",
    label: "Bajo el Agua",
    prompt: "Make the whole scene look underwater.",
    suggestedModel: "lucy-2.6",
  },
  {
    id: "golden-hour",
    category: "VFX",
    label: "Luz Dorada",
    prompt: "Cast soft warm golden-hour sunlight evenly over the person's face and upper body.",
    suggestedModel: "lucy-2.6",
  },
  {
    id: "no-glasses",
    category: "Edicion",
    label: "Quitar Gafas",
    prompt: "Remove the person's glasses.",
    suggestedModel: "lucy-2.6",
  },
  {
    id: "ref-swap",
    category: "Personaje",
    label: "Persona segun Foto",
    prompt: REFERENCE_SWAP_PROMPT,
    suggestedModel: "lucy-2.6",
    requiresReferenceImage: true,
  },
  {
    id: "ref-clothes",
    category: "Personaje",
    label: "Ropa segun Foto (VTON)",
    prompt: "Replace the person's clothes with the outfit from the reference image.",
    suggestedModel: "lucy-vton-3.6",
    requiresReferenceImage: true,
  },
];

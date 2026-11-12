import type { VideoModels } from "@decartai/sdk";

export type QueueModelId = Extract<
  VideoModels,
  "lucy-restyle-2" | "lucy-2.6" | "lucy-2.5" | "lucy-vton-3.6"
>;

export type QueueModelInfo = {
  id: QueueModelId;
  label: string;
  decartCreditsPerSec: number;
  notes: string;
};

export const QUEUE_VIDEO_MODELS: QueueModelInfo[] = [
  {
    id: "lucy-restyle-2",
    label: "Estilo visual (lucy-restyle-2 · 1 cr/s)",
    decartCreditsPerSec: 1,
    notes: "Transforma todo el video en estilo artistico (hasta 30 min en cola).",
  },
  {
    id: "lucy-2.6",
    label: "Personajes y edicion (lucy-2.6 · 4 cr/s)",
    decartCreditsPerSec: 4,
    notes: "Cambia personaje, ropa o fondo en videos pregrabados 720p.",
  },
  {
    id: "lucy-2.5",
    label: "Personajes estable (lucy-2.5 · 4 cr/s)",
    decartCreditsPerSec: 4,
    notes: "Edicion de video por texto o imagen de referencia a 720p.",
  },
  {
    id: "lucy-vton-3.6",
    label: "Probador Virtual (lucy-vton-3.6 · 4 cr/s)",
    decartCreditsPerSec: 4,
    notes: "Aplica prendas de referencia sobre la persona del video.",
  },
];

export type QueueJobRecord = {
  jobId: string;
  modelId: QueueModelId;
  prompt: string;
  fileName: string;
  status: "pending" | "processing" | "completed" | "failed";
  createdAt: string;
  error?: string;
};

export type SavedSkinPreset = {
  id: string;
  name: string;
  category: "Estilo" | "Personaje" | "Fondo" | "VFX" | "Try-On";
  prompt: string;
  modelId: "lucy-restyle-2" | "lucy-2.6" | "lucy-2.5" | "lucy-vton-3.6";
  refImageDataUrl?: string;
  createdAt: string;
};

export type TryOnTemplate = {
  id: string;
  slot: "Superior" | "Conjunto" | "Accesorio";
  label: string;
  prompt: string;
  requiresGarmentImage: boolean;
};

export const TRYON_TEMPLATES: TryOnTemplate[] = [
  {
    id: "vton-top-ref",
    slot: "Superior",
    label: "Prenda superior segun foto",
    prompt:
      "Substitute the current top with the exact garment shown in the reference image, keeping natural fabric folds, lighting, and movement.",
    requiresGarmentImage: true,
  },
  {
    id: "vton-full-ref",
    slot: "Conjunto",
    label: "Outfit completo segun foto",
    prompt:
      "Replace the person's clothes with the exact outfit from the reference image, preserving natural fit, body proportions, and room background.",
    requiresGarmentImage: true,
  },
  {
    id: "vton-bomber",
    slot: "Superior",
    label: "Chaqueta bomber negra cuero",
    prompt:
      "Substitute the current top with a fitted black leather bomber jacket with silver zipper and ribbed cuffs, keeping natural lighting.",
    requiresGarmentImage: false,
  },
  {
    id: "vton-hoodie",
    slot: "Superior",
    label: "Saco hoodie rojo urbano",
    prompt:
      "Substitute the current top with a bright crimson heavyweight cotton hoodie with an oversized relaxed fit and natural fabric texture.",
    requiresGarmentImage: false,
  },
  {
    id: "vton-blazer",
    slot: "Conjunto",
    label: "Blazer formal azul marino",
    prompt:
      "Substitute the current top with a tailored navy blue wool blazer over a crisp white shirt, keeping natural folds and studio lighting.",
    requiresGarmentImage: false,
  },
  {
    id: "vton-cap",
    slot: "Accesorio",
    label: "Gorra negra deportiva",
    prompt:
      "Add a matte black structured baseball cap naturally onto the person's head, preserving hair and face proportions.",
    requiresGarmentImage: false,
  },
  {
    id: "vton-sunglasses",
    slot: "Accesorio",
    label: "Gafas de sol oscuras",
    prompt:
      "Add sleek classic black acetate sunglasses onto the person's face with realistic reflections matching the room lighting.",
    requiresGarmentImage: false,
  },
];

export const GARMENT_EXTRACT_PROMPT =
  "Extract only the clothing garment from this image and place it centered flat on a clean pure white studio background, removing the person, skin, hangers, and original background.";

export type UsageLedgerEntry = {
  id: string;
  createdAt: string;
  kind: "realtime" | "image" | "queue";
  modelId: string;
  detail: string;
  decartCredits: number;
  usdCost: number;
  copCost: number;
};

export type ColombiaPackageEconomics = {
  priceCop: number;
  wompiFeeCop: number;
  taxRetentionCop: number;
  netReceivedCop: number;
  decartCreditsIncluded: number;
  apiCostUsd: number;
  apiCostCop: number;
  netProfitCop: number;
  marginPercent: number;
  minutesEco: number;
  minutesPro: number;
};

const BLOCKED_IP_TERMS = [
  // Estudios y marcas registradas
  "studio ghibli",
  "ghibli",
  "disney",
  "pixar",
  "marvel",
  "dc comics",
  "batman",
  "spider-man",
  "spiderman",
  "pokemon",
  "pikachu",
  "nintendo",
  "mario bros",
  "star wars",
  "harry potter",
  "simpsons",
  "spongebob",
  "naruto",
  "dragon ball",
  "barbie",
  // Figuras públicas y celebridades
  "mbappé",
  "mbappe",
  "messi",
  "ronaldo",
  "cristiano ronaldo",
  "johnny depp",
  "taylor swift",
  "elon musk",
  "donald trump",
  "trump",
  "biden",
  // Contenido sensible / NSFW
  "bikini",
  "nude",
  "naked",
  "topless",
  "underwear",
  "lingerie",
  "nsfw",
  "porn",
  "erotic",
  "desnudo",
  "desnuda",
];

export function moderatePromptForDecart(prompt: string): { ok: boolean; reason?: string } {
  const clean = prompt.trim();
  if (!clean) {
    return { ok: false, reason: "Escribe una instrucción antes de enviar a Decart." };
  }
  if (clean.length > 750) {
    return {
      ok: false,
      reason: `El prompt tiene ${clean.length} caracteres y el límite seguro es 750.`,
    };
  }
  const lower = clean.toLowerCase();
  const matched = BLOCKED_IP_TERMS.find((term) => lower.includes(term));
  if (matched) {
    if (["mbappé", "mbappe", "messi", "ronaldo", "cristiano ronaldo", "johnny depp", "taylor swift", "elon musk", "trump", "biden"].includes(matched)) {
      return {
        ok: false,
        reason: `La política de Decart prohíbe generar o suplantar celebridades reales ("${matched}"). Usa una descripción general de personaje ficticio (ej. "un atleta profesional de fútbol").`,
      };
    }
    if (["bikini", "nude", "naked", "topless", "underwear", "lingerie", "nsfw", "porn", "erotic", "desnudo", "desnuda"].includes(matched)) {
      return {
        ok: false,
        reason: `La política de Decart es estrictamente Safe-for-Work y rechaza términos como "${matched}". Describe prendas convencionales o casuales.`,
      };
    }
    return {
      ok: false,
      reason: `La palabra "${matched}" suele ser rechazada por Decart por derechos de autor. Usa una descripción genérica (ej. "hand-drawn 2D animated movie").`,
    };
  }
  return { ok: true };
}

export function calculateColombiaEconomics(params: {
  priceCop: number;
  trmCopPerUsd: number;
  exchangeSpreadPct: number;
  apiSharePctOfNet: number;
}): ColombiaPackageEconomics {
  const priceCop = Math.max(10_000, params.priceCop);
  const trm = Math.max(2_500, params.trmCopPerUsd);
  const effectiveTrm = trm * (1 + Math.max(0, params.exchangeSpreadPct) / 100);

  // Pasarela Colombia (ej. Wompi): ~2.65% + $700 COP + 19% IVA sobre esa comision
  const baseGateway = priceCop * 0.0265 + 700;
  const wompiFeeCop = Math.round(baseGateway * 1.19);
  // Retencion estimada tarjetas (~1.5% promedio)
  const taxRetentionCop = Math.round(priceCop * 0.015);
  const netReceivedCop = Math.max(0, priceCop - wompiFeeCop - taxRetentionCop);

  // Presupuesto de API (USD) segun % del neto asignado a consumo Decart
  const apiBudgetCop = Math.round(netReceivedCop * (params.apiSharePctOfNet / 100));
  const apiCostUsd = Number((apiBudgetCop / effectiveTrm).toFixed(2));
  const decartCreditsIncluded = Math.max(0, Math.floor(apiCostUsd * 100));
  const apiCostCop = Math.round((decartCreditsIncluded / 100) * effectiveTrm);

  const netProfitCop = netReceivedCop - apiCostCop;
  const marginPercent = priceCop > 0 ? Number(((netProfitCop / priceCop) * 100).toFixed(1)) : 0;

  return {
    priceCop,
    wompiFeeCop,
    taxRetentionCop,
    netReceivedCop,
    decartCreditsIncluded,
    apiCostUsd,
    apiCostCop,
    netProfitCop,
    marginPercent,
    minutesEco: Number((decartCreditsIncluded / 60).toFixed(1)), // 1 cr/s
    minutesPro: Number((decartCreditsIncluded / 120).toFixed(1)), // 2 cr/s
  };
}

export async function fileToCompactDataUrl(file: File, maxSize = 256): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("No se pudo crear contexto 2D para comprimir miniatura.");
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.84);
}

export function dataUrlToFile(dataUrl: string, fileName = "skin-referencia.jpg"): File {
  if (!dataUrl || !dataUrl.includes(",")) {
    return new File([], fileName, { type: "image/jpeg" });
  }
  const [header, base64] = dataUrl.split(",");
  const mimeMatch = header?.match(/data:([^;]+)/);
  const mime = mimeMatch?.[1] || "image/jpeg";
  try {
    const binary = atob(base64 || "");
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new File([bytes], fileName, { type: mime });
  } catch {
    return new File([], fileName, { type: mime });
  }
}

// -------------------------------------------------------------
// CATALOGO DELULU-STREAM (EXPLORE & CAM CARDS)
// -------------------------------------------------------------
export type ExploreCardItem = {
  id: string;
  title: string;
  author: string;
  likes: number;
  category: "Characters" | "Outfits" | "Props";
  prompt: string;
  modelId: "lucy-2.6" | "lucy-restyle-2" | "lucy-vton-3.6";
  isNsfw?: boolean;
  avatarBg: string; // Gradiente o color de fondo para miniatura estilo avatar
  tagBadge?: string;
  requiresRefImage?: boolean;
};

export const EXPLORE_CATALOG_ITEMS: ExploreCardItem[] = [
  {
    id: "exp-ref-img",
    title: "Reference Image (Swap)",
    author: "aleman christian",
    likes: 16,
    category: "Characters",
    prompt:
      "Substitute the character in the video with the person in the reference image, matching facial features, hair, and clothing.",
    modelId: "lucy-2.6",
    avatarBg: "linear-gradient(135deg, #FF2E93 0%, #6B21A8 100%)",
    tagBadge: "POPULAR",
    requiresRefImage: true,
  },
  {
    id: "exp-custom-char",
    title: "Summer Glamour Model",
    author: "UP Supremacy",
    likes: 27,
    category: "Characters",
    prompt:
      "Substitute the character in the video with a blonde glamorous model wearing an elegant summer sun outfit, high fidelity facial features.",
    modelId: "lucy-2.6",
    avatarBg: "linear-gradient(135deg, #EC4899 0%, #F59E0B 100%)",
  },
  {
    id: "exp-photo-noir",
    title: "Megan Noir Glamour",
    author: "Ignacio Santos",
    likes: 275,
    category: "Characters",
    prompt:
      "Substitute the character in the video with a striking dark-haired glamorous woman in elegant evening wear, studio key light.",
    modelId: "lucy-2.6",
    avatarBg: "linear-gradient(135deg, #1E1B4B 0%, #701A75 100%)",
    tagBadge: "HOT",
  },
  {
    id: "exp-whisker-anime",
    title: "Whisker Cat Girl",
    author: "neko_stream",
    likes: 484,
    category: "Characters",
    prompt:
      "Substitute the character in the video with an anime cat-girl with short dark hair, feline ears, and soft cinematic lighting.",
    modelId: "lucy-2.6",
    avatarBg: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",
    tagBadge: "TRENDING",
  },
  {
    id: "exp-mbappe",
    title: "Elite Soccer Pro",
    author: "Sadik Bikhit",
    likes: 146,
    category: "Characters",
    prompt:
      "Substitute the character in the video with an athletic professional soccer star wearing modern blue training jersey, realistic lighting.",
    modelId: "lucy-2.6",
    avatarBg: "linear-gradient(135deg, #1E40AF 0%, #172554 100%)",
  },
  {
    id: "exp-johnny-pirate",
    title: "Captain Charisma",
    author: "Fenty 24",
    likes: 677,
    category: "Characters",
    prompt:
      "Substitute the character in the video with a charismatic pirate captain with goatee beard, white shirt, and mischievous look.",
    modelId: "lucy-2.6",
    avatarBg: "linear-gradient(135deg, #78350F 0%, #1F2937 100%)",
    tagBadge: "BEST",
  },
  {
    id: "exp-asian-influencer",
    title: "Korean Street Star",
    author: "Jenny Ryu",
    likes: 385,
    category: "Characters",
    prompt:
      "Substitute the character in the video with a stylish Korean pop streamer with round glasses, chic hair, and neon room backlighting.",
    modelId: "lucy-2.6",
    avatarBg: "linear-gradient(135deg, #BE185D 0%, #4C1D95 100%)",
  },
  {
    id: "exp-anime-school",
    title: "Anime Academy Girl",
    author: "sakura_ai",
    likes: 512,
    category: "Characters",
    prompt:
      "Substitute the character in the video with a cute anime schoolgirl with blonde twintails, sailor uniform, and glowing anime eyes.",
    modelId: "lucy-2.6",
    avatarBg: "linear-gradient(135deg, #F43F5E 0%, #FBBF24 100%)",
  },
  {
    id: "exp-yubjin",
    title: "Ruby Red Locks",
    author: "bunny miyu",
    likes: 320,
    category: "Characters",
    prompt:
      "Substitute the character in the video with a young woman with vibrant crimson wavy braided hair and porcelain skin.",
    modelId: "lucy-2.6",
    avatarBg: "linear-gradient(135deg, #991B1B 0%, #450A0A 100%)",
  },
  {
    id: "exp-streetwear-bomber",
    title: "Techwear Bomber Jacket",
    author: "outfit_lab",
    likes: 218,
    category: "Outfits",
    prompt:
      "Substitute the current top with an oversized matte black techwear bomber jacket with straps, high collar, and waterproof zippers.",
    modelId: "lucy-vton-3.6",
    avatarBg: "linear-gradient(135deg, #18181B 0%, #27272A 100%)",
  },
  {
    id: "exp-cyber-armor",
    title: "Neon Cyberpunk Exosuit",
    author: "matrix_dev",
    likes: 409,
    category: "Outfits",
    prompt:
      "Replace clothing with a glowing titanium cyber armor suit with luminescent pink circuits running down chest and shoulders.",
    modelId: "lucy-vton-3.6",
    avatarBg: "linear-gradient(135deg, #065F46 0%, #047857 100%)",
  },
  {
    id: "exp-royal-crown",
    title: "Gold Emperor Crown",
    author: "royal_props",
    likes: 184,
    category: "Props",
    prompt:
      "Add an intricate solid gold ornate royal crown with rubies and emeralds floating naturally on the person's head.",
    modelId: "lucy-2.6",
    avatarBg: "linear-gradient(135deg, #CA8A04 0%, #713F12 100%)",
  },
];

// -------------------------------------------------------------
// ACCORDIONES Y CHIPS DEL CREADOR (DELULU CREATE WORKSPACE)
// -------------------------------------------------------------
export type BuilderChipSection = {
  id: string;
  label: string;
  options: string[];
};

export const DELULU_BUILDER_SECTIONS: BuilderChipSection[] = [
  {
    id: "character_type",
    label: "CHARACTER TYPE",
    options: ["HUMAN", "ALIEN", "ROBOT", "ANIME", "HERO"],
  },
  {
    id: "gender",
    label: "GENDER",
    options: ["SHE/HER", "HE/HIM", "TRANS MAN", "TRANS WOMAN", "NON-BINARY", "OTHER"],
  },
  {
    id: "age_group",
    label: "AGE GROUP",
    options: ["ADULT", "MATURE", "SENIOR", "OLD"],
  },
  {
    id: "ethnicity",
    label: "ETHNICITY",
    options: ["AFRICAN", "ASIAN", "EUROPEAN", "INDIAN", "MID EASTERN", "MIXED"],
  },
  {
    id: "eyes",
    label: "EYES",
    options: [
      "NORMAL",
      "GLOWING",
      "CAT EYES",
      "WHITE EYES",
      "NEON",
      "STARRY",
      "DARK/VOID",
      "HOLOGRAM",
    ],
  },
  {
    id: "face_features",
    label: "FACE FEATURES",
    options: [
      "SHARP",
      "SOFT",
      "CUTE",
      "SERIOUS",
      "BABYFACE",
      "MATURE",
      "SYMMETRIC",
      "ASYMMETRIC",
      "MASKED",
      "SCARRED",
    ],
  },
  {
    id: "style",
    label: "STYLE",
    options: [
      "REALISTIC",
      "ANIME",
      "PIXAR-STYLE",
      "3D TOY",
      "CLAY",
      "COMIC",
      "GAME STYLE",
      "AI PORTRAIT",
      "SURREAL",
    ],
  },
  {
    id: "outfit",
    label: "OUTFIT",
    options: [
      "CASUAL",
      "STREETWEAR",
      "ARMOR",
      "ROYAL",
      "FUTURISTIC",
      "FANTASY",
      "MINIMAL",
      "TECHWEAR",
      "ELEGANT",
      "VILLAIN COAT",
    ],
  },
];

// -------------------------------------------------------------
// CARRUSEL DE PRENDAS TRY-ON (HASTA 10 PRENDAS) ESTILO DELULU
// -------------------------------------------------------------
export type TryOnGarmentItem = {
  id: string;
  name: string;
  category: string;
  prompt: string;
  thumbnailSvg?: string;
  customImageUrl?: string;
  isCustom?: boolean;
};

// 5 Outfits predeterminados idénticos a la referencia de espejo del usuario
export const DEFAULT_TRYON_CAROUSEL: TryOnGarmentItem[] = [
  {
    id: "vton-warrior-armor",
    name: "Armadura Mítica",
    category: "Fantasía",
    prompt:
      "Substitute the person's upper clothing with an ornate warrior horned helmet, etched steel plate armor chestpiece, and rugged leather shoulder straps with glowing silver accents, preserving natural body movement.",
    thumbnailSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="16" fill="%23FFFFFF"/><path d="M28 32 C34 16, 42 12, 50 18 C58 12, 66 16, 72 32 C64 30, 56 34, 50 38 C44 34, 36 30, 28 32 Z" fill="%234B5563"/><path d="M24 24 C16 14, 18 6, 26 12 C24 16, 26 20, 28 24 Z" fill="%2378350F"/><path d="M76 24 C84 14, 82 6, 74 12 C76 16, 74 20, 72 24 Z" fill="%2378350F"/><circle cx="42" cy="28" r="4" fill="%23F59E0B"/><circle cx="58" cy="28" r="4" fill="%23F59E0B"/><path d="M26 48 L74 48 L68 84 L32 84 Z" fill="%23374151"/><path d="M36 54 L64 54 L60 76 L40 76 Z" fill="%236B7280"/><path d="M50 48 L50 84" stroke="%23F59E0B" stroke-width="2"/></svg>`,
  },
  {
    id: "vton-cowboy-western",
    name: "Cowboy del Oeste",
    category: "Western",
    prompt:
      "Substitute the person's clothing with a classic wide-brim brown leather cowboy hat, bright red bandana scarf tied neatly around neck, and a rugged denim western button-up shirt.",
    thumbnailSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="16" fill="%23FFFFFF"/><ellipse cx="50" cy="30" rx="38" ry="12" fill="%2378350F"/><path d="M34 26 C36 12, 64 12, 66 26 Z" fill="%2392400E"/><path d="M38 42 L62 42 L50 62 Z" fill="%23DC2626"/><circle cx="50" cy="48" r="2" fill="%23FFFFFF"/><circle cx="45" cy="52" r="1.5" fill="%23FFFFFF"/><circle cx="55" cy="52" r="1.5" fill="%23FFFFFF"/><path d="M28 58 L72 58 L68 90 L32 90 Z" fill="%231E3A8A"/><path d="M42 58 L50 70 L58 58" stroke="%2393C5FD" stroke-width="2"/></svg>`,
  },
  {
    id: "vton-streetwear-pink",
    name: "Streetwear Chic",
    category: "Urbano",
    prompt:
      "Substitute the person's clothing with an olive green patterned bucket hat, dark retro sunglasses, pastel pink relaxed cotton t-shirt, and layered silver chain necklaces.",
    thumbnailSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="16" fill="%23FFFFFF"/><ellipse cx="50" cy="24" rx="26" ry="7" fill="%233F6212"/><path d="M32 24 L36 12 L64 12 L68 24 Z" fill="%234D7C0F"/><rect x="36" y="27" width="12" height="7" rx="3" fill="%231F2937"/><rect x="52" y="27" width="12" height="7" rx="3" fill="%231F2937"/><line x1="48" y1="30.5" x2="52" y2="30.5" stroke="%231F2937" stroke-width="2"/><path d="M24 50 L76 50 L70 90 L30 90 Z" fill="%23F472B6"/><path d="M40 50 C40 60, 60 60, 60 50" stroke="%23E2E8F0" stroke-width="2" fill="none"/><path d="M43 54 C43 64, 57 64, 57 54" stroke="%23CBD5E1" stroke-width="1.5" fill="none"/></svg>`,
  },
  {
    id: "vton-military-cargo",
    name: "Chaqueta Militar",
    category: "Casual",
    prompt:
      "Substitute the person's top with an authentic safari olive-green utility cargo jacket with chest flap pockets, brass military buttons, and durable cotton canvas texture.",
    thumbnailSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="16" fill="%23FFFFFF"/><path d="M24 30 L40 18 L60 18 L76 30 L70 90 L30 90 Z" fill="%234D5B3A"/><path d="M40 18 L50 36 L60 18" fill="%23364028"/><rect x="32" y="44" width="12" height="14" rx="2" fill="%233F4A2F"/><rect x="56" y="44" width="12" height="14" rx="2" fill="%233F4A2F"/><circle cx="50" cy="45" r="2" fill="%23CA8A04"/><circle cx="50" cy="60" r="2" fill="%23CA8A04"/><circle cx="50" cy="75" r="2" fill="%23CA8A04"/></svg>`,
  },
  {
    id: "vton-executive-suit",
    name: "Traje Ejecutivo",
    category: "Elegante",
    prompt:
      "Substitute the person's clothes with a premium tailored charcoal grey double-breasted suit jacket, crisp white poplin dress shirt, and rich royal blue silk necktie.",
    thumbnailSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="16" fill="%23FFFFFF"/><path d="M22 28 L38 16 L62 16 L78 28 L72 90 L28 90 Z" fill="%231F2937"/><path d="M42 16 L50 38 L58 16 Z" fill="%23FFFFFF"/><path d="M48 24 L52 24 L53 50 L50 56 L47 50 Z" fill="%231D4ED8"/><path d="M38 16 L48 48 L34 50 Z" fill="%23374151"/><path d="M62 16 L52 48 L66 50 Z" fill="%23374151"/><circle cx="46" cy="60" r="1.5" fill="%23000000"/><circle cx="54" cy="60" r="1.5" fill="%23000000"/><circle cx="46" cy="72" r="1.5" fill="%23000000"/><circle cx="54" cy="72" r="1.5" fill="%23000000"/></svg>`,
  },
];

// -------------------------------------------------------------
// BOTONERA DE ACCIONES PERSONALIZADAS (STREAM DECK)
// -------------------------------------------------------------
export type ButtonSize = "sm" | "md" | "lg" | "xl";
export type ButtonPlacement =
  | "deck"
  | "screen-top-left"
  | "screen-top-right"
  | "screen-bottom-left"
  | "screen-bottom-right";

export type CustomActionButton = {
  id: string;
  label: string;
  icon: string;
  customImageUrl?: string;
  color: string;
  actionType: "prompt" | "tryon" | "alert" | "control";
  payload: string;
  description?: string;
  size?: ButtonSize;
  placement?: ButtonPlacement;
};

export const DEFAULT_ACTION_BUTTONS: CustomActionButton[] = [
  {
    id: "act-cyber-neon",
    label: "Neón Cyber",
    icon: "⚡",
    color: "#8B5CF6",
    actionType: "prompt",
    payload:
      "Transform room into a high-tech cyberpunk studio with vibrant neon magenta and cyan backlights, holographic bokeh, and cinematic reflections.",
    description: "Ambiente futurista con luces neón en la habitación",
    size: "md",
    placement: "deck",
  },
  {
    id: "act-turbo-boost",
    label: "Modo Furia",
    icon: "🔥",
    customImageUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" width="60" height="60"><defs><linearGradient id="furyGrad" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stop-color="%23EF4444"/><stop offset="100%" stop-color="%23F59E0B"/></linearGradient></defs><circle cx="30" cy="30" r="28" fill="%231E1E2E" stroke="%23EF4444" stroke-width="2"/><path d="M30 10 Q 38 25, 34 32 Q 42 28, 38 46 Q 30 52, 22 46 Q 18 36, 26 30 Q 22 22, 30 10 Z" fill="url(%23furyGrad)"/></svg>`,
    color: "#EF4444",
    actionType: "prompt",
    payload: "Dramatic fiery action hero cinematic lighting, dynamic embers, high octane streaming studio",
    description: "Botón con imagen PNG de fuego y efecto furia",
    size: "lg",
    placement: "deck",
  },
  {
    id: "act-screen-magic",
    label: "Destello Mágico",
    icon: "✨",
    customImageUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" width="60" height="60"><circle cx="30" cy="30" r="28" fill="%2314142B" stroke="%2300F0FF" stroke-width="2.5"/><polygon points="30,8 36,24 52,30 36,36 30,52 24,36 8,30 24,24" fill="%2300F0FF"/></svg>`,
    color: "#00F0FF",
    actionType: "prompt",
    payload: "Magical glowing particles, sparkling neon aura, fantasy lighting",
    description: "Botón interactivo ubicado en pantalla con imagen PNG",
    size: "md",
    placement: "screen-bottom-left",
  },
  {
    id: "act-anime-style",
    label: "Modo Anime",
    icon: "🎨",
    color: "#EC4899",
    actionType: "prompt",
    payload:
      "Transform into a high quality 2D modern anime character with expressive stylized eyes, detailed hair cel-shading, and vibrant anime studio background.",
    description: "Estilo anime japonés con sombreado de animación",
    size: "md",
    placement: "deck",
  },
  {
    id: "act-sunglasses",
    label: "Gafas Oscuras",
    icon: "🕶️",
    color: "#3B82F6",
    actionType: "prompt",
    payload: "Add stylish luxury dark sunglasses with reflective lenses to the person's face.",
    description: "Coloca gafas oscuras de sol sobre la persona",
    size: "sm",
    placement: "deck",
  },
  {
    id: "act-golden-crown",
    label: "Corona Oro",
    icon: "👑",
    color: "#F59E0B",
    actionType: "prompt",
    payload:
      "Add an ornate solid gold imperial crown decorated with gems floating majestically on the head.",
    description: "Añade una corona dorada sobre la cabeza",
    size: "md",
    placement: "deck",
  },
  {
    id: "act-mirror",
    label: "Espejo",
    icon: "🪞",
    color: "#10B981",
    actionType: "control",
    payload: "toggle_mirror",
    description: "Alterna el modo espejo horizontal de la cámara",
    size: "sm",
    placement: "deck",
  },
  {
    id: "act-mute",
    label: "Mute Voz",
    icon: "🔇",
    color: "#EF4444",
    actionType: "control",
    payload: "toggle_audio",
    description: "Silencia o activa rápidamente el audio de retorno",
    size: "sm",
    placement: "deck",
  },
];

// -------------------------------------------------------------
// FONDOS VIRTUALES (CHROMA KEY Y ESCENARIOS STREAMING)
// -------------------------------------------------------------
export type VirtualBackgroundItem = {
  id: string;
  name: string;
  category: "Original" | "Chroma" | "Estudio" | "Oficina" | "Naturaleza" | "Sci-Fi" | "Personalizado";
  mediaType?: "image" | "video"; // Tipo de medio: imagen fija o video en bucle
  thumbnailSvg: string;
  customImageUrl?: string;
  customVideoUrl?: string; // URL o blob del video de fondo subido (MP4/WebM)
  isCustom?: boolean;
  promptSuffix: string;
  previewColor: string;
};

export const DEFAULT_VIRTUAL_BACKGROUNDS: VirtualBackgroundItem[] = [
  {
    id: "bg-chroma-green",
    name: "Chroma Key (Verde)",
    category: "Chroma",
    mediaType: "image",
    customImageUrl: "/backgrounds/chroma_green.jpg",
    thumbnailSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 120" width="160" height="120"><rect width="160" height="120" fill="%2300FF00"/><text x="80" y="105" text-anchor="middle" fill="%23004400" font-size="11" font-family="sans-serif" font-weight="bold">CHROMA KEY</text></svg>`,
    promptSuffix: "pure solid bright neon green screen chroma key background (#00FF00), crisp clean subject silhouette with no spill, perfect edge isolation",
    previewColor: "#00FF00",
  },
  {
    id: "bg-none",
    name: "Fondo Original (Sin Efecto)",
    category: "Original",
    mediaType: "image",
    customImageUrl: "/backgrounds/original_room.jpg",
    thumbnailSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 120" width="160" height="120"><rect width="160" height="120" fill="%2314141E"/><path d="M40 35 h80 v50 h-80 z" fill="none" stroke="%236B7280" stroke-width="3"/><circle cx="80" cy="60" r="14" fill="none" stroke="%236B7280" stroke-width="3"/><line x1="30" y1="25" x2="130" y2="95" stroke="%23EF4444" stroke-width="3"/><text x="80" y="105" text-anchor="middle" fill="%239CA3AF" font-size="11" font-family="sans-serif" font-weight="bold">ORIGINAL</text></svg>`,
    promptSuffix: "",
    previewColor: "#6B7280",
  },
  {
    id: "bg-loop-cybercity",
    name: "Ciberpunk Animado (Video)",
    category: "Sci-Fi",
    mediaType: "video",
    customImageUrl: "/backgrounds/cyber_video.jpg",
    thumbnailSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 120" width="160" height="120"><defs><linearGradient id="cyberv" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%231E1B4B"/><stop offset="100%" stop-color="%23701A75"/></linearGradient></defs><rect width="160" height="120" fill="url(%23cyberv)"/><circle cx="80" cy="50" r="16" fill="%23FF2E93" fill-opacity="0.3"/><polygon points="75,42 90,50 75,58" fill="%2300F0FF"/><text x="80" y="90" text-anchor="middle" fill="%2300F0FF" font-size="10" font-family="sans-serif" font-weight="bold">VIDEO LOOP</text><text x="80" y="105" text-anchor="middle" fill="%23FF2E93" font-size="9" font-family="sans-serif">NEON CITY</text></svg>`,
    promptSuffix: "futuristic cyberpunk neon city animated backdrop, rainy night reflections, soft purple and cyan glow, cinematic depth of field",
    previewColor: "#701A75",
  },
  {
    id: "bg-cyber-streamer",
    name: "Estudio Neón Ciberpunk",
    category: "Estudio",
    mediaType: "image",
    customImageUrl: "/backgrounds/cyber_streamer.jpg",
    thumbnailSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 120" width="160" height="120"><rect width="160" height="120" fill="%230F0C20"/><text x="80" y="105" text-anchor="middle" fill="%2300F0FF" font-size="11" font-family="sans-serif" font-weight="bold">ESTUDIO NEÓN</text></svg>`,
    promptSuffix: "in a high-tech modern streamer gaming room with glowing purple and cyan neon LED wall bars, sleek acoustic panels, and cinematic studio bokeh",
    previewColor: "#8B5CF6",
  },
  {
    id: "bg-luxury-office",
    name: "Penthouse Ejecutivo",
    category: "Oficina",
    mediaType: "image",
    customImageUrl: "/backgrounds/luxury_office.jpg",
    thumbnailSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 120" width="160" height="120"><rect width="160" height="120" fill="%230A1128"/><text x="80" y="110" text-anchor="middle" fill="%2393C5FD" font-size="11" font-family="sans-serif" font-weight="bold">PENTHOUSE</text></svg>`,
    promptSuffix: "in an ultra-modern luxury high-rise penthouse office with floor-to-ceiling glass windows overlooking glowing skyscraper skyline at night",
    previewColor: "#3B82F6",
  },
  {
    id: "bg-classic-library",
    name: "Biblioteca Clásica",
    category: "Estudio",
    mediaType: "image",
    customImageUrl: "/backgrounds/classic_library.jpg",
    thumbnailSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 120" width="160" height="120"><rect width="160" height="120" fill="%232A1608"/><text x="80" y="110" text-anchor="middle" fill="%23FDE68A" font-size="11" font-family="sans-serif" font-weight="bold">BIBLIOTECA</text></svg>`,
    promptSuffix: "in an elegant vintage mahogany library room with bookshelves filled with antique books, warm fireplace glow, cozy study ambient lighting",
    previewColor: "#D97706",
  },
  {
    id: "bg-tropical-beach",
    name: "Playa Tropical Sunset",
    category: "Naturaleza",
    mediaType: "image",
    customImageUrl: "/backgrounds/tropical_beach.jpg",
    thumbnailSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 120" width="160" height="120"><rect width="160" height="120" fill="%23FF512F"/><text x="80" y="112" text-anchor="middle" fill="%231E293B" font-size="11" font-family="sans-serif" font-weight="bold">PLAYA SUNSET</text></svg>`,
    promptSuffix: "in a scenic tropical beach at golden hour sunset with gentle turquoise ocean waves, palm trees, warm golden rim lighting",
    previewColor: "#F59E0B",
  },
  {
    id: "bg-deep-cosmos",
    name: "Cosmos & Galaxia",
    category: "Sci-Fi",
    mediaType: "image",
    customImageUrl: "/backgrounds/deep_cosmos.jpg",
    thumbnailSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 120" width="160" height="120"><rect width="160" height="120" fill="%23030712"/><text x="80" y="110" text-anchor="middle" fill="%23E9D5FF" font-size="11" font-family="sans-serif" font-weight="bold">COSMOS</text></svg>`,
    promptSuffix: "in deep space with vibrant glowing nebula clouds, cosmic stars, deep violet and blue stellar dust, cinematic sci-fi illumination",
    previewColor: "#6366F1",
  },
];

// -------------------------------------------------------------
// LOGOS Y BANNERS PROGRAMADOS EN PANTALLA (OVERLAYS / WATERMARKS)
// -------------------------------------------------------------
export type OverlayPosition =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "top-center"
  | "bottom-center"
  | "center";

export type OverlayAnimation = "fade" | "slide" | "pop";

export type ScheduledOverlayItem = {
  id: string;
  name: string;
  imageUrl: string;
  targetUrl?: string; // URL ejecutable al hacer clic sobre el banner
  customText?: string; // Texto personalizado del banner
  copyableText?: string; // Texto a copiar al portapapeles con botón Copiar
  bgColor?: string; // Color de fondo si es banner tipográfico
  textColor?: string; // Color de texto
  position: OverlayPosition;
  sizePercent: number; // % del ancho del monitor (10% a 90%)
  opacity: number; // 0.1 a 1.0
  displayMode: "permanent" | "timed_cycle";
  intervalSeconds: number; // Cada cuántos segundos reaparece
  durationSeconds: number; // Cuántos segundos permanece en pantalla
  animation: OverlayAnimation;
  enabled: boolean;
};

export const DEFAULT_SCHEDULED_OVERLAYS: ScheduledOverlayItem[] = [
  {
    id: "ovl-brand-watermark",
    name: "Logo Marca de Agua Virallive",
    imageUrl: "/viralive-logo.svg",
    targetUrl: "https://viralive.app",
    position: "top-center",
    sizePercent: 22,
    opacity: 0.9,
    displayMode: "permanent",
    intervalSeconds: 60,
    durationSeconds: 15,
    animation: "fade",
    enabled: true,
  },
  {
    id: "ovl-sponsor-ticker",
    name: "Banner Patrocinador / Redes",
    imageUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 450 70" width="450" height="70"><rect width="450" height="70" rx="16" fill="%2309090F" fill-opacity="0.9" stroke="%238B5CF6" stroke-width="2.5"/><text x="24" y="30" fill="%23FF2E93" font-size="12" font-family="sans-serif" font-weight="900">PATROCINADOR OFICIAL</text><text x="24" y="52" fill="%23FFFFFF" font-size="15" font-family="sans-serif" font-weight="800">Síguenos en @viralive.app | Código: PRO2026</text></svg>`,
    targetUrl: "https://viralive.app",
    customText: "Patrocinador Oficial · Síguenos en @viralive.app",
    copyableText: "PRO2026",
    position: "bottom-center",
    sizePercent: 62,
    opacity: 0.95,
    displayMode: "timed_cycle",
    intervalSeconds: 30, // cada 30 segundos
    durationSeconds: 10, // visible 10 segundos
    animation: "slide",
    enabled: true,
  },
  {
    id: "ovl-live-badge",
    name: "Insignia LIVE REC",
    imageUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 46" width="140" height="46"><rect width="140" height="46" rx="23" fill="%23DC2626" fill-opacity="0.9" stroke="%23FFFFFF" stroke-width="2"/><circle cx="26" cy="23" r="7" fill="%23FFFFFF"/><text x="44" y="29" fill="%23FFFFFF" font-size="15" font-family="sans-serif" font-weight="900" letter-spacing="1">EN VIVO</text></svg>`,
    position: "top-left",
    sizePercent: 14,
    opacity: 0.95,
    displayMode: "permanent",
    intervalSeconds: 60,
    durationSeconds: 20,
    animation: "pop",
    enabled: false,
  },
];

// -------------------------------------------------------------
// GRABACIÓN DE VIDEO Y RESOLUCIONES DE SALIDA
// -------------------------------------------------------------
export type RecordingResolution = "480p" | "720p" | "1080p" | "4k";

export const RECORDING_RESOLUTIONS: { id: RecordingResolution; label: string; width: number; height: number; fps: number }[] = [
  { id: "480p", label: "480p (SD - 854x480)", width: 854, height: 480, fps: 30 },
  { id: "720p", label: "720p (HD - 1280x720)", width: 1280, height: 720, fps: 30 },
  { id: "1080p", label: "1080p (Full HD - 1920x1080)", width: 1920, height: 1080, fps: 60 },
  { id: "4k", label: "4K (Ultra HD - 3840x2160)", width: 3840, height: 2160, fps: 60 },
];

// -------------------------------------------------------------
// TELEPROMPTER / SCRIPT EN PANTALLA
// -------------------------------------------------------------
export const DEFAULT_TELEPROMPTER_SCRIPT = `¡Bienvenidos a la transmisión profesional de hoy!

Estás viendo un stream multi-plataforma con inteligencia artificial en tiempo real.

En esta sesión demostraremos cómo los creadores y streamers pueden programar eventos en vivo, activar fondos dinámicos de foto o video, personalizar banners con copiado rápido de cupones y leer sus guiones cómodamente con este teleprompter integrado sobre el escenario.

¡Sigue adelante con tu guion y deslumbra a tu audiencia!`;

// -------------------------------------------------------------
// MULTISTREAMING A 45+ PLATAFORMAS (ESTILO ONESTREAM LIVE)
// -------------------------------------------------------------
export type MultistreamPlatformId =
  | "facebook"
  | "instagram"
  | "tiktok"
  | "twitch"
  | "youtube"
  | "kick"
  | "twitter"
  | "linkedin"
  | "custom-rtmp";

export type MultistreamDestination = {
  id: string;
  platform: MultistreamPlatformId;
  name: string;
  category: "Social" | "Gaming" | "Business" | "Custom";
  iconSvg: string;
  enabled: boolean;
  rtmpUrl: string;
  streamKey?: string;
  status: "idle" | "connecting" | "live" | "error";
  viewers?: number;
  bitrateKbps?: number;
};

export const DEFAULT_MULTISTREAM_DESTINATIONS: MultistreamDestination[] = [
  {
    id: "dest-fb",
    platform: "facebook",
    name: "Facebook Live",
    category: "Social",
    iconSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><circle cx="20" cy="20" r="20" fill="%231877F2"/><path d="M22.5 13.5 h3.5 V8.5 h-4.2 c-4.5 0-6.3 2.7-6.3 6.6 V18 h-4 v5 h4 v13 h5.5 V23 h4.2 l.8-5 h-5 v-2.6 c0-1.4.5-1.9 2-1.9z" fill="%23FFFFFF"/></svg>`,
    enabled: true,
    rtmpUrl: "rtmps://live-api-s.facebook.com:443/rtmp/",
    streamKey: "FB-LIVE-SECURE-KEY-DEMO",
    status: "live",
    viewers: 2450,
    bitrateKbps: 4500,
  },
  {
    id: "dest-ig",
    platform: "instagram",
    name: "Instagram Live",
    category: "Social",
    iconSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><defs><linearGradient id="igG" x1="0" y1="1" x2="1" y2="0"><stop offset="0%" stop-color="%23FFDC80"/><stop offset="50%" stop-color="%23F56040"/><stop offset="100%" stop-color="%23C13584"/></linearGradient></defs><rect width="40" height="40" rx="10" fill="url(%23igG)"/><rect x="9" y="9" width="22" height="22" rx="6" fill="none" stroke="%23FFFFFF" stroke-width="2.6"/><circle cx="20" cy="20" r="5" fill="none" stroke="%23FFFFFF" stroke-width="2.6"/><circle cx="26" cy="14" r="1.5" fill="%23FFFFFF"/></svg>`,
    enabled: true,
    rtmpUrl: "rtmps://live-upload.instagram.com:443/rtmp/",
    streamKey: "IG-LIVE-TOKEN-SECURE",
    status: "live",
    viewers: 4200,
    bitrateKbps: 3800,
  },
  {
    id: "dest-tt",
    platform: "tiktok",
    name: "TikTok Live",
    category: "Social",
    iconSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="20" fill="%23010101"/><path d="M26.5 16.5 C24.5 16 23 14.5 22.5 12 h-3.5 v14.5 c0 2.2-1.8 4-4 4 s-4-1.8-4-4 1.8-4 4-4 c.4 0 .7.1 1 .2 V15 C15.4 15 15 15 14.5 15 C10.9 15 8 17.9 8 21.5 S10.9 28 14.5 28 c3.6 0 6.5-2.9 6.5-6.5 V17.8 c1.8 1.3 4 2.2 6.5 2.2 v-3.5 z" fill="%23FFFFFF"/></svg>`,
    enabled: true,
    rtmpUrl: "rtmp://live.tiktok.com/live/",
    streamKey: "TIKTOK-STREAM-KEY-DEMO",
    status: "live",
    viewers: 8600,
    bitrateKbps: 5200,
  },
  {
    id: "dest-twitch",
    platform: "twitch",
    name: "Twitch",
    category: "Gaming",
    iconSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="10" fill="%239146FF"/><path d="M11 9 L9 15 v16 h6 v4 l4-4 h4 l8-8 V9 H11 z m17 12 l-4 4 h-5 l-3 3 v-3 h-4 V12 h16 v9 z" fill="%23FFFFFF"/><rect x="22" y="15" width="2.5" height="5" fill="%239146FF"/><rect x="17" y="15" width="2.5" height="5" fill="%239146FF"/></svg>`,
    enabled: false,
    rtmpUrl: "rtmp://live.twitch.tv/app/",
    streamKey: "live_twitch_token",
    status: "idle",
  },
  {
    id: "dest-yt",
    platform: "youtube",
    name: "YouTube Live",
    category: "Social",
    iconSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="20" fill="%23FF0000"/><path d="M16 14.5 l11 5.5 -11 5.5 z" fill="%23FFFFFF"/></svg>`,
    enabled: false,
    rtmpUrl: "rtmp://a.rtmp.youtube.com/live2/",
    streamKey: "yt-live-key",
    status: "idle",
  },
  {
    id: "dest-kick",
    platform: "kick",
    name: "Kick Live",
    category: "Gaming",
    iconSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="10" fill="%23000000"/><text x="20" y="27" text-anchor="middle" fill="%2353FC18" font-size="22" font-family="sans-serif" font-weight="900">K</text></svg>`,
    enabled: false,
    rtmpUrl: "rtmps://fa723794b692.global-contribute.live-video.net/app/",
    status: "idle",
  },
  {
    id: "dest-twitter",
    platform: "twitter",
    name: "X (Twitter) Live",
    category: "Social",
    iconSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="20" fill="%23000000"/><path d="M12 11 l6.5 8.7 -6.5 9.3 h2.5 l5.2 -7.4 4.5 7.4 h6.8 l-7 -10 6 -8 h-2.5 l-4.8 6.4 -4.2 -6.4 z" fill="%23FFFFFF"/></svg>`,
    enabled: false,
    rtmpUrl: "rtmp://x.pscp.tv:80/x/",
    status: "idle",
  },
  {
    id: "dest-linkedin",
    platform: "linkedin",
    name: "LinkedIn Live",
    category: "Business",
    iconSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="10" fill="%230A66C2"/><text x="20" y="27" text-anchor="middle" fill="%23FFFFFF" font-size="20" font-family="sans-serif" font-weight="900">in</text></svg>`,
    enabled: false,
    rtmpUrl: "rtmp://live-api.linkedin.com/rtmp/",
    status: "idle",
  },
  {
    id: "dest-custom",
    platform: "custom-rtmp",
    name: "RTMP / SRT Servidor Propio",
    category: "Custom",
    iconSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="10" fill="%231E293B"/><circle cx="20" cy="20" r="10" fill="none" stroke="%2338BDF8" stroke-width="2.5"/><path d="M15 20 h10 M20 15 v10" stroke="%2338BDF8" stroke-width="2.5"/></svg>`,
    enabled: false,
    rtmpUrl: "rtmp://servidor-privado.com/live/",
    status: "idle",
  },
];

export const ALL_45_MULTISTREAM_PLATFORMS = [
  "Facebook Live", "Instagram Live", "TikTok Live", "Twitch", "YouTube Live",
  "Kick", "X (Twitter)", "LinkedIn Live", "Amazon Live", "Trovo",
  "DLive", "Steam Community", "Vimeo OTT", "Telegram Live", "Mixcloud",
  "AfreecaTV", "VKontakte Live", "Bilibili", "KakaoTV", "Nimo TV",
  "DailyMotion", "Huya Live", "DouYu", "Nonolive", "Restream.io",
  "Castr", "Switcher Studio", "Wowza Media Systems", "Red5 Pro", "Ant Media Server",
  "PeerTube", "Owncast Self-Hosted", "Livepeer Web3", "Theta Network", "Mobcrush",
  "GoodGame.ru", "Showroom Japan", "LINE LIVE", "17LIVE", "BIGO LIVE",
  "Shopee Live", "Lazada Live", "Taobao Live", "Mercado Libre Live", "Custom SRT / RTMP"
];

// -------------------------------------------------------------
// SHOPPABLE PRODUCT CARDS (TARJETAS DE PRODUCTOS COMPRABLES EN VIVO)
// -------------------------------------------------------------
export type CurrencyOption = "USD" | "COP" | "EUR" | "MXN" | "GBP";

export type ShoppableProductItem = {
  id: string;
  title: string;
  subtitle?: string;
  linkUrl: string;
  currency: CurrencyOption;
  currencySymbol: string;
  price: number;
  compareAtPrice?: number;
  imageUrl: string;
  qrCodeDataUrl?: string;
  position: "bottom-center" | "bottom-left" | "bottom-right";
  enabled: boolean;
  scansCount?: number;
  clicksCount?: number;
};

export const DEFAULT_SHOPPABLE_PRODUCTS: ShoppableProductItem[] = [
  {
    id: "prod-headphones",
    title: "Headphones",
    subtitle: "Active Noise Cancellation",
    linkUrl: "https://onestream.live/shop/headphones",
    currency: "USD",
    currencySymbol: "$",
    price: 49.99,
    compareAtPrice: 59.99,
    imageUrl: "/products/headphones.jpg",
    position: "bottom-center",
    enabled: true,
    scansCount: 48,
    clicksCount: 19,
  },
  {
    id: "prod-smartwatch",
    title: "Smartwatch Elite V2",
    subtitle: "Pulsómetro & Pantalla AMOLED",
    linkUrl: "https://onestream.live/shop/smartwatch",
    currency: "USD",
    currencySymbol: "$",
    price: 79.0,
    compareAtPrice: 99.0,
    imageUrl: "/products/smartwatch.jpg",
    position: "bottom-center",
    enabled: false,
    scansCount: 24,
    clicksCount: 8,
  },
  {
    id: "prod-hoodie",
    title: "Hoodie Urbano Oversize",
    subtitle: "Algodón Premium 400 GSM",
    linkUrl: "https://onestream.live/shop/hoodie",
    currency: "USD",
    currencySymbol: "$",
    price: 34.5,
    compareAtPrice: 45.0,
    imageUrl: "/products/hoodie.jpg",
    position: "bottom-center",
    enabled: false,
    scansCount: 15,
    clicksCount: 5,
  },
];




// =============================================================
// MODULOS PRO AVANZADOS: TIKTOK BRANDED, PLAYLIST, CHAT & SCHEDULE
// =============================================================

export type TikTokBrandTheme = {
  id: string;
  name: string;
  category: "beauty" | "fitness" | "music" | "travel" | "custom";
  brandName: string;
  tagline: string;
  topBadge: string;
  accentColor: string;
  secondaryColor: string;
  textColor: string;
  bgAtmosphereUrl: string;
  streamerSampleUrl: string;
  decorations: string[];
  borderStyle: "curved_wave" | "angular_volt" | "cracked_neon" | "gold_corners";
};

export const DEFAULT_TIKTOK_BRAND_THEMES: TikTokBrandTheme[] = [
  {
    id: "tt-beauty",
    name: "Beauty & Skincare",
    category: "beauty",
    brandName: "Beauty by Mia",
    tagline: "Glow & Skincare Daily",
    topBadge: "BEAUTY LIVE",
    accentColor: "#F472B6",
    secondaryColor: "#FDF2F8",
    textColor: "#FFFFFF",
    bgAtmosphereUrl: "/backgrounds/original_room.jpg",
    streamerSampleUrl: "/backgrounds/streamer_beauty.jpg",
    decorations: ["✨", "🌸", "💄", "💖"],
    borderStyle: "curved_wave",
  },
  {
    id: "tt-fitness",
    name: "Fitness & Workout",
    category: "fitness",
    brandName: "JUST MOVE",
    tagline: "LET'S GET STRONGER TOGETHER",
    topBadge: "WORKOUT LIVE",
    accentColor: "#84CC16",
    secondaryColor: "#14532D",
    textColor: "#FFFFFF",
    bgAtmosphereUrl: "/backgrounds/penthouse_nocturno.jpg",
    streamerSampleUrl: "/backgrounds/streamer_fitness.jpg",
    decorations: ["⚡", "🔥", "💪", "🟢"],
    borderStyle: "angular_volt",
  },
  {
    id: "tt-music",
    name: "Live Music Neon",
    category: "music",
    brandName: "LIVE MUSIC",
    tagline: "Acoustic & Electronic Vibes",
    topBadge: "CONCERT LIVE",
    accentColor: "#A855F7",
    secondaryColor: "#3B0764",
    textColor: "#FFFFFF",
    bgAtmosphereUrl: "/backgrounds/estudio_moderno.jpg",
    streamerSampleUrl: "/backgrounds/streamer_music.jpg",
    decorations: ["🎵", "🎸", "💜", "⚡"],
    borderStyle: "cracked_neon",
  },
  {
    id: "tt-travel",
    name: "Wander & Travel",
    category: "travel",
    brandName: "WANDER MORE",
    tagline: "EXPLORE. DREAM. DISCOVER.",
    topBadge: "TRAVEL LIVE",
    accentColor: "#F59E0B",
    secondaryColor: "#78350F",
    textColor: "#FFFFFF",
    bgAtmosphereUrl: "/backgrounds/original_room.jpg",
    streamerSampleUrl: "/backgrounds/streamer_travel.jpg",
    decorations: ["✈️", "🧭", "🌍", "⭐"],
    borderStyle: "gold_corners",
  },
];

export type PlaylistStreamingItem = {
  id: string;
  title: string;
  durationSeconds: number;
  videoUrl: string;
  thumbnailUrl: string;
  category: string;
  order: number;
};

export const DEFAULT_STREAMING_PLAYLIST: PlaylistStreamingItem[] = [
  {
    id: "clip-intro",
    title: "Intro Animada & Bienvenida",
    durationSeconds: 15,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    thumbnailUrl: "/backgrounds/cyber_video.jpg",
    category: "Intro",
    order: 1,
  },
  {
    id: "clip-demo",
    title: "Demostración de Producto & Ofertas",
    durationSeconds: 30,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    thumbnailUrl: "/backgrounds/estudio_moderno.jpg",
    category: "Comercial",
    order: 2,
  },
  {
    id: "clip-outro",
    title: "Cierre, Redes Sociales & Cuenta Regresiva",
    durationSeconds: 20,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    thumbnailUrl: "/backgrounds/penthouse_nocturno.jpg",
    category: "Outro",
    order: 3,
  },
];

export type UnifiedChatMessage = {
  id: string;
  platform: "tiktok" | "youtube" | "twitch" | "facebook" | "instagram";
  author: string;
  avatarLetter: string;
  avatarColor: string;
  avatarUrl?: string;
  badgeIcon?: string;
  isVerified?: boolean;
  userLevel?: number;
  message: string;
  timestamp: string;
  isPinned?: boolean;
  isDonation?: boolean;
  donationAmount?: string;
  isAiResponse?: boolean;
  replyToAuthor?: string;
  replyToText?: string;
};

export const DEFAULT_UNIFIED_CHAT_MESSAGES: UnifiedChatMessage[] = [
  {
    id: "msg-justhere",
    platform: "tiktok",
    author: "JustHereToDance",
    avatarLetter: "J",
    avatarColor: "#EC4899",
    isVerified: false,
    badgeIcon: "✨",
    userLevel: 18,
    message: "I'm enjoying your content so much! 🎉",
    timestamp: "Ahora",
  },
  {
    id: "msg-shotcaller",
    platform: "youtube",
    author: "ShotCaller",
    avatarLetter: "S",
    avatarColor: "#3B82F6",
    isVerified: true,
    badgeIcon: "🔥",
    userLevel: 42,
    message: "Keep it up! You're the best! 🔥",
    timestamp: "Hace 5s",
  },
  {
    id: "msg-lightshow",
    platform: "instagram",
    author: "LightShowLaura",
    avatarLetter: "L",
    avatarColor: "#F59E0B",
    isVerified: false,
    badgeIcon: "✨",
    userLevel: 25,
    message: "This setup is next level! 🔥✨",
    timestamp: "Hace 12s",
  },
  {
    id: "msg-happyhour",
    platform: "facebook",
    author: "HappyHourHarry",
    avatarLetter: "H",
    avatarColor: "#EF4444",
    isVerified: false,
    badgeIcon: "👍",
    userLevel: 31,
    message: "Hey everyone! smash that like button! 👍",
    timestamp: "Hace 20s",
  },
  {
    id: "msg-songseeker",
    platform: "twitch",
    author: "SongSeeker",
    avatarLetter: "S",
    avatarColor: "#A855F7",
    isVerified: false,
    badgeIcon: "🎶",
    message: "What's the name of this track? It's a banger!",
    timestamp: "Hace 30s",
  },
  {
    id: "msg-djfan",
    platform: "tiktok",
    author: "DJ_Fan",
    avatarLetter: "D",
    avatarColor: "#10B981",
    isVerified: true,
    badgeIcon: "🎧",
    message: "You're the best DJ on this platform! 🎧🔥",
    timestamp: "Hace 45s",
  },
  {
    id: "msg-globalguest",
    platform: "facebook",
    author: "GlobalGuest",
    avatarLetter: "G",
    avatarColor: "#EAB308",
    isVerified: false,
    badgeIcon: "🇪🇸",
    message: "Checking in from Spain! ¡Hola a todos! 🇪🇸❤️",
    timestamp: "Hace 1m",
  },
  {
    id: "msg-superchat-carlos",
    platform: "youtube",
    author: "Carlos Tech Reviews",
    avatarLetter: "C",
    avatarColor: "#EF4444",
    isVerified: true,
    badgeIcon: "✓",
    message: "¡SuperChat $10 enviado! Excelente transmisión y calidad 1080p 60fps",
    timestamp: "Hace 2m",
    isDonation: true,
    donationAmount: "$10.00 USD",
    isPinned: true,
  },
];

export type GuestSimItem = {
  id: string;
  name: string;
  handle: string;
  role: string;
  avatarUrl?: string;
  customVideoUrl?: string;
  posterBg: string;
  isVerified: boolean;
  statusText: string;
  speechPrompts: string[];
};

export const DEFAULT_GUEST_PRESETS: GuestSimItem[] = [
  {
    id: "guest-cristiano",
    name: "Cristiano R.",
    handle: "@cristiano",
    role: "Celebridad VIP & Invitado Especial",
    posterBg: "linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%)",
    isVerified: true,
    statusText: "🟢 En directo (Co-Host)",
    speechPrompts: [
      "¡Saludos a todos los que están conectados en el directo! ¿Cómo va todo por allá? 🙌",
      "¿Cómo conseguiste ese descuento exclusivo para la comunidad? ¡Está genial! 💳⚡",
      "Sigan apoyando el streaming muchachos, revienten esa pantalla de likes ❤️",
      "¡Ese setup y calidad de audio están en otro nivel crack! Sigue así 🚀",
      "¿Cuál es el siguiente producto que vas a probar en vivo con la gente?",
    ],
  },
  {
    id: "guest-mia",
    name: "Mia Co-Host",
    handle: "@mia_stream",
    role: "Beauty & Lifestyle Streamer",
    posterBg: "linear-gradient(135deg, #831843 0%, #BE185D 50%, #F43F5E 100%)",
    isVerified: true,
    statusText: "🟢 En directo (Dúo)",
    speechPrompts: [
      "¡Hola amiga hermosa! ¡Qué emoción estar compartiendo este live contigo hoy! ✨💖",
      "¡Muéstrales el probador virtual en vivo! A la gente en el chat les va a fascinar 👗",
      "¿El código de descuento LIVE20 sigue activo para las chicas que recién entran?",
      "¡Chicos revienten la pantalla a likes, lleguemos a la meta de 50K! 🔥",
      "¡Ese outfit y el fondo virtual te quedan espectaculares! 🛍️✨",
    ],
  },
  {
    id: "guest-alex",
    name: "Alex Rivera",
    handle: "@alex_techlive",
    role: "Tech Reviewer & Gamer",
    posterBg: "linear-gradient(135deg, #064E3B 0%, #047857 50%, #10B981 100%)",
    isVerified: true,
    statusText: "🟢 En directo (Review)",
    speechPrompts: [
      "¿Esos audífonos tienen cancelación de ruido híbrida? ¡El audio se oye cristalino! 🎧",
      "La latencia del encoder WebRTC se ve por debajo de 50ms, fluidez total ⚡",
      "¿Vas a sortear uno de los accesorios al final de la transmisión? 👀",
      "¡Ese micrófono es perfecto para transmisiones diarias! 🎙️",
    ],
  },
  {
    id: "guest-sofia",
    name: "Sofia Martínez",
    handle: "@sofia_compras",
    role: "Compradora · Testimonio Real en Vivo",
    posterBg: "linear-gradient(135deg, #701A75 0%, #A21CAF 50%, #C026D3 100%)",
    isVerified: false,
    statusText: "🟢 En directo (Cliente Verificada)",
    speechPrompts: [
      "¡Hola! Quería entrar un momento para confirmar que mi pedido me llegó en solo 24 horas 📦✨",
      "La calidad de la prenda es 10/10, exactamente como la mostraste en el directo 🛍️",
      "¡Aprovechen la promo de hoy chicos porque se agota súper rápido! 🥰",
    ],
  },
];

export type ViewerRangeOption = {
  id: string;
  label: string;
  min: number;
  max: number;
  formattedCount: string;
  chatSpeedMs: number;
  heartsPerSec: number;
};

export const DEFAULT_VIEWER_RANGES: ViewerRangeOption[] = [
  { id: "r-100", label: "90-110", min: 90, max: 110, formattedCount: "105", chatSpeedMs: 6000, heartsPerSec: 1 },
  { id: "r-500", label: "490-510", min: 490, max: 510, formattedCount: "502", chatSpeedMs: 4500, heartsPerSec: 2 },
  { id: "r-1k", label: "900-1100", min: 900, max: 1100, formattedCount: "1.0K", chatSpeedMs: 3500, heartsPerSec: 3 },
  { id: "r-5k", label: "4K-5K", min: 4000, max: 5000, formattedCount: "4.8K", chatSpeedMs: 2500, heartsPerSec: 5 },
  { id: "r-10k", label: "9K-11K", min: 9000, max: 11000, formattedCount: "10.2K", chatSpeedMs: 2000, heartsPerSec: 7 },
  { id: "r-20k", label: "19K-21K", min: 19000, max: 21000, formattedCount: "20.4K", chatSpeedMs: 1500, heartsPerSec: 10 },
  { id: "r-50k", label: "49K-51K", min: 49000, max: 51000, formattedCount: "50.7K", chatSpeedMs: 1000, heartsPerSec: 15 },
  { id: "r-100k", label: "99K-100K", min: 99000, max: 100000, formattedCount: "99.8K", chatSpeedMs: 700, heartsPerSec: 20 },
];

export type ScheduledLiveEvent = {
  id: string;
  title: string;
  scheduledDate: string;
  scheduledTime: string;
  destinationsCount: number;
  platforms: ("facebook" | "instagram" | "tiktok" | "youtube" | "twitch")[];
  description: string;
  status: "scheduled" | "live" | "completed";
  autoStart: boolean;
};

export const DEFAULT_SCHEDULED_EVENTS: ScheduledLiveEvent[] = [
  {
    id: "ev-launch",
    title: "Gran Lanzamiento de Colección & Demostración en Vivo",
    scheduledDate: "2026-11-12",
    scheduledTime: "19:00",
    destinationsCount: 5,
    platforms: ["tiktok", "youtube", "instagram", "facebook", "twitch"],
    description: "Multidifusión simultánea a 5 plataformas con catálogo interactivo y probador virtual.",
    status: "scheduled",
    autoStart: true,
  },
  {
    id: "ev-podcast",
    title: "Sesión Q&A con la Comunidad & Sorteo de Premios",
    scheduledDate: "2026-11-15",
    scheduledTime: "17:30",
    destinationsCount: 3,
    platforms: ["youtube", "twitch", "tiktok"],
    description: "Preguntas y respuestas en vivo con chat unificado y teleprompter de guion.",
    status: "scheduled",
    autoStart: false,
  },
];

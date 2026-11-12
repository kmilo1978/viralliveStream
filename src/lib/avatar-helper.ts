// =======================================================================
// VIRALLIVE STREAM STUDIO - CATÁLOGO Y GESTIÓN DE AVATARES DE ROSTRO
// Soporta rostros vectoriales de alta definición distinguiendo Hombre y Mujer
// =======================================================================

export type AvatarGender = "male" | "female";

export const FEMALE_AVATARS: { id: string; url: string; label: string }[] = [
  { id: "f1", url: "/avatars/female_1.svg", label: "Castaña Ondulada 👩" },
  { id: "f2", url: "/avatars/female_2.svg", label: "Rubia Radiante 👱‍♀️" },
  { id: "f3", url: "/avatars/female_3.svg", label: "Afro Rizos Dorado 👩🏾" },
  { id: "f4", url: "/avatars/female_4.svg", label: "Coleta con Gafas 👩‍💼" },
  { id: "f5", url: "/avatars/female_5.svg", label: "Pelirroja Pecas 👩‍🦰" },
  { id: "f6", url: "/avatars/female_6.svg", label: "Corte Pixie Chic 💇‍♀️" },
];

export const MALE_AVATARS: { id: string; url: string; label: string }[] = [
  { id: "m1", url: "/avatars/male_1.svg", label: "Fade con Barba 🧔" },
  { id: "m2", url: "/avatars/male_2.svg", label: "Hoodie con Gafas 👨‍💻" },
  { id: "m3", url: "/avatars/male_3.svg", label: "Rubio Spiky Casual 👱‍♂️" },
  { id: "m4", url: "/avatars/male_4.svg", label: "Headset Streamer 🎧" },
  { id: "m5", url: "/avatars/male_5.svg", label: "Polo Tech Fade 👨" },
  { id: "m6", url: "/avatars/male_6.svg", label: "Sleek Side-Part 👨‍💼" },
];

export const SPECIAL_AVATARS = {
  bot: "/avatars/streamer_bot.svg",
  vip: "/avatars/streamer_vip.svg",
};

// Criterios de nombres femeninos comunes en español e inglés
const FEMALE_KEYWORDS = [
  "laura", "mia", "sofia", "elena", "mariana", "valen", "valentina", "camila",
  "maria", "emma", "isabella", "lucia", "jessica", "andrea", "paula", "daniela",
  "ana", "sara", "diana", "catalina", "natalia", "claudia", "karen", "vanessa",
  "patricia", "juliana", "justhere", "dance", "fit", "girl", "lady", "queen",
  "moda", "beauty", "style", "she", "chica", "mujer", "rubia", "coqueta"
];

// Criterios de nombres masculinos comunes en español e inglés
const MALE_KEYWORDS = [
  "carlos", "harry", "alex", "cristiano", "david", "juan", "mateo", "lucas",
  "daniel", "marco", "pedro", "jorge", "felipe", "andres", "diego", "luis",
  "jose", "miguel", "gabriel", "shotcaller", "shot", "dj", "fan", "global",
  "camilo", "gamer", "boy", "guy", "man", "king", "tech", "chico", "hombre",
  "streamer", "pro", "master", "bro"
];

/**
 * Detecta si el autor corresponde a Hombre o Mujer con base en el nombre o pistas del usuario.
 */
export function detectAvatarGender(author: string, userHint?: AvatarGender): AvatarGender {
  if (userHint === "male" || userHint === "female") {
    return userHint;
  }

  const clean = (author || "").toLowerCase().replace(/[@_\d\s.-]/g, "");

  // Verificar coincidencias en palabras clave femeninas
  for (const kw of FEMALE_KEYWORDS) {
    if (clean.includes(kw)) return "female";
  }

  // Verificar coincidencias en palabras clave masculinas
  for (const kw of MALE_KEYWORDS) {
    if (clean.includes(kw)) return "male";
  }

  // Regla morfológica del español: si termina en 'a', tiende a ser femenino; si termina en 'o', masculino
  if (clean.endsWith("a")) return "female";
  if (clean.endsWith("o")) return "male";

  // Hash determinístico como fallback para nombres neutros
  const hash = clean.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return hash % 2 === 0 ? "female" : "male";
}

/**
 * Obtiene la URL de la cara del avatar adecuada, garantizando correspondencia con el género.
 */
export function getFaceAvatarUrl(
  author: string,
  gender?: AvatarGender,
  customAvatarUrl?: string
): string {
  // 1. Si ya tiene URL personalizada (subida por el usuario o asignada)
  if (customAvatarUrl && customAvatarUrl.trim()) {
    return customAvatarUrl;
  }

  // 2. Si es bot o streamer IA
  const lower = (author || "").toLowerCase();
  if (lower.includes("bot") || lower.includes("ia") || lower.includes("🤖")) {
    return SPECIAL_AVATARS.bot;
  }

  // 3. Determinar género
  const effectiveGender = detectAvatarGender(author, gender);

  // 4. Calcular índice determinístico según el nombre
  const clean = (author || "").replace(/[@_\s]/g, "");
  const hash = clean.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);

  const list = effectiveGender === "female" ? FEMALE_AVATARS : MALE_AVATARS;
  const picked = list[hash % list.length];
  return picked.url;
}

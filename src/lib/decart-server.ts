import { createDecartClient } from "@decartai/sdk";

const DECART_API_BASE = "https://api.decart.ai";

export function getRequiredDecartApiKey(): string {
  const key = process.env.DECART_API_KEY?.trim();
  if (!key || key === "dct_tu_clave_aqui") {
    throw new Error(
      "Falta configurar DECART_API_KEY en el archivo .env.local dentro de spike-v0.",
    );
  }
  return key;
}

export function createServerDecartClient() {
  return createDecartClient({
    apiKey: getRequiredDecartApiKey(),
  });
}

export type DecartAccountStatus = {
  credits: number | null;
  keyQuota: {
    limit: number;
    used: number;
    remaining: number;
    resets_at: string | null;
  } | null;
  quota: {
    limit: number | null;
    active: number | null;
    remaining: number | null;
  } | null;
};

export async function fetchDecartAccountStatus(): Promise<DecartAccountStatus> {
  const apiKey = getRequiredDecartApiKey();
  const headers = { "x-api-key": apiKey };

  const [creditsRes, quotaRes] = await Promise.all([
    fetch(`${DECART_API_BASE}/v1/credits`, { headers, cache: "no-store" }),
    fetch(`${DECART_API_BASE}/v1/realtime/quota`, { headers, cache: "no-store" }),
  ]);

  let credits: number | null = null;
  let keyQuota: DecartAccountStatus["keyQuota"] = null;
  if (creditsRes.ok) {
    const data = (await creditsRes.json()) as {
      credits?: number;
      key_quota?: DecartAccountStatus["keyQuota"];
    };
    credits = typeof data.credits === "number" ? data.credits : null;
    keyQuota = data.key_quota ?? null;
  } else if (creditsRes.status === 401) {
    throw new Error("Decart rechazo la API Key (401). Verifica o rota DECART_API_KEY.");
  }

  let quota: DecartAccountStatus["quota"] = null;
  if (quotaRes.ok) {
    const q = (await quotaRes.json()) as DecartAccountStatus["quota"];
    quota = q;
  }

  return { credits, keyQuota, quota };
}

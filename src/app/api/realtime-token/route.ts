import { NextRequest, NextResponse } from "next/server";
import { createServerDecartClient } from "@/lib/decart-server";
import { ALLOWED_REALTIME_MODEL_IDS, isAllowedRealtimeModel } from "@/lib/models";

const ALLOWED_LOCAL_ORIGINS = new Set([
  "http://localhost:3000",
  "http://127.0.0.1:3000",
]);

function resolveAllowedOrigin(req: NextRequest): string[] {
  const originHeader = req.headers.get("origin")?.trim().toLowerCase();
  if (originHeader && ALLOWED_LOCAL_ORIGINS.has(originHeader)) {
    return [originHeader];
  }
  const host = req.headers.get("host")?.trim().toLowerCase();
  if (host === "localhost:3000" || host === "127.0.0.1:3000") {
    return [`http://${host}`];
  }
  return ["http://localhost:3000", "http://127.0.0.1:3000"];
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      purpose?: "publish" | "subscribe";
      modelId?: string;
      maxSessionDuration?: number;
    };

    const purpose = body.purpose === "subscribe" ? "subscribe" : "publish";
    const rawDuration = Number(body.maxSessionDuration ?? 120);
    const maxSessionDuration = Math.min(300, Math.max(15, Math.round(rawDuration || 120)));

    let allowedModels = ALLOWED_REALTIME_MODEL_IDS;
    if (purpose === "publish" && body.modelId) {
      if (!isAllowedRealtimeModel(body.modelId)) {
        return NextResponse.json(
          { error: `Modelo no permitido en Spike V0: ${body.modelId}` },
          { status: 400 },
        );
      }
      allowedModels = [body.modelId];
    }

    const client = createServerDecartClient();
    const token = await client.tokens.create({
      expiresIn: 25,
      allowedModels,
      allowedOrigins: resolveAllowedOrigin(req),
      constraints: {
        realtime: {
          maxSessionDuration,
        },
      },
      metadata: {
        env: "spike-v0",
        purpose,
      },
    });

    return NextResponse.json({
      apiKey: token.apiKey,
      expiresAt: token.expiresAt,
      maxSessionDuration,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error generando token temporal de Decart.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

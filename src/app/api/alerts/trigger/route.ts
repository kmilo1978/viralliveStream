import { NextRequest, NextResponse } from "next/server";
import { publishAlertEvent, type StreamAlertEvent } from "@/lib/alerts-bus";
import { moderatePromptForDecart } from "@/lib/studio-data";

export async function POST(req: NextRequest) {
  try {
    const configuredSecret = process.env.ALERT_WEBHOOK_SECRET?.trim();
    const body = (await req.json().catch(() => ({}))) as {
      viewerName?: string;
      label?: string;
      prompt?: string;
      durationSec?: number;
      amountCop?: number | null;
      source?: "manual" | "webhook" | "twitch_irc";
      secret?: string;
    };

    if (configuredSecret) {
      const provided =
        req.headers.get("x-webhook-secret")?.trim() || body.secret?.trim() || "";
      if (provided !== configuredSecret) {
        return NextResponse.json(
          { error: "Secreto de webhook invalido en ALERT_WEBHOOK_SECRET." },
          { status: 401 },
        );
      }
    }

    const prompt = String(body.prompt ?? "").trim();
    const mod = moderatePromptForDecart(prompt);
    if (!mod.ok) {
      return NextResponse.json({ error: mod.reason }, { status: 400 });
    }

    const durationSec = Math.min(30, Math.max(5, Math.round(Number(body.durationSec ?? 10))));
    const viewerName = String(body.viewerName ?? "Espectador").trim().slice(0, 48) || "Espectador";
    const label = String(body.label ?? "Efecto en Vivo").trim().slice(0, 48) || "Efecto en Vivo";
    const amountCop =
      typeof body.amountCop === "number" && Number.isFinite(body.amountCop) && body.amountCop > 0
        ? Math.round(body.amountCop)
        : null;

    const event: StreamAlertEvent = {
      id: `alt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      source: body.source === "webhook" || body.source === "twitch_irc" ? body.source : "manual",
      viewerName,
      label,
      prompt,
      durationSec,
      amountCop,
      createdAt: new Date().toISOString(),
    };

    publishAlertEvent(event);
    return NextResponse.json({ ok: true, event });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error procesando alerta.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

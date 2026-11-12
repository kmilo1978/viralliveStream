import { models } from "@decartai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { createServerDecartClient } from "@/lib/decart-server";
import { moderatePromptForDecart, QUEUE_VIDEO_MODELS, type QueueModelId } from "@/lib/studio-data";

const ALLOWED_QUEUE_MODELS = new Set<QueueModelId>(QUEUE_VIDEO_MODELS.map((m) => m.id));
const MAX_VIDEO_BYTES = 200 * 1024 * 1024;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const modelIdRaw = String(formData.get("modelId") ?? "lucy-restyle-2").trim() as QueueModelId;
    const prompt = String(formData.get("prompt") ?? "").trim();
    const enhancePrompt = String(formData.get("enhance_prompt") ?? "true") !== "false";
    const videoFile = formData.get("data");
    const refFile = formData.get("reference_image");

    if (!ALLOWED_QUEUE_MODELS.has(modelIdRaw)) {
      return NextResponse.json(
        { error: `Modelo no permitido para cola asincrona: ${modelIdRaw}` },
        { status: 400 },
      );
    }

    const mod = moderatePromptForDecart(prompt);
    if (!mod.ok) {
      return NextResponse.json({ error: mod.reason }, { status: 400 });
    }

    if (!(videoFile instanceof File) || videoFile.size === 0) {
      return NextResponse.json(
        { error: "Adjunta un archivo de video MP4 o WebM valido." },
        { status: 400 },
      );
    }

    if (videoFile.size > MAX_VIDEO_BYTES) {
      return NextResponse.json(
        { error: "El video supera el limite oficial de 200 MB de Decart Queue API." },
        { status: 400 },
      );
    }

    if (refFile instanceof File && refFile.size > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { error: "La imagen de referencia supera el limite de 10 MB." },
        { status: 400 },
      );
    }

    const client = createServerDecartClient();
    const job = await client.queue.submit({
      model: models.video(modelIdRaw),
      prompt,
      data: videoFile,
      reference_image: refFile instanceof File && refFile.size > 0 ? refFile : undefined,
      enhance_prompt: enhancePrompt,
    });

    return NextResponse.json({
      ok: true,
      job_id: job.job_id,
      status: job.status,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error enviando video a la cola de Decart.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

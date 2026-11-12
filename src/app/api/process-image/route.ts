import { models } from "@decartai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { createServerDecartClient } from "@/lib/decart-server";
import { moderatePromptForDecart } from "@/lib/studio-data";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const prompt = String(formData.get("prompt") ?? "").trim();
    const resolutionRaw = String(formData.get("resolution") ?? "480p");
    const resolution = resolutionRaw === "720p" ? "720p" : "480p";
    const imageFile = formData.get("data");
    const refFile = formData.get("reference_image");

    const mod = moderatePromptForDecart(prompt);
    if (!mod.ok) {
      return NextResponse.json({ error: mod.reason }, { status: 400 });
    }

    if (!(imageFile instanceof File) || imageFile.size === 0) {
      return NextResponse.json(
        { error: "Captura un cuadro de la camara o sube una imagen valida." },
        { status: 400 },
      );
    }

    if (imageFile.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "La imagen supera el limite de 10 MB." },
        { status: 400 },
      );
    }

    const client = createServerDecartClient();
    const outputBlob = await client.process({
      model: models.image("lucy-image-2"),
      prompt,
      data: imageFile,
      reference_image: refFile instanceof File && refFile.size > 0 ? refFile : undefined,
      resolution,
    });

    const buffer = await outputBlob.arrayBuffer();
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": outputBlob.type || "image/png",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error al procesar la imagen con lucy-image-2.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

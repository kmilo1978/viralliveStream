import { NextRequest, NextResponse } from "next/server";
import { createServerDecartClient } from "@/lib/decart-server";

const JOB_ID_RE = /^[a-zA-Z0-9_-]{3,128}$/;

export async function GET(req: NextRequest) {
  try {
    const jobId = req.nextUrl.searchParams.get("jobId")?.trim() ?? "";
    if (!JOB_ID_RE.test(jobId)) {
      return NextResponse.json({ error: "Identificador de trabajo invalido." }, { status: 400 });
    }

    const client = createServerDecartClient();
    const blob = await client.queue.result(jobId);
    const buffer = await blob.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": blob.type || "video/mp4",
        "Content-Disposition": `inline; filename="miplataformastream-${jobId}.mp4"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error descargando el video procesado desde Decart.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

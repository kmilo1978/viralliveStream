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
    const status = await client.queue.status(jobId);

    return NextResponse.json({
      ok: true,
      job_id: status.job_id,
      status: status.status,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error consultando estado del trabajo en Decart.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

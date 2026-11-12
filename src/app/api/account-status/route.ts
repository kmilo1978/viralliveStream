import { NextResponse } from "next/server";
import { fetchDecartAccountStatus } from "@/lib/decart-server";

export async function GET() {
  try {
    const status = await fetchDecartAccountStatus();
    return NextResponse.json({ ok: true, ...status });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "No fue posible consultar el estado en Decart.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";

export async function GET() {
  const configured = Boolean(process.env.ELEVENLABS_API_KEY?.trim());
  const defaultVoiceId = process.env.ELEVENLABS_DEFAULT_VOICE_ID?.trim() || "21m00Tcm4TlvDq8ikWAM";

  return NextResponse.json({
    ok: true,
    provider: "elevenlabs-s2s",
    elevenLabsConfigured: configured,
    defaultVoiceId,
  });
}

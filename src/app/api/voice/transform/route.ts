import { NextRequest, NextResponse } from "next/server";

const VOICE_ID_RE = /^[a-zA-Z0-9_-]{6,64}$/;

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "Falta ELEVENLABS_API_KEY en spike-v0/.env.local para usar Speech-to-Speech IA externo. Mientras tanto puedes usar los efectos de audio locales gratuitos.",
        },
        { status: 501 },
      );
    }

    const formData = await req.formData();
    const audioFile = formData.get("audio");
    const voiceIdRaw =
      String(formData.get("voiceId") ?? "").trim() ||
      process.env.ELEVENLABS_DEFAULT_VOICE_ID?.trim() ||
      "21m00Tcm4TlvDq8ikWAM";

    if (!VOICE_ID_RE.test(voiceIdRaw)) {
      return NextResponse.json({ error: "Voice ID invalido." }, { status: 400 });
    }

    if (!(audioFile instanceof File) || audioFile.size === 0) {
      return NextResponse.json(
        { error: "Graba o adjunta un clip de audio valido." },
        { status: 400 },
      );
    }

    if (audioFile.size > 15 * 1024 * 1024) {
      return NextResponse.json({ error: "El clip de audio supera 15 MB." }, { status: 400 });
    }

    const upstreamForm = new FormData();
    upstreamForm.append("audio", audioFile);
    upstreamForm.append("model_id", "eleven_multilingual_sts_v2");

    const res = await fetch(
      `https://api.elevenlabs.io/v1/speech-to-speech/${encodeURIComponent(voiceIdRaw)}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
        },
        body: upstreamForm,
      },
    );

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return NextResponse.json(
        { error: `ElevenLabs respondio ${res.status}: ${detail || "error externo"}` },
        { status: 502 },
      );
    }

    const audioBuffer = await res.arrayBuffer();
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": res.headers.get("content-type") || "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error transformando voz con Speech-to-Speech.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

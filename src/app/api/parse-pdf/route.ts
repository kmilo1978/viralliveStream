import { NextRequest, NextResponse } from "next/server";
import zlib from "zlib";

function decodePdfString(raw: string): string {
  // Manejo de cadenas hexadecimales <48656C6C6F>
  if (raw.startsWith("<") && raw.endsWith(">")) {
    const hex = raw.slice(1, -1).replace(/\s+/g, "");
    const buf = Buffer.from(hex, "hex");
    if (buf.length >= 2 && buf[0] === 0xfe && buf[1] === 0xff) {
      return buf.toString("utf16le", 2);
    }
    return buf.toString("utf-8");
  }

  // Manejo de secuencias de escape en cadenas literales (...)
  let s = raw;
  if (s.startsWith("(") && s.endsWith(")")) {
    s = s.slice(1, -1);
  }

  // Reemplazar escapes estándar
  s = s
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\b/g, "\b")
    .replace(/\\f/g, "\f")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\\\/g, "\\");

  // Reemplazar escapes octales \ddd
  s = s.replace(/\\([0-7]{1,3})/g, (_, oct) => {
    return String.fromCharCode(parseInt(oct, 8));
  });

  return s;
}

function parsePdfBuffer(buffer: Buffer): {
  text: string;
  numPages: number;
  wordCount: number;
  charCount: number;
  readingTimeMinutes: number;
} {
  const binary = buffer.toString("binary");

  // Contar páginas aproximadas
  const pageMatches = binary.match(/\/Type\s*\/Page[^s]/g);
  const numPages = Math.max(1, pageMatches ? pageMatches.length : 1);

  const textBlocks: string[] = [];

  // Buscar todos los streams en el archivo
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match: RegExpExecArray | null;

  while ((match = streamRegex.exec(binary)) !== null) {
    let content = match[1];

    // Intentar descomprimir con zlib FlateDecode
    try {
      const rawBuf = Buffer.from(content, "binary");
      const decompressed = zlib.inflateSync(rawBuf);
      content = decompressed.toString("latin1");
    } catch {
      // Si no usa zlib o falla la descompresión, se procesa en bruto
    }

    // Extraer bloques de texto BT ... ET
    const btRegex = /BT([\s\S]*?)ET/g;
    let btMatch: RegExpExecArray | null;

    while ((btMatch = btRegex.exec(content)) !== null) {
      const block = btMatch[1];
      const linesInBlock: string[] = [];

      // Procesar Tj: (Texto) Tj o <Hex> Tj
      const tjRegex = /(?:\(([\s\S]*?)\)|<([0-9a-fA-F\s]+)>)\s*Tj/g;
      let tj: RegExpExecArray | null;
      while ((tj = tjRegex.exec(block)) !== null) {
        const val = tj[1] !== undefined ? `(${tj[1]})` : `<${tj[2]}>`;
        const decoded = decodePdfString(val).trim();
        if (decoded) linesInBlock.push(decoded);
      }

      // Procesar TJ: [(Texto) -20 (Mas)] TJ
      const tjArrayRegex = /\[([\s\S]*?)\]\s*TJ/g;
      let tjArr: RegExpExecArray | null;
      while ((tjArr = tjArrayRegex.exec(block)) !== null) {
        const inner = tjArr[1];
        const stringMatches = inner.match(/(?:\((?:\\.|[^()])*\)|<[0-9a-fA-F\s]+>)/g) || [];
        const reconstructed = stringMatches
          .map((m) => decodePdfString(m))
          .join("")
          .trim();
        if (reconstructed) linesInBlock.push(reconstructed);
      }

      if (linesInBlock.length > 0) {
        textBlocks.push(linesInBlock.join(" "));
      }
    }
  }

  // Si los streams no contenían texto (PDF sin compresión o formato alternativo), buscar Tj en todo el archivo
  if (textBlocks.length === 0) {
    const fallbackTj = /(?:\(([\s\S]*?)\)|<([0-9a-fA-F\s]+)>)\s*Tj/g;
    let fb: RegExpExecArray | null;
    while ((fb = fallbackTj.exec(binary)) !== null) {
      const val = fb[1] !== undefined ? `(${fb[1]})` : `<${fb[2]}>`;
      const decoded = decodePdfString(val).trim();
      if (decoded && decoded.length > 1) {
        textBlocks.push(decoded);
      }
    }
  }

  // Limpiar y formatear el texto final con saltos de párrafo limpios
  const fullText = textBlocks
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
    .join("\n\n");

  const words = fullText.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const charCount = fullText.length;
  const readingTimeMinutes = Math.max(1, Math.round(wordCount / 130));

  return {
    text: fullText,
    numPages,
    wordCount,
    charCount,
    readingTimeMinutes,
  };
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No se seleccionó ningún archivo PDF" },
        { status: 400 }
      );
    }

    if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
      return NextResponse.json(
        { success: false, error: "El archivo seleccionado no tiene formato PDF válido" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = parsePdfBuffer(buffer);

    return NextResponse.json({
      success: true,
      filename: file.name,
      ...result,
    });
  } catch (err: any) {
    console.error("Error al procesar PDF en /api/parse-pdf:", err);
    return NextResponse.json(
      {
        success: false,
        error: `Error al procesar el archivo PDF: ${err?.message || "Archivo no legible o dañado"}`,
      },
      { status: 500 }
    );
  }
}

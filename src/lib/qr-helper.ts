import QRCode from "qrcode";

export async function generateQrCodeDataUrl(text: string): Promise<string> {
  if (!text) return "";
  try {
    return await QRCode.toDataURL(text, {
      margin: 1,
      width: 240,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });
  } catch (err) {
    console.error("Error generating QR code:", err);
    return "";
  }
}

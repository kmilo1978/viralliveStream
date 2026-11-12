import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "viralive.app | Estudio de Transmisión en Vivo IA",
  description: "Plataforma responsive de transmisión en vivo con IA, croma en tiempo real, multistream y salida para OBS Studio.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}

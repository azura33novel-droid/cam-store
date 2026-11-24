import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CAM Store | Marketplace Gamer",
  description: "Diamantes, Pokémon, itens e contas.",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}

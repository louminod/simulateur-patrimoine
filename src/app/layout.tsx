import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Simulateur Patrimoine — Intérêts composés multi-enveloppes",
  description: "Simulez l'évolution de votre patrimoine avec SCPI, Assurance Vie et PER",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark">
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Faites fructifier votre épargne — Simulateur Patrimoine",
  description: "Découvrez combien votre épargne pourrait vous rapporter avec SCPI, Assurance Vie et PER",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark">
      <body>{children}</body>
    </html>
  );
}

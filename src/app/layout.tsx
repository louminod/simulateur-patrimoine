import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ThemeToggle } from "@/components/ThemeToggle";
import "./globals.css";

export const metadata: Metadata = {
  title: "Faites fructifier votre épargne — Simulateur Patrimoine",
  description: "Découvrez combien votre épargne pourrait vous rapporter avec SCPI, Assurance Vie et PER",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            var t = localStorage.getItem('theme');
            if (t === 'light') document.documentElement.classList.remove('dark');
            else if (t === 'dark') document.documentElement.classList.add('dark');
            else if (!window.matchMedia('(prefers-color-scheme: dark)').matches) document.documentElement.classList.remove('dark');
          })();
        `}} />
      </head>
      <body>
        <ThemeToggle />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

"use client";

import { memo } from "react";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { fmt } from "@/lib/formatters";

interface HeroProps {
  years: number;
  totalFinal: number;
  totalInvested: number;
}

function HeroInner({ years, totalFinal, totalInvested }: HeroProps) {
  return (
    <section className="hero-gradient rounded-b-3xl px-6 pt-10 pb-8 md:pt-14 md:pb-10 -mx-4 md:-mx-8 mb-8">
      <div className="max-w-2xl mx-auto text-center">
        <p className="text-sm text-[var(--accent2)] font-medium tracking-wide mb-3">Découvrez combien votre épargne pourrait vous rapporter</p>
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-2">
          Faites fructifier<br />votre épargne
        </h1>
        <p className="text-[var(--muted)] text-sm md:text-base mt-3 mb-8">
          Simulez votre patrimoine avec les meilleures enveloppes d&apos;investissement
        </p>
        <div className="bg-white/[0.05] backdrop-blur-sm rounded-2xl border border-white/10 p-6 md:p-8">
          <p className="text-xs text-[var(--muted)] uppercase tracking-widest mb-2">Votre patrimoine dans {years} ans</p>
          <AnimatedNumber value={totalFinal} className="text-4xl md:text-6xl font-black bg-gradient-to-r from-[var(--accent)] via-[var(--accent2)] to-[var(--green)] bg-clip-text text-transparent animate-in" />
          <div className="flex items-center justify-center gap-4 mt-4 flex-wrap">
            <span className="text-sm text-[var(--green)] font-semibold">+{fmt(totalFinal - totalInvested)} de gains</span>
            <span className="text-xs text-[var(--muted)]">•</span>
            <span className="text-sm text-[var(--muted)]">pour {fmt(totalInvested)} investis</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export const Hero = memo(HeroInner);

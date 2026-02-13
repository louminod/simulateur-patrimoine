"use client";

import { memo } from "react";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { fmt } from "@/lib/formatters";
import { LIVRET_RATE } from "@/lib/constants";
import type { AggregatedResults } from "@/lib/types";

interface ComparisonBlockProps {
  results: AggregatedResults;
  perEnabled: boolean;
  perTmi: number;
}

function ComparisonBlockInner({ results, perEnabled, perTmi }: ComparisonBlockProps) {
  const totalFinal = results.totalFinal;
  const totalInvested = results.totalInvested;
  const livretCapital = results.livret.capital;
  const livretGains = results.livret.gains;
  const perSavings = results.perSavings;
  const difference = totalFinal - livretCapital;
  const differencePct = livretCapital > 0 ? ((difference / livretCapital) * 100).toFixed(0) : "0";

  return (
    <section className="mb-8">
      <div className="relative rounded-3xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/20 via-purple-600/10 to-[var(--accent2)]/15" />
        <div className="relative border border-[var(--accent)]/20 rounded-3xl p-6 md:p-10">
          <h2 className="text-center text-xs font-semibold text-[var(--muted)] uppercase tracking-[0.2em] mb-8">
            Pourquoi investir fait la différence
          </h2>
          <div className="grid md:grid-cols-3 gap-6 items-center">
            <div className="text-center p-6 rounded-2xl bg-white/[0.03] border border-white/5">
              <p className="text-2xl mb-2">💤</p>
              <p className="text-xs text-[var(--muted)] mb-1">Livret bancaire à {LIVRET_RATE}%</p>
              <p className="text-sm text-[var(--muted)] mb-2">Votre argent dort</p>
              <AnimatedNumber value={livretCapital} className="text-2xl md:text-3xl font-bold text-gray-400" />
              <p className="text-xs text-gray-600 mt-2">dont {fmt(livretGains)} d&apos;intérêts</p>
            </div>
            <div className="text-center">
              <div className="hidden md:block text-4xl text-[var(--muted)] mb-3">→</div>
              <div className="md:hidden text-2xl text-[var(--muted)] mb-3 rotate-90">→</div>
              <div className="bg-[var(--green)]/10 border border-[var(--green)]/25 rounded-2xl p-5">
                <p className="text-xs text-[var(--green)] font-medium mb-2">Gains supplémentaires</p>
                <AnimatedNumber value={difference} className="text-3xl md:text-5xl font-black text-[var(--green)]" />
                <p className="text-xl font-bold text-[var(--green)] mt-1">+{differencePct}%</p>
              </div>
            </div>
            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-[var(--accent)]/10 to-[var(--accent2)]/10 border border-[var(--accent)]/25">
              <p className="text-2xl mb-2">🚀</p>
              <p className="text-xs text-[var(--accent2)] mb-1">Stratégie patrimoniale</p>
              <p className="text-sm text-white/70 mb-2">Patrimoine estimé</p>
              <AnimatedNumber value={totalFinal} className="text-2xl md:text-3xl font-bold text-white" />
              <p className="text-xs text-[var(--accent)]/70 mt-2">dont {fmt(totalFinal - totalInvested)} de gains</p>
            </div>
          </div>
          {perEnabled && perSavings > 0 && (
            <div className="mt-6 text-center">
              <span className="inline-flex items-center gap-2 bg-[var(--orange)]/10 border border-[var(--orange)]/20 rounded-full px-5 py-2.5 text-sm">
                <span>🎯</span>
                <span className="text-[var(--orange)] font-semibold">Économie d&apos;impôt PER : {fmt(perSavings)}</span>
                <span className="text-xs text-[var(--muted)]">(TMI {perTmi}%)</span>
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export const ComparisonBlock = memo(ComparisonBlockInner);

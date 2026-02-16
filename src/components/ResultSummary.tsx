"use client";

import { memo } from "react";
import { fmt } from "@/lib/formatters";

interface ResultSummaryProps {
  monthlyEffort: number;
  totalFinal: number;
  monthlyIncome: number;
  hasCreditSCPI: boolean;
}

function ResultSummaryInner({ monthlyEffort, totalFinal, monthlyIncome, hasCreditSCPI }: ResultSummaryProps) {
  if (monthlyEffort <= 0 && monthlyIncome <= 0) return null;
  const ratio = totalFinal / (monthlyEffort > 0 ? monthlyEffort * 12 : 1);

  return (
    <section className="mb-8">
      <h2 className="text-sm font-semibold text-[var(--text)] mb-4">🎯 Votre résultat</h2>
      <div className="grid md:grid-cols-2 gap-4">
        {/* Effort réel vs résultat */}
        {monthlyEffort > 0 && (
          <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-5 text-center flex flex-col justify-center">
            <p className="text-xs text-[var(--muted)] uppercase tracking-widest mb-3">Effort réel vs résultat</p>
            <p className="text-[var(--text)] text-sm md:text-base leading-relaxed">
              Pour <span className="font-bold text-[var(--accent2)]">{fmt(Math.round(monthlyEffort))}/mois</span>,
              vous constituez <span className="font-bold text-[var(--green)]">{fmt(Math.round(totalFinal))}</span>
            </p>
            <div className="mt-3 inline-flex items-center justify-center gap-2 bg-[var(--green)]/10 border border-[var(--green)]/20 rounded-full px-4 py-1.5 mx-auto">
              <span className="text-sm">✨</span>
              <span className="text-[var(--green)] font-semibold text-xs">
                Épargne multipliée par {ratio.toFixed(1)}x
              </span>
            </div>
          </div>
        )}

        {/* Revenus passifs */}
        {monthlyIncome > 0 && (
          <div className="relative rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-amber-500/10" />
            <div className="relative border border-amber-500/20 rounded-2xl p-5 text-center flex flex-col justify-center h-full">
              <p className="text-2xl mb-2">💰</p>
              <p className="text-xs text-[var(--muted)] uppercase tracking-widest mb-2">Revenus passifs à terme</p>
              <p className="text-2xl md:text-4xl font-black text-amber-400">
                {fmt(Math.round(monthlyIncome))}<span className="text-base md:text-xl font-semibold text-amber-400/70">/mois</span>
              </p>
              <p className="text-xs text-[var(--muted)] mt-2">
                {hasCreditSCPI ? "Loyers SCPI après remboursement du crédit" : "Loyers SCPI perçus chaque mois"}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export const ResultSummary = memo(ResultSummaryInner);

"use client";

import { memo } from "react";
import { fmt } from "@/lib/formatters";

interface EffortSummaryProps {
  monthlyEffort: number;
  totalFinal: number;
}

function EffortSummaryInner({ monthlyEffort, totalFinal }: EffortSummaryProps) {
  if (monthlyEffort <= 0) return null;
  const ratio = totalFinal / (monthlyEffort > 0 ? monthlyEffort * 12 : 1);
  return (
    <section className="mb-8">
      <div className="bg-[var(--card)] rounded-2xl border border-white/5 p-6 md:p-8 text-center">
        <p className="text-xs text-[var(--muted)] uppercase tracking-widest mb-4">Effort réel vs résultat</p>
        <p className="text-white text-base md:text-lg leading-relaxed">
          Pour <span className="font-bold text-[var(--accent2)]">{fmt(Math.round(monthlyEffort))}/mois</span> d&apos;effort,
          vous constituez un patrimoine de <span className="font-bold text-[var(--green)]">{fmt(Math.round(totalFinal))}</span>
        </p>
        <div className="mt-4 inline-flex items-center gap-2 bg-[var(--green)]/10 border border-[var(--green)]/20 rounded-full px-5 py-2">
          <span className="text-lg">✨</span>
          <span className="text-[var(--green)] font-semibold text-sm">
            Votre épargne annuelle est multipliée par {ratio.toFixed(1)}x
          </span>
        </div>
      </div>
    </section>
  );
}

export const EffortSummary = memo(EffortSummaryInner);

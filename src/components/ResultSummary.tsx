"use client";

import { memo } from "react";
import { fmt } from "@/lib/formatters";
import type { BlendedReturnData } from "@/lib/types";

interface ResultSummaryProps {
  monthlyEffort: number;
  totalFinal: number;
  monthlyIncome: number;
  hasCreditSCPI: boolean;
  blendedReturn: BlendedReturnData;
}

function ResultSummaryInner({ monthlyEffort, totalFinal, monthlyIncome, hasCreditSCPI, blendedReturn }: ResultSummaryProps) {
  if (monthlyEffort <= 0 && monthlyIncome <= 0 && blendedReturn.contributions.length === 0) return null;
  const ratio = totalFinal / (monthlyEffort > 0 ? monthlyEffort * 12 : 1);

  return (
    <section className="mb-8">
      <h2 className="text-sm font-semibold text-white mb-4">🎯 Votre résultat</h2>
      
      {/* Rendement moyen pondéré */}
      {blendedReturn.contributions.length > 0 && (
        <div className="mb-6">
          <div className="bg-gradient-to-r from-emerald-500/10 via-green-500/5 to-emerald-500/10 rounded-2xl border border-emerald-500/20 p-6">
            <div className="text-center mb-4">
              <h3 className="text-sm font-semibold text-emerald-400 mb-2">📊 Rendement moyen pondéré de votre stratégie</h3>
              <div className="text-3xl font-black text-emerald-300">
                {blendedReturn.overallRate.toFixed(1)}%
                <span className="text-base font-semibold text-emerald-400/70 ml-1">net/an</span>
              </div>
            </div>
            
            {/* Breakdown par enveloppe */}
            <div className="space-y-2">
              {blendedReturn.contributions.map((contrib, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm">
                  <span className="text-gray-300">{contrib.envelope}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400">{contrib.rate.toFixed(1)}%</span>
                    <span className="text-gray-500 text-xs">
                      ({(contrib.weight / blendedReturn.contributions.reduce((s, c) => s + c.weight, 0) * 100).toFixed(0)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* SCPI Crédit phases si applicable */}
            {blendedReturn.scpiCreditPhases && (
              <div className="mt-4 pt-3 border-t border-emerald-500/20">
                <p className="text-xs text-gray-400 mb-2">SCPI Crédit - Rendement par phase :</p>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="text-center">
                    <span className="text-orange-400">Phase 1</span>
                    <div className="font-semibold">{blendedReturn.scpiCreditPhases.duringCredit.toFixed(1)}%</div>
                    <span className="text-gray-500">Pendant crédit</span>
                  </div>
                  <div className="text-center">
                    <span className="text-green-400">Phase 2</span>
                    <div className="font-semibold">{blendedReturn.scpiCreditPhases.afterCredit.toFixed(1)}%</div>
                    <span className="text-gray-500">Après remboursement</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {/* Effort réel vs résultat */}
        {monthlyEffort > 0 && (
          <div className="bg-[var(--card)] rounded-2xl border border-white/5 p-5 text-center flex flex-col justify-center">
            <p className="text-xs text-[var(--muted)] uppercase tracking-widest mb-3">Effort réel vs résultat</p>
            <p className="text-white text-sm md:text-base leading-relaxed">
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

"use client";

import { memo, useMemo } from "react";
import type { SCPICreditConfig } from "@/lib/types";
import { simulateSCPICredit } from "@/lib/simulation";
import { fmt } from "@/lib/formatters";

interface SCPICreditDetailProps {
  config: SCPICreditConfig;
  years: number;
}

function SCPICreditDetailInner({ config, years }: SCPICreditDetailProps) {
  const cr = useMemo(() => simulateSCPICredit(config, years), [config, years]);

  return (
    <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl border border-purple-500/20 p-6 mb-8">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">🏦</span>
        <h3 className="text-sm font-semibold text-purple-300">Détail SCPI à crédit</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center mb-4">
        <div><p className="text-xs text-[var(--muted)]">Parts acquises</p><p className="text-lg font-bold">{fmt(cr.netShares)}</p></div>
        <div><p className="text-xs text-[var(--muted)]">Mensualité crédit</p><p className="text-lg font-bold text-red-400">{fmt(cr.monthlyPayment)}/mois</p></div>
        <div><p className="text-xs text-[var(--muted)]">Revenus SCPI</p><p className="text-lg font-bold text-[var(--green)]">+{fmt(cr.monthlyDividend)}/mois</p></div>
      </div>
      <div className="bg-[var(--overlay-strong)] rounded-xl p-4 flex flex-col items-center gap-1">
        <p className="text-xs text-[var(--muted)]">Effort mensuel réel</p>
        <p className={`text-2xl font-bold ${cr.cashflow >= 0 ? "text-[var(--green)]" : "text-[var(--orange)]"}`}>{cr.cashflow >= 0 ? "+" : "-"}{fmt(Math.abs(cr.cashflow))}/mois</p>
        <p className={`text-[11px] mt-1 ${cr.cashflow >= 0 ? "text-emerald-400" : "text-orange-300"}`}>
          {cr.cashflow >= 0 ? "🎉 Les loyers couvrent le crédit — vous gagnez de l'argent !" : "💡 Effort à fournir en complément des loyers perçus"}
        </p>
      </div>
      <div className="mt-4 text-center">
        <p className="text-xs text-[var(--muted)]">Patrimoine SCPI estimé à {years} ans</p>
        <p className="text-2xl font-bold text-[var(--green)]">{fmt(cr.capital)}</p>
      </div>
      {years > config.loanYears && (
        <p className="text-xs text-purple-300/70 mt-4">
          💡 Après {config.loanYears} ans, plus de mensualités ! Vous percevez environ {fmt(cr.monthlyDividend)}/mois de revenus passifs.
        </p>
      )}
    </div>
  );
}

export const SCPICreditDetail = memo(SCPICreditDetailInner);

"use client";

import { memo } from "react";
import { fmt } from "@/lib/formatters";

interface PassiveIncomeProps {
  monthlyIncome: number;
}

function PassiveIncomeInner({ monthlyIncome }: PassiveIncomeProps) {
  if (monthlyIncome <= 0) return null;
  return (
    <section className="mb-8">
      <div className="relative rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-amber-500/10" />
        <div className="relative border border-amber-500/20 rounded-2xl p-6 md:p-8 text-center">
          <p className="text-3xl mb-3">💰</p>
          <p className="text-xs text-[var(--muted)] uppercase tracking-widest mb-2">Revenus passifs à terme</p>
          <p className="text-3xl md:text-5xl font-black text-amber-400">
            {fmt(Math.round(monthlyIncome))}<span className="text-lg md:text-2xl font-semibold text-amber-400/70">/mois</span>
          </p>
          <p className="text-sm text-[var(--muted)] mt-3">
            Loyers SCPI perçus après remboursement complet du crédit
          </p>
        </div>
      </div>
    </section>
  );
}

export const PassiveIncome = memo(PassiveIncomeInner);

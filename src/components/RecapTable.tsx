"use client";

import { memo } from "react";
import { fmt } from "@/lib/formatters";
import { adjustForInflation } from "@/lib/simulation";
import type { AggregatedResults } from "@/lib/types";

interface RecapTableProps {
  results: AggregatedResults;
  showRealTerms?: boolean;
  years?: number;
}

function RecapTableInner({ results, showRealTerms = false, years = 25 }: RecapTableProps) {
  const adj = (v: number) => showRealTerms ? adjustForInflation(v, years) : v;
  return (
    <section className="mb-8">
      <div className="bg-[var(--card)] rounded-2xl border border-white/5 p-5 md:p-6 overflow-x-auto">
        <h2 className="text-sm font-semibold mb-4 text-white">📋 Détail par enveloppe</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[var(--muted)] text-xs border-b border-white/5">
              <th className="text-left py-3">Enveloppe</th>
              <th className="text-right py-3">Investi personnellement</th>
              <th className="text-right py-3">Patrimoine</th>
              <th className="text-right py-3">Gains nets*</th>
            </tr>
          </thead>
          <tbody>
            {results.sims.map((s) => (
              <tr key={s.label} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                <td className="py-3.5 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                  <span className="text-white/90">{s.label}</span>
                </td>
                <td className="text-right text-[var(--muted)]">{fmt(adj(s.result.totalInvested))}</td>
                <td className="text-right font-medium text-white">{fmt(adj(s.result.capital))}</td>
                <td className="text-right text-[var(--green)] font-medium">{fmt(adj(s.result.netGains))}</td>
              </tr>
            ))}
            <tr className="font-semibold">
              <td className="py-3.5 text-white">🚀 Total stratégie</td>
              <td className="text-right text-white">{fmt(adj(results.totalInvested))}</td>
              <td className="text-right text-[var(--green)]">{fmt(adj(results.totalFinal))}</td>
              <td className="text-right text-[var(--green)]">{fmt(adj(results.totalNet))}</td>
            </tr>
          </tbody>
        </table>
        <p className="text-xs text-[var(--muted)] mt-3 leading-relaxed">
          * Gains nets = Patrimoine estimé − Capital investi. Simulation basée sur l&apos;hypothèse qu&apos;aucun rachat n&apos;est effectué. La fiscalité (prélèvements sociaux, impôt sur le revenu) ne s&apos;applique qu&apos;au moment du retrait des fonds.
        </p>
      </div>
    </section>
  );
}

export const RecapTable = memo(RecapTableInner);

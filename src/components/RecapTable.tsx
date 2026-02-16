"use client";

import { memo } from "react";
import { fmt } from "@/lib/formatters";
import { computeTaxation } from "@/lib/simulation";
import type { AggregatedResults } from "@/lib/types";

interface RecapTableProps {
  results: AggregatedResults;
  years: number;
}

function RecapTableInner({ results, years }: RecapTableProps) {
  const taxRows = results.sims.map((s) => {
    if (s.type === "av" || s.type === "per") {
      const tmi = s.type === "per" ? (s.result.perTaxSavings > 0 ? Math.round(s.result.perTaxSavings / s.result.totalInvested * 100) : 30) : 30;
      return computeTaxation(s.type, s.result.grossGains, s.result.totalInvested, years, tmi);
    }
    return null;
  });

  return (
    <section className="mb-8">
      <div className="bg-[var(--card)] rounded-2xl border border-white/5 p-5 md:p-6 overflow-x-auto">
        <h2 className="text-sm font-semibold mb-4 text-white">📋 Détail par enveloppe</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[var(--muted)] text-xs border-b border-white/5">
              <th className="text-left py-3">Enveloppe</th>
              <th className="text-right py-3 hidden sm:table-cell">Investi</th>
              <th className="text-right py-3">Patrimoine</th>
              <th className="text-right py-3">Gains bruts</th>
              <th className="text-right py-3 hidden sm:table-cell">Fiscalité</th>
              <th className="text-right py-3">Gains nets</th>
            </tr>
          </thead>
          <tbody>
            {results.sims.map((s, i) => {
              const tax = taxRows[i];
              const displayTax = tax ? tax.tax : 0;
              const displayNet = tax ? tax.netGains : s.result.netGains;
              return (
                <tr key={s.label} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
                    <span className="text-white/90 text-xs sm:text-sm">{s.label}</span>
                  </td>
                  <td className="text-right text-[var(--muted)] hidden sm:table-cell">{fmt(s.result.totalInvested)}</td>
                  <td className="text-right font-medium text-white">{fmt(s.result.capital)}</td>
                  <td className="text-right text-[var(--green)]">{fmt(s.result.grossGains)}</td>
                  <td className="text-right text-red-400 hidden sm:table-cell">
                    {tax ? `-${fmt(displayTax)}` : "—"}
                  </td>
                  <td className="text-right text-[var(--green)] font-medium">
                    {tax ? fmt(displayNet) : fmt(s.result.netGains)}
                  </td>
                </tr>
              );
            })}
            <tr className="font-semibold">
              <td className="py-3.5 text-white">🚀 Total</td>
              <td className="text-right text-white hidden sm:table-cell">{fmt(results.totalInvested)}</td>
              <td className="text-right text-[var(--green)]">{fmt(results.totalFinal)}</td>
              <td className="text-right text-[var(--green)]">{fmt(results.totalFinal - results.totalInvested)}</td>
              <td className="text-right text-red-400 hidden sm:table-cell">
                -{fmt(taxRows.reduce((acc, t) => acc + (t?.tax ?? 0), 0))}
              </td>
              <td className="text-right text-[var(--green)]">
                {fmt(results.sims.reduce((acc, s, i) => {
                  const tax = taxRows[i];
                  return acc + (tax ? tax.netGains : s.result.netGains);
                }, 0))}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Taxation details for AV/PER */}
        {taxRows.some(t => t !== null) && (
          <div className="mt-4 space-y-2">
            {results.sims.map((s, i) => {
              const tax = taxRows[i];
              if (!tax) return null;
              return (
                <div key={s.label} className="flex items-start gap-2 text-xs text-[var(--muted)]">
                  <span className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{ background: s.color }} />
                  <span><strong className="text-white/70">{s.label}</strong> : {tax.details}</span>
                </div>
              );
            })}
            {results.sims.some(s => s.type === "per") && (
              <p className="text-xs text-[var(--orange)] mt-1">
                🎯 PER : l&apos;économie d&apos;impôt à l&apos;entrée ({fmt(results.perSavings)}) compense en partie la fiscalité à la sortie.
              </p>
            )}
          </div>
        )}

        <p className="text-[10px] text-[var(--muted)] mt-3 leading-relaxed">
          ⚠️ Estimation simplifiée de la fiscalité. Les montants réels dépendent de votre situation personnelle (situation familiale, autres revenus, etc.). Consultez un conseiller fiscal pour une analyse personnalisée.
        </p>
      </div>
    </section>
  );
}

export const RecapTable = memo(RecapTableInner);

"use client";

import { memo, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer, Legend,
} from "recharts";
import { fmt } from "@/lib/formatters";

interface FeeComparisonProps {
  initialCapital: number;
  monthlyContribution: number;
  years: number;
}

function simulateCurve(
  initialCapital: number,
  monthlyContribution: number,
  years: number,
  entryFeesPct: number,
  mgmtFeesPct: number,
  ratePct: number,
): number[] {
  const months = years * 12;
  const monthlyRate = ratePct / 100 / 12;
  const mgmtMonthly = mgmtFeesPct / 100 / 12;
  let capital = initialCapital * (1 - entryFeesPct / 100);
  const points: number[] = [capital];
  for (let m = 1; m <= months; m++) {
    const contrib = monthlyContribution * (1 - entryFeesPct / 100);
    capital += contrib;
    capital += capital * monthlyRate;
    capital *= (1 - mgmtMonthly);
    points.push(capital);
  }
  return points;
}

const fees = [
  { label: "Frais d'entrée versement initial", banker: "2%", solution: "4,8%" },
  { label: "Frais d'entrée versements programmés", banker: "2%", solution: "4,8%" },
  { label: "Frais de gestion annuels", banker: "1,5%", solution: "1%" },
  { label: "Taux de rentabilité", banker: "2%", solution: "4,8%" },
];

function FeeComparisonInner({ initialCapital, monthlyContribution, years }: FeeComparisonProps) {
  const chartData = useMemo(() => {
    const bankerCurve = simulateCurve(initialCapital, monthlyContribution, years, 2, 1.5, 2);
    const solutionCurve = simulateCurve(initialCapital, monthlyContribution, years, 4.8, 1, 4.8);
    const months = years * 12;
    return Array.from({ length: months + 1 }, (_, i) => ({
      month: i,
      "Votre banquier": Math.round(bankerCurve[i]),
      "Ma solution (Finzzle)": Math.round(solutionCurve[i]),
    }));
  }, [initialCapital, monthlyContribution, years]);

  return (
    <section className="mb-8">
      <div className="bg-[var(--card)] rounded-2xl border border-white/5 p-4 md:p-6">
        <h2 className="text-sm font-semibold mb-4 text-white">⚖️ Comparatif des frais — Banquier vs Ma solution</h2>

        {/* Fee table */}
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-2 text-[var(--muted)] font-medium"></th>
                <th className="text-center py-2 text-red-400 font-semibold">Votre banquier</th>
                <th className="text-center py-2 text-emerald-400 font-semibold">Ma solution (Finzzle)</th>
              </tr>
            </thead>
            <tbody>
              {fees.map((f) => (
                <tr key={f.label} className="border-b border-white/5">
                  <td className="py-2.5 text-[var(--muted)]">{f.label}</td>
                  <td className="py-2.5 text-center text-red-400 font-medium">{f.banker}</td>
                  <td className="py-2.5 text-center text-emerald-400 font-medium">{f.solution}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Comparison chart */}
        <p className="text-[11px] text-[var(--muted)] mb-3">Valeur de rachat sur {years} ans</p>
        <div className="h-[220px] md:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
              <XAxis
                dataKey="month"
                tickFormatter={(m: number) => `${Math.floor(m / 12)}a`}
                stroke="#4a4a6a" fontSize={9}
                interval={Math.max(1, Math.floor((years * 12) / 6))}
              />
              <YAxis
                stroke="#4a4a6a" fontSize={9}
                tickFormatter={(v: number) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : `${(v / 1000).toFixed(0)}k`}
                width={45}
              />
              <RTooltip
                contentStyle={{ background: "#16161f", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", fontSize: "12px" }}
                formatter={(value: unknown) => fmt(Number(value))}
                labelFormatter={(m: unknown) => `Année ${(Number(m) / 12).toFixed(1)}`}
              />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Line type="monotone" dataKey="Votre banquier" stroke="#f87171" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Ma solution (Finzzle)" stroke="#34d399" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}

export const FeeComparison = memo(FeeComparisonInner);

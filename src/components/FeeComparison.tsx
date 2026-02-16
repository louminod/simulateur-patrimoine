"use client";

import { memo, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer, Legend, ReferenceLine,
} from "recharts";
import { fmt } from "@/lib/formatters";

interface FeeComparisonProps {
  label: string;
  icon: string;
  initialCapital: number;
  monthlyContribution: number;
  years: number;
  gradient: string;
  borderColor: string;
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

interface FeeRow {
  label: string;
  banker: string;
  solution: string;
  /** "advantage" = our value is better, "disadvantage" = theirs is better, "neutral" = same */
  verdict: "advantage" | "disadvantage" | "neutral";
}

const fees: FeeRow[] = [
  { label: "Frais d'entrée versement initial", banker: "2%", solution: "4,8%", verdict: "disadvantage" },
  { label: "Frais d'entrée versements programmés", banker: "2%", solution: "4,8%", verdict: "disadvantage" },
  { label: "Frais de gestion annuels", banker: "1,5%", solution: "1%", verdict: "advantage" },
  { label: "Taux de rentabilité", banker: "2%", solution: "4%", verdict: "advantage" },
];

const verdictColor: Record<FeeRow["verdict"], string> = {
  advantage: "text-emerald-400",
  disadvantage: "text-amber-400",
  neutral: "text-white",
};

const COMPARISON_YEARS = 15;

function FeeComparisonInner({ label, icon, initialCapital, monthlyContribution, years: _years, gradient, borderColor }: FeeComparisonProps) {
  const years = COMPARISON_YEARS;
  const chartData = useMemo(() => {
    const bankerCurve = simulateCurve(initialCapital, monthlyContribution, years, 2, 1.5, 2);
    const solutionCurve = simulateCurve(initialCapital, monthlyContribution, years, 4.8, 1, 4);
    const months = years * 12;
    return Array.from({ length: months + 1 }, (_, i) => ({
      month: i,
      "Votre banque": Math.round(bankerCurve[i]),
      "Notre solution": Math.round(solutionCurve[i]),
    }));
  }, [initialCapital, monthlyContribution, years]);

  const bankerFinal = chartData[chartData.length - 1]["Votre banque"];
  const solutionFinal = chartData[chartData.length - 1]["Notre solution"];
  const diff = solutionFinal - bankerFinal;

  // Find crossover month (when our solution surpasses the bank)
  const crossoverMonth = useMemo(() => {
    for (let i = 1; i < chartData.length; i++) {
      if (chartData[i]["Notre solution"] >= chartData[i]["Votre banque"]) return i;
    }
    return null;
  }, [chartData]);
  const crossoverYears = crossoverMonth !== null ? (crossoverMonth / 12) : null;

  return (
    <div className={`bg-[var(--card)] rounded-2xl border ${borderColor} p-4 md:p-6`}>
      <h3 className="text-sm font-semibold mb-3 text-white">{icon} Comparatif {label} — Banque vs Notre solution</h3>

      {/* Explanation */}
      <div className={`bg-gradient-to-r ${gradient} border ${borderColor} rounded-xl px-3 py-2.5 mb-4`}>
        <p className="text-[11px] text-white/80 leading-relaxed">
          💡 Des frais d&apos;entrée plus élevés, mais un <strong className="text-white">rendement supérieur</strong> et des <strong className="text-white">frais de gestion réduits</strong> qui font toute la différence sur le long terme.
        </p>
      </div>

      {/* Fee table */}
      <div className="overflow-x-auto mb-4">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-2 text-[var(--muted)] font-medium"></th>
              <th className="text-center py-2 text-red-400 font-semibold">Votre banque</th>
              <th className="text-center py-2 font-semibold text-white">Notre solution</th>
            </tr>
          </thead>
          <tbody>
            {fees.map((f) => (
              <tr key={f.label} className="border-b border-white/5">
                <td className="py-2.5 text-[var(--muted)] max-w-[120px] sm:max-w-none">{f.label}</td>
                <td className="py-2.5 text-center text-red-400 font-medium">{f.banker}</td>
                <td className={`py-2.5 text-center font-medium ${verdictColor[f.verdict]}`}>{f.solution}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Result highlight */}
      <div className="flex items-center justify-center gap-3 mb-4 py-3 rounded-xl bg-white/[0.03] border border-white/5">
        <div className="text-center">
          <p className="text-[10px] text-[var(--muted)]">Banque à {years} ans</p>
          <p className="text-sm font-bold text-red-400">{fmt(bankerFinal)}</p>
        </div>
        <span className="text-[var(--muted)]">vs</span>
        <div className="text-center">
          <p className="text-[10px] text-[var(--muted)]">Notre solution à {years} ans</p>
          <p className="text-sm font-bold text-emerald-400">{fmt(solutionFinal)}</p>
        </div>
        <div className="text-center ml-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-1.5">
          <p className="text-xs font-bold text-emerald-400">+{fmt(diff)}</p>
        </div>
      </div>

      {/* Crossover callout */}
      {crossoverYears !== null && (
        <div className="mb-4 bg-white/[0.03] border border-white/5 rounded-xl px-3 py-2.5">
          <p className="text-[11px] text-[var(--muted)] leading-relaxed">
            📉 La banque est en tête les <strong className="text-red-400">{crossoverYears < 1 ? `${crossoverMonth} premiers mois` : `${crossoverYears.toFixed(1).replace('.0', '')} premières années`}</strong> grâce à des frais d&apos;entrée plus faibles.
            Mais dès <strong className="text-emerald-400">{crossoverYears < 1 ? `le mois ${crossoverMonth}` : `l'année ${crossoverYears.toFixed(1).replace('.0', '')}`}</strong>, notre rendement supérieur et nos frais de gestion réduits inversent la tendance — et l&apos;écart ne cesse de grandir. 🚀
          </p>
        </div>
      )}

      {/* Comparison chart */}
      <p className="text-[11px] text-[var(--muted)] mb-3">Évolution comparative sur {years} ans</p>
      <div className="h-[200px] md:h-[280px]">
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
            {crossoverMonth !== null && (
              <ReferenceLine
                x={crossoverMonth}
                stroke="#fbbf24"
                strokeDasharray="4 4"
                strokeOpacity={0.7}
                label={{ value: `↑ Inversion`, position: "top", fill: "#fbbf24", fontSize: 10, fontWeight: 600 }}
              />
            )}
            <Line type="monotone" dataKey="Votre banque" stroke="#f87171" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Notre solution" stroke="#34d399" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export const FeeComparison = memo(FeeComparisonInner);

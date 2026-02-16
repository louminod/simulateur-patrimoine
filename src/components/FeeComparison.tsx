"use client";

import { memo, useMemo, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer, Legend, ReferenceLine,
} from "recharts";
import { fmt } from "@/lib/formatters";
import { simulateFeeCurves } from "@/lib/simulation";
import {
  BANK_ENTRY_FEES, BANK_MGMT_FEES, BANK_RATE,
  SOLUTION_ENTRY_FEES, SOLUTION_MGMT_FEES, SOLUTION_RATE,
  FEE_COMPARISON_YEARS,
} from "@/lib/constants";

interface EnvelopeInput {
  label: string;
  icon: string;
  initialCapital: number;
  monthlyContribution: number;
}

interface FeeComparisonProps {
  envelopes: EnvelopeInput[];
}

interface FeeRow {
  label: string;
  banker: string;
  solution: string;
  verdict: "advantage" | "disadvantage" | "neutral";
}

const fees: FeeRow[] = [
  { label: "Frais d'entrée versement initial", banker: `${BANK_ENTRY_FEES}%`, solution: `${SOLUTION_ENTRY_FEES}%`, verdict: "disadvantage" },
  { label: "Frais d'entrée versements programmés", banker: `${BANK_ENTRY_FEES}%`, solution: `${SOLUTION_ENTRY_FEES}%`, verdict: "disadvantage" },
  { label: "Frais de gestion annuels", banker: `${BANK_MGMT_FEES}%`, solution: `${SOLUTION_MGMT_FEES}%`, verdict: "advantage" },
  { label: "Taux de rentabilité", banker: `${BANK_RATE}%`, solution: `${SOLUTION_RATE}%`, verdict: "advantage" },
];

const verdictColor: Record<FeeRow["verdict"], string> = {
  advantage: "text-emerald-400",
  disadvantage: "text-amber-400",
  neutral: "text-white",
};

function ComparisonChart({ id, data, crossoverMonth }: {
  id: string;
  data: { month: number; "Votre banque": number; "Notre solution": number }[];
  crossoverMonth: number | null;
}) {
  const years = FEE_COMPARISON_YEARS;
  return (
    <div className="h-[220px] md:h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 25, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`gSolution-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#22c55e" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id={`gBanque-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f87171" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#f87171" stopOpacity={0.02} />
            </linearGradient>
          </defs>
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
              label={{ value: "↑ Inversion", position: "top", fill: "#fbbf24", fontSize: 10, fontWeight: 600 }}
            />
          )}
          <Area type="monotone" dataKey="Votre banque" stroke="#f87171" fill={`url(#gBanque-${id})`} strokeWidth={2} />
          <Area type="monotone" dataKey="Notre solution" stroke="#34d399" fill={`url(#gSolution-${id})`} strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function computeComparisonData(initialCapital: number, monthlyContribution: number) {
  const years = FEE_COMPARISON_YEARS;
  const { bankCurve, solutionCurve } = simulateFeeCurves(initialCapital, monthlyContribution, years);
  const months = years * 12;
  const chartData = Array.from({ length: months + 1 }, (_, i) => ({
    month: i,
    "Votre banque": Math.round(bankCurve[i]),
    "Notre solution": Math.round(solutionCurve[i]),
  }));
  const bankerFinal = chartData[chartData.length - 1]["Votre banque"];
  const solutionFinal = chartData[chartData.length - 1]["Notre solution"];
  const diff = solutionFinal - bankerFinal;
  let crossoverMonth: number | null = null;
  for (let i = 1; i < chartData.length; i++) {
    if (chartData[i]["Notre solution"] >= chartData[i]["Votre banque"]) { crossoverMonth = i; break; }
  }
  const crossoverYears = crossoverMonth !== null ? (crossoverMonth / 12) : null;
  return { chartData, bankerFinal, solutionFinal, diff, crossoverMonth, crossoverYears };
}

function FeeComparisonInner({ envelopes }: FeeComparisonProps) {
  const [activeTab, setActiveTab] = useState(0);
  const years = FEE_COMPARISON_YEARS;

  const allData = useMemo(() =>
    envelopes.map((e) => computeComparisonData(e.initialCapital, e.monthlyContribution)),
    [envelopes]
  );

  const current = allData[activeTab];
  const currentEnvelope = envelopes[activeTab];

  return (
    <section className="mb-12">
      <div className="bg-[var(--card)] rounded-2xl border border-white/5 p-4 md:p-6">
        <h2 className="text-sm font-semibold mb-3 text-white">⚖️ Pourquoi notre solution est plus performante</h2>

        {/* Explanation */}
        <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/15 rounded-xl px-3 py-2.5 mb-4">
          <p className="text-[11px] text-white/80 leading-relaxed">
            💡 Des frais d&apos;entrée plus élevés, mais un <strong className="text-white">rendement supérieur</strong> et des <strong className="text-white">frais de gestion réduits</strong> qui font toute la différence sur le long terme.
          </p>
        </div>

        {/* Fee table (same for all envelopes) */}
        <div className="overflow-x-auto mb-5">
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

        {/* Tabs if multiple envelopes */}
        {envelopes.length > 1 && (
          <div className="flex gap-2 mb-4">
            {envelopes.map((e, i) => (
              <button
                key={e.label}
                onClick={() => setActiveTab(i)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  activeTab === i
                    ? "bg-white/10 text-white border border-white/15"
                    : "bg-white/[0.03] text-[var(--muted)] border border-white/5 hover:bg-white/[0.06]"
                }`}
              >
                {e.icon} {e.label}
              </button>
            ))}
          </div>
        )}

        {/* Result highlight */}
        <div className="flex items-center justify-center gap-3 mb-4 py-3 rounded-xl bg-white/[0.03] border border-white/5">
          <div className="text-center">
            <p className="text-[10px] text-[var(--muted)]">Banque à {years} ans</p>
            <p className="text-sm font-bold text-red-400">{fmt(current.bankerFinal)}</p>
          </div>
          <span className="text-[var(--muted)]">vs</span>
          <div className="text-center">
            <p className="text-[10px] text-[var(--muted)]">Notre solution à {years} ans</p>
            <p className="text-sm font-bold text-emerald-400">{fmt(current.solutionFinal)}</p>
          </div>
          <div className="text-center ml-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-1.5">
            <p className="text-xs font-bold text-emerald-400">+{fmt(current.diff)}</p>
          </div>
        </div>

        {/* Crossover callout */}
        {current.crossoverYears !== null && (
          <div className="mb-4 bg-white/[0.03] border border-white/5 rounded-xl px-3 py-2.5">
            <p className="text-[11px] text-[var(--muted)] leading-relaxed">
              📉 La banque mène les <strong className="text-red-400">{current.crossoverYears < 1 ? `${current.crossoverMonth} premiers mois` : `${current.crossoverYears.toFixed(1).replace('.0', '')} premières années`}</strong>, puis notre solution prend le dessus et <strong className="text-emerald-400">l&apos;écart ne cesse de grandir</strong>. 🚀
            </p>
          </div>
        )}

        {/* Chart */}
        <p className="text-[11px] text-[var(--muted)] mb-3">
          {currentEnvelope.icon} Évolution comparative {currentEnvelope.label} sur {years} ans
        </p>
        <ComparisonChart
          id={currentEnvelope.label.replace(/\s/g, '')}
          data={current.chartData}
          crossoverMonth={current.crossoverMonth}
        />
      </div>
    </section>
  );
}

export const FeeComparison = memo(FeeComparisonInner);

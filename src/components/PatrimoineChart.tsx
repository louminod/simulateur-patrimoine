"use client";

import { memo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer, Legend, ReferenceLine,
} from "recharts";
import { fmt } from "@/lib/formatters";
import { adjustForInflation } from "@/lib/simulation";
import type { Milestone } from "@/lib/types";

interface PatrimoineChartProps {
  chartData: Record<string, number | string>[];
  years: number;
  milestones?: Milestone[];
  showRealTerms?: boolean;
  onToggleRealTerms?: () => void;
}

function PatrimoineChartInner({ chartData, years, milestones = [], showRealTerms = false, onToggleRealTerms }: PatrimoineChartProps) {
  const displayData = showRealTerms
    ? chartData.map((point) => {
        const month = Number(point.month);
        const y = month / 12;
        const adjusted: Record<string, number | string> = { month };
        for (const [key, val] of Object.entries(point)) {
          if (key === "month") continue;
          adjusted[key] = Math.round(adjustForInflation(Number(val), y));
        }
        return adjusted;
      })
    : chartData;

  return (
    <section className="mb-8">
      <div className="bg-[var(--card)] rounded-2xl border border-white/5 p-4 md:p-6">
        <h2 className="text-sm font-semibold mb-5 text-white">📈 Évolution de votre patrimoine</h2>
        <div className="h-[250px] md:h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={displayData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gStrategy" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c5cfc" stopOpacity={0.4} />
                  <stop offset="50%" stopColor="#38bdf8" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#7c5cfc" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gLivret" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#71717a" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#71717a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
              <XAxis dataKey="month" tickFormatter={(m: number) => `${Math.floor(m / 12)}a`}
                stroke="#4a4a6a" fontSize={10} tick={{ fontSize: 9 }}
                className="text-[9px] md:text-[11px]"
                interval={Math.max(1, Math.floor((years * 12) / 6))} />
              <YAxis stroke="#4a4a6a" fontSize={10} tick={{ fontSize: 9 }}
                className="text-[9px] md:text-[11px]"
                tickFormatter={(v: number) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : `${(v / 1000).toFixed(0)}k`}
                width={45} />
              <RTooltip contentStyle={{ background: "#16161f", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", fontSize: "12px" }}
                formatter={(value: unknown) => fmt(Number(value))}
                labelFormatter={(m: unknown) => `Année ${(Number(m) / 12).toFixed(1)}`} />
              <Legend wrapperStyle={{ fontSize: "11px" }} className="hidden md:block" />
              {milestones.filter(m => m.month <= years * 12).map((ms) => (
                <ReferenceLine
                  key={ms.label}
                  x={ms.month}
                  stroke={ms.color}
                  strokeDasharray="4 4"
                  strokeOpacity={0.6}
                  label={{ value: ms.label, position: "top", fill: ms.color, fontSize: 10, opacity: 0.8 }}
                />
              ))}
              <Area type="monotone" dataKey="Stratégie patrimoniale" stroke="#7c5cfc" fill="url(#gStrategy)" strokeWidth={3} />
              <Area type="monotone" dataKey="Livret bancaire 1%" stroke="#71717a" fill="url(#gLivret)" strokeWidth={1.5} strokeDasharray="6 4" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        {onToggleRealTerms && (
          <div className="flex items-center justify-end gap-2 mt-3">
            <span className="text-xs text-[var(--muted)]">Euros constants (inflation 2%)</span>
            <button
              onClick={onToggleRealTerms}
              className={`relative w-9 h-5 rounded-full transition-colors ${showRealTerms ? "bg-[var(--accent)]" : "bg-white/10"}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${showRealTerms ? "left-[18px]" : "left-0.5"}`} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export const PatrimoineChart = memo(PatrimoineChartInner);

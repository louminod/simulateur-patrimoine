"use client";

import { memo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer, Legend,
} from "recharts";
import { fmt } from "@/lib/formatters";

interface PatrimoineChartProps {
  chartData: Record<string, number | string>[];
  years: number;
}

function PatrimoineChartInner({ chartData, years }: PatrimoineChartProps) {
  return (
    <section className="mb-8">
      <div className="bg-[var(--card)] rounded-2xl border border-white/5 p-5 md:p-6">
        <h2 className="text-sm font-semibold mb-5 text-white">📈 Évolution de votre patrimoine</h2>
        <div className="h-[300px] md:h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                stroke="#4a4a6a" fontSize={11} interval={Math.max(1, Math.floor((years * 12) / 8))} />
              <YAxis stroke="#4a4a6a" fontSize={11} tickFormatter={(v: number) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : `${(v / 1000).toFixed(0)}k`} />
              <RTooltip contentStyle={{ background: "#16161f", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", fontSize: "12px" }}
                formatter={(value: unknown) => fmt(Number(value))}
                labelFormatter={(m: unknown) => `Année ${(Number(m) / 12).toFixed(1)}`} />
              <Legend />
              <Area type="monotone" dataKey="Stratégie patrimoniale" stroke="#7c5cfc" fill="url(#gStrategy)" strokeWidth={3} />
              <Area type="monotone" dataKey="Livret bancaire 1%" stroke="#71717a" fill="url(#gLivret)" strokeWidth={1.5} strokeDasharray="6 4" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}

export const PatrimoineChart = memo(PatrimoineChartInner);

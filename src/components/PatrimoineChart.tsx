"use client";

import { memo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer, Legend, ReferenceLine,
} from "recharts";
import { fmt } from "@/lib/formatters";
import type { Milestone } from "@/lib/types";

interface PatrimoineChartProps {
  chartData: Record<string, number | string>[];
  years: number;
  milestones?: Milestone[];
}

function PatrimoineChartInner({ chartData, years, milestones = [] }: PatrimoineChartProps) {
  return (
    <section className="mb-8">
      <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-4 md:p-6">
        <h2 className="text-sm font-semibold mb-5 text-[var(--text)]">📈 Évolution de votre patrimoine</h2>
        <div className="h-[250px] md:h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 40, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gCapital" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="gInterests" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="gLivret" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#71717a" stopOpacity={0.08} />
                  <stop offset="100%" stopColor="#71717a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.3} />
              <XAxis dataKey="month" tickFormatter={(m: number) => `${Math.floor(m / 12)}a`}
                stroke="#4a4a6a" fontSize={10} tick={{ fontSize: 9 }}
                className="text-[9px] md:text-[11px]"
                interval={Math.max(1, Math.floor((years * 12) / 6))} />
              <YAxis stroke="#4a4a6a" fontSize={10} tick={{ fontSize: 9 }}
                className="text-[9px] md:text-[11px]"
                tickFormatter={(v: number) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : `${(v / 1000).toFixed(0)}k`}
                width={45} domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.1)]} />
              <RTooltip contentStyle={{ background: "var(--tooltip-bg)", border: "1px solid var(--border)", borderRadius: "12px", fontSize: "12px" }}
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
              {/* Livret en fond */}
              <Area type="monotone" dataKey="Livret bancaire 1%" stroke="#71717a" fill="url(#gLivret)" strokeWidth={1} strokeDasharray="6 4" />
              {/* Capital investi en bas */}
              <Area type="monotone" dataKey="Capital investi" stackId="strategy" stroke="#6366f1" fill="url(#gCapital)" strokeWidth={2} />
              {/* Intérêts générés au dessus */}
              <Area type="monotone" dataKey="Intérêts générés" stackId="strategy" stroke="#22c55e" fill="url(#gInterests)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}

export const PatrimoineChart = memo(PatrimoineChartInner);

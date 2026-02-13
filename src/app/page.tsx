"use client";

import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// ── Types ──
interface EnvelopeConfig {
  enabled: boolean;
  initialCapital: number;
  monthlyContribution: number;
  rate: number;
  // SCPI specific
  reinvestDividends: boolean;
  entryFees: number;
  jouissanceMonths: number;
  // AV specific
  socialCharges: number;
  // PER specific
  tmi: number;
}

const defaultSCPI: EnvelopeConfig = {
  enabled: true,
  initialCapital: 10000,
  monthlyContribution: 200,
  rate: 5.5,
  reinvestDividends: true,
  entryFees: 8,
  jouissanceMonths: 3,
  socialCharges: 0,
  tmi: 30,
};

const defaultAV: EnvelopeConfig = {
  enabled: true,
  initialCapital: 10000,
  monthlyContribution: 200,
  rate: 4,
  reinvestDividends: false,
  entryFees: 0,
  jouissanceMonths: 0,
  socialCharges: 17.2,
  tmi: 30,
};

const defaultPER: EnvelopeConfig = {
  enabled: true,
  initialCapital: 5000,
  monthlyContribution: 150,
  rate: 4,
  reinvestDividends: false,
  entryFees: 0,
  jouissanceMonths: 0,
  socialCharges: 0,
  tmi: 30,
};

const LIVRET_A_RATE = 2.4;

const TMI_OPTIONS = [11, 30, 41, 45];

const fmt = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

// ── Tooltip component ──
function Tip({ text }: { text: string }) {
  return (
    <span className="relative group ml-1 cursor-help">
      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[var(--border)] text-[10px] text-[var(--muted)]">?</span>
      <span className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg bg-[#1a1a2e] border border-[var(--border)] text-xs text-[var(--text)] w-56 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-xl">
        {text}
      </span>
    </span>
  );
}

// ── Input field ──
function Field({
  label,
  value,
  onChange,
  tip,
  suffix,
  min,
  max,
  step,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  tip?: string;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-[var(--muted)] flex items-center">
        {label}
        {tip && <Tip text={tip} />}
      </label>
      <div className="flex items-center gap-1 bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          min={min}
          max={max}
          step={step ?? 1}
          className="bg-transparent outline-none w-full text-sm text-[var(--text)]"
        />
        {suffix && <span className="text-xs text-[var(--muted)]">{suffix}</span>}
      </div>
    </div>
  );
}

// ── Envelope card ──
function EnvelopeCard({
  title,
  color,
  config,
  onChange,
  type,
}: {
  title: string;
  color: string;
  config: EnvelopeConfig;
  onChange: (c: EnvelopeConfig) => void;
  type: "scpi" | "av" | "per";
}) {
  const set = (partial: Partial<EnvelopeConfig>) => onChange({ ...config, ...partial });

  return (
    <div
      className={`rounded-xl border p-5 transition-all ${
        config.enabled ? "border-[var(--border)] bg-[var(--card)]" : "border-transparent bg-[var(--card)]/40 opacity-50"
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ background: color }} />
          <h3 className="font-semibold text-sm">{title}</h3>
        </div>
        <button
          onClick={() => set({ enabled: !config.enabled })}
          className={`w-10 h-5 rounded-full transition-colors relative ${config.enabled ? "bg-[var(--accent)]" : "bg-[var(--border)]"}`}
        >
          <span
            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${config.enabled ? "left-5" : "left-0.5"}`}
          />
        </button>
      </div>
      {config.enabled && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Capital initial" value={config.initialCapital} onChange={(v) => set({ initialCapital: v })} suffix="€" tip="Montant investi au départ" />
          <Field label="Versement mensuel" value={config.monthlyContribution} onChange={(v) => set({ monthlyContribution: v })} suffix="€/mois" tip="Montant ajouté chaque mois" />
          <Field label="Rendement annuel" value={config.rate} onChange={(v) => set({ rate: v })} suffix="%" step={0.1} tip="Taux de rendement brut annuel attendu" />

          {type === "scpi" && (
            <>
              <Field label="Frais d'entrée" value={config.entryFees} onChange={(v) => set({ entryFees: v })} suffix="%" tip="Frais prélevés sur chaque versement (typiquement ~8%)" />
              <div className="col-span-2 flex items-center justify-between">
                <span className="text-xs text-[var(--muted)] flex items-center">
                  Réinvestir les dividendes
                  <Tip text="Les dividendes sont réinvestis automatiquement pour bénéficier de l'effet composé" />
                </span>
                <button
                  onClick={() => set({ reinvestDividends: !config.reinvestDividends })}
                  className={`w-10 h-5 rounded-full transition-colors relative ${config.reinvestDividends ? "bg-[var(--green)]" : "bg-[var(--border)]"}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${config.reinvestDividends ? "left-5" : "left-0.5"}`} />
                </button>
              </div>
            </>
          )}

          {type === "av" && (
            <Field label="Prélèvements sociaux" value={config.socialCharges} onChange={(v) => set({ socialCharges: v })} suffix="%" tip="Prélèvements sociaux sur les gains (17.2% en France)" />
          )}

          {type === "per" && (
            <div className="col-span-2">
              <label className="text-xs text-[var(--muted)] flex items-center mb-1">
                Tranche marginale d&apos;imposition (TMI)
                <Tip text="Votre TMI détermine l'économie d'impôt sur les versements PER" />
              </label>
              <div className="flex gap-2">
                {TMI_OPTIONS.map((t) => (
                  <button
                    key={t}
                    onClick={() => set({ tmi: t })}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      config.tmi === t ? "bg-[var(--accent)] text-white" : "bg-[var(--border)] text-[var(--muted)]"
                    }`}
                  >
                    {t}%
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Simulation logic ──
function simulate(config: EnvelopeConfig, years: number, type: "scpi" | "av" | "per") {
  const months = years * 12;
  const monthlyRate = config.rate / 100 / 12;
  let capital = config.initialCapital;
  let totalInvested = config.initialCapital;

  // SCPI: apply entry fees on initial
  if (type === "scpi") {
    capital = capital * (1 - config.entryFees / 100);
  }

  const dataPoints: number[] = [capital];

  for (let m = 1; m <= months; m++) {
    let contribution = config.monthlyContribution;

    // SCPI: entry fees on contributions
    if (type === "scpi") {
      contribution = contribution * (1 - config.entryFees / 100);
    }

    capital += contribution;
    totalInvested += config.monthlyContribution;

    // SCPI: delay jouissance (no returns first N months)
    if (type === "scpi" && m <= config.jouissanceMonths) {
      dataPoints.push(capital);
      continue;
    }

    const gains = capital * monthlyRate;

    if (type === "scpi" && !config.reinvestDividends) {
      // Dividends distributed, not reinvested — capital doesn't compound
      // We still track them for final value
      capital += gains; // simplified: we add them but they represent distributed income
    } else {
      capital += gains;
    }

    dataPoints.push(capital);
  }

  // Net after tax
  const grossGains = capital - totalInvested;
  let netGains = grossGains;

  if (type === "av") {
    // Simplified: after 8 years, abattement 4600€ single
    const abattement = years >= 8 ? 4600 : 0;
    const taxableGains = Math.max(0, grossGains - abattement);
    const socialTax = grossGains * (config.socialCharges / 100);
    const incomeTax = years >= 8 ? taxableGains * 0.075 : taxableGains * 0.128;
    netGains = grossGains - socialTax - incomeTax;
  }

  // PER: tax savings on contributions
  let perTaxSavings = 0;
  if (type === "per") {
    perTaxSavings = (totalInvested - config.initialCapital + config.initialCapital) * (config.tmi / 100);
    // At exit, taxed as income (simplified: TMI on capital)
    netGains = grossGains - grossGains * 0.172; // social charges on gains
  }

  return { dataPoints, capital, totalInvested, grossGains, netGains, perTaxSavings };
}

function simulateLivretA(configs: { initialCapital: number; monthlyContribution: number }[], years: number) {
  const months = years * 12;
  const totalInitial = configs.reduce((s, c) => s + c.initialCapital, 0);
  const totalMonthly = configs.reduce((s, c) => s + c.monthlyContribution, 0);
  const monthlyRate = LIVRET_A_RATE / 100 / 12;
  let capital = totalInitial;
  const dataPoints: number[] = [capital];

  for (let m = 1; m <= months; m++) {
    capital += totalMonthly;
    capital += capital * monthlyRate;
    dataPoints.push(capital);
  }
  const totalInvested = totalInitial + totalMonthly * months;
  return { dataPoints, capital, totalInvested, gains: capital - totalInvested };
}

// ── Main page ──
export default function Home() {
  const [years, setYears] = useState(20);
  const [scpi, setScpi] = useState(defaultSCPI);
  const [av, setAv] = useState(defaultAV);
  const [per, setPer] = useState(defaultPER);

  const results = useMemo(() => {
    const envelopes: { type: "scpi" | "av" | "per"; config: EnvelopeConfig; label: string; color: string }[] = [];
    if (scpi.enabled) envelopes.push({ type: "scpi", config: scpi, label: "SCPI", color: "#6366f1" });
    if (av.enabled) envelopes.push({ type: "av", config: av, label: "Assurance Vie", color: "#22d3ee" });
    if (per.enabled) envelopes.push({ type: "per", config: per, label: "PER", color: "#f97316" });

    const sims = envelopes.map((e) => ({
      ...e,
      result: simulate(e.config, years, e.type),
    }));

    const enabledConfigs = envelopes.map((e) => ({
      initialCapital: e.config.initialCapital,
      monthlyContribution: e.config.monthlyContribution,
    }));

    const livretA = simulateLivretA(enabledConfigs, years);

    const months = years * 12;
    const chartData = Array.from({ length: months + 1 }, (_, i) => {
      const point: Record<string, number | string> = { month: i, year: (i / 12).toFixed(1) };
      let total = 0;
      sims.forEach((s) => {
        const val = s.result.dataPoints[i] ?? 0;
        point[s.label] = Math.round(val);
        total += val;
      });
      point["Total"] = Math.round(total);
      point["Livret A"] = Math.round(livretA.dataPoints[i] ?? 0);
      return point;
    });

    const totalInvested = sims.reduce((s, sim) => s + sim.result.totalInvested, 0);
    const totalFinal = sims.reduce((s, sim) => s + sim.result.capital, 0);
    const totalNet = sims.reduce((s, sim) => s + sim.result.netGains, 0);
    const perSavings = sims.find((s) => s.type === "per")?.result.perTaxSavings ?? 0;

    return { sims, livretA, chartData, totalInvested, totalFinal, totalNet, perSavings };
  }, [scpi, av, per, years]);

  const totalInitialCapital = (scpi.enabled ? scpi.initialCapital : 0) + (av.enabled ? av.initialCapital : 0) + (per.enabled ? per.initialCapital : 0);
  const pctGain = totalInitialCapital > 0 ? (((results.totalFinal - results.totalInvested) / results.totalInvested) * 100).toFixed(1) : "0";

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
          Simulateur Patrimoine
        </h1>
        <p className="text-[var(--muted)] text-sm mt-1">Intérêts composés multi-enveloppes — SCPI, Assurance Vie, PER</p>
      </header>

      {/* Duration slider */}
      <div className="mb-6 bg-[var(--card)] rounded-xl border border-[var(--border)] p-5">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium flex items-center">
            Durée de placement
            <Tip text="Durée totale de la simulation en années" />
          </label>
          <span className="text-lg font-bold text-[var(--accent)]">{years} ans</span>
        </div>
        <input type="range" min={1} max={40} value={years} onChange={(e) => setYears(Number(e.target.value))} className="w-full" />
        <div className="flex justify-between text-xs text-[var(--muted)] mt-1">
          <span>1 an</span>
          <span>40 ans</span>
        </div>
      </div>

      {/* Envelope cards */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <EnvelopeCard title="SCPI" color="#6366f1" config={scpi} onChange={setScpi} type="scpi" />
        <EnvelopeCard title="Assurance Vie" color="#22d3ee" config={av} onChange={setAv} type="av" />
        <EnvelopeCard title="PER" color="#f97316" config={per} onChange={setPer} type="per" />
      </div>

      {/* Chart */}
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5 mb-8">
        <h2 className="text-sm font-semibold mb-4">Évolution du capital</h2>
        <div className="h-[350px] md:h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={results.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gSCPI" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gAV" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gPER" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
              <XAxis
                dataKey="month"
                tickFormatter={(m: number) => `${Math.floor(m / 12)}a`}
                stroke="#71717a"
                fontSize={11}
                interval={Math.max(1, Math.floor((years * 12) / 10))}
              />
              <YAxis stroke="#71717a" fontSize={11} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
              <RTooltip
                contentStyle={{ background: "#12121a", border: "1px solid #1e1e2e", borderRadius: "8px", fontSize: "12px" }}
                formatter={(value: number) => fmt(value)}
                labelFormatter={(m: number) => `Année ${(m / 12).toFixed(1)}`}
              />
              <Legend />
              {scpi.enabled && <Area type="monotone" dataKey="SCPI" stroke="#6366f1" fill="url(#gSCPI)" strokeWidth={2} />}
              {av.enabled && <Area type="monotone" dataKey="Assurance Vie" stroke="#22d3ee" fill="url(#gAV)" strokeWidth={2} />}
              {per.enabled && <Area type="monotone" dataKey="PER" stroke="#f97316" fill="url(#gPER)" strokeWidth={2} />}
              <Area type="monotone" dataKey="Livret A" stroke="#71717a" fill="none" strokeWidth={1.5} strokeDasharray="5 5" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary table */}
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5 mb-8 overflow-x-auto">
        <h2 className="text-sm font-semibold mb-4">Récapitulatif</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[var(--muted)] text-xs border-b border-[var(--border)]">
              <th className="text-left py-2">Enveloppe</th>
              <th className="text-right py-2">Capital investi</th>
              <th className="text-right py-2">Capital final</th>
              <th className="text-right py-2">Gains bruts</th>
              <th className="text-right py-2">Gains nets</th>
            </tr>
          </thead>
          <tbody>
            {results.sims.map((s) => (
              <tr key={s.label} className="border-b border-[var(--border)]/50">
                <td className="py-3 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                  {s.label}
                </td>
                <td className="text-right">{fmt(s.result.totalInvested)}</td>
                <td className="text-right font-medium">{fmt(s.result.capital)}</td>
                <td className="text-right text-[var(--green)]">{fmt(s.result.grossGains)}</td>
                <td className="text-right text-[var(--green)]">{fmt(s.result.netGains)}</td>
              </tr>
            ))}
            <tr className="border-b border-[var(--border)]/50">
              <td className="py-3 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--muted)]" />
                Livret A (réf.)
              </td>
              <td className="text-right">{fmt(results.livretA.totalInvested)}</td>
              <td className="text-right">{fmt(results.livretA.capital)}</td>
              <td className="text-right text-[var(--muted)]">{fmt(results.livretA.gains)}</td>
              <td className="text-right text-[var(--muted)]">{fmt(results.livretA.gains)}</td>
            </tr>
            <tr className="font-semibold">
              <td className="py-3">Total</td>
              <td className="text-right">{fmt(results.totalInvested)}</td>
              <td className="text-right">{fmt(results.totalFinal)}</td>
              <td className="text-right text-[var(--green)]">{fmt(results.totalFinal - results.totalInvested)}</td>
              <td className="text-right text-[var(--green)]">{fmt(results.totalNet)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* PER tax savings */}
      {per.enabled && results.perSavings > 0 && (
        <div className="bg-gradient-to-r from-orange-500/10 to-orange-500/5 rounded-xl border border-orange-500/20 p-5 mb-8">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-orange-400 text-lg">🏦</span>
            <h3 className="text-sm font-semibold text-orange-300">Économie d&apos;impôt PER</h3>
          </div>
          <p className="text-2xl font-bold text-orange-400">{fmt(results.perSavings)}</p>
          <p className="text-xs text-[var(--muted)] mt-1">
            Économie totale estimée sur {years} ans grâce à la déduction des versements à votre TMI de {per.tmi}%
          </p>
        </div>
      )}

      {/* Bottom summary */}
      <div className="bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 rounded-xl border border-indigo-500/20 p-6 text-center">
        <p className="text-lg md:text-xl">
          En <span className="font-bold text-[var(--accent)]">{years} ans</span>, votre patrimoine passe de{" "}
          <span className="font-bold">{fmt(results.totalInvested)}</span> à{" "}
          <span className="font-bold text-[var(--green)]">{fmt(results.totalFinal)}</span>
        </p>
        <p className="text-[var(--green)] font-semibold text-lg mt-1">+{pctGain}%</p>
        <p className="text-xs text-[var(--muted)] mt-2">
          Soit {fmt(results.totalFinal - results.livretA.capital)} de plus qu&apos;un Livret A
        </p>
      </div>

      <footer className="text-center text-xs text-[var(--muted)] mt-8 mb-4">
        Simulation indicative — Les rendements passés ne préjugent pas des rendements futurs
      </footer>
    </main>
  );
}

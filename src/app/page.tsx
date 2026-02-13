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
  reinvestDividends: boolean;
  entryFees: number;
  jouissanceMonths: number;
  socialCharges: number;
  tmi: number;
}

interface SCPICreditConfig {
  enabled: boolean;
  mode: "cash" | "credit";
  // Cash mode
  initialCapital: number;
  monthlyContribution: number;
  rate: number;
  reinvestDividends: boolean;
  entryFees: number;
  jouissanceMonths: number;
  // Credit mode
  loanAmount: number;
  downPayment: number;
  loanRate: number;
  loanDuration: number; // years
}

const defaultSCPI: SCPICreditConfig = {
  enabled: true,
  mode: "credit",
  initialCapital: 10000,
  monthlyContribution: 200,
  rate: 5.5,
  reinvestDividends: true,
  entryFees: 8,
  jouissanceMonths: 3,
  loanAmount: 100000,
  downPayment: 10000,
  loanRate: 5.35,
  loanDuration: 20,
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
const LOAN_DURATIONS = [10, 15, 20, 25];

const fmt = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

const fmtDetailed = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(n);

// ── Tooltip ──
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

// ── Field ──
function Field({ label, value, onChange, tip, suffix, min, max, step }: {
  label: string; value: number; onChange: (v: number) => void;
  tip?: string; suffix?: string; min?: number; max?: number; step?: number;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-[var(--muted)] flex items-center">
        {label}{tip && <Tip text={tip} />}
      </label>
      <div className="flex items-center gap-1 bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2">
        <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))}
          min={min} max={max} step={step ?? 1}
          className="bg-transparent outline-none w-full text-sm text-[var(--text)]" />
        {suffix && <span className="text-xs text-[var(--muted)]">{suffix}</span>}
      </div>
    </div>
  );
}

// ── Toggle ──
function Toggle({ on, onToggle, color }: { on: boolean; onToggle: () => void; color?: string }) {
  const bg = on ? (color ?? "bg-[var(--accent)]") : "bg-[var(--border)]";
  return (
    <button onClick={onToggle}
      className={`w-10 h-5 rounded-full transition-colors relative ${bg}`}
      style={on && color?.startsWith("#") ? { background: color } : undefined}>
      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${on ? "left-5" : "left-0.5"}`} />
    </button>
  );
}

// ── Loan calculator ──
function calcMonthlyPayment(principal: number, annualRate: number, years: number) {
  const r = annualRate / 100 / 12;
  const n = years * 12;
  if (r === 0) return principal / n;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

// ── SCPI Card ──
function SCPICard({ config, onChange }: { config: SCPICreditConfig; onChange: (c: SCPICreditConfig) => void }) {
  const set = (p: Partial<SCPICreditConfig>) => onChange({ ...config, ...p });

  const monthlyPayment = config.mode === "credit"
    ? calcMonthlyPayment(config.loanAmount, config.loanRate, config.loanDuration)
    : 0;

  // Net invested after entry fees in credit mode
  const netInvested = config.mode === "credit"
    ? (config.loanAmount + config.downPayment) * (1 - config.entryFees / 100)
    : 0;

  // Monthly SCPI income (dividends)
  const monthlyDividend = config.mode === "credit"
    ? netInvested * (config.rate / 100) / 12
    : 0;

  const effortMensuel = monthlyPayment - monthlyDividend;

  return (
    <div className={`rounded-xl border p-5 transition-all ${
      config.enabled ? "border-[var(--border)] bg-[var(--card)]" : "border-transparent bg-[var(--card)]/40 opacity-50"
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ background: "#6366f1" }} />
          <h3 className="font-semibold text-sm">SCPI</h3>
        </div>
        <Toggle on={config.enabled} onToggle={() => set({ enabled: !config.enabled })} color="#6366f1" />
      </div>

      {config.enabled && (
        <>
          {/* Mode tabs */}
          <div className="flex rounded-lg bg-[var(--bg)] p-0.5 mb-4">
            {(["cash", "credit"] as const).map((m) => (
              <button key={m} onClick={() => set({ mode: m })}
                className={`flex-1 py-2 rounded-md text-xs font-medium transition-all ${
                  config.mode === m ? "bg-[var(--accent)] text-white shadow-lg" : "text-[var(--muted)] hover:text-[var(--text)]"
                }`}>
                {m === "cash" ? "💰 Comptant" : "🏦 À crédit"}
              </button>
            ))}
          </div>

          {config.mode === "cash" ? (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Capital initial" value={config.initialCapital} onChange={(v) => set({ initialCapital: v })} suffix="€" tip="Montant investi au départ" />
              <Field label="Versement mensuel" value={config.monthlyContribution} onChange={(v) => set({ monthlyContribution: v })} suffix="€/mois" tip="Montant ajouté chaque mois" />
              <Field label="Rendement annuel" value={config.rate} onChange={(v) => set({ rate: v })} suffix="%" step={0.1} tip="Taux de distribution annuel brut" />
              <Field label="Frais d&apos;entrée" value={config.entryFees} onChange={(v) => set({ entryFees: v })} suffix="%" tip="Frais de souscription (~8% en moyenne)" />
              <div className="col-span-2 flex items-center justify-between">
                <span className="text-xs text-[var(--muted)] flex items-center">
                  Réinvestir les dividendes
                  <Tip text="Les dividendes sont réinvestis pour bénéficier de l'effet composé" />
                </span>
                <Toggle on={config.reinvestDividends} onToggle={() => set({ reinvestDividends: !config.reinvestDividends })} color="#22c55e" />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Montant emprunté" value={config.loanAmount} onChange={(v) => set({ loanAmount: v })} suffix="€" tip="Capital emprunté à la banque pour acheter des parts SCPI" />
                <Field label="Apport personnel" value={config.downPayment} onChange={(v) => set({ downPayment: v })} suffix="€" tip="Votre apport en cash (souvent exigé pour les frais)" />
                <Field label="Taux d&apos;intérêt" value={config.loanRate} onChange={(v) => set({ loanRate: v })} suffix="%" step={0.01} tip="Taux nominal annuel du prêt immobilier" />
                <Field label="Rendement SCPI" value={config.rate} onChange={(v) => set({ rate: v })} suffix="%" step={0.1} tip="Taux de distribution annuel brut des SCPI" />
                <Field label="Frais d&apos;entrée" value={config.entryFees} onChange={(v) => set({ entryFees: v })} suffix="%" tip="Frais de souscription (~8% en moyenne)" />
              </div>

              {/* Loan duration selector */}
              <div>
                <label className="text-xs text-[var(--muted)] flex items-center mb-1.5">
                  Durée du prêt
                  <Tip text="Durée de remboursement du crédit" />
                </label>
                <div className="flex gap-2">
                  {LOAN_DURATIONS.map((d) => (
                    <button key={d} onClick={() => set({ loanDuration: d })}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        config.loanDuration === d ? "bg-[var(--accent)] text-white" : "bg-[var(--border)] text-[var(--muted)]"
                      }`}>
                      {d} ans
                    </button>
                  ))}
                </div>
              </div>

              {/* Cashflow summary */}
              <div className="bg-[var(--bg)] rounded-lg p-3 space-y-2 border border-[var(--border)]">
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--muted)]">Mensualité crédit</span>
                  <span className="text-red-400 font-medium">-{fmtDetailed(monthlyPayment)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--muted)]">Revenus SCPI mensuels</span>
                  <span className="text-[var(--green)] font-medium">+{fmtDetailed(monthlyDividend)}</span>
                </div>
                <div className="border-t border-[var(--border)] pt-2 flex justify-between text-sm font-semibold">
                  <span className="flex items-center">
                    Effort d&apos;épargne réel
                    <Tip text="Ce que vous sortez réellement de votre poche chaque mois (mensualité - dividendes SCPI)" />
                  </span>
                  <span className={effortMensuel > 0 ? "text-orange-400" : "text-[var(--green)]"}>
                    {effortMensuel > 0 ? "-" : "+"}{fmtDetailed(Math.abs(effortMensuel))}/mois
                  </span>
                </div>
              </div>

              {/* Reinvest toggle for post-credit period */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--muted)] flex items-center">
                  Réinvestir dividendes après prêt
                  <Tip text="Après remboursement du prêt, réinvestir les dividendes en nouvelles parts" />
                </span>
                <Toggle on={config.reinvestDividends} onToggle={() => set({ reinvestDividends: !config.reinvestDividends })} color="#22c55e" />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Envelope card (AV/PER) ──
function EnvelopeCard({ title, color, config, onChange, type }: {
  title: string; color: string; config: EnvelopeConfig;
  onChange: (c: EnvelopeConfig) => void; type: "av" | "per";
}) {
  const set = (p: Partial<EnvelopeConfig>) => onChange({ ...config, ...p });

  return (
    <div className={`rounded-xl border p-5 transition-all ${
      config.enabled ? "border-[var(--border)] bg-[var(--card)]" : "border-transparent bg-[var(--card)]/40 opacity-50"
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ background: color }} />
          <h3 className="font-semibold text-sm">{title}</h3>
        </div>
        <Toggle on={config.enabled} onToggle={() => set({ enabled: !config.enabled })} color={color} />
      </div>
      {config.enabled && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Capital initial" value={config.initialCapital} onChange={(v) => set({ initialCapital: v })} suffix="€" tip="Montant investi au départ" />
          <Field label="Versement mensuel" value={config.monthlyContribution} onChange={(v) => set({ monthlyContribution: v })} suffix="€/mois" tip="Montant ajouté chaque mois" />
          <Field label="Rendement annuel" value={config.rate} onChange={(v) => set({ rate: v })} suffix="%" step={0.1} tip="Taux de rendement brut annuel attendu" />

          {type === "av" && (
            <Field label="Prélèvements sociaux" value={config.socialCharges} onChange={(v) => set({ socialCharges: v })} suffix="%" tip="Prélèvements sociaux sur les gains (17.2% en France)" />
          )}

          {type === "per" && (
            <div className="col-span-2">
              <label className="text-xs text-[var(--muted)] flex items-center mb-1">
                Tranche marginale (TMI)
                <Tip text="Votre TMI détermine l'économie d'impôt sur les versements PER" />
              </label>
              <div className="flex gap-2">
                {TMI_OPTIONS.map((t) => (
                  <button key={t} onClick={() => set({ tmi: t })}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      config.tmi === t ? "bg-[var(--accent)] text-white" : "bg-[var(--border)] text-[var(--muted)]"
                    }`}>{t}%</button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Simulation: SCPI (both modes) ──
interface SimResult {
  dataPoints: number[];
  capital: number;
  totalInvested: number;
  grossGains: number;
  netGains: number;
  perTaxSavings: number;
  effortMensuel?: number;
  totalEffort?: number;
  totalLoanCost?: number;
}

function simulateSCPI(config: SCPICreditConfig, years: number): SimResult {
  const months = years * 12;
  const monthlyRate = config.rate / 100 / 12;

  if (config.mode === "cash") {
    // Same as before
    let capital = config.initialCapital * (1 - config.entryFees / 100);
    let totalInvested = config.initialCapital;
    const dataPoints: number[] = [capital];

    for (let m = 1; m <= months; m++) {
      const contribution = config.monthlyContribution * (1 - config.entryFees / 100);
      capital += contribution;
      totalInvested += config.monthlyContribution;

      if (m <= config.jouissanceMonths) { dataPoints.push(capital); continue; }

      capital += capital * monthlyRate;
      dataPoints.push(capital);
    }

    const grossGains = capital - totalInvested;
    return { dataPoints, capital, totalInvested, grossGains, netGains: grossGains, perTaxSavings: 0 };
  }

  // ── Credit mode ──
  const totalPurchase = config.loanAmount + config.downPayment;
  const netShares = totalPurchase * (1 - config.entryFees / 100); // net value of SCPI shares
  const monthlyPayment = calcMonthlyPayment(config.loanAmount, config.loanRate, config.loanDuration);
  const loanMonths = config.loanDuration * 12;

  let capital = netShares; // value of SCPI shares (grows with reinvested dividends)
  let cumulatedDividends = 0; // dividends received but not reinvested (during loan)
  let totalOutOfPocket = config.downPayment; // real money spent
  const dataPoints: number[] = [capital];

  for (let m = 1; m <= months; m++) {
    const isLoanActive = m <= loanMonths;

    // Monthly dividends from SCPI
    const dividend = m <= config.jouissanceMonths ? 0 : capital * monthlyRate;

    if (isLoanActive) {
      // During loan: dividends offset the monthly payment
      // The effort = payment - dividend
      const effort = Math.max(0, monthlyPayment - dividend);
      totalOutOfPocket += effort;

      // If dividend > payment, surplus can be reinvested
      const surplus = dividend - monthlyPayment;
      if (surplus > 0) {
        capital += surplus; // reinvest surplus
      }
      // Capital stays same (shares don't grow from payments, only from surplus reinvestment)
    } else {
      // After loan: full dividends available
      if (config.reinvestDividends) {
        capital += dividend;
      } else {
        cumulatedDividends += dividend;
      }
    }

    dataPoints.push(capital);
  }

  const totalLoanPaid = monthlyPayment * loanMonths;
  const totalLoanCost = totalLoanPaid - config.loanAmount;
  const grossGains = capital + cumulatedDividends - totalOutOfPocket;

  return {
    dataPoints,
    capital: capital + cumulatedDividends,
    totalInvested: totalOutOfPocket,
    grossGains,
    netGains: grossGains,
    perTaxSavings: 0,
    effortMensuel: monthlyPayment - (netShares * monthlyRate),
    totalEffort: totalOutOfPocket,
    totalLoanCost,
  };
}

// ── Simulation: AV / PER ──
function simulate(config: EnvelopeConfig, years: number, type: "av" | "per"): SimResult {
  const months = years * 12;
  const monthlyRate = config.rate / 100 / 12;
  let capital = config.initialCapital;
  let totalInvested = config.initialCapital;
  const dataPoints: number[] = [capital];

  for (let m = 1; m <= months; m++) {
    capital += config.monthlyContribution;
    totalInvested += config.monthlyContribution;
    capital += capital * monthlyRate;
    dataPoints.push(capital);
  }

  const grossGains = capital - totalInvested;
  let netGains = grossGains;
  let perTaxSavings = 0;

  if (type === "av") {
    const abattement = years >= 8 ? 4600 : 0;
    const taxableGains = Math.max(0, grossGains - abattement);
    const socialTax = grossGains * (config.socialCharges / 100);
    const incomeTax = years >= 8 ? taxableGains * 0.075 : taxableGains * 0.128;
    netGains = grossGains - socialTax - incomeTax;
  }

  if (type === "per") {
    perTaxSavings = totalInvested * (config.tmi / 100);
    netGains = grossGains - grossGains * 0.172;
  }

  return { dataPoints, capital, totalInvested, grossGains, netGains, perTaxSavings };
}

// ── Livret A ──
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
  return { dataPoints, capital, totalInvested: totalInitial + totalMonthly * months, gains: capital - (totalInitial + totalMonthly * months) };
}

// ── Main ──
export default function Home() {
  const [years, setYears] = useState(20);
  const [scpi, setScpi] = useState(defaultSCPI);
  const [av, setAv] = useState(defaultAV);
  const [per, setPer] = useState(defaultPER);

  const results = useMemo(() => {
    const sims: { label: string; color: string; type: string; result: SimResult }[] = [];

    if (scpi.enabled) {
      sims.push({ label: "SCPI", color: "#6366f1", type: "scpi", result: simulateSCPI(scpi, years) });
    }
    if (av.enabled) {
      sims.push({ label: "Assurance Vie", color: "#22d3ee", type: "av", result: simulate(av, years, "av") });
    }
    if (per.enabled) {
      sims.push({ label: "PER", color: "#f97316", type: "per", result: simulate(per, years, "per") });
    }

    // For Livret A comparison, use actual out-of-pocket amounts
    const livretAConfigs = sims.map((s) => {
      if (s.type === "scpi" && scpi.mode === "credit") {
        return { initialCapital: scpi.downPayment, monthlyContribution: Math.max(0, (s.result.effortMensuel ?? 0)) };
      }
      if (s.type === "scpi") return { initialCapital: scpi.initialCapital, monthlyContribution: scpi.monthlyContribution };
      if (s.type === "av") return { initialCapital: av.initialCapital, monthlyContribution: av.monthlyContribution };
      return { initialCapital: per.initialCapital, monthlyContribution: per.monthlyContribution };
    });

    const livretA = simulateLivretA(livretAConfigs, years);

    const months = years * 12;
    const chartData = Array.from({ length: months + 1 }, (_, i) => {
      const point: Record<string, number | string> = { month: i };
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
    const scpiResult = sims.find((s) => s.type === "scpi")?.result;

    return { sims, livretA, chartData, totalInvested, totalFinal, totalNet, perSavings, scpiResult };
  }, [scpi, av, per, years]);

  const pctGain = results.totalInvested > 0
    ? (((results.totalFinal - results.totalInvested) / results.totalInvested) * 100).toFixed(1)
    : "0";

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
          Simulateur Patrimoine
        </h1>
        <p className="text-[var(--muted)] text-sm mt-1">Intérêts composés multi-enveloppes — SCPI, Assurance Vie, PER</p>
      </header>

      {/* Duration */}
      <div className="mb-6 bg-[var(--card)] rounded-xl border border-[var(--border)] p-5">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium flex items-center">
            Durée de placement<Tip text="Durée totale de la simulation en années" />
          </label>
          <span className="text-lg font-bold text-[var(--accent)]">{years} ans</span>
        </div>
        <input type="range" min={1} max={40} value={years} onChange={(e) => setYears(Number(e.target.value))} className="w-full" />
        <div className="flex justify-between text-xs text-[var(--muted)] mt-1">
          <span>1 an</span><span>40 ans</span>
        </div>
      </div>

      {/* Envelopes */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <SCPICard config={scpi} onChange={setScpi} />
        <EnvelopeCard title="Assurance Vie" color="#22d3ee" config={av} onChange={setAv} type="av" />
        <EnvelopeCard title="PER" color="#f97316" config={per} onChange={setPer} type="per" />
      </div>

      {/* SCPI Credit info banner */}
      {scpi.enabled && scpi.mode === "credit" && results.scpiResult && (
        <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl border border-indigo-500/20 p-5 mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🏦</span>
            <h3 className="text-sm font-semibold text-indigo-300">SCPI à crédit — Détails du montage</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-[var(--muted)]">Parts SCPI acquises</p>
              <p className="text-lg font-bold">{fmt(scpi.loanAmount + scpi.downPayment)}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--muted)]">Effort mensuel réel</p>
              <p className={`text-lg font-bold ${(results.scpiResult.effortMensuel ?? 0) > 0 ? "text-orange-400" : "text-[var(--green)]"}`}>
                {fmtDetailed(Math.abs(results.scpiResult.effortMensuel ?? 0))}/mois
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--muted)]">Coût total du crédit</p>
              <p className="text-lg font-bold text-red-400">{fmt(results.scpiResult.totalLoanCost ?? 0)}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--muted)]">Patrimoine SCPI à {years} ans</p>
              <p className="text-lg font-bold text-[var(--green)]">{fmt(results.scpiResult.capital)}</p>
            </div>
          </div>
          {years > scpi.loanDuration && (
            <p className="text-xs text-indigo-300/70 mt-3">
              💡 Après {scpi.loanDuration} ans, le prêt est remboursé. Vous possédez {fmt(scpi.loanAmount + scpi.downPayment)} de parts SCPI
              {scpi.reinvestDividends ? " et les dividendes sont réinvestis." : " et percevez ~" + fmtDetailed((scpi.loanAmount + scpi.downPayment) * (1 - scpi.entryFees / 100) * scpi.rate / 100 / 12) + "/mois de revenus."}
            </p>
          )}
        </div>
      )}

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
              <XAxis dataKey="month" tickFormatter={(m: number) => `${Math.floor(m / 12)}a`}
                stroke="#71717a" fontSize={11} interval={Math.max(1, Math.floor((years * 12) / 10))} />
              <YAxis stroke="#71717a" fontSize={11} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
              <RTooltip
                contentStyle={{ background: "#12121a", border: "1px solid #1e1e2e", borderRadius: "8px", fontSize: "12px" }}
                formatter={(value: unknown) => fmt(Number(value))}
                labelFormatter={(m: unknown) => `Année ${(Number(m) / 12).toFixed(1)}`} />
              <Legend />
              {scpi.enabled && <Area type="monotone" dataKey="SCPI" stroke="#6366f1" fill="url(#gSCPI)" strokeWidth={2} />}
              {av.enabled && <Area type="monotone" dataKey="Assurance Vie" stroke="#22d3ee" fill="url(#gAV)" strokeWidth={2} />}
              {per.enabled && <Area type="monotone" dataKey="PER" stroke="#f97316" fill="url(#gPER)" strokeWidth={2} />}
              <Area type="monotone" dataKey="Livret A" stroke="#71717a" fill="none" strokeWidth={1.5} strokeDasharray="5 5" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5 mb-8 overflow-x-auto">
        <h2 className="text-sm font-semibold mb-4">Récapitulatif</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[var(--muted)] text-xs border-b border-[var(--border)]">
              <th className="text-left py-2">Enveloppe</th>
              <th className="text-right py-2">Effort réel</th>
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
                  {s.type === "scpi" && scpi.mode === "credit" && (
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded">crédit</span>
                  )}
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

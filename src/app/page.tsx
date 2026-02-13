"use client";

import { useState, useMemo, useEffect } from "react";
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
  loanAmount: number;
  downPayment: number;
  interestRate: number;
  loanYears: number;
  rate: number;
  entryFees: number;
}

const defaultSCPI: EnvelopeConfig = {
  enabled: true, initialCapital: 10000, monthlyContribution: 200, rate: 5.5,
  reinvestDividends: true, entryFees: 8, jouissanceMonths: 3, socialCharges: 0, tmi: 30,
};

const defaultSCPICredit: SCPICreditConfig = {
  enabled: false, loanAmount: 100000, downPayment: 0, interestRate: 5.35, loanYears: 20, rate: 5.5, entryFees: 8,
};

const defaultAV: EnvelopeConfig = {
  enabled: true, initialCapital: 10000, monthlyContribution: 200, rate: 4,
  reinvestDividends: false, entryFees: 4, jouissanceMonths: 0, socialCharges: 17.2, tmi: 30,
};

const defaultPER: EnvelopeConfig = {
  enabled: true, initialCapital: 5000, monthlyContribution: 150, rate: 4,
  reinvestDividends: false, entryFees: 4, jouissanceMonths: 0, socialCharges: 0, tmi: 30,
};

const AV_PER_ENTRY_FEES = 4; // 4% fixed entry fees
const AV_PER_MGMT_FEES = 1; // 1% annual management fees

const LIVRET_RATE = 1; // 1% livret bancaire classique for comparison
const SCPI_REVALUATION = 1; // 1% annual part revaluation
const TMI_OPTIONS = [11, 30, 41, 45];

const fmt = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

// ── Animated counter ──
function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const [displayed, setDisplayed] = useState(value);
  useEffect(() => {
    const start = displayed;
    const diff = value - start;
    if (Math.abs(diff) < 1) { setDisplayed(value); return; }
    const duration = 600;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(start + diff * eased);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return <span className={className}>{fmt(Math.round(displayed))}</span>;
}

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
      <label className="text-xs text-[var(--muted)] flex items-center">{label}{tip && <Tip text={tip} />}</label>
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
function Toggle({ on, onToggle, className }: { on: boolean; onToggle: () => void; className?: string }) {
  return (
    <button onClick={onToggle}
      className={`w-10 h-5 rounded-full transition-colors relative ${on ? (className ?? "bg-[var(--accent)]") : "bg-[var(--border)]"}`}>
      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${on ? "left-5" : "left-0.5"}`} />
    </button>
  );
}

// ── Loan math ──
function calcLoanPayment(principal: number, annualRate: number, years: number) {
  if (principal <= 0) return 0;
  const r = annualRate / 100 / 12;
  const n = years * 12;
  if (r === 0) return principal / n;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

// ── Simulate cash SCPI / AV / PER ──
function simulate(config: EnvelopeConfig, years: number, type: "scpi" | "av" | "per") {
  const months = years * 12;
  const isAVPER = type === "av" || type === "per";
  const entryFeePct = isAVPER ? AV_PER_ENTRY_FEES / 100 : (type === "scpi" ? config.entryFees / 100 : 0);
  const mgmtFeeMonthly = isAVPER ? AV_PER_MGMT_FEES / 100 / 12 : 0;
  const monthlyRate = config.rate / 100 / 12;
  const monthlyRevalo = type === "scpi" ? SCPI_REVALUATION / 100 / 12 : 0;
  let capital = config.initialCapital * (1 - entryFeePct);
  let totalInvested = config.initialCapital;

  const dataPoints: number[] = [capital];

  for (let m = 1; m <= months; m++) {
    const contribution = config.monthlyContribution * (1 - entryFeePct);
    capital += contribution;
    totalInvested += config.monthlyContribution;

    if (type === "scpi" && m <= config.jouissanceMonths) { dataPoints.push(capital); continue; }

    // Yield (dividends / interest)
    const gains = capital * monthlyRate;
    capital += gains;

    // Management fees (AV/PER: 1%/year deducted monthly)
    if (isAVPER) {
      capital *= (1 - mgmtFeeMonthly);
    }

    // SCPI part revaluation (1%/year)
    if (type === "scpi") {
      capital *= (1 + monthlyRevalo);
    }

    dataPoints.push(capital);
  }

  const grossGains = capital - totalInvested;
  let netGains = grossGains;

  if (type === "av") {
    const abattement = years >= 8 ? 4600 : 0;
    const taxableGains = Math.max(0, grossGains - abattement);
    const socialTax = grossGains * (config.socialCharges / 100);
    const incomeTax = years >= 8 ? taxableGains * 0.075 : taxableGains * 0.128;
    netGains = grossGains - socialTax - incomeTax;
  }

  let perTaxSavings = 0;
  if (type === "per") {
    perTaxSavings = totalInvested * (config.tmi / 100);
    netGains = grossGains - grossGains * 0.172;
  }

  return { dataPoints, capital, totalInvested, grossGains, netGains, perTaxSavings };
}

// ── Simulate SCPI credit ──
function simulateSCPICredit(config: SCPICreditConfig, totalYears: number) {
  const totalInvestment = config.loanAmount + config.downPayment;
  const netShares = totalInvestment; // 100% invested; entry fees deducted at exit
  const entryFeesAmount = totalInvestment * (config.entryFees / 100);
  const monthlyRate = config.rate / 100 / 12;
  const monthlyRevalo = SCPI_REVALUATION / 100 / 12;
  const monthlyPayment = calcLoanPayment(config.loanAmount, config.interestRate, config.loanYears);
  const loanMonths = config.loanYears * 12;
  const r = config.interestRate / 100 / 12;
  const months = totalYears * 12;

  let remainingDebt = config.loanAmount;
  let sharesValue = netShares;

  const dataPoints: number[] = [];

  for (let m = 0; m <= months; m++) {
    const netCapital = sharesValue - remainingDebt - entryFeesAmount;
    dataPoints.push(netCapital);

    if (m < months) {
      // Revaluation of shares (1%/year)
      sharesValue *= (1 + monthlyRevalo);

      // Loan repayment
      if (remainingDebt > 0 && m < loanMonths) {
        const interest = remainingDebt * r;
        const principal = monthlyPayment - interest;
        remainingDebt = Math.max(0, remainingDebt - principal);
      } else {
        remainingDebt = 0;
      }
    }
  }

  const cashflow = (netShares * monthlyRate) - monthlyPayment;
  const totalLoanCost = monthlyPayment * loanMonths - config.loanAmount;
  const finalSharesValue = sharesValue - entryFeesAmount; // entry fees deducted at exit
  const totalOutOfPocket = config.downPayment + Math.max(0, -cashflow) * Math.min(loanMonths, months);

  return {
    dataPoints,
    capital: finalSharesValue,
    totalInvested: totalOutOfPocket,
    grossGains: finalSharesValue - totalOutOfPocket,
    netGains: finalSharesValue - totalOutOfPocket,
    perTaxSavings: 0,
    monthlyPayment,
    monthlyDividend: netShares * monthlyRate,
    cashflow,
    totalLoanCost,
    netShares,
  };
}

// ── Livret bancaire classique (1%) ──
function simulateLivret(configs: { initialCapital: number; monthlyContribution: number }[], years: number) {
  const months = years * 12;
  const totalInitial = configs.reduce((s, c) => s + c.initialCapital, 0);
  const totalMonthly = configs.reduce((s, c) => s + c.monthlyContribution, 0);
  const monthlyRate = LIVRET_RATE / 100 / 12;
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

// ── Envelope card (AV, PER) ──
function EnvelopeCard({ title, color, config, onChange, type }: {
  title: string; color: string; config: EnvelopeConfig;
  onChange: (c: EnvelopeConfig) => void; type: "av" | "per";
}) {
  const set = (p: Partial<EnvelopeConfig>) => onChange({ ...config, ...p });
  return (
    <div className={`rounded-xl border p-5 transition-all ${config.enabled ? "border-[var(--border)] bg-[var(--card)]" : "border-transparent bg-[var(--card)]/40 opacity-50"}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ background: color }} />
          <h3 className="font-semibold text-sm">{title}</h3>
        </div>
        <Toggle on={config.enabled} onToggle={() => set({ enabled: !config.enabled })} />
      </div>
      {config.enabled && (
        <div className="space-y-3">
          <div className="flex items-start gap-2 bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 border border-indigo-500/20 rounded-lg px-3 py-2.5">
            <span className="text-sm">✨</span>
            <p className="text-[11px] text-indigo-200/80 leading-relaxed">
              Rendement de <span className="font-semibold text-indigo-300">4% brut</span> optimisé grâce à un accompagnement personnalisé et un pilotage actif de votre épargne par votre conseiller en gestion de patrimoine.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Capital initial" value={config.initialCapital} onChange={(v) => set({ initialCapital: v })} suffix="€" />
            <Field label="Versement mensuel" value={config.monthlyContribution} onChange={(v) => set({ monthlyContribution: v })} suffix="€/mois" />
            {type === "av" && (
              <Field label="Prélèvements sociaux" value={config.socialCharges} onChange={(v) => set({ socialCharges: v })} suffix="%" tip="17.2% en France" />
            )}
            {type === "per" && (
              <div className="col-span-2">
                <label className="text-xs text-[var(--muted)] flex items-center mb-1">
                  TMI<Tip text="Tranche marginale d'imposition — détermine l'économie d'impôt" />
                </label>
                <div className="flex gap-2">
                  {TMI_OPTIONS.map((t) => (
                    <button key={t} onClick={() => set({ tmi: t })}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${config.tmi === t ? "bg-[var(--accent)] text-white" : "bg-[var(--border)] text-[var(--muted)]"}`}>
                      {t}%
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── SCPI Card — both cash & credit sections ──
function SCPICard({ cashConfig, onCashChange, creditConfig, onCreditChange }: {
  cashConfig: EnvelopeConfig; onCashChange: (c: EnvelopeConfig) => void;
  creditConfig: SCPICreditConfig; onCreditChange: (c: SCPICreditConfig) => void;
}) {
  const setCash = (p: Partial<EnvelopeConfig>) => onCashChange({ ...cashConfig, ...p });
  const setCredit = (p: Partial<SCPICreditConfig>) => onCreditChange({ ...creditConfig, ...p });

  const anyEnabled = cashConfig.enabled || creditConfig.enabled;

  const payment = calcLoanPayment(creditConfig.loanAmount, creditConfig.interestRate, creditConfig.loanYears);
  const netShares = creditConfig.loanAmount + creditConfig.downPayment; // 100% invested; fees at exit
  const monthlyDiv = netShares * (creditConfig.rate / 100) / 12;
  const cashflow = monthlyDiv - payment;

  return (
    <div className={`rounded-xl border p-5 transition-all md:col-span-2 ${anyEnabled ? "border-[var(--border)] bg-[var(--card)]" : "border-transparent bg-[var(--card)]/40 opacity-50"}`}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-3 h-3 rounded-full" style={{ background: "#6366f1" }} />
        <h3 className="font-semibold text-sm">SCPI</h3>
        <span className="text-[10px] text-[var(--muted)] ml-1">+{SCPI_REVALUATION}%/an revalorisation des parts</span>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Cash section */}
        <div className={`rounded-lg border p-4 transition-all ${cashConfig.enabled ? "border-[var(--border)] bg-[var(--bg)]" : "border-transparent bg-[var(--bg)]/40 opacity-60"}`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-indigo-300">💰 Comptant</span>
            <Toggle on={cashConfig.enabled} onToggle={() => setCash({ enabled: !cashConfig.enabled })} />
          </div>
          {cashConfig.enabled && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Capital initial" value={cashConfig.initialCapital} onChange={(v) => setCash({ initialCapital: v })} suffix="€" />
              <Field label="Versement mensuel" value={cashConfig.monthlyContribution} onChange={(v) => setCash({ monthlyContribution: v })} suffix="€/mois" />
              <Field label="Rendement" value={cashConfig.rate} onChange={(v) => setCash({ rate: v })} suffix="%" step={0.1} />
              <Field label="Frais d'entrée" value={cashConfig.entryFees} onChange={(v) => setCash({ entryFees: v })} suffix="%" tip="~8% sur chaque versement" />
              <div className="col-span-2 flex items-center justify-between">
                <span className="text-xs text-[var(--muted)] flex items-center">
                  Réinvestir les dividendes<Tip text="Réinvestissement automatique pour l'effet composé" />
                </span>
                <Toggle on={cashConfig.reinvestDividends} onToggle={() => setCash({ reinvestDividends: !cashConfig.reinvestDividends })} className="bg-[var(--green)]" />
              </div>
            </div>
          )}
        </div>

        {/* Credit section */}
        <div className={`rounded-lg border p-4 transition-all ${creditConfig.enabled ? "border-[var(--border)] bg-[var(--bg)]" : "border-transparent bg-[var(--bg)]/40 opacity-60"}`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-purple-300">🏦 À crédit</span>
            <Toggle on={creditConfig.enabled} onToggle={() => setCredit({ enabled: !creditConfig.enabled })} />
          </div>
          {creditConfig.enabled && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Montant emprunté" value={creditConfig.loanAmount} onChange={(v) => setCredit({ loanAmount: v })} suffix="€" min={10000} step={5000} />
              <Field label="Apport personnel" value={creditConfig.downPayment} onChange={(v) => setCredit({ downPayment: v })} suffix="€" min={0} step={1000} />
              <Field label="Taux d'intérêt" value={creditConfig.interestRate} onChange={(v) => setCredit({ interestRate: v })} suffix="%" step={0.05} tip="Taux nominal annuel du prêt" />
              <div className="flex flex-col gap-1">
                <label className="text-xs text-[var(--muted)] flex items-center">Durée du prêt<Tip text="Durée de remboursement" /></label>
                <div className="flex gap-1">
                  {[10, 15, 20, 25].map((y) => (
                    <button key={y} onClick={() => setCredit({ loanYears: y })}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${creditConfig.loanYears === y ? "bg-[var(--accent)] text-white" : "bg-[var(--border)] text-[var(--muted)]"}`}>
                      {y}a
                    </button>
                  ))}
                </div>
              </div>
              <Field label="Rendement SCPI" value={creditConfig.rate} onChange={(v) => setCredit({ rate: v })} suffix="%" step={0.1} />
              <Field label="Frais d'entrée" value={creditConfig.entryFees} onChange={(v) => setCredit({ entryFees: v })} suffix="%" tip="~8%" />

              <div className="col-span-2 bg-[var(--card)] rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--muted)]">Mensualité prêt</span>
                  <span className="text-[var(--text)] font-medium">{fmt(payment)}/mois</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--muted)]">Dividendes SCPI</span>
                  <span className="text-[var(--green)] font-medium">+{fmt(monthlyDiv)}/mois</span>
                </div>
                <div className="border-t border-[var(--border)] pt-2 flex justify-between text-xs">
                  <span className="text-[var(--muted)] font-medium">Effort d&apos;épargne réel</span>
                  <span className={`font-bold ${cashflow >= 0 ? "text-[var(--green)]" : "text-red-400"}`}>
                    {cashflow >= 0 ? "+" : ""}{fmt(cashflow)}/mois
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main ──
export default function Home() {
  const [years, setYears] = useState(25);
  const [scpi, setScpi] = useState(defaultSCPI);
  const [scpiCredit, setScpiCredit] = useState(defaultSCPICredit);
  const [av, setAv] = useState(defaultAV);
  const [per, setPer] = useState(defaultPER);

  const results = useMemo(() => {
    type SimResult = { dataPoints: number[]; capital: number; totalInvested: number; grossGains: number; netGains: number; perTaxSavings: number };
    const sims: { label: string; color: string; type: string; result: SimResult }[] = [];

    if (scpi.enabled) {
      sims.push({ label: "SCPI Comptant", color: "#6366f1", type: "scpi", result: simulate(scpi, years, "scpi") });
    }
    if (scpiCredit.enabled) {
      sims.push({ label: "SCPI Crédit", color: "#a855f7", type: "scpi-credit", result: simulateSCPICredit(scpiCredit, years) });
    }
    if (av.enabled) sims.push({ label: "Assurance Vie", color: "#22d3ee", type: "av", result: simulate(av, years, "av") });
    if (per.enabled) sims.push({ label: "PER", color: "#f97316", type: "per", result: simulate(per, years, "per") });

    // Livret comparison: same cash outflow on a 1% savings account
    const livretConfigs: { initialCapital: number; monthlyContribution: number }[] = [];
    if (scpi.enabled) {
      livretConfigs.push({ initialCapital: scpi.initialCapital, monthlyContribution: scpi.monthlyContribution });
    }
    if (scpiCredit.enabled) {
      const payment = calcLoanPayment(scpiCredit.loanAmount, scpiCredit.interestRate, scpiCredit.loanYears);
      const netS = (scpiCredit.loanAmount + scpiCredit.downPayment) * (1 - scpiCredit.entryFees / 100);
      const div = netS * (scpiCredit.rate / 100) / 12;
      const effort = Math.max(0, payment - div);
      livretConfigs.push({ initialCapital: scpiCredit.downPayment, monthlyContribution: effort });
    }
    if (av.enabled) livretConfigs.push({ initialCapital: av.initialCapital, monthlyContribution: av.monthlyContribution });
    if (per.enabled) livretConfigs.push({ initialCapital: per.initialCapital, monthlyContribution: per.monthlyContribution });

    const livret = simulateLivret(livretConfigs, years);

    const months = years * 12;
    const chartData = Array.from({ length: months + 1 }, (_, i) => {
      const point: Record<string, number | string> = { month: i };
      let total = 0;
      sims.forEach((s) => {
        const val = s.result.dataPoints[i] ?? 0;
        point[s.label] = Math.round(val);
        total += val;
      });
      point["Stratégie patrimoniale"] = Math.round(total);
      point["Livret bancaire 1%"] = Math.round(livret.dataPoints[i] ?? 0);
      return point;
    });

    const totalInvested = sims.reduce((s, sim) => s + sim.result.totalInvested, 0);
    const totalFinal = sims.reduce((s, sim) => s + sim.result.capital, 0);
    const totalNet = sims.reduce((s, sim) => s + sim.result.netGains, 0);
    const perSavings = sims.find((s) => s.type === "per")?.result.perTaxSavings ?? 0;

    return { sims, livret, chartData, totalInvested, totalFinal, totalNet, perSavings };
  }, [scpi, scpiCredit, av, per, years]);

  const difference = results.totalFinal - results.livret.capital;
  const differencePct = results.livret.capital > 0 ? ((difference / results.livret.capital) * 100).toFixed(0) : "0";

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
          Simulateur Patrimoine
        </h1>
        <p className="text-[var(--muted)] text-sm mt-1">Construisez votre patrimoine — SCPI, Assurance Vie, PER</p>
      </header>

      {/* Duration */}
      <div className="mb-6 bg-[var(--card)] rounded-xl border border-[var(--border)] p-5">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium flex items-center">Horizon de placement<Tip text="Durée totale de la simulation" /></label>
          <span className="text-lg font-bold text-[var(--accent)]">{years} ans</span>
        </div>
        <input type="range" min={1} max={40} value={years} onChange={(e) => setYears(Number(e.target.value))} className="w-full" />
        <div className="flex justify-between text-xs text-[var(--muted)] mt-1"><span>1 an</span><span>40 ans</span></div>
      </div>

      {/* Cards */}
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <SCPICard cashConfig={scpi} onCashChange={setScpi} creditConfig={scpiCredit} onCreditChange={setScpiCredit} />
        <div className="grid gap-4">
          <EnvelopeCard title="Assurance Vie" color="#22d3ee" config={av} onChange={setAv} type="av" />
          <EnvelopeCard title="PER" color="#f97316" config={per} onChange={setPer} type="per" />
        </div>
      </div>

      {/* Credit info banner */}
      {scpiCredit.enabled && (() => {
        const cr = simulateSCPICredit(scpiCredit, years);
        return (
          <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 rounded-xl border border-purple-500/20 p-5 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🏦</span>
              <h3 className="text-sm font-semibold text-purple-300">SCPI à crédit — Détails</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-xs text-[var(--muted)]">Parts acquises (net)</p>
                <p className="text-lg font-bold">{fmt(cr.netShares)}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--muted)]">Effort mensuel</p>
                <p className={`text-lg font-bold ${cr.cashflow >= 0 ? "text-[var(--green)]" : "text-orange-400"}`}>
                  {fmt(Math.abs(cr.cashflow))}/mois
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--muted)]">Coût total du crédit</p>
                <p className="text-lg font-bold text-red-400">{fmt(cr.totalLoanCost)}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--muted)]">Patrimoine SCPI crédit</p>
                <p className="text-lg font-bold text-[var(--green)]">{fmt(cr.capital)}</p>
              </div>
            </div>
            {years > scpiCredit.loanYears && (
              <p className="text-xs text-purple-300/70 mt-3">
                💡 Après {scpiCredit.loanYears} ans, plus de mensualités ! Vous percevez ~{fmt(cr.monthlyDividend)}/mois de revenus passifs.
              </p>
            )}
          </div>
        );
      })()}

      {/* ═══ BIG COMPARISON BLOCK ═══ */}
      <div className="relative mb-8 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-cyan-600/20" />
        <div className="relative border border-indigo-500/30 rounded-2xl p-6 md:p-8">
          <h2 className="text-center text-sm font-semibold text-[var(--muted)] uppercase tracking-wider mb-6">
            Pourquoi investir fait la différence
          </h2>

          <div className="grid md:grid-cols-3 gap-6 items-center">
            {/* Livret */}
            <div className="text-center p-5 rounded-xl bg-[var(--bg)]/60 border border-[var(--border)]">
              <p className="text-xs text-[var(--muted)] mb-2">💤 Livret bancaire à {LIVRET_RATE}%</p>
              <p className="text-sm text-[var(--muted)] mb-1">Votre argent dort</p>
              <AnimatedNumber value={results.livret.capital} className="text-2xl md:text-3xl font-bold text-gray-400" />
              <p className="text-xs text-gray-500 mt-2">dont {fmt(results.livret.gains)} d&apos;intérêts</p>
            </div>

            {/* Arrow / difference */}
            <div className="text-center">
              <div className="text-3xl mb-2">→</div>
              <div className="bg-[var(--green)]/10 border border-[var(--green)]/30 rounded-xl p-4">
                <p className="text-xs text-[var(--green)] font-medium mb-1">Gains supplémentaires</p>
                <AnimatedNumber value={difference} className="text-3xl md:text-4xl font-black text-[var(--green)]" />
                <p className="text-lg font-bold text-[var(--green)] mt-1">+{differencePct}%</p>
              </div>
            </div>

            {/* Strategy */}
            <div className="text-center p-5 rounded-xl bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 border border-indigo-500/30">
              <p className="text-xs text-indigo-300 mb-2">🚀 Stratégie patrimoniale</p>
              <p className="text-sm text-indigo-200 mb-1">Patrimoine estimé</p>
              <AnimatedNumber value={results.totalFinal} className="text-2xl md:text-3xl font-bold text-white" />
              <p className="text-xs text-indigo-300/70 mt-2">dont {fmt(results.totalFinal - results.totalInvested)} de gains générés</p>
            </div>
          </div>

          {per.enabled && results.perSavings > 0 && (
            <div className="mt-4 text-center">
              <span className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-2 text-sm">
                <span className="text-orange-400">🏦</span>
                <span className="text-orange-300 font-semibold">Économie d&apos;impôt PER : {fmt(results.perSavings)}</span>
                <span className="text-xs text-[var(--muted)]">(TMI {per.tmi}%)</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Chart — two curves: strategy vs livret */}
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5 mb-8">
        <h2 className="text-sm font-semibold mb-4">Évolution du patrimoine estimé</h2>
        <div className="h-[350px] md:h-[420px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={results.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gStrategy" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="50%" stopColor="#22d3ee" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gLivret" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#71717a" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#71717a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
              <XAxis dataKey="month" tickFormatter={(m: number) => `${Math.floor(m / 12)}a`}
                stroke="#71717a" fontSize={11} interval={Math.max(1, Math.floor((years * 12) / 10))} />
              <YAxis stroke="#71717a" fontSize={11} tickFormatter={(v: number) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : `${(v / 1000).toFixed(0)}k`} />
              <RTooltip contentStyle={{ background: "#12121a", border: "1px solid #1e1e2e", borderRadius: "8px", fontSize: "12px" }}
                formatter={(value: unknown) => fmt(Number(value))}
                labelFormatter={(m: unknown) => `Année ${(Number(m) / 12).toFixed(1)}`} />
              <Legend />
              <Area type="monotone" dataKey="Stratégie patrimoniale" stroke="#6366f1" fill="url(#gStrategy)" strokeWidth={3} />
              <Area type="monotone" dataKey="Livret bancaire 1%" stroke="#71717a" fill="url(#gLivret)" strokeWidth={1.5} strokeDasharray="6 4" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5 mb-8 overflow-x-auto">
        <h2 className="text-sm font-semibold mb-4">Récapitulatif par enveloppe</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[var(--muted)] text-xs border-b border-[var(--border)]">
              <th className="text-left py-2">Enveloppe</th>
              <th className="text-right py-2">Effort total</th>
              <th className="text-right py-2">Patrimoine estimé</th>
              <th className="text-right py-2">Gains générés</th>
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
            <tr className="border-b border-[var(--border)]/50 text-gray-500">
              <td className="py-3 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-600" />Livret bancaire {LIVRET_RATE}%
              </td>
              <td className="text-right">{fmt(results.livret.totalInvested)}</td>
              <td className="text-right">{fmt(results.livret.capital)}</td>
              <td className="text-right">{fmt(results.livret.gains)}</td>
              <td className="text-right">{fmt(results.livret.gains)}</td>
            </tr>
            <tr className="font-semibold">
              <td className="py-3">🚀 Total stratégie</td>
              <td className="text-right">{fmt(results.totalInvested)}</td>
              <td className="text-right text-[var(--green)]">{fmt(results.totalFinal)}</td>
              <td className="text-right text-[var(--green)]">{fmt(results.totalFinal - results.totalInvested)}</td>
              <td className="text-right text-[var(--green)]">{fmt(results.totalNet)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Bottom CTA */}
      <div className="bg-gradient-to-r from-indigo-500/15 to-cyan-500/15 rounded-2xl border border-indigo-500/25 p-8 text-center mb-8">
        <p className="text-xs text-[var(--muted)] uppercase tracking-wider mb-3">Patrimoine estimé à {years} ans</p>
        <AnimatedNumber value={results.totalFinal} className="text-4xl md:text-5xl font-black bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent" />
        <p className="text-[var(--green)] font-bold text-xl mt-2">
          +{fmt(results.totalFinal - results.totalInvested)} de gains générés
        </p>
        <div className="mt-4 inline-flex items-center gap-2 bg-[var(--green)]/10 border border-[var(--green)]/20 rounded-full px-5 py-2">
          <span className="text-[var(--green)] font-bold text-lg">+{fmt(difference)}</span>
          <span className="text-[var(--muted)] text-sm">vs livret bancaire</span>
        </div>
      </div>

      <footer className="text-center text-xs text-[var(--muted)] mt-8 mb-4">
        Simulation indicative — Les rendements passés ne préjugent pas des rendements futurs
      </footer>
    </main>
  );
}

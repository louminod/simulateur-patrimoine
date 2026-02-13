"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
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

// ══════════════════════════════════════════
// TYPES & DEFAULTS (untouched logic)
// ══════════════════════════════════════════
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
  enabled: false, loanAmount: 100000, downPayment: 0, interestRate: 5.35, loanYears: 25, rate: 5.5, entryFees: 8,
};
const defaultAV: EnvelopeConfig = {
  enabled: true, initialCapital: 10000, monthlyContribution: 200, rate: 4,
  reinvestDividends: false, entryFees: 4, jouissanceMonths: 0, socialCharges: 17.2, tmi: 30,
};
const defaultPER: EnvelopeConfig = {
  enabled: true, initialCapital: 5000, monthlyContribution: 150, rate: 4,
  reinvestDividends: false, entryFees: 4, jouissanceMonths: 0, socialCharges: 0, tmi: 30,
};

const AV_PER_ENTRY_FEES = 4;
const AV_PER_MGMT_FEES = 1;
const LIVRET_RATE = 1;
const SCPI_REVALUATION = 1;
const TMI_OPTIONS = [11, 30, 41, 45];

const fmt = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

// ══════════════════════════════════════════
// SIMULATION LOGIC (100% preserved)
// ══════════════════════════════════════════
function calcLoanPayment(principal: number, annualRate: number, years: number) {
  if (principal <= 0) return 0;
  const r = annualRate / 100 / 12;
  const n = years * 12;
  if (r === 0) return principal / n;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

function simulate(config: EnvelopeConfig, years: number, type: "scpi" | "av" | "per") {
  const months = years * 12;
  const isAVPER = type === "av" || type === "per";
  const entryFeePct = type === "scpi" ? config.entryFees / 100 : 0;
  const mgmtFeeMonthly = 0;
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
    const gains = capital * monthlyRate;
    capital += gains;
    if (isAVPER) capital *= (1 - mgmtFeeMonthly);
    if (type === "scpi") capital *= (1 + monthlyRevalo);
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

function simulateSCPICredit(config: SCPICreditConfig, totalYears: number) {
  const totalInvestment = config.loanAmount + config.downPayment;
  const netShares = totalInvestment;
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
      sharesValue *= (1 + monthlyRevalo);
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
  const finalSharesValue = sharesValue - entryFeesAmount;
  const totalOutOfPocket = config.downPayment + Math.max(0, -cashflow) * Math.min(loanMonths, months);
  return {
    dataPoints, capital: finalSharesValue, totalInvested: totalOutOfPocket,
    grossGains: finalSharesValue - totalOutOfPocket, netGains: finalSharesValue - totalOutOfPocket,
    perTaxSavings: 0, monthlyPayment, monthlyDividend: netShares * monthlyRate,
    cashflow, totalLoanCost, netShares,
  };
}

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

// ══════════════════════════════════════════
// UI COMPONENTS
// ══════════════════════════════════════════

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

function Tip({ text }: { text: string }) {
  return (
    <span className="relative group ml-1.5 cursor-help">
      <span className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full bg-white/5 border border-white/10 text-[10px] text-[var(--muted)] hover:bg-white/10 transition-colors">?</span>
      <span className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-xl bg-[#1a1a2e] border border-white/10 text-xs text-[var(--text)] w-60 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-2xl leading-relaxed">
        {text}
      </span>
    </span>
  );
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle}
      className={`w-12 h-6 rounded-full transition-all relative ${on ? "bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)]" : "bg-white/10"}`}>
      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-md ${on ? "left-7" : "left-1"}`} />
    </button>
  );
}

function SliderField({ label, value, onChange, min, max, step, suffix, tip }: {
  label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step?: number; suffix?: string; tip?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm text-[var(--muted)] flex items-center">{label}{tip && <Tip text={tip} />}</label>
        <div className="flex items-center gap-1 bg-white/5 rounded-lg px-3 py-1.5 border border-white/5">
          <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))}
            min={min} max={max} step={step ?? 1}
            className="bg-transparent outline-none w-20 text-right text-sm font-semibold text-white" />
          {suffix && <span className="text-xs text-[var(--muted)] ml-0.5">{suffix}</span>}
        </div>
      </div>
      <input type="range" min={min} max={max} step={step ?? 1} value={value}
        onChange={(e) => onChange(Number(e.target.value))} className="w-full" />
    </div>
  );
}

function CompactField({ label, value, onChange, suffix, step, tip }: {
  label: string; value: number; onChange: (v: number) => void;
  suffix?: string; step?: number; tip?: string;
}) {
  return (
    <div>
      <label className="text-xs text-[var(--muted)] flex items-center mb-1">{label}{tip && <Tip text={tip} />}</label>
      <div className="flex items-center gap-1 bg-white/5 border border-white/5 rounded-lg px-3 py-2">
        <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))}
          step={step ?? 1} className="bg-transparent outline-none w-full text-sm text-white" />
        {suffix && <span className="text-xs text-[var(--muted)]">{suffix}</span>}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// ENVELOPE CARDS
// ══════════════════════════════════════════

function SCPICashCard({ config, onChange }: { config: EnvelopeConfig; onChange: (c: EnvelopeConfig) => void }) {
  const set = (p: Partial<EnvelopeConfig>) => onChange({ ...config, ...p });
  const [showAdvanced, setShowAdvanced] = useState(false);
  return (
    <EnvelopeCardWrapper
      icon="🏢" title="SCPI Comptant" subtitle="Investissez dans l'immobilier et percevez des revenus réguliers"
      enabled={config.enabled} onToggle={() => set({ enabled: !config.enabled })}
      gradient="from-indigo-500/20 to-violet-500/20" borderColor="border-indigo-500/30"
    >
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <CompactField label="Capital initial" value={config.initialCapital} onChange={(v) => set({ initialCapital: v })} suffix="€" />
          <CompactField label="Effort d'épargne" value={config.monthlyContribution} onChange={(v) => set({ monthlyContribution: v })} suffix="€/mois" />
        </div>
        <button onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs text-[var(--accent)] hover:text-[var(--accent2)] transition-colors flex items-center gap-1">
          <span className={`transition-transform ${showAdvanced ? "rotate-90" : ""}`}>▸</span>
          Personnaliser
        </button>
        {showAdvanced && (
          <div className="space-y-3 pt-2 border-t border-white/5">
            <div className="grid grid-cols-2 gap-3">
              <CompactField label="Rendement" value={config.rate} onChange={(v) => set({ rate: v })} suffix="%" step={0.1} />
              <CompactField label="Frais d'entrée" value={config.entryFees} onChange={(v) => set({ entryFees: v })} suffix="%" tip="Environ 8% sur chaque versement, amortis dans le temps" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--muted)] flex items-center">
                Réinvestir les revenus<Tip text="Les revenus sont automatiquement réinvestis pour accélérer la croissance" />
              </span>
              <Toggle on={config.reinvestDividends} onToggle={() => set({ reinvestDividends: !config.reinvestDividends })} />
            </div>
          </div>
        )}
      </div>
    </EnvelopeCardWrapper>
  );
}

function SCPICreditCard({ config, onChange }: { config: SCPICreditConfig; onChange: (c: SCPICreditConfig) => void }) {
  const set = (p: Partial<SCPICreditConfig>) => onChange({ ...config, ...p });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const payment = calcLoanPayment(config.loanAmount, config.interestRate, config.loanYears);
  const netShares = config.loanAmount + config.downPayment;
  const monthlyDiv = netShares * (config.rate / 100) / 12;
  const cashflow = monthlyDiv - payment;

  return (
    <EnvelopeCardWrapper
      icon="🏦" title="SCPI à Crédit" subtitle="La banque finance votre patrimoine immobilier"
      enabled={config.enabled} onToggle={() => set({ enabled: !config.enabled })}
      gradient="from-purple-500/20 to-pink-500/20" borderColor="border-purple-500/30"
    >
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <CompactField label="Montant emprunté" value={config.loanAmount} onChange={(v) => set({ loanAmount: v })} suffix="€" />
          <CompactField label="Apport personnel" value={config.downPayment} onChange={(v) => set({ downPayment: v })} suffix="€" />
        </div>
        {/* Cashflow summary */}
        <div className="bg-white/5 rounded-xl p-3 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-[var(--muted)]">Mensualité prêt</span>
            <span className="text-white font-medium">{fmt(payment)}/mois</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[var(--muted)]">Revenus passifs</span>
            <span className="text-[var(--green)] font-medium">+{fmt(monthlyDiv)}/mois</span>
          </div>
          <div className="border-t border-white/10 pt-2 flex justify-between text-xs">
            <span className="font-medium text-[var(--muted)]">Votre effort réel</span>
            <span className={`font-bold ${cashflow >= 0 ? "text-[var(--green)]" : "text-[var(--orange)]"}`}>
              {cashflow >= 0 ? "+" : ""}{fmt(cashflow)}/mois
            </span>
          </div>
        </div>
        {/* Tax deduction info */}
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
          <p className="text-xs text-emerald-300 font-medium mb-1">💡 Avantage fiscal</p>
          <p className="text-xs text-emerald-200/80 leading-relaxed">
            Les intérêts d&apos;emprunt sont <strong>déductibles de vos revenus fonciers</strong>. Le coût réel du crédit est donc significativement réduit par l&apos;économie d&apos;impôt. Vous constituez un patrimoine immobilier sans effort grâce à l&apos;effet de levier du crédit.
          </p>
        </div>
        <button onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs text-[var(--accent)] hover:text-[var(--accent2)] transition-colors flex items-center gap-1">
          <span className={`transition-transform ${showAdvanced ? "rotate-90" : ""}`}>▸</span>
          Personnaliser
        </button>
        {showAdvanced && (
          <div className="space-y-3 pt-2 border-t border-white/5">
            <div className="grid grid-cols-2 gap-3">
              <CompactField label="Taux d'intérêt" value={config.interestRate} onChange={(v) => set({ interestRate: v })} suffix="%" step={0.05} tip="Taux nominal annuel du prêt" />
              <CompactField label="Rendement SCPI" value={config.rate} onChange={(v) => set({ rate: v })} suffix="%" step={0.1} />
              <CompactField label="Frais d'entrée" value={config.entryFees} onChange={(v) => set({ entryFees: v })} suffix="%" />
              <div>
                <label className="text-xs text-[var(--muted)] mb-1 block">Durée du prêt</label>
                <div className="flex gap-1">
                  {[10, 15, 20, 25].map((y) => (
                    <button key={y} onClick={() => set({ loanYears: y })}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${config.loanYears === y ? "bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] text-white" : "bg-white/5 text-[var(--muted)] hover:bg-white/10"}`}>
                      {y}a
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </EnvelopeCardWrapper>
  );
}

function AVCard({ config, onChange }: { config: EnvelopeConfig; onChange: (c: EnvelopeConfig) => void }) {
  const set = (p: Partial<EnvelopeConfig>) => onChange({ ...config, ...p });
  const [showAdvanced, setShowAdvanced] = useState(false);
  return (
    <EnvelopeCardWrapper
      icon="🛡️" title="Assurance Vie" subtitle="Épargne flexible avec fiscalité avantageuse après 8 ans"
      enabled={config.enabled} onToggle={() => set({ enabled: !config.enabled })}
      gradient="from-cyan-500/20 to-blue-500/20" borderColor="border-cyan-500/30"
    >
      <div className="space-y-3">
        <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/15 rounded-xl px-3 py-2.5">
          <p className="text-[11px] text-cyan-200/80 leading-relaxed">
            ✨ Rendement de <span className="font-semibold text-cyan-300">4% net de frais</span> grâce à un accompagnement personnalisé par votre conseiller.
          </p>
          <p className="text-[10px] text-cyan-300/50 mt-1.5">
            Frais réduits : 4% à l&apos;entrée · 1%/an de gestion — parmi les plus bas du marché
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <CompactField label="Capital initial" value={config.initialCapital} onChange={(v) => set({ initialCapital: v })} suffix="€" />
          <CompactField label="Effort d'épargne" value={config.monthlyContribution} onChange={(v) => set({ monthlyContribution: v })} suffix="€/mois" />
        </div>
        <button onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs text-[var(--accent)] hover:text-[var(--accent2)] transition-colors flex items-center gap-1">
          <span className={`transition-transform ${showAdvanced ? "rotate-90" : ""}`}>▸</span>
          Personnaliser
        </button>
        {showAdvanced && (
          <div className="pt-2 border-t border-white/5">
            <CompactField label="Prélèvements sociaux" value={config.socialCharges} onChange={(v) => set({ socialCharges: v })} suffix="%" tip="17,2% en France sur les gains" />
          </div>
        )}
      </div>
    </EnvelopeCardWrapper>
  );
}

function PERCard({ config, onChange }: { config: EnvelopeConfig; onChange: (c: EnvelopeConfig) => void }) {
  const set = (p: Partial<EnvelopeConfig>) => onChange({ ...config, ...p });
  const [showAdvanced, setShowAdvanced] = useState(false);
  return (
    <EnvelopeCardWrapper
      icon="🎯" title="Plan Épargne Retraite" subtitle="Préparez votre retraite tout en réduisant vos impôts"
      enabled={config.enabled} onToggle={() => set({ enabled: !config.enabled })}
      gradient="from-orange-500/20 to-amber-500/20" borderColor="border-orange-500/30"
    >
      <div className="space-y-3">
        <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/15 rounded-xl px-3 py-2.5">
          <p className="text-[11px] text-orange-200/80 leading-relaxed">
            ✨ Rendement de <span className="font-semibold text-orange-300">4% net de frais</span> + déduction fiscale à l&apos;entrée selon votre TMI.
          </p>
          <p className="text-[10px] text-orange-300/50 mt-1.5">
            Frais réduits : 4% à l&apos;entrée · 1%/an de gestion — parmi les plus bas du marché
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <CompactField label="Capital initial" value={config.initialCapital} onChange={(v) => set({ initialCapital: v })} suffix="€" />
          <CompactField label="Effort d'épargne" value={config.monthlyContribution} onChange={(v) => set({ monthlyContribution: v })} suffix="€/mois" />
        </div>
        <div>
          <label className="text-xs text-[var(--muted)] flex items-center mb-1.5">
            Tranche d&apos;imposition<Tip text="Votre tranche marginale d'imposition. Plus elle est élevée, plus l'économie d'impôt est importante." />
          </label>
          <div className="flex gap-2">
            {TMI_OPTIONS.map((t) => (
              <button key={t} onClick={() => set({ tmi: t })}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${config.tmi === t ? "bg-gradient-to-r from-[var(--orange)] to-amber-400 text-white" : "bg-white/5 text-[var(--muted)] hover:bg-white/10"}`}>
                {t}%
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs text-[var(--accent)] hover:text-[var(--accent2)] transition-colors flex items-center gap-1">
          <span className={`transition-transform ${showAdvanced ? "rotate-90" : ""}`}>▸</span>
          Personnaliser
        </button>
        {showAdvanced && (
          <div className="pt-2 border-t border-white/5 text-xs text-[var(--muted)]">
            Rendement : 4% net de frais
          </div>
        )}
      </div>
    </EnvelopeCardWrapper>
  );
}

function EnvelopeCardWrapper({ icon, title, subtitle, enabled, onToggle, gradient, borderColor, children }: {
  icon: string; title: string; subtitle: string; enabled: boolean; onToggle: () => void;
  gradient: string; borderColor: string; children: React.ReactNode;
}) {
  return (
    <div className={`rounded-2xl border p-5 transition-all ${enabled ? `${borderColor} bg-gradient-to-br ${gradient}` : "border-white/5 bg-white/[0.02] opacity-60"}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <div>
            <h3 className="font-semibold text-sm text-white">{title}</h3>
            <p className="text-[11px] text-[var(--muted)] mt-0.5 leading-snug max-w-[220px]">{subtitle}</p>
          </div>
        </div>
        <Toggle on={enabled} onToggle={onToggle} />
      </div>
      {enabled && <div className="mt-4">{children}</div>}
    </div>
  );
}

// ══════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════
export default function Home() {
  const [years, setYears] = useState(25);
  const [scpi, setScpi] = useState(defaultSCPI);
  const [scpiCredit, setScpiCredit] = useState(defaultSCPICredit);
  const [av, setAv] = useState(defaultAV);
  const [per, setPer] = useState(defaultPER);

  // Aggregate all initial capitals and monthly contributions for global sliders
  const totalInitial = (scpi.enabled ? scpi.initialCapital : 0) + (av.enabled ? av.initialCapital : 0) + (per.enabled ? per.initialCapital : 0) + (scpiCredit.enabled ? scpiCredit.downPayment : 0);
  const totalMonthly = (scpi.enabled ? scpi.monthlyContribution : 0) + (av.enabled ? av.monthlyContribution : 0) + (per.enabled ? per.monthlyContribution : 0);

  const results = useMemo(() => {
    type SimResult = { dataPoints: number[]; capital: number; totalInvested: number; grossGains: number; netGains: number; perTaxSavings: number };
    const sims: { label: string; color: string; type: string; result: SimResult }[] = [];
    if (scpi.enabled) sims.push({ label: "SCPI Comptant", color: "#7c5cfc", type: "scpi", result: simulate(scpi, years, "scpi") });
    if (scpiCredit.enabled) sims.push({ label: "SCPI Crédit", color: "#c084fc", type: "scpi-credit", result: simulateSCPICredit(scpiCredit, years) });
    if (av.enabled) sims.push({ label: "Assurance Vie", color: "#38bdf8", type: "av", result: simulate(av, years, "av") });
    if (per.enabled) sims.push({ label: "PER", color: "#fb923c", type: "per", result: simulate(per, years, "per") });

    const livretConfigs: { initialCapital: number; monthlyContribution: number }[] = [];
    if (scpi.enabled) livretConfigs.push({ initialCapital: scpi.initialCapital, monthlyContribution: scpi.monthlyContribution });
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
      sims.forEach((s) => { const val = s.result.dataPoints[i] ?? 0; point[s.label] = Math.round(val); total += val; });
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
    <main className="min-h-screen max-w-5xl mx-auto px-4 md:px-8 pb-12">

      {/* ═══ HERO ═══ */}
      <section className="hero-gradient rounded-b-3xl px-6 pt-10 pb-8 md:pt-14 md:pb-10 -mx-4 md:-mx-8 mb-8">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-sm text-[var(--accent2)] font-medium tracking-wide mb-3">Découvrez combien votre épargne pourrait vous rapporter</p>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-2">
            Faites fructifier<br />votre épargne
          </h1>
          <p className="text-[var(--muted)] text-sm md:text-base mt-3 mb-8">
            Simulez votre patrimoine avec les meilleures enveloppes d&apos;investissement
          </p>

          {/* Big result */}
          <div className="bg-white/[0.05] backdrop-blur-sm rounded-2xl border border-white/10 p-6 md:p-8">
            <p className="text-xs text-[var(--muted)] uppercase tracking-widest mb-2">Votre patrimoine dans {years} ans</p>
            <AnimatedNumber value={results.totalFinal} className="text-4xl md:text-6xl font-black bg-gradient-to-r from-[var(--accent)] via-[var(--accent2)] to-[var(--green)] bg-clip-text text-transparent animate-in" />
            <div className="flex items-center justify-center gap-4 mt-4 flex-wrap">
              <span className="text-sm text-[var(--green)] font-semibold">+{fmt(results.totalFinal - results.totalInvested)} de gains</span>
              <span className="text-xs text-[var(--muted)]">•</span>
              <span className="text-sm text-[var(--muted)]">pour {fmt(results.totalInvested)} investis</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ HORIZON ONLY ═══ */}
      <section className="mb-8">
        <div className="bg-[var(--card)] rounded-2xl border border-white/5 p-6">
          <SliderField label="⏳ Horizon de placement" value={years} onChange={setYears} min={1} max={40} suffix="ans"
            tip="Plus vous investissez longtemps, plus les intérêts composés travaillent pour vous" />
        </div>
      </section>

      {/* ═══ ENVELOPE CARDS ═══ */}
      <section className="mb-8">
        <h2 className="text-lg font-bold text-white mb-4">Choisissez vos enveloppes</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <SCPICashCard config={scpi} onChange={setScpi} />
          <SCPICreditCard config={scpiCredit} onChange={setScpiCredit} />
          <AVCard config={av} onChange={setAv} />
          <PERCard config={per} onChange={setPer} />
        </div>
      </section>

      {/* ═══ SCPI Credit details banner ═══ */}
      {scpiCredit.enabled && (() => {
        const cr = simulateSCPICredit(scpiCredit, years);
        return (
          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl border border-purple-500/20 p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">🏦</span>
              <h3 className="text-sm font-semibold text-purple-300">Détail SCPI à crédit</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div><p className="text-xs text-[var(--muted)]">Parts acquises</p><p className="text-lg font-bold">{fmt(cr.netShares)}</p></div>
              <div><p className="text-xs text-[var(--muted)]">Effort mensuel</p><p className={`text-lg font-bold ${cr.cashflow >= 0 ? "text-[var(--green)]" : "text-[var(--orange)]"}`}>{fmt(Math.abs(cr.cashflow))}/mois</p></div>
              <div><p className="text-xs text-[var(--muted)]">Coût du crédit</p><p className="text-lg font-bold text-red-400">{fmt(cr.totalLoanCost)}</p><p className="text-[10px] text-emerald-400 mt-1">Intérêts déductibles des impôts</p></div>
              <div><p className="text-xs text-[var(--muted)]">Patrimoine SCPI</p><p className="text-lg font-bold text-[var(--green)]">{fmt(cr.capital)}</p></div>
            </div>
            {years > scpiCredit.loanYears && (
              <p className="text-xs text-purple-300/70 mt-4">
                💡 Après {scpiCredit.loanYears} ans, plus de mensualités ! Vous percevez environ {fmt(cr.monthlyDividend)}/mois de revenus passifs.
              </p>
            )}
          </div>
        );
      })()}

      {/* ═══ BIG COMPARISON ═══ */}
      <section className="mb-8">
        <div className="relative rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/20 via-purple-600/10 to-[var(--accent2)]/15" />
          <div className="relative border border-[var(--accent)]/20 rounded-3xl p-6 md:p-10">
            <h2 className="text-center text-xs font-semibold text-[var(--muted)] uppercase tracking-[0.2em] mb-8">
              Pourquoi investir fait la différence
            </h2>

            <div className="grid md:grid-cols-3 gap-6 items-center">
              {/* Livret */}
              <div className="text-center p-6 rounded-2xl bg-white/[0.03] border border-white/5">
                <p className="text-2xl mb-2">💤</p>
                <p className="text-xs text-[var(--muted)] mb-1">Livret bancaire à {LIVRET_RATE}%</p>
                <p className="text-sm text-[var(--muted)] mb-2">Votre argent dort</p>
                <AnimatedNumber value={results.livret.capital} className="text-2xl md:text-3xl font-bold text-gray-400" />
                <p className="text-xs text-gray-600 mt-2">dont {fmt(results.livret.gains)} d&apos;intérêts</p>
              </div>

              {/* Difference */}
              <div className="text-center">
                <div className="hidden md:block text-4xl text-[var(--muted)] mb-3">→</div>
                <div className="md:hidden text-2xl text-[var(--muted)] mb-3 rotate-90">→</div>
                <div className="bg-[var(--green)]/10 border border-[var(--green)]/25 rounded-2xl p-5">
                  <p className="text-xs text-[var(--green)] font-medium mb-2">Gains supplémentaires</p>
                  <AnimatedNumber value={difference} className="text-3xl md:text-5xl font-black text-[var(--green)]" />
                  <p className="text-xl font-bold text-[var(--green)] mt-1">+{differencePct}%</p>
                </div>
              </div>

              {/* Strategy */}
              <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-[var(--accent)]/10 to-[var(--accent2)]/10 border border-[var(--accent)]/25">
                <p className="text-2xl mb-2">🚀</p>
                <p className="text-xs text-[var(--accent2)] mb-1">Stratégie patrimoniale</p>
                <p className="text-sm text-white/70 mb-2">Patrimoine estimé</p>
                <AnimatedNumber value={results.totalFinal} className="text-2xl md:text-3xl font-bold text-white" />
                <p className="text-xs text-[var(--accent)]/70 mt-2">dont {fmt(results.totalFinal - results.totalInvested)} de gains</p>
              </div>
            </div>

            {per.enabled && results.perSavings > 0 && (
              <div className="mt-6 text-center">
                <span className="inline-flex items-center gap-2 bg-[var(--orange)]/10 border border-[var(--orange)]/20 rounded-full px-5 py-2.5 text-sm">
                  <span>🎯</span>
                  <span className="text-[var(--orange)] font-semibold">Économie d&apos;impôt PER : {fmt(results.perSavings)}</span>
                  <span className="text-xs text-[var(--muted)]">(TMI {per.tmi}%)</span>
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ═══ CHART ═══ */}
      <section className="mb-8">
        <div className="bg-[var(--card)] rounded-2xl border border-white/5 p-5 md:p-6">
          <h2 className="text-sm font-semibold mb-5 text-white">📈 Évolution de votre patrimoine</h2>
          <div className="h-[300px] md:h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={results.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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

      {/* ═══ RECAP TABLE ═══ */}
      <section className="mb-8">
        <div className="bg-[var(--card)] rounded-2xl border border-white/5 p-5 md:p-6 overflow-x-auto">
          <h2 className="text-sm font-semibold mb-4 text-white">📋 Détail par enveloppe</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[var(--muted)] text-xs border-b border-white/5">
                <th className="text-left py-3">Enveloppe</th>
                <th className="text-right py-3">Investi</th>
                <th className="text-right py-3">Patrimoine</th>
                <th className="text-right py-3 hidden sm:table-cell">Gains bruts</th>
                <th className="text-right py-3">Gains nets</th>
              </tr>
            </thead>
            <tbody>
              {results.sims.map((s) => (
                <tr key={s.label} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                    <span className="text-white/90">{s.label}</span>
                  </td>
                  <td className="text-right text-[var(--muted)]">{fmt(s.result.totalInvested)}</td>
                  <td className="text-right font-medium text-white">{fmt(s.result.capital)}</td>
                  <td className="text-right text-[var(--green)] hidden sm:table-cell">{fmt(s.result.grossGains)}</td>
                  <td className="text-right text-[var(--green)] font-medium">{fmt(s.result.netGains)}</td>
                </tr>
              ))}
              <tr className="border-b border-white/[0.03] text-gray-500">
                <td className="py-3.5 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-gray-600" />Livret {LIVRET_RATE}%
                </td>
                <td className="text-right">{fmt(results.livret.totalInvested)}</td>
                <td className="text-right">{fmt(results.livret.capital)}</td>
                <td className="text-right hidden sm:table-cell">{fmt(results.livret.gains)}</td>
                <td className="text-right">{fmt(results.livret.gains)}</td>
              </tr>
              <tr className="font-semibold">
                <td className="py-3.5 text-white">🚀 Total stratégie</td>
                <td className="text-right text-white">{fmt(results.totalInvested)}</td>
                <td className="text-right text-[var(--green)]">{fmt(results.totalFinal)}</td>
                <td className="text-right text-[var(--green)] hidden sm:table-cell">{fmt(results.totalFinal - results.totalInvested)}</td>
                <td className="text-right text-[var(--green)]">{fmt(results.totalNet)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <footer className="text-center text-xs text-[var(--muted)] py-8 border-t border-white/5 space-y-1">
        <p>Simulation à titre indicatif — Les performances passées ne préjugent pas des performances futures.</p>
        <p>Les investissements comportent des risques, notamment de perte en capital.</p>
      </footer>
    </main>
  );
}

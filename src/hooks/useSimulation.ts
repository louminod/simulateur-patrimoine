import { useMemo } from "react";
import type { EnvelopeConfig, SCPICreditConfig, AggregatedResults, SCPICreditResult } from "@/lib/types";
import { LIVRET_RATE } from "@/lib/constants";
import { simulate, simulateSCPICredit, simulateLivret, calcLoanPayment, getInsuranceRate } from "@/lib/simulation";

function computeCreditEffort(config: SCPICreditConfig, loanPayment: number, insuranceRate: number): {
  effort: number;
  monthlyPayment: number;
  monthlyDividend: number;
} {
  const monthlyInsurance = config.loanAmount * insuranceRate / 100 / 12;
  const monthlyPayment = loanPayment + monthlyInsurance;
  const netShares = (config.loanAmount + config.downPayment) * (1 - config.entryFees / 100);
  const monthlyDividend = netShares * (config.rate / 100) / 12;
  const effort = Math.max(0, monthlyPayment - monthlyDividend);
  return { effort, monthlyPayment, monthlyDividend };
}

export function useSimulation(
  scpi: EnvelopeConfig,
  scpiCredit: SCPICreditConfig,
  av: EnvelopeConfig,
  per: EnvelopeConfig,
  years: number,
): AggregatedResults {
  return useMemo(() => {
    // ── Run simulations once ───────────────────────────────────────────────
    const sims: AggregatedResults["sims"] = [];
    if (scpi.enabled) sims.push({ label: "SCPI Comptant", color: "#7c5cfc", type: "scpi", result: simulate(scpi, years, "scpi") });
    if (scpiCredit.enabled) sims.push({ label: "SCPI Crédit", color: "#c084fc", type: "scpi-credit", result: simulateSCPICredit(scpiCredit, years) });
    if (av.enabled) sims.push({ label: "Assurance Vie", color: "#38bdf8", type: "av", result: simulate(av, years, "av") });
    if (per.enabled) sims.push({ label: "PER", color: "#fb923c", type: "per", result: simulate(per, years, "per") });

    // ── Credit loan payment computed once, reused below ───────────────────
    const creditLoanPayment = scpiCredit.enabled
      ? calcLoanPayment(scpiCredit.loanAmount, scpiCredit.interestRate, scpiCredit.loanYears)
      : 0;
    const creditInsuranceRate = scpiCredit.enabled ? getInsuranceRate(scpiCredit.borrowerAge) : 0;
    const creditEffortData = scpiCredit.enabled
      ? computeCreditEffort(scpiCredit, creditLoanPayment, creditInsuranceRate)
      : null;

    // ── Livret baseline ────────────────────────────────────────────────────
    const livretConfigs: { initialCapital: number; monthlyContribution: number }[] = [];
    if (scpi.enabled) livretConfigs.push({ initialCapital: scpi.initialCapital, monthlyContribution: scpi.monthlyContribution });
    if (scpiCredit.enabled && creditEffortData) {
      livretConfigs.push({ initialCapital: scpiCredit.downPayment, monthlyContribution: creditEffortData.effort });
    }
    if (av.enabled) livretConfigs.push({ initialCapital: av.initialCapital, monthlyContribution: av.monthlyContribution });
    if (per.enabled) livretConfigs.push({ initialCapital: per.initialCapital, monthlyContribution: per.monthlyContribution });

    const livret = simulateLivret(livretConfigs, years, LIVRET_RATE);

    // ── Chart data ─────────────────────────────────────────────────────────
    const months = years * 12;
    const chartData = Array.from({ length: months + 1 }, (_, i) => {
      const point: Record<string, number | string> = { month: i };
      let total = 0;
      let totalInvestedAtMonth = 0;

      sims.forEach((s) => {
        const val = s.result.dataPoints[i] ?? 0;
        point[s.label] = Math.round(val);
        total += val;
      });

      if (scpi.enabled) totalInvestedAtMonth += scpi.initialCapital + scpi.monthlyContribution * i;
      if (scpiCredit.enabled && creditEffortData) {
        totalInvestedAtMonth += scpiCredit.downPayment + creditEffortData.effort * i;
      }
      if (av.enabled) totalInvestedAtMonth += av.initialCapital + av.monthlyContribution * i;
      if (per.enabled) totalInvestedAtMonth += per.initialCapital + per.monthlyContribution * i;

      const capitalInvested = Math.min(Math.round(totalInvestedAtMonth), Math.round(total));
      const interests = Math.max(0, Math.round(total) - capitalInvested);
      point["Capital investi"] = capitalInvested;
      point["Intérêts générés"] = interests;
      point["Livret bancaire 1%"] = Math.round(livret.dataPoints[i] ?? 0);
      return point;
    });

    // ── Aggregates ─────────────────────────────────────────────────────────
    const totalInvested = sims.reduce((s, sim) => s + sim.result.totalInvested, 0);
    const totalFinal = sims.reduce((s, sim) => s + sim.result.capital, 0);
    const totalNet = sims.reduce((s, sim) => s + sim.result.netGains, 0);
    const perSavings = sims.find((s) => s.type === "per")?.result.perTaxSavings ?? 0;

    // ── Passive income from already-computed results ───────────────────────
    let passiveIncome = 0;
    const scpiResult = sims.find((s) => s.type === "scpi");
    if (scpiResult) passiveIncome += scpiResult.result.capital * (scpi.rate / 100) / 12;
    const creditResult = sims.find((s) => s.type === "scpi-credit");
    if (creditResult) passiveIncome += creditResult.result.capital * (scpiCredit.rate / 100) / 12;

    return { sims, livret, chartData, totalInvested, totalFinal, totalNet, perSavings, passiveIncome };
  }, [scpi, scpiCredit, av, per, years]);
}

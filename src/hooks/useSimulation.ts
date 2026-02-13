import { useMemo } from "react";
import type { EnvelopeConfig, SCPICreditConfig, AggregatedResults } from "@/lib/types";
import { LIVRET_RATE } from "@/lib/constants";
import { simulate, simulateSCPICredit, simulateLivret, calcLoanPayment, calculateBlendedReturn } from "@/lib/simulation";

export function useSimulation(
  scpi: EnvelopeConfig,
  scpiCredit: SCPICreditConfig,
  av: EnvelopeConfig,
  per: EnvelopeConfig,
  years: number,
): AggregatedResults {
  return useMemo(() => {
    const sims: AggregatedResults["sims"] = [];
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

    const livret = simulateLivret(livretConfigs, years, LIVRET_RATE);
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
    const blendedReturn = calculateBlendedReturn(scpi, scpiCredit, av, per, years);
    return { sims, livret, chartData, totalInvested, totalFinal, totalNet, perSavings, blendedReturn };
  }, [scpi, scpiCredit, av, per, years]);
}

import type { EnvelopeConfig, SCPICreditConfig, SimResult, SCPICreditResult, LivretResult, Milestone } from "./types";
import { SCPI_REVALUATION } from "./constants";

export function calcLoanPayment(principal: number, annualRate: number, years: number): number {
  if (principal <= 0) return 0;
  const r = annualRate / 100 / 12;
  const n = years * 12;
  if (r === 0) return principal / n;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

export function simulate(config: EnvelopeConfig, years: number, type: "scpi" | "av" | "per"): SimResult {
  const months = years * 12;
  const isAVPER = type === "av" || type === "per";
  const entryFeePct = type === "scpi" ? config.entryFees / 100 : 0;
  const mgmtFeeMonthly = 0;
  const monthlyRate = config.rate / 100 / 12;
  const monthlyRevalo = type === "scpi" ? SCPI_REVALUATION / 100 / 12 : 0;
  let capital = config.initialCapital;
  let totalInvested = config.initialCapital;
  const dataPoints: number[] = [capital];
  for (let m = 1; m <= months; m++) {
    const contribution = config.monthlyContribution;
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
  const netGains = grossGains;
  let perTaxSavings = 0;
  if (type === "per") {
    perTaxSavings = totalInvested * (config.tmi / 100);
  }
  return { dataPoints, capital, totalInvested, grossGains, netGains, perTaxSavings };
}

export function simulateSCPICredit(config: SCPICreditConfig, totalYears: number): SCPICreditResult {
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
    const netCapital = sharesValue - remainingDebt;
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
  const finalSharesValue = sharesValue;
  const totalOutOfPocket = config.downPayment + Math.max(0, -cashflow) * Math.min(loanMonths, months);
  return {
    dataPoints, capital: finalSharesValue, totalInvested: totalOutOfPocket,
    grossGains: finalSharesValue - totalOutOfPocket, netGains: finalSharesValue - totalOutOfPocket,
    perTaxSavings: 0, monthlyPayment, monthlyDividend: netShares * monthlyRate,
    cashflow, totalLoanCost, netShares,
  };
}

export function simulateLivret(configs: { initialCapital: number; monthlyContribution: number }[], years: number, livretRate: number): LivretResult {
  const months = years * 12;
  const totalInitial = configs.reduce((s, c) => s + c.initialCapital, 0);
  const totalMonthly = configs.reduce((s, c) => s + c.monthlyContribution, 0);
  const monthlyRate = livretRate / 100 / 12;
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

export function adjustForInflation(amount: number, years: number, rate: number = 0.02): number {
  return amount / Math.pow(1 + rate, years);
}

export function computePassiveIncome(
  scpi: EnvelopeConfig,
  scpiCredit: SCPICreditConfig,
  years: number,
): number {
  let monthly = 0;
  if (scpi.enabled) {
    const scpiResult = simulate(scpi, years, "scpi");
    monthly += scpiResult.capital * (scpi.rate / 100) / 12;
  }
  if (scpiCredit.enabled) {
    const totalInvestment = scpiCredit.loanAmount + scpiCredit.downPayment;
    const netShares = totalInvestment;
    const monthlyRevalo = 0.01 / 12; // SCPI_REVALUATION
    let sharesValue = netShares;
    const months = years * 12;
    for (let m = 0; m < months; m++) {
      sharesValue *= (1 + monthlyRevalo);
    }
    monthly += sharesValue * (scpiCredit.rate / 100) / 12;
  }
  return monthly;
}

export function computeMonthlyEffort(
  scpi: EnvelopeConfig,
  scpiCredit: SCPICreditConfig,
  av: EnvelopeConfig,
  per: EnvelopeConfig,
): number {
  let effort = 0;
  if (scpi.enabled) effort += scpi.monthlyContribution;
  if (av.enabled) effort += av.monthlyContribution;
  if (per.enabled) effort += per.monthlyContribution;
  if (scpiCredit.enabled) {
    const payment = calcLoanPayment(scpiCredit.loanAmount, scpiCredit.interestRate, scpiCredit.loanYears);
    const totalInvestment = scpiCredit.loanAmount + scpiCredit.downPayment;
    const dividend = totalInvestment * (scpiCredit.rate / 100) / 12;
    effort += Math.max(0, payment - dividend);
  }
  return effort;
}

export function computeMilestones(
  scpiCredit: SCPICreditConfig,
  av: EnvelopeConfig,
): Milestone[] {
  const milestones: Milestone[] = [];
  if (scpiCredit.enabled) {
    milestones.push({
      month: scpiCredit.loanYears * 12,
      label: "Fin crédit SCPI",
      color: "#c084fc",
    });
  }
  if (av.enabled) {
    milestones.push({
      month: 8 * 12,
      label: "Fiscalité AV avantageuse",
      color: "#38bdf8",
    });
  }
  return milestones;
}

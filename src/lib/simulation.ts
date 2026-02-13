import type { EnvelopeConfig, SCPICreditConfig, SimResult, SCPICreditResult, LivretResult, Milestone } from "./types";
import { SCPI_REVALUATION } from "./constants";

/**
 * Calcule la mensualité d'un crédit amortissable
 * @param principal - Capital emprunté
 * @param annualRate - Taux d'intérêt annuel en %
 * @param years - Durée du crédit en années
 * @returns Mensualité du crédit
 */
export function calcLoanPayment(principal: number, annualRate: number, years: number): number {
  if (principal <= 0) return 0;
  const r = annualRate / 100 / 12;
  const n = years * 12;
  if (r === 0) return principal / n;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

/**
 * Simule l'évolution d'un placement sur une durée donnée
 * @param config - Configuration de l'enveloppe (capital initial, versements, taux, etc.)
 * @param years - Durée de placement en années
 * @param type - Type d'enveloppe : "scpi", "av" ou "per"
 * @returns Résultat de simulation avec évolution du capital et gains
 */
export function simulate(config: EnvelopeConfig, years: number, type: "scpi" | "av" | "per"): SimResult {
  const months = years * 12;
  const monthlyRate = config.rate / 100 / 12;
  const monthlyRevalo = type === "scpi" ? SCPI_REVALUATION / 100 / 12 : 0;
  
  let capital = config.initialCapital;
  let totalInvested = config.initialCapital;
  const dataPoints: number[] = [capital];
  
  for (let m = 1; m <= months; m++) {
    capital += config.monthlyContribution;
    totalInvested += config.monthlyContribution;
    
    // Période de jouissance SCPI (pas de gains)
    if (type === "scpi" && m <= config.jouissanceMonths) { 
      dataPoints.push(capital); 
      continue; 
    }
    
    // Application des gains
    const gains = capital * monthlyRate;
    capital += gains;
    
    // Revalorisation SCPI
    if (type === "scpi") {
      capital *= (1 + monthlyRevalo);
    }
    
    dataPoints.push(capital);
  }
  
  const grossGains = capital - totalInvested;
  const netGains = grossGains;
  const perTaxSavings = type === "per" ? totalInvested * (config.tmi / 100) : 0;
  
  return { 
    dataPoints, 
    capital, 
    totalInvested, 
    grossGains, 
    netGains, 
    perTaxSavings 
  };
}

/**
 * Simule un placement SCPI financé par crédit
 * Prend en compte le remboursement progressif du crédit et l'évolution des parts SCPI
 * @param config - Configuration SCPI crédit (montant emprunté, apport, taux, durée...)
 * @param totalYears - Durée totale de simulation en années
 * @returns Résultat détaillé incluant cashflow, mensualités et évolution du capital net
 */
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

/**
 * Simule un placement sur livret bancaire (référence de comparaison)
 * @param configs - Array des configs de capital initial et versements mensuels
 * @param years - Durée de placement en années
 * @param livretRate - Taux du livret en %
 * @returns Évolution du capital sur livret
 */
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

/**
 * Calcule les revenus passifs mensuels à terme (principalement dividendes SCPI)
 * @param scpi - Config SCPI comptant
 * @param scpiCredit - Config SCPI crédit
 * @param years - Horizon de calcul en années
 * @returns Revenus passifs mensuels en €
 */
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

/**
 * Calcule l'effort mensuel total de l'investisseur
 * Inclut versements + effort net SCPI crédit (mensualité - dividendes perçus)
 * @param scpi - Config SCPI comptant
 * @param scpiCredit - Config SCPI crédit
 * @param av - Config assurance vie
 * @param per - Config PER
 * @returns Effort mensuel total en €
 */
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

/**
 * Calcule les jalons importants de la stratégie patrimonie
 * @param scpiCredit - Config SCPI crédit
 * @param av - Config assurance vie
 * @returns Array des jalons avec mois, label et couleur
 */
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

/**
 * Calcule le rendement effectif moyen pondéré de tous les enveloppes activées
 * Prend en compte les spécificités de chaque enveloppe :
 * - SCPI Cash: 5.5% + 1% revalorisation = ~6.5% brut
 * - SCPI Crédit: Deux phases selon le statut du crédit
 * - AV/PER: 4% net
 */
export function calculateBlendedReturn(
  scpi: EnvelopeConfig,
  scpiCredit: SCPICreditConfig,
  av: EnvelopeConfig,
  per: EnvelopeConfig,
  years: number,
): import("./types").BlendedReturnData {
  const contributions: Array<{
    envelope: string;
    rate: number;
    weight: number;
    contribution: number;
  }> = [];
  
  let totalWeight = 0;
  let weightedSum = 0;

  // SCPI Cash - Simple case
  if (scpi.enabled) {
    const result = simulate(scpi, years, "scpi");
    const avgCapital = (result.totalInvested + result.capital) / 2; // Approximation du capital moyen
    const effectiveRate = (scpi.rate + SCPI_REVALUATION); // 5.5% + 1% = 6.5%
    
    contributions.push({
      envelope: "SCPI Comptant",
      rate: effectiveRate,
      weight: avgCapital,
      contribution: avgCapital * effectiveRate / 100,
    });
    
    totalWeight += avgCapital;
    weightedSum += avgCapital * effectiveRate / 100;
  }

  // SCPI Crédit - Complex case with two phases
  let scpiCreditPhases: { duringCredit: number; afterCredit: number } | undefined;
  if (scpiCredit.enabled) {
    const totalInvestment = scpiCredit.loanAmount + scpiCredit.downPayment;
    const monthlyPayment = calcLoanPayment(scpiCredit.loanAmount, scpiCredit.interestRate, scpiCredit.loanYears);
    const monthlyDividend = totalInvestment * (scpiCredit.rate / 100) / 12;
    
    // Phase 1: Pendant le crédit - rendement effectif réduit par l'effort de remboursement
    const netMonthlyFlow = monthlyDividend - monthlyPayment;
    const duringCreditEffectiveRate = (netMonthlyFlow * 12 / scpiCredit.downPayment) * 100;
    
    // Phase 2: Après le crédit - rendement plein sur la valeur des parts
    const afterCreditEffectiveRate = scpiCredit.rate + SCPI_REVALUATION; // 5.5% + 1% = 6.5%
    
    scpiCreditPhases = {
      duringCredit: Math.max(0, duringCreditEffectiveRate),
      afterCredit: afterCreditEffectiveRate,
    };

    // Pour le calcul pondéré, utilise une moyenne des deux phases pondérée par la durée
    const creditYears = scpiCredit.loanYears;
    const postCreditYears = years - creditYears;
    const avgEffectiveRate = postCreditYears > 0 
      ? (duringCreditEffectiveRate * creditYears + afterCreditEffectiveRate * postCreditYears) / years
      : duringCreditEffectiveRate;
    
    const avgCapital = totalInvestment; // Capital investi dans les parts SCPI
    
    contributions.push({
      envelope: "SCPI Crédit",
      rate: Math.max(0, avgEffectiveRate),
      weight: avgCapital,
      contribution: avgCapital * Math.max(0, avgEffectiveRate) / 100,
    });
    
    totalWeight += avgCapital;
    weightedSum += avgCapital * Math.max(0, avgEffectiveRate) / 100;
  }

  // AV - 4% net
  if (av.enabled) {
    const result = simulate(av, years, "av");
    const avgCapital = (result.totalInvested + result.capital) / 2;
    const effectiveRate = av.rate; // 4% net

    contributions.push({
      envelope: "Assurance Vie",
      rate: effectiveRate,
      weight: avgCapital,
      contribution: avgCapital * effectiveRate / 100,
    });
    
    totalWeight += avgCapital;
    weightedSum += avgCapital * effectiveRate / 100;
  }

  // PER - 4% net
  if (per.enabled) {
    const result = simulate(per, years, "per");
    const avgCapital = (result.totalInvested + result.capital) / 2;
    const effectiveRate = per.rate; // 4% net

    contributions.push({
      envelope: "PER",
      rate: effectiveRate,
      weight: avgCapital,
      contribution: avgCapital * effectiveRate / 100,
    });
    
    totalWeight += avgCapital;
    weightedSum += avgCapital * effectiveRate / 100;
  }

  const overallRate = totalWeight > 0 ? (weightedSum / totalWeight) * 100 : 0;

  return {
    overallRate,
    contributions,
    scpiCreditPhases,
  };
}

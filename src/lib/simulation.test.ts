import { describe, it, expect } from "vitest";
import {
  calcLoanPayment,
  getInsuranceRate,
  simulate,
  simulateSCPICredit,
  simulateLivret,
  computeMonthlyEffort,
  computePassiveIncome,
} from "./simulation";
import type { EnvelopeConfig, SCPICreditConfig } from "./types";

// ─── Helpers ───────────────────────────────────────────────────────────────
const approx = (val: number, digits = 2) =>
  Math.round(val * 10 ** digits) / 10 ** digits;

// ─── calcLoanPayment ───────────────────────────────────────────────────────
describe("calcLoanPayment", () => {
  it("retourne 0 si le principal est 0 ou négatif", () => {
    expect(calcLoanPayment(0, 5, 20)).toBe(0);
    expect(calcLoanPayment(-1000, 5, 20)).toBe(0);
  });

  it("retourne principal / n si le taux est 0", () => {
    // 12 000 € sur 1 an à 0% → 1 000 €/mois
    expect(calcLoanPayment(12000, 0, 1)).toBeCloseTo(1000, 2);
  });

  it("calcule correctement la mensualité pour un prêt standard", () => {
    // 100 000 € à 5% sur 20 ans → ~660 €/mois (valeur de référence)
    const monthly = calcLoanPayment(100000, 5, 20);
    expect(monthly).toBeCloseTo(659.96, 0);
  });

  it("mensualité plus élevée sur durée courte", () => {
    const short = calcLoanPayment(100000, 5, 10);
    const long = calcLoanPayment(100000, 5, 25);
    expect(short).toBeGreaterThan(long);
  });

  it("coût total croît avec la durée (plus d'intérêts)", () => {
    const monthly10 = calcLoanPayment(100000, 5, 10);
    const monthly25 = calcLoanPayment(100000, 5, 25);
    expect(monthly10 * 10 * 12).toBeLessThan(monthly25 * 25 * 12);
  });
});

// ─── getInsuranceRate ──────────────────────────────────────────────────────
describe("getInsuranceRate", () => {
  it("retourne 0.15% pour ≤ 35 ans", () => {
    expect(getInsuranceRate(25)).toBe(0.15);
    expect(getInsuranceRate(35)).toBe(0.15);
  });

  it("retourne 0.30% pour 36–45 ans", () => {
    expect(getInsuranceRate(36)).toBe(0.30);
    expect(getInsuranceRate(45)).toBe(0.30);
  });

  it("retourne 0.50% pour 46–50 ans", () => {
    expect(getInsuranceRate(46)).toBe(0.50);
    expect(getInsuranceRate(50)).toBe(0.50);
  });

  it("retourne 0.70% pour > 50 ans", () => {
    expect(getInsuranceRate(51)).toBe(0.70);
    expect(getInsuranceRate(65)).toBe(0.70);
  });
});

// ─── simulate ─────────────────────────────────────────────────────────────
const baseEnvelope = (overrides: Partial<EnvelopeConfig> = {}): EnvelopeConfig => ({
  enabled: true,
  initialCapital: 10000,
  monthlyContribution: 0,
  rate: 6, // 6% annuel pour calculs simples
  reinvestDividends: true,
  entryFees: 0,
  mgmtFees: 0,
  jouissanceMonths: 0,
  socialCharges: 0,
  tmi: 30,
  ...overrides,
});

describe("simulate — général", () => {
  it("le nombre de dataPoints est années * 12 + 1 (point initial inclus)", () => {
    const result = simulate(baseEnvelope(), 10, "av");
    expect(result.dataPoints.length).toBe(10 * 12 + 1);
  });

  it("totalInvested = capital initial (sans versements)", () => {
    const result = simulate(baseEnvelope({ monthlyContribution: 0 }), 5, "av");
    expect(result.totalInvested).toBe(10000);
  });

  it("totalInvested = capital initial + versements * mois", () => {
    const result = simulate(baseEnvelope({ monthlyContribution: 100 }), 5, "av");
    expect(result.totalInvested).toBe(10000 + 100 * 5 * 12);
  });

  it("les frais d'entrée réduisent le capital effectif investi", () => {
    const noFees = simulate(baseEnvelope({ entryFees: 0 }), 10, "av");
    const withFees = simulate(baseEnvelope({ entryFees: 5 }), 10, "av");
    expect(withFees.capital).toBeLessThan(noFees.capital);
  });

  it("grossGains = capital - totalInvested (sans charges sociales)", () => {
    const result = simulate(baseEnvelope({ socialCharges: 0 }), 5, "av");
    expect(approx(result.grossGains)).toBe(approx(result.capital - result.totalInvested));
  });
});

describe("simulate — type AV/PER", () => {
  it("frais de gestion annuels réduisent le capital final", () => {
    const noMgmt = simulate(baseEnvelope({ mgmtFees: 0 }), 10, "av");
    const withMgmt = simulate(baseEnvelope({ mgmtFees: 1 }), 10, "av");
    expect(withMgmt.capital).toBeLessThan(noMgmt.capital);
  });

  it("PER : perTaxSavings = totalInvested * TMI", () => {
    const result = simulate(baseEnvelope({ tmi: 30, monthlyContribution: 100 }), 5, "per");
    const expected = result.totalInvested * 0.30;
    expect(approx(result.perTaxSavings)).toBe(approx(expected));
  });

  it("AV : perTaxSavings est 0", () => {
    const result = simulate(baseEnvelope(), 5, "av");
    expect(result.perTaxSavings).toBe(0);
  });

  it("charges sociales réduisent netGains par rapport à grossGains", () => {
    const result = simulate(baseEnvelope({ socialCharges: 17.2 }), 10, "av");
    expect(result.netGains).toBeLessThan(result.grossGains);
  });
});

describe("simulate — type SCPI", () => {
  it("jouissanceMonths : pas de gains pendant la période de jouissance", () => {
    const jouissance = 3;
    const result = simulate(baseEnvelope({ jouissanceMonths: jouissance }), 2, "scpi");
    // Les points de 1 à jouissanceMonths ne doivent pas inclure de rendement
    // capital[1] = capital[0] + contribution (pas de gains)
    const point0 = result.dataPoints[0];
    const point1 = result.dataPoints[1];
    expect(point1).toBeCloseTo(point0, 0); // pas de versement mensuel ici
  });

  it("dividendes non réinvestis → capital final plus faible qu'avec réinvestissement", () => {
    const reinvest = simulate(baseEnvelope({ reinvestDividends: true }), 10, "scpi");
    const noReinvest = simulate(baseEnvelope({ reinvestDividends: false }), 10, "scpi");
    expect(noReinvest.capital).toBeLessThan(reinvest.capital);
  });

  it("dividendes non réinvestis → grossGains inclut les dividendes distribués (capital + gains = investi + tout)", () => {
    const noReinvest = simulate(baseEnvelope({ reinvestDividends: false, socialCharges: 0 }), 5, "scpi");
    // grossGains doit être positif et netGains = grossGains (0% charges)
    expect(noReinvest.grossGains).toBeGreaterThan(0);
    expect(noReinvest.netGains).toBe(noReinvest.grossGains);
  });
});

// ─── simulateSCPICredit ───────────────────────────────────────────────────
const baseCreditConfig = (overrides: Partial<SCPICreditConfig> = {}): SCPICreditConfig => ({
  enabled: true,
  loanAmount: 100000,
  downPayment: 0,
  interestRate: 5.35,
  loanYears: 25,
  rate: 5.5,
  entryFees: 10,
  borrowerAge: 30,
  ...overrides,
});

describe("simulateSCPICredit", () => {
  it("dataPoints a la bonne longueur (années * 12 + 1)", () => {
    const result = simulateSCPICredit(baseCreditConfig(), 25);
    expect(result.dataPoints.length).toBe(25 * 12 + 1);
  });

  it("cashflow = dividende mensuel - mensualité totale", () => {
    const result = simulateSCPICredit(baseCreditConfig(), 25);
    expect(approx(result.cashflow)).toBe(
      approx(result.monthlyDividend - result.monthlyPayment)
    );
  });

  it("emprunteur plus âgé → assurance plus chère", () => {
    const young = simulateSCPICredit(baseCreditConfig({ borrowerAge: 30 }), 25);
    const old = simulateSCPICredit(baseCreditConfig({ borrowerAge: 55 }), 25);
    expect(old.monthlyInsurance).toBeGreaterThan(young.monthlyInsurance);
  });

  it("capital net négatif au début (dette > valeur parts)", () => {
    const result = simulateSCPICredit(baseCreditConfig(), 25);
    // Au mois 0, netCapital = netShares - loanAmount
    // netShares = 100000 * 0.9 = 90000, dette = 100000 → négatif
    expect(result.dataPoints[0]).toBeLessThan(0);
  });

  it("netShares = investissement total * (1 - frais d'entrée)", () => {
    const config = baseCreditConfig({ loanAmount: 100000, downPayment: 20000, entryFees: 10 });
    const result = simulateSCPICredit(config, 25);
    const expected = (100000 + 20000) * (1 - 0.10);
    expect(approx(result.netShares)).toBe(approx(expected));
  });
});

// ─── simulateLivret ───────────────────────────────────────────────────────
describe("simulateLivret", () => {
  it("sans versements : capital final > capital initial avec taux positif", () => {
    const result = simulateLivret([{ initialCapital: 10000, monthlyContribution: 0 }], 5, 3);
    expect(result.capital).toBeGreaterThan(10000);
  });

  it("totalInvested = somme initiale + versements * mois", () => {
    const result = simulateLivret([{ initialCapital: 5000, monthlyContribution: 100 }], 3, 3);
    expect(result.totalInvested).toBe(5000 + 100 * 3 * 12);
  });

  it("gains = capital - totalInvested", () => {
    const result = simulateLivret([{ initialCapital: 10000, monthlyContribution: 0 }], 5, 3);
    expect(approx(result.gains)).toBe(approx(result.capital - result.totalInvested));
  });

  it("taux 0% → gains nuls", () => {
    const result = simulateLivret([{ initialCapital: 10000, monthlyContribution: 0 }], 5, 0);
    expect(approx(result.gains)).toBe(0);
  });

  it("plusieurs configs agrégées correctement", () => {
    const single = simulateLivret([{ initialCapital: 20000, monthlyContribution: 0 }], 5, 3);
    const multi = simulateLivret(
      [
        { initialCapital: 10000, monthlyContribution: 0 },
        { initialCapital: 10000, monthlyContribution: 0 },
      ],
      5,
      3
    );
    expect(approx(single.capital)).toBe(approx(multi.capital));
  });
});

// ─── computeMonthlyEffort ─────────────────────────────────────────────────
describe("computeMonthlyEffort", () => {
  const disabledEnv = baseEnvelope({ enabled: false });
  const disabledCredit = baseCreditConfig({ enabled: false });

  it("effort = 0 si tout est désactivé", () => {
    const result = computeMonthlyEffort(disabledEnv, disabledCredit, disabledEnv, disabledEnv);
    expect(result).toBe(0);
  });

  it("effort inclut versements SCPI si activé", () => {
    const scpi = baseEnvelope({ enabled: true, monthlyContribution: 200 });
    const result = computeMonthlyEffort(scpi, disabledCredit, disabledEnv, disabledEnv);
    expect(result).toBe(200);
  });

  it("effort inclut versements AV + PER si activés", () => {
    const av = baseEnvelope({ enabled: true, monthlyContribution: 150 });
    const per = baseEnvelope({ enabled: true, monthlyContribution: 100 });
    const result = computeMonthlyEffort(disabledEnv, disabledCredit, av, per);
    expect(result).toBe(250);
  });
});

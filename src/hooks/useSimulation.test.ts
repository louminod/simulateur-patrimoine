import { describe, it, expect } from "vitest";
import { computeSimulation } from "./useSimulation";
import type { EnvelopeConfig, SCPICreditConfig } from "@/lib/types";
import { defaultSCPI, defaultSCPICredit, defaultAV, defaultPER } from "@/lib/constants";

// ─── Fixtures ─────────────────────────────────────────────────────────────

const disabled = <T extends { enabled: boolean }>(config: T): T => ({ ...config, enabled: false });

const allDisabled = () =>
  computeSimulation(
    disabled(defaultSCPI),
    disabled(defaultSCPICredit),
    disabled(defaultAV),
    disabled(defaultPER),
    10,
  );

const allEnabled = (years = 25) =>
  computeSimulation(defaultSCPI, defaultSCPICredit, defaultAV, defaultPER, years);

const onlyScpi = (years = 10) =>
  computeSimulation(
    defaultSCPI,
    disabled(defaultSCPICredit),
    disabled(defaultAV),
    disabled(defaultPER),
    years,
  );

const onlyAV = (years = 10) =>
  computeSimulation(
    disabled(defaultSCPI),
    disabled(defaultSCPICredit),
    { ...defaultAV, enabled: true },
    disabled(defaultPER),
    years,
  );

const onlyPER = (years = 10) =>
  computeSimulation(
    disabled(defaultSCPI),
    disabled(defaultSCPICredit),
    disabled(defaultAV),
    { ...defaultPER, enabled: true },
    years,
  );

const onlyCredit = (years = 25) =>
  computeSimulation(
    disabled(defaultSCPI),
    defaultSCPICredit,
    disabled(defaultAV),
    disabled(defaultPER),
    years,
  );

// ─── Structure des résultats ──────────────────────────────────────────────

describe("computeSimulation — structure", () => {
  it("retourne 0 sims si tout est désactivé", () => {
    const r = allDisabled();
    expect(r.sims).toHaveLength(0);
  });

  it("retourne 4 sims si tout est activé", () => {
    const r = allEnabled();
    expect(r.sims).toHaveLength(4);
  });

  it("les labels correspondent aux enveloppes activées", () => {
    const r = allEnabled();
    const labels = r.sims.map((s) => s.label);
    expect(labels).toContain("SCPI Comptant");
    expect(labels).toContain("SCPI Crédit");
    expect(labels).toContain("Assurance Vie");
    expect(labels).toContain("PER");
  });

  it("chartData a années * 12 + 1 points", () => {
    const r = allEnabled(10);
    expect(r.chartData).toHaveLength(10 * 12 + 1);
  });

  it("chaque point chartData a une clé 'month'", () => {
    const r = onlyScpi(5);
    expect(r.chartData[0]).toHaveProperty("month", 0);
    expect(r.chartData[r.chartData.length - 1]).toHaveProperty("month", 5 * 12);
  });

  it("chaque point chartData a 'Capital investi', 'Intérêts générés', 'Livret bancaire 1%'", () => {
    const r = onlyAV(5);
    const point = r.chartData[r.chartData.length - 1];
    expect(point).toHaveProperty("Capital investi");
    expect(point).toHaveProperty("Intérêts générés");
    expect(point).toHaveProperty("Livret bancaire 1%");
  });
});

// ─── Agrégats financiers ──────────────────────────────────────────────────

describe("computeSimulation — agrégats", () => {
  it("totalInvested = 0 si tout désactivé", () => {
    expect(allDisabled().totalInvested).toBe(0);
  });

  it("totalInvested = somme des totalInvested de chaque sim", () => {
    const r = allEnabled(10);
    const expected = r.sims.reduce((s, sim) => s + sim.result.totalInvested, 0);
    expect(r.totalInvested).toBe(expected);
  });

  it("totalFinal = somme des capital de chaque sim", () => {
    const r = allEnabled(10);
    const expected = r.sims.reduce((s, sim) => s + sim.result.capital, 0);
    expect(r.totalFinal).toBe(expected);
  });

  it("totalFinal > totalInvested avec taux positifs", () => {
    const r = allEnabled(25);
    expect(r.totalFinal).toBeGreaterThan(r.totalInvested);
  });

  it("perSavings = 0 si PER désactivé", () => {
    expect(onlyScpi().perSavings).toBe(0);
  });

  it("perSavings > 0 si PER activé avec TMI > 0", () => {
    expect(onlyPER().perSavings).toBeGreaterThan(0);
  });
});

// ─── Revenus passifs ──────────────────────────────────────────────────────

describe("computeSimulation — passiveIncome", () => {
  it("passiveIncome = 0 si aucune SCPI activée", () => {
    const r = computeSimulation(
      disabled(defaultSCPI),
      disabled(defaultSCPICredit),
      { ...defaultAV, enabled: true },
      disabled(defaultPER),
      10,
    );
    expect(r.passiveIncome).toBe(0);
  });

  it("passiveIncome > 0 si SCPI comptant activée", () => {
    expect(onlyScpi().passiveIncome).toBeGreaterThan(0);
  });

  it("passiveIncome > 0 si SCPI crédit activée", () => {
    expect(onlyCredit().passiveIncome).toBeGreaterThan(0);
  });

  it("passiveIncome plus élevé avec les deux SCPI qu'avec une seule", () => {
    const both = allEnabled(25);
    const scpiOnly = onlyScpi(25);
    expect(both.passiveIncome).toBeGreaterThan(scpiOnly.passiveIncome);
  });

  it("passiveIncome = capital SCPI * taux / 12", () => {
    const r = onlyScpi(10);
    const scpiSim = r.sims.find((s) => s.type === "scpi")!;
    const expected = scpiSim.result.capital * (defaultSCPI.rate / 100) / 12;
    expect(r.passiveIncome).toBeCloseTo(expected, 5);
  });
});

// ─── Livret de référence ──────────────────────────────────────────────────

describe("computeSimulation — livret", () => {
  it("livret.capital > 0 si au moins une enveloppe activée", () => {
    expect(onlyAV().livret.capital).toBeGreaterThan(0);
  });

  it("livret.capital > livret.totalInvested (taux positif)", () => {
    const r = onlyScpi(10);
    expect(r.livret.capital).toBeGreaterThan(r.livret.totalInvested);
  });

  it("stratégie patrimoniale surperforme le livret", () => {
    const r = allEnabled(25);
    expect(r.totalFinal).toBeGreaterThan(r.livret.capital);
  });

  it("livret.dataPoints a la bonne longueur", () => {
    const r = onlyAV(5);
    expect(r.livret.dataPoints).toHaveLength(5 * 12 + 1);
  });
});

// ─── Activation sélective ─────────────────────────────────────────────────

describe("computeSimulation — activation sélective", () => {
  it("désactiver une enveloppe réduit totalFinal", () => {
    const with4 = allEnabled(10);
    const with3 = computeSimulation(
      defaultSCPI,
      disabled(defaultSCPICredit),
      defaultAV,
      defaultPER,
      10,
    );
    expect(with3.totalFinal).toBeLessThan(with4.totalFinal);
  });

  it("sims ne contient que les enveloppes activées", () => {
    const r = computeSimulation(
      defaultSCPI,
      disabled(defaultSCPICredit),
      defaultAV,
      disabled(defaultPER),
      10,
    );
    expect(r.sims).toHaveLength(2);
    expect(r.sims.map((s) => s.type)).toEqual(["scpi", "av"]);
  });

  it("horizon plus long → totalFinal plus élevé", () => {
    const short = onlyScpi(10);
    const long = onlyScpi(25);
    expect(long.totalFinal).toBeGreaterThan(short.totalFinal);
  });
});

// ─── Cohérence chartData ──────────────────────────────────────────────────

describe("computeSimulation — cohérence chartData", () => {
  it("Capital investi + Intérêts générés = total des sims à chaque mois", () => {
    const r = onlyScpi(5);
    const lastPoint = r.chartData[r.chartData.length - 1];
    const capitalInvesti = lastPoint["Capital investi"] as number;
    const interets = lastPoint["Intérêts générés"] as number;
    const scpiVal = lastPoint["SCPI Comptant"] as number;
    expect(capitalInvesti + interets).toBe(scpiVal);
  });

  it("Intérêts générés ≥ 0 à chaque mois", () => {
    const r = allEnabled(10);
    r.chartData.forEach((point) => {
      expect(point["Intérêts générés"] as number).toBeGreaterThanOrEqual(0);
    });
  });

  it("Capital investi croît dans le temps", () => {
    const r = onlyAV(5);
    const first = r.chartData[1]["Capital investi"] as number;
    const last = r.chartData[r.chartData.length - 1]["Capital investi"] as number;
    expect(last).toBeGreaterThan(first);
  });
});

import type { EnvelopeConfig, SCPICreditConfig } from "./types";
import { defaultSCPI, defaultSCPICredit, defaultAV, defaultPER } from "./constants";

interface SimState {
  years: number;
  scpi: EnvelopeConfig;
  scpiCredit: SCPICreditConfig;
  av: EnvelopeConfig;
  per: EnvelopeConfig;
}

export function encodeState(state: SimState): string {
  const p = new URLSearchParams();
  p.set("y", String(state.years));

  if (state.scpi.enabled) {
    p.set("sc", "1");
    p.set("sci", String(state.scpi.initialCapital));
    p.set("scm", String(state.scpi.monthlyContribution));
    p.set("scr", String(state.scpi.rate));
    p.set("scrd", state.scpi.reinvestDividends ? "1" : "0");
  }

  if (state.scpiCredit.enabled) {
    p.set("scc", "1");
    p.set("sccl", String(state.scpiCredit.loanAmount));
    p.set("sccd", String(state.scpiCredit.downPayment));
    p.set("scci", String(state.scpiCredit.interestRate));
    p.set("sccy", String(state.scpiCredit.loanYears));
    p.set("sccr", String(state.scpiCredit.rate));
  }

  if (state.av.enabled) {
    p.set("av", "1");
    p.set("avi", String(state.av.initialCapital));
    p.set("avm", String(state.av.monthlyContribution));
  }

  if (state.per.enabled) {
    p.set("per", "1");
    p.set("peri", String(state.per.initialCapital));
    p.set("perm", String(state.per.monthlyContribution));
    p.set("pert", String(state.per.tmi));
  }

  return p.toString();
}

export function decodeState(search: string): Partial<SimState> | null {
  const p = new URLSearchParams(search);
  if (!p.has("y")) return null;

  const result: Partial<SimState> = {};
  result.years = Number(p.get("y")) || 25;

  result.scpi = {
    ...defaultSCPI,
    enabled: p.get("sc") === "1",
    initialCapital: Number(p.get("sci")) || defaultSCPI.initialCapital,
    monthlyContribution: Number(p.get("scm")) || defaultSCPI.monthlyContribution,
    rate: Number(p.get("scr")) || defaultSCPI.rate,
    reinvestDividends: p.has("scrd") ? p.get("scrd") === "1" : defaultSCPI.reinvestDividends,
  };

  result.scpiCredit = {
    ...defaultSCPICredit,
    enabled: p.get("scc") === "1",
    loanAmount: Number(p.get("sccl")) || defaultSCPICredit.loanAmount,
    downPayment: Number(p.get("sccd")) ?? defaultSCPICredit.downPayment,
    interestRate: Number(p.get("scci")) || defaultSCPICredit.interestRate,
    loanYears: Number(p.get("sccy")) || defaultSCPICredit.loanYears,
    rate: Number(p.get("sccr")) || defaultSCPICredit.rate,
  };

  result.av = {
    ...defaultAV,
    enabled: p.get("av") === "1",
    initialCapital: Number(p.get("avi")) || defaultAV.initialCapital,
    monthlyContribution: Number(p.get("avm")) || defaultAV.monthlyContribution,
  };

  result.per = {
    ...defaultPER,
    enabled: p.get("per") === "1",
    initialCapital: Number(p.get("peri")) || defaultPER.initialCapital,
    monthlyContribution: Number(p.get("perm")) || defaultPER.monthlyContribution,
    tmi: (Number(p.get("pert")) || defaultPER.tmi) as EnvelopeConfig["tmi"],
  };

  return result;
}

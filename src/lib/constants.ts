import type { EnvelopeConfig, SCPICreditConfig } from "./types";

export const LIVRET_RATE = 1;
export const SCPI_REVALUATION = 1;
export const TMI_OPTIONS = [11, 30, 41, 45] as const;

// Fee comparison: bank vs our solution
export const BANK_ENTRY_FEES = 2;
export const BANK_MGMT_FEES = 1.5;
export const BANK_RATE = 2;
export const SOLUTION_ENTRY_FEES = 4.8;
export const SOLUTION_MGMT_FEES = 1;
export const SOLUTION_RATE = 4;
export const FEE_COMPARISON_YEARS = 15;

export const defaultSCPI: EnvelopeConfig = {
  enabled: true, initialCapital: 10000, monthlyContribution: 200, rate: 5.5,
  reinvestDividends: true, entryFees: 10, mgmtFees: 0, jouissanceMonths: 3, socialCharges: 0, tmi: 30,
};

export const defaultSCPICredit: SCPICreditConfig = {
  enabled: true, loanAmount: 100000, downPayment: 0, interestRate: 5.35, loanYears: 25, rate: 5.5, entryFees: 10, borrowerAge: 30,
};

export const defaultAV: EnvelopeConfig = {
  enabled: true, initialCapital: 10000, monthlyContribution: 200, rate: 4,
  reinvestDividends: false, entryFees: 4.8, mgmtFees: 1, jouissanceMonths: 0, socialCharges: 17.2, tmi: 30,
};

export const defaultPER: EnvelopeConfig = {
  enabled: true, initialCapital: 5000, monthlyContribution: 150, rate: 4,
  reinvestDividends: false, entryFees: 4.8, mgmtFees: 1, jouissanceMonths: 0, socialCharges: 0, tmi: 30,
};

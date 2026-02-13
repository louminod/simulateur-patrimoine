export interface EnvelopeConfig {
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

export interface SCPICreditConfig {
  enabled: boolean;
  loanAmount: number;
  downPayment: number;
  interestRate: number;
  loanYears: number;
  rate: number;
  entryFees: number;
}

export interface SimResult {
  dataPoints: number[];
  capital: number;
  totalInvested: number;
  grossGains: number;
  netGains: number;
  perTaxSavings: number;
}

export interface SCPICreditResult extends SimResult {
  monthlyPayment: number;
  monthlyDividend: number;
  cashflow: number;
  totalLoanCost: number;
  netShares: number;
}

export interface LivretResult {
  dataPoints: number[];
  capital: number;
  totalInvested: number;
  gains: number;
}

export interface SimEntry {
  label: string;
  color: string;
  type: string;
  result: SimResult;
}

export interface Milestone {
  month: number;
  label: string;
  color: string;
}

export interface BlendedReturnData {
  overallRate: number;
  contributions: Array<{
    envelope: string;
    rate: number;
    weight: number;
    contribution: number;
  }>;
  scpiCreditPhases?: {
    duringCredit: number;
    afterCredit: number;
  };
}

export interface AggregatedResults {
  sims: SimEntry[];
  livret: LivretResult;
  chartData: Record<string, number | string>[];
  totalInvested: number;
  totalFinal: number;
  totalNet: number;
  perSavings: number;
  blendedReturn: BlendedReturnData;
}

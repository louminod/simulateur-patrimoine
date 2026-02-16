"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { track } from "@vercel/analytics";
import { defaultSCPI, defaultSCPICredit, defaultAV, defaultPER } from "@/lib/constants";
import { encodeState, decodeState } from "@/lib/shareUrl";
import { useSimulation } from "@/hooks/useSimulation";
import { computePassiveIncome, computeMonthlyEffort, computeMilestones } from "@/lib/simulation";
import { Hero } from "@/components/Hero";
import { HorizonSlider } from "@/components/HorizonSlider";
import { SCPICashCard, SCPICreditCard, AVCard, PERCard } from "@/components/EnvelopeCards";
import { SCPICreditDetail } from "@/components/SCPICreditDetail";
import { ComparisonBlock } from "@/components/ComparisonBlock";
import { PatrimoineChart } from "@/components/PatrimoineChart";
import { RecapTable } from "@/components/RecapTable";
import { ShareButton } from "@/components/ShareButton";
import { ResultSummary } from "@/components/ResultSummary";
import { FeeComparison } from "@/components/FeeComparison";

export default function Home() {
  const [years, setYears] = useState(25);
  const [scpi, setScpi] = useState(defaultSCPI);
  const [scpiCredit, setScpiCredit] = useState(defaultSCPICredit);
  const [av, setAv] = useState(defaultAV);
  const [per, setPer] = useState(defaultPER);
  const horizonTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trackedView = useRef(false);
  useEffect(() => {
    const decoded = decodeState(window.location.search);
    if (decoded) {
      if (decoded.years !== undefined) setYears(decoded.years);
      if (decoded.scpi) setScpi(decoded.scpi);
      if (decoded.scpiCredit) setScpiCredit(decoded.scpiCredit);
      if (decoded.av) setAv(decoded.av);
      if (decoded.per) setPer(decoded.per);
    }
    if (!trackedView.current) {
      trackedView.current = true;
      track("simulation_viewed", { from_shared_link: String(!!decoded) });
    }
  }, []);

  const results = useSimulation(scpi, scpiCredit, av, per, years);

  const passiveIncome = useMemo(() => computePassiveIncome(scpi, scpiCredit, years), [scpi, scpiCredit, years]);
  const monthlyEffort = useMemo(() => computeMonthlyEffort(scpi, scpiCredit, av, per), [scpi, scpiCredit, av, per]);
  const milestones = useMemo(() => computeMilestones(scpiCredit, av), [scpiCredit, av]);

  const buildShareUrl = () => {
    const qs = encodeState({ years, scpi, scpiCredit, av, per });
    return `${window.location.origin}${window.location.pathname}?${qs}`;
  };

  return (
    <main className="min-h-screen max-w-5xl mx-auto px-4 md:px-8 pb-12">
      <Hero years={years} totalFinal={results.totalFinal} totalInvested={results.totalInvested} />
      <HorizonSlider years={years} onChange={(v) => { setYears(v); if (horizonTimer.current) clearTimeout(horizonTimer.current); horizonTimer.current = setTimeout(() => track("horizon_changed", { years: String(v) }), 500); }} />

      <section className="mb-12">
        <h2 className="text-lg font-bold text-[var(--text)] mb-6">Choisissez vos enveloppes</h2>
        <div className="grid md:grid-cols-2 gap-5">
          <SCPICashCard config={scpi} onChange={setScpi} />
          <SCPICreditCard config={scpiCredit} onChange={setScpiCredit} />
          <AVCard config={av} onChange={setAv} />
          <PERCard config={per} onChange={setPer} />
        </div>
      </section>

      {scpiCredit.enabled && <SCPICreditDetail config={scpiCredit} years={years} />}

      <ResultSummary monthlyEffort={monthlyEffort} totalFinal={results.totalFinal} monthlyIncome={passiveIncome} hasCreditSCPI={scpiCredit.enabled} />

      {(av.enabled || per.enabled) && (
        <FeeComparison
          envelopes={[
            ...(av.enabled ? [{ label: "Assurance Vie", icon: "🛡️", initialCapital: av.initialCapital, monthlyContribution: av.monthlyContribution }] : []),
            ...(per.enabled ? [{ label: "PER", icon: "🎯", initialCapital: per.initialCapital, monthlyContribution: per.monthlyContribution }] : []),
          ]}
        />
      )}

      <ComparisonBlock results={results} perEnabled={per.enabled} perTmi={per.tmi} />
      <PatrimoineChart
        chartData={results.chartData}
        years={years}
        milestones={milestones}
      />
      <RecapTable results={results} />

      <div className="py-6">
        <ShareButton buildUrl={buildShareUrl} />
      </div>

      <footer className="text-center text-xs text-[var(--muted)] py-8 border-t border-[var(--border)] space-y-1">
        <p>Simulation à titre indicatif — Les performances passées ne préjugent pas des performances futures.</p>
        <p>Les investissements comportent des risques, notamment de perte en capital.</p>
      </footer>
    </main>
  );
}

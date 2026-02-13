"use client";

import { useState } from "react";
import { defaultSCPI, defaultSCPICredit, defaultAV, defaultPER } from "@/lib/constants";
import { useSimulation } from "@/hooks/useSimulation";
import { Hero } from "@/components/Hero";
import { HorizonSlider } from "@/components/HorizonSlider";
import { SCPICashCard, SCPICreditCard, AVCard, PERCard } from "@/components/EnvelopeCards";
import { SCPICreditDetail } from "@/components/SCPICreditDetail";
import { ComparisonBlock } from "@/components/ComparisonBlock";
import { PatrimoineChart } from "@/components/PatrimoineChart";
import { RecapTable } from "@/components/RecapTable";

export default function Home() {
  const [years, setYears] = useState(25);
  const [scpi, setScpi] = useState(defaultSCPI);
  const [scpiCredit, setScpiCredit] = useState(defaultSCPICredit);
  const [av, setAv] = useState(defaultAV);
  const [per, setPer] = useState(defaultPER);

  const results = useSimulation(scpi, scpiCredit, av, per, years);

  return (
    <main className="min-h-screen max-w-5xl mx-auto px-4 md:px-8 pb-12">
      <Hero years={years} totalFinal={results.totalFinal} totalInvested={results.totalInvested} />
      <HorizonSlider years={years} onChange={setYears} />

      <section className="mb-12">
        <h2 className="text-lg font-bold text-white mb-6">Choisissez vos enveloppes</h2>
        <div className="grid md:grid-cols-2 gap-5">
          <SCPICashCard config={scpi} onChange={setScpi} />
          <SCPICreditCard config={scpiCredit} onChange={setScpiCredit} />
          <AVCard config={av} onChange={setAv} />
          <PERCard config={per} onChange={setPer} />
        </div>
      </section>

      {scpiCredit.enabled && <SCPICreditDetail config={scpiCredit} years={years} />}

      <ComparisonBlock results={results} perEnabled={per.enabled} perTmi={per.tmi} />
      <PatrimoineChart chartData={results.chartData} years={years} />
      <RecapTable results={results} />

      <footer className="text-center text-xs text-[var(--muted)] py-8 border-t border-white/5 space-y-1">
        <p>Simulation à titre indicatif — Les performances passées ne préjugent pas des performances futures.</p>
        <p>Les investissements comportent des risques, notamment de perte en capital.</p>
      </footer>
    </main>
  );
}

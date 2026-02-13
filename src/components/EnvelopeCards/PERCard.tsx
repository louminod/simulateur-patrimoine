"use client";

import { memo, useState, useCallback } from "react";
import type { EnvelopeConfig } from "@/lib/types";
import { TMI_OPTIONS } from "@/lib/constants";
import { CompactField } from "@/components/ui/CompactField";
import { Tip } from "@/components/ui/Tip";
import { EnvelopeCardWrapper } from "./EnvelopeCardWrapper";

interface PERCardProps {
  config: EnvelopeConfig;
  onChange: (c: EnvelopeConfig) => void;
}

function PERCardInner({ config, onChange }: PERCardProps) {
  const set = useCallback((p: Partial<EnvelopeConfig>) => onChange({ ...config, ...p }), [config, onChange]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  return (
    <EnvelopeCardWrapper
      icon="🎯" title="Plan Épargne Retraite" subtitle="Préparez votre retraite tout en réduisant vos impôts"
      enabled={config.enabled} onToggle={() => set({ enabled: !config.enabled })}
      gradient="from-orange-500/20 to-amber-500/20" borderColor="border-orange-500/30"
    >
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <CompactField label="Capital initial" value={config.initialCapital} onChange={(v) => set({ initialCapital: v })} suffix="€" />
          <CompactField label="Effort d'épargne" value={config.monthlyContribution} onChange={(v) => set({ monthlyContribution: v })} suffix="€/mois" />
        </div>
        <div>
          <label className="text-xs text-[var(--muted)] flex items-center mb-1.5">
            Tranche d&apos;imposition<Tip text="Votre tranche marginale d'imposition. Plus elle est élevée, plus l'économie d'impôt est importante." />
          </label>
          <div className="flex gap-2">
            {TMI_OPTIONS.map((t) => (
              <button key={t} onClick={() => set({ tmi: t })}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${config.tmi === t ? "bg-gradient-to-r from-[var(--orange)] to-amber-400 text-white" : "bg-white/5 text-[var(--muted)] hover:bg-white/10"}`}>
                {t}%
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs text-[var(--accent)] hover:text-[var(--accent2)] transition-colors flex items-center gap-1">
          <span className={`transition-transform ${showAdvanced ? "rotate-90" : ""}`}>▸</span>
          Détail
        </button>
        {showAdvanced && (
          <div className="pt-2 border-t border-white/5 space-y-3">
            <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/15 rounded-xl px-3 py-2.5">
              <p className="text-[11px] text-orange-200/80 leading-relaxed">
                ✨ Rendement de <span className="font-semibold text-orange-300">4% net de frais</span> grâce à un accompagnement personnalisé et des arbitrages réguliers effectués par votre conseiller pour optimiser vos placements.
              </p>
              <p className="text-[10px] text-orange-200/60 mt-1.5 leading-relaxed">
                💰 Vos versements sont <strong className="text-orange-300">déductibles de votre revenu imposable</strong>. À une TMI de 30%, un versement de 100€ ne vous coûte réellement que 70€. Plus votre TMI est élevée, plus l&apos;avantage est important.
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-2.5 space-y-1.5">
              <p className="text-[11px] font-medium text-[var(--muted)]">Frais appliqués</p>
              <div className="flex justify-between text-[10px]">
                <span className="text-[var(--muted)]">Frais d&apos;entrée</span>
                <span className="text-white">4% <span className="text-emerald-400 ml-1">— parmi les plus bas du marché</span></span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-[var(--muted)]">Frais de gestion annuels</span>
                <span className="text-white">1% <span className="text-emerald-400 ml-1">— inférieur à la moyenne (1,5-2%)</span></span>
              </div>
              <div className="border-t border-white/5 pt-1.5 mt-1">
                <p className="text-[10px] text-emerald-400/80">✓ Aucun frais d&apos;arbitrage, de sortie, de rachat ni de frais sur la rentabilité</p>
              </div>
            </div>
            <div className="bg-orange-500/10 border border-orange-500/15 rounded-lg p-2.5">
              <p className="text-[10px] text-orange-200/80">🔒 <strong className="text-orange-300">Fonds bloqués jusqu&apos;à la retraite</strong> — En contrepartie de l&apos;avantage fiscal, les sommes versées sur le PER sont bloquées jusqu&apos;à votre départ à la retraite (sauf cas exceptionnels : achat de résidence principale, accident de la vie).</p>
            </div>
          </div>
        )}
      </div>
    </EnvelopeCardWrapper>
  );
}

export const PERCard = memo(PERCardInner);

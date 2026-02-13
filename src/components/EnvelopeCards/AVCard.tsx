"use client";

import { memo, useState, useCallback } from "react";
import type { EnvelopeConfig } from "@/lib/types";
import { CompactField } from "@/components/ui/CompactField";
import { EnvelopeCardWrapper } from "./EnvelopeCardWrapper";

interface AVCardProps {
  config: EnvelopeConfig;
  onChange: (c: EnvelopeConfig) => void;
}

function AVCardInner({ config, onChange }: AVCardProps) {
  const set = useCallback((p: Partial<EnvelopeConfig>) => onChange({ ...config, ...p }), [config, onChange]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  return (
    <EnvelopeCardWrapper
      icon="🛡️" title="Assurance Vie" subtitle="Épargne flexible avec fiscalité avantageuse après 8 ans"
      enabled={config.enabled} onToggle={() => set({ enabled: !config.enabled })}
      gradient="from-cyan-500/20 to-blue-500/20" borderColor="border-cyan-500/30"
    >
      <div className="space-y-3">
        <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/15 rounded-xl px-3 py-2.5">
          <p className="text-[11px] text-cyan-200/80 leading-relaxed">
            ✨ Rendement de <span className="font-semibold text-cyan-300">4% net de frais</span> grâce à un accompagnement personnalisé et des arbitrages réguliers effectués par votre conseiller pour optimiser vos placements.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <CompactField label="Capital initial" value={config.initialCapital} onChange={(v) => set({ initialCapital: v })} suffix="€" />
          <CompactField label="Effort d'épargne" value={config.monthlyContribution} onChange={(v) => set({ monthlyContribution: v })} suffix="€/mois" />
        </div>
        <button onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs text-[var(--accent)] hover:text-[var(--accent2)] transition-colors flex items-center gap-1">
          <span className={`transition-transform ${showAdvanced ? "rotate-90" : ""}`}>▸</span>
          Personnaliser
        </button>
        {showAdvanced && (
          <div className="pt-2 border-t border-white/5 space-y-3">
            <CompactField label="Prélèvements sociaux" value={config.socialCharges} onChange={(v) => set({ socialCharges: v })} suffix="%" tip="17,2% en France sur les gains" />
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
            <div className="bg-cyan-500/10 border border-cyan-500/15 rounded-lg p-2.5">
              <p className="text-[10px] text-cyan-200/80">🔓 <strong className="text-cyan-300">Fonds disponibles à tout moment</strong> — Vous pouvez effectuer un rachat partiel ou total de votre assurance vie quand vous le souhaitez, sans délai ni pénalité.</p>
            </div>
          </div>
        )}
      </div>
    </EnvelopeCardWrapper>
  );
}

export const AVCard = memo(AVCardInner);

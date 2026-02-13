"use client";

import { memo, useState, useCallback } from "react";
import type { EnvelopeConfig } from "@/lib/types";
import { CompactField } from "@/components/ui/CompactField";
import { Toggle } from "@/components/ui/Toggle";
import { Tip } from "@/components/ui/Tip";
import { EnvelopeCardWrapper } from "./EnvelopeCardWrapper";

interface SCPICashCardProps {
  config: EnvelopeConfig;
  onChange: (c: EnvelopeConfig) => void;
}

function SCPICashCardInner({ config, onChange }: SCPICashCardProps) {
  const set = useCallback((p: Partial<EnvelopeConfig>) => onChange({ ...config, ...p }), [config, onChange]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  return (
    <EnvelopeCardWrapper
      icon="🏢" title="SCPI Comptant" subtitle="Investissez dans l'immobilier et percevez des revenus réguliers"
      enabled={config.enabled} onToggle={() => set({ enabled: !config.enabled })}
      gradient="from-indigo-500/20 to-violet-500/20" borderColor="border-indigo-500/30"
    >
      <div className="space-y-3">
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
          <div className="space-y-3 pt-2 border-t border-white/5">
            <div className="grid grid-cols-2 gap-3">
              <CompactField label="Rendement" value={config.rate} onChange={(v) => set({ rate: v })} suffix="%" step={0.1} />
              <CompactField label="Frais d'entrée" value={config.entryFees} onChange={(v) => set({ entryFees: v })} suffix="%" tip="Environ 8% sur chaque versement, amortis dans le temps" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--muted)] flex items-center">
                Réinvestir les revenus<Tip text="Les revenus sont automatiquement réinvestis pour accélérer la croissance" />
              </span>
              <Toggle on={config.reinvestDividends} onToggle={() => set({ reinvestDividends: !config.reinvestDividends })} />
            </div>
          </div>
        )}
      </div>
    </EnvelopeCardWrapper>
  );
}

export const SCPICashCard = memo(SCPICashCardInner);

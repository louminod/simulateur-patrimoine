"use client";

import { memo, useState, useCallback } from "react";
import { track } from "@vercel/analytics";
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
      gradient="from-indigo-500/20 to-violet-500/20" borderColor="border-indigo-500/30" trackType="scpi_cash"
    >
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <CompactField label="Capital initial" value={config.initialCapital} onChange={(v) => set({ initialCapital: v })} suffix="€" />
          <CompactField label="Effort d'épargne" value={config.monthlyContribution} onChange={(v) => set({ monthlyContribution: v })} suffix="€/mois" />
        </div>
        <button onClick={() => { if (!showAdvanced) track("detail_opened", { type: "scpi_cash" }); setShowAdvanced(!showAdvanced); }}
          className="text-xs text-[var(--accent)] hover:text-[var(--accent2)] transition-colors flex items-center gap-1">
          <span className={`transition-transform ${showAdvanced ? "rotate-90" : ""}`}>▸</span>
          Détail &amp; Personnalisation
        </button>
        {showAdvanced && (
          <div className="space-y-3 pt-2 border-t border-[var(--border)]">
            <CompactField label="Rendement" value={config.rate} onChange={(v) => set({ rate: v })} suffix="%" step={0.1} />
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--muted)] flex items-center">
                Réinvestir les revenus<Tip text="C'est la puissance des intérêts composés : vos revenus génèrent eux-mêmes des revenus, qui génèrent à leur tour des revenus. L'effet boule de neige accélère considérablement la croissance de votre patrimoine sur le long terme." />
              </span>
              <Toggle on={config.reinvestDividends} onToggle={() => { track("scpi_reinvest_toggled", { enabled: String(!config.reinvestDividends) }); set({ reinvestDividends: !config.reinvestDividends }); }} />
            </div>
            {config.reinvestDividends && (
              <div className="bg-indigo-500/10 border border-indigo-500/15 rounded-xl px-3 py-2">
                <p className="text-[10px] text-indigo-200/80 leading-relaxed">
                  🔄 <strong className="text-indigo-300">Intérêts composés activés</strong> — Vos loyers sont réinvestis automatiquement en nouvelles parts. Chaque mois, votre patrimoine génère davantage de revenus. Sur 25 ans, cette stratégie peut <strong>doubler vos gains</strong> par rapport à un simple encaissement des loyers.
                </p>
              </div>
            )}
            <div className="bg-[var(--overlay-strong)] rounded-lg p-2.5 space-y-1.5">
              <p className="text-[11px] font-medium text-[var(--muted)]">Frais appliqués</p>
              <div className="flex justify-between text-[10px]">
                <span className="text-[var(--muted)]">Frais d&apos;entrée</span>
                <span className="text-[var(--text)]">~10% <span className="text-emerald-400 ml-1">— moyenne du marché</span></span>
              </div>
              <div className="border-t border-[var(--border)] pt-1.5 mt-1 space-y-1">
                <p className="text-[10px] text-emerald-400/80">✓ Aucun frais de gestion supplémentaire, de sortie ni de rachat</p>
                <p className="text-[10px] text-[var(--muted)]">Les frais d&apos;entrée sont payés uniquement à la revente des parts (si revente il y a). Ils s&apos;appliquent sur le capital investi, pas sur le capital constitué. Ex : pour 50 000€ investis qui deviennent 85 000€ après 25 ans, les frais ne portent que sur les 50 000€ initiaux (soit 5 000€), et non sur les 85 000€ constitués.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </EnvelopeCardWrapper>
  );
}

export const SCPICashCard = memo(SCPICashCardInner);

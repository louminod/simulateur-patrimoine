"use client";

import { memo, useState, useCallback } from "react";
import { track } from "@vercel/analytics";
import type { SCPICreditConfig } from "@/lib/types";
import { calcLoanPayment, getInsuranceRate } from "@/lib/simulation";
import { fmt } from "@/lib/formatters";
import { SliderField } from "@/components/ui/SliderField";
import { CompactField } from "@/components/ui/CompactField";
import { EnvelopeCardWrapper } from "./EnvelopeCardWrapper";

interface SCPICreditCardProps {
  config: SCPICreditConfig;
  onChange: (c: SCPICreditConfig) => void;
}

function SCPICreditCardInner({ config, onChange }: SCPICreditCardProps) {
  const set = useCallback((p: Partial<SCPICreditConfig>) => onChange({ ...config, ...p }), [config, onChange]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const loanPay = calcLoanPayment(config.loanAmount, config.interestRate, config.loanYears);
  const insRate = getInsuranceRate(config.borrowerAge);
  const monthlyIns = config.loanAmount * insRate / 100 / 12;
  const payment = loanPay + monthlyIns;
  const netShares = (config.loanAmount + config.downPayment) * (1 - config.entryFees / 100);
  const monthlyDiv = netShares * (config.rate / 100) / 12;
  const cashflow = monthlyDiv - payment;

  return (
    <EnvelopeCardWrapper
      icon="🏦" title="SCPI à Crédit" subtitle="La banque finance votre patrimoine immobilier"
      enabled={config.enabled} onToggle={() => set({ enabled: !config.enabled })}
      gradient="from-purple-500/20 to-pink-500/20" borderColor="border-purple-500/30" trackType="scpi_credit"
    >
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <CompactField label="Montant emprunté" value={config.loanAmount} onChange={(v) => set({ loanAmount: v })} suffix="€" />
          <CompactField label="Apport personnel" value={config.downPayment} onChange={(v) => set({ downPayment: v })} suffix="€" />
        </div>
        <div className="bg-[var(--overlay-strong)] rounded-xl p-3 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-[var(--muted)]">Mensualité prêt</span>
            <span className="text-[var(--text)] font-medium">{fmt(payment)}/mois</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[var(--muted)]">Assurance emprunteur</span>
            <span className="text-[var(--text)] font-medium">{fmt(monthlyIns)}/mois <span className="text-[var(--muted)]">({insRate}%)</span></span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[var(--muted)]">Revenus passifs</span>
            <span className="text-[var(--green)] font-medium">+{fmt(monthlyDiv)}/mois</span>
          </div>
          <div className="border-t border-[var(--border)] pt-2 flex justify-between text-xs">
            <span className="font-medium text-[var(--muted)]">Votre effort réel</span>
            <span className={`font-bold ${cashflow >= 0 ? "text-[var(--green)]" : "text-[var(--orange)]"}`}>
              {cashflow >= 0 ? "+" : ""}{fmt(cashflow)}/mois
            </span>
          </div>
        </div>
        <button onClick={() => { if (!showAdvanced) track("detail_opened", { type: "scpi_credit" }); setShowAdvanced(!showAdvanced); }}
          className="text-xs text-[var(--accent)] hover:text-[var(--accent2)] transition-colors flex items-center gap-1">
          <span className={`transition-transform ${showAdvanced ? "rotate-90" : ""}`}>▸</span>
          Détail &amp; Personnalisation
        </button>
        {showAdvanced && (
          <div className="space-y-3 pt-2 border-t border-[var(--border)]">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
              <p className="text-xs text-emerald-300 font-medium mb-1">💡 Avantage fiscal</p>
              <p className="text-xs text-emerald-200/80 leading-relaxed">
                Les <strong>intérêts d&apos;emprunt</strong> ainsi que les <strong>frais liés au crédit</strong> (assurance emprunteur, frais de dossier, frais de garantie) sont <strong>déductibles de vos revenus fonciers</strong>. Le coût réel du financement est donc significativement réduit par l&apos;économie d&apos;impôt. Vous constituez un patrimoine immobilier grâce à l&apos;effet de levier du crédit.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <CompactField label="Taux d'intérêt" value={config.interestRate} onChange={(v) => set({ interestRate: v })} suffix="%" step={0.05} tip="Taux nominal annuel du prêt" />
              <CompactField label="Rendement SCPI" value={config.rate} onChange={(v) => set({ rate: v })} suffix="%" step={0.1} />
            </div>
            <div>
              <label className="text-xs text-[var(--muted)] mb-1 block">Durée du prêt</label>
              <div className="flex gap-1">
                {[10, 15, 20, 25].map((y) => (
                  <button key={y} onClick={() => set({ loanYears: y })}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${config.loanYears === y ? "bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] text-white" : "bg-[var(--overlay-strong)] text-[var(--muted)] hover:bg-[var(--overlay-strong)]"}`}>
                    {y}a
                  </button>
                ))}
              </div>
            </div>
            <SliderField label="Âge de l'emprunteur" value={config.borrowerAge} onChange={(v) => set({ borrowerAge: v })} min={25} max={65} suffix=" ans" />
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

export const SCPICreditCard = memo(SCPICreditCardInner);

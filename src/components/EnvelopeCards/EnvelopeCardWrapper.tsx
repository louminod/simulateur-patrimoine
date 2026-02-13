"use client";

import { memo } from "react";
import { track } from "@vercel/analytics";
import { Toggle } from "@/components/ui/Toggle";

interface EnvelopeCardWrapperProps {
  icon: string;
  title: string;
  trackType?: string;
  subtitle: string;
  enabled: boolean;
  onToggle: () => void;
  gradient: string;
  borderColor: string;
  children: React.ReactNode;
}

function EnvelopeCardWrapperInner({ icon, title, subtitle, enabled, onToggle, gradient, borderColor, trackType, children }: EnvelopeCardWrapperProps) {
  const handleToggle = () => {
    if (trackType) track("envelope_toggled", { type: trackType, enabled: String(!enabled) });
    onToggle();
  };
  return (
    <div className={`rounded-2xl border p-5 transition-all ${enabled ? `${borderColor} bg-gradient-to-br ${gradient}` : "border-white/5 bg-white/[0.02] opacity-60"}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <div>
            <h3 className="font-semibold text-sm text-white">{title}</h3>
            <p className="text-[11px] text-[var(--muted)] mt-0.5 leading-snug max-w-[220px]">{subtitle}</p>
          </div>
        </div>
        <Toggle on={enabled} onToggle={handleToggle} />
      </div>
      {enabled && <div className="mt-4">{children}</div>}
    </div>
  );
}

export const EnvelopeCardWrapper = memo(EnvelopeCardWrapperInner);

"use client";

import { memo } from "react";
import { Tip } from "./Tip";

interface CompactFieldProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  step?: number;
  tip?: string;
}

function CompactFieldInner({ label, value, onChange, suffix, step, tip }: CompactFieldProps) {
  return (
    <div>
      <label className="text-xs text-[var(--muted)] flex items-center mb-1">
        {label}
        {tip && <Tip text={tip} />}
      </label>
      <div className="flex items-center gap-1 bg-[var(--overlay-strong)] border border-[var(--border)] rounded-lg px-3 py-2">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          step={step ?? 1}
          aria-label={label}
          className="bg-transparent outline-none w-full text-sm text-[var(--text)]"
        />
        {suffix && <span className="text-xs text-[var(--muted)]">{suffix}</span>}
      </div>
    </div>
  );
}

export const CompactField = memo(CompactFieldInner);

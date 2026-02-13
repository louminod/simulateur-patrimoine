"use client";

import { memo } from "react";
import { Tip } from "./Tip";

interface SliderFieldProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  tip?: string;
}

function SliderFieldInner({ label, value, onChange, min, max, step, suffix, tip }: SliderFieldProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm text-[var(--muted)] flex items-center">
          {label}
          {tip && <Tip text={tip} />}
        </label>
        <div className="flex items-center gap-1 bg-white/5 rounded-lg px-3 py-1.5 border border-white/5">
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            min={min}
            max={max}
            step={step ?? 1}
            aria-label={label}
            className="bg-transparent outline-none w-20 text-right text-sm font-semibold text-white"
          />
          {suffix && <span className="text-xs text-[var(--muted)] ml-0.5">{suffix}</span>}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step ?? 1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={`${label} slider`}
        className="w-full"
      />
    </div>
  );
}

export const SliderField = memo(SliderFieldInner);

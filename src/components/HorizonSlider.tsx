"use client";

import { memo } from "react";
import { SliderField } from "@/components/ui/SliderField";

interface HorizonSliderProps {
  years: number;
  onChange: (v: number) => void;
}

function HorizonSliderInner({ years, onChange }: HorizonSliderProps) {
  return (
    <section className="mb-8">
      <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-6">
        <SliderField label="⏳ Horizon de placement" value={years} onChange={onChange} min={1} max={40} suffix="ans"
          tip="Plus vous investissez longtemps, plus les intérêts composés travaillent pour vous" />
      </div>
    </section>
  );
}

export const HorizonSlider = memo(HorizonSliderInner);

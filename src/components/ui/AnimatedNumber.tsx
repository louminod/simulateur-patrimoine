"use client";

import { useState, useEffect } from "react";
import { memo } from "react";
import { fmt } from "@/lib/formatters";

interface AnimatedNumberProps {
  value: number;
  className?: string;
}

function AnimatedNumberInner({ value, className }: AnimatedNumberProps) {
  const [displayed, setDisplayed] = useState(value);
  useEffect(() => {
    const start = displayed;
    const diff = value - start;
    if (Math.abs(diff) < 1) { setDisplayed(value); return; }
    const duration = 600;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(start + diff * eased);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return <span className={className}>{fmt(Math.round(displayed))}</span>;
}

export const AnimatedNumber = memo(AnimatedNumberInner);

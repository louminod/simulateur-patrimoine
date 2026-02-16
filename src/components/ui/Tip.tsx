"use client";

import { memo } from "react";

function TipInner({ text }: { text: string }) {
  return (
    <span className="relative group ml-1.5 cursor-help">
      <span className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full bg-[var(--overlay-strong)] border border-[var(--border)] text-[10px] text-[var(--muted)] hover:bg-[var(--overlay-strong)] transition-colors">?</span>
      <span className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-xl bg-[var(--card)] border border-[var(--border)] text-xs text-[var(--text)] w-60 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-2xl leading-relaxed">
        {text}
      </span>
    </span>
  );
}

export const Tip = memo(TipInner);

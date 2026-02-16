"use client";

import { memo } from "react";

function ToggleInner({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      aria-label={on ? "Désactiver" : "Activer"}
      className={`w-12 h-6 rounded-full transition-all relative ${on ? "bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)]" : "bg-[var(--overlay-strong)]"}`}
    >
      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-md ${on ? "left-7" : "left-1"}`} />
    </button>
  );
}

export const Toggle = memo(ToggleInner);

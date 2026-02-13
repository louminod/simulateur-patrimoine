"use client";

import { useState } from "react";

interface ShareButtonProps {
  buildUrl: () => string;
}

export function ShareButton({ buildUrl }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleClick = async () => {
    const url = buildUrl();
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-2 mx-auto px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-[var(--muted)] hover:text-white"
    >
      {copied ? (
        <>✅ Lien copié !</>
      ) : (
        <>🔗 Partager cette simulation</>
      )}
    </button>
  );
}

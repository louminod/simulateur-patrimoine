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
      className="flex items-center gap-2 mx-auto px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30"
    >
      {copied ? (
        <>✅ Lien copié !</>
      ) : (
        <>🔗 Partager cette simulation</>
      )}
    </button>
  );
}

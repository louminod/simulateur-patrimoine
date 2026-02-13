"use client";

import { memo, useState, useCallback } from "react";
import type { EnvelopeConfig, SCPICreditConfig, AggregatedResults } from "@/lib/types";

interface PDFButtonProps {
  years: number;
  scpi: EnvelopeConfig;
  scpiCredit: SCPICreditConfig;
  av: EnvelopeConfig;
  per: EnvelopeConfig;
  results: AggregatedResults;
}

function PDFButtonInner({ years, scpi, scpiCredit, av, per, results }: PDFButtonProps) {
  const [downloading, setDownloading] = useState(false);

  const downloadPDF = useCallback(async () => {
    setDownloading(true);
    try {
      const { generatePDF } = await import("@/lib/generatePDF");
      await generatePDF({ years, scpi, scpiCredit, av, per, results });
    } catch (e) {
      console.error("PDF generation failed", e);
    } finally {
      setDownloading(false);
    }
  }, [years, scpi, scpiCredit, av, per, results]);

  return (
    <section className="mb-8 text-center">
      <button onClick={downloadPDF} disabled={downloading}
        className="inline-flex items-center gap-2 bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] hover:opacity-90 disabled:opacity-50 text-white font-medium py-3 px-8 rounded-xl transition-all text-sm">
        {downloading ? (
          <><span className="animate-spin">⏳</span> Génération en cours...</>
        ) : (
          <><span>📄</span> Télécharger la simulation en PDF</>
        )}
      </button>
    </section>
  );
}

export const PDFButton = memo(PDFButtonInner);

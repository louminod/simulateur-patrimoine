"use client";

import { memo, useState, useCallback, type RefObject } from "react";

interface PDFButtonProps {
  targetRef: RefObject<HTMLDivElement | null>;
}

function PDFButtonInner({ targetRef }: PDFButtonProps) {
  const [downloading, setDownloading] = useState(false);

  const downloadPDF = useCallback(async () => {
    if (!targetRef.current) return;
    setDownloading(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const canvas = await html2canvas(targetRef.current, {
        backgroundColor: "#0a0a12",
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      let position = 0;
      const pageHeight = pdf.internal.pageSize.getHeight();
      while (position < pdfHeight) {
        if (position > 0) pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, -position, pdfWidth, pdfHeight);
        position += pageHeight;
      }
      pdf.save("simulation-patrimoine.pdf");
    } catch (e) {
      console.error("PDF generation failed", e);
    } finally {
      setDownloading(false);
    }
  }, [targetRef]);

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

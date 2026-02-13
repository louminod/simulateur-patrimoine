import type { EnvelopeConfig, SCPICreditConfig, AggregatedResults, SCPICreditResult } from "./types";
import { calcLoanPayment } from "./simulation";

// Colors
const BLUE = [124, 92, 252] as const;    // #7c5cfc
const CYAN = [56, 189, 248] as const;    // #38bdf8
const DARK = [30, 30, 45] as const;
const GRAY = [100, 100, 120] as const;
const LIGHT_BG = [240, 243, 255] as const;
const WHITE = [255, 255, 255] as const;

type RGB = readonly [number, number, number];

interface PDFData {
  years: number;
  scpi: EnvelopeConfig;
  scpiCredit: SCPICreditConfig;
  av: EnvelopeConfig;
  per: EnvelopeConfig;
  results: AggregatedResults;
}

const fmtEur = (n: number): string =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

const fmtPct = (n: number): string => `${n.toFixed(1).replace(".", ",")} %`;

export async function generatePDF(data: PDFData) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();   // 210
  const H = doc.internal.pageSize.getHeight();  // 297
  const M = 20; // margin
  const CW = W - 2 * M; // content width
  let y = 0;
  let pageNum = 0;

  // Helpers
  const setColor = (c: RGB) => doc.setTextColor(c[0], c[1], c[2]);
  const setFill = (c: RGB) => doc.setFillColor(c[0], c[1], c[2]);
  const setDraw = (c: RGB) => doc.setDrawColor(c[0], c[1], c[2]);

  const addFooter = () => {
    pageNum++;
    doc.setFontSize(8);
    setColor(GRAY);
    doc.text(`${pageNum}`, W / 2, H - 10, { align: "center" });
  };

  const newPage = () => {
    doc.addPage();
    y = M;
    addFooter();
  };

  const title = (text: string, size = 18) => {
    doc.setFontSize(size);
    doc.setFont("helvetica", "bold");
    setColor(BLUE);
    doc.text(text, M, y);
    y += size * 0.5 + 2;
  };

  const subtitle = (text: string, size = 12) => {
    doc.setFontSize(size);
    doc.setFont("helvetica", "normal");
    setColor(DARK);
    doc.text(text, M, y);
    y += size * 0.45 + 2;
  };

  const bodyText = (text: string, x = M, maxWidth = CW) => {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    setColor(DARK);
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, x, y);
    y += lines.length * 4.5 + 2;
  };

  const infoBox = (titleText: string, description: string) => {
    const descLines = doc.splitTextToSize(description, CW - 16);
    const boxH = 12 + descLines.length * 4.5 + 4;
    setFill(LIGHT_BG);
    doc.roundedRect(M, y, CW, boxH, 3, 3, "F");
    y += 8;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    setColor(BLUE);
    doc.text(titleText, M + 8, y);
    y += 6;
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "normal");
    setColor(DARK);
    doc.text(descLines, M + 8, y);
    y += descLines.length * 4.5 + 4;
  };

  const paramLine = (label: string, value: string) => {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    setColor(GRAY);
    doc.text(label, M + 4, y);
    doc.setFont("helvetica", "bold");
    setColor(DARK);
    doc.text(value, M + CW - 4, y, { align: "right" });
    y += 5.5;
  };

  const resultBlock = (label: string, value: string) => {
    setFill(BLUE);
    doc.roundedRect(M, y, CW, 14, 3, 3, "F");
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(label, M + 8, y + 9);
    doc.text(value, M + CW - 8, y + 9, { align: "right" });
    y += 20;
    setColor(DARK);
  };

  const separator = () => {
    setDraw([220, 220, 235]);
    doc.line(M, y, W - M, y);
    y += 6;
  };

  // =================== PAGE 1 — COVER ===================
  pageNum++;

  // Top decorative bar
  setFill(BLUE);
  doc.rect(0, 0, W, 8, "F");

  // Accent line
  const gradY = 80;
  setFill(CYAN);
  doc.rect(M, gradY, 60, 1.5, "F");

  // Title
  y = 100;
  doc.setFontSize(32);
  doc.setFont("helvetica", "bold");
  setColor(DARK);
  doc.text("Votre Projet", M, y);
  y += 14;
  doc.text("Patrimonial", M, y);

  y += 16;
  doc.setFontSize(16);
  doc.setFont("helvetica", "normal");
  setColor(BLUE);
  doc.text(`Simulation personnalisée sur ${data.years} ans`, M, y);

  y += 30;
  doc.setFontSize(11);
  setColor(GRAY);
  const now = new Date();
  doc.text(`Document généré le ${now.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}`, M, y);

  // Bottom decorative bar
  setFill(BLUE);
  doc.rect(0, H - 8, W, 8, "F");

  addFooter();

  // =================== PAGE 2 — RÉSUMÉ ===================
  newPage();
  y = M + 5;
  title("Résumé de votre stratégie");
  y += 4;

  // Big number
  doc.setFontSize(36);
  doc.setFont("helvetica", "bold");
  setColor(BLUE);
  doc.text(fmtEur(data.results.totalFinal), M, y);
  y += 8;
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  setColor(GRAY);
  doc.text(`Patrimoine estimé à ${data.years} ans`, M, y);
  y += 10;

  // Comparison with livret
  const diff = data.results.totalFinal - data.results.livret.capital;
  doc.setFontSize(12);
  setColor(DARK);
  doc.text(`Soit ${fmtEur(diff)} de plus qu'un livret bancaire à 1%`, M, y);
  y += 12;

  separator();

  // Recap table
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  setColor(WHITE);
  setFill(BLUE);
  const cols = [M, M + 50, M + 95, M + 140];
  const colW = [50, 45, 45, CW - 140];
  doc.roundedRect(M, y, CW, 9, 2, 2, "F");
  y += 6.5;
  doc.text("Enveloppe", cols[0] + 4, y);
  doc.text("Investi", cols[1] + 4, y);
  doc.text("Patrimoine", cols[2] + 4, y);
  doc.text("Gains nets", cols[3] + 4, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  for (const sim of data.results.sims) {
    const isOdd = data.results.sims.indexOf(sim) % 2 === 0;
    if (isOdd) { setFill(LIGHT_BG); doc.rect(M, y - 4, CW, 8, "F"); }
    setColor(DARK);
    doc.text(sim.label, cols[0] + 4, y);
    doc.text(fmtEur(sim.result.totalInvested), cols[1] + 4, y);
    doc.text(fmtEur(sim.result.capital), cols[2] + 4, y);
    doc.text(fmtEur(sim.result.netGains), cols[3] + 4, y);
    y += 8;
  }

  // Total row
  setFill(DARK);
  doc.roundedRect(M, y - 4, CW, 9, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("TOTAL", cols[0] + 4, y + 1);
  doc.text(fmtEur(data.results.totalInvested), cols[1] + 4, y + 1);
  doc.text(fmtEur(data.results.totalFinal), cols[2] + 4, y + 1);
  doc.text(fmtEur(data.results.totalNet), cols[3] + 4, y + 1);
  y += 14;
  setColor(DARK);

  // Note under recap table
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  setColor(GRAY);
  doc.text("* Gains nets = Patrimoine estimé − Capital investi. Les frais d'entrée et la fiscalité applicable sont déjà déduits du patrimoine.", M, y);
  y += 6;

  // PER tax savings
  if (data.per.enabled && data.results.perSavings > 0) {
    y += 4;
    infoBox("💰 Économie d'impôt PER", `Grâce au PER, vous économisez ${fmtEur(data.results.perSavings)} d'impôts sur la durée de votre investissement (TMI à ${data.per.tmi}%).`);
  }

  // =================== PAGE 3 — SCPI COMPTANT ===================
  if (data.scpi.enabled) {
    newPage();
    y = M + 5;
    title("SCPI Comptant");
    y += 4;

    infoBox("📘 Qu'est-ce qu'une SCPI ?",
      "Une Société Civile de Placement Immobilier permet d'investir dans l'immobilier professionnel (bureaux, commerces, santé) sans les contraintes de gestion. Vous percevez des revenus réguliers (loyers) proportionnels à votre investissement.");
    y += 4;

    subtitle("Paramètres de votre investissement");
    y += 2;
    paramLine("Capital initial", fmtEur(data.scpi.initialCapital));
    paramLine("Versement mensuel", fmtEur(data.scpi.monthlyContribution));
    paramLine("Rendement annuel", fmtPct(data.scpi.rate));
    paramLine("Frais d'entrée", fmtPct(data.scpi.entryFees));
    paramLine("Réinvestissement des dividendes", data.scpi.reinvestDividends ? "Oui" : "Non");
    paramLine("Délai de jouissance", `${data.scpi.jouissanceMonths} mois`);

    y += 6;
    const scpiRes = data.results.sims.find(s => s.type === "scpi")!.result;
    resultBlock("Patrimoine estimé", fmtEur(scpiRes.capital));
    paramLine("Total investi", fmtEur(scpiRes.totalInvested));
    paramLine("Gains bruts", fmtEur(scpiRes.grossGains));
    paramLine("Gains nets", fmtEur(scpiRes.netGains));

    y += 4;
    infoBox("ℹ️ À propos des frais d'entrée SCPI",
      `Les frais d'entrée SCPI (${fmtPct(data.scpi.entryFees)}) sont des frais payés uniquement à la revente des parts, si revente il y a. Ils s'appliquent sur le capital de départ investi, pas sur le capital constitué (plus-values et revalorisations).`);
  }

  // =================== PAGE 4 — SCPI CRÉDIT ===================
  if (data.scpiCredit.enabled) {
    newPage();
    y = M + 5;
    title("SCPI à Crédit");
    y += 4;

    infoBox("🏦 L'effet de levier du crédit",
      "Le crédit immobilier permet de constituer un patrimoine SCPI sans mobiliser votre épargne. Les loyers perçus couvrent tout ou partie des mensualités. Les intérêts et frais du crédit sont déductibles de vos revenus fonciers.");
    y += 4;

    const creditRes = data.results.sims.find(s => s.type === "scpi-credit")!.result as SCPICreditResult;

    subtitle("Paramètres de votre investissement");
    y += 2;
    paramLine("Montant emprunté", fmtEur(data.scpiCredit.loanAmount));
    paramLine("Apport personnel", fmtEur(data.scpiCredit.downPayment));
    paramLine("Taux du crédit", fmtPct(data.scpiCredit.interestRate));
    paramLine("Durée du crédit", `${data.scpiCredit.loanYears} ans`);
    paramLine("Mensualité de crédit", fmtEur(creditRes.monthlyPayment));
    paramLine("Revenus mensuels (loyers)", fmtEur(creditRes.monthlyDividend));
    paramLine("Effort réel / mois", fmtEur(Math.max(0, -creditRes.cashflow)));
    paramLine("Rendement SCPI", fmtPct(data.scpiCredit.rate));
    paramLine("Frais d'entrée", fmtPct(data.scpiCredit.entryFees));

    y += 4;
    infoBox("📋 Avantage fiscal",
      "Les intérêts d'emprunt et les frais liés au crédit sont déductibles de vos revenus fonciers SCPI, réduisant ainsi votre imposition sur les loyers perçus.");
    y += 4;

    resultBlock("Patrimoine constitué à terme", fmtEur(creditRes.capital));
    paramLine("Total investi (effort réel)", fmtEur(creditRes.totalInvested));
    paramLine("Coût total du crédit", fmtEur(creditRes.totalLoanCost));
    paramLine("Gains nets", fmtEur(creditRes.netGains));

    y += 4;
    infoBox("ℹ️ À propos des frais d'entrée SCPI",
      `Les frais d'entrée SCPI (${fmtPct(data.scpiCredit.entryFees)}) sont des frais payés uniquement à la revente des parts, si revente il y a. Ils s'appliquent sur le capital de départ investi, pas sur le capital constitué (plus-values et revalorisations).`);
  }

  // =================== PAGE 5 — ASSURANCE VIE ===================
  if (data.av.enabled) {
    newPage();
    y = M + 5;
    title("Assurance Vie");
    y += 4;

    infoBox("📗 Qu'est-ce que l'assurance vie ?",
      "L'assurance vie est l'enveloppe d'épargne préférée des Français. Elle offre une fiscalité avantageuse après 8 ans, une transmission optimisée et une grande flexibilité. Votre capital est accessible à tout moment.");
    y += 4;

    subtitle("Paramètres de votre investissement");
    y += 2;
    paramLine("Capital initial", fmtEur(data.av.initialCapital));
    paramLine("Versement mensuel", fmtEur(data.av.monthlyContribution));
    paramLine("Rendement net annuel", "4,0 % (accompagnement CGP)");
    paramLine("Frais d'entrée", "4 %");
    paramLine("Frais de gestion", "1 % / an");
    paramLine("Autres frais", "Aucun");

    y += 6;
    const avRes = data.results.sims.find(s => s.type === "av")!.result;
    resultBlock("Patrimoine estimé", fmtEur(avRes.capital));
    paramLine("Total investi", fmtEur(avRes.totalInvested));
    paramLine("Gains bruts", fmtEur(avRes.grossGains));
    paramLine("Gains nets (après fiscalité)", fmtEur(avRes.netGains));
  }

  // =================== PAGE 6 — PER ===================
  if (data.per.enabled) {
    newPage();
    y = M + 5;
    title("Plan d'Épargne Retraite (PER)");
    y += 4;

    infoBox("📙 Qu'est-ce que le PER ?",
      "Le Plan d'Épargne Retraite vous permet de préparer votre retraite tout en réduisant vos impôts dès aujourd'hui. Chaque versement est déductible de votre revenu imposable, selon votre tranche marginale d'imposition.");
    y += 4;

    subtitle("Paramètres de votre investissement");
    y += 2;
    paramLine("Capital initial", fmtEur(data.per.initialCapital));
    paramLine("Versement mensuel", fmtEur(data.per.monthlyContribution));
    paramLine("Rendement net annuel", fmtPct(data.per.rate));
    paramLine("Tranche marginale d'imposition", `${data.per.tmi} %`);

    y += 4;
    const perRes = data.results.sims.find(s => s.type === "per")!.result;

    infoBox("💰 Économie d'impôt détaillée",
      `TMI ${data.per.tmi}% × ${fmtEur(perRes.totalInvested)} versés = ${fmtEur(perRes.perTaxSavings)} d'économie d'impôt sur la durée de l'investissement.`);
    y += 4;

    resultBlock("Patrimoine estimé", fmtEur(perRes.capital));
    paramLine("Total investi", fmtEur(perRes.totalInvested));
    paramLine("Gains bruts", fmtEur(perRes.grossGains));
    paramLine("Gains nets", fmtEur(perRes.netGains));
    paramLine("Économie d'impôt", fmtEur(perRes.perTaxSavings));
  }

  // =================== LAST PAGE — MENTIONS LÉGALES ===================
  newPage();
  y = M + 5;
  title("Mentions légales", 14);
  y += 10;

  setFill(LIGHT_BG);
  doc.roundedRect(M, y, CW, 60, 3, 3, "F");
  y += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  setColor(DARK);

  const mentions = [
    "Simulation à titre indicatif — Les performances passées ne préjugent pas des performances futures.",
    "",
    "Les investissements comportent des risques, notamment de perte en capital.",
    "",
    "Document non contractuel.",
    "",
    "Les rendements indiqués sont des hypothèses de simulation et ne constituent en aucun cas une garantie de performance.",
    "",
    "Il est recommandé de consulter un conseiller en gestion de patrimoine avant toute décision d'investissement.",
  ];

  for (const line of mentions) {
    if (line === "") { y += 3; continue; }
    const wrapped = doc.splitTextToSize(line, CW - 16);
    doc.text(wrapped, M + 8, y);
    y += wrapped.length * 4.5;
  }

  // Bottom bar
  setFill(BLUE);
  doc.rect(0, H - 8, W, 8, "F");

  doc.save("simulation-patrimoine.pdf");
}

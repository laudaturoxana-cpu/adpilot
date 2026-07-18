import type { Kpi, Finding, Classification, DataSufficiency, Severity } from "./types";
import { THRESHOLDS } from "./rules";

/** Verifică dacă avem destule date pentru o decizie (înainte de orice regulă). */
export function computeDataSufficiency(kpi: Kpi, days: number): DataSufficiency {
  const reasons: string[] = [];
  if (kpi.spend < THRESHOLDS.minSpend) reasons.push(`buget sub ${THRESHOLDS.minSpend}`);
  if (kpi.impressions < THRESHOLDS.minImpressions) reasons.push(`sub ${THRESHOLDS.minImpressions} afișări`);
  if (days < THRESHOLDS.minDays) reasons.push(`sub ${THRESHOLDS.minDays} zile de rulare`);
  return { sufficient: reasons.length === 0, reasons, days };
}

const SEVERITY_PENALTY: Record<Severity, number> = {
  critical: 40,
  warning: 18,
  info: 4,
  opportunity: 0,
};

const SEVERITY_ORDER: Record<Severity, number> = {
  critical: 0,
  warning: 1,
  opportunity: 2,
  info: 3,
};

/** Ordonează finding-urile după severitate (critical întâi). */
export function sortFindings(findings: Finding[]): Finding[] {
  return [...findings].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}

export function scoreEntity(findings: Finding[]): number {
  let score = 100;
  for (const f of findings) score -= SEVERITY_PENALTY[f.severity];
  return Math.max(0, Math.min(100, score));
}

export function classify(
  findings: Finding[],
  score: number,
  sufficiency: DataSufficiency
): Classification {
  if (!sufficiency.sufficient) return "insufficient_data";
  const hasCritical = findings.some((f) => f.severity === "critical");
  const hasOpportunity = findings.some((f) => f.severity === "opportunity");
  if (hasCritical || score < 40) return "underperformer";
  if (hasOpportunity && score >= 70) return "winner";
  return "watch";
}

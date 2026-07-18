import type {
  AnalysisResult, EntityAnalysis, AnalysisSummary, BusinessThresholds, Finding,
} from "./types";
import type { RawInsight } from "./kpi";
import { computeKpi } from "./kpi";
import { normalizeObjective } from "./objectives";
import { evaluateRules } from "./rules";
import { computeDataSufficiency, scoreEntity, classify, sortFindings } from "./scoring";

export interface EntityInput {
  id: string;
  name: string;
  level: "campaign" | "adset" | "ad";
  metaObjective?: string;
  raw: RawInsight;
}

function insufficientDataFinding(reasons: string[]): Finding {
  return {
    ruleId: "insufficient_data",
    title: "Prea puține date pentru o decizie",
    severity: "info",
    reason: `Aștept mai multe date înainte de a recomanda o acțiune (${reasons.join(", ")}). Oprirea acum ar fi prematură.`,
    recommendedAction: "wait",
  };
}

/**
 * Rulează întregul flux determinist pe o listă de entități (campanii/adset/ad):
 * KPI → suficiență date → reguli → scoring → clasificare. AI-ul NU intervine
 * aici; el doar interpretează rezultatul ulterior.
 */
export function analyze(
  entities: EntityInput[],
  thresholds: BusinessThresholds,
  periodDays: number
): AnalysisResult {
  const analyzed: EntityAnalysis[] = entities.map((entity) => {
    const objective = normalizeObjective(entity.metaObjective);
    const kpi = computeKpi(entity.raw, objective);
    const dataSufficiency = computeDataSufficiency(kpi, periodDays);

    const findings = dataSufficiency.sufficient
      ? sortFindings(evaluateRules(kpi, { objective, thresholds, dataSufficiency }))
      : [insufficientDataFinding(dataSufficiency.reasons)];

    const score = dataSufficiency.sufficient ? scoreEntity(findings) : 0;
    const classification = classify(findings, score, dataSufficiency);

    return {
      entityId: entity.id,
      entityName: entity.name,
      level: entity.level,
      objective,
      kpi,
      dataSufficiency,
      score,
      classification,
      findings,
    };
  });

  // Ordonare: mai întâi cele cu probleme critice, apoi după spend.
  analyzed.sort((a, b) => {
    const aCrit = a.findings.some((f) => f.severity === "critical") ? 1 : 0;
    const bCrit = b.findings.some((f) => f.severity === "critical") ? 1 : 0;
    if (aCrit !== bCrit) return bCrit - aCrit;
    return b.kpi.spend - a.kpi.spend;
  });

  const summary: AnalysisSummary = {
    total: analyzed.length,
    winners: analyzed.filter((e) => e.classification === "winner").length,
    underperformers: analyzed.filter((e) => e.classification === "underperformer").length,
    watch: analyzed.filter((e) => e.classification === "watch").length,
    insufficientData: analyzed.filter((e) => e.classification === "insufficient_data").length,
    criticalFindings: analyzed.reduce((n, e) => n + e.findings.filter((f) => f.severity === "critical").length, 0),
    opportunities: analyzed.reduce((n, e) => n + e.findings.filter((f) => f.severity === "opportunity").length, 0),
    totalSpend: analyzed.reduce((n, e) => n + e.kpi.spend, 0),
  };

  return {
    generatedAt: new Date().toISOString(),
    periodDays,
    summary,
    entities: analyzed,
  };
}

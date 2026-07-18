// Tipuri pentru motorul de analiză (Etapa 4). Toate deterministe.

export type ObjectiveKind =
  | "awareness"
  | "traffic"
  | "engagement"
  | "leads"
  | "sales"
  | "app"
  | "other";

export type Severity = "critical" | "warning" | "info" | "opportunity";

export type RecommendedAction =
  | "pause"
  | "reduce_budget"
  | "increase_budget"
  | "refresh_creative"
  | "investigate_tracking"
  | "wait"
  | "none";

export type Classification =
  | "winner"
  | "underperformer"
  | "watch"
  | "insufficient_data";

/** Praguri de business folosite de reguli (din business_profiles). */
export interface BusinessThresholds {
  targetCpa?: number;
  minRoas?: number;
  currency?: string;
}

/** Indicatori calculați dintr-un rând de insights Meta. */
export interface Kpi {
  spend: number;
  impressions: number;
  reach: number;
  frequency: number;
  clicks: number;
  linkClicks: number;
  ctr: number; // %
  linkCtr: number; // %
  cpc: number;
  cpm: number;
  results: number;
  costPerResult: number | null;
  conversionRate: number | null; // % din link clicks
  revenue: number | null;
  roas: number | null;
  // opționale (ad-level, pot lipsi la campaign-level)
  hookRate: number | null;
  holdRate: number | null;
}

export interface DataSufficiency {
  sufficient: boolean;
  reasons: string[];
  days: number;
}

export interface Finding {
  ruleId: string;
  title: string;
  severity: Severity;
  reason: string;
  recommendedAction: RecommendedAction;
}

export interface EntityAnalysis {
  entityId: string;
  entityName: string;
  level: "campaign" | "adset" | "ad";
  objective: ObjectiveKind;
  kpi: Kpi;
  dataSufficiency: DataSufficiency;
  score: number; // 0-100
  classification: Classification;
  findings: Finding[];
}

export interface AnalysisSummary {
  total: number;
  winners: number;
  underperformers: number;
  watch: number;
  insufficientData: number;
  criticalFindings: number;
  opportunities: number;
  totalSpend: number;
}

export interface AnalysisResult {
  generatedAt: string;
  periodDays: number;
  summary: AnalysisSummary;
  entities: EntityAnalysis[];
}

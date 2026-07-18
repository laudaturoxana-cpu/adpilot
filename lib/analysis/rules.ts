import type { Kpi, Finding, ObjectiveKind, BusinessThresholds, DataSufficiency } from "./types";
import { hasConversionResult } from "./objectives";

/** Praguri centralizate (fără magic numbers împrăștiate). */
export const THRESHOLDS = {
  // Suficiență date (înainte de orice decizie).
  minSpend: 50,
  minImpressions: 1000,
  minDays: 3,
  // Frecvență.
  fatigueFrequency: 3,
  highFrequency: 4,
  fatigueCtr: 1.0, // % sub care, la frecvență mare, e creative fatigue
  // CTR.
  lowCtr: 0.7, // %
  // CPA (cost per rezultat) ca multiplu al țintei.
  cpaWarnFactor: 1.5,
  cpaCriticalFactor: 3,
  // Fără rezultate: prag de spend absolut când nu există target CPA.
  noResultAbsoluteSpend: 100,
  // Trafic fără conversie.
  minLinkClicksForConversionCheck: 50,
  // Scalare.
  roasScaleFactor: 1.2,
  cpaScaleFactor: 0.7,
  minResultsForScale: 3,
} as const;

export interface RuleContext {
  objective: ObjectiveKind;
  thresholds: BusinessThresholds;
  dataSufficiency: DataSufficiency;
}

interface Rule {
  id: string;
  title: string;
  severity: Finding["severity"];
  action: Finding["recommendedAction"];
  test: (kpi: Kpi, ctx: RuleContext) => boolean;
  reason: (kpi: Kpi, ctx: RuleContext) => string;
}

function currency(ctx: RuleContext): string {
  return ctx.thresholds.currency ?? "lei";
}
function money(n: number): string {
  return Math.round(n).toLocaleString("ro-RO");
}
function ratio(n: number): string {
  return n.toFixed(1);
}
function noResultSpendThreshold(ctx: RuleContext): number {
  return ctx.thresholds.targetCpa ? ctx.thresholds.targetCpa * THRESHOLDS.cpaWarnFactor : THRESHOLDS.noResultAbsoluteSpend;
}

const RULES: Rule[] = [
  {
    id: "no_results_budget",
    title: "Buget consumat fără rezultate",
    severity: "critical",
    action: "pause",
    test: (k, ctx) =>
      hasConversionResult(ctx.objective) && k.results === 0 && k.spend >= noResultSpendThreshold(ctx),
    reason: (k, ctx) =>
      `A cheltuit ${money(k.spend)} ${currency(ctx)} și nu a generat niciun rezultat. Recomand oprirea până la remedierea ofertei sau a targetării.`,
  },
  {
    id: "cpa_critical",
    title: "Cost per rezultat mult peste țintă",
    severity: "critical",
    action: "pause",
    test: (k, ctx) =>
      ctx.thresholds.targetCpa !== undefined && k.results > 0 && k.costPerResult !== null &&
      k.costPerResult > ctx.thresholds.targetCpa * THRESHOLDS.cpaCriticalFactor,
    reason: (k, ctx) =>
      `Cost per rezultat ${money(k.costPerResult ?? 0)} ${currency(ctx)}, de peste ${THRESHOLDS.cpaCriticalFactor}x ținta de ${money(ctx.thresholds.targetCpa ?? 0)} ${currency(ctx)}. Recomand oprirea.`,
  },
  {
    id: "cpa_warn",
    title: "Cost per rezultat peste țintă",
    severity: "warning",
    action: "reduce_budget",
    test: (k, ctx) =>
      ctx.thresholds.targetCpa !== undefined && k.results > 0 && k.costPerResult !== null &&
      k.costPerResult > ctx.thresholds.targetCpa * THRESHOLDS.cpaWarnFactor &&
      k.costPerResult <= ctx.thresholds.targetCpa * THRESHOLDS.cpaCriticalFactor,
    reason: (k, ctx) =>
      `Cost per rezultat ${money(k.costPerResult ?? 0)} ${currency(ctx)}, peste ținta de ${money(ctx.thresholds.targetCpa ?? 0)} ${currency(ctx)}. Recomand reducerea bugetului și testarea unui creative nou.`,
  },
  {
    id: "low_roas",
    title: "ROAS sub minim",
    severity: "warning",
    action: "reduce_budget",
    test: (k, ctx) =>
      ctx.objective === "sales" && ctx.thresholds.minRoas !== undefined && k.roas !== null &&
      k.roas < ctx.thresholds.minRoas,
    reason: (k, ctx) =>
      `ROAS ${ratio(k.roas ?? 0)}x, sub minimul de ${ratio(ctx.thresholds.minRoas ?? 0)}x. Recomand reducerea bugetului sau schimbarea creative-ului.`,
  },
  {
    id: "creative_fatigue",
    title: "Creative fatigue",
    severity: "warning",
    action: "refresh_creative",
    test: (k) =>
      k.frequency >= THRESHOLDS.fatigueFrequency && k.frequency < THRESHOLDS.highFrequency && k.ctr < THRESHOLDS.fatigueCtr,
    reason: (k) =>
      `Frecvență ${ratio(k.frequency)} cu CTR ${ratio(k.ctr)}%. Audiența a văzut reclama de prea multe ori. Recomand un creative nou.`,
  },
  {
    id: "high_frequency",
    title: "Frecvență ridicată",
    severity: "warning",
    action: "refresh_creative",
    test: (k) => k.frequency >= THRESHOLDS.highFrequency,
    reason: (k) =>
      `Frecvență ${ratio(k.frequency)}, peste pragul de ${THRESHOLDS.highFrequency}. Risc de oboseală a audienței și creștere a costurilor. Recomand reîmprospătarea creative-ului sau extinderea audienței.`,
  },
  {
    id: "low_ctr",
    title: "CTR scăzut",
    severity: "warning",
    action: "refresh_creative",
    test: (k, ctx) =>
      (ctx.objective === "traffic" || ctx.objective === "sales" || ctx.objective === "leads") &&
      k.frequency < THRESHOLDS.fatigueFrequency && k.ctr < THRESHOLDS.lowCtr,
    reason: (k) =>
      `CTR ${ratio(k.ctr)}%, sub pragul de ${THRESHOLDS.lowCtr}%. Mesajul sau creative-ul nu atrag. Recomand testarea unui unghi nou.`,
  },
  {
    id: "traffic_no_conversion",
    title: "Trafic fără conversii (posibil tracking)",
    severity: "warning",
    action: "investigate_tracking",
    test: (k, ctx) =>
      hasConversionResult(ctx.objective) && k.results === 0 &&
      k.linkClicks >= THRESHOLDS.minLinkClicksForConversionCheck &&
      k.spend < noResultSpendThreshold(ctx),
    reason: (k) =>
      `${Math.round(k.linkClicks)} click-uri pe link dar zero conversii. Verifică pixelul, evenimentele de conversie și pagina de destinație înainte de a mări bugetul.`,
  },
  {
    id: "scaling_opportunity",
    title: "Oportunitate de scalare",
    severity: "opportunity",
    action: "increase_budget",
    test: (k, ctx) => {
      const roasGood =
        ctx.objective === "sales" && ctx.thresholds.minRoas !== undefined && k.roas !== null &&
        k.roas >= ctx.thresholds.minRoas * THRESHOLDS.roasScaleFactor;
      const cpaGood =
        ctx.thresholds.targetCpa !== undefined && k.costPerResult !== null &&
        k.results >= THRESHOLDS.minResultsForScale &&
        k.costPerResult <= ctx.thresholds.targetCpa * THRESHOLDS.cpaScaleFactor;
      return Boolean(roasGood || cpaGood);
    },
    reason: (k, ctx) => {
      if (k.roas !== null && ctx.thresholds.minRoas) {
        return `ROAS ${ratio(k.roas)}x, peste minim. Performanță constantă. Recomand creșterea graduală a bugetului (max 20% la un pas).`;
      }
      return `Cost per rezultat ${money(k.costPerResult ?? 0)} ${currency(ctx)}, sub ținta ta. Recomand creșterea graduală a bugetului (max 20% la un pas).`;
    },
  },
];

/** Evaluează regulile deterministe. Se apelează doar când datele sunt suficiente. */
export function evaluateRules(kpi: Kpi, ctx: RuleContext): Finding[] {
  const findings: Finding[] = [];
  for (const rule of RULES) {
    if (rule.test(kpi, ctx)) {
      findings.push({
        ruleId: rule.id,
        title: rule.title,
        severity: rule.severity,
        reason: rule.reason(kpi, ctx),
        recommendedAction: rule.action,
      });
    }
  }
  return findings;
}

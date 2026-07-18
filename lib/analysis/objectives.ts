import type { ObjectiveKind } from "./types";

/**
 * Normalizează obiectivul Meta (nou sau legacy) într-o categorie internă.
 * Evaluarea unei campanii se face diferit în funcție de această categorie:
 * o campanie de lead gen nu se judecă după aceleași reguli ca una de ecommerce.
 */
export function normalizeObjective(metaObjective?: string): ObjectiveKind {
  const o = (metaObjective ?? "").toUpperCase();
  if (o.includes("AWARENESS") || o === "REACH" || o === "BRAND_AWARENESS") return "awareness";
  if (o.includes("SALES") || o === "CONVERSIONS" || o === "OUTCOME_SALES" || o.includes("CATALOG")) return "sales";
  if (o.includes("LEAD")) return "leads";
  if (o.includes("TRAFFIC") || o === "LINK_CLICKS") return "traffic";
  if (o.includes("ENGAGEMENT") || o.includes("VIDEO_VIEWS") || o.includes("MESSAGES") || o.includes("POST")) return "engagement";
  if (o.includes("APP")) return "app";
  return "other";
}

/**
 * Tipurile de acțiuni Meta care reprezintă "rezultatul" pentru un obiectiv.
 * Ordinea contează: se folosește primul tip găsit în insights.
 */
export function resultActionTypes(objective: ObjectiveKind): string[] {
  switch (objective) {
    case "leads":
      return ["lead", "offsite_conversion.fb_pixel_lead", "onsite_conversion.lead_grouped", "leadgen_grouped"];
    case "sales":
      return ["offsite_conversion.fb_pixel_purchase", "omni_purchase", "purchase"];
    case "traffic":
      return ["landing_page_view", "link_click"];
    case "engagement":
      return ["onsite_conversion.messaging_conversation_started_7d", "post_engagement", "video_view"];
    case "app":
      return ["omni_app_install", "app_install", "mobile_app_install"];
    case "awareness":
    case "other":
    default:
      return [];
  }
}

/** Obiectivele care au un "rezultat" măsurabil de conversie. */
export function hasConversionResult(objective: ObjectiveKind): boolean {
  return objective === "leads" || objective === "sales" || objective === "app";
}

const OBJECTIVE_LABELS: Record<ObjectiveKind, string> = {
  awareness: "Awareness",
  traffic: "Trafic",
  engagement: "Engagement",
  leads: "Lead generation",
  sales: "Vânzări",
  app: "Aplicație",
  other: "Alt obiectiv",
};

export function objectiveLabel(objective: ObjectiveKind): string {
  return OBJECTIVE_LABELS[objective];
}

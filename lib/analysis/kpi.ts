import type { Kpi, ObjectiveKind } from "./types";
import { resultActionTypes } from "./objectives";

interface ActionEntry {
  action_type: string;
  value: string;
}

/** Formă minimală de insight Meta necesară pentru KPI (decuplat de tipurile Meta). */
export interface RawInsight {
  spend?: string;
  impressions?: string;
  reach?: string;
  frequency?: string;
  clicks?: string;
  unique_clicks?: string;
  ctr?: string;
  cpc?: string;
  cpm?: string;
  actions?: ActionEntry[];
  action_values?: ActionEntry[];
  cost_per_action_type?: ActionEntry[];
  video_play_actions?: ActionEntry[];
  video_thruplay_watched_actions?: ActionEntry[];
}

function num(v: string | undefined): number {
  const n = parseFloat(v ?? "");
  return Number.isFinite(n) ? n : 0;
}

/** Suma valorilor pentru primul action_type găsit din listă (în ordinea dată). */
function firstMatchingValue(entries: ActionEntry[] | undefined, types: string[]): number {
  if (!entries) return 0;
  for (const type of types) {
    const match = entries.find((e) => e.action_type === type);
    if (match) return num(match.value);
  }
  return 0;
}

const PURCHASE_VALUE_TYPES = ["offsite_conversion.fb_pixel_purchase", "omni_purchase", "purchase"];

export function computeKpi(raw: RawInsight, objective: ObjectiveKind): Kpi {
  const spend = num(raw.spend);
  const impressions = num(raw.impressions);
  const reach = num(raw.reach);
  const clicks = num(raw.clicks);

  const frequency = raw.frequency ? num(raw.frequency) : reach > 0 ? impressions / reach : 0;
  const ctr = raw.ctr ? num(raw.ctr) : impressions > 0 ? (clicks / impressions) * 100 : 0;
  const cpc = raw.cpc ? num(raw.cpc) : clicks > 0 ? spend / clicks : 0;
  const cpm = raw.cpm ? num(raw.cpm) : impressions > 0 ? (spend / impressions) * 1000 : 0;

  const linkClicks = firstMatchingValue(raw.actions, ["link_click"]) || clicks;
  const linkCtr = impressions > 0 ? (linkClicks / impressions) * 100 : 0;

  const results = firstMatchingValue(raw.actions, resultActionTypes(objective));
  const costPerResult = results > 0 ? spend / results : null;
  const conversionRate = linkClicks > 0 && results > 0 ? (results / linkClicks) * 100 : results > 0 ? null : linkClicks > 0 ? 0 : null;

  const revenue = firstMatchingValue(raw.action_values, PURCHASE_VALUE_TYPES) || null;
  const roas = revenue !== null && spend > 0 ? revenue / spend : null;

  const videoPlays3s = firstMatchingValue(raw.video_play_actions, ["video_view"]);
  const thruplays = firstMatchingValue(raw.video_thruplay_watched_actions, ["video_view"]);
  const hookRate = impressions > 0 && videoPlays3s > 0 ? (videoPlays3s / impressions) * 100 : null;
  const holdRate = videoPlays3s > 0 && thruplays > 0 ? (thruplays / videoPlays3s) * 100 : null;

  return {
    spend, impressions, reach, frequency, clicks, linkClicks,
    ctr, linkCtr, cpc, cpm,
    results, costPerResult, conversionRate,
    revenue, roas, hookRate, holdRate,
  };
}

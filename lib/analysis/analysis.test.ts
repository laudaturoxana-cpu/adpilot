import { describe, it, expect } from "vitest";
import { computeKpi, type RawInsight } from "./kpi";
import { normalizeObjective, resultActionTypes } from "./objectives";
import { analyze } from "./analyze";
import type { BusinessThresholds } from "./types";

const thresholds: BusinessThresholds = { targetCpa: 50, minRoas: 3, currency: "lei" };

describe("normalizeObjective", () => {
  it("maps new and legacy Meta objectives", () => {
    expect(normalizeObjective("OUTCOME_LEADS")).toBe("leads");
    expect(normalizeObjective("LEAD_GENERATION")).toBe("leads");
    expect(normalizeObjective("OUTCOME_SALES")).toBe("sales");
    expect(normalizeObjective("CONVERSIONS")).toBe("sales");
    expect(normalizeObjective("OUTCOME_TRAFFIC")).toBe("traffic");
    expect(normalizeObjective("OUTCOME_AWARENESS")).toBe("awareness");
    expect(normalizeObjective(undefined)).toBe("other");
  });
});

describe("computeKpi", () => {
  it("derives cpm/ctr/cpc when not provided", () => {
    const raw: RawInsight = { spend: "100", impressions: "10000", reach: "5000", clicks: "200" };
    const k = computeKpi(raw, "traffic");
    expect(k.cpm).toBeCloseTo(10, 5);
    expect(k.ctr).toBeCloseTo(2, 5);
    expect(k.cpc).toBeCloseTo(0.5, 5);
    expect(k.frequency).toBeCloseTo(2, 5);
  });

  it("reads results by objective and computes cost per result", () => {
    const raw: RawInsight = {
      spend: "300", impressions: "20000", reach: "8000", clicks: "400",
      actions: [{ action_type: "lead", value: "6" }, { action_type: "link_click", value: "350" }],
    };
    const k = computeKpi(raw, "leads");
    expect(k.results).toBe(6);
    expect(k.costPerResult).toBeCloseTo(50, 5);
    expect(k.linkClicks).toBe(350);
  });

  it("computes ROAS from action_values for sales", () => {
    const raw: RawInsight = {
      spend: "100", impressions: "5000", reach: "3000", clicks: "120",
      actions: [{ action_type: "offsite_conversion.fb_pixel_purchase", value: "4" }],
      action_values: [{ action_type: "offsite_conversion.fb_pixel_purchase", value: "500" }],
    };
    const k = computeKpi(raw, "sales");
    expect(k.revenue).toBe(500);
    expect(k.roas).toBeCloseTo(5, 5);
  });
});

describe("resultActionTypes", () => {
  it("returns no result types for awareness", () => {
    expect(resultActionTypes("awareness")).toEqual([]);
  });
});

describe("analyze - data sufficiency guard", () => {
  it("does not decide on thin data; recommends wait", () => {
    const res = analyze(
      [{ id: "c1", name: "Test", level: "campaign", metaObjective: "OUTCOME_LEADS", raw: { spend: "10", impressions: "200", clicks: "3" } }],
      thresholds,
      1
    );
    const e = res.entities[0];
    expect(e.classification).toBe("insufficient_data");
    expect(e.findings[0].recommendedAction).toBe("wait");
    expect(res.summary.insufficientData).toBe(1);
  });
});

describe("analyze - rules", () => {
  it("flags budget spent with no results as critical pause", () => {
    const res = analyze(
      [{ id: "c1", name: "Fără rezultat", level: "campaign", metaObjective: "OUTCOME_LEADS", raw: { spend: "450", impressions: "40000", reach: "12000", clicks: "300", actions: [{ action_type: "link_click", value: "300" }] } }],
      thresholds,
      7
    );
    const e = res.entities[0];
    expect(e.classification).toBe("underperformer");
    const critical = e.findings.find((f) => f.severity === "critical");
    expect(critical?.ruleId).toBe("no_results_budget");
    expect(critical?.recommendedAction).toBe("pause");
  });

  it("flags high cost per result over target", () => {
    const res = analyze(
      [{ id: "c1", name: "CPA mare", level: "campaign", metaObjective: "OUTCOME_LEADS", raw: { spend: "500", impressions: "30000", reach: "10000", clicks: "400", actions: [{ action_type: "lead", value: "5" }, { action_type: "link_click", value: "350" }] } }],
      thresholds,
      7
    );
    // costPerResult = 100, target 50 -> 2x -> warn (not critical, < 3x)
    const e = res.entities[0];
    expect(e.findings.some((f) => f.ruleId === "cpa_warn")).toBe(true);
  });

  it("detects a scaling opportunity for strong ROAS", () => {
    const res = analyze(
      [{ id: "c1", name: "Winner", level: "campaign", metaObjective: "OUTCOME_SALES", raw: { spend: "200", impressions: "20000", reach: "9000", clicks: "500", actions: [{ action_type: "offsite_conversion.fb_pixel_purchase", value: "10" }, { action_type: "link_click", value: "450" }], action_values: [{ action_type: "offsite_conversion.fb_pixel_purchase", value: "1000" }] } }],
      thresholds,
      7
    );
    const e = res.entities[0];
    expect(e.findings.some((f) => f.ruleId === "scaling_opportunity")).toBe(true);
    expect(e.classification).toBe("winner");
  });

  it("flags creative fatigue on high frequency + low ctr", () => {
    const res = analyze(
      [{ id: "c1", name: "Obosit", level: "campaign", metaObjective: "OUTCOME_TRAFFIC", raw: { spend: "120", impressions: "50000", reach: "14000", frequency: "3.5", clicks: "150", ctr: "0.3" } }],
      thresholds,
      7
    );
    const e = res.entities[0];
    expect(e.findings.some((f) => f.ruleId === "creative_fatigue")).toBe(true);
  });
});

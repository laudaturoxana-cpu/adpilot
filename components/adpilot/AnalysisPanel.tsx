"use client";

import { useState } from "react";
import { toast } from "sonner";
import { GlowButton } from "@/components/adpilot/GlowButton";
import { objectiveLabel } from "@/lib/analysis/objectives";
import type { AnalysisResult, EntityAnalysis, Severity, RecommendedAction, Classification } from "@/lib/analysis/types";
import { Sparkles, AlertTriangle, TrendingUp, Clock, ChevronDown, ChevronUp } from "lucide-react";

const severityColor: Record<Severity, string> = {
  critical: "var(--brand-danger)",
  warning: "var(--brand-warning)",
  opportunity: "var(--brand-accent)",
  info: "var(--text-muted)",
};

const actionLabel: Record<RecommendedAction, string> = {
  pause: "Oprește",
  reduce_budget: "Reduce buget",
  increase_budget: "Crește buget",
  refresh_creative: "Creative nou",
  investigate_tracking: "Verifică tracking",
  wait: "Așteaptă date",
  none: "Nicio acțiune",
};

const classificationMeta: Record<Classification, { label: string; color: string }> = {
  winner: { label: "Performantă", color: "var(--brand-accent)" },
  underperformer: { label: "Neperformantă", color: "var(--brand-danger)" },
  watch: { label: "De urmărit", color: "var(--brand-warning)" },
  insufficient_data: { label: "Date insuficiente", color: "var(--text-muted)" },
};

export function AnalysisPanel({ days = 7 }: { days?: number }) {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    try {
      const res = await fetch("/api/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        toast.error(error ?? "Nu s-a putut rula analiza");
        return;
      }
      const { data } = await res.json();
      setResult(data);
    } catch {
      toast.error("Eroare la rularea analizei");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ background: "var(--gradient-card)", border: "1px solid var(--bg-border)", borderRadius: "var(--radius-lg)", padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Sparkles size={16} color="var(--brand-primary)" />
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>
            Analiză AI a campaniilor
          </h3>
        </div>
        <GlowButton variant="primary" size="sm" onClick={run} loading={loading}>
          {result ? "Reanalizează" : "Rulează analiza"}
        </GlowButton>
      </div>

      {!result && !loading && (
        <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
          Motorul evaluează fiecare campanie după obiectivul ei, cu praguri de siguranță (volum minim de date, frecvență, learning phase) și îți propune acțiuni explicate. Nu se execută nimic automat.
        </p>
      )}

      {result && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10, marginBottom: 18 }}>
            <SummaryTile icon={<AlertTriangle size={14} />} value={result.summary.underperformers} label="Neperformante" color="var(--brand-danger)" />
            <SummaryTile icon={<TrendingUp size={14} />} value={result.summary.winners} label="Performante" color="var(--brand-accent)" />
            <SummaryTile icon={<TrendingUp size={14} />} value={result.summary.opportunities} label="Oportunități" color="var(--brand-primary)" />
            <SummaryTile icon={<Clock size={14} />} value={result.summary.insufficientData} label="Date insuf." color="var(--text-muted)" />
          </div>

          {result.entities.length === 0 && (
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Nicio campanie de analizat în perioada selectată.</p>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {result.entities.map((e) => <EntityRow key={e.entityId} entity={e} />)}
          </div>
        </>
      )}
    </div>
  );
}

function SummaryTile({ icon, value, label, color }: { icon: React.ReactNode; value: number; label: string; color: string }) {
  return (
    <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--bg-border)", borderRadius: "var(--radius-md)", padding: "12px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, color, marginBottom: 4 }}>{icon}
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 20, fontWeight: 700 }}>{value}</span>
      </div>
      <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-secondary)" }}>{label}</p>
    </div>
  );
}

function EntityRow({ entity }: { entity: EntityAnalysis }) {
  const [open, setOpen] = useState(entity.findings.some((f) => f.severity === "critical"));
  const cls = classificationMeta[entity.classification];
  const topSeverity = entity.findings[0]?.severity ?? "info";

  return (
    <div style={{ background: "var(--bg-elevated)", border: `1px solid ${topSeverity === "critical" ? "rgba(239,68,68,0.4)" : "var(--bg-border)"}`, borderRadius: "var(--radius-md)", overflow: "hidden" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "12px 14px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            <span style={{ fontFamily: "var(--font-body)", fontSize: 13.5, fontWeight: 500, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {entity.entityName}
            </span>
            <span style={{ fontSize: 10.5, fontWeight: 600, color: cls.color, padding: "2px 8px", borderRadius: 999, background: "var(--bg-overlay)", flexShrink: 0 }}>
              {cls.label}
            </span>
          </div>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>
            {objectiveLabel(entity.objective)} · {Math.round(entity.kpi.spend).toLocaleString("ro-RO")} cheltuit · scor {entity.score}
          </span>
        </div>
        {open ? <ChevronUp size={15} color="var(--text-muted)" /> : <ChevronDown size={15} color="var(--text-muted)" />}
      </button>

      {open && (
        <div style={{ padding: "0 14px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
          {entity.findings.map((f, i) => (
            <div key={i} style={{ display: "flex", gap: 10, padding: "10px 12px", background: "var(--bg-surface)", borderRadius: "var(--radius-sm)", borderLeft: `3px solid ${severityColor[f.severity]}` }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 12.5, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>{f.title}</p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.5 }}>{f.reason}</p>
              </div>
              {f.recommendedAction !== "none" && (
                <span style={{ alignSelf: "flex-start", fontSize: 10.5, fontWeight: 600, color: severityColor[f.severity], padding: "3px 9px", borderRadius: 999, border: `1px solid ${severityColor[f.severity]}`, whiteSpace: "nowrap", flexShrink: 0 }}>
                  {actionLabel[f.recommendedAction]}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

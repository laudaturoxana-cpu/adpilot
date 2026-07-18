"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { GlowButton } from "@/components/adpilot/GlowButton";
import type { BusinessProfile } from "@/types";

interface Props {
  workspaceId: string;
  canEdit: boolean;
}

interface FormState {
  business_type: string;
  main_objective: string;
  products: string;
  country: string;
  currency: string;
  monthly_budget: string;
  target_cpa: string;
  min_roas: string;
  avg_order_value: string;
  brand_voice: string;
  forbidden_words: string;
  automation_level: string;
  regulated_industry: boolean;
}

const empty: FormState = {
  business_type: "", main_objective: "", products: "", country: "", currency: "",
  monthly_budget: "", target_cpa: "", min_roas: "", avg_order_value: "",
  brand_voice: "", forbidden_words: "", automation_level: "0", regulated_industry: false,
};

const automationLevels = [
  { value: "0", label: "L0 — Doar analiză" },
  { value: "1", label: "L1 — Analiză + recomandări" },
  { value: "2", label: "L2 — Creare drafturi" },
  { value: "3", label: "L3 — Auto pause reclame slabe" },
  { value: "4", label: "L4 — Auto buget (în limite)" },
  { value: "5", label: "L5 — Autopilot complet (în limite)" },
];

function toForm(p: BusinessProfile | null): FormState {
  if (!p) return empty;
  return {
    business_type: p.business_type ?? "",
    main_objective: p.main_objective ?? "",
    products: p.products ?? "",
    country: p.country ?? "",
    currency: p.currency ?? "",
    monthly_budget: p.monthly_budget?.toString() ?? "",
    target_cpa: p.target_cpa?.toString() ?? "",
    min_roas: p.min_roas?.toString() ?? "",
    avg_order_value: p.avg_order_value?.toString() ?? "",
    brand_voice: p.brand_voice ?? "",
    forbidden_words: (p.forbidden_words ?? []).join(", "),
    automation_level: (p.automation_level ?? 0).toString(),
    regulated_industry: p.regulated_industry ?? false,
  };
}

function numOrUndef(v: string): number | undefined {
  const n = parseFloat(v);
  return v.trim() === "" || Number.isNaN(n) ? undefined : n;
}

export function BusinessProfileSection({ workspaceId, canEdit }: Props) {
  const [form, setForm] = useState<FormState>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/workspaces/${workspaceId}/business-profile`);
        if (res.ok && active) {
          const { data } = await res.json();
          setForm(toForm(data));
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [workspaceId]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        business_type: form.business_type || undefined,
        main_objective: form.main_objective || undefined,
        products: form.products || undefined,
        country: form.country || undefined,
        currency: form.currency || undefined,
        monthly_budget: numOrUndef(form.monthly_budget),
        target_cpa: numOrUndef(form.target_cpa),
        min_roas: numOrUndef(form.min_roas),
        avg_order_value: numOrUndef(form.avg_order_value),
        brand_voice: form.brand_voice || undefined,
        forbidden_words: form.forbidden_words
          ? form.forbidden_words.split(",").map((s) => s.trim()).filter(Boolean)
          : undefined,
        automation_level: parseInt(form.automation_level, 10),
        regulated_industry: form.regulated_industry,
      };
      const res = await fetch(`/api/workspaces/${workspaceId}/business-profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const { error } = await res.json();
        toast.error(error ?? "Eroare la salvare");
        return;
      }
      toast.success("Setări business salvate");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Se încarcă...</p>;
  }

  return (
    <form onSubmit={save}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }} className="mobile-stack">
        <Field label="Tip business" value={form.business_type} onChange={(v) => set("business_type", v)} placeholder="Ecommerce / Lead gen / SaaS" disabled={!canEdit} />
        <Field label="Obiectiv principal" value={form.main_objective} onChange={(v) => set("main_objective", v)} placeholder="Vânzări / Lead-uri / Awareness" disabled={!canEdit} />
        <Field label="Țară" value={form.country} onChange={(v) => set("country", v)} placeholder="România" disabled={!canEdit} />
        <Field label="Monedă" value={form.currency} onChange={(v) => set("currency", v)} placeholder="RON" disabled={!canEdit} />
        <Field label="Buget lunar" value={form.monthly_budget} onChange={(v) => set("monthly_budget", v)} placeholder="10000" type="number" disabled={!canEdit} />
        <Field label="Cost max / rezultat (CPA)" value={form.target_cpa} onChange={(v) => set("target_cpa", v)} placeholder="50" type="number" disabled={!canEdit} />
        <Field label="ROAS minim" value={form.min_roas} onChange={(v) => set("min_roas", v)} placeholder="3" type="number" disabled={!canEdit} />
        <Field label="Valoare medie comandă" value={form.avg_order_value} onChange={(v) => set("avg_order_value", v)} placeholder="250" type="number" disabled={!canEdit} />
      </div>

      <Field label="Produse / servicii" value={form.products} onChange={(v) => set("products", v)} placeholder="Ce promovezi" disabled={!canEdit} />
      <div style={{ height: 16 }} />
      <Field label="Brand voice" value={form.brand_voice} onChange={(v) => set("brand_voice", v)} placeholder="Ton, stil, personalitate" disabled={!canEdit} />
      <div style={{ height: 16 }} />
      <Field label="Cuvinte interzise (separate prin virgulă)" value={form.forbidden_words} onChange={(v) => set("forbidden_words", v)} placeholder="garantat, cel mai ieftin" disabled={!canEdit} />

      <div style={{ height: 16 }} />
      <label style={labelStyle}>Nivel de automatizare</label>
      <select
        value={form.automation_level}
        onChange={(e) => set("automation_level", e.target.value)}
        disabled={!canEdit}
        style={selectStyle(!canEdit)}
      >
        {automationLevels.map((l) => (
          <option key={l.value} value={l.value}>{l.label}</option>
        ))}
      </select>

      <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16, color: "var(--text-secondary)", fontSize: 13, cursor: canEdit ? "pointer" : "not-allowed" }}>
        <input type="checkbox" checked={form.regulated_industry} disabled={!canEdit} onChange={(e) => set("regulated_industry", e.target.checked)} />
        Industrie reglementată (credit, sănătate, politică etc.)
      </label>

      {canEdit && (
        <div style={{ marginTop: 20 }}>
          <GlowButton variant="primary" size="md" type="submit" loading={saving}>Salvează setări business</GlowButton>
        </div>
      )}
      {!canEdit && (
        <p style={{ marginTop: 16, fontSize: 12, color: "var(--text-muted)" }}>
          Doar owner/admin pot edita aceste setări.
        </p>
      )}
    </form>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block", fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-secondary)", marginBottom: 6,
};

function selectStyle(disabled: boolean): React.CSSProperties {
  return {
    width: "100%", padding: "10px 14px",
    background: disabled ? "var(--bg-overlay)" : "var(--bg-elevated)",
    border: "1px solid var(--bg-border)", borderRadius: "var(--radius-md)",
    color: disabled ? "var(--text-muted)" : "var(--text-primary)",
    fontFamily: "var(--font-body)", fontSize: 14, outline: "none",
  };
}

function Field({ label, value, onChange, placeholder, type = "text", disabled = false }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string; disabled?: boolean;
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          width: "100%", padding: "10px 14px",
          background: disabled ? "var(--bg-overlay)" : "var(--bg-elevated)",
          border: "1px solid var(--bg-border)", borderRadius: "var(--radius-md)",
          color: disabled ? "var(--text-muted)" : "var(--text-primary)",
          fontFamily: "var(--font-body)", fontSize: 14, outline: "none",
        }}
      />
    </div>
  );
}

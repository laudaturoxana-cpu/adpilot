"use client";

import { useState } from "react";
import { GlowButton } from "@/components/adpilot/GlowButton";
import { Sparkles, Copy, Check, Heart } from "lucide-react";
import { toast } from "sonner";
import type { CopyVariant } from "@/types";

const objectiveOptions = ["Lead Generation", "Trafic", "Awareness", "Vânzări directe"];
const toneOptions = ["Profesionist", "Empatic", "Energic", "Relaxat", "Luxos", "Urgență"];

const approachColors: Record<number, string> = {
  0: "var(--brand-primary)",
  1: "var(--brand-accent)",
  2: "var(--brand-warning)",
  3: "#A78BFA",
  4: "#F472B6",
};

export default function CopyGeneratorPage() {
  const [form, setForm] = useState({
    product: "",
    audience: "",
    objective: "Lead Generation",
    tone: "Profesionist",
    variants: 3,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<CopyVariant[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.product.trim() || !form.audience.trim()) {
      toast.error("Completează produsul și audiența");
      return;
    }
    setIsLoading(true);
    setResults([]);
    try {
      const res = await fetch("/api/ai/copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const { error } = await res.json();
        toast.error(error);
        return;
      }
      const { data } = await res.json();
      setResults(data ?? []);
      toast.success(`${data?.length ?? 0} variante generate!`);
    } finally {
      setIsLoading(false);
    }
  }

  async function copyToClipboard(text: string, id: string) {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copiat în clipboard! ✓");
    setTimeout(() => setCopiedId(null), 2000);
  }

  function copyAll(variant: CopyVariant) {
    const text = `${variant.emoji_hook} ${variant.primary_text}\n\n${variant.headline}\n${variant.description}\n\nCTA: ${variant.cta}`;
    copyToClipboard(text, `all-${variant.approach}`);
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
          Copy Generator
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
          Generează variante de ad copy optimizate cu Claude AI în câteva secunde.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "min(400px, 100%) 1fr", gap: 20, alignItems: "start" }}
        className="mobile-stack"
      >
        {/* Form */}
        <div
          style={{
            background: "var(--gradient-card)",
            border: "1px solid var(--bg-border)",
            borderRadius: "var(--radius-lg)",
            padding: 24,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <Sparkles size={16} color="var(--brand-primary)" className="spin-slow" />
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>
              Generator Copy AI
            </h2>
          </div>
          <form onSubmit={handleSubmit}>
            <FormField label="Produs / Serviciu *">
              <textarea
                required
                value={form.product}
                onChange={(e) => setForm({ ...form, product: e.target.value })}
                rows={3}
                placeholder="ex: Servicii implant dentar Cluj-Napoca, de la 2500 RON"
                style={textareaStyle}
                onFocus={focusStyle}
                onBlur={blurStyle}
              />
            </FormField>
            <FormField label="Audiență țintă *">
              <textarea
                required
                value={form.audience}
                onChange={(e) => setForm({ ...form, audience: e.target.value })}
                rows={3}
                placeholder="ex: Femei 35-55 ani, Cluj, venituri medii-ridicate, interesate de sănătate"
                style={textareaStyle}
                onFocus={focusStyle}
                onBlur={blurStyle}
              />
            </FormField>
            <FormField label="Obiectiv campanie">
              <select
                value={form.objective}
                onChange={(e) => setForm({ ...form, objective: e.target.value })}
                style={selectStyle}
              >
                {objectiveOptions.map((o) => <option key={o}>{o}</option>)}
              </select>
            </FormField>
            <FormField label="Ton">
              <select
                value={form.tone}
                onChange={(e) => setForm({ ...form, tone: e.target.value })}
                style={selectStyle}
              >
                {toneOptions.map((t) => <option key={t}>{t}</option>)}
              </select>
            </FormField>
            <FormField label={`Număr variante: ${form.variants}`}>
              <input
                type="range"
                min={1}
                max={5}
                value={form.variants}
                onChange={(e) => setForm({ ...form, variants: parseInt(e.target.value) })}
                style={{
                  width: "100%",
                  accentColor: "var(--brand-primary)",
                  cursor: "pointer",
                  height: 4,
                }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <span key={n} style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>{n}</span>
                ))}
              </div>
            </FormField>
            <GlowButton
              variant="primary"
              size="md"
              type="submit"
              loading={isLoading}
              style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
            >
              {isLoading ? "Claude scrie..." : "Generează Copy →"}
            </GlowButton>
          </form>
        </div>

        {/* Results */}
        <div>
          {isLoading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {Array.from({ length: form.variants }).map((_, i) => (
                <div key={i} className="skeleton animate-in" style={{ height: 280, borderRadius: "var(--radius-lg)" }} />
              ))}
            </div>
          ) : results.length === 0 ? (
            <div
              style={{
                background: "var(--gradient-card)",
                border: "1px solid var(--bg-border)",
                borderRadius: "var(--radius-lg)",
                padding: 48,
                textAlign: "center",
                minHeight: 300,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>✍️</div>
              <p style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>
                Completează formularul
              </p>
              <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
                și generează copy în câteva secunde
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {results.map((variant, i) => (
                <div
                  key={i}
                  className="animate-in glow-border"
                  style={{
                    background: "var(--gradient-card)",
                    borderRadius: "var(--radius-lg)",
                    padding: 24,
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* Approach badge */}
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "3px 10px",
                      borderRadius: "var(--radius-full)",
                      background: `${approachColors[i]}18`,
                      border: `1px solid ${approachColors[i]}40`,
                      color: approachColors[i],
                      fontFamily: "var(--font-body)",
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      marginBottom: 16,
                    }}
                  >
                    {variant.emoji_hook} {variant.approach}
                  </span>

                  {/* Copy fields */}
                  <CopyField label="Primary Text" value={variant.primary_text} id={`pt-${i}`} copiedId={copiedId} onCopy={copyToClipboard} />
                  <CopyField label="Headline" value={variant.headline} id={`h-${i}`} copiedId={copiedId} onCopy={copyToClipboard} />
                  <CopyField label="Description" value={variant.description} id={`d-${i}`} copiedId={copiedId} onCopy={copyToClipboard} />

                  <div style={{ marginBottom: 12 }}>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      CTA:
                    </span>
                    <span
                      style={{
                        marginLeft: 8,
                        padding: "3px 10px",
                        background: "var(--brand-primary-glow)",
                        border: "1px solid rgba(14,165,233,0.3)",
                        borderRadius: "var(--radius-full)",
                        fontFamily: "var(--font-body)",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "var(--brand-primary)",
                      }}
                    >
                      {variant.cta}
                    </span>
                  </div>

                  {/* Rationale */}
                  <div
                    style={{
                      background: "rgba(14,165,233,0.04)",
                      border: "1px solid rgba(14,165,233,0.1)",
                      borderRadius: "var(--radius-md)",
                      padding: "12px 14px",
                      marginBottom: 16,
                    }}
                  >
                    <p style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 500, color: "var(--brand-primary)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      💡 De ce funcționează
                    </p>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                      {variant.rationale}
                    </p>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 8 }}>
                    <GlowButton variant="ghost" size="sm">
                      <Heart size={12} /> Salvează
                    </GlowButton>
                    <GlowButton variant="outline" size="sm" onClick={() => copyAll(variant)}>
                      <Copy size={12} /> Copiază tot
                    </GlowButton>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-secondary)", marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function CopyField({
  label,
  value,
  id,
  copiedId,
  onCopy,
}: {
  label: string;
  value: string;
  id: string;
  copiedId: string | null;
  onCopy: (text: string, id: string) => void;
}) {
  const isCopied = copiedId === id;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {label}
        </span>
        <button
          onClick={() => onCopy(value, id)}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: isCopied ? "var(--brand-accent)" : "var(--text-muted)",
            padding: 2,
            transition: "color 150ms",
          }}
        >
          {isCopied ? <Check size={12} /> : <Copy size={12} />}
        </button>
      </div>
      <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-primary)", lineHeight: 1.5 }}>
        {value}
      </p>
    </div>
  );
}

const inputBaseStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  background: "var(--bg-elevated)",
  border: "1px solid var(--bg-border)",
  borderRadius: "var(--radius-md)",
  color: "var(--text-primary)",
  fontFamily: "var(--font-body)",
  fontSize: 14,
  outline: "none",
  resize: "vertical" as const,
  transition: "border-color 150ms, box-shadow 150ms",
};

const textareaStyle: React.CSSProperties = { ...inputBaseStyle };
const selectStyle: React.CSSProperties = { ...inputBaseStyle, resize: undefined };

function focusStyle(e: React.FocusEvent<HTMLTextAreaElement | HTMLInputElement>) {
  (e.currentTarget as HTMLElement).style.borderColor = "var(--brand-primary)";
  (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-glow-blue)";
}
function blurStyle(e: React.FocusEvent<HTMLTextAreaElement | HTMLInputElement>) {
  (e.currentTarget as HTMLElement).style.borderColor = "var(--bg-border)";
  (e.currentTarget as HTMLElement).style.boxShadow = "none";
}

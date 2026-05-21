"use client";

import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/adpilot/StatusBadge";
import { GlowButton } from "@/components/adpilot/GlowButton";
import { toast } from "sonner";
import type { MetaCampaign } from "@/lib/meta/types";
import { Plus, RefreshCw, Pause, Play, Trash2, Search } from "lucide-react";

type FilterStatus = "all" | "ACTIVE" | "PAUSED" | "ARCHIVED";

const objectiveLabels: Record<string, string> = {
  OUTCOME_TRAFFIC: "Trafic",
  OUTCOME_LEADS: "Lead Gen",
  OUTCOME_AWARENESS: "Awareness",
  OUTCOME_SALES: "Vânzări",
  OUTCOME_ENGAGEMENT: "Engagement",
  OUTCOME_APP_PROMOTION: "App",
  LINK_CLICKS: "Trafic",
  LEAD_GENERATION: "Lead Gen",
  CONVERSIONS: "Vânzări",
  BRAND_AWARENESS: "Awareness",
  REACH: "Reach",
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<MetaCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [search, setSearch] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function fetchCampaigns() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/meta/campaigns");
      if (!res.ok) {
        const { error } = await res.json();
        toast.error(error ?? "Nu s-au putut încărca campaniile");
        return;
      }
      const { data } = await res.json();
      setCampaigns(data ?? []);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { fetchCampaigns(); }, []);

  const filtered = campaigns.filter((c) => {
    const matchesFilter = filter === "all" || c.status === filter;
    const matchesSearch = !search || c.name.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  async function toggleStatus(campaign: MetaCampaign) {
    const newStatus = campaign.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    setActionLoading(campaign.id);
    // Optimistic update
    setCampaigns((prev) => prev.map((c) => c.id === campaign.id ? { ...c, status: newStatus } : c));
    try {
      const res = await fetch(`/api/meta/campaigns/${campaign.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        toast.error(error);
        // Rollback
        setCampaigns((prev) => prev.map((c) => c.id === campaign.id ? campaign : c));
      } else {
        toast.success(`Campania ${newStatus === "ACTIVE" ? "activată" : "pauzată"}`);
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function deleteCampaign(campaign: MetaCampaign) {
    if (!confirm(`Ești sigur că vrei să ștergi campania "${campaign.name}"?`)) return;
    setActionLoading(campaign.id);
    try {
      const res = await fetch(`/api/meta/campaigns/${campaign.id}`, { method: "DELETE" });
      if (!res.ok) {
        const { error } = await res.json();
        toast.error(error);
      } else {
        setCampaigns((prev) => prev.filter((c) => c.id !== campaign.id));
        toast.success("Campanie ștearsă");
      }
    } finally {
      setActionLoading(null);
    }
  }

  const countActive = campaigns.filter((c) => c.status === "ACTIVE").length;
  const countPaused = campaigns.filter((c) => c.status === "PAUSED").length;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 700, color: "var(--text-primary)" }}>
            Campanii
          </h1>
          <span
            style={{
              padding: "3px 10px",
              background: "var(--brand-primary-glow)",
              border: "1px solid rgba(14,165,233,0.3)",
              borderRadius: "var(--radius-full)",
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              color: "var(--brand-primary)",
            }}
          >
            {campaigns.length}
          </span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <GlowButton variant="ghost" size="sm" onClick={fetchCampaigns}>
            <RefreshCw size={13} /> Refresh
          </GlowButton>
          <GlowButton variant="primary" size="sm" onClick={() => setShowNewModal(true)}>
            <Plus size={13} /> Campanie nouă
          </GlowButton>
        </div>
      </div>

      {/* Filters + Search */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 6 }}>
          {[
            { value: "all", label: `Toate (${campaigns.length})` },
            { value: "ACTIVE", label: `Active (${countActive})` },
            { value: "PAUSED", label: `Pauzate (${countPaused})` },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilter(value as FilterStatus)}
              style={{
                padding: "6px 14px",
                borderRadius: "var(--radius-full)",
                border: "1px solid",
                borderColor: filter === value ? "var(--brand-primary)" : "var(--bg-border)",
                background: filter === value ? "var(--brand-primary-glow)" : "transparent",
                color: filter === value ? "var(--brand-primary)" : "var(--text-secondary)",
                fontFamily: "var(--font-body)",
                fontSize: 13,
                cursor: "pointer",
                transition: "all 150ms",
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <div style={{ position: "relative", flex: 1, maxWidth: 260 }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Caută campanie..."
            style={{
              width: "100%",
              padding: "7px 12px 7px 32px",
              background: "var(--bg-elevated)",
              border: "1px solid var(--bg-border)",
              borderRadius: "var(--radius-md)",
              color: "var(--text-primary)",
              fontFamily: "var(--font-body)",
              fontSize: 13,
              outline: "none",
            }}
            onFocus={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = "var(--brand-primary)"; }}
            onBlur={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = "var(--bg-border)"; }}
          />
        </div>
      </div>

      {/* Table */}
      <div
        className="mobile-scroll-x"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--bg-border)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
        }}
      >
      <div style={{ minWidth: 640 }}>
        {/* Table header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 120px 120px 100px 80px 100px",
            padding: "12px 20px",
            background: "var(--bg-elevated)",
            borderBottom: "1px solid var(--bg-border)",
          }}
        >
          {["Campanie", "Status", "Obiectiv", "Budget/zi", "Spend", "Acțiuni"].map((col) => (
            <span
              key={col}
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 11,
                fontWeight: 500,
                color: "var(--text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              {col}
            </span>
          ))}
        </div>

        {/* Rows */}
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ padding: "16px 20px", borderBottom: "1px solid var(--bg-border)" }}>
              <div className="skeleton" style={{ height: 16, width: "60%", borderRadius: "var(--radius-sm)" }} />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div style={{ padding: "48px 20px", textAlign: "center", color: "var(--text-muted)" }}>
            {campaigns.length === 0 ? "Nicio campanie găsită. Conectează contul Meta pentru a vedea campaniile." : "Nicio campanie corespunde filtrelor selectate."}
          </div>
        ) : (
          filtered.map((campaign, i) => (
            <div
              key={campaign.id}
              className="animate-in"
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 120px 120px 100px 80px 100px",
                padding: "14px 20px",
                borderBottom: i < filtered.length - 1 ? "1px solid var(--bg-border)" : "none",
                alignItems: "center",
                transition: "background 150ms",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "var(--bg-overlay)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
            >
              <div>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 500, color: "var(--text-primary)", marginBottom: 2 }}>
                  {campaign.name}
                </p>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>
                  {campaign.id}
                </p>
              </div>
              <StatusBadge status={campaign.status} />
              <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-secondary)" }}>
                {objectiveLabels[campaign.objective] ?? campaign.objective ?? "—"}
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text-primary)" }}>
                {campaign.daily_budget
                  ? `${(parseInt(campaign.daily_budget) / 100).toFixed(0)} RON`
                  : "—"}
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text-secondary)" }}>
                —
              </span>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={() => toggleStatus(campaign)}
                  disabled={actionLoading === campaign.id}
                  title={campaign.status === "ACTIVE" ? "Pauzează" : "Activează"}
                  style={{
                    width: 30,
                    height: 30,
                    border: "1px solid var(--bg-border)",
                    borderRadius: "var(--radius-sm)",
                    background: "transparent",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 150ms",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--brand-primary)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--brand-primary)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--bg-border)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)"; }}
                >
                  {campaign.status === "ACTIVE" ? <Pause size={12} /> : <Play size={12} />}
                </button>
                <button
                  onClick={() => deleteCampaign(campaign)}
                  disabled={actionLoading === campaign.id}
                  title="Șterge"
                  style={{
                    width: 30,
                    height: 30,
                    border: "1px solid var(--bg-border)",
                    borderRadius: "var(--radius-sm)",
                    background: "transparent",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 150ms",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--brand-danger)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--brand-danger)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--bg-border)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)"; }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>{/* end minWidth wrapper */}
      </div>{/* end scroll wrapper */}

      {/* New Campaign Modal */}
      {showNewModal && <NewCampaignModal onClose={() => setShowNewModal(false)} onCreated={fetchCampaigns} />}
    </div>
  );
}

function NewCampaignModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: "", objective: "OUTCOME_TRAFFIC", daily_budget: "", status: "PAUSED" });
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("/api/meta/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          daily_budget: form.daily_budget ? String(parseFloat(form.daily_budget) * 100) : undefined,
        }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        toast.error(error);
      } else {
        toast.success("Campanie creată cu succes!");
        onCreated();
        onClose();
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--bg-border)",
          borderRadius: "var(--radius-xl)",
          padding: 32,
          width: "100%",
          maxWidth: 480,
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600, color: "var(--text-primary)", marginBottom: 24 }}>
          Campanie nouă
        </h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-secondary)", marginBottom: 6 }}>Nume campanie *</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              style={{ width: "100%", padding: "10px 14px", background: "var(--bg-surface)", border: "1px solid var(--bg-border)", borderRadius: "var(--radius-md)", color: "var(--text-primary)", fontFamily: "var(--font-body)", fontSize: 14, outline: "none" }}
              onFocus={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = "var(--brand-primary)"; (e.currentTarget as HTMLInputElement).style.boxShadow = "var(--shadow-glow-blue)"; }}
              onBlur={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = "var(--bg-border)"; (e.currentTarget as HTMLInputElement).style.boxShadow = "none"; }}
              placeholder="ex: Campanie Lead Gen - Ianuarie 2026"
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-secondary)", marginBottom: 6 }}>Obiectiv *</label>
            <select
              value={form.objective}
              onChange={(e) => setForm({ ...form, objective: e.target.value })}
              style={{ width: "100%", padding: "10px 14px", background: "var(--bg-surface)", border: "1px solid var(--bg-border)", borderRadius: "var(--radius-md)", color: "var(--text-primary)", fontFamily: "var(--font-body)", fontSize: 14, outline: "none" }}
            >
              <option value="OUTCOME_TRAFFIC">Trafic</option>
              <option value="OUTCOME_LEADS">Lead Generation</option>
              <option value="OUTCOME_AWARENESS">Awareness</option>
              <option value="OUTCOME_SALES">Vânzări</option>
              <option value="OUTCOME_ENGAGEMENT">Engagement</option>
            </select>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-secondary)", marginBottom: 6 }}>Budget zilnic (RON)</label>
            <input
              type="number"
              step="0.01"
              min="1"
              value={form.daily_budget}
              onChange={(e) => setForm({ ...form, daily_budget: e.target.value })}
              style={{ width: "100%", padding: "10px 14px", background: "var(--bg-surface)", border: "1px solid var(--bg-border)", borderRadius: "var(--radius-md)", color: "var(--text-primary)", fontFamily: "var(--font-body)", fontSize: 14, outline: "none" }}
              onFocus={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = "var(--brand-primary)"; }}
              onBlur={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = "var(--bg-border)"; }}
              placeholder="ex: 50.00"
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-secondary)", marginBottom: 6 }}>Status inițial</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              style={{ width: "100%", padding: "10px 14px", background: "var(--bg-surface)", border: "1px solid var(--bg-border)", borderRadius: "var(--radius-md)", color: "var(--text-primary)", fontFamily: "var(--font-body)", fontSize: 14, outline: "none" }}
            >
              <option value="PAUSED">Pauzat</option>
              <option value="ACTIVE">Activ</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <GlowButton variant="ghost" size="md" onClick={onClose} type="button">Anulează</GlowButton>
            <GlowButton variant="primary" size="md" loading={isLoading} type="submit">Creează campanie</GlowButton>
          </div>
        </form>
      </div>
    </div>
  );
}

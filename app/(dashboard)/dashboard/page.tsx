"use client";

import { useEffect, useState, useCallback } from "react";
import { MetricCard } from "@/components/adpilot/MetricCard";
import { AIPanel } from "@/components/adpilot/AIPanel";
import { AnalysisPanel } from "@/components/adpilot/AnalysisPanel";
import { StatusBadge } from "@/components/adpilot/StatusBadge";
import { GlowButton } from "@/components/adpilot/GlowButton";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";
import type { MetaInsight } from "@/lib/meta/types";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Link from "next/link";

const periodOptions = [
  { label: "Azi", days: 1 },
  { label: "7 zile", days: 7 },
  { label: "30 zile", days: 30 },
];

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [period, setPeriod] = useState(7);
  const [insights, setInsights] = useState<MetaInsight[]>([]);
  const [isLoadingInsights, setIsLoadingInsights] = useState(true);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [analysisText, setAnalysisText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasMetaConnection, setHasMetaConnection] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setProfile(profileData);

      try {
        const res = await fetch("/api/meta/connection");
        if (res.ok) {
          const { data } = await res.json();
          setHasMetaConnection(!!(data?.connected && data?.selected_ad_account_id));
        }
      } catch {
        // non-critic
      }

      const { data: lastAnalysis } = await supabase
        .from("ai_analyses")
        .select("analysis_text")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (lastAnalysis) setAnalysisText(lastAnalysis.analysis_text);
    }
    init();
  }, []);

  const fetchInsights = useCallback(async (days: number) => {
    setIsLoadingInsights(true);
    try {
      const res = await fetch(`/api/meta/insights?days=${days}`);
      if (res.ok) {
        const { data } = await res.json();
        setInsights(data ?? []);
      }
    } finally {
      setIsLoadingInsights(false);
    }
  }, []);

  useEffect(() => {
    if (hasMetaConnection) fetchInsights(period);
    else setIsLoadingInsights(false);
  }, [period, hasMetaConnection, fetchInsights]);

  async function handleGenerateAnalysis() {
    if (!insights.length) return;
    setIsLoadingAnalysis(true);
    setIsStreaming(true);
    setAnalysisText("");

    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ insights, clientName: profile?.agency_name ?? profile?.full_name, period }),
      });

      if (!res.ok || !res.body) throw new Error("Eroare la generare");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setAnalysisText(text);
      }
    } finally {
      setIsLoadingAnalysis(false);
      setIsStreaming(false);
    }
  }

  // Calculate metrics from insights
  const totalReach = insights.reduce((s, i) => s + parseInt(i.reach || "0"), 0);
  const totalSpend = insights.reduce((s, i) => s + parseFloat(i.spend || "0"), 0);
  const avgCtr = insights.length
    ? insights.reduce((s, i) => s + parseFloat(i.ctr || "0"), 0) / insights.length
    : 0;

  // Chart data - simulated from insights
  const chartData = insights.slice(0, 7).map((insight, i) => ({
    date: insight.date_start?.slice(5) ?? `Zi ${i + 1}`,
    spend: parseFloat(insight.spend || "0"),
    reach: parseInt(insight.reach || "0") / 1000,
    clicks: parseInt(insight.clicks || "0"),
  }));

  const firstName = profile?.full_name?.split(" ")[0] ?? profile?.email?.split("@")[0] ?? "utilizator";

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(20px, 5vw, 26px)",
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: 4,
            }}
          >
            Bună, {firstName} 👋
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            Iată ce se întâmplă cu campaniile tale {period === 1 ? "astăzi" : `în ultimele ${period} zile`}.
          </p>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {periodOptions.map(({ label, days }) => (
            <button
              key={days}
              onClick={() => setPeriod(days)}
              style={{
                padding: "6px 14px",
                borderRadius: "var(--radius-full)",
                border: "1px solid",
                borderColor: period === days ? "var(--brand-primary)" : "var(--bg-border)",
                background: period === days ? "var(--brand-primary-glow)" : "transparent",
                color: period === days ? "var(--brand-primary)" : "var(--text-secondary)",
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
      </div>

      {/* No Meta connection banner */}
      {!hasMetaConnection && (
        <div
          style={{
            background: "rgba(245,158,11,0.08)",
            border: "1px solid rgba(245,158,11,0.3)",
            borderRadius: "var(--radius-lg)",
            padding: "16px 20px",
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <p style={{ color: "var(--brand-warning)", fontSize: 14 }}>
            ⚠️ Contul Meta Ads nu este conectat. Conectează-l pentru a vedea datele reale.
          </p>
          <Link href="/settings">
            <GlowButton variant="outline" size="sm">Conectează Meta →</GlowButton>
          </Link>
        </div>
      )}

      {/* Metrics Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 12,
          marginBottom: 24,
        }}
      >
        {isLoadingInsights ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 130, borderRadius: "var(--radius-lg)" }} />
          ))
        ) : (
          <>
            <MetricCard label="Reach Total" value={totalReach} suffix="" trend={12} color="primary" />
            <MetricCard label="Cheltuieli" value={totalSpend.toFixed(0)} prefix="" suffix=" RON" trend={0} color="accent" />
            <MetricCard label="CTR Mediu" value={`${avgCtr.toFixed(2)}%`} trend={-0.3} color="warning" animate={false} />
            <MetricCard label="Campanii active" value={insights.length} trend={undefined} color="accent" />
          </>
        )}
      </div>

      {/* Structured deterministic analysis */}
      {hasMetaConnection && (
        <div style={{ marginBottom: 28 }}>
          <AnalysisPanel days={period} />
        </div>
      )}

      {/* AI Analysis (narrative) */}
      <div style={{ marginBottom: 28 }}>
        <AIPanel
          title="Analiză AI"
          content={analysisText && !isStreaming ? analysisText : undefined}
          isLoading={isLoadingAnalysis && !isStreaming}
          isStreaming={isStreaming}
          streamingText={analysisText}
          onGenerate={hasMetaConnection && insights.length > 0 ? handleGenerateAnalysis : undefined}
          generateLabel={isLoadingAnalysis ? "Se generează..." : "Generează analiză"}
        />
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div
          style={{
            background: "var(--gradient-card)",
            border: "1px solid var(--bg-border)",
            borderRadius: "var(--radius-lg)",
            padding: 24,
            marginBottom: 28,
          }}
        >
          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 15,
              fontWeight: 600,
              color: "var(--text-primary)",
              marginBottom: 20,
            }}
          >
            Evoluție Performanță
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid stroke="#1E3A5F" strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fill: "#94A3B8", fontSize: 11, fontFamily: "JetBrains Mono" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#94A3B8", fontSize: 11, fontFamily: "JetBrains Mono" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#162038",
                  border: "1px solid #1E3A5F",
                  borderRadius: "10px",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
                  fontFamily: "Inter",
                }}
                labelStyle={{ color: "#F0F9FF" }}
                itemStyle={{ color: "#94A3B8" }}
              />
              <Line
                type="monotone"
                dataKey="spend"
                name="Spend (RON)"
                stroke="#0EA5E9"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="reach"
                name="Reach (mii)"
                stroke="#6EE7B7"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top Campaigns */}
      {insights.length > 0 && (
        <div
          style={{
            background: "var(--gradient-card)",
            border: "1px solid var(--bg-border)",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid var(--bg-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <h3
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 15,
                fontWeight: 600,
                color: "var(--text-primary)",
              }}
            >
              Top Campanii
            </h3>
            <Link href="/campaigns">
              <GlowButton variant="ghost" size="sm">Vezi toate →</GlowButton>
            </Link>
          </div>
          <div>
            {insights.slice(0, 5).map((insight, i) => (
              <div
                key={insight.campaign_id ?? i}
                className="animate-in"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 20px",
                  borderBottom: i < 4 ? "1px solid var(--bg-border)" : "none",
                  transition: "background 150ms",
                  gap: 12,
                  flexWrap: "wrap",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "var(--bg-overlay)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
              >
                <div style={{ flex: 1, minWidth: 140 }}>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 500, color: "var(--text-primary)", marginBottom: 2 }}>
                    {insight.campaign_name}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text-primary)" }}>
                      {parseFloat(insight.spend || "0").toFixed(0)} RON
                    </p>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-muted)" }}>Spend</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--brand-accent)" }}>
                      {parseFloat(insight.ctr || "0").toFixed(2)}%
                    </p>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-muted)" }}>CTR</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text-secondary)" }}>
                      {parseInt(insight.reach || "0").toLocaleString("ro-RO")}
                    </p>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-muted)" }}>Reach</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

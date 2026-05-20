"use client";

import { useEffect, useState } from "react";
import { MetricCard } from "@/components/adpilot/MetricCard";
import { GlowButton } from "@/components/adpilot/GlowButton";
import type { MetaInsight } from "@/lib/meta/types";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function ReportsPage() {
  const [insights, setInsights] = useState<MetaInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    async function fetch() {
      setIsLoading(true);
      try {
        const res = await window.fetch(`/api/meta/insights?days=${period}`);
        if (res.ok) {
          const { data } = await res.json();
          setInsights(data ?? []);
        }
      } finally {
        setIsLoading(false);
      }
    }
    fetch();
  }, [period]);

  const totalSpend = insights.reduce((s, i) => s + parseFloat(i.spend || "0"), 0);
  const totalReach = insights.reduce((s, i) => s + parseInt(i.reach || "0"), 0);
  const totalClicks = insights.reduce((s, i) => s + parseInt(i.clicks || "0"), 0);
  const totalImpressions = insights.reduce((s, i) => s + parseInt(i.impressions || "0"), 0);
  const avgCtr = insights.length ? insights.reduce((s, i) => s + parseFloat(i.ctr || "0"), 0) / insights.length : 0;

  const chartData = insights.map((i) => ({
    name: i.campaign_name?.slice(0, 20) ?? "—",
    spend: parseFloat(i.spend || "0"),
    clicks: parseInt(i.clicks || "0"),
    reach: Math.round(parseInt(i.reach || "0") / 1000),
  }));

  return (
    <div>
      <div style={{ marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
            Rapoarte Performanță
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            Analizează performanța campaniilor pe perioade de timp.
          </p>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              onClick={() => setPeriod(d)}
              style={{
                padding: "6px 14px",
                borderRadius: "var(--radius-full)",
                border: "1px solid",
                borderColor: period === d ? "var(--brand-primary)" : "var(--bg-border)",
                background: period === d ? "var(--brand-primary-glow)" : "transparent",
                color: period === d ? "var(--brand-primary)" : "var(--text-secondary)",
                fontFamily: "var(--font-body)",
                fontSize: 13,
                cursor: "pointer",
                transition: "all 150ms",
              }}
            >
              {d} zile
            </button>
          ))}
        </div>
      </div>

      {/* Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 28 }}>
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 120, borderRadius: "var(--radius-lg)" }} />
          ))
        ) : (
          <>
            <MetricCard label="Total Cheltuieli" value={totalSpend.toFixed(0)} suffix=" RON" color="primary" />
            <MetricCard label="Total Reach" value={totalReach} color="accent" />
            <MetricCard label="Total Clicks" value={totalClicks} color="primary" />
            <MetricCard label="Impresii" value={totalImpressions} color="accent" />
            <MetricCard label="CTR Mediu" value={`${avgCtr.toFixed(2)}%`} animate={false} color="warning" />
          </>
        )}
      </div>

      {/* Spend by campaign */}
      {chartData.length > 0 && (
        <div
          style={{
            background: "var(--gradient-card)",
            border: "1px solid var(--bg-border)",
            borderRadius: "var(--radius-lg)",
            padding: 24,
            marginBottom: 24,
          }}
        >
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 20 }}>
            Cheltuieli per Campanie
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 60 }}>
              <CartesianGrid stroke="#1E3A5F" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: "#94A3B8", fontSize: 11, fontFamily: "JetBrains Mono" }}
                axisLine={false}
                tickLine={false}
                angle={-30}
                textAnchor="end"
              />
              <YAxis tick={{ fill: "#94A3B8", fontSize: 11, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "#162038", border: "1px solid #1E3A5F", borderRadius: "10px", boxShadow: "0 8px 32px rgba(0,0,0,0.6)", fontFamily: "Inter" }}
                labelStyle={{ color: "#F0F9FF" }}
                itemStyle={{ color: "#94A3B8" }}
              />
              <Bar dataKey="spend" name="Spend (RON)" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Reach by campaign */}
      {chartData.length > 0 && (
        <div
          style={{
            background: "var(--gradient-card)",
            border: "1px solid var(--bg-border)",
            borderRadius: "var(--radius-lg)",
            padding: 24,
          }}
        >
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 20 }}>
            Reach per Campanie (mii)
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 60 }}>
              <CartesianGrid stroke="#1E3A5F" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: "#94A3B8", fontSize: 11, fontFamily: "JetBrains Mono" }}
                axisLine={false}
                tickLine={false}
                angle={-30}
                textAnchor="end"
              />
              <YAxis tick={{ fill: "#94A3B8", fontSize: 11, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "#162038", border: "1px solid #1E3A5F", borderRadius: "10px", boxShadow: "0 8px 32px rgba(0,0,0,0.6)", fontFamily: "Inter" }}
                labelStyle={{ color: "#F0F9FF" }}
                itemStyle={{ color: "#94A3B8" }}
              />
              <Bar dataKey="reach" name="Reach (mii)" fill="#6EE7B7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {!isLoading && insights.length === 0 && (
        <div
          style={{
            background: "var(--gradient-card)",
            border: "1px solid var(--bg-border)",
            borderRadius: "var(--radius-lg)",
            padding: 48,
            textAlign: "center",
            color: "var(--text-muted)",
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.4 }}>📊</div>
          <p style={{ fontFamily: "var(--font-display)", fontSize: 16, marginBottom: 8 }}>
            Nicio dată disponibilă
          </p>
          <p style={{ fontSize: 14 }}>
            Conectează contul Meta Ads pentru a vedea rapoartele.
          </p>
        </div>
      )}
    </div>
  );
}

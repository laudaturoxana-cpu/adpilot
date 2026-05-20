"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: number | string;
  prefix?: string;
  suffix?: string;
  trend?: number;
  trendLabel?: string;
  color?: "primary" | "accent" | "warning" | "danger";
  animate?: boolean;
}

export function MetricCard({
  label,
  value,
  prefix = "",
  suffix = "",
  trend,
  trendLabel,
  color = "primary",
  animate = true,
}: MetricCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const numericValue = typeof value === "number" ? value : parseFloat(String(value).replace(/[^0-9.]/g, ""));

  useEffect(() => {
    if (!animate || isNaN(numericValue)) return;
    const start = 0;
    const end = numericValue;
    const duration = 1000;
    const startTime = performance.now();
    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [numericValue, animate]);

  const colorMap = {
    primary: "var(--brand-primary)",
    accent: "var(--brand-accent)",
    warning: "var(--brand-warning)",
    danger: "var(--brand-danger)",
  };

  const valueColor = colorMap[color];

  const trendPositive = trend !== undefined && trend > 0;
  const trendNegative = trend !== undefined && trend < 0;
  const trendNeutral = trend !== undefined && trend === 0;

  const formatDisplayValue = () => {
    if (typeof value === "string" && value.includes(".")) {
      return isNaN(numericValue) ? value : displayValue.toLocaleString("ro-RO");
    }
    if (typeof value === "number" && value % 1 !== 0) {
      return value.toFixed(2);
    }
    return displayValue.toLocaleString("ro-RO");
  };

  return (
    <div
      className="animate-in"
      style={{
        background: "var(--gradient-card)",
        border: "1px solid var(--bg-border)",
        borderRadius: "var(--radius-lg)",
        padding: "24px",
        transition: "border-color 200ms, box-shadow 200ms",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "var(--bg-border-bright)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-glow-blue)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "var(--bg-border)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
      }}
    >
      {/* Subtle glow accent in corner */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 80,
          height: 80,
          background: `radial-gradient(circle, ${valueColor}10 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 12,
          fontWeight: 500,
          color: "var(--text-secondary)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: 12,
        }}
      >
        {label}
      </p>
      <p
        className="metric-value"
        style={{
          fontSize: 36,
          fontWeight: 700,
          color: valueColor,
          lineHeight: 1,
          marginBottom: 12,
        }}
      >
        {prefix}{typeof value === "string" && isNaN(numericValue) ? value : formatDisplayValue()}{suffix}
      </p>
      {trend !== undefined && (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {trendPositive && <TrendingUp size={14} color="var(--brand-accent)" />}
          {trendNegative && <TrendingDown size={14} color="var(--brand-danger)" />}
          {trendNeutral && <Minus size={14} color="var(--text-muted)" />}
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              color: trendPositive
                ? "var(--brand-accent)"
                : trendNegative
                ? "var(--brand-danger)"
                : "var(--text-muted)",
            }}
          >
            {trendPositive ? "+" : ""}{trend}%
            {trendLabel && (
              <span style={{ color: "var(--text-muted)", marginLeft: 4 }}>{trendLabel}</span>
            )}
          </span>
        </div>
      )}
    </div>
  );
}

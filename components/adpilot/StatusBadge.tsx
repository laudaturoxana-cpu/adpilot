"use client";

type CampaignStatus = "ACTIVE" | "PAUSED" | "DELETED" | "ARCHIVED" | "WITH_ISSUES";

interface StatusBadgeProps {
  status: CampaignStatus | string;
}

const statusConfig: Record<string, { bg: string; color: string; label: string; pulse: boolean }> = {
  ACTIVE: {
    bg: "rgba(110, 231, 183, 0.1)",
    color: "var(--brand-accent)",
    label: "Activ",
    pulse: true,
  },
  PAUSED: {
    bg: "rgba(245, 158, 11, 0.1)",
    color: "var(--brand-warning)",
    label: "Pauzat",
    pulse: false,
  },
  DELETED: {
    bg: "rgba(239, 68, 68, 0.1)",
    color: "var(--brand-danger)",
    label: "Șters",
    pulse: false,
  },
  ARCHIVED: {
    bg: "rgba(100, 116, 139, 0.1)",
    color: "var(--text-muted)",
    label: "Arhivat",
    pulse: false,
  },
  WITH_ISSUES: {
    bg: "rgba(239, 68, 68, 0.1)",
    color: "var(--brand-danger)",
    label: "Probleme",
    pulse: false,
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] ?? {
    bg: "rgba(100, 116, 139, 0.1)",
    color: "var(--text-muted)",
    label: status,
    pulse: false,
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 10px",
        borderRadius: "var(--radius-full)",
        background: config.bg,
        color: config.color,
        fontFamily: "var(--font-body)",
        fontSize: 11,
        fontWeight: 500,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: config.color,
          flexShrink: 0,
          animation: config.pulse ? "pulse-dot 2s ease-in-out infinite" : "none",
        }}
      />
      {config.label}
    </span>
  );
}

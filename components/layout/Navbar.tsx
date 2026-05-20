"use client";

import { Bell, RefreshCw } from "lucide-react";
import { usePathname } from "next/navigation";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/campaigns": "Campanii",
  "/reports": "Rapoarte",
  "/copy-generator": "Copy Generator",
  "/settings": "Setări",
};

export function Navbar() {
  const pathname = usePathname();
  const title = Object.entries(pageTitles).find(([key]) => pathname === key || pathname.startsWith(key + "/"))?.[1] ?? "AdPilot";

  return (
    <header
      style={{
        height: 64,
        background: "rgba(15,22,41,0.8)",
        borderBottom: "1px solid var(--bg-border)",
        backdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 28px",
        position: "sticky",
        top: 0,
        zIndex: 40,
      }}
    >
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 18,
          fontWeight: 600,
          color: "var(--text-primary)",
        }}
      >
        {title}
      </h1>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          style={{
            width: 36,
            height: 36,
            borderRadius: "var(--radius-md)",
            background: "transparent",
            border: "1px solid var(--bg-border)",
            color: "var(--text-secondary)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 150ms",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--brand-primary)";
            (e.currentTarget as HTMLButtonElement).style.color = "var(--brand-primary)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--bg-border)";
            (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
          }}
          title="Refresh date"
        >
          <RefreshCw size={14} />
        </button>
        <button
          style={{
            width: 36,
            height: 36,
            borderRadius: "var(--radius-md)",
            background: "transparent",
            border: "1px solid var(--bg-border)",
            color: "var(--text-secondary)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 150ms",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--brand-primary)";
            (e.currentTarget as HTMLButtonElement).style.color = "var(--brand-primary)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--bg-border)";
            (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
          }}
          title="Notificări"
        >
          <Bell size={14} />
        </button>
      </div>
    </header>
  );
}

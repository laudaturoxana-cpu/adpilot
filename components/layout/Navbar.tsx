"use client";

import { Bell, RefreshCw, Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { WorkspaceSwitcher } from "@/components/layout/WorkspaceSwitcher";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/campaigns": "Campanii",
  "/reports": "Rapoarte",
  "/copy-generator": "Copy Generator",
  "/settings": "Setări",
};

interface NavbarProps {
  onMenuToggle: () => void;
}

export function Navbar({ onMenuToggle }: NavbarProps) {
  const pathname = usePathname();
  const title = Object.entries(pageTitles).find(
    ([key]) => pathname === key || pathname.startsWith(key + "/")
  )?.[1] ?? "AdPilot";

  const iconBtnStyle: React.CSSProperties = {
    width: 40,
    height: 40,
    borderRadius: "var(--radius-md)",
    background: "transparent",
    border: "1px solid var(--bg-border)",
    color: "var(--text-secondary)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 150ms",
    flexShrink: 0,
  };

  return (
    <header
      style={{
        height: 60,
        background: "rgba(15,22,41,0.9)",
        borderBottom: "1px solid var(--bg-border)",
        backdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        position: "sticky",
        top: 0,
        zIndex: 40,
        gap: 12,
      }}
    >
      {/* Hamburger - vizibil doar pe mobile */}
      <button
        className="show-mobile"
        onClick={onMenuToggle}
        style={{
          ...iconBtnStyle,
          display: "none", // CSS class îl afișează
        }}
        aria-label="Deschide meniu"
      >
        <Menu size={18} />
      </button>

      <h1
        className="hide-mobile"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 17,
          fontWeight: 600,
          color: "var(--text-primary)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {title}
      </h1>

      <div style={{ flex: 1 }} />

      <WorkspaceSwitcher />

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          style={iconBtnStyle}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--brand-primary)";
            (e.currentTarget as HTMLButtonElement).style.color = "var(--brand-primary)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--bg-border)";
            (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
          }}
          title="Refresh"
        >
          <RefreshCw size={14} />
        </button>
        <button
          style={iconBtnStyle}
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

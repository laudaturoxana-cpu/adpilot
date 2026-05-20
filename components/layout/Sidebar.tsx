"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogoFull } from "@/components/brand/Logo";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  Megaphone,
  BarChart3,
  PenTool,
  Settings,
  LogOut,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { Profile } from "@/types";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/campaigns", icon: Megaphone, label: "Campanii" },
  { href: "/reports", icon: BarChart3, label: "Rapoarte" },
  { href: "/copy-generator", icon: PenTool, label: "Copy Generator" },
  { href: "/settings", icon: Settings, label: "Setări" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setProfile(data);
    }
    loadProfile();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside
      style={{
        width: 240,
        minHeight: "100vh",
        background: "var(--bg-surface)",
        borderRight: "1px solid var(--bg-border)",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        padding: "24px 0",
      }}
    >
      {/* Logo */}
      <div style={{ padding: "0 20px 24px" }}>
        <Link href="/dashboard">
          <LogoFull size="md" />
        </Link>
      </div>

      {/* Separator */}
      <div style={{ height: 1, background: "var(--bg-border)", margin: "0 20px 20px" }} />

      {/* Nav */}
      <nav style={{ flex: 1, padding: "0 12px" }}>
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                borderRadius: "var(--radius-md)",
                marginBottom: 2,
                color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                background: isActive ? "var(--bg-overlay)" : "transparent",
                borderLeft: isActive ? "3px solid var(--brand-primary)" : "3px solid transparent",
                fontFamily: "var(--font-body)",
                fontSize: 14,
                fontWeight: isActive ? 500 : 400,
                textDecoration: "none",
                transition: "all 150ms ease",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLAnchorElement).style.background = "var(--bg-overlay)";
                  (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-primary)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                  (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-secondary)";
                }
              }}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Separator */}
      <div style={{ height: 1, background: "var(--bg-border)", margin: "0 20px 16px" }} />

      {/* User info */}
      <div style={{ padding: "0 16px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 12px",
            borderRadius: "var(--radius-md)",
            background: "var(--bg-elevated)",
            marginBottom: 8,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "var(--brand-primary-glow)",
              border: "1px solid var(--brand-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <User size={14} color="var(--brand-primary)" />
          </div>
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 13,
                fontWeight: 500,
                color: "var(--text-primary)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {profile?.full_name ?? profile?.email?.split("@")[0] ?? "Utilizator"}
            </p>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 11,
                color: "var(--text-secondary)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {profile?.agency_name ?? "AdPilot"}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 12px",
            borderRadius: "var(--radius-md)",
            background: "transparent",
            border: "none",
            color: "var(--text-muted)",
            fontFamily: "var(--font-body)",
            fontSize: 13,
            cursor: "pointer",
            transition: "all 150ms",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "var(--brand-danger)";
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.06)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)";
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
          }}
        >
          <LogOut size={14} />
          Deconectare
        </button>
      </div>
    </aside>
  );
}

"use client";

import { useEffect, useState, Suspense } from "react";
import { GlowButton } from "@/components/adpilot/GlowButton";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useSearchParams, useRouter } from "next/navigation";
import type { Profile } from "@/types";
import { CheckCircle, AlertCircle, Link as LinkIcon, Unlink } from "lucide-react";

interface MetaConnection {
  id: string;
  meta_user_name?: string;
  selected_ad_account_id?: string;
  selected_ad_account_name?: string;
  is_active: boolean;
  token_expires_at?: string;
}

interface AdAccount {
  id: string;
  name: string;
  currency: string;
  account_status: number;
  amount_spent: string;
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div style={{ color: "var(--text-muted)", padding: 32 }}>Se încarcă...</div>}>
      <SettingsContent />
    </Suspense>
  );
}

function SettingsContent() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [metaConnection, setMetaConnection] = useState<MetaConnection | null>(null);
  const [adAccounts, setAdAccounts] = useState<AdAccount[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    if (success === "meta_connected") {
      toast.success("Meta Ads conectat cu succes!");
      router.replace("/settings");
    }
    if (error === "meta_denied") toast.error("Ai refuzat conectarea Meta Ads.");
    if (error === "invalid_state") toast.error("Eroare de securitate. Încearcă din nou.");
    if (error === "token_exchange_failed") toast.error("Nu s-a putut obține token-ul Meta. Încearcă din nou.");
  }, [searchParams]);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setProfile(profileData);
      const { data: conn } = await supabase.from("meta_connections").select("*").eq("user_id", user.id).single();
      setMetaConnection(conn);
    }
    load();
  }, []);

  async function handleConnectMeta() {
    window.location.href = "/api/auth/meta";
  }

  async function handleDisconnectMeta() {
    if (!confirm("Ești sigur că vrei să deconectezi Meta Ads?")) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("meta_connections").update({ is_active: false }).eq("user_id", user.id);
    setMetaConnection(null);
    toast.success("Meta Ads deconectat");
  }

  async function loadAdAccounts() {
    setIsLoadingAccounts(true);
    try {
      const res = await fetch("/api/meta/adaccounts");
      if (!res.ok) {
        const { error } = await res.json();
        toast.error(error);
        return;
      }
      const { data } = await res.json();
      setAdAccounts(data ?? []);
    } finally {
      setIsLoadingAccounts(false);
    }
  }

  async function selectAdAccount(account: AdAccount) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("meta_connections").update({
      selected_ad_account_id: account.id,
      selected_ad_account_name: account.name,
    }).eq("user_id", user.id);
    setMetaConnection((prev) => prev ? {
      ...prev,
      selected_ad_account_id: account.id,
      selected_ad_account_name: account.name,
    } : null);
    toast.success(`Cont selectat: ${account.name}`);
    setAdAccounts([]);
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setIsSavingProfile(true);
    const { error } = await supabase.from("profiles").update({
      full_name: profile.full_name,
      agency_name: profile.agency_name,
    }).eq("id", profile.id);
    if (error) {
      toast.error("Eroare la salvare");
    } else {
      toast.success("Profil actualizat!");
    }
    setIsSavingProfile(false);
  }

  return (
    <div style={{ maxWidth: 640, width: "100%" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(20px, 5vw, 24px)", fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
          Setări
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Gestionează profilul și conexiunile tale.</p>
      </div>

      {/* Profile */}
      <Section title="Profil">
        <form onSubmit={handleSaveProfile}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <SettingsInput
              label="Nume complet"
              value={profile?.full_name ?? ""}
              onChange={(v) => setProfile((p) => p ? { ...p, full_name: v } : null)}
              placeholder="Roxana Laudatu"
            />
            <SettingsInput
              label="Agenție"
              value={profile?.agency_name ?? ""}
              onChange={(v) => setProfile((p) => p ? { ...p, agency_name: v } : null)}
              placeholder="DoMarketing.ro"
            />
          </div>
          <SettingsInput
            label="Email"
            value={profile?.email ?? ""}
            onChange={() => {}}
            disabled
            placeholder=""
          />
          <div style={{ marginTop: 16 }}>
            <GlowButton variant="primary" size="md" type="submit" loading={isSavingProfile}>
              Salvează profil
            </GlowButton>
          </div>
        </form>
      </Section>

      {/* Meta Connection */}
      <Section title="Conexiune Meta Ads">
        {metaConnection?.is_active ? (
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "16px 20px",
                background: "rgba(110,231,183,0.06)",
                border: "1px solid rgba(110,231,183,0.2)",
                borderRadius: "var(--radius-md)",
                marginBottom: 16,
              }}
            >
              <CheckCircle size={18} color="var(--brand-accent)" />
              <div>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>
                  Conectat ca: {metaConnection.meta_user_name ?? "Utilizator Meta"}
                </p>
                {metaConnection.selected_ad_account_name && (
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-secondary)" }}>
                    Cont activ: {metaConnection.selected_ad_account_name}
                  </p>
                )}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {!metaConnection.selected_ad_account_id && (
                <GlowButton variant="primary" size="sm" onClick={loadAdAccounts} loading={isLoadingAccounts}>
                  Selectează cont de reclame
                </GlowButton>
              )}
              {metaConnection.selected_ad_account_id && (
                <GlowButton variant="outline" size="sm" onClick={loadAdAccounts} loading={isLoadingAccounts}>
                  Schimbă contul
                </GlowButton>
              )}
              <GlowButton variant="ghost" size="sm" onClick={handleDisconnectMeta}>
                <Unlink size={12} /> Deconectează Meta
              </GlowButton>
            </div>
            {adAccounts.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-secondary)", marginBottom: 10 }}>
                  Alege contul de reclame:
                </p>
                {adAccounts.map((account) => (
                  <button
                    key={account.id}
                    onClick={() => selectAdAccount(account)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 16px",
                      background: account.id === metaConnection.selected_ad_account_id ? "var(--brand-primary-glow)" : "var(--bg-elevated)",
                      border: `1px solid ${account.id === metaConnection.selected_ad_account_id ? "var(--brand-primary)" : "var(--bg-border)"}`,
                      borderRadius: "var(--radius-md)",
                      marginBottom: 8,
                      cursor: "pointer",
                      transition: "all 150ms",
                      textAlign: "left",
                    }}
                  >
                    <div>
                      <p style={{ fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>
                        {account.name}
                      </p>
                      <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>
                        {account.id} · {account.currency}
                      </p>
                    </div>
                    {account.id === metaConnection.selected_ad_account_id && (
                      <CheckCircle size={16} color="var(--brand-primary)" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "16px 20px",
                background: "rgba(245,158,11,0.06)",
                border: "1px solid rgba(245,158,11,0.2)",
                borderRadius: "var(--radius-md)",
                marginBottom: 16,
              }}
            >
              <AlertCircle size={18} color="var(--brand-warning)" />
              <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-secondary)" }}>
                Contul Meta Ads nu este conectat. Conectează-l pentru a vedea campanii și rapoarte.
              </p>
            </div>
            <GlowButton variant="primary" size="md" onClick={handleConnectMeta}>
              <LinkIcon size={14} /> Conectează Meta Ads
            </GlowButton>
          </div>
        )}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "var(--gradient-card)",
        border: "1px solid var(--bg-border)",
        borderRadius: "var(--radius-lg)",
        padding: 24,
        marginBottom: 20,
      }}
    >
      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 15,
          fontWeight: 600,
          color: "var(--text-primary)",
          marginBottom: 20,
        }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}

function SettingsInput({
  label,
  value,
  onChange,
  placeholder,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label style={{ display: "block", fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-secondary)", marginBottom: 6 }}>
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          width: "100%",
          padding: "10px 14px",
          background: disabled ? "var(--bg-overlay)" : "var(--bg-elevated)",
          border: "1px solid var(--bg-border)",
          borderRadius: "var(--radius-md)",
          color: disabled ? "var(--text-muted)" : "var(--text-primary)",
          fontFamily: "var(--font-body)",
          fontSize: 14,
          outline: "none",
          transition: "border-color 150ms",
          cursor: disabled ? "not-allowed" : "text",
        }}
        onFocus={(e) => { if (!disabled) (e.currentTarget as HTMLInputElement).style.borderColor = "var(--brand-primary)"; }}
        onBlur={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = "var(--bg-border)"; }}
      />
    </div>
  );
}

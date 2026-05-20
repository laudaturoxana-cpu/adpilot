"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogoFull } from "@/components/brand/Logo";
import { GlowButton } from "@/components/adpilot/GlowButton";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message === "Invalid login credentials" ? "Email sau parolă incorectă" : error.message);
    } else {
      router.push("/dashboard");
    }
    setIsLoading(false);
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Left — Form */}
      <div
        style={{
          width: "40%",
          minWidth: 380,
          padding: "48px 48px",
          display: "flex",
          flexDirection: "column",
          background: "var(--bg-surface)",
          borderRight: "1px solid var(--bg-border)",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ marginBottom: 48 }}>
          <LogoFull size="md" />
        </div>
        <div style={{ flex: 1, maxWidth: 360 }}>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 28,
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: 8,
            }}
          >
            Bine ai revenit
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 32 }}>
            Intră în cont pentru a gestiona campaniile tale.
          </p>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@agentie.ro"
                style={inputStyle}
                onFocus={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = "var(--brand-primary)"; (e.currentTarget as HTMLInputElement).style.boxShadow = "var(--shadow-glow-blue)"; }}
                onBlur={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = "var(--bg-border)"; (e.currentTarget as HTMLInputElement).style.boxShadow = "none"; }}
              />
            </div>
            <div style={{ marginBottom: 24, position: "relative" }}>
              <label style={labelStyle}>Parolă</label>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ ...inputStyle, paddingRight: 40 }}
                onFocus={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = "var(--brand-primary)"; (e.currentTarget as HTMLInputElement).style.boxShadow = "var(--shadow-glow-blue)"; }}
                onBlur={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = "var(--bg-border)"; (e.currentTarget as HTMLInputElement).style.boxShadow = "none"; }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: 12,
                  top: 34,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  padding: 2,
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <GlowButton variant="primary" size="lg" type="submit" loading={isLoading} style={{ width: "100%", justifyContent: "center" }}>
              Intră în cont
            </GlowButton>
          </form>
          <p style={{ textAlign: "center", marginTop: 20, fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-secondary)" }}>
            Nu ai cont?{" "}
            <Link href="/register" style={{ color: "var(--brand-primary)", textDecoration: "none", fontWeight: 500 }}>
              Creează unul gratuit
            </Link>
          </p>
        </div>
      </div>

      {/* Right — Visual */}
      <div
        style={{
          flex: 1,
          background: "var(--gradient-hero)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 64,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "20%",
            left: "20%",
            width: 400,
            height: 400,
            background: "radial-gradient(circle, rgba(14,165,233,0.08) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <blockquote
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 32,
            fontWeight: 700,
            color: "var(--text-primary)",
            textAlign: "center",
            lineHeight: 1.3,
            marginBottom: 40,
            position: "relative",
            zIndex: 1,
          }}
        >
          "Reclamele tale,
          <br />
          <span className="gradient-text">pe pilot automat.</span>"
        </blockquote>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, position: "relative", zIndex: 1 }}>
          {[
            "Analiză AI în timp real",
            "Copy generat instant",
            "Control total Meta Ads",
          ].map((feature) => (
            <div key={feature} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ color: "var(--brand-accent)", fontSize: 16 }}>✓</span>
              <span style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "var(--text-secondary)" }}>{feature}</span>
            </div>
          ))}
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 40,
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 14px",
            background: "var(--brand-primary-glow)",
            border: "1px solid rgba(14,165,233,0.3)",
            borderRadius: "var(--radius-full)",
          }}
        >
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--brand-primary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            ✦ Powered by Claude AI
          </span>
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--font-body)",
  fontSize: 13,
  color: "var(--text-secondary)",
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  background: "var(--bg-elevated)",
  border: "1px solid var(--bg-border)",
  borderRadius: "var(--radius-md)",
  color: "var(--text-primary)",
  fontFamily: "var(--font-body)",
  fontSize: 14,
  outline: "none",
  transition: "border-color 150ms, box-shadow 150ms",
};

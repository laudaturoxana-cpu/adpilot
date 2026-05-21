import Link from "next/link";
import { LogoFull } from "@/components/brand/Logo";
import { GlowButton } from "@/components/adpilot/GlowButton";

export default function LandingPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", position: "relative", overflow: "hidden" }}>

      {/* Navbar */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(10,15,30,0.85)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--bg-border)",
          gap: 12,
        }}
      >
        <LogoFull size="sm" />
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/login">
            <GlowButton variant="ghost" size="sm">Intră în cont</GlowButton>
          </Link>
          <Link href="/register">
            <GlowButton variant="primary" size="sm">Începe gratuit</GlowButton>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "100px 20px 60px",
          background: "var(--gradient-hero)",
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", top: "10%", left: "5%", width: 400, height: 400, background: "radial-gradient(circle, rgba(14,165,233,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "5%", right: "5%", width: 300, height: 300, background: "radial-gradient(circle, rgba(110,231,183,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ textAlign: "center", maxWidth: 760, position: "relative", zIndex: 1, width: "100%" }}>
          {/* Badge */}
          <div style={{ display: "inline-flex", marginBottom: 20 }}>
            <span style={{ padding: "5px 14px", background: "var(--brand-primary-glow)", border: "1px solid rgba(14,165,233,0.3)", borderRadius: "var(--radius-full)", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--brand-primary)", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>
              ✦ Powered by Claude AI
            </span>
          </div>

          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(36px, 8vw, 72px)", fontWeight: 700, lineHeight: 1.1, marginBottom: 20 }}>
            <span style={{ color: "var(--text-primary)", display: "block" }}>Reclamele tale.</span>
            <span style={{ background: "var(--gradient-brand)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", display: "block" }}>
              Pe pilot automat.
            </span>
          </h1>

          <p style={{ fontFamily: "var(--font-body)", fontSize: "clamp(15px, 3vw, 18px)", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 36, maxWidth: 560, margin: "0 auto 36px" }}>
            Conectează-ți contul Meta Ads și lasă AI-ul să analizeze, optimizeze și genereze copy — în timp real.
          </p>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 16 }}>
            <Link href="/register">
              <GlowButton variant="primary" size="lg">Începe gratuit →</GlowButton>
            </Link>
            <Link href="/login">
              <GlowButton variant="outline" size="lg">Intră în cont</GlowButton>
            </Link>
          </div>

          <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-muted)" }}>
            ✓ Gratuit 14 zile &nbsp;·&nbsp; ✓ Fără card &nbsp;·&nbsp; ✓ Setup în 2 minute
          </p>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: "60px 20px", background: "var(--bg-surface)", borderTop: "1px solid var(--bg-border)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(24px, 5vw, 36px)", fontWeight: 700, color: "var(--text-primary)", textAlign: "center", marginBottom: 10 }}>
            Tot ce ai nevoie. Nimic în plus.
          </h2>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "var(--text-secondary)", textAlign: "center", marginBottom: 40 }}>
            AdPilot combină datele Meta Ads cu inteligența Claude AI.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
            {features.map((f, i) => (
              <div key={i} className="glow-border" style={{ background: "var(--gradient-card)", borderRadius: "var(--radius-lg)", padding: "24px 20px" }}>
                <div style={{ width: 44, height: 44, borderRadius: "var(--radius-md)", background: `${f.color}15`, border: `1px solid ${f.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 14 }}>
                  {f.icon}
                </div>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>
                  {f.title}
                </h3>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section style={{ padding: "60px 20px", background: "var(--bg-base)", borderTop: "1px solid var(--bg-border)" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-display)", fontSize: "clamp(16px, 3vw, 20px)", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 40 }}>
            Construit pentru agenții din România
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {proofMetrics.map(({ value, label }, i) => (
              <div key={i}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "clamp(28px, 6vw, 42px)", fontWeight: 700, background: "var(--gradient-brand)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", marginBottom: 6 }}>
                  {value}
                </p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "clamp(12px, 2.5vw, 14px)", color: "var(--text-secondary)", lineHeight: 1.4 }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "60px 20px", background: "var(--bg-surface)", borderTop: "1px solid var(--bg-border)", textAlign: "center" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(22px, 5vw, 34px)", fontWeight: 700, color: "var(--text-primary)", marginBottom: 14 }}>
          Gata să pui reclamele pe pilot?
        </h2>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "var(--text-secondary)", marginBottom: 28, maxWidth: 480, margin: "0 auto 28px" }}>
          Înregistrează-te gratuit și conectează-ți contul Meta în 2 minute.
        </p>
        <Link href="/register">
          <GlowButton variant="primary" size="lg">Începe gratuit — 14 zile →</GlowButton>
        </Link>
      </section>

      {/* Footer */}
      <footer
        style={{
          padding: "24px 20px",
          background: "var(--bg-base)",
          borderTop: "1px solid var(--bg-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <LogoFull size="sm" />
        <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>
          © 2026 AdPilot · DoMarketing.ro
        </p>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>
          Claude AI
        </p>
      </footer>
    </div>
  );
}

const features = [
  { icon: "✦", title: "Analiză AI în timp real", description: "Claude AI analizează fiecare campanie și îți spune exact ce să faci — fără ore pierdute în dashboard.", color: "#0EA5E9" },
  { icon: "✍️", title: "Copy generat instant", description: "Generează variante de ad copy optimizate pentru audiența ta în câteva secunde.", color: "#6EE7B7" },
  { icon: "🎯", title: "Control total", description: "Creează, editează, pausează campanii direct din AdPilot — fără Meta Ads Manager.", color: "#F59E0B" },
];

const proofMetrics = [
  { value: "2x", label: "mai rapid față de gestionarea manuală" },
  { value: "40%", label: "economie de timp" },
  { value: "100%", label: "date reale Meta API" },
];

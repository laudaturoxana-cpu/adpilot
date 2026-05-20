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
          padding: "16px 48px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(10,15,30,0.8)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--bg-border)",
        }}
      >
        <LogoFull size="md" />
        <div style={{ display: "flex", gap: 10 }}>
          <Link href="/login">
            <GlowButton variant="ghost" size="sm">Intră în cont</GlowButton>
          </Link>
          <Link href="/register">
            <GlowButton variant="primary" size="sm">Începe gratuit</GlowButton>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "120px 48px 80px",
          background: "var(--gradient-hero)",
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", top: "10%", left: "5%", width: 500, height: 500, background: "radial-gradient(circle, rgba(14,165,233,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "10%", right: "5%", width: 400, height: 400, background: "radial-gradient(circle, rgba(110,231,183,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ textAlign: "center", maxWidth: 800, position: "relative", zIndex: 1 }}>
          {/* Badge */}
          <div style={{ display: "inline-flex", marginBottom: 24 }}>
            <span style={{ padding: "6px 16px", background: "var(--brand-primary-glow)", border: "1px solid rgba(14,165,233,0.3)", borderRadius: "var(--radius-full)", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--brand-primary)", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>
              ✦ Powered by Claude AI
            </span>
          </div>

          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(42px, 7vw, 72px)", fontWeight: 700, lineHeight: 1.1, marginBottom: 24 }}>
            <span style={{ color: "var(--text-primary)", display: "block" }}>Reclamele tale.</span>
            <span style={{ background: "var(--gradient-brand)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", display: "block" }}>
              Pe pilot automat.
            </span>
          </h1>

          <p style={{ fontFamily: "var(--font-body)", fontSize: 20, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 40, maxWidth: 600, margin: "0 auto 40px" }}>
            Conectează-ți contul Meta Ads și lasă AI-ul să analizeze, optimizeze și genereze copy pentru campanii — în timp real.
          </p>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 20 }}>
            <Link href="/register">
              <GlowButton variant="primary" size="lg">Începe gratuit →</GlowButton>
            </Link>
            <Link href="/login">
              <GlowButton variant="outline" size="lg">Intră în cont</GlowButton>
            </Link>
          </div>

          <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-muted)" }}>
            ✓ Gratuit 14 zile &nbsp;&nbsp;✓ Fără card &nbsp;&nbsp;✓ Setup în 2 minute
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: "80px 48px", background: "var(--bg-surface)", borderTop: "1px solid var(--bg-border)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 36, fontWeight: 700, color: "var(--text-primary)", textAlign: "center", marginBottom: 12 }}>
            Tot ce ai nevoie. Nimic în plus.
          </h2>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 16, color: "var(--text-secondary)", textAlign: "center", marginBottom: 56 }}>
            AdPilot combină datele Meta Ads cu inteligența Claude AI.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
            {features.map((feature, i) => (
              <div
                key={i}
                className="glow-border"
                style={{ background: "var(--gradient-card)", borderRadius: "var(--radius-lg)", padding: 28 }}
              >
                <div style={{ width: 48, height: 48, borderRadius: "var(--radius-md)", background: `${feature.color}15`, border: `1px solid ${feature.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 16 }}>
                  {feature.icon}
                </div>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600, color: "var(--text-primary)", marginBottom: 10 }}>
                  {feature.title}
                </h3>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section style={{ padding: "80px 48px", background: "var(--bg-base)", borderTop: "1px solid var(--bg-border)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 48 }}>
            Construit pentru agenții din România
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32 }}>
            {proofMetrics.map(({ value, label }, i) => (
              <div key={i}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 40, fontWeight: 700, background: "var(--gradient-brand)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", marginBottom: 8 }}>
                  {value}
                </p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-secondary)" }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "80px 48px", background: "var(--bg-surface)", borderTop: "1px solid var(--bg-border)", textAlign: "center" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 36, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16 }}>
          Gata să pui reclamele pe pilot?
        </h2>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 16, color: "var(--text-secondary)", marginBottom: 32 }}>
          Înregistrează-te gratuit și conectează-ți contul Meta în 2 minute.
        </p>
        <Link href="/register">
          <GlowButton variant="primary" size="lg">Începe gratuit — 14 zile →</GlowButton>
        </Link>
      </section>

      {/* Footer */}
      <footer style={{ padding: "32px 48px", background: "var(--bg-base)", borderTop: "1px solid var(--bg-border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <LogoFull size="sm" />
        <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-muted)" }}>
          © 2026 AdPilot · DoMarketing.ro · Politică confidențialitate · Termeni
        </p>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>
          Powered by Claude AI
        </p>
      </footer>
    </div>
  );
}

const features = [
  { icon: "✦", title: "Analiză AI în timp real", description: "Claude AI analizează fiecare campanie și îți spune exact ce să faci — fără să pierzi ore în Meta Ads Manager.", color: "#0EA5E9" },
  { icon: "✍️", title: "Copy generat instant", description: "Generează variante de ad copy optimizate pentru audiența ta în câteva secunde, testate pe piața din România.", color: "#6EE7B7" },
  { icon: "🎯", title: "Control total", description: "Creează, editează, pausează campanii direct din AdPilot — fără să deschizi Meta Ads Manager.", color: "#F59E0B" },
];

const proofMetrics = [
  { value: "2x", label: "mai rapid față de gestionarea manuală" },
  { value: "40%", label: "economie de timp per săptămână" },
  { value: "100%", label: "date reale din Meta API" },
];

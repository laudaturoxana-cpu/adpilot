"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { LogoFull } from "@/components/brand/Logo";
import { GlowButton } from "@/components/adpilot/GlowButton";
import {
  Sparkles, PenTool, ShieldCheck, GaugeCircle, ScrollText, Building2,
  Plug, Brain, CheckCheck, ArrowRight,
} from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5, ease: [0.2, 0.6, 0.2, 1] as const },
};

export default function LandingPage() {
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  function onSceneMove(e: React.MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setTilt({ rx: -py * 9, ry: px * 13 });
  }
  function onSceneLeave() {
    setTilt({ rx: 0, ry: 0 });
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", position: "relative", overflow: "hidden" }}>
      {/* Aurora background */}
      <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none" }}>
        <div className="aurora-blob" style={{ top: "-8%", left: "-6%", width: 520, height: 520, background: "rgba(14,165,233,0.28)" }} />
        <div className="aurora-blob" style={{ top: "20%", right: "-10%", width: 480, height: 480, background: "rgba(110,231,183,0.18)", animationDelay: "-6s" }} />
        <div className="aurora-blob" style={{ bottom: "-12%", left: "25%", width: 560, height: 560, background: "rgba(37,99,235,0.16)", animationDelay: "-12s" }} />
      </div>

      {/* Nav */}
      <nav
        className="glass"
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
          padding: "12px 20px", display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: 12, borderLeft: "none", borderRight: "none", borderTop: "none",
        }}
      >
        <LogoFull size="sm" />
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/login"><GlowButton variant="ghost" size="sm">Intră în cont</GlowButton></Link>
          <Link href="/register"><GlowButton variant="primary" size="sm">Începe gratuit</GlowButton></Link>
        </div>
      </nav>

      {/* Hero */}
      <section
        style={{
          position: "relative", zIndex: 1, minHeight: "100vh", display: "grid",
          gridTemplateColumns: "1.05fr 0.95fr", alignItems: "center", gap: 40,
          padding: "120px 40px 60px", maxWidth: 1240, margin: "0 auto",
        }}
        className="hero-grid"
      >
        {/* Copy */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <span
            className="animate-glow"
            style={{
              display: "inline-flex", alignItems: "center", gap: 7, marginBottom: 22,
              padding: "6px 14px", background: "var(--brand-primary-glow)",
              border: "1px solid rgba(14,165,233,0.35)", borderRadius: "var(--radius-full)",
              fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--brand-primary)",
              textTransform: "uppercase", letterSpacing: "0.08em",
            }}
          >
            <Sparkles size={13} /> Agent AI pentru Meta Ads
          </span>

          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(38px, 6vw, 68px)", fontWeight: 700, lineHeight: 1.06, marginBottom: 22 }}>
            <span style={{ color: "var(--text-primary)", display: "block" }}>Reclamele tale,</span>
            <span className="animate-gradient" style={{ background: "var(--gradient-brand)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", display: "block" }}>
              pe pilot automat.
            </span>
          </h1>

          <p style={{ fontFamily: "var(--font-body)", fontSize: "clamp(15px, 2vw, 18px)", color: "var(--text-secondary)", lineHeight: 1.65, marginBottom: 32, maxWidth: 520 }}>
            Conectezi contul Meta Ads, iar agentul AI analizează campaniile, detectează ce nu performează și îți propune acțiuni clare. Tu aprobi. El execută, în limitele pe care le stabilești tu.
          </p>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
            <Link href="/register"><GlowButton variant="primary" size="lg">Începe gratuit <ArrowRight size={16} /></GlowButton></Link>
            <Link href="/login"><GlowButton variant="outline" size="lg">Intră în cont</GlowButton></Link>
          </div>

          <p style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--text-muted)", display: "flex", gap: 16, flexWrap: "wrap" }}>
            <span>✓ 14 zile gratuit</span>
            <span>✓ Fără card</span>
            <span>✓ Setup în 2 minute</span>
          </p>
        </motion.div>

        {/* 3D dashboard mockup */}
        <div className="scene-3d hide-mobile" onMouseMove={onSceneMove} onMouseLeave={onSceneLeave} style={{ position: "relative" }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="tilt-3d glass animate-float"
            style={{
              transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
              borderRadius: "var(--radius-xl)", padding: 18, boxShadow: "var(--shadow-lg)",
            }}
          >
            <DashboardMockup />
          </motion.div>

          {/* Floating chips */}
          <motion.div
            className="glass layer-pop"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            style={{ position: "absolute", top: -16, right: 6, padding: "10px 14px", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", gap: 8 }}
          >
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--brand-accent)", boxShadow: "0 0 10px var(--brand-accent)" }} />
            <span style={{ fontSize: 12, color: "var(--text-primary)", fontFamily: "var(--font-body)" }}>ROAS +38%</span>
          </motion.div>
        </div>
      </section>

      {/* Marquee trust row */}
      <section style={{ position: "relative", zIndex: 1, padding: "8px 0 48px", overflow: "hidden" }}>
        <p style={{ textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 20 }}>
          Un flux complet, de la date la decizie
        </p>
        <div className="marquee-track" style={{ gap: 40, opacity: 0.75 }}>
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
            <span key={i} style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 500, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
              {item}
            </span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ position: "relative", zIndex: 1, padding: "64px 20px", borderTop: "1px solid var(--bg-border)", background: "rgba(15,22,41,0.4)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <motion.h2 {...fadeUp} style={{ fontFamily: "var(--font-display)", fontSize: "clamp(26px, 5vw, 40px)", fontWeight: 700, color: "var(--text-primary)", textAlign: "center", marginBottom: 12 }}>
            Nu doar un dashboard. Un agent care acționează.
          </motion.h2>
          <motion.p {...fadeUp} style={{ fontFamily: "var(--font-body)", fontSize: 15.5, color: "var(--text-secondary)", textAlign: "center", marginBottom: 44, maxWidth: 620, marginLeft: "auto", marginRight: "auto" }}>
            AdPilot combină datele reale Meta cu un motor de reguli determinist și inteligența Claude, ca deciziile financiare să fie mereu sub control.
          </motion.p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18 }}>
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45, delay: i * 0.06 }}
              >
                <FeatureCard {...f} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ position: "relative", zIndex: 1, padding: "64px 20px", borderTop: "1px solid var(--bg-border)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <motion.h2 {...fadeUp} style={{ fontFamily: "var(--font-display)", fontSize: "clamp(24px, 5vw, 36px)", fontWeight: 700, color: "var(--text-primary)", textAlign: "center", marginBottom: 44 }}>
            Cum funcționează
          </motion.h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 18 }}>
            {steps.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.1 }}
                className="glass"
                style={{ borderRadius: "var(--radius-lg)", padding: "26px 22px", position: "relative" }}
              >
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--brand-primary)", opacity: 0.8 }}>0{i + 1}</span>
                <div style={{ width: 46, height: 46, borderRadius: "var(--radius-md)", background: "var(--brand-primary-glow)", border: "1px solid rgba(14,165,233,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "12px 0 14px" }}>
                  <s.icon size={20} color="var(--brand-primary)" />
                </div>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>{s.title}</h3>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>{s.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ position: "relative", zIndex: 1, padding: "56px 20px", borderTop: "1px solid var(--bg-border)", background: "rgba(15,22,41,0.4)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, textAlign: "center" }}>
          {proofMetrics.map(({ value, label }, i) => (
            <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.08 }}>
              <p className="animate-gradient" style={{ fontFamily: "var(--font-mono)", fontSize: "clamp(30px, 6vw, 46px)", fontWeight: 700, background: "var(--gradient-brand)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", marginBottom: 6 }}>
                {value}
              </p>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "clamp(12px, 2.5vw, 14px)", color: "var(--text-secondary)", lineHeight: 1.4 }}>{label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ position: "relative", zIndex: 1, padding: "80px 20px", borderTop: "1px solid var(--bg-border)", textAlign: "center", overflow: "hidden" }}>
        <div aria-hidden className="aurora-blob" style={{ top: "10%", left: "50%", transform: "translateX(-50%)", width: 500, height: 300, background: "rgba(14,165,233,0.18)" }} />
        <motion.div {...fadeUp} style={{ position: "relative" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(26px, 5vw, 40px)", fontWeight: 700, color: "var(--text-primary)", marginBottom: 16 }}>
            Gata să pui reclamele pe pilot?
          </h2>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 16, color: "var(--text-secondary)", marginBottom: 30, maxWidth: 500, marginLeft: "auto", marginRight: "auto" }}>
            Înregistrează-te gratuit și conectează-ți contul Meta în 2 minute.
          </p>
          <Link href="/register"><GlowButton variant="primary" size="lg">Începe gratuit, 14 zile <ArrowRight size={16} /></GlowButton></Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer style={{ position: "relative", zIndex: 1, padding: "26px 20px", borderTop: "1px solid var(--bg-border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <LogoFull size="sm" />
        <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-muted)" }}>© 2026 AdPilot · DoMarketing.ro</p>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
          <Sparkles size={11} /> Powered by Claude
        </p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description, color }: { icon: typeof Sparkles; title: string; description: string; color: string }) {
  const [t, setT] = useState({ rx: 0, ry: 0 });
  return (
    <div
      className="scene-3d"
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        setT({ rx: -((e.clientY - r.top) / r.height - 0.5) * 8, ry: ((e.clientX - r.left) / r.width - 0.5) * 10 });
      }}
      onMouseLeave={() => setT({ rx: 0, ry: 0 })}
      style={{ height: "100%" }}
    >
      <div
        className="tilt-3d glass"
        style={{
          transform: `rotateX(${t.rx}deg) rotateY(${t.ry}deg)`,
          borderRadius: "var(--radius-lg)", padding: "24px 22px", height: "100%",
        }}
      >
        <div className="layer-mid" style={{ width: 46, height: 46, borderRadius: "var(--radius-md)", background: `${color}18`, border: `1px solid ${color}40`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
          <Icon size={21} color={color} />
        </div>
        <h3 className="layer-mid" style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>{title}</h3>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>{description}</p>
      </div>
    </div>
  );
}

function DashboardMockup() {
  return (
    <div style={{ background: "var(--bg-base)", borderRadius: "var(--radius-lg)", padding: 16, border: "1px solid var(--bg-border)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
        <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#EF4444" }} />
        <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#F59E0B" }} />
        <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#6EE7B7" }} />
        <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-muted)" }}>adpilot / dashboard</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 12 }}>
        {mockMetrics.map((m) => (
          <div key={m.label} style={{ background: "var(--gradient-card)", border: "1px solid var(--bg-border)", borderRadius: "var(--radius-md)", padding: "10px 12px" }}>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 10, color: "var(--text-muted)", marginBottom: 4 }}>{m.label}</p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>{m.value}</p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--brand-accent)" }}>{m.delta}</p>
          </div>
        ))}
      </div>

      {/* bar chart */}
      <div style={{ background: "var(--gradient-card)", border: "1px solid var(--bg-border)", borderRadius: "var(--radius-md)", padding: 12, marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 70 }}>
          {[38, 52, 44, 68, 58, 82, 74].map((h, i) => (
            <div key={i} style={{ flex: 1, height: `${h}%`, borderRadius: 4, background: "var(--gradient-brand)", opacity: 0.35 + (h / 140) }} />
          ))}
        </div>
      </div>

      {/* AI strip */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--brand-primary-glow)", border: "1px solid rgba(14,165,233,0.3)", borderRadius: "var(--radius-md)", padding: "10px 12px" }}>
        <Sparkles size={15} color="var(--brand-primary)" style={{ flexShrink: 0 }} />
        <p style={{ fontFamily: "var(--font-body)", fontSize: 11.5, color: "var(--text-secondary)", lineHeight: 1.4 }}>
          Recomand oprirea reclamei „Vara" (a cheltuit 450 lei fără lead valid).
        </p>
      </div>
    </div>
  );
}

const marqueeItems = ["Sincronizare date", "Calcul KPI", "Motor de reguli", "Detecție anomalii", "Analiză Claude", "Propunere acțiune", "Aprobare", "Execuție", "Audit", "Feedback loop"];

const features = [
  { icon: Sparkles, title: "Analiză AI în timp real", description: "Claude analizează fiecare campanie și îți spune exact ce să faci, fără ore pierdute în dashboard.", color: "#0EA5E9" },
  { icon: PenTool, title: "Copy generat instant", description: "Generezi variante de text optimizate pentru audiența ta în câteva secunde.", color: "#6EE7B7" },
  { icon: ShieldCheck, title: "Reguli și limite de siguranță", description: "Deciziile financiare trec printr-un motor determinist, cu praguri și limite pe care le controlezi tu.", color: "#F59E0B" },
  { icon: GaugeCircle, title: "Aprobare umană sau autopilot", description: "Alegi cât automatizezi, de la simple recomandări până la execuție automată în limitele stabilite.", color: "#0EA5E9" },
  { icon: ScrollText, title: "Audit complet și rollback", description: "Fiecare modificare e înregistrată cu motiv, valoare veche și valoare nouă, gata de anulare.", color: "#6EE7B7" },
  { icon: Building2, title: "Multi-client și agenții", description: "Workspaces separate, roluri și permisiuni, date complet izolate între clienți.", color: "#F59E0B" },
];

const steps = [
  { icon: Plug, title: "Conectezi Meta", description: "Autentificare securizată OAuth. Token criptat AES-256, niciodată expus." },
  { icon: Brain, title: "AI analizează", description: "Sincronizăm datele reale, calculăm KPI adaptat obiectivului și detectăm ce merge și ce nu." },
  { icon: CheckCheck, title: "Aprobi și scalezi", description: "Primești propuneri explicate. Aprobi cu un click sau lași agentul pe autopilot, în limitele tale." },
];

const mockMetrics = [
  { label: "Spend", value: "8.4k", delta: "▲ 12%" },
  { label: "ROAS", value: "3.8x", delta: "▲ 38%" },
  { label: "CTR", value: "2.1%", delta: "▲ 6%" },
];

const proofMetrics = [
  { value: "2x", label: "mai rapid față de gestionarea manuală" },
  { value: "40%", label: "timp economisit în optimizare" },
  { value: "100%", label: "date reale prin Meta API" },
];

"use client";

import { useEffect } from "react";
import { GlowButton } from "@/components/adpilot/GlowButton";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Detaliul se loghează server-side prin Next; aici doar consemnăm digest-ul.
    console.error("Dashboard error boundary:", error.digest ?? error.message);
  }, [error]);

  return (
    <div
      role="alert"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        minHeight: "60vh",
        textAlign: "center",
        padding: 24,
      }}
    >
      <h2 style={{ color: "var(--text-primary)", fontSize: "clamp(1.25rem, 3vw, 1.75rem)" }}>
        Ceva nu a mers bine
      </h2>
      <p style={{ color: "var(--text-secondary)", maxWidth: 420 }}>
        A apărut o eroare la încărcarea acestei secțiuni. Poți reîncerca — dacă
        problema persistă, revino peste câteva minute.
      </p>
      <GlowButton onClick={reset}>Reîncearcă</GlowButton>
    </div>
  );
}

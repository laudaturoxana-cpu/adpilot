"use client";

import { Sparkles } from "lucide-react";
import { GlowButton } from "./GlowButton";

interface AIPanelProps {
  title?: string;
  content?: string;
  isLoading?: boolean;
  isStreaming?: boolean;
  streamingText?: string;
  onGenerate?: () => void;
  generateLabel?: string;
}

function SkeletonLine({ width = "100%" }: { width?: string }) {
  return (
    <div
      className="skeleton"
      style={{ height: 14, width, marginBottom: 8, borderRadius: "var(--radius-sm)" }}
    />
  );
}

export function AIPanel({
  title = "Analiză AI",
  content,
  isLoading = false,
  isStreaming = false,
  streamingText = "",
  onGenerate,
  generateLabel = "Generează analiză",
}: AIPanelProps) {
  const showEmpty = !content && !isLoading && !isStreaming;

  return (
    <div
      style={{
        background: "linear-gradient(145deg, #0F1629 0%, rgba(14,165,233,0.04) 100%)",
        border: "1px solid var(--bg-border)",
        borderLeft: "3px solid var(--brand-primary)",
        borderRadius: "var(--radius-lg)",
        padding: 24,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Sparkles
            size={18}
            color="var(--brand-primary)"
            className={isLoading || isStreaming ? "spin-slow" : ""}
          />
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 16,
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
          >
            {title}
          </span>
          <span
            style={{
              padding: "2px 8px",
              background: "var(--brand-primary-glow)",
              border: "1px solid rgba(14,165,233,0.3)",
              borderRadius: "var(--radius-full)",
              fontSize: 10,
              fontFamily: "var(--font-mono)",
              color: "var(--brand-primary)",
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Powered by Claude
          </span>
        </div>
        {onGenerate && !isLoading && !isStreaming && (
          <GlowButton variant="outline" size="sm" onClick={onGenerate}>
            {generateLabel} →
          </GlowButton>
        )}
      </div>

      {/* Content */}
      {isLoading && (
        <div>
          <p style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 16 }}>
            Claude analizează campaniile tale...
          </p>
          <SkeletonLine width="100%" />
          <SkeletonLine width="85%" />
          <SkeletonLine width="92%" />
          <SkeletonLine width="70%" />
          <div style={{ height: 12 }} />
          <SkeletonLine width="100%" />
          <SkeletonLine width="78%" />
          <SkeletonLine width="88%" />
        </div>
      )}

      {isStreaming && (
        <div>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 14,
              lineHeight: 1.7,
              color: "var(--text-primary)",
              whiteSpace: "pre-wrap",
            }}
          >
            {streamingText}
            <span className="cursor-blink" style={{ color: "var(--brand-primary)", fontWeight: "bold" }}>▌</span>
          </p>
        </div>
      )}

      {content && !isLoading && !isStreaming && (
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 14,
            lineHeight: 1.7,
            color: "var(--text-primary)",
            whiteSpace: "pre-wrap",
          }}
          dangerouslySetInnerHTML={{ __html: formatAnalysis(content) }}
        />
      )}

      {showEmpty && (
        <div
          style={{
            textAlign: "center",
            padding: "32px 0",
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.4 }}>✦</div>
          <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 16 }}>
            Nicio analiză generată încă
          </p>
          {onGenerate && (
            <GlowButton variant="primary" size="sm" onClick={onGenerate}>
              {generateLabel} →
            </GlowButton>
          )}
        </div>
      )}
    </div>
  );
}

function formatAnalysis(text: string): string {
  return text
    .replace(/## (.*)/g, '<h3 style="font-family:var(--font-display);font-size:15px;font-weight:600;color:var(--text-primary);margin-top:20px;margin-bottom:8px;">$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--text-primary)">$1</strong>')
    .replace(/\n/g, '<br/>');
}

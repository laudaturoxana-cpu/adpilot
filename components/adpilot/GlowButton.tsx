"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";

interface GlowButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
  loading?: boolean;
}

export function GlowButton({
  variant = "primary",
  size = "md",
  children,
  loading = false,
  disabled,
  style,
  ...props
}: GlowButtonProps) {
  const sizeStyles = {
    sm: { padding: "6px 14px", fontSize: 13 },
    md: { padding: "10px 20px", fontSize: 14 },
    lg: { padding: "14px 28px", fontSize: 16 },
  };

  const variantStyles = {
    primary: {
      background: "var(--gradient-brand)",
      color: "#0A0F1E",
      border: "none",
      fontWeight: 600,
    },
    outline: {
      background: "transparent",
      color: "var(--brand-primary)",
      border: "1px solid var(--brand-primary)",
    },
    ghost: {
      background: "transparent",
      color: "var(--text-secondary)",
      border: "1px solid transparent",
    },
  };

  const hoverMap = {
    primary: () => ({
      boxShadow: "var(--shadow-glow-blue)",
      opacity: 0.9,
    }),
    outline: () => ({
      background: "var(--brand-primary-glow)",
    }),
    ghost: () => ({
      background: "var(--bg-overlay)",
      color: "var(--text-primary)",
    }),
  };

  const isDisabled = disabled || loading;

  return (
    <button
      disabled={isDisabled}
      style={{
        ...variantStyles[variant],
        ...sizeStyles[size],
        borderRadius: "var(--radius-md)",
        fontFamily: "var(--font-body)",
        fontWeight: variant === "primary" ? 600 : 500,
        cursor: isDisabled ? "not-allowed" : "pointer",
        opacity: isDisabled ? 0.6 : 1,
        transition: "all 200ms ease",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        whiteSpace: "nowrap",
        ...style,
      }}
      onMouseEnter={(e) => {
        if (isDisabled) return;
        const hoverStyles = hoverMap[variant]();
        Object.assign((e.currentTarget as HTMLButtonElement).style, hoverStyles);
      }}
      onMouseLeave={(e) => {
        if (isDisabled) return;
        const btn = e.currentTarget as HTMLButtonElement;
        btn.style.boxShadow = "";
        btn.style.opacity = "";
        btn.style.background = variantStyles[variant].background;
        btn.style.color = variantStyles[variant].color;
      }}
      {...props}
    >
      {loading && (
        <svg
          width={size === "sm" ? 12 : 14}
          height={size === "sm" ? 12 : 14}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{ animation: "spin-slow 1s linear infinite" }}
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      )}
      {children}
    </button>
  );
}

"use client";

type LogoSize = 'sm' | 'md' | 'lg';

const sizes = { sm: 28, md: 36, lg: 48 };

export function LogoFull({ size = 'md' }: { size?: LogoSize }) {
  const h = sizes[size];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <LogoSymbol size={size} />
      <span style={{
        fontFamily: 'Space Grotesk, sans-serif',
        fontWeight: 700,
        fontSize: h * 0.6,
        background: 'linear-gradient(135deg, #F0F9FF 0%, #BAE6FD 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        letterSpacing: '-0.02em'
      }}>
        Ad<span style={{ WebkitTextFillColor: '#0EA5E9' }}>Pilot</span>
      </span>
    </div>
  );
}

export function LogoSymbol({ size = 'md' }: { size?: LogoSize }) {
  const h = sizes[size];
  const id = `logoGrad-${size}`;
  return (
    <svg width={h} height={h} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0EA5E9"/>
          <stop offset="100%" stopColor="#6EE7B7"/>
        </linearGradient>
      </defs>
      <path d="M8 32 L32 8" stroke={`url(#${id})`} strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M32 8 L20 22 L14 18 Z" fill={`url(#${id})`} opacity="0.9"/>
      <path d="M20 22 L26 34 L22 30 Z" fill={`url(#${id})`} opacity="0.6"/>
      <circle cx="32" cy="8" r="2.5" fill="#6EE7B7"/>
      <path d="M8 32 Q4 36 2 38" stroke="#0EA5E9" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
    </svg>
  );
}

export function LogoLight({ size = 'md' }: { size?: LogoSize }) {
  const h = sizes[size];
  const id = `logoGradLight-${size}`;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <svg width={h} height={h} viewBox="0 0 40 40" fill="none">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0EA5E9"/>
            <stop offset="100%" stopColor="#6EE7B7"/>
          </linearGradient>
        </defs>
        <path d="M8 32 L32 8" stroke={`url(#${id})`} strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M32 8 L20 22 L14 18 Z" fill={`url(#${id})`} opacity="0.9"/>
        <path d="M20 22 L26 34 L22 30 Z" fill={`url(#${id})`} opacity="0.6"/>
        <circle cx="32" cy="8" r="2.5" fill="#6EE7B7"/>
        <path d="M8 32 Q4 36 2 38" stroke="#0EA5E9" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
      </svg>
      <span style={{
        fontFamily: 'Space Grotesk, sans-serif',
        fontWeight: 700,
        fontSize: h * 0.6,
        color: '#0A0F1E',
        letterSpacing: '-0.02em'
      }}>
        Ad<span style={{ color: '#0EA5E9' }}>Pilot</span>
      </span>
    </div>
  );
}

interface LogoMarkProps {
  size?: number;
  showWordmark?: boolean;
}

export function LogoMark({ size = 36, showWordmark = false }: LogoMarkProps) {
  const s = size;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <svg width={s} height={s} viewBox="0 0 42 42" fill="none">
        <rect width="42" height="42" rx="10" fill="#1E3A5F" />
        {/* Building */}
        <rect x="17" y="21" width="10" height="12" rx="1.5" fill="white" />
        <rect x="19" y="23" width="3" height="2.5" rx="0.5" fill="#F59E0B" />
        <rect x="23" y="23" width="3" height="2.5" rx="0.5" fill="white" opacity="0.3" />
        <rect x="19" y="27" width="3" height="2" rx="0.5" fill="white" opacity="0.3" />
        <rect x="23" y="27" width="3" height="2" rx="0.5" fill="white" opacity="0.3" />
        <rect x="10" y="26" width="8" height="7" rx="1" fill="white" opacity="0.45" />
        {/* AI spark badge */}
        <circle cx="33" cy="11" r="8" fill="#F59E0B" />
        <path d="M35 5 L30 11 L33 11 L31 17 L36 11 L33 11 Z" fill="#1E3A5F" />
      </svg>
      {showWordmark && (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
          <span
            style={{
              fontSize: size * 0.47,
              fontWeight: 300,
              color: 'var(--color-text-primary)',
              letterSpacing: '-0.3px',
            }}
          >
            Landlord
          </span>
          <span
            style={{
              fontSize: size * 0.47,
              fontWeight: 800,
              color: '#F59E0B',
              letterSpacing: '-0.3px',
            }}
          >
            Bot
          </span>
          <span
            style={{
              fontSize: size * 0.2,
              fontWeight: 700,
              color: '#1E3A5F',
              background: '#F59E0B',
              borderRadius: 4,
              padding: '2px 4px',
              marginLeft: 4,
            }}
          >
            AI
          </span>
        </div>
      )}
    </div>
  );
}

// FILE: precci/frontend/app/components/ui/StatusBadge.tsx
'use client';

interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'error';
  label?: string;
  size?: 'sm' | 'md';
}

const STATUS_STYLES = {
  active:    { bg: 'rgba(34,197,94,0.15)',  border: 'rgba(34,197,94,0.4)',  text: '#22C55E',  dot: '#22C55E'  },
  inactive:  { bg: 'rgba(156,163,175,0.15)', border: 'rgba(156,163,175,0.4)', text: '#9CA3AF', dot: '#9CA3AF' },
  pending:   { bg: 'rgba(212,168,83,0.15)', border: 'rgba(212,168,83,0.4)',  text: '#D4A853',  dot: '#D4A853'  },
  confirmed: { bg: 'rgba(201,132,122,0.15)', border: 'rgba(201,132,122,0.4)', text: '#C9847A', dot: '#C9847A' },
  completed: { bg: 'rgba(34,197,94,0.15)',  border: 'rgba(34,197,94,0.4)',  text: '#22C55E',  dot: '#22C55E'  },
  cancelled: { bg: 'rgba(239,68,68,0.15)',  border: 'rgba(239,68,68,0.4)',  text: '#EF4444',  dot: '#EF4444'  },
  error:     { bg: 'rgba(239,68,68,0.15)',  border: 'rgba(239,68,68,0.4)',  text: '#EF4444',  dot: '#EF4444'  },
};

export default function StatusBadge({
  status,
  label,
  size = 'sm',
}: StatusBadgeProps) {
  const styles = STATUS_STYLES[status] || STATUS_STYLES.inactive;
  const displayLabel = label || status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full font-medium"
      style={{
        background: styles.bg,
        border: `1px solid ${styles.border}`,
        color: styles.text,
        padding: size === 'sm' ? '2px 8px' : '4px 12px',
        fontSize: size === 'sm' ? '0.7rem' : '0.8rem',
        letterSpacing: '0.05em',
      }}
    >
      <span
        className="rounded-full"
        style={{
          width: size === 'sm' ? 5 : 7,
          height: size === 'sm' ? 5 : 7,
          background: styles.dot,
          flexShrink: 0,
        }}
      />
      {displayLabel}
    </span>
  );
}
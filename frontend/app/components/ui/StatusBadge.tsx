// FILE: precci/frontend/app/components/ui/StatusBadge.tsx
// CUTEME LTD — Status Badge
// Online / Busy / Processing / Offline badge.
// Used across agent cards, provider cards, dashboard.

'use client';

type Status = 'online' | 'busy' | 'processing' | 'offline' | 'operational' | 'degraded';

interface StatusBadgeProps {
  status: Status;
  label?: string;
  size?: 'sm' | 'md';
}

const STATUS_CONFIG: Record<Status, { colour: string; bg: string; label: string }> = {
  online: { colour: '#22c55e', bg: '#22c55e15', label: 'Online' },
  busy: { colour: '#f97316', bg: '#f9731615', label: 'In Session' },
  processing: { colour: '#D4A853', bg: '#D4A85315', label: 'Processing' },
  offline: { colour: '#64748b', bg: '#64748b15', label: 'Offline' },
  operational: { colour: '#22c55e', bg: '#22c55e15', label: 'Operational' },
  degraded: { colour: '#eab308', bg: '#eab30815', label: 'Degraded' },
};

export default function StatusBadge({ status, label, size = 'md' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.offline;
  const displayLabel = label || config.label;
  const fontSize = size === 'sm' ? 8 : 10;
  const dotSize = size === 'sm' ? 5 : 6;
  const padding = size === 'sm' ? '2px 6px' : '3px 9px';

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding,
        borderRadius: 9999,
        background: config.bg,
        border: `1px solid ${config.colour}44`,
        fontSize,
        fontWeight: 700,
        color: config.colour,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: dotSize,
          height: dotSize,
          borderRadius: '50%',
          background: config.colour,
          animation: status !== 'offline' ? 'pulse-dot 2s infinite' : 'none',
          flexShrink: 0,
        }}
      />
      {displayLabel}
    </div>
  );
}
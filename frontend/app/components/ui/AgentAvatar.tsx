// FILE: precci/frontend/app/components/ui/AgentAvatar.tsx
// CUTEME LTD — Agent Avatar Component
// Reusable across PWA and dashboard.
// Shows agent initials with correct brand colour.
// Status dot shows current state.
// Size variants: sm (24), md (40), lg (64), xl (80).

'use client';

const AGENT_DATA: Record<string, { initials: string; colour: string; name: string }> = {
  'PC-001': { initials: 'VI', colour: '#C4A494', name: 'Vivienne' },
  'PC-002': { initials: 'CE', colour: '#D4A853', name: 'Celeste' },
  'PC-003': { initials: 'MA', colour: '#F2B5B0', name: 'Marcus' },
  'PC-004': { initials: 'SI', colour: '#F5DEB3', name: 'Sienna' },
  'PC-005': { initials: 'RA', colour: '#8B3A3A', name: 'Rafael' },
  'PC-006': { initials: 'NA', colour: '#F7F0E8', name: 'Nadia' },
  'PC-007': { initials: 'SE', colour: '#3B82F6', name: 'Sebastian' },
  'PC-026': { initials: 'GR', colour: '#00C8ED', name: 'Grace' },
  'PC-008': { initials: 'LU', colour: '#C4A494', name: 'Luna' },
  'PC-009': { initials: 'ZA', colour: '#D4A853', name: 'Zara' },
  'PC-010': { initials: 'MI', colour: '#F2B5B0', name: 'Mia' },
  'PC-011': { initials: 'IS', colour: '#F5DEB3', name: 'Isla' },
  'PC-012': { initials: 'RE', colour: '#8B3A3A', name: 'Remy' },
  'PC-013': { initials: 'CO', colour: '#F7F0E8', name: 'Cora' },
  'PC-014': { initials: 'DR', colour: '#3B82F6', name: 'Drew' },
  'PC-015': { initials: 'SA', colour: '#4ECDC4', name: 'Sage' },
  'PC-016': { initials: 'BE', colour: '#00C8ED', name: 'Belle' },
  'PC-017': { initials: 'NO', colour: '#F5A623', name: 'Nova' },
  'PC-018': { initials: 'PI', colour: '#C4A494', name: 'Piper' },
  'PC-019': { initials: 'NI', colour: '#F2B5B0', name: 'Nina' },
  'PC-020': { initials: 'EL', colour: '#D4A853', name: 'Elton' },
  'PC-021': { initials: 'LE', colour: '#F7F0E8', name: 'Lena' },
  'PC-022': { initials: 'FI', colour: '#8B3A3A', name: 'Finn' },
  'PC-023': { initials: 'AU', colour: '#F5DEB3', name: 'Aurora' },
  'PC-024': { initials: 'CL', colour: '#3B82F6', name: 'Cole' },
  'PC-025': { initials: 'EV', colour: '#4ECDC4', name: 'Eva' },
  'PC-027': { initials: 'BR', colour: '#F5A623', name: 'Brook' },
};

const SIZES = { sm: 24, md: 40, lg: 64, xl: 80 };

type Status = 'online' | 'busy' | 'processing' | 'offline';

interface AgentAvatarProps {
  pcId: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  status?: Status;
  showStatus?: boolean;
  glowing?: boolean;
}

export default function AgentAvatar({
  pcId,
  size = 'md',
  status,
  showStatus = false,
  glowing = false,
}: AgentAvatarProps) {
  const agent = AGENT_DATA[pcId];
  if (!agent) return null;

  const px = SIZES[size];
  const fontSize = px * 0.28;
  const dotSize = Math.max(8, px * 0.18);

  const statusColour = status === 'busy' ? '#f97316'
    : status === 'processing' ? '#D4A853'
    : status === 'offline' ? '#64748b'
    : '#22c55e';

  return (
    <div
      style={{
        position: 'relative',
        width: px,
        height: px,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: px,
          height: px,
          borderRadius: '50%',
          background: agent.colour + '18',
          border: `${size === 'xl' ? 3 : size === 'lg' ? 2 : 1.5}px solid ${agent.colour}`,
          boxShadow: glowing
            ? `0 0 ${px * 0.4}px ${agent.colour}44, inset 0 0 ${px * 0.2}px ${agent.colour}22`
            : 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize,
          fontWeight: 900,
          color: agent.colour,
          transition: 'box-shadow 300ms ease',
        }}
      >
        {agent.initials}
      </div>
      {showStatus && status && (
        <div
          style={{
            position: 'absolute',
            bottom: dotSize * 0.1,
            right: dotSize * 0.1,
            width: dotSize,
            height: dotSize,
            borderRadius: '50%',
            background: statusColour,
            border: '2px solid #1A0A0F',
            animation: status !== 'offline' ? 'pulse-dot 2s infinite' : 'none',
          }}
        />
      )}
    </div>
  );
}
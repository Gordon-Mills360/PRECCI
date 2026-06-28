// FILE: precci/frontend/app/components/ui/AgentAvatar.tsx
'use client';

import { motion } from 'framer-motion';

interface AgentAvatarProps {
  agentName: string;
  pcId: string;
  isActive?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const AGENT_COLOURS: Record<string, string> = {
  'PC-001': '#C9847A', // Vivienne — Rose Gold
  'PC-002': '#D4A853', // Celeste — Warm Gold
  'PC-003': '#8B9DC3', // Marcus — Steel Blue
  'PC-004': '#C9847A', // Sienna
  'PC-005': '#A67C5B', // Rafael — Bronze
  'PC-006': '#C9847A', // Nadia
  'PC-007': '#8B9DC3', // Sebastian
  'PC-008': '#F2B5B0', // Luna — Blush
  'PC-009': '#D4A853', // Zara — Gold
  'PC-010': '#C9847A', // Mia — Rose
  'PC-011': '#F5DEB3', // Isla — Champagne
  'PC-012': '#A67C5B', // Remy — Bronze
  'PC-013': '#F2B5B0', // Cora — Blush
  'PC-014': '#8B9DC3', // Drew — Steel
  'PC-015': '#7FB3A0', // Sage — Teal
  'PC-016': '#C9847A', // Belle — Rose
  'PC-017': '#D4A853', // Nova — Gold
  'PC-018': '#F2B5B0', // Piper — Blush
  'PC-019': '#C9847A', // Nina — Rose
  'PC-020': '#8B9DC3', // Elton — Steel
  'PC-021': '#F2B5B0', // Lena — Blush
  'PC-022': '#A67C5B', // Finn — Bronze
  'PC-023': '#C9847A', // Aurora — Rose
  'PC-024': '#D4A853', // Cole — Gold
  'PC-025': '#F2B5B0', // Eva — Blush
  'PC-026': '#C9847A', // Grace — Rose Gold
  'PC-027': '#D4A853', // Brook — Gold
  'JARVIS': '#8B9DC3', // JARVIS — Steel
};

const sizes = {
  sm: { container: 32, text: 12 },
  md: { container: 48, text: 16 },
  lg: { container: 64, text: 22 },
};

export default function AgentAvatar({
  agentName,
  pcId,
  isActive = false,
  size = 'md',
}: AgentAvatarProps) {
  const colour = AGENT_COLOURS[pcId] || '#C9847A';
  const { container, text } = sizes[size];
  const initial = agentName.charAt(0).toUpperCase();

  return (
    <motion.div
      className="relative flex-shrink-0"
      animate={{
        boxShadow: isActive
          ? `0 0 16px ${colour}66`
          : 'none',
      }}
      style={{
        width: container,
        height: container,
        borderRadius: '50%',
        background: `${colour}22`,
        border: `1px solid ${colour}${isActive ? 'CC' : '44'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <span
        className="font-display font-bold"
        style={{ fontSize: text, color: colour }}
      >
        {initial}
      </span>

      {isActive && (
        <motion.div
          className="absolute -bottom-0.5 -right-0.5 rounded-full"
          style={{
            width: container * 0.28,
            height: container * 0.28,
            background: '#22C55E',
            border: '2px solid #1A0A0F',
          }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
}
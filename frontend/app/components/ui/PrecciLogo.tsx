// FILE: precci/frontend/app/components/ui/PrecciLogo.tsx
'use client';

import { motion } from 'framer-motion';

interface PrecciLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
}

const sizes = {
  sm: 'text-xl tracking-[0.15em]',
  md: 'text-3xl tracking-[0.2em]',
  lg: 'text-5xl tracking-[0.25em]',
  xl: 'text-7xl tracking-[0.3em]',
};

export default function PrecciLogo({
  size = 'md',
  animated = true,
}: PrecciLogoProps) {
  const logoContent = (
    <div className="flex flex-col items-center">
      <span
        className={`font-display font-bold ${sizes[size]}`}
        style={{ color: '#C9847A' }}
      >
        PRECCI
      </span>
      {(size === 'lg' || size === 'xl') && (
        <span
          className="text-xs tracking-[0.3em] uppercase mt-1"
          style={{ color: 'rgba(212, 168, 83, 0.7)' }}
        >
          Personal AI Appearance Intelligence
        </span>
      )}
    </div>
  );

  if (!animated) return logoContent;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      {logoContent}
    </motion.div>
  );
}
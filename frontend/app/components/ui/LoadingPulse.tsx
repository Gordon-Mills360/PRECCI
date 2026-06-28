// FILE: precci/frontend/app/components/ui/LoadingPulse.tsx
'use client';

import { motion } from 'framer-motion';

interface LoadingPulseProps {
  size?: number;
  color?: string;
  label?: string;
}

export default function LoadingPulse({
  size = 60,
  color = '#C9847A',
  label = 'Loading...',
}: LoadingPulseProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        {[1, 2, 3].map(i => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full border"
            style={{ borderColor: color }}
            initial={{ scale: 1, opacity: 0.8 }}
            animate={{ scale: 1.5 + i * 0.3, opacity: 0 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.4,
              ease: 'easeOut',
            }}
          />
        ))}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ background: `${color}33` }}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </div>
      {label && (
        <p
          className="text-xs tracking-widest uppercase"
          style={{ color: 'rgba(250,240,232,0.5)' }}
        >
          {label}
        </p>
      )}
    </div>
  );
}
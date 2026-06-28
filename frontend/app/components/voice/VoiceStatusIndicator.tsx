// FILE: precci/frontend/app/components/voice/VoiceStatusIndicator.tsx
// Small status indicator shown in corners of screens
// to show current voice connection state.

'use client';

import { motion } from 'framer-motion';

interface VoiceStatusIndicatorProps {
  isConnected: boolean;
  isSpeaking: boolean;
  isListening: boolean;
}

export default function VoiceStatusIndicator({
  isConnected,
  isSpeaking,
  isListening,
}: VoiceStatusIndicatorProps) {
  const color = isSpeaking
    ? '#D4A853'
    : isListening
    ? '#C9847A'
    : isConnected
    ? '#22C55E'
    : '#6B7280';

  const label = isSpeaking
    ? 'Speaking'
    : isListening
    ? 'Listening'
    : isConnected
    ? 'Connected'
    : 'Disconnected';

  return (
    <div className="flex items-center gap-2">
      <motion.div
        className="rounded-full"
        style={{ width: 8, height: 8, background: color }}
        animate={
          isListening || isSpeaking
            ? { scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }
            : { scale: 1, opacity: 1 }
        }
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      <span
        className="text-xs tracking-wider uppercase"
        style={{ color: 'rgba(250,240,232,0.4)', fontSize: '0.65rem' }}
      >
        {label}
      </span>
    </div>
  );
}
// FILE: precci/frontend/app/components/voice/VoiceWaveform.tsx
// Animated waveform displayed when any agent is speaking.
// Bars animate randomly to simulate real voice waveform.

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';

interface VoiceWaveformProps {
  isActive: boolean;
  barCount?: number;
  color?: string;
  height?: number;
}

export default function VoiceWaveform({
  isActive,
  barCount = 7,
  color = '#C9847A',
  height = 40,
}: VoiceWaveformProps) {
  const [amplitudes, setAmplitudes] = useState<number[]>(
    Array(barCount).fill(0.3)
  );
  const animRef = useRef<number>();

  useEffect(() => {
    if (!isActive) {
      cancelAnimationFrame(animRef.current!);
      setAmplitudes(Array(barCount).fill(0.3));
      return;
    }

    function animate() {
      setAmplitudes(
        Array(barCount)
          .fill(0)
          .map((_, i) => {
            const base = i === Math.floor(barCount / 2) ? 0.6 : 0.3;
            return base + Math.random() * 0.7;
          })
      );
      animRef.current = requestAnimationFrame(animate);
    }

    animRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animRef.current!);
  }, [isActive, barCount]);

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="flex items-center justify-center gap-1"
          style={{ height }}
        >
          {amplitudes.map((amp, i) => (
            <motion.div
              key={i}
              className="rounded-full"
              animate={{ height: `${amp * height}px` }}
              transition={{ duration: 0.1, ease: 'easeOut' }}
              style={{
                width: 3,
                background: color,
                minHeight: 4,
                opacity: 0.7 + amp * 0.3,
              }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
// FILE: precci/frontend/app/components/ui/VoiceButton.tsx
// Voice activation button — the only interactive element in PRECCI.
// Tapping starts or stops a voice session.
// No text input ever. Voice only.

'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface VoiceButtonProps {
  isListening: boolean;
  isSpeaking: boolean;
  onTap: () => void;
  agentInitial?: string;
  size?: number;
}

export default function VoiceButton({
  isListening,
  isSpeaking,
  onTap,
  agentInitial = 'G',
  size = 120,
}: VoiceButtonProps) {
  return (
    <div
      className="relative flex items-center justify-center cursor-pointer"
      style={{ width: size, height: size }}
      onClick={onTap}
    >
      {/* Pulse rings — active when listening */}
      <AnimatePresence>
        {isListening && !isSpeaking && (
          <>
            {[1, 2, 3].map(i => (
              <motion.div
                key={i}
                className="absolute rounded-full border border-rose-gold/30"
                style={{ width: size, height: size }}
                initial={{ scale: 1, opacity: 0.8 }}
                animate={{ scale: 1.3 + i * 0.25, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.4,
                  ease: 'easeOut',
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Central orb */}
      <motion.div
        className="relative z-10 rounded-full flex items-center justify-center"
        animate={{
          scale: isSpeaking ? [1, 1.08, 1] : isListening ? [1, 1.03, 1] : 1,
          boxShadow: isListening
            ? [
                '0 0 20px rgba(201,132,122,0.3)',
                '0 0 50px rgba(201,132,122,0.6)',
                '0 0 20px rgba(201,132,122,0.3)',
              ]
            : '0 0 15px rgba(201,132,122,0.15)',
        }}
        transition={{
          duration: isSpeaking ? 0.4 : 2,
          repeat: isListening ? Infinity : 0,
        }}
        style={{
          width: size,
          height: size,
          background:
            'radial-gradient(circle, rgba(201,132,122,0.25) 0%, rgba(139,58,58,0.15) 60%, transparent 100%)',
          border: `1px solid rgba(201,132,122,${isListening ? '0.6' : '0.3'})`,
        }}
      >
        {/* Waveform bars when agent is speaking */}
        <AnimatePresence mode="wait">
          {isSpeaking ? (
            <motion.div
              key="waveform"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1"
            >
              {[0.4, 0.7, 1, 0.7, 0.4].map((amp, i) => (
                <motion.div
                  key={i}
                  className="w-1 rounded-full"
                  style={{ background: '#C9847A', minHeight: 4 }}
                  animate={{ height: `${amp * (size * 0.35)}px` }}
                  transition={{
                    duration: 0.2 + Math.random() * 0.2,
                    repeat: Infinity,
                    repeatType: 'reverse',
                    delay: i * 0.08,
                  }}
                />
              ))}
            </motion.div>
          ) : (
            <motion.span
              key="initial"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="font-display font-bold"
              style={{
                fontSize: size * 0.28,
                color: '#C9847A',
              }}
            >
              {agentInitial}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
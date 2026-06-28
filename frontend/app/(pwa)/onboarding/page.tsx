// FILE: precci/frontend/app/(pwa)/onboarding/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import VoiceButton from '@/app/components/voice/VoiceButton';
import VoiceListener from '@/app/components/voice/VoiceListener';
import VoiceStatusIndicator from '@/app/components/voice/VoiceStatusIndicator';
import PrecciLogo from '@/app/components/ui/PrecciLogo';
import type { VoiceState } from '@/app/components/voice/VoiceListener';

export default function OnboardingPage() {
  const router = useRouter();
  const [voiceState, setVoiceState] = useState<VoiceState>({
    isConnected: false,
    isListening: false,
    isSpeaking: false,
    currentAgent: 'Grace',
    error: null,
  });

  useEffect(() => {
    function onMessage(e: CustomEvent) {
      const msg = e.detail;
      if (
        msg?.type === 'function-call' &&
        msg?.functionCall?.name === 'routeToAgent'
      ) {
        router.push('/session');
      }
    }

    window.addEventListener('precci:voice-message', onMessage as EventListener);
    return () =>
      window.removeEventListener('precci:voice-message', onMessage as EventListener);
  }, [router]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-between px-6 py-12 safe-top safe-bottom"
      style={{
        background:
          'radial-gradient(ellipse at 50% 20%, rgba(201,132,122,0.1) 0%, transparent 65%), #1A0A0F',
      }}
    >
      <VoiceListener onStateChange={setVoiceState} />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <PrecciLogo size="md" />
      </motion.div>

      <div className="flex flex-col items-center gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <h2
            className="font-display text-2xl font-bold mb-3"
            style={{ color: '#FAF0E8' }}
          >
            Welcome to PRECCI
          </h2>
          <p
            className="text-sm leading-relaxed max-w-xs"
            style={{ color: 'rgba(250,240,232,0.5)' }}
          >
            Grace is listening. Just speak naturally —
            she will guide you through everything.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
        >
          <VoiceButton
            isListening={voiceState.isListening}
            isSpeaking={voiceState.isSpeaking}
            onTap={() => {}}
            agentInitial="G"
            size={130}
          />
        </motion.div>

        <VoiceStatusIndicator
          isConnected={voiceState.isConnected}
          isSpeaking={voiceState.isSpeaking}
          isListening={voiceState.isListening}
        />
      </div>

      <div style={{ height: 40 }} />
    </div>
  );
}
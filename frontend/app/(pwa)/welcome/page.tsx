// FILE: precci/frontend/app/(pwa)/welcome/page.tsx
// Grace's welcome screen — the first thing every client sees and hears.
// Grace's voice activates automatically. No text input. No buttons to press.
// Full screen PRECCI branded experience.

'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function WelcomePage() {
  const [voiceActive, setVoiceActive] = useState(false);
  const [agentSpeaking, setAgentSpeaking] = useState(false);
  const [statusText, setStatusText] = useState('Connecting to Grace...');
  const [waveAmplitudes, setWaveAmplitudes] = useState([0.3, 0.5, 0.8, 0.5, 0.3]);
  const animFrameRef = useRef<number>();

  useEffect(() => {
    // Listen for PRECCI voice events from the PWA layout
    function onVoiceStart() {
      setVoiceActive(true);
      setStatusText('Grace is listening...');
    }

    function onVoiceEnd() {
      setVoiceActive(false);
      setStatusText('Tap or speak to reconnect');
    }

    function onAgentSpeaking(e: CustomEvent) {
      setAgentSpeaking(e.detail.speaking);
      if (e.detail.speaking) {
        setStatusText('Grace is speaking...');
        animateWaveform();
      } else {
        setStatusText('Grace is listening...');
        cancelAnimationFrame(animFrameRef.current!);
        setWaveAmplitudes([0.3, 0.5, 0.8, 0.5, 0.3]);
      }
    }

    window.addEventListener('precci:voice-start', onVoiceStart);
    window.addEventListener('precci:voice-end', onVoiceEnd);
    window.addEventListener('precci:agent-speaking', onAgentSpeaking as EventListener);

    return () => {
      window.removeEventListener('precci:voice-start', onVoiceStart);
      window.removeEventListener('precci:voice-end', onVoiceEnd);
      window.removeEventListener('precci:agent-speaking', onAgentSpeaking as EventListener);
      cancelAnimationFrame(animFrameRef.current!);
    };
  }, []);

  function animateWaveform() {
    function frame() {
      setWaveAmplitudes([
        0.3 + Math.random() * 0.7,
        0.4 + Math.random() * 0.6,
        0.5 + Math.random() * 0.8,
        0.4 + Math.random() * 0.6,
        0.3 + Math.random() * 0.7,
      ]);
      animFrameRef.current = requestAnimationFrame(frame);
    }
    animFrameRef.current = requestAnimationFrame(frame);
  }

  function handleTap() {
    const vapi = (window as any).__precciVapi;
    if (!vapi) return;

    if (voiceActive) {
      vapi.stop();
    } else {
      const graceId = process.env.NEXT_PUBLIC_VAPI_GRACE_ASSISTANT_ID;
      if (graceId) vapi.start(graceId);
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-precci-gradient px-6"
      onClick={handleTap}
      style={{
        background:
          'radial-gradient(ellipse at 50% 30%, rgba(201, 132, 122, 0.15) 0%, transparent 70%), #1A0A0F',
      }}
    >
      {/* PRECCI Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="text-center mb-16"
      >
        <h1
          className="text-5xl font-display font-bold tracking-widest mb-2"
          style={{ color: '#C9847A' }}
        >
          PRECCI
        </h1>
        <p className="text-sm tracking-[0.3em] text-champagne/60 uppercase">
          Personal AI Appearance Intelligence
        </p>
      </motion.div>

      {/* Voice visualiser — Grace's presence */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="relative flex items-center justify-center mb-16"
      >
        {/* Outer rings — listening state */}
        <AnimatePresence>
          {voiceActive && !agentSpeaking && (
            <>
              {[1, 2, 3].map(i => (
                <motion.div
                  key={i}
                  className="absolute rounded-full border border-rose-gold/30"
                  initial={{ scale: 1, opacity: 0.8 }}
                  animate={{ scale: 1.5 + i * 0.3, opacity: 0 }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.4,
                    ease: 'easeOut',
                  }}
                  style={{ width: 120, height: 120 }}
                />
              ))}
            </>
          )}
        </AnimatePresence>

        {/* Central orb */}
        <motion.div
          className="relative z-10 rounded-full flex items-center justify-center"
          animate={{
            scale: agentSpeaking ? [1, 1.05, 1] : voiceActive ? [1, 1.02, 1] : 1,
            boxShadow: voiceActive
              ? ['0 0 20px rgba(201,132,122,0.3)', '0 0 50px rgba(201,132,122,0.6)', '0 0 20px rgba(201,132,122,0.3)']
              : '0 0 20px rgba(201,132,122,0.1)',
          }}
          transition={{
            duration: agentSpeaking ? 0.3 : 2,
            repeat: voiceActive ? Infinity : 0,
          }}
          style={{
            width: 120,
            height: 120,
            background:
              'radial-gradient(circle, rgba(201,132,122,0.3) 0%, rgba(139,58,58,0.2) 60%, transparent 100%)',
            border: '1px solid rgba(201,132,122,0.5)',
          }}
        >
          {/* Waveform bars — visible when Grace is speaking */}
          <AnimatePresence>
            {agentSpeaking && (
              <div className="flex items-center gap-1">
                {waveAmplitudes.map((amp, i) => (
                  <motion.div
                    key={i}
                    className="w-1 rounded-full"
                    animate={{ height: `${amp * 40}px` }}
                    transition={{ duration: 0.1, ease: 'easeOut' }}
                    style={{ background: '#C9847A', minHeight: 4 }}
                  />
                ))}
              </div>
            )}
          </AnimatePresence>

          {/* Grace's initial letter — when not speaking */}
          <AnimatePresence>
            {!agentSpeaking && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-2xl font-display font-bold"
                style={{ color: '#C9847A' }}
              >
                G
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>

      {/* Status text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-center"
      >
        <motion.p
          key={statusText}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm tracking-widest uppercase"
          style={{ color: 'rgba(250, 240, 232, 0.5)' }}
        >
          {statusText}
        </motion.p>
      </motion.div>
    </div>
  );
}
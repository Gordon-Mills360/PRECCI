// FILE: precci/frontend/app/(pwa)/welcome/page.tsx
'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useRef } from 'react';

const C = {
  roseGold: '#C9847A',
  midnight: '#1A0A0F',
  ivoryCream: 'rgba(250,240,232,0.5)',
};

export default function WelcomePage() {
  const [mounted, setMounted] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const [agentSpeaking, setAgentSpeaking] = useState(false);
  const [statusText, setStatusText] = useState('Connecting to Grace...');
  const [waveAmplitudes, setWaveAmplitudes] = useState([0.3, 0.5, 0.8, 0.5, 0.3]);
  const animFrameRef = useRef<number | undefined>(undefined);

  // Only render on client — eliminates all prerender issues
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    function onVoiceStart() {
      setVoiceActive(true);
      setStatusText('Grace is listening...');
    }
    function onVoiceEnd() {
      setVoiceActive(false);
      setStatusText('Speak to connect with Grace');
    }
    function onAgentSpeaking(e: Event) {
      const detail = (e as CustomEvent).detail;
      setAgentSpeaking(detail.speaking);
      if (detail.speaking) {
        setStatusText('Grace is speaking...');
        animateWaveform();
      } else {
        setStatusText('Grace is listening...');
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        setWaveAmplitudes([0.3, 0.5, 0.8, 0.5, 0.3]);
      }
    }

    window.addEventListener('precci:voice-start', onVoiceStart);
    window.addEventListener('precci:voice-end', onVoiceEnd);
    window.addEventListener('precci:agent-speaking', onAgentSpeaking);

    return () => {
      window.removeEventListener('precci:voice-start', onVoiceStart);
      window.removeEventListener('precci:voice-end', onVoiceEnd);
      window.removeEventListener('precci:agent-speaking', onAgentSpeaking);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [mounted]);

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

  // Return minimal shell during SSR — no framer-motion, no custom components
  if (!mounted) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: C.midnight,
        fontFamily: 'Inter, system-ui, sans-serif',
      }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: C.roseGold, letterSpacing: '0.06em' }}>
          CUTEME LTD
        </div>
        <div style={{ fontSize: 11, color: C.ivoryCream, marginTop: 8, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Connecting to Grace...
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 24px',
      background: `radial-gradient(ellipse at 50% 30%, rgba(201,132,122,0.15) 0%, transparent 70%), ${C.midnight}`,
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>

      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 64 }}>
        <div style={{ fontSize: 28, fontWeight: 900, color: C.roseGold, letterSpacing: '0.06em' }}>
          CUTEME LTD
        </div>
        <div style={{ fontSize: 11, color: C.ivoryCream, marginTop: 6, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Personal AI Appearance Intelligence
        </div>
      </div>

      {/* Voice orb */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 64 }}>

        {/* Pulse rings when active */}
        {voiceActive && !agentSpeaking && [1, 2, 3].map(i => (
          <div key={i} style={{
            position: 'absolute',
            width: 120, height: 120,
            borderRadius: '50%',
            border: `1px solid rgba(201,132,122,0.3)`,
            animation: `pulse-ring 2s ease-out infinite ${i * 0.4}s`,
          }} />
        ))}

        {/* Main orb */}
        <div style={{
          position: 'relative', zIndex: 10,
          width: 120, height: 120,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(201,132,122,0.3) 0%, rgba(139,58,58,0.2) 60%, transparent 100%)',
          border: `1px solid rgba(201,132,122,${voiceActive ? '0.7' : '0.4'})`,
          boxShadow: voiceActive
            ? '0 0 40px rgba(201,132,122,0.5)'
            : '0 0 20px rgba(201,132,122,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'box-shadow 300ms ease, border-color 300ms ease',
        }}>
          {agentSpeaking ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {waveAmplitudes.map((amp, i) => (
                <div key={i} style={{
                  width: 4, borderRadius: 2,
                  height: `${Math.max(4, amp * 40)}px`,
                  background: C.roseGold,
                  transition: 'height 100ms ease',
                }} />
              ))}
            </div>
          ) : (
            <span style={{ fontSize: 28, fontWeight: 900, color: C.roseGold }}>G</span>
          )}
        </div>
      </div>

      {/* Status */}
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <p style={{
          fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase',
          color: C.ivoryCream, margin: 0,
        }}>
          {statusText}
        </p>

        {/* Simple voice indicator — no external component */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: voiceActive ? '#22c55e' : agentSpeaking ? C.roseGold : '#4a2a2f',
            animation: voiceActive || agentSpeaking ? 'pulse-dot 2s infinite' : 'none',
          }} />
          <span style={{ fontSize: 10, color: C.ivoryCream }}>
            {voiceActive ? 'Connected' : agentSpeaking ? 'Speaking' : 'Standby'}
          </span>
        </div>
      </div>

      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(2); opacity: 0; }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
      `}</style>
    </div>
  );
}

// FILE: precci/frontend/app/components/provider/ProviderVoicePanel.tsx
'use client';

import { useState, useEffect } from 'react';

const C = {
  roseGold: '#C4A494', midnight: '#1A0A0F', bgPanel: '#2a1a1f',
  bgCard: '#221218', border: '#4a2a2f', textSec: '#d4b8b0',
  textMuted: '#8a6a6a', online: '#22c55e', white: '#FFFFFF',
};

interface ProviderVoicePanelProps {
  providerId: string;
  businessName: string;
  vapiAssistantId?: string;
}

function VoiceWave({ active }: { active: boolean }) {
  const heights = [10, 18, 14, 22, 16, 12, 20];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      {heights.map((h, i) => (
        <div key={i} style={{
          width: 3, height: active ? h : 4, background: C.roseGold,
          borderRadius: 2, opacity: active ? 1 : 0.3,
          animation: active ? `voice-waveform 0.8s ease-in-out infinite ${i * 100}ms` : 'none',
          transition: 'height 200ms ease',
        }} />
      ))}
    </div>
  );
}

export default function ProviderVoicePanel({ providerId, businessName, vapiAssistantId }: ProviderVoicePanelProps) {
  const [voiceState, setVoiceState] = useState<'idle' | 'listening' | 'speaking' | 'processing'>('idle');
  const [active, setActive] = useState(false);
  const [transcript, setTranscript] = useState<Array<{ speaker: string; text: string }>>([]);

  useEffect(() => {
    if (!active || !vapiAssistantId || typeof window === 'undefined') return;
    if (!process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY) return;

    let vapi: any;

    async function init() {
      try {
        const { default: Vapi } = await import('@vapi-ai/web');
        vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY!);
        vapi.on('call-start', () => setVoiceState('listening'));
        vapi.on('call-end', () => { setVoiceState('idle'); setActive(false); });
        vapi.on('speech-start', () => setVoiceState('listening'));
        vapi.on('speech-end', () => setVoiceState('processing'));
        vapi.on('message', (msg: any) => {
          if (msg.type === 'transcript') {
            if (msg.role === 'assistant') setVoiceState('speaking');
            setTranscript(prev => [...prev.slice(-20), {
              speaker: msg.role === 'user' ? businessName : 'CUTEME Agent',
              text: msg.transcript,
            }]);
          }
        });
        vapi.on('error', () => { setVoiceState('idle'); setActive(false); });
        await vapi.start(vapiAssistantId, { metadata: { providerId, businessName } });
      } catch (err) {
        console.error('Provider voice error:', err);
        setActive(false);
      }
    }

    init();
    return () => { if (vapi) vapi.stop(); };
  }, [active, vapiAssistantId, providerId, businessName]);

  const STATE_LABELS = {
    idle: 'Your CUTEME voice agent is ready',
    listening: 'Listening...',
    speaking: 'Agent is speaking...',
    processing: 'Processing...',
  };

  return (
    <div style={{ background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.roseGold }}>Provider Voice Agent</div>
          <div style={{ fontSize: 9.5, color: C.textMuted }}>Your dedicated CUTEME Connect agent</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: active ? C.online : C.border, animation: active ? 'pulse-dot 2s infinite' : 'none' }} />
          <span style={{ fontSize: 9, color: active ? C.online : C.textMuted, fontWeight: 600 }}>
            {active ? 'LIVE' : 'STANDBY'}
          </span>
        </div>
      </div>

      {/* Transcript */}
      <div style={{ height: 120, overflowY: 'auto', padding: '10px 14px' }}>
        {transcript.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8 }}>
            <VoiceWave active={false} />
            <div style={{ fontSize: 10, color: C.textMuted, textAlign: 'center', fontStyle: 'italic' }}>
              {active ? STATE_LABELS[voiceState] : 'Activate to speak with your CUTEME agent'}
            </div>
          </div>
        ) : transcript.map((t, i) => (
          <div key={i} style={{ marginBottom: 6 }}>
            <div style={{ fontSize: 8, color: t.speaker === businessName ? C.roseGold : C.textMuted, fontWeight: 600, marginBottom: 2 }}>{t.speaker}</div>
            <div style={{ fontSize: 10, color: C.textSec, lineHeight: 1.5 }}>{t.text}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{ padding: '10px 14px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ flex: 1, height: 32, background: C.bgCard, border: `1px solid ${active ? C.roseGold : C.border}`, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'border-color 150ms' }}>
          {active && voiceState !== 'idle' ? <VoiceWave active /> : <span style={{ fontSize: 9, color: C.textMuted, fontStyle: 'italic' }}>{STATE_LABELS[voiceState]}</span>}
        </div>
        <button
          onClick={() => setActive(v => !v)}
          style={{ width: 32, height: 32, borderRadius: '50%', background: active ? C.roseGold : C.roseGold + '22', border: `1px solid ${C.roseGold}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: active ? C.midnight : C.roseGold, transition: 'all 150ms', flexShrink: 0 }}>
          {active ? '■' : '▶'}
        </button>
      </div>
      <style>{`@keyframes voice-waveform{0%,100%{transform:scaleY(1)}50%{transform:scaleY(0.4)}} @keyframes pulse-dot{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    </div>
  );
}
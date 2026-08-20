// FILE: precci/frontend/app/(pwa)/onboarding/page.tsx
// CUTEME LTD — Voice Onboarding Flow
// Grace creates the client profile by listening.
// Zero forms. Zero typing. Zero gender assumption.
// Grace asks questions by voice. Client responds by voice.
// Profile built from transcript analysis by Claude.
// Lena sends welcome email after profile complete.
// Redirects to main PWA session on completion.

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import AgentAvatar from '../../components/ui/AgentAvatar';
import VoiceWaveform from '../../components/voice/VoiceWaveform';
import LoadingPulse from '../../components/ui/LoadingPulse';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const C = {
  roseGold: '#C4A494',
  cyan: '#00C8ED',
  midnight: '#1A0A0F',
  bgPanel: '#2a1a1f',
  border: '#4a2a2f',
  textSec: '#d4b8b0',
  textMuted: '#8a6a6a',
  online: '#22c55e',
  white: '#FFFFFF',
};

// Onboarding steps — Grace asks these by voice
// Claude analyses responses and builds the profile
const ONBOARDING_STEPS = [
  {
    id: 'name',
    gracePrompt: 'What is your name?',
    field: 'name',
  },
  {
    id: 'goal',
    gracePrompt: 'What brings you to CUTEME today? Tell me what you are looking to improve or explore.',
    field: 'appearance_goals',
  },
  {
    id: 'skin',
    gracePrompt: 'Tell me about your skin. Any concerns, things you love or want to work on?',
    field: 'skin_concerns',
  },
  {
    id: 'hair',
    gracePrompt: 'What about your hair? Type, length, any concerns?',
    field: 'hair_concerns',
  },
  {
    id: 'style',
    gracePrompt: 'How would you describe your personal style, or the style you want to move towards?',
    field: 'style_prefs',
  },
  {
    id: 'budget',
    gracePrompt: 'For products and services, what budget range are you comfortable with?',
    field: 'budget_range',
  },
  {
    id: 'location',
    gracePrompt: 'What city are you in? This helps our agents give you weather-accurate advice and find providers near you.',
    field: 'city',
  },
];

interface TranscriptLine {
  id: string;
  speaker: 'grace' | 'client';
  text: string;
}

interface ProfileData {
  name?: string;
  appearance_goals?: string;
  skin_concerns?: string;
  hair_concerns?: string;
  style_prefs?: string;
  budget_range?: string;
  city?: string;
  country?: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [voiceState, setVoiceState] = useState<'idle' | 'listening' | 'speaking' | 'processing'>('idle');
  const [currentStep, setCurrentStep] = useState(0);
  const [transcriptLines, setTranscriptLines] = useState<TranscriptLine[]>([]);
  const [profileData, setProfileData] = useState<ProfileData>({});
  const [saving, setSaving] = useState(false);
  const [complete, setComplete] = useState(false);
  const [vapiAssistantId, setVapiAssistantId] = useState<string | null>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcriptLines]);

  // Load auth + Grace Vapi ID
  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/');
        return;
      }
      setUserId(session.user.id);

      // Check if already onboarded
      const { data: existing } = await supabase
        .from('users')
        .select('onboarding_complete')
        .eq('id', session.user.id)
        .single();

      if (existing?.onboarding_complete) {
        router.push('/');
        return;
      }

      // Load Grace's Vapi assistant ID
      const { data: graceAgent } = await supabase
        .from('agents')
        .select('vapi_assistant_id')
        .eq('pc_id', 'PC-026')
        .single();

      if (graceAgent?.vapi_assistant_id) {
        setVapiAssistantId(graceAgent.vapi_assistant_id);
      }
    }

    init();
  }, [router]);

  // Initialise Vapi for Grace onboarding session
  useEffect(() => {
    if (!vapiAssistantId || !userId) return;
    if (typeof window === 'undefined') return;
    if (!process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY) return;

    let vapi: any;

    async function initVapi() {
      try {
        const { default: Vapi } = await import('@vapi-ai/web');
        vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY!);

        vapi.on('call-start', () => setVoiceState('listening'));
        vapi.on('call-end', () => setVoiceState('idle'));
        vapi.on('speech-start', () => setVoiceState('listening'));
        vapi.on('speech-end', () => setVoiceState('processing'));

        vapi.on('message', (message: any) => {
          if (message.type === 'transcript') {
            const line: TranscriptLine = {
              id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
              speaker: message.role === 'user' ? 'client' : 'grace',
              text: message.transcript,
            };
            setTranscriptLines(prev => [...prev.slice(-40), line]);

            // When Grace speaks, detect step progression
            if (message.role === 'assistant') {
              setVoiceState('speaking');
            }
          }

          // Profile data extracted by Vapi function call
          if (message.type === 'function-call' && message.functionCall?.name === 'save_profile_field') {
            const { field, value } = message.functionCall.parameters;
            setProfileData(prev => ({ ...prev, [field]: value }));
          }

          // Onboarding complete signal
          if (message.type === 'function-call' && message.functionCall?.name === 'complete_onboarding') {
            handleSaveProfile(message.functionCall.parameters);
          }
        });

        vapi.on('error', (err: any) => {
          console.error('Vapi onboarding error:', err);
          setVoiceState('idle');
        });

        // Start Grace's onboarding session
        await vapi.start(vapiAssistantId, {
          metadata: {
            userId,
            sessionType: 'onboarding',
            task: 'Build client profile through voice conversation. Ask each question naturally. Extract: name, appearance goals, skin concerns, hair concerns, style preferences, budget range, city. Never ask for gender. Call save_profile_field for each piece of information gathered. Call complete_onboarding when all fields captured.',
          },
        });
      } catch (err) {
        console.error('Vapi init error:', err);
      }
    }

    initVapi();

    return () => {
      if (vapi) vapi.stop();
    };
  }, [vapiAssistantId, userId]);

  const handleSaveProfile = useCallback(async (extractedData?: any) => {
    if (!userId || saving) return;
    setSaving(true);

    const finalData = { ...profileData, ...extractedData };

    try {
      // Save to users table
      await supabase.from('users').update({
        name: finalData.name || null,
        city: finalData.city || null,
        onboarding_complete: true,
        updated_at: new Date().toISOString(),
      }).eq('id', userId);

      // Save to beauty_profiles table
      await supabase.from('beauty_profiles').upsert({
        user_id: userId,
        skin_concerns: finalData.skin_concerns || null,
        hair_concerns: finalData.hair_concerns || null,
        style_prefs: finalData.style_prefs || null,
        budget_range: finalData.budget_range || null,
        appearance_goals: finalData.appearance_goals || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // Log to alerts for Lena to send welcome email
      await supabase.from('alerts').insert({
        type: 'onboarding_complete',
        message: `New client onboarded: ${finalData.name || 'Client'} — Lena send welcome email`,
        severity: 'info',
        agent_id: 'PC-021',
        metadata: { user_id: userId, name: finalData.name, city: finalData.city },
        created_at: new Date().toISOString(),
      });

      setComplete(true);

      // Redirect after 2 seconds
      setTimeout(() => router.push('/'), 2000);
    } catch (err) {
      console.error('Profile save error:', err);
      setSaving(false);
    }
  }, [userId, profileData, saving, router]);

  if (complete) {
    return (
      <div
        style={{
          height: '100dvh',
          background: C.midnight,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 20,
          padding: 28,
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 40 }}>✨</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: C.roseGold }}>
          Welcome to CUTEME LTD
        </div>
        <div style={{ fontSize: 13, color: C.textSec, lineHeight: 1.8 }}>
          {profileData.name ? `${profileData.name}, your` : 'Your'} profile is ready.<br />
          Your personal AI appearance team is standing by.
        </div>
        <LoadingPulse colour={C.roseGold} size={36} label="Taking you to your session..." />
      </div>
    );
  }

  return (
    <div
      style={{
        height: '100dvh',
        background: C.midnight,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          background: C.bgPanel,
          borderBottom: `1px solid ${C.border}`,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexShrink: 0,
        }}
      >
        <AgentAvatar pcId="PC-026" size="md" status="busy" showStatus glowing />
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.cyan }}>Grace</div>
          <div style={{ fontSize: 10, color: C.textMuted }}>Setting up your profile by voice</div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <VoiceWaveform state={voiceState} colour={C.cyan} barCount={5} height={20} />
        </div>
      </div>

      {/* Progress */}
      <div
        style={{
          padding: '8px 20px',
          background: C.bgPanel,
          borderBottom: `1px solid ${C.border}`,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
          {ONBOARDING_STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: 3,
                borderRadius: 2,
                background: profileData[ONBOARDING_STEPS[i].field as keyof ProfileData]
                  ? C.online
                  : i === currentStep
                    ? C.cyan
                    : `${C.border}`,
                transition: 'background 300ms ease',
              }}
            />
          ))}
        </div>
        <div style={{ fontSize: 9, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {Object.keys(profileData).length} of {ONBOARDING_STEPS.length} questions answered
        </div>
      </div>

      {/* Transcript */}
      <div
        ref={transcriptRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {transcriptLines.length === 0 ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              padding: 24,
              textAlign: 'center',
            }}
          >
            <AgentAvatar pcId="PC-026" size="lg" status="online" showStatus glowing />
            <div style={{ fontSize: 14, fontWeight: 600, color: C.white }}>Grace is greeting you</div>
            <div style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.7 }}>
              Just start speaking when you're ready.<br />
              No typing. No forms. Just talk.
            </div>
            <VoiceWaveform state="listening" colour={C.cyan} />
          </div>
        ) : (
          transcriptLines.map(line => (
            <div
              key={line.id}
              style={{
                display: 'flex',
                justifyContent: line.speaker === 'client' ? 'flex-end' : 'flex-start',
                gap: 8,
                animation: 'fade-in-up 200ms ease-out',
              }}
            >
              {line.speaker === 'grace' && (
                <AgentAvatar pcId="PC-026" size="sm" />
              )}
              <div
                style={{
                  maxWidth: '78%',
                  padding: '10px 14px',
                  borderRadius: line.speaker === 'client' ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
                  background: line.speaker === 'client' ? C.cyan : C.bgPanel,
                  color: line.speaker === 'client' ? C.midnight : C.textSec,
                  fontSize: 13,
                  lineHeight: 1.6,
                  fontWeight: line.speaker === 'client' ? 500 : 400,
                  border: line.speaker === 'grace' ? `1px solid ${C.cyan}22` : 'none',
                }}
              >
                {line.text}
              </div>
            </div>
          ))
        )}

        {/* Processing indicator */}
        {voiceState === 'processing' && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <AgentAvatar pcId="PC-026" size="sm" />
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '4px 14px 14px 14px',
                background: C.bgPanel,
                border: `1px solid ${C.cyan}22`,
                display: 'flex',
                gap: 4,
              }}
            >
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: C.cyan,
                    opacity: 0.6,
                    animation: `pulse-dot 1s ease-in-out infinite ${i * 200}ms`,
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Profile being built — live preview */}
      {Object.keys(profileData).length > 0 && (
        <div
          style={{
            padding: '10px 16px',
            background: C.bgPanel,
            borderTop: `1px solid ${C.border}`,
            flexShrink: 0,
          }}
        >
          <div style={{ fontSize: 9, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
            Profile being built
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {Object.entries(profileData).map(([key, value]) => (
              <div
                key={key}
                style={{
                  padding: '3px 8px',
                  borderRadius: 9999,
                  background: `${C.online}15`,
                  border: `1px solid ${C.online}44`,
                  fontSize: 9,
                  color: C.online,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span style={{ fontSize: 8 }}>✓</span>
                {key.replace(/_/g, ' ')}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Voice status */}
      <div
        style={{
          padding: '12px 20px',
          background: C.bgPanel,
          borderTop: `1px solid ${C.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: voiceState === 'listening' ? C.online
              : voiceState === 'speaking' ? C.cyan
              : voiceState === 'processing' ? '#D4A853'
              : C.border,
            animation: voiceState !== 'idle' ? 'pulse-dot 2s infinite' : 'none',
          }}
        />
        <div style={{ fontSize: 11, color: C.textMuted }}>
          {voiceState === 'idle' ? 'Speak to Grace when ready'
            : voiceState === 'listening' ? 'Grace is listening...'
            : voiceState === 'speaking' ? 'Grace is speaking...'
            : 'Grace is thinking...'}
        </div>
      </div>
    </div>
  );
}
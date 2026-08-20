// FILE: precci/frontend/app/(pwa)/booking/page.tsx
// CUTEME LTD — Booking Page
// Brook presents provider options by voice.
// Client confirms by voice. Booking happens automatically.
// Shows provider cards as Brook speaks them.
// No text input anywhere. All voice.
// Real providers from service_providers table.
// Real-time booking confirmation via Supabase.

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import AgentAvatar from '../../components/ui/AgentAvatar';
import VoiceWaveform from '../../components/voice/VoiceWaveform';
import LoadingPulse from '../../components/ui/LoadingPulse';
import StatusBadge from '../../components/ui/StatusBadge';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const C = {
  solarGold: '#F5A623',
  roseGold: '#C4A494',
  midnight: '#1A0A0F',
  bgPanel: '#2a1a1f',
  bgCard: '#221218',
  border: '#4a2a2f',
  textSec: '#d4b8b0',
  textMuted: '#8a6a6a',
  online: '#22c55e',
  white: '#FFFFFF',
};

interface Provider {
  id: string;
  businessName: string;
  address: string;
  city: string;
  distanceKm: number;
  rating: number;
  totalBookings: number;
  services: string[];
  featured: boolean;
  subscriptionTier: string;
  availableSlots: Array<{
    slotId: string;
    date: string;
    time: string;
    capacity: number;
  }>;
}

interface TranscriptLine {
  id: string;
  speaker: 'brook' | 'client';
  text: string;
}

export default function BookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceType = searchParams.get('service') || '';
  const sessionId = searchParams.get('sessionId') || '';

  const [userId, setUserId] = useState<string | null>(null);
  const [voiceState, setVoiceState] = useState<'idle' | 'listening' | 'speaking' | 'processing'>('idle');
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [transcriptLines, setTranscriptLines] = useState<TranscriptLine[]>([]);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [appointmentCode, setAppointmentCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [vapiAssistantId, setVapiAssistantId] = useState<string | null>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcriptLines]);

  // Auth + Brook Vapi ID
  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { router.push('/'); return; }
      setUserId(session.user.id);

      const { data: brookAgent } = await supabase
        .from('agents')
        .select('vapi_assistant_id')
        .eq('pc_id', 'PC-027')
        .single();

      if (brookAgent?.vapi_assistant_id) {
        setVapiAssistantId(brookAgent.vapi_assistant_id);
      }

      setLoading(false);
    }
    init();
  }, [router]);

  // Search providers via backend
  useEffect(() => {
    if (!userId || !serviceType) return;

    async function searchProviders() {
      try {
        const { data: userData } = await supabase
          .from('users')
          .select('lat, lng, city, country')
          .eq('id', userId)
          .single();

        const response = await fetch('/api/bookings/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serviceType,
            clientLat: userData?.lat || 0,
            clientLng: userData?.lng || 0,
            clientCity: userData?.city,
            maxResults: 3,
            sessionId,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data?.providers) {
            setProviders(result.data.providers);
          }
        }
      } catch (err) {
        console.error('Provider search error:', err);
      }
    }

    searchProviders();
  }, [userId, serviceType, sessionId]);

  // Initialise Vapi for Brook
  useEffect(() => {
    if (!vapiAssistantId || !userId || loading) return;
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
              speaker: message.role === 'user' ? 'client' : 'brook',
              text: message.transcript,
            };
            setTranscriptLines(prev => [...prev.slice(-30), line]);
            if (message.role === 'assistant') setVoiceState('speaking');
          }

          // Brook selects a provider
          if (message.type === 'function-call' && message.functionCall?.name === 'select_provider') {
            const { providerId, slotId, date, time } = message.functionCall.parameters;
            const provider = providers.find(p => p.id === providerId);
            if (provider) {
              setSelectedProvider(provider);
              setSelectedSlot({ slotId, date, time });
            }
          }

          // Booking confirmed
          if (message.type === 'function-call' && message.functionCall?.name === 'confirm_booking') {
            handleConfirmBooking(message.functionCall.parameters);
          }
        });

        vapi.on('error', (err: any) => {
          console.error('Vapi Brook error:', err);
          setVoiceState('idle');
        });

        await vapi.start(vapiAssistantId, {
          metadata: {
            userId,
            sessionId,
            serviceType,
            providersAvailable: JSON.stringify(providers.map(p => ({
              id: p.id,
              name: p.businessName,
              distance: p.distanceKm,
              rating: p.rating,
              services: p.services,
              nextSlot: p.availableSlots[0],
            }))),
          },
        });
      } catch (err) {
        console.error('Vapi Brook init error:', err);
      }
    }

    initVapi();

    return () => { if (vapi) vapi.stop(); };
  }, [vapiAssistantId, userId, loading, providers]);

  const handleConfirmBooking = useCallback(async (params: any) => {
    if (!userId || !selectedProvider || !selectedSlot) return;

    try {
      const response = await fetch('/api/bookings/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientUserId: userId,
          providerId: selectedProvider.id,
          bookingSlotId: selectedSlot.slotId,
          appointmentDate: selectedSlot.date,
          appointmentTime: selectedSlot.time,
          servicesRequested: [serviceType],
          sessionSummary: params.sessionSummary || '',
          clientConsentToShareName: true,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.confirmed) {
          setAppointmentCode(result.appointmentCode);
          setBookingConfirmed(true);
        }
      }
    } catch (err) {
      console.error('Booking confirm error:', err);
    }
  }, [userId, selectedProvider, selectedSlot, serviceType]);

  // Listen for booking confirmation via Supabase realtime
  useEffect(() => {
    if (!userId) return;

    const ch = supabase.channel(`booking-${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'provider_bookings',
        filter: `client_user_id=eq.${userId}`,
      }, (payload) => {
        if (payload.new.appointment_code) {
          setAppointmentCode(payload.new.appointment_code);
          setBookingConfirmed(true);
        }
      })
            .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [userId]);

  if (loading) {
    return (
      <div style={{ height: '100dvh', background: C.midnight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingPulse colour={C.solarGold} size={48} label="Brook is finding providers near you..." />
      </div>
    );
  }

  if (bookingConfirmed && appointmentCode) {
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
        <div style={{ fontSize: 32 }}>✅</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: C.solarGold }}>
          Appointment Confirmed
        </div>
        {selectedProvider && (
          <div style={{ fontSize: 13, color: C.textSec }}>
            {selectedProvider.businessName}<br />
            <span style={{ fontSize: 11, color: C.textMuted }}>{selectedProvider.address}</span>
          </div>
        )}
        {selectedSlot && (
          <div style={{ fontSize: 13, color: C.textSec }}>
            {selectedSlot.date} at {selectedSlot.time}
          </div>
        )}

        {/* Appointment Code */}
        <div
          style={{
            padding: '20px 32px',
            background: C.bgPanel,
            border: `2px solid ${C.solarGold}`,
            borderRadius: 16,
            boxShadow: `0 0 30px ${C.solarGold}22`,
          }}
        >
          <div style={{ fontSize: 10, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
            Your Appointment Code
          </div>
          <div
            style={{
              fontSize: 36,
              fontWeight: 900,
              color: C.solarGold,
              fontFamily: 'JetBrains Mono, monospace',
              letterSpacing: '0.2em',
            }}
          >
            {appointmentCode}
          </div>
          <div style={{ fontSize: 10, color: C.textMuted, marginTop: 8 }}>
            Show this to the provider when you arrive
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => router.push('/')}
            style={{
              padding: '12px 24px',
              borderRadius: 9999,
              background: C.solarGold,
              color: C.midnight,
              border: 'none',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Back to Session
          </button>
        </div>
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
          padding: '14px 18px',
          background: C.bgPanel,
          borderBottom: `1px solid ${C.border}`,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexShrink: 0,
        }}
      >
        <AgentAvatar pcId="PC-027" size="md" status="busy" showStatus glowing />
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.solarGold }}>Brook</div>
          <div style={{ fontSize: 10, color: C.textMuted }}>
            Finding {serviceType || 'providers'} near you
          </div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <VoiceWaveform state={voiceState} colour={C.solarGold} barCount={5} height={20} />
        </div>
      </div>

      {/* Provider Cards — appear as Brook speaks them */}
      {providers.length > 0 && (
        <div
          style={{
            padding: '12px 16px',
            borderBottom: `1px solid ${C.border}`,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            maxHeight: '40%',
            overflowY: 'auto',
          }}
        >
          <div style={{ fontSize: 9, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
            {providers.length} option{providers.length > 1 ? 's' : ''} near you
          </div>
          {providers.map((provider, i) => (
            <div
              key={provider.id}
              style={{
                background: selectedProvider?.id === provider.id ? `${C.solarGold}15` : C.bgCard,
                border: `1px solid ${selectedProvider?.id === provider.id ? C.solarGold : C.border}`,
                borderRadius: 10,
                padding: '10px 12px',
                transition: 'all 150ms',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: C.solarGold, fontFamily: 'JetBrains Mono, monospace' }}>
                      0{i + 1}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.white }}>{provider.businessName}</span>
                    {provider.featured && (
                      <span style={{ fontSize: 7, padding: '1px 5px', borderRadius: 9999, background: `${C.solarGold}22`, color: C.solarGold, fontWeight: 700 }}>
                        FEATURED
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 10, color: C.textMuted }}>{provider.address}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.white }}>
                    {'★'.repeat(Math.round(provider.rating))} {provider.rating.toFixed(1)}
                  </div>
                  <div style={{ fontSize: 9, color: C.textMuted }}>{provider.distanceKm}km away</div>
                </div>
              </div>
              {provider.availableSlots.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {provider.availableSlots.map(slot => (
                    <div
                      key={slot.slotId}
                      style={{
                        padding: '3px 8px',
                        borderRadius: 6,
                        background: selectedSlot?.slotId === slot.slotId ? C.solarGold + '22' : `${C.border}`,
                        border: `1px solid ${selectedSlot?.slotId === slot.slotId ? C.solarGold : C.border}`,
                        fontSize: 9,
                        color: selectedSlot?.slotId === slot.slotId ? C.solarGold : C.textMuted,
                        fontFamily: 'JetBrains Mono, monospace',
                      }}
                    >
                      {slot.date} {slot.time}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Transcript */}
      <div
        ref={transcriptRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
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
              gap: 14,
              padding: 24,
              textAlign: 'center',
            }}
          >
            <VoiceWaveform state="listening" colour={C.solarGold} />
            <div style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.7 }}>
              Brook is searching for {serviceType || 'providers'} near you.<br />
              She'll present your options by voice in a moment.
            </div>
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
              {line.speaker === 'brook' && <AgentAvatar pcId="PC-027" size="sm" />}
              <div
                style={{
                  maxWidth: '78%',
                  padding: '10px 14px',
                  borderRadius: line.speaker === 'client' ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
                  background: line.speaker === 'client' ? C.solarGold : C.bgPanel,
                  color: line.speaker === 'client' ? C.midnight : C.textSec,
                  fontSize: 13,
                  lineHeight: 1.6,
                  border: line.speaker === 'brook' ? `1px solid ${C.solarGold}22` : 'none',
                }}
              >
                {line.text}
              </div>
            </div>
          ))
        )}

        {voiceState === 'processing' && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <AgentAvatar pcId="PC-027" size="sm" />
            <div style={{ padding: '10px 14px', borderRadius: '4px 14px 14px 14px', background: C.bgPanel, border: `1px solid ${C.solarGold}22`, display: 'flex', gap: 4 }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: C.solarGold, opacity: 0.6, animation: `pulse-dot 1s ease-in-out infinite ${i * 200}ms` }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Voice Status */}
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
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: voiceState !== 'idle' ? C.solarGold : C.border, animation: voiceState !== 'idle' ? 'pulse-dot 2s infinite' : 'none' }} />
        <div style={{ fontSize: 11, color: C.textMuted }}>
          {voiceState === 'idle' ? 'Confirm your booking by voice'
            : voiceState === 'listening' ? 'Brook is listening...'
            : voiceState === 'speaking' ? 'Brook is speaking...'
            : 'Brook is checking availability...'}
        </div>
      </div>
    </div>
  );
}
// FILE: precci/frontend/app/page.tsx
// CUTEME LTD — Root PWA Page
// THE FIRST THING EVERY CLIENT SEES AND HEARS.
// Grace greets by voice immediately on open.
// Zero text input. Voice only.
// Camera activates when specialist agent needs it.
// Handles the complete client session:
//   Grace → routing → specialist agent → Belle try-on
//   → Nova products → Brook booking → appointment code
// All driven by voice. All powered by Vapi + Claude.
// Real-time everything. No mock data anywhere.

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import AgentVoicePanel from './components/voice/AgentVoicePanel';
import VoiceListener from './components/voice/VoiceListener';
import CameraPermissionGate from './components/camera/CameraPermissionGate';
import CameraView from './components/camera/CameraView';
import FrameCapture from './components/camera/FrameCapture';
import TryOnDisplay from './components/tryon/TryOnDisplay';
import LoadingPulse from './components/ui/LoadingPulse';
import AgentAvatar from './components/ui/AgentAvatar';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Agent definitions — all voice, all real
const AGENTS: Record<string, {
  name: string;
  role: string;
  pcId: string;
  vapiAssistantId?: string;
  colour: string;
  usesCamera: boolean;
}> = {
  'PC-026': { name: 'Grace', role: 'Your Personal Guide', pcId: 'PC-026', colour: '#00C8ED', usesCamera: false },
  'PC-008': { name: 'Luna', role: 'AI Skin Analyst', pcId: 'PC-008', colour: '#C4A494', usesCamera: true },
  'PC-009': { name: 'Zara', role: 'Hair Expert', pcId: 'PC-009', colour: '#D4A853', usesCamera: true },
  'PC-010': { name: 'Mia', role: 'Makeup & Grooming', pcId: 'PC-010', colour: '#F2B5B0', usesCamera: true },
  'PC-011': { name: 'Isla', role: 'Style & Outfit Advisor', pcId: 'PC-011', colour: '#F5DEB3', usesCamera: true },
  'PC-012': { name: 'Remy', role: 'Fragrance Advisor', pcId: 'PC-012', colour: '#8B3A3A', usesCamera: false },
  'PC-013': { name: 'Cora', role: 'Body Care', pcId: 'PC-013', colour: '#F7F0E8', usesCamera: true },
  'PC-014': { name: 'Drew', role: 'Grooming Specialist', pcId: 'PC-014', colour: '#3B82F6', usesCamera: true },
  'PC-016': { name: 'Belle', role: 'Virtual Try-On', pcId: 'PC-016', colour: '#00C8ED', usesCamera: false },
  'PC-017': { name: 'Nova', role: 'Products & Commerce', pcId: 'PC-017', colour: '#F5A623', usesCamera: false },
  'PC-021': { name: 'Lena', role: 'Customer Support', pcId: 'PC-021', colour: '#F7F0E8', usesCamera: false },
  'PC-027': { name: 'Brook', role: 'Booking Specialist', pcId: 'PC-027', colour: '#F5A623', usesCamera: false },
};

type AppView =
  | 'loading'
  | 'welcome'
  | 'session'
  | 'products'
  | 'tryon'
  | 'booking'
  | 'appointment';

interface TranscriptLine {
  id: string;
  speaker: 'user' | 'agent';
  text: string;
  timestamp: string;
}

interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  currency: string;
  affiliateUrl: string;
  imageUrl?: string;
  reason: string;
}

interface TryOnResult {
  simulationUrl: string;
  lookDescription: string;
  lookData: any;
}

interface Booking {
  bookingId: string;
  appointmentCode: string;
  providerName: string;
  providerAddress: string;
  appointmentDate: string;
  appointmentTime: string;
  services: string[];
}

export default function PWARoot() {
  // Auth state
  const [userId, setUserId] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<string>('free');
  const [authLoading, setAuthLoading] = useState(true);

  // Session state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [activeAgentId, setActiveAgentId] = useState<string>('PC-026'); // Grace first
  const [voiceState, setVoiceState] = useState<'idle' | 'listening' | 'speaking' | 'processing'>('idle');
  const [transcriptLines, setTranscriptLines] = useState<TranscriptLine[]>([]);
  const [appView, setAppView] = useState<AppView>('loading');

  // Camera state
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraAnalysis, setCameraAnalysis] = useState<any>(null);

  // Try-On state
  const [tryOnResult, setTryOnResult] = useState<TryOnResult | null>(null);
  const [tryOnLoading, setTryOnLoading] = useState(false);

  // Products state
  const [products, setProducts] = useState<Product[]>([]);

  // Booking state
  const [booking, setBooking] = useState<Booking | null>(null);

  // Vapi assistant IDs from Supabase
  const [vapiAssistantIds, setVapiAssistantIds] = useState<Record<string, string>>({});

  const activeAgent = AGENTS[activeAgentId] || AGENTS['PC-026'];

  // ── AUTH ──
  useEffect(() => {
    async function initAuth() {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        setUserId(session.user.id);
        // Load user plan
        const { data: userData } = await supabase
          .from('users')
          .select('plan')
          .eq('id', session.user.id)
          .single();
        if (userData?.plan) setUserPlan(userData.plan);
        setAppView('session');
      } else {
        // Anonymous session — create guest flow
        const guestId = `guest_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        setUserId(guestId);
        setAppView('welcome');
      }
      setAuthLoading(false);
    }

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUserId(session.user.id);
          setAppView('session');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // ── Load Vapi assistant IDs from Supabase ──
  useEffect(() => {
    async function loadVapiIds() {
      const { data } = await supabase
        .from('agents')
        .select('pc_id, vapi_assistant_id')
        .not('vapi_assistant_id', 'is', null);

      if (data) {
        const ids: Record<string, string> = {};
        data.forEach(a => {
          if (a.vapi_assistant_id) ids[a.pc_id] = a.vapi_assistant_id;
        });
        setVapiAssistantIds(ids);
      }
    }

    loadVapiIds();
  }, []);

  // ── Create or resume session ──
  useEffect(() => {
    if (!userId || appView === 'loading') return;

        async function startSession() {
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      setSessionId(newSessionId);

      // Log session start to Supabase
      try {
        await supabase.from('sessions').insert({
          id: newSessionId,
          user_id: userId,
          agent_id: 'PC-026', // Grace starts
          channel: 'pwa',
          camera_used: false,
          completed: false,
          created_at: new Date().toISOString(),
        });
      } catch {
        // Non-blocking
      }
    }

    startSession();
  }, [userId, appView]);

  // ── Handle transcript from Vapi ──
  const handleTranscript = useCallback((speaker: 'user' | 'agent', text: string) => {
    const line: TranscriptLine = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
      speaker,
      text,
      timestamp: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', hour12: false,
      }),
    };
    setTranscriptLines(prev => [...prev.slice(-50), line]);
  }, []);

  // ── Handle agent routing from Vapi ──
  const handleAgentRoute = useCallback((targetAgentId: string) => {
    if (!AGENTS[targetAgentId]) return;

    setActiveAgentId(targetAgentId);
    const targetAgent = AGENTS[targetAgentId];

    // Activate camera if agent needs it
    if (targetAgent.usesCamera && cameraPermission === 'granted') {
      setCameraActive(true);
    }

    // Clear transcript for new agent
    setTranscriptLines([]);
  }, [cameraPermission]);

  // ── Handle camera analysis from FrameCapture ──
  const handleAnalysis = useCallback((result: any) => {
    setCameraAnalysis(result);

    // If analysis includes try-on trigger
    if (result?.tryOn) {
      setTryOnLoading(true);
      // Belle renders via backend — result comes via Vapi agent or webhook
    }

    // If analysis includes products
    if (result?.products?.length > 0) {
      setProducts(result.products);
    }
  }, []);

  // ── Handle try-on from Belle ──
  const handleTryOn = useCallback((result: TryOnResult) => {
    setTryOnResult(result);
    setTryOnLoading(false);
    setAppView('tryon');
  }, []);

  // ── Handle booking from Brook ──
  const handleBooking = useCallback((bookingData: Booking) => {
    setBooking(bookingData);
    setAppView('appointment');
  }, []);

  // ── Listen for events from backend (try-on, bookings, products) ──
  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase.channel(`client-session-${sessionId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'try_on_history',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        if (payload.new.proxied_url || payload.new.simulation_url) {
          handleTryOn({
            simulationUrl: payload.new.proxied_url || payload.new.simulation_url,
            lookDescription: payload.new.look_description || '',
            lookData: payload.new.look_data,
          });
        }
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'provider_bookings',
        filter: `client_user_id=eq.${userId}`,
      }, (payload) => {
        if (payload.new.appointment_code) {
          handleBooking({
            bookingId: payload.new.id,
            appointmentCode: payload.new.appointment_code,
            providerName: '',
            providerAddress: '',
            appointmentDate: payload.new.appointment_date,
            appointmentTime: payload.new.appointment_time,
            services: payload.new.services_requested || [],
          });
        }
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'recommendations',
        filter: `user_id=eq.${userId}`,
      }, async (payload) => {
        if (payload.new.product_id) {
          const { data: product } = await supabase
            .from('products')
            .select('id, name, brand, price, currency, affiliate_url, image_url, description')
            .eq('id', payload.new.product_id)
            .single();
          if (product) {
            setProducts(prev => {
              const exists = prev.some(p => p.id === product.id);
              if (exists) return prev;
              return [...prev, {
                id: product.id,
                name: product.name,
                brand: product.brand,
                price: product.price,
                currency: product.currency,
                affiliateUrl: product.affiliate_url,
                imageUrl: product.image_url,
                reason: payload.new.reason || '',
              }];
            });
          }
        }
      })
      .subscribe();

      return () => { supabase.removeChannel(channel); };
  }, [sessionId, userId, handleTryOn, handleBooking]);

  // ── Loading ──
  if (authLoading || appView === 'loading') {
    return (
      <div
        style={{
          height: '100dvh',
          background: '#1A0A0F',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 20,
        }}
      >
        <div
          style={{
            fontSize: 22,
            fontWeight: 900,
            color: '#C4A494',
            letterSpacing: '0.06em',
          }}
        >
          CUTEME LTD
        </div>
        <LoadingPulse colour="#C4A494" size={48} label="Starting up..." />
      </div>
    );
  }

  const vapiId = vapiAssistantIds[activeAgentId];

  return (
    <div
      style={{
        height: '100dvh',
        background: '#1A0A0F',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* ── VAPI VOICE LISTENER ── always mounted, invisible ── */}
      {vapiId && userId && sessionId && (
        <VoiceListener
          userId={userId}
          sessionId={sessionId}
          agentId={activeAgentId}
          vapiAssistantId={vapiId}
          onStateChange={setVoiceState}
          onTranscript={handleTranscript}
          onAgentRoute={handleAgentRoute}
          onSessionEnd={() => setVoiceState('idle')}
          autoStart={true}
        />
      )}

      {/* ── FRAME CAPTURE ── invisible, runs when camera active ── */}
      {cameraActive && cameraStream && sessionId && userId && (
        <FrameCapture
          stream={cameraStream}
          active={cameraActive}
          userId={userId}
          sessionId={sessionId}
          agentId={activeAgentId}
          intervalMs={3000}
          onAnalysis={handleAnalysis}
          onError={err => console.error('Frame capture:', err)}
        />
      )}

      {/* ── MAIN CONTENT ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* ── CAMERA VIEW (top half when active) ── */}
        {activeAgent.usesCamera && cameraPermission !== 'denied' && appView === 'session' && (
          <div style={{ height: '45%', flexShrink: 0, position: 'relative' }}>
            {cameraPermission === 'unknown' || cameraPermission === 'granted' ? (
              <CameraPermissionGate
                agentName={activeAgent.name}
                agentColour={activeAgent.colour}
                onPermissionGranted={() => {
                  setCameraPermission('granted');
                  setCameraActive(true);
                }}
                onPermissionDenied={() => {
                  setCameraPermission('denied');
                  setCameraActive(false);
                }}
              >
                <CameraView
                  active={cameraActive}
                  agentColour={activeAgent.colour}
                  onStreamReady={stream => setCameraStream(stream)}
                  onStreamError={err => console.error('Camera error:', err)}
                  showOverlay={true}
                />
              </CameraPermissionGate>
            ) : null}
          </div>
        )}

        {/* ── TRY-ON VIEW ── */}
        {appView === 'tryon' && (
          <div style={{ height: '55%', flexShrink: 0 }}>
            <TryOnDisplay
              simulationUrl={tryOnResult?.simulationUrl || null}
              lookDescription={tryOnResult?.lookDescription || ''}
              agentColour={AGENTS['PC-016'].colour}
              isLoading={tryOnLoading}
              onSave={async () => {
                if (!tryOnResult || !userId) return;
                await supabase.from('try_on_history')
                  .update({ saved: true })
                  .eq('simulation_url', tryOnResult.simulationUrl)
                  .eq('user_id', userId);
              }}
              onTryAnother={() => {
                setTryOnResult(null);
                setAppView('session');
              }}
            />
          </div>
        )}

        {/* ── PRODUCTS VIEW (slide-up when Nova recommends) ── */}
        {products.length > 0 && appView === 'session' && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '35%',
              background: '#2a1a1f',
              borderTop: '1px solid #4a2a2f',
              borderRadius: '16px 16px 0 0',
              overflowY: 'auto',
              padding: 12,
              zIndex: 50,
              transform: products.length > 0 ? 'translateY(0)' : 'translateY(100%)',
              transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 10,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: '#F5A623', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Nova's Recommendations
              </div>
              <button
                onClick={() => setProducts([])}
                style={{ background: 'none', border: 'none', color: '#8a6a6a', cursor: 'pointer', fontSize: 16 }}
              >
                ✕
              </button>
            </div>
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8 }}>
              {products.map(product => (
                <a
                  key={product.id}
                  href={product.affiliateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flexShrink: 0,
                    width: 140,
                    background: '#1A0A0F',
                    border: '1px solid #4a2a2f',
                    borderRadius: 10,
                    padding: 10,
                    textDecoration: 'none',
                    display: 'block',
                  }}
                >
                  {product.imageUrl && (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 6, marginBottom: 6 }}
                    />
                  )}
                  <div style={{ fontSize: 10, fontWeight: 600, color: '#FFFFFF', marginBottom: 3, lineHeight: 1.3 }}>
                    {product.name}
                  </div>
                  <div style={{ fontSize: 9, color: '#8a6a6a', marginBottom: 5 }}>{product.brand}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#F5A623' }}>
                    {product.currency} {Number(product.price).toFixed(2)}
                  </div>
                  {product.reason && (
                    <div style={{ fontSize: 8, color: '#8a6a6a', marginTop: 4, lineHeight: 1.4 }}>
                      {product.reason.substring(0, 50)}
                    </div>
                  )}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* ── APPOINTMENT CODE VIEW ── */}
        {appView === 'appointment' && booking && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 20,
              padding: 28,
              textAlign: 'center',
            }}
          >
            <AgentAvatar pcId="PC-027" size="lg" status="online" showStatus glowing />
            <div style={{ fontSize: 14, fontWeight: 600, color: '#FFFFFF' }}>
              Brook has booked your appointment
            </div>

            {/* Appointment Code */}
            <div
              style={{
                padding: '20px 32px',
                background: '#2a1a1f',
                border: '2px solid #F5A623',
                borderRadius: 16,
                boxShadow: '0 0 30px #F5A62322',
              }}
            >
              <div style={{ fontSize: 10, color: '#8a6a6a', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                Your Appointment Code
              </div>
              <div
                style={{
                  fontSize: 36,
                  fontWeight: 900,
                  color: '#F5A623',
                  fontFamily: 'JetBrains Mono, monospace',
                  letterSpacing: '0.2em',
                }}
              >
                {booking.appointmentCode}
              </div>
              <div style={{ fontSize: 10, color: '#8a6a6a', marginTop: 8 }}>
                Show this code when you arrive
              </div>
            </div>

            {/* Booking Details */}
            <div
              style={{
                background: '#2a1a1f',
                border: '1px solid #4a2a2f',
                borderRadius: 12,
                padding: '14px 20px',
                width: '100%',
                maxWidth: 320,
                textAlign: 'left',
              }}
            >
              {[
                { label: 'Date', value: booking.appointmentDate },
                { label: 'Time', value: booking.appointmentTime },
                { label: 'Services', value: booking.services.join(', ') },
                booking.providerName ? { label: 'Provider', value: booking.providerName } : null,
                booking.providerAddress ? { label: 'Address', value: booking.providerAddress } : null,
              ].filter(Boolean).map(item => (
                <div key={item!.label} style={{ display: 'flex', gap: 12, padding: '6px 0', borderBottom: '1px solid #4a2a2f33' }}>
                  <span style={{ fontSize: 10, color: '#8a6a6a', width: 60, flexShrink: 0 }}>{item!.label}</span>
                  <span style={{ fontSize: 10, color: '#d4b8b0', fontWeight: 500 }}>{item!.value}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setAppView('session')}
              style={{
                padding: '12px 28px',
                borderRadius: 9999,
                background: '#F5A623',
                color: '#1A0A0F',
                border: 'none',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Back to Session
            </button>
          </div>
        )}

        {/* ── AGENT VOICE PANEL (main session view) ── */}
        {(appView === 'session' || appView === 'tryon') && (
          <div
            style={{
              flex: 1,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <AgentVoicePanel
              agentId={activeAgentId}
              agentName={activeAgent.name}
              agentRole={activeAgent.role}
              voiceState={voiceState}
              transcriptLines={transcriptLines}
              showCamera={cameraActive}
            />
          </div>
        )}
      </div>

      {/* ── BOTTOM NAV — Agent switcher + status ── */}
      {appView === 'session' && (
        <div
          style={{
            flexShrink: 0,
            background: '#2a1a1f',
            borderTop: '1px solid #4a2a2f',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch' as any,
          }}
        >
          {/* CUTEME logo */}
          <div
            style={{
              fontSize: 9,
              fontWeight: 900,
              color: '#C4A494',
              letterSpacing: '0.08em',
              flexShrink: 0,
              paddingRight: 8,
              borderRight: '1px solid #4a2a2f',
              marginRight: 4,
            }}
          >
            CUTEME
          </div>

          {/* Active agent display */}
          {Object.entries(AGENTS)
            .filter(([pcId]) => pcId !== 'PC-026') // Grace is always active, not shown
            .map(([pcId, agent]) => (
              <div
                key={pcId}
                style={{
                  flexShrink: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 3,
                  opacity: activeAgentId === pcId ? 1 : 0.4,
                  transition: 'opacity 200ms',
                }}
              >
                <AgentAvatar
                  pcId={pcId}
                  size="sm"
                  status={activeAgentId === pcId ? 'busy' : 'online'}
                  showStatus={activeAgentId === pcId}
                  glowing={activeAgentId === pcId}
                />
                <div
                  style={{
                    fontSize: 7,
                    color: activeAgentId === pcId ? agent.colour : '#8a6a6a',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  {agent.name}
                </div>
              </div>
            ))}

          {/* Voice state far right */}
          <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: voiceState === 'speaking' ? activeAgent.colour
                  : voiceState === 'listening' ? '#22c55e'
                  : voiceState === 'processing' ? '#D4A853'
                  : '#4a2a2f',
                animation: voiceState !== 'idle' ? 'pulse-dot 2s infinite' : 'none',
                transition: 'background 300ms',
              }}
            />
          </div>
        </div>
      )}

      {/* ── WELCOME VIEW ── Before auth ── */}
      {appView === 'welcome' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: '#1A0A0F',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 24,
            padding: 32,
            textAlign: 'center',
            zIndex: 100,
          }}
        >
          {/* Logo */}
          <div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 900,
                color: '#C4A494',
                letterSpacing: '0.06em',
                marginBottom: 6,
              }}
            >
              CUTEME LTD
            </div>
            <div
              style={{
                fontSize: 11,
                color: '#8a6a6a',
                fontStyle: 'italic',
                letterSpacing: '0.04em',
              }}
            >
              Your Personal AI Appearance Intelligence System
            </div>
          </div>

          {/* Grace avatar pulsing */}
          <div style={{ position: 'relative' }}>
            <AgentAvatar pcId="PC-026" size="xl" status="online" showStatus glowing />
            <div
              style={{
                position: 'absolute',
                inset: -12,
                borderRadius: '50%',
                border: '1px solid #00C8ED22',
                animation: 'pulse-dot 3s ease-in-out infinite',
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: -24,
                borderRadius: '50%',
                border: '1px solid #00C8ED11',
                animation: 'pulse-dot 3s ease-in-out infinite 500ms',
              }}
            />
          </div>

          <div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: '#FFFFFF',
                marginBottom: 8,
              }}
            >
              Hi, I'm Grace
            </div>
            <div
              style={{
                fontSize: 13,
                color: '#d4b8b0',
                lineHeight: 1.8,
              }}
            >
              Your personal appearance intelligence guide.<br />
              Just start speaking — I'm already listening.
            </div>
          </div>

          {/* Voice indicator */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              background: '#2a1a1f',
              border: '1px solid #00C8ED33',
              borderRadius: 9999,
              fontSize: 11,
              color: '#00C8ED',
              fontWeight: 600,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#00C8ED',
                animation: 'pulse-dot 2s infinite',
              }}
            />
            Grace is listening
          </div>

          <div
            style={{
              fontSize: 10,
              color: '#8a6a6a',
              lineHeight: 1.7,
              maxWidth: 280,
            }}
          >
            No typing needed. No forms. Just talk.<br />
            Tell me what you need — I'll take care of everything.
          </div>

          {/* Proceed to session (auto-starts, this is just visual) */}
          <button
            onClick={() => setAppView('session')}
            style={{
              padding: '14px 36px',
              borderRadius: 9999,
              background: '#00C8ED',
              color: '#1A0A0F',
              border: 'none',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              letterSpacing: '0.02em',
            }}
          >
            Begin
          </button>
        </div>
      )}
    </div>
  );
}
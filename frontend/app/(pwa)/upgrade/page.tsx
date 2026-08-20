// FILE: precci/frontend/app/(pwa)/upgrade/page.tsx
// CUTEME LTD — Subscription Upgrade Page
// Vivienne presents upgrade options by voice.
// Client says yes by voice. Celeste processes payment.
// Paystack for Africa. Stripe for global.
// Zero text input. Voice-triggered conversion.
// Real subscription creation via backend.

'use client';

import { useState, useEffect } from 'react';
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
  warmGold: '#D4A853',
  midnight: '#1A0A0F',
  bgPanel: '#2a1a1f',
  bgCard: '#221218',
  border: '#4a2a2f',
  textSec: '#d4b8b0',
  textMuted: '#8a6a6a',
  online: '#22c55e',
  white: '#FFFFFF',
};

const TIERS = [
  {
    id: 'glow',
    name: 'Glow',
    price: 9.99,
    colour: C.roseGold,
    features: [
      'Unlimited camera analysis',
      'All specialist agents by voice',
      '20 virtual try-ons per month',
      'Inner Circle access',
      'Basic Academy courses',
      'PRECCI Connect bookings',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 19.99,
    colour: C.warmGold,
    popular: true,
    features: [
      'Everything in Glow',
      'Unlimited virtual try-ons',
      'Priority agent response',
      'Monthly progress report by voice',
      'Full Beauty Academy access',
      'Priority Connect scheduling',
    ],
  },
  {
    id: 'elite',
    name: 'Elite',
    price: 29.99,
    colour: '#F5DEB3',
    features: [
      'Everything in Pro',
      'Weekly Vivienne strategy session',
      'Exclusive brand partner discounts',
      'Early access to new features',
      'VIP Inner Circle membership',
      'Brook prioritises best providers',
    ],
  },
];

export default function UpgradePage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<string>('free');
  const [userCountry, setUserCountry] = useState<string>('GH');
  const [voiceState, setVoiceState] = useState<'idle' | 'listening' | 'speaking' | 'processing'>('idle');
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successTier, setSuccessTier] = useState('');
  const [vapiId, setVapiId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { router.push('/'); return; }
      setUserId(session.user.id);

      const { data: userData } = await supabase
        .from('users')
        .select('plan, country')
        .eq('id', session.user.id)
        .single();

      if (userData) {
        setUserPlan(userData.plan || 'free');
        setUserCountry(userData.country || 'GH');
      }

      // Vivienne's Vapi ID
      const { data: vivienneAgent } = await supabase
        .from('agents')
        .select('vapi_assistant_id')
        .eq('pc_id', 'PC-001')
        .single();
      if (vivienneAgent?.vapi_assistant_id) setVapiId(vivienneAgent.vapi_assistant_id);

      setLoading(false);
    }
    init();
  }, [router]);

  // Vivienne voice
  useEffect(() => {
    if (!vapiId || !userId || loading) return;
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
        vapi.on('message', (msg: any) => {
          if (msg.type === 'transcript' && msg.role === 'assistant') setVoiceState('speaking');
          if (msg.type === 'function-call' && msg.functionCall?.name === 'initiate_upgrade') {
            const tier = msg.functionCall.parameters?.tier;
            if (tier) handleUpgrade(tier);
          }
        });
        vapi.on('error', () => setVoiceState('idle'));

        await vapi.start(vapiId, {
          metadata: {
            userId,
            currentPlan: userPlan,
            context: 'upgrade_presentation',
            tiers: JSON.stringify(TIERS.map(t => ({ id: t.id, name: t.name, price: t.price }))),
          },
        });
      } catch (err) {
        console.error('Vivienne Vapi error:', err);
      }
    }

    initVapi();
    return () => { if (vapi) vapi.stop(); };
  }, [vapiId, userId, loading, userPlan]);

  async function handleUpgrade(tierId: string) {
    if (!userId || processing) return;
    const tier = TIERS.find(t => t.id === tierId);
    if (!tier) return;

    setProcessing(true);
    setSelectedTier(tierId);

    try {
      const gateway = ['GH', 'NG', 'KE', 'ZA', 'UG', 'TZ', 'RW', 'CM', 'CI'].includes(userCountry)
        ? 'paystack' : 'stripe';

      const response = await fetch('/api/payments/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          plan: tierId,
          amount: tier.price,
          currency: 'USD',
          gateway,
          country: userCountry,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSuccessTier(tier.name);
          setSuccess(true);
          // Update local state
          setUserPlan(tierId);
          setTimeout(() => router.push('/'), 3000);
        } else if (result.checkoutUrl) {
          // Redirect to payment page (Paystack/Stripe hosted)
          window.location.href = result.checkoutUrl;
        }
      }
    } catch (err) {
      console.error('Upgrade error:', err);
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <div style={{ height: '100dvh', background: C.midnight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingPulse colour={C.roseGold} size={48} label="Vivienne is preparing your options..." />
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ height: '100dvh', background: C.midnight, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 28, textAlign: 'center' }}>
        <div style={{ fontSize: 40 }}>✨</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.roseGold }}>Welcome to {successTier}</div>
        <div style={{ fontSize: 13, color: C.textSec, lineHeight: 1.8 }}>
          Your full CUTEME LTD experience is now unlocked.<br />
          Vivienne has been notified and all features are active.
        </div>
        <LoadingPulse colour={C.roseGold} size={36} label="Returning to your session..." />
      </div>
    );
  }

  const availableTiers = TIERS.filter(t => {
    const planOrder = ['free', 'glow', 'pro', 'elite'];
    return planOrder.indexOf(t.id) > planOrder.indexOf(userPlan);
  });

  return (
    <div style={{ height: '100dvh', background: C.midnight, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '14px 18px', background: C.bgPanel, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer', fontSize: 18, padding: 0 }}>←</button>
        <AgentAvatar pcId="PC-001" size="md" status="busy" showStatus glowing />
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.roseGold }}>Vivienne</div>
          <div style={{ fontSize: 10, color: C.textMuted }}>Upgrade your plan</div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <VoiceWaveform state={voiceState} colour={C.roseGold} barCount={5} height={20} />
        </div>
      </div>

      {/* Current plan */}
      <div style={{ padding: '10px 16px', background: C.bgPanel, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <div style={{ fontSize: 10, color: C.textMuted }}>
          Current plan: <span style={{ color: C.roseGold, fontWeight: 700, textTransform: 'capitalize' }}>{userPlan}</span>
          {userPlan === 'elite' && ' — You are already on the highest tier'}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {userPlan === 'elite' ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 32 }}>👑</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#F5DEB3' }}>You are on Elite</div>
            <div style={{ fontSize: 13, color: C.textSec, lineHeight: 1.8 }}>
              You have access to every feature CUTEME LTD offers.<br />
              Vivienne handles everything from here.
            </div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 4, fontStyle: 'italic' }}>
              Say the tier name to Vivienne to upgrade. Example: "Vivienne, upgrade me to Pro."
            </div>

            {availableTiers.map(tier => (
              <div
                key={tier.id}
                style={{
                  background: selectedTier === tier.id ? `${tier.colour}15` : C.bgPanel,
                  border: `1px solid ${selectedTier === tier.id ? tier.colour : tier.popular ? `${tier.colour}55` : C.border}`,
                  borderRadius: 14,
                  padding: '16px',
                  position: 'relative',
                  transition: 'all 150ms',
                }}
              >
                {tier.popular && (
                  <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', fontSize: 8, padding: '3px 10px', borderRadius: 9999, background: tier.colour, color: C.midnight, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                    Most Popular
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: tier.colour }}>{tier.name}</div>
                  <div>
                    <span style={{ fontSize: 22, fontWeight: 800, color: C.white }}>${tier.price}</span>
                    <span style={{ fontSize: 10, color: C.textMuted }}>/mo</span>
                  </div>
                </div>

                {tier.features.map(f => (
                  <div key={f} style={{ display: 'flex', gap: 8, marginBottom: 5 }}>
                    <span style={{ color: tier.colour, fontSize: 10, flexShrink: 0, marginTop: 1 }}>✓</span>
                    <span style={{ fontSize: 11, color: C.textSec }}>{f}</span>
                  </div>
                ))}

                {processing && selectedTier === tier.id ? (
                  <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center' }}>
                    <LoadingPulse colour={tier.colour} size={32} label="Processing..." />
                  </div>
                ) : (
                  <div style={{ marginTop: 12, fontSize: 10, color: C.textMuted, textAlign: 'center', fontStyle: 'italic' }}>
                    Say "upgrade to {tier.name}" to Vivienne
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>

      {/* Voice status */}
      <div style={{ padding: '10px 16px', background: C.bgPanel, borderTop: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: voiceState !== 'idle' ? C.roseGold : C.border, animation: voiceState !== 'idle' ? 'pulse-dot 2s infinite' : 'none' }} />
        <div style={{ fontSize: 10, color: C.textMuted }}>
          {voiceState === 'idle' ? 'Tell Vivienne which tier you want'
            : voiceState === 'speaking' ? 'Vivienne is speaking...'
            : 'Vivienne is listening...'}
        </div>
      </div>
    </div>
  );
}
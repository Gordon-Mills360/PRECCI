// FILE: precci/frontend/app/(provider)/provider/dashboard/page.tsx
// CUTEME LTD — Provider Dashboard
// Real-time overview for registered providers.
// All data from Supabase. Live subscriptions.
// Upcoming bookings. Revenue summary. Voice panel always active.
// Brook's voice agent notifies the provider here.

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import StatusBadge from '../../../components/ui/StatusBadge';
import LoadingPulse from '../../../components/ui/LoadingPulse';
import VoiceWaveform from '../../../components/voice/VoiceWaveform';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const C = {
  roseGold: '#C4A494',
  warmGold: '#D4A853',
  solarGold: '#F5A623',
  midnight: '#1A0A0F',
  bgPanel: '#2a1a1f',
  bgCard: '#221218',
  border: '#4a2a2f',
  textSec: '#d4b8b0',
  textMuted: '#8a6a6a',
  online: '#22c55e',
  busy: '#f97316',
  error: '#ef4444',
  white: '#FFFFFF',
};

interface Provider {
  id: string;
  businessName: string;
  subscriptionTier: string;
  featured: boolean;
  rating: number;
  totalBookings: number;
  active: boolean;
  verified: boolean;
  vapiAssistantId: string | null;
}

interface Booking {
  id: string;
  appointmentCode: string;
  appointmentDate: string;
  appointmentTime: string;
  servicesRequested: string[];
  status: string;
  codeVerified: boolean;
  clientBriefData: any;
}

interface Revenue {
  today: number;
  month: number;
  referralFees: number;
  registrationFee: number;
}

function fmtCurrency(v: number) {
  return `$${Number(v).toFixed(2)}`;
}

function fmtDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });
}

export default function ProviderDashboardPage() {
  const router = useRouter();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [revenue, setRevenue] = useState<Revenue>({ today: 0, month: 0, referralFees: 0, registrationFee: 0 });
  const [voiceState, setVoiceState] = useState<'idle' | 'listening' | 'speaking' | 'processing'>('idle');
  const [loading, setLoading] = useState(true);
  const [newBookingAlert, setNewBookingAlert] = useState<Booking | null>(null);
  const [providerId, setProviderId] = useState<string | null>(null);

  // Auth — provider login via email
  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/provider/login');
        return;
      }

      // Find provider by email
      const { data: providerData } = await supabase
        .from('service_providers')
        .select(`
          id, business_name, subscription_tier, featured, rating,
          total_bookings, active, verified, vapi_assistant_id
        `)
        .eq('email', session.user.email)
        .single();

      if (!providerData) {
        router.push('/connect');
        return;
      }

      const p: Provider = {
        id: providerData.id,
        businessName: providerData.business_name,
        subscriptionTier: providerData.subscription_tier,
        featured: providerData.featured,
        rating: providerData.rating || 0,
        totalBookings: providerData.total_bookings || 0,
        active: providerData.active,
        verified: providerData.verified,
        vapiAssistantId: providerData.vapi_assistant_id,
      };

      setProvider(p);
      setProviderId(p.id);
      await loadData(p.id);
    }

    init();
  }, [router]);

  const loadData = useCallback(async (pid: string) => {
    const today = new Date().toISOString().split('T')[0];
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    const monthStart = startOfMonth.toISOString().split('T')[0];

    const [bookingsResult, revenueResult] = await Promise.allSettled([
      supabase
        .from('provider_bookings')
        .select(`
          id, appointment_code, appointment_date, appointment_time,
          services_requested, status, code_verified, client_brief_data
        `)
        .eq('provider_id', pid)
        .gte('appointment_date', today)
        .neq('status', 'cancelled')
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true })
        .limit(20),
      supabase
        .from('provider_transactions')
        .select('type, amount, created_at')
        .eq('provider_id', pid)
        .eq('status', 'success'),
    ]);

    if (bookingsResult.status === 'fulfilled' && bookingsResult.value.data) {
      setUpcomingBookings(bookingsResult.value.data.map(b => ({
        id: b.id,
        appointmentCode: b.appointment_code,
        appointmentDate: b.appointment_date,
        appointmentTime: b.appointment_time,
        servicesRequested: b.services_requested || [],
        status: b.status,
        codeVerified: b.code_verified || false,
        clientBriefData: b.client_brief_data,
      })));
    }

    if (revenueResult.status === 'fulfilled' && revenueResult.value.data) {
      const txns = revenueResult.value.data;
      const todayTxns = txns.filter(t => t.created_at.startsWith(today));
      const monthTxns = txns.filter(t => t.created_at >= monthStart);
      const referralTxns = txns.filter(t => t.type === 'referral_fee');
      const regFee = txns.find(t => t.type === 'registration_fee');

      setRevenue({
        today: todayTxns.reduce((s, t) => s + parseFloat(t.amount || '0'), 0),
        month: monthTxns.reduce((s, t) => s + parseFloat(t.amount || '0'), 0),
        referralFees: referralTxns.reduce((s, t) => s + parseFloat(t.amount || '0'), 0),
        registrationFee: parseFloat(regFee?.amount || '0'),
      });
    }

    setLoading(false);
  }, []);

  // Real-time booking notifications
  useEffect(() => {
    if (!providerId) return;

    const ch = supabase.channel(`provider-bookings-${providerId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'provider_bookings',
        filter: `provider_id=eq.${providerId}`,
      }, (payload) => {
        const newBooking: Booking = {
          id: payload.new.id,
          appointmentCode: payload.new.appointment_code,
          appointmentDate: payload.new.appointment_date,
          appointmentTime: payload.new.appointment_time,
          servicesRequested: payload.new.services_requested || [],
          status: payload.new.status,
          codeVerified: false,
          clientBriefData: payload.new.client_brief_data,
        };
        setNewBookingAlert(newBooking);
        setUpcomingBookings(prev => [newBooking, ...prev]);
        // Auto-dismiss after 8 seconds
        setTimeout(() => setNewBookingAlert(null), 8000);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'provider_bookings',
        filter: `provider_id=eq.${providerId}`,
      }, () => {
        if (providerId) loadData(providerId);
      })
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [providerId, loadData]);

  // Provider voice agent
  useEffect(() => {
    if (!provider?.vapiAssistantId || !providerId) return;
    if (typeof window === 'undefined') return;
    if (!process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY) return;

        const currentProvider = provider;
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
        });
        vapi.on('error', () => setVoiceState('idle'));

        await vapi.start(currentProvider.vapiAssistantId!, {
          metadata: {
            providerId,
            businessName: currentProvider.businessName,
            upcomingBookings: upcomingBookings.length,
            context: 'provider_dashboard',
          },
        });
      } catch (err) {
        console.error('Provider Vapi error:', err);
      }
    }

    initVapi();
    return () => { if (vapi) vapi.stop(); };
  }, [provider, providerId, upcomingBookings.length]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.midnight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingPulse colour={C.roseGold} size={48} label="Loading your dashboard..." />
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const todayBookings = upcomingBookings.filter(b => b.appointmentDate === today);
  const futureBookings = upcomingBookings.filter(b => b.appointmentDate > today);

  return (
    <div style={{ minHeight: '100vh', background: C.midnight, fontFamily: 'Inter, system-ui, sans-serif', color: C.white }}>

      {/* New booking alert */}
      {newBookingAlert && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 999,
            background: C.solarGold,
            color: C.midnight,
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            animation: 'fade-in-up 300ms ease-out',
          }}
        >
          <div>
            <div style={{ fontSize: 13, fontWeight: 800 }}>🔔 New Booking — {newBookingAlert.appointmentDate} at {newBookingAlert.appointmentTime}</div>
            <div style={{ fontSize: 11, marginTop: 2 }}>
              Code: <strong style={{ fontFamily: 'JetBrains Mono, monospace' }}>{newBookingAlert.appointmentCode}</strong>
              {' · '}{newBookingAlert.servicesRequested.join(', ')}
            </div>
          </div>
          <button onClick={() => setNewBookingAlert(null)} style={{ background: 'none', border: 'none', color: C.midnight, cursor: 'pointer', fontSize: 18, padding: 0 }}>✕</button>
        </div>
      )}

      {/* Header */}
      <div style={{ background: C.bgPanel, borderBottom: `1px solid ${C.border}`, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.roseGold }}>{provider?.businessName}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
         <StatusBadge status={provider?.verified ? 'operational' : 'busy'} label={provider?.verified ? 'Verified' : 'Pending Verification'} size="sm" />
            <span style={{ fontSize: 9, color: C.textMuted, textTransform: 'capitalize' }}>{provider?.subscriptionTier} Plan</span>
            {provider?.featured && <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 9999, background: `${C.warmGold}22`, color: C.warmGold, fontWeight: 700 }}>FEATURED</span>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <VoiceWaveform state={voiceState} colour={C.roseGold} barCount={5} height={18} />
          <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: C.white }}>{'★'.repeat(Math.round(provider?.rating || 0))} {(provider?.rating || 0).toFixed(1)}</div>
            <div style={{ fontSize: 9, color: C.textMuted }}>{provider?.totalBookings} total bookings</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Revenue KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {[
            { label: 'Revenue Today', value: fmtCurrency(revenue.today), colour: C.roseGold },
            { label: 'Revenue This Month', value: fmtCurrency(revenue.month), colour: C.warmGold },
            { label: 'Total Referral Fees', value: fmtCurrency(revenue.referralFees), colour: C.solarGold },
            { label: "Today's Bookings", value: todayBookings.length.toString(), colour: C.online },
          ].map(m => (
            <div key={m.label} style={{ background: C.bgPanel, border: `1px solid ${C.border}`, borderTop: `2px solid ${m.colour}`, borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: m.colour, fontVariantNumeric: 'tabular-nums' }}>{m.value}</div>
              <div style={{ fontSize: 9, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 3 }}>{m.label}</div>
            </div>
          ))}
        </div>

        {/* Today's bookings */}
        <div style={{ background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.roseGold, marginBottom: 12 }}>
            Today's Appointments ({todayBookings.length})
          </div>
          {todayBookings.length === 0 ? (
            <div style={{ fontSize: 11, color: C.textMuted, fontStyle: 'italic', padding: '8px 0' }}>No appointments today yet</div>
          ) : todayBookings.map(booking => (
            <div
              key={booking.id}
              style={{
                display: 'grid',
                gridTemplateColumns: 'auto 1fr auto auto',
                gap: 14,
                alignItems: 'center',
                padding: '10px 12px',
                background: booking.codeVerified ? `${C.online}10` : C.bgCard,
                border: `1px solid ${booking.codeVerified ? C.online + '44' : C.border}`,
                borderRadius: 8,
                marginBottom: 6,
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 900, color: C.warmGold, fontFamily: 'JetBrains Mono, monospace' }}>
                {booking.appointmentTime}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.white, marginBottom: 2 }}>
                  {booking.servicesRequested.join(', ')}
                </div>
                <div style={{ fontSize: 9, color: C.textMuted, fontFamily: 'JetBrains Mono, monospace' }}>
                  Code: {booking.appointmentCode}
                </div>
              </div>
              <StatusBadge
                status={booking.codeVerified ? 'online' : 'busy'}
                label={booking.codeVerified ? 'Arrived' : 'Confirmed'}
                size="sm"
              />
              <button
                onClick={() => router.push(`/provider/brief/${booking.id}`)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  background: 'transparent',
                  border: `1px solid ${C.roseGold}`,
                  color: C.roseGold,
                  fontSize: 10,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Brief
              </button>
            </div>
          ))}
        </div>

        {/* Upcoming bookings */}
        {futureBookings.length > 0 && (
          <div style={{ background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.roseGold, marginBottom: 12 }}>
              Upcoming ({futureBookings.length})
            </div>
            {futureBookings.slice(0, 5).map(booking => (
              <div
                key={booking.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '100px 1fr auto',
                  gap: 12,
                  alignItems: 'center',
                  padding: '8px 10px',
                  background: C.bgCard,
                  border: `1px solid ${C.border}`,
                  borderRadius: 7,
                  marginBottom: 5,
                }}
              >
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.white }}>{fmtDate(booking.appointmentDate)}</div>
                  <div style={{ fontSize: 10, color: C.warmGold }}>{booking.appointmentTime}</div>
                </div>
                <div style={{ fontSize: 11, color: C.textSec }}>{booking.servicesRequested.join(', ')}</div>
                <button
                  onClick={() => router.push(`/provider/brief/${booking.id}`)}
                  style={{ padding: '5px 10px', borderRadius: 5, background: 'transparent', border: `1px solid ${C.border}`, color: C.textMuted, fontSize: 9, fontWeight: 600, cursor: 'pointer' }}
                >
                  View
                </button>
              </div>
            ))}
            {futureBookings.length > 5 && (
              <div style={{ fontSize: 10, color: C.textMuted, textAlign: 'center', marginTop: 8, cursor: 'pointer' }} onClick={() => router.push('/provider/bookings')}>
                View all {futureBookings.length} bookings →
              </div>
            )}
          </div>
        )}

        {/* Voice panel */}
        <div style={{ background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.roseGold, marginBottom: 8 }}>
            Your CUTEME Voice Agent
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <VoiceWaveform state={voiceState} colour={C.roseGold} />
            <div>
              <div style={{ fontSize: 12, color: C.textSec, lineHeight: 1.6 }}>
                {voiceState === 'idle' ? 'Your CUTEME agent is ready. Speak to manage bookings, check your schedule or update your availability.'
                  : voiceState === 'speaking' ? 'Your agent is speaking...'
                  : voiceState === 'listening' ? 'Your agent is listening...'
                  : 'Your agent is processing...'}
              </div>
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[
            { label: 'All Bookings', href: '/provider/bookings' },
            { label: 'My Profile', href: '/provider/profile' },
            { label: 'Revenue', href: '/provider/revenue' },
          ].map(link => (
            <button
              key={link.label}
              onClick={() => router.push(link.href)}
              style={{
                padding: '10px',
                borderRadius: 8,
                background: C.bgCard,
                border: `1px solid ${C.border}`,
                color: C.textSec,
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 150ms',
              }}
            >
              {link.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
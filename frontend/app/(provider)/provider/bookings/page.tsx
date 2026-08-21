// FILE: precci/frontend/app/(provider)/provider/bookings/page.tsx
'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import BookingCard from '../../../components/provider/BookingCard';
import ClientBriefPanel from '../../../components/provider/ClientBriefPanel';
import CodeVerifier from '../../../components/provider/CodeVerifier';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const C = {
  roseGold: '#C4A494', midnight: '#1A0A0F', bgPanel: '#2a1a1f',
  bgCard: '#221218', border: '#4a2a2f', textSec: '#d4b8b0',
  textMuted: '#8a6a6a', online: '#22c55e', solarGold: '#F5A623',
  white: '#FFFFFF', warmGold: '#D4A853',
};

export default function ProviderBookingsPage() {
  const router = useRouter();
  const [providerId, setProviderId] = useState<string | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'upcoming' | 'today' | 'past' | 'all'>('upcoming');
  const [selectedBrief, setSelectedBrief] = useState<any | null>(null);
  const [showVerifier, setShowVerifier] = useState(false);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { router.push('/provider/login'); return; }
      const { data: provider } = await supabase
        .from('service_providers').select('id').eq('email', session.user.email).single();
      if (!provider) { router.push('/connect'); return; }
      setProviderId(provider.id);
    }
    init();
  }, [router]);

  const loadBookings = useCallback(async (pid: string) => {
    const { data } = await supabase
      .from('provider_bookings')
      .select(`id, appointment_code, appointment_date, appointment_time,
        services_requested, status, code_verified, code_verified_at,
        referral_fee_amount, precci_analysis_summary, client_brief_data, created_at`)
      .eq('provider_id', pid)
      .order('appointment_date', { ascending: false })
      .order('appointment_time', { ascending: false })
      .limit(100);

    setBookings((data || []).map(b => ({
      id: b.id, appointmentCode: b.appointment_code,
      appointmentDate: b.appointment_date, appointmentTime: b.appointment_time,
      servicesRequested: b.services_requested || [], status: b.status,
      codeVerified: b.code_verified || false, codeVerifiedAt: b.code_verified_at,
      referralFeeAmount: parseFloat(b.referral_fee_amount || '0'),
      preccAnalysisSummary: b.precci_analysis_summary,
      clientBriefData: b.client_brief_data,
    })));
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!providerId) return;
    loadBookings(providerId);
    const ch = supabase.channel(`prov-bookings-${providerId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'provider_bookings', filter: `provider_id=eq.${providerId}` },
        () => loadBookings(providerId))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [providerId, loadBookings]);

  const today = new Date().toISOString().split('T')[0];
  const filtered = bookings.filter(b => {
    if (activeFilter === 'today') return b.appointmentDate === today;
    if (activeFilter === 'upcoming') return b.appointmentDate >= today && b.status !== 'cancelled';
    if (activeFilter === 'past') return b.appointmentDate < today || b.status === 'cancelled';
    return true;
  });

  const counts = {
    upcoming: bookings.filter(b => b.appointmentDate >= today && b.status !== 'cancelled').length,
    today: bookings.filter(b => b.appointmentDate === today).length,
    past: bookings.filter(b => b.appointmentDate < today || b.status === 'cancelled').length,
    all: bookings.length,
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: C.midnight, fontFamily: 'Inter, system-ui, sans-serif', color: C.white }}>

      {/* Header */}
      <div style={{ padding: '14px 20px', background: C.bgPanel, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.roseGold }}>My Bookings</div>
            <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>{bookings.length} total bookings</div>
          </div>
          <button onClick={() => setShowVerifier(v => !v)} style={{
            padding: '8px 16px', borderRadius: 8, background: C.solarGold,
            border: 'none', color: C.midnight, fontSize: 11, fontWeight: 700, cursor: 'pointer',
          }}>
            {showVerifier ? 'Hide' : '+ Verify Code'}
          </button>
        </div>

        {/* Code verifier inline */}
        {showVerifier && providerId && (
          <div style={{ marginTop: 12 }}>
            <CodeVerifier
              providerId={providerId}
              onVerified={(data) => { setShowVerifier(false); loadBookings(providerId); }}
            />
          </div>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 6, padding: '10px 20px', borderBottom: `1px solid ${C.border}`, background: C.bgCard, flexShrink: 0 }}>
        {(['upcoming', 'today', 'past', 'all'] as const).map(f => (
          <button key={f} onClick={() => setActiveFilter(f)} style={{
            padding: '5px 14px', borderRadius: 9999,
            background: activeFilter === f ? C.roseGold : 'transparent',
            border: `1px solid ${activeFilter === f ? C.roseGold : C.border}`,
            color: activeFilter === f ? C.midnight : C.textMuted,
            fontSize: 10, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize',
          }}>
            {f} ({counts[f]})
          </button>
        ))}
      </div>

      {/* Booking list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 20px' }}>
        {loading ? (
          <div style={{ fontSize: 13, color: C.textMuted, padding: 20 }}>Loading bookings...</div>
        ) : filtered.length === 0 ? (
          <div style={{ fontSize: 13, color: C.textMuted, fontStyle: 'italic', padding: 20 }}>No {activeFilter} bookings</div>
        ) : filtered.map(booking => (
          <BookingCard
            key={booking.id}
            booking={booking}
            onViewBrief={(id) => setSelectedBrief(bookings.find(b => b.id === id))}
            onVerifyCode={(id) => setShowVerifier(true)}
          />
        ))}
      </div>

      {/* Client brief modal */}
      {selectedBrief && (
        <ClientBriefPanel
          bookingId={selectedBrief.id}
          appointmentCode={selectedBrief.appointmentCode}
          appointmentDate={selectedBrief.appointmentDate}
          appointmentTime={selectedBrief.appointmentTime}
          servicesRequested={selectedBrief.servicesRequested}
          preccAnalysisSummary={selectedBrief.preccAnalysisSummary}
          clientBriefData={selectedBrief.clientBriefData}
          codeVerified={selectedBrief.codeVerified}
          onClose={() => setSelectedBrief(null)}
        />
      )}
    </div>
  );
}
// FILE: precci/frontend/app/(pwa)/appointment/page.tsx
// CUTEME LTD — My Appointments Page
// Shows all client bookings with appointment codes.
// Real data from provider_bookings table.
// Upcoming, completed, cancelled.
// Brook available by voice for new bookings.

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import AgentAvatar from '../../components/ui/AgentAvatar';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingPulse from '../../components/ui/LoadingPulse';

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
  error: '#ef4444',
  white: '#FFFFFF',
};

interface Booking {
  id: string;
  appointmentCode: string;
  appointmentDate: string;
  appointmentTime: string;
  servicesRequested: string[];
  status: string;
  codeVerified: boolean;
  codeVerifiedAt: string | null;
  createdAt: string;
  provider?: {
    businessName: string;
    address: string;
    city: string;
  };
}

export default function AppointmentPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { router.push('/'); return; }
      setUserId(session.user.id);

      await loadBookings(session.user.id);
    }
    init();
  }, [router]);

  async function loadBookings(uid: string) {
    setLoading(true);
    const { data } = await supabase
      .from('provider_bookings')
      .select(`
        id, appointment_code, appointment_date, appointment_time,
        services_requested, status, code_verified, code_verified_at,
        created_at, provider_id
      `)
      .eq('client_user_id', uid)
      .order('appointment_date', { ascending: false });

    if (data) {
      // Load provider details for each booking
      const bookingsWithProviders = await Promise.all(
        data.map(async b => {
          const { data: provider } = await supabase
            .from('service_providers')
            .select('business_name, address, city')
            .eq('id', b.provider_id)
            .single();

          return {
            id: b.id,
            appointmentCode: b.appointment_code,
            appointmentDate: b.appointment_date,
            appointmentTime: b.appointment_time,
            servicesRequested: b.services_requested || [],
            status: b.status,
            codeVerified: b.code_verified || false,
            codeVerifiedAt: b.code_verified_at,
            createdAt: b.created_at,
            provider: provider ? {
              businessName: provider.business_name,
              address: provider.address,
              city: provider.city,
            } : undefined,
          };
        })
      );
      setBookings(bookingsWithProviders);
    }
    setLoading(false);
  }

  // Real-time updates
  useEffect(() => {
    if (!userId) return;
    const ch = supabase.channel(`appointments-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'provider_bookings', filter: `client_user_id=eq.${userId}` }, () => {
        loadBookings(userId);
      })
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [userId]);

  const today = new Date().toISOString().split('T')[0];
  const upcoming = bookings.filter(b => b.appointmentDate >= today && b.status !== 'cancelled');
  const past = bookings.filter(b => b.appointmentDate < today || b.status === 'cancelled');

  function fmtDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  }

  if (loading) {
    return (
      <div style={{ height: '100dvh', background: C.midnight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingPulse colour={C.solarGold} size={48} label="Loading your appointments..." />
      </div>
    );
  }

  return (
    <div style={{ height: '100dvh', background: C.midnight, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '14px 18px', background: C.bgPanel, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer', fontSize: 18, padding: 0 }}>←</button>
        <AgentAvatar pcId="PC-027" size="md" status="online" showStatus />
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.solarGold }}>My Appointments</div>
          <div style={{ fontSize: 10, color: C.textMuted }}>{bookings.length} total booking{bookings.length !== 1 ? 's' : ''}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        {[
          { id: 'upcoming' as const, label: `Upcoming (${upcoming.length})` },
          { id: 'past' as const, label: `Past (${past.length})` },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1, padding: '10px', background: 'none', border: 'none',
              borderBottom: `2px solid ${activeTab === tab.id ? C.solarGold : 'transparent'}`,
              color: activeTab === tab.id ? C.solarGold : C.textMuted,
              cursor: 'pointer', fontSize: 11, fontWeight: 600, transition: 'all 200ms',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bookings list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
        {(activeTab === 'upcoming' ? upcoming : past).length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 32, opacity: 0.3 }}>📅</div>
            <div style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.7 }}>
              {activeTab === 'upcoming'
                ? 'No upcoming appointments.\nAsk Brook to book you in after your next session.'
                : 'No past appointments yet.'}
            </div>
          </div>
        ) : (activeTab === 'upcoming' ? upcoming : past).map(booking => (
          <div
            key={booking.id}
            style={{
              background: C.bgPanel,
              border: `1px solid ${booking.codeVerified ? `${C.online}44` : C.border}`,
              borderRadius: 14,
              padding: '14px 16px',
              marginBottom: 12,
            }}
          >
            {/* Status + Date */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.white, marginBottom: 3 }}>
                  {fmtDate(booking.appointmentDate)}
                </div>
                <div style={{ fontSize: 12, color: C.textSec }}>{booking.appointmentTime}</div>
              </div>
              <StatusBadge
                status={
                  booking.status === 'cancelled' ? 'offline'
                  : booking.codeVerified ? 'online'
                  : booking.status === 'confirmed' ? 'busy'
                  : 'online'
                }
                label={
                  booking.status === 'cancelled' ? 'Cancelled'
                  : booking.codeVerified ? 'Attended'
                  : 'Confirmed'
                }
                size="sm"
              />
            </div>

            {/* Provider */}
            {booking.provider && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.solarGold }}>
                  {booking.provider.businessName}
                </div>
                <div style={{ fontSize: 10, color: C.textMuted }}>
                  {booking.provider.address}, {booking.provider.city}
                </div>
              </div>
            )}

            {/* Services */}
            {booking.servicesRequested.length > 0 && (
              <div style={{ marginBottom: 12, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {booking.servicesRequested.map(s => (
                  <span key={s} style={{ padding: '2px 8px', borderRadius: 9999, background: `${C.solarGold}20`, border: `1px solid ${C.solarGold}44`, fontSize: 9, color: C.solarGold, fontWeight: 600 }}>
                    {s}
                  </span>
                ))}
              </div>
            )}

            {/* Appointment Code */}
            {!booking.codeVerified && booking.status !== 'cancelled' && (
              <div
                style={{
                  padding: '12px',
                  background: C.bgCard,
                  border: `2px solid ${C.solarGold}`,
                  borderRadius: 10,
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 9, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                  Show this code when you arrive
                </div>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 900,
                    color: C.solarGold,
                    fontFamily: 'JetBrains Mono, monospace',
                    letterSpacing: '0.2em',
                  }}
                >
                  {booking.appointmentCode}
                </div>
              </div>
            )}

            {/* Verified stamp */}
            {booking.codeVerified && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: `${C.online}10`, border: `1px solid ${C.online}33`, borderRadius: 8 }}>
                <span style={{ color: C.online, fontSize: 14 }}>✓</span>
                <span style={{ fontSize: 10, color: C.online, fontWeight: 600 }}>
                  Code verified{booking.codeVerifiedAt ? ` · ${new Date(booking.codeVerifiedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}` : ''}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Book again */}
      <div style={{ padding: '10px 16px', background: C.bgPanel, borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
        <div style={{ fontSize: 10, color: C.textMuted, textAlign: 'center', fontStyle: 'italic' }}>
          Return to your session and ask Brook to book another appointment
        </div>
      </div>
    </div>
  );
}
// FILE: precci/frontend/app/(pwa)/booking/confirmation/page.tsx
'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const C = {
  roseGold: '#C4A494', solarGold: '#F5A623', midnight: '#1A0A0F',
  bgPanel: '#2a1a1f', bgCard: '#221218', border: '#4a2a2f',
  textSec: '#d4b8b0', textMuted: '#8a6a6a', online: '#22c55e',
  white: '#FFFFFF', warmGold: '#D4A853',
};

export default function BookingConfirmationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = searchParams.get('bookingId');
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookingId) { router.push('/'); return; }
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { router.push('/'); return; }

      const { data } = await supabase
        .from('provider_bookings')
        .select(`id, appointment_code, appointment_date, appointment_time,
          services_requested, status, appointment_code_expires_at,
          service_providers (business_name, address, city, phone)`)
        .eq('id', bookingId)
        .eq('client_user_id', session.user.id)
        .single();

      setBooking(data);
      setLoading(false);
    }
    load();
  }, [bookingId, router]);

  if (loading) {
    return (
      <div style={{ height: '100dvh', background: C.midnight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textMuted, fontFamily: 'Inter, sans-serif' }}>
        Loading your booking...
      </div>
    );
  }

  if (!booking) {
    return (
      <div style={{ height: '100dvh', background: C.midnight, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 28, textAlign: 'center', fontFamily: 'Inter, sans-serif', color: '#FFFFFF' }}>
        <div style={{ fontSize: 32, opacity: 0.3 }}>📅</div>
        <div style={{ fontSize: 14, color: C.textMuted }}>Booking not found</div>
        <button onClick={() => router.push('/')} style={{ padding: '10px 24px', borderRadius: 9999, background: C.roseGold, border: 'none', color: C.midnight, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
          Back to Home
        </button>
      </div>
    );
  }

  const provider = booking.service_providers;

  return (
    <div style={{ height: '100dvh', background: C.midnight, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 28, fontFamily: 'Inter, system-ui, sans-serif', color: C.white, textAlign: 'center', gap: 20 }}>

      <div style={{ fontSize: 40 }}>✅</div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.solarGold, marginBottom: 6 }}>Appointment Confirmed</div>
        <div style={{ fontSize: 13, color: C.textSec }}>Brook has notified your provider</div>
      </div>

      {/* Provider info */}
      {provider && (
        <div style={{ background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 20px', width: '100%', maxWidth: 360 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.solarGold, marginBottom: 4 }}>{provider.business_name}</div>
          <div style={{ fontSize: 11, color: C.textMuted }}>{provider.address}, {provider.city}</div>
          {provider.phone && <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{provider.phone}</div>}
        </div>
      )}

      {/* Date and time */}
      <div style={{ background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 20px', width: '100%', maxWidth: 360 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 10, color: C.textMuted }}>Date</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: C.white }}>
            {new Date(booking.appointment_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 10, color: C.textMuted }}>Time</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: C.white }}>{booking.appointment_time}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 10, color: C.textMuted }}>Services</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: C.white }}>{(booking.services_requested || []).join(', ')}</span>
        </div>
      </div>

      {/* Appointment code */}
      <div style={{ padding: '20px 32px', background: C.bgCard, border: `2px solid ${C.solarGold}`, borderRadius: 16, boxShadow: `0 0 30px ${C.solarGold}22`, width: '100%', maxWidth: 360 }}>
        <div style={{ fontSize: 10, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Your Appointment Code</div>
        <div style={{ fontSize: 40, fontWeight: 900, color: C.solarGold, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.2em' }}>
          {booking.appointment_code}
        </div>
        <div style={{ fontSize: 10, color: C.textMuted, marginTop: 8 }}>Show this to the provider when you arrive</div>
      </div>

      <button onClick={() => router.push('/')} style={{
        padding: '13px 36px', borderRadius: 9999, background: C.roseGold,
        border: 'none', color: C.midnight, fontSize: 13, fontWeight: 700, cursor: 'pointer',
      }}>
        Back to Session
      </button>
    </div>
  );
}
// FILE: precci/frontend/app/(provider)/provider/brief/[bookingId]/page.tsx
// CUTEME LTD — Provider Client Brief Page
// Shows the full client brief for a specific booking.
// Includes PRECCI analysis, services needed, appointment code.
// Provider verifies code here when client arrives.
// Real data from provider_bookings. Appointment code single-use.

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import LoadingPulse from '../../../../components/ui/LoadingPulse';
import StatusBadge from '../../../../components/ui/StatusBadge';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const C = {
  roseGold: '#C4A494',
  solarGold: '#F5A623',
  midnight: '#1A0A0F',
  bgPanel: '#2a1a1f',
  bgCard: '#221218',
  border: '#4a2a2f',
  textSec: '#d4b8b0',
  textMuted: '#8a6a6a',
  online: '#22c55e',
  error: '#ef4444',
  warning: '#eab308',
  white: '#FFFFFF',
};

interface BookingBrief {
  id: string;
  appointmentCode: string;
  appointmentDate: string;
  appointmentTime: string;
  servicesRequested: string[];
  status: string;
  codeVerified: boolean;
  codeVerifiedAt: string | null;
  appointmentCodeExpiresAt: string | null;
  preccAnalysisSummary: string | null;
  clientBriefData: any;
}

export default function ClientBriefPage() {
  const router = useRouter();
  const params = useParams();
  const bookingId = params.bookingId as string;

  const [booking, setBooking] = useState<BookingBrief | null>(null);
  const [providerId, setProviderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { router.push('/provider/login'); return; }

      // Get provider by email
      const { data: providerData } = await supabase
        .from('service_providers')
        .select('id')
        .eq('email', session.user.email)
        .single();

      if (!providerData) { router.push('/connect'); return; }
      setProviderId(providerData.id);

      // Load booking brief
      const { data: bookingData } = await supabase
        .from('provider_bookings')
        .select(`
          id, appointment_code, appointment_date, appointment_time,
          services_requested, status, code_verified, code_verified_at,
          appointment_code_expires_at, precci_analysis_summary, client_brief_data
        `)
        .eq('id', bookingId)
        .eq('provider_id', providerData.id) // Security: only own bookings
        .single();

      if (bookingData) {
        setBooking({
          id: bookingData.id,
          appointmentCode: bookingData.appointment_code,
          appointmentDate: bookingData.appointment_date,
          appointmentTime: bookingData.appointment_time,
          servicesRequested: bookingData.services_requested || [],
          status: bookingData.status,
          codeVerified: bookingData.code_verified || false,
          codeVerifiedAt: bookingData.code_verified_at,
          appointmentCodeExpiresAt: bookingData.appointment_code_expires_at,
          preccAnalysisSummary: bookingData.precci_analysis_summary,
          clientBriefData: bookingData.client_brief_data,
        });
      }

      setLoading(false);
    }

    init();
  }, [bookingId, router]);

  async function handleVerifyCode() {
    if (!verifyCode.trim() || !providerId || verifying) return;
    if (verifyCode.trim().toUpperCase() !== booking?.appointmentCode) {
      setVerifyError('Code does not match. Please check and try again.');
      return;
    }

    setVerifying(true);
    setVerifyError('');

    try {
      const response = await fetch('/api/bookings/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentCode: verifyCode.trim().toUpperCase(),
          providerId,
        }),
      });

      const result = await response.json();

      if (result.verified) {
        setVerified(true);
        setBooking(prev => prev ? { ...prev, codeVerified: true, codeVerifiedAt: new Date().toISOString() } : null);
      } else {
        setVerifyError(result.reason === 'code_expired' ? 'This code has expired.' : result.message || 'Verification failed.');
      }
    } catch (err) {
      setVerifyError('Network error. Please try again.');
    } finally {
      setVerifying(false);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.midnight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingPulse colour={C.roseGold} size={48} label="Loading client brief..." />
      </div>
    );
  }

  if (!booking) {
    return (
      <div style={{ minHeight: '100vh', background: C.midnight, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 32, opacity: 0.4 }}>📋</div>
        <div style={{ fontSize: 14, color: C.textMuted }}>Booking not found or you don't have access to this brief.</div>
        <button onClick={() => router.push('/provider/dashboard')} style={{ padding: '10px 20px', borderRadius: 8, background: C.roseGold, color: C.midnight, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  const isExpired = booking.appointmentCodeExpiresAt && new Date(booking.appointmentCodeExpiresAt) < new Date();

  return (
    <div style={{ minHeight: '100vh', background: C.midnight, fontFamily: 'Inter, system-ui, sans-serif', color: C.white }}>

      {/* Header */}
      <div style={{ background: C.bgPanel, borderBottom: `1px solid ${C.border}`, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer', fontSize: 18, padding: 0 }}>←</button>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.roseGold }}>Client Brief</div>
          <div style={{ fontSize: 10, color: C.textMuted }}>
            {booking.appointmentDate} · {booking.appointmentTime}
          </div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <StatusBadge
            status={booking.codeVerified ? 'online' : isExpired ? 'offline' : 'busy'}
            label={booking.codeVerified ? 'Client Arrived' : isExpired ? 'Expired' : 'Awaiting Client'}
            size="sm"
          />
        </div>
      </div>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Code Verification (if not yet verified) */}
        {!booking.codeVerified && !isExpired && (
          <div style={{ background: C.bgPanel, border: `2px solid ${C.solarGold}`, borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.solarGold, marginBottom: 10 }}>
              Verify Client Appointment Code
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={verifyCode}
                onChange={e => { setVerifyCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')); setVerifyError(''); }}
                placeholder="Enter 8-character code"
                maxLength={8}
                style={{
                  flex: 1,
                  padding: '12px 14px',
                  background: C.bgCard,
                  border: `1px solid ${verifyError ? C.error : C.border}`,
                  borderRadius: 8,
                  color: C.white,
                  fontSize: 16,
                  fontFamily: 'JetBrains Mono, monospace',
                  fontWeight: 700,
                  letterSpacing: '0.15em',
                  outline: 'none',
                  textTransform: 'uppercase',
                }}
              />
              <button
                onClick={handleVerifyCode}
                disabled={verifyCode.length !== 8 || verifying}
                style={{
                  padding: '12px 20px',
                  borderRadius: 8,
                  background: verifyCode.length === 8 ? C.solarGold : `${C.solarGold}44`,
                  border: 'none',
                  color: C.midnight,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: verifyCode.length === 8 ? 'pointer' : 'not-allowed',
                  transition: 'all 150ms',
                  flexShrink: 0,
                }}
              >
                {verifying ? 'Checking...' : 'Verify'}
              </button>
            </div>
            {verifyError && <div style={{ fontSize: 11, color: C.error, marginTop: 6 }}>{verifyError}</div>}
            <div style={{ fontSize: 10, color: C.textMuted, marginTop: 6, lineHeight: 1.5 }}>
              Ask the client for their appointment code from the CUTEME app.
            </div>
          </div>
        )}

        {/* Verified confirmation */}
        {booking.codeVerified && (
          <div style={{ background: `${C.online}10`, border: `1px solid ${C.online}44`, borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>✅</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.online }}>Client Verified & Arrived</div>
              {booking.codeVerifiedAt && (
                <div style={{ fontSize: 10, color: C.textMuted }}>
                  {new Date(booking.codeVerifiedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Appointment Details */}
        <div style={{ background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.roseGold, marginBottom: 10 }}>
            Appointment Details
          </div>
          {[
            { label: 'Date', value: new Date(booking.appointmentDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) },
            { label: 'Time', value: booking.appointmentTime },
            { label: 'Services', value: booking.servicesRequested.join(', ') },
            { label: 'Code', value: booking.appointmentCode },
            { label: 'Status', value: booking.status },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', gap: 12, padding: '6px 0', borderBottom: `1px solid ${C.border}33` }}>
              <span style={{ fontSize: 10, color: C.textMuted, width: 60, flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.04em', paddingTop: 1 }}>{row.label}</span>
              <span style={{ fontSize: 11, color: C.textSec, fontFamily: row.label === 'Code' ? 'JetBrains Mono, monospace' : 'inherit', fontWeight: row.label === 'Code' ? 700 : 400 }}>{row.value}</span>
            </div>
          ))}
        </div>

        {/* PRECCI Analysis Summary */}
        {booking.preccAnalysisSummary && (
          <div style={{ background: C.bgPanel, border: `1px solid ${C.roseGold}33`, borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.roseGold, marginBottom: 8 }}>
              CUTEME Analysis — What to Prepare
            </div>
            <div style={{ fontSize: 12, color: C.textSec, lineHeight: 1.7 }}>
              {booking.preccAnalysisSummary}
            </div>
          </div>
        )}

        {/* Client Brief Data */}
        {booking.clientBriefData && (
          <div style={{ background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.roseGold, marginBottom: 8 }}>
              Full Client Brief
            </div>
            {Object.entries(booking.clientBriefData).map(([key, value]) => {
              if (!value || key === 'briefType' || key === 'bookingId') return null;
              return (
                <div key={key} style={{ display: 'flex', gap: 12, padding: '6px 0', borderBottom: `1px solid ${C.border}33` }}>
                  <span style={{ fontSize: 10, color: C.textMuted, width: 110, flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.04em', paddingTop: 1 }}>
                    {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').toLowerCase()}
                  </span>
                  <span style={{ fontSize: 11, color: C.textSec, lineHeight: 1.5 }}>
                    {Array.isArray(value) ? (value as string[]).join(', ') : String(value)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
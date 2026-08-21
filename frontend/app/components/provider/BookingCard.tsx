// FILE: precci/frontend/app/components/provider/BookingCard.tsx
'use client';

const C = {
  roseGold: '#C4A494', solarGold: '#F5A623', midnight: '#1A0A0F',
  bgPanel: '#2a1a1f', bgCard: '#221218', border: '#4a2a2f',
  textSec: '#d4b8b0', textMuted: '#8a6a6a', online: '#22c55e',
  error: '#ef4444', white: '#FFFFFF', warmGold: '#D4A853',
};

interface Booking {
  id: string;
  appointmentCode: string;
  appointmentDate: string;
  appointmentTime: string;
  servicesRequested: string[];
  status: string;
  codeVerified: boolean;
  codeVerifiedAt?: string;
  referralFeeAmount?: number;
  preccAnalysisSummary?: string;
}

interface BookingCardProps {
  booking: Booking;
  onViewBrief: (bookingId: string) => void;
  onVerifyCode: (bookingId: string) => void;
  compact?: boolean;
}

function fmtDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric'
  });
}

export default function BookingCard({
  booking, onViewBrief, onVerifyCode, compact = false
}: BookingCardProps) {
  const isToday = booking.appointmentDate === new Date().toISOString().split('T')[0];
  const statusColour = booking.status === 'cancelled' ? C.error
    : booking.codeVerified ? C.online
    : booking.status === 'confirmed' ? C.solarGold
    : C.warmGold;

  const statusLabel = booking.status === 'cancelled' ? 'Cancelled'
    : booking.codeVerified ? 'Attended'
    : booking.status === 'arrived' ? 'Arrived'
    : 'Confirmed';

  if (compact) {
    return (
      <div style={{
        background: C.bgCard, border: `1px solid ${C.border}`,
        borderLeft: `3px solid ${statusColour}`, borderRadius: 7,
        padding: '8px 12px', marginBottom: 6,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.white }}>
            {fmtDate(booking.appointmentDate)} · {booking.appointmentTime}
          </div>
          <span style={{
            fontSize: 8, padding: '2px 7px', borderRadius: 9999,
            background: statusColour + '20', color: statusColour,
            border: `1px solid ${statusColour}44`, fontWeight: 700,
          }}>{statusLabel}</span>
        </div>
        <div style={{ fontSize: 10, color: C.textSec, marginBottom: 4 }}>
          {booking.servicesRequested?.join(', ')}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{
            fontSize: 9, color: C.solarGold,
            fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
          }}>{booking.appointmentCode}</span>
          <button
            onClick={() => onViewBrief(booking.id)}
            style={{
              padding: '3px 10px', borderRadius: 5, background: 'transparent',
              border: `1px solid ${C.roseGold}`, color: C.roseGold,
              fontSize: 9, fontWeight: 600, cursor: 'pointer',
            }}>Brief</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: C.bgPanel,
      border: `1px solid ${booking.codeVerified ? C.online + '44' : C.border}`,
      borderLeft: `4px solid ${statusColour}`,
      borderRadius: 12, padding: '14px 16px', marginBottom: 10,
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.white }}>
              {fmtDate(booking.appointmentDate)}
            </div>
            {isToday && (
              <span style={{ fontSize: 8, padding: '2px 6px', borderRadius: 9999, background: C.solarGold + '22', color: C.solarGold, fontWeight: 700 }}>TODAY</span>
            )}
          </div>
          <div style={{ fontSize: 12, color: C.warmGold, fontWeight: 600 }}>{booking.appointmentTime}</div>
        </div>
        <span style={{
          fontSize: 9, padding: '4px 10px', borderRadius: 9999,
          background: statusColour + '18', color: statusColour,
          border: `1px solid ${statusColour}44`, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.05em',
        }}>{statusLabel}</span>
      </div>

      {/* Services */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 9, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Services</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {(booking.servicesRequested || []).map(s => (
            <span key={s} style={{
              padding: '2px 8px', borderRadius: 9999,
              background: C.roseGold + '18', border: `1px solid ${C.roseGold}44`,
              fontSize: 10, color: C.roseGold, fontWeight: 500,
            }}>{s}</span>
          ))}
        </div>
      </div>

      {/* PRECCI analysis preview */}
      {booking.preccAnalysisSummary && (
        <div style={{
          padding: '8px 10px', background: C.roseGold + '08',
          border: `1px solid ${C.roseGold}22`, borderRadius: 6, marginBottom: 10,
          fontSize: 10, color: C.textSec, lineHeight: 1.5,
        }}>
          <div style={{ fontSize: 8, color: C.roseGold, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>CUTEME Analysis</div>
          {booking.preccAnalysisSummary.substring(0, 120)}
          {booking.preccAnalysisSummary.length > 120 ? '...' : ''}
        </div>
      )}

      {/* Appointment code */}
      {!booking.codeVerified && booking.status !== 'cancelled' && (
        <div style={{
          padding: '10px', background: C.bgCard,
          border: `2px solid ${C.solarGold}`, borderRadius: 8,
          textAlign: 'center', marginBottom: 10,
        }}>
          <div style={{ fontSize: 8, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Appointment Code</div>
          <div style={{
            fontSize: 24, fontWeight: 900, color: C.solarGold,
            fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.2em',
          }}>{booking.appointmentCode}</div>
          <div style={{ fontSize: 8.5, color: C.textMuted, marginTop: 3 }}>Ask client to show this code</div>
        </div>
      )}

      {/* Verified stamp */}
      {booking.codeVerified && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 10px', background: C.online + '10',
          border: `1px solid ${C.online}33`, borderRadius: 7, marginBottom: 10,
        }}>
          <span style={{ color: C.online, fontSize: 14 }}>✓</span>
          <div>
            <div style={{ fontSize: 10, color: C.online, fontWeight: 600 }}>Client Verified & Arrived</div>
            {booking.codeVerifiedAt && (
              <div style={{ fontSize: 8, color: C.textMuted }}>
                {new Date(booking.codeVerifiedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => onViewBrief(booking.id)}
          style={{
            flex: 1, padding: '9px', borderRadius: 8,
            background: 'transparent', border: `1px solid ${C.roseGold}`,
            color: C.roseGold, fontSize: 11, fontWeight: 600, cursor: 'pointer',
          }}>View Full Brief</button>
        {!booking.codeVerified && booking.status !== 'cancelled' && (
          <button
            onClick={() => onVerifyCode(booking.id)}
            style={{
              flex: 1, padding: '9px', borderRadius: 8,
              background: C.solarGold, border: 'none',
              color: C.midnight, fontSize: 11, fontWeight: 700, cursor: 'pointer',
            }}>Verify Code</button>
        )}
      </div>

      {/* Fee */}
      {booking.referralFeeAmount && (
        <div style={{ fontSize: 9, color: C.textMuted, marginTop: 8, textAlign: 'right' }}>
          Referral fee: <span style={{ color: C.error }}>-${Number(booking.referralFeeAmount).toFixed(2)}</span>
        </div>
      )}
    </div>
  );
}
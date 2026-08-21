// FILE: precci/frontend/app/components/provider/ClientBriefPanel.tsx
'use client';

const C = {
  roseGold: '#C4A494', solarGold: '#F5A623', midnight: '#1A0A0F',
  bgPanel: '#2a1a1f', bgCard: '#221218', border: '#4a2a2f',
  textSec: '#d4b8b0', textMuted: '#8a6a6a', online: '#22c55e',
  white: '#FFFFFF', warmGold: '#D4A853',
};

interface ClientBriefPanelProps {
  bookingId: string;
  appointmentCode: string;
  appointmentDate: string;
  appointmentTime: string;
  servicesRequested: string[];
  preccAnalysisSummary?: string;
  clientBriefData?: Record<string, any>;
  codeVerified: boolean;
  onClose: () => void;
}

export default function ClientBriefPanel({
  bookingId, appointmentCode, appointmentDate, appointmentTime,
  servicesRequested, preccAnalysisSummary, clientBriefData,
  codeVerified, onClose,
}: ClientBriefPanelProps) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: 'rgba(26, 10, 15, 0.92)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }} onClick={onClose}>
      <div
        style={{
          background: C.bgPanel, border: `1px solid ${C.border}`,
          borderRadius: 16, width: '100%', maxWidth: 520,
          maxHeight: '90vh', overflowY: 'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px', borderBottom: `1px solid ${C.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          position: 'sticky', top: 0, background: C.bgPanel, zIndex: 1,
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.roseGold }}>Client Brief</div>
            <div style={{ fontSize: 10, color: C.textMuted }}>
              {new Date(appointmentDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} · {appointmentTime}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer', fontSize: 20 }}>✕</button>
        </div>

        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Appointment Code */}
          <div style={{ padding: '14px', background: C.bgCard, border: `2px solid ${C.solarGold}`, borderRadius: 10, textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Appointment Code</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: codeVerified ? C.online : C.solarGold, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.2em' }}>
              {appointmentCode}
            </div>
            {codeVerified && <div style={{ fontSize: 10, color: C.online, marginTop: 4 }}>✓ Verified — Client Arrived</div>}
          </div>

          {/* Services */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: C.roseGold, marginBottom: 8 }}>Services Requested</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {servicesRequested.map(s => (
                <span key={s} style={{ padding: '4px 12px', borderRadius: 9999, background: C.roseGold + '18', border: `1px solid ${C.roseGold}44`, fontSize: 11, color: C.roseGold, fontWeight: 500 }}>{s}</span>
              ))}
            </div>
          </div>

          {/* PRECCI Analysis */}
          {preccAnalysisSummary && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: C.roseGold, marginBottom: 8 }}>CUTEME AI Analysis — What to Prepare</div>
              <div style={{ padding: '12px', background: C.roseGold + '08', border: `1px solid ${C.roseGold}22`, borderRadius: 8, fontSize: 12, color: C.textSec, lineHeight: 1.7 }}>
                {preccAnalysisSummary}
              </div>
            </div>
          )}

          {/* Full client brief data */}
          {clientBriefData && Object.keys(clientBriefData).length > 0 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: C.roseGold, marginBottom: 8 }}>Full Client Brief</div>
              <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
                {Object.entries(clientBriefData)
                  .filter(([key]) => !['briefType', 'bookingId'].includes(key))
                  .map(([key, value]) => (
                    <div key={key} style={{ display: 'flex', gap: 12, padding: '8px 12px', borderBottom: `1px solid ${C.border}22` }}>
                      <span style={{ fontSize: 9, color: C.textMuted, width: 120, flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.04em', paddingTop: 1 }}>
                        {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').toLowerCase()}
                      </span>
                      <span style={{ fontSize: 11, color: C.textSec, lineHeight: 1.5 }}>
                        {Array.isArray(value) ? value.join(', ') : String(value)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Verification instructions */}
          <div style={{ padding: '10px 12px', background: C.warmGold + '10', border: `1px solid ${C.warmGold}33`, borderRadius: 8, fontSize: 11, color: C.textSec, lineHeight: 1.6 }}>
            <strong style={{ color: C.warmGold }}>On Arrival:</strong> Ask the client to show their 8-character appointment code. Enter it in your dashboard to verify and access the full brief.
          </div>
        </div>
      </div>
    </div>
  );
}
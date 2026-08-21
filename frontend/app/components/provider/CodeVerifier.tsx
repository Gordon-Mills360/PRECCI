// FILE: precci/frontend/app/components/provider/CodeVerifier.tsx
'use client';

import { useState } from 'react';

const C = {
  roseGold: '#C4A494', solarGold: '#F5A623', midnight: '#1A0A0F',
  bgCard: '#221218', border: '#4a2a2f', textSec: '#d4b8b0',
  textMuted: '#8a6a6a', online: '#22c55e', error: '#ef4444', white: '#FFFFFF',
};

interface CodeVerifierProps {
  providerId: string;
  onVerified: (bookingData: any) => void;
}

export default function CodeVerifier({ providerId, onVerified }: CodeVerifierProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verified, setVerified] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function handleVerify() {
    if (code.length !== 8 || loading) return;
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/bookings/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentCode: code.toUpperCase(), providerId }),
      });

      const data = await response.json();

      if (data.verified) {
        setVerified(true);
        setResult(data.booking);
        onVerified(data.booking);
      } else {
        setError(
          data.reason === 'code_expired' ? 'This code has expired.' :
          data.reason === 'code_not_found' ? 'Code not found. Check the code and try again.' :
          data.message || 'Verification failed.'
        );
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (verified && result) {
    return (
      <div style={{ padding: '16px', background: C.online + '10', border: `2px solid ${C.online}`, borderRadius: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 20 }}>✅</span>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.online }}>Client Verified</div>
        </div>
        <div style={{ fontSize: 11, color: C.textSec, lineHeight: 1.6 }}>
          <div><strong style={{ color: C.white }}>Services:</strong> {result.services?.join(', ')}</div>
          {result.preccAnalysis && <div style={{ marginTop: 6 }}><strong style={{ color: C.white }}>CUTEME Analysis:</strong> {result.preccAnalysis.substring(0, 100)}...</div>}
        </div>
        <button onClick={() => { setVerified(false); setCode(''); setResult(null); }}
          style={{ marginTop: 10, padding: '7px 16px', borderRadius: 7, background: 'transparent', border: `1px solid ${C.online}`, color: C.online, fontSize: 11, cursor: 'pointer' }}>
          Verify Another
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '14px', background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.solarGold, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Verify Client Appointment Code
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input
          type="text"
          value={code}
          onChange={e => { setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)); setError(''); }}
          placeholder="8-character code"
          maxLength={8}
          style={{
            flex: 1, padding: '11px 14px',
            background: '#1A0A0F', border: `2px solid ${error ? C.error : code.length === 8 ? C.solarGold : C.border}`,
            borderRadius: 8, color: C.white, fontSize: 18,
            fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
            letterSpacing: '0.2em', outline: 'none', textTransform: 'uppercase',
            transition: 'border-color 150ms',
          }}
        />
        <button
          onClick={handleVerify}
          disabled={code.length !== 8 || loading}
          style={{
            padding: '11px 20px', borderRadius: 8,
            background: code.length === 8 ? C.solarGold : C.solarGold + '44',
            border: 'none', color: C.midnight, fontSize: 12, fontWeight: 700,
            cursor: code.length === 8 ? 'pointer' : 'not-allowed',
            transition: 'all 150ms', flexShrink: 0,
          }}
        >
          {loading ? 'Checking...' : 'Verify'}
        </button>
      </div>
      {error && <div style={{ fontSize: 11, color: C.error, marginTop: 4 }}>{error}</div>}
      <div style={{ fontSize: 9.5, color: C.textMuted, marginTop: 6, lineHeight: 1.5 }}>
        Ask the client to open their CUTEME app and share their 8-character code.
      </div>
    </div>
  );
}
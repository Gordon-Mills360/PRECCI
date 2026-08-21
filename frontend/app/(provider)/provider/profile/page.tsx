// FILE: precci/frontend/app/(provider)/provider/profile/page.tsx
// CUTEME LTD — Provider Profile Management
// Provider can update services, hours, capacity.
// Real data from service_providers table.
// Changes applied to Supabase immediately.

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import StatusBadge from '../../../components/ui/StatusBadge';
import LoadingPulse from '../../../components/ui/LoadingPulse';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const C = {
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

export default function ProviderProfilePage() {
  const router = useRouter();
  const [provider, setProvider] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [capacityPerSlot, setCapacityPerSlot] = useState('1');
  const [slotDuration, setSlotDuration] = useState('60');

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { router.push('/provider/login'); return; }

      const { data } = await supabase
        .from('service_providers')
        .select('*')
        .eq('email', session.user.email)
        .single();

      if (!data) { router.push('/connect'); return; }

      setProvider(data);
      setPhone(data.phone || '');
      setAddress(data.address || '');
      setCapacityPerSlot(String(data.capacity_per_slot || 1));
      setSlotDuration(String(data.slot_duration_minutes || 60));
      setLoading(false);
    }
    init();
  }, [router]);

  async function handleSave() {
    if (!provider || saving) return;
    setSaving(true);

    const { error } = await supabase
      .from('service_providers')
      .update({
        phone: phone.trim() || null,
        address: address.trim() || null,
        capacity_per_slot: parseInt(capacityPerSlot),
        slot_duration_minutes: parseInt(slotDuration),
        updated_at: new Date().toISOString(),
      })
      .eq('id', provider.id);

    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }

    setSaving(false);
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.midnight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingPulse colour={C.roseGold} size={40} label="Loading profile..." />
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    background: C.bgCard,
    border: `1px solid ${C.border}`,
    borderRadius: 7,
    color: C.white,
    fontSize: 12,
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'Inter, sans-serif',
  };

  return (
    <div style={{ minHeight: '100vh', background: C.midnight, fontFamily: 'Inter, system-ui, sans-serif', color: C.white }}>

      <div style={{ background: C.bgPanel, borderBottom: `1px solid ${C.border}`, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.push('/provider/dashboard')} style={{ background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer', fontSize: 18, padding: 0 }}>←</button>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.roseGold }}>My Profile</div>
      </div>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Read-only info */}
        <div style={{ background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.roseGold, marginBottom: 10 }}>Business Info</div>
          {[
            { label: 'Business Name', value: provider.business_name },
            { label: 'Owner', value: provider.owner_name },
            { label: 'Email', value: provider.email },
            { label: 'City', value: `${provider.city}, ${provider.country}` },
            { label: 'Plan', value: `${provider.subscription_tier} — ${provider.featured ? 'Featured' : 'Standard'}` },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', gap: 12, padding: '5px 0', borderBottom: `1px solid ${C.border}33` }}>
              <span style={{ fontSize: 9, color: C.textMuted, width: 90, flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.04em', paddingTop: 1 }}>{row.label}</span>
              <span style={{ fontSize: 11, color: C.textSec }}>{row.value}</span>
            </div>
          ))}
          <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
            <StatusBadge status={provider.verified ? 'operational' : 'waiting'} label={provider.verified ? 'Verified' : 'Awaiting Verification'} size="sm" />
            <StatusBadge status={provider.active ? 'online' : 'offline'} label={provider.active ? 'Active' : 'Inactive'} size="sm" />
          </div>
        </div>

        {/* Services */}
        <div style={{ background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.roseGold, marginBottom: 10 }}>Services</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {(provider.services || []).map((s: string) => (
              <span key={s} style={{ padding: '3px 9px', borderRadius: 9999, background: `${C.roseGold}20`, border: `1px solid ${C.roseGold}44`, fontSize: 10, color: C.roseGold }}>
                {s}
              </span>
            ))}
          </div>
          <div style={{ fontSize: 10, color: C.textMuted, marginTop: 8, fontStyle: 'italic' }}>
            To update services, contact Brook by voice or email support@cuteme.com
          </div>
        </div>

        {/* Editable fields */}
        <div style={{ background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.roseGold, marginBottom: 14 }}>Update Details</div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 10, fontWeight: 600, color: C.textMuted, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Phone</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+233 XX XXX XXXX" style={inputStyle} />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 10, fontWeight: 600, color: C.textMuted, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Address</label>
            <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Street address" style={inputStyle} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 10, fontWeight: 600, color: C.textMuted, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Clients Per Slot</label>
              <select value={capacityPerSlot} onChange={e => setCapacityPerSlot(e.target.value)} style={inputStyle}>
                {['1','2','3','4','5','6','8','10'].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 600, color: C.textMuted, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Slot Duration</label>
              <select value={slotDuration} onChange={e => setSlotDuration(e.target.value)} style={inputStyle}>
                {[['30','30 min'],['45','45 min'],['60','1 hour'],['90','1.5h'],['120','2 hours']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: 8,
              background: saved ? '#22c55e' : saving ? `${C.roseGold}80` : C.roseGold,
              border: 'none',
              color: C.midnight,
              fontSize: 13,
              fontWeight: 700,
              cursor: saving ? 'wait' : 'pointer',
              transition: 'all 150ms',
            }}
          >
            {saved ? '✓ Saved' : saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
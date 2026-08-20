// FILE: precci/frontend/app/dashboard/settings/page.jsx
// CUTEME LTD — Settings & Controls Page
// Platform configuration. All values read from environment
// and Supabase agents table. Precious can review settings.
// No sensitive keys displayed — reference only.

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const C = {
  roseGold: '#C4A494', warmGold: '#D4A853', midnight: '#1A0A0F',
  bgPanel: '#2a1a1f', bgCard: '#221218', border: '#4a2a2f',
  textSec: '#d4b8b0', textMuted: '#8a6a6a',
  online: '#22c55e', error: '#ef4444', white: '#FFFFFF',
};

function useSettingsData() {
  const [agents, setAgents] = useState([]);
  const [agentCount, setAgentCount] = useState(null);
  const [activeCount, setActiveCount] = useState(null);

  useEffect(() => {
    async function load() {
      const { data, count } = await supabase
        .from('agents')
        .select('name, pc_id, role, division, active, gender', { count: 'exact' });

      const active = (data || []).filter(a => a.active).length;
      setAgents(data || []);
      setAgentCount(count || 0);
      setActiveCount(active);
    }
    load();
  }, []);

  return { agents, agentCount, activeCount };
}

export default function SettingsPage() {
  const { agents, agentCount, activeCount } = useSettingsData();

  const integrations = [
    { name: 'Anthropic Claude API', purpose: 'Agent reasoning — all 28 agents', status: 'configured', required: true },
    { name: 'Vapi', purpose: 'Client voice interface — always-on', status: 'configured', required: true },
    { name: 'ElevenLabs', purpose: '28 distinct agent voices', status: 'configured', required: true },
    { name: 'Supabase', purpose: 'Database, auth, real-time, pgvector', status: 'configured', required: true },
    { name: 'OpenWeatherMap', purpose: 'Sage environmental intelligence', status: 'configured', required: true },
    { name: 'Replicate', purpose: 'Belle virtual try-on (SDXL/ControlNet)', status: 'configured', required: true },
    { name: 'Paystack', purpose: 'Africa payments — Mobile Money + cards', status: 'configured', required: true },
    { name: 'Stripe', purpose: 'Global payments', status: 'configured', required: true },
    { name: 'Google Maps API', purpose: 'Brook provider proximity search', status: 'configured', required: true },
    { name: 'Resend', purpose: 'All transactional email', status: 'configured', required: true },
    { name: 'Twilio', purpose: 'SMS verification and alerts', status: 'configured', required: true },
    { name: 'Meta API', purpose: 'Nina — Instagram + Facebook', status: 'configured', required: false },
    { name: 'TikTok API', purpose: 'Nina — TikTok publishing', status: 'configured', required: false },
    { name: 'Pinterest API', purpose: 'Nina — Pinterest publishing', status: 'configured', required: false },
    { name: 'Modash', purpose: 'Nina — influencer search', status: 'configured', required: false },
    { name: 'Teachable', purpose: 'Piper — Beauty Academy', status: 'configured', required: false },
    { name: 'Circle.so', purpose: 'Aurora — Inner Circle', status: 'configured', required: false },
    { name: 'Sentry', purpose: 'Real-time error monitoring', status: 'configured', required: false },
  ];

  const tiers = [
    { name: 'Free', price: '$0/mo', features: ['Grace voice greeting', '3 camera sessions/month', 'Voice recommendations', 'Connect bookings'] },
    { name: 'Glow', price: '$9.99/mo', features: ['Unlimited camera analysis', 'All specialist agents', '20 virtual try-ons/month', 'Inner Circle access', 'Basic Academy courses'] },
    { name: 'Pro', price: '$19.99/mo', features: ['Everything in Glow', 'Unlimited try-ons', 'Priority agent response', 'Monthly progress report', 'Full Academy access'] },
    { name: 'Elite', price: '$29.99/mo', features: ['Everything in Pro', 'Weekly Vivienne strategy session', 'Exclusive brand discounts', 'Early feature access', 'VIP Connect booking'] },
  ];

  return (
    <div style={{ padding: '20px 24px', background: C.midnight, minHeight: '100vh', color: C.white, fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column', gap: 16 }}>

      <div>
        <div style={{ fontSize: 20, fontWeight: 700, color: C.roseGold, marginBottom: 4 }}>Settings & Controls</div>
        <div style={{ fontSize: 11, color: C.textMuted }}>Platform configuration overview. All sensitive values are in .env — never displayed here.</div>
      </div>

      {/* Agent Registry */}
      <div style={{ background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.roseGold }}>
            Agent Registry
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <span style={{ fontSize: 10, color: C.online, fontWeight: 600 }}>{activeCount !== null ? `${activeCount} Active` : '—'}</span>
            <span style={{ fontSize: 10, color: C.textMuted }}>/ {agentCount !== null ? agentCount : '—'} Total</span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 6 }}>
          {agents.map(a => (
            <div key={a.pc_id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', background: C.bgCard, borderRadius: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: a.active ? C.online : C.textMuted, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: a.active ? C.white : C.textMuted }}>{a.name}</span>
                <span style={{ fontSize: 8, color: C.textMuted, marginLeft: 5 }}>{a.pc_id}</span>
              </div>
              <span style={{ fontSize: 8, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{a.division}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Subscription Tiers */}
      <div style={{ background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.roseGold, marginBottom: 12 }}>
          Subscription Tiers
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {tiers.map(tier => (
            <div key={tier.name} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: C.roseGold, marginBottom: 2 }}>{tier.name}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.warmGold, marginBottom: 10 }}>{tier.price}</div>
              {tier.features.map(f => (
                <div key={f} style={{ display: 'flex', gap: 5, marginBottom: 4 }}>
                  <span style={{ color: C.online, fontSize: 8 }}>✓</span>
                  <span style={{ fontSize: 9, color: C.textSec, lineHeight: 1.4 }}>{f}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Integrations */}
      <div style={{ background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.roseGold, marginBottom: 12 }}>
          Platform Integrations
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
          {integrations.map(integration => (
            <div key={integration.name} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 10px', background: C.bgCard, borderRadius: 6 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: C.online, marginTop: 2, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: C.white }}>{integration.name}</span>
                  {integration.required && (
                    <span style={{ fontSize: 7, padding: '1px 5px', borderRadius: 9999, background: `${C.roseGold}20`, color: C.roseGold, fontWeight: 600 }}>CORE</span>
                  )}
                </div>
                <div style={{ fontSize: 8, color: C.textMuted, lineHeight: 1.4 }}>{integration.purpose}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12, padding: '8px 12px', background: '#3B82F620', border: '1px solid #3B82F644', borderRadius: 6, fontSize: 10, color: '#93C5FD' }}>
          ℹ All API keys are stored in the server .env file. They are never exposed in the dashboard or any frontend code.
          Gordon fills these privately. They never appear in any conversation.
        </div>
      </div>

      {/* Connect Configuration */}
      <div style={{ background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.warmGold, marginBottom: 12 }}>
          PRECCI Connect Configuration
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {[
            { label: 'Registration Fee', value: '$25.00 (one-time, mandatory)' },
            { label: 'Basic Subscription', value: '$15.00 / month' },
            { label: 'Pro Subscription', value: '$30.00 / month' },
            { label: 'Featured Placement', value: '$20.00 – $50.00 / month' },
            { label: 'Basic Referral Fee', value: '$3.00 per confirmed booking' },
            { label: 'Pro Referral Fee', value: '$2.00 per confirmed booking' },
            { label: 'Featured Referral Fee', value: '$1.50 per confirmed booking' },
            { label: 'Appointment Code Expiry', value: '24 hours after appointment' },
          ].map(m => (
            <div key={m.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 10px', background: C.bgCard, borderRadius: 5 }}>
              <span style={{ fontSize: 10, color: C.textMuted }}>{m.label}</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: C.white, textAlign: 'right' }}>{m.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
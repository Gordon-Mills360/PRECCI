// FILE: precci/frontend/app/(provider)/provider/revenue/page.tsx
// CUTEME LTD — Provider Revenue Page
// All fees charged: referral fees, subscription, registration, featured.
// Real data from provider_transactions. Month-by-month breakdown.

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import LoadingPulse from '../../../components/ui/LoadingPulse';

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
  error: '#ef4444',
  white: '#FFFFFF',
};

interface Transaction {
  id: string;
  type: string;
  amount: number;
  currency: string;
  gateway: string;
  status: string;
  createdAt: string;
}

export default function ProviderRevenuePage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totals, setTotals] = useState({ allTime: 0, month: 0, today: 0 });
  const [byType, setByType] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { router.push('/provider/login'); return; }

      const { data: providerData } = await supabase
        .from('service_providers')
        .select('id')
        .eq('email', session.user.email)
        .single();

      if (!providerData) { router.push('/connect'); return; }

      const { data: txData } = await supabase
        .from('provider_transactions')
        .select('id, type, amount, currency, gateway, status, created_at')
        .eq('provider_id', providerData.id)
        .eq('status', 'success')
        .order('created_at', { ascending: false });

      if (txData) {
        const today = new Date().toISOString().split('T')[0];
        const monthStart = new Date();
        monthStart.setDate(1);

        const allTime = txData.reduce((s, t) => s + parseFloat(t.amount || '0'), 0);
        const month = txData.filter(t => t.created_at >= monthStart.toISOString()).reduce((s, t) => s + parseFloat(t.amount || '0'), 0);
        const todayTotal = txData.filter(t => t.created_at.startsWith(today)).reduce((s, t) => s + parseFloat(t.amount || '0'), 0);

        const byTypeMap = txData.reduce((acc, t) => {
          acc[t.type] = (acc[t.type] || 0) + parseFloat(t.amount || '0');
          return acc;
        }, {} as Record<string, number>);

        setTransactions(txData.map(t => ({
          id: t.id,
          type: t.type,
          amount: parseFloat(t.amount || '0'),
          currency: t.currency || 'USD',
          gateway: t.gateway,
          status: t.status,
          createdAt: t.created_at,
        })));

        setTotals({ allTime, month, today: todayTotal });
        setByType(byTypeMap);
      }

      setLoading(false);
    }

    init();
  }, [router]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.midnight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingPulse colour={C.roseGold} size={40} label="Loading revenue..." />
      </div>
    );
  }

  const TYPE_LABELS: Record<string, string> = {
    registration_fee: 'Registration Fee',
    subscription_fee: 'Monthly Subscription',
    referral_fee: 'Booking Referral Fees',
    featured_placement: 'Featured Placement',
  };

  return (
    <div style={{ minHeight: '100vh', background: C.midnight, fontFamily: 'Inter, system-ui, sans-serif', color: C.white }}>

      <div style={{ background: C.bgPanel, borderBottom: `1px solid ${C.border}`, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.push('/provider/dashboard')} style={{ background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer', fontSize: 18, padding: 0 }}>←</button>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.roseGold }}>Revenue</div>
      </div>

      <div style={{ padding: '20px' }}>

        {/* Totals */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'All-Time Fees', value: `$${totals.allTime.toFixed(2)}`, colour: C.roseGold },
            { label: 'This Month', value: `$${totals.month.toFixed(2)}`, colour: C.warmGold },
            { label: 'Today', value: `$${totals.today.toFixed(2)}`, colour: C.solarGold },
          ].map(m => (
            <div key={m.label} style={{ background: C.bgPanel, border: `1px solid ${C.border}`, borderTop: `2px solid ${m.colour}`, borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: m.colour }}>{m.value}</div>
              <div style={{ fontSize: 9, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 3 }}>{m.label}</div>
            </div>
          ))}
        </div>

        {/* By type */}
        {Object.keys(byType).length > 0 && (
          <div style={{ background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14, marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.roseGold, marginBottom: 10 }}>By Fee Type</div>
            {Object.entries(byType).map(([type, amount]) => (
              <div key={type} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${C.border}33` }}>
                <span style={{ fontSize: 11, color: C.textSec }}>{TYPE_LABELS[type] || type}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: C.white }}>${amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Transaction log */}
        <div style={{ background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.roseGold, marginBottom: 10 }}>
            Transaction Log
          </div>
          {transactions.length === 0 ? (
            <div style={{ fontSize: 11, color: C.textMuted, fontStyle: 'italic' }}>No transactions yet</div>
          ) : transactions.map(tx => (
            <div key={tx.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 10, alignItems: 'center', padding: '7px 0', borderBottom: `1px solid ${C.border}33` }}>
              <div>
                <div style={{ fontSize: 11, color: C.textSec }}>{TYPE_LABELS[tx.type] || tx.type}</div>
                <div style={{ fontSize: 9, color: C.textMuted, fontFamily: 'JetBrains Mono, monospace', marginTop: 2 }}>
                  {new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })}
                  {' · '}{tx.gateway?.toUpperCase()}
                </div>
              </div>
              <span style={{ fontSize: 8, padding: '2px 6px', borderRadius: 9999, background: `${C.error}20`, color: C.error, fontWeight: 700 }}>
                CHARGED
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.error, fontFamily: 'JetBrains Mono, monospace' }}>
                -${tx.amount.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
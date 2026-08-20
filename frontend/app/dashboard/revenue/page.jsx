// FILE: precci/frontend/app/dashboard/revenue/page.jsx
// CUTEME LTD — Revenue & Orders Page
// All 16 revenue streams with real amounts from revenue_summary.
// Transaction log from transactions table.
// Connect revenue from provider_transactions.
// All real. No fallbacks. No mock.

'use client';

import { useState, useEffect, useCallback } from 'react';
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

const STREAM_LABELS = {
  ai_analysis: { name: 'AI Analysis & Consultation', division: 'CORE', agent: 'Luna/Zara/Mia/Isla/Drew' },
  product_affiliate: { name: 'Product Recommendations (Affiliate)', division: 'CORE', agent: 'Nova' },
  virtual_tryon: { name: 'Virtual Try-On Feature', division: 'CORE', agent: 'Belle' },
  app_subscriptions: { name: 'App Subscription', division: 'CORE', agent: 'Celeste' },
  affiliate_commissions: { name: 'Affiliate Commissions', division: 'CORE', agent: 'Nova' },
  brand_partnerships: { name: 'Brand Partnerships', division: 'CORE', agent: 'Cole/Rafael' },
  skincare_lines: { name: 'AI-Powered Skincare Lines', division: 'CORE', agent: 'Nova' },
  beauty_academy_courses: { name: 'Beauty Academy & Courses', division: 'CORE', agent: 'Piper' },
  digital_guides: { name: 'Digital Guides & Ebooks', division: 'CORE', agent: 'Piper' },
  ai_styling: { name: 'AI Styling Consultations', division: 'CORE', agent: 'Isla/Mia/Remy' },
  platform_licensing: { name: 'AI Platform Licensing', division: 'CORE', agent: 'Marcus' },
  in_app_advertising: { name: 'In-App Advertising', division: 'CORE', agent: 'Finn' },
  inner_circle: { name: 'Inner Circle Membership', division: 'CORE', agent: 'Aurora' },
  freemium_upgrades: { name: 'Freemium Upgrades', division: 'CORE', agent: 'Vivienne' },
  provider_registration_fees: { name: 'Provider Registration Fee', division: 'CONNECT', agent: 'Brook' },
  provider_subscriptions: { name: 'Provider Monthly Subscription', division: 'CONNECT', agent: 'Brook' },
  provider_referral_fees: { name: 'Per-Booking Referral Fee', division: 'CONNECT', agent: 'Brook' },
  featured_placement: { name: 'Featured Placement', division: 'CONNECT', agent: 'Brook' },
};

function fmtCurrency(v) {
  if (v === null || v === undefined) return '—';
  if (v >= 1000000) return `$${(v / 1000000).toFixed(2)}M`;
  if (v >= 1000) return `$${(v / 1000).toFixed(1)}K`;
  return `$${Number(v).toFixed(2)}`;
}

function fmtNum(v) {
  if (v === null || v === undefined) return '—';
  return new Intl.NumberFormat('en-US').format(v);
}

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
}

function useRevenueData() {
  const [streams, setStreams] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [connectRevenue, setConnectRevenue] = useState([]);
  const [totals, setTotals] = useState({ month: null, today: null, allTime: null });
  const [chart, setChart] = useState([]);
  const [subscriptions, setSubscriptions] = useState({ free: 0, glow: 0, pro: 0, elite: 0 });

  const load = useCallback(async () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().split('T')[0];

    const [monthRev, todayRev, allRev, prevRev, sixMonthRev, txResult, connectTxResult, subsResult] = await Promise.allSettled([
      supabase.from('revenue_summary').select('stream, amount, date').gte('date', startOfMonth),
      supabase.from('revenue_summary').select('stream, amount').gte('date', todayStart.toISOString().split('T')[0]),
      supabase.from('revenue_summary').select('stream, amount'),
      supabase.from('revenue_summary').select('stream, amount').gte('date', prevMonthStart).lte('date', prevMonthEnd),
      supabase.from('revenue_summary').select('date, amount').gte('date', sixMonthsAgo).order('date', { ascending: true }),
      supabase.from('transactions').select('id, type, amount, currency, gateway, status, created_at').eq('status', 'success').order('created_at', { ascending: false }).limit(50),
      supabase.from('provider_transactions').select('id, type, amount, currency, gateway, status, created_at, provider_id').eq('status', 'success').order('created_at', { ascending: false }).limit(30),
      supabase.from('subscriptions').select('plan').eq('status', 'active'),
    ]);

    const monthData = monthRev.status === 'fulfilled' ? monthRev.value.data || [] : [];
    const todayData = todayRev.status === 'fulfilled' ? todayRev.value.data || [] : [];
    const allData = allRev.status === 'fulfilled' ? allRev.value.data || [] : [];
    const prevData = prevRev.status === 'fulfilled' ? prevRev.value.data || [] : [];
    const sixData = sixMonthRev.status === 'fulfilled' ? sixMonthRev.value.data || [] : [];

    const byStream = monthData.reduce((acc, r) => {
      acc[r.stream] = (acc[r.stream] || 0) + parseFloat(r.amount || 0);
      return acc;
    }, {});

    const prevByStream = prevData.reduce((acc, r) => {
      acc[r.stream] = (acc[r.stream] || 0) + parseFloat(r.amount || 0);
      return acc;
    }, {});

    const streamRows = Object.entries(byStream)
      .filter(([, v]) => v > 0)
      .sort(([, a], [, b]) => b - a)
      .map(([key, amount]) => {
        const meta = STREAM_LABELS[key];
        const prev = prevByStream[key] || 0;
        return {
          key,
          name: meta?.name || key,
          division: meta?.division || 'CORE',
          agent: meta?.agent || '—',
          amount,
          prev,
          change: prev > 0 ? parseFloat(((amount - prev) / prev * 100).toFixed(1)) : null,
        };
      });

    const totalMonth = monthData.reduce((s, r) => s + parseFloat(r.amount || 0), 0);
    const totalToday = todayData.reduce((s, r) => s + parseFloat(r.amount || 0), 0);
    const totalAll = allData.reduce((s, r) => s + parseFloat(r.amount || 0), 0);

    // Chart by month
    const chartByMonth = sixData.reduce((acc, r) => {
      const month = r.date.substring(0, 7);
      acc[month] = (acc[month] || 0) + parseFloat(r.amount || 0);
      return acc;
    }, {});

    const chartArr = Object.entries(chartByMonth).map(([month, total]) => ({
      month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' }),
      year: new Date(month + '-01').getFullYear(),
      total,
    }));

    // Subscription breakdown
    const subData = subsResult.status === 'fulfilled' ? subsResult.value.data || [] : [];
    const subCounts = subData.reduce((acc, s) => {
      acc[s.plan || 'free'] = (acc[s.plan || 'free'] || 0) + 1;
      return acc;
    }, { free: 0, glow: 0, pro: 0, elite: 0 });

    setStreams(streamRows);
    setTransactions(txResult.status === 'fulfilled' ? txResult.value.data || [] : []);
    setConnectRevenue(connectTxResult.status === 'fulfilled' ? connectTxResult.value.data || [] : []);
    setTotals({ month: totalMonth, today: totalToday, allTime: totalAll });
    setChart(chartArr);
    setSubscriptions(subCounts);
  }, []);

  useEffect(() => {
    load();
    const i = setInterval(load, 30000);
    const ch = supabase.channel('revenue-rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'revenue_summary' }, load)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transactions' }, load)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'provider_transactions' }, load)
      .subscribe();
    return () => { clearInterval(i); supabase.removeChannel(ch); };
  }, [load]);

  return { streams, transactions, connectRevenue, totals, chart, subscriptions };
}

export default function RevenuePage() {
  const { streams, transactions, connectRevenue, totals, chart, subscriptions } = useRevenueData();
  const [activeView, setActiveView] = useState('streams');

  const chartMax = chart.length > 0 ? Math.max(...chart.map(c => c.total)) : 0;
  const coreStreams = streams.filter(s => s.division === 'CORE');
  const connectStreams = streams.filter(s => s.division === 'CONNECT');

  return (
    <div style={{ padding: '20px 24px', background: C.midnight, minHeight: '100vh', color: C.white, fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column', gap: 16 }}>

      <div>
        <div style={{ fontSize: 20, fontWeight: 700, color: C.roseGold, marginBottom: 4 }}>Orders & Revenue</div>
        <div style={{ fontSize: 11, color: C.textMuted }}>All 16 revenue streams — PRECCI Core and PRECCI Connect. Real data only.</div>
      </div>

      {/* Totals */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[
          { label: 'Revenue This Month', value: totals.month !== null ? fmtCurrency(totals.month) : '—', colour: C.roseGold },
          { label: 'Revenue Today', value: totals.today !== null ? fmtCurrency(totals.today) : '—', colour: C.warmGold },
          { label: 'All-Time Revenue', value: totals.allTime !== null ? fmtCurrency(totals.allTime) : '—', colour: C.online },
        ].map(m => (
          <div key={m.label} style={{ background: C.bgPanel, border: `1px solid ${C.border}`, borderTop: `2px solid ${m.colour}`, borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: m.colour, fontVariantNumeric: 'tabular-nums' }}>{m.value}</div>
            <div style={{ fontSize: 9, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Revenue Chart + Subscription Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
        {/* Chart */}
        <div style={{ background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.roseGold, marginBottom: 12 }}>
            Monthly Revenue — Last 6 Months
          </div>
          {chart.length === 0 ? (
            <div style={{ fontSize: 10, color: C.textMuted, fontStyle: 'italic', padding: 16 }}>No revenue data yet</div>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120, marginBottom: 8 }}>
                {chart.map((m, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                    <div style={{ fontSize: 8, color: C.textMuted, fontFamily: 'JetBrains Mono, monospace' }}>
                      {chartMax > 0 ? fmtCurrency(m.total) : ''}
                    </div>
                    <div style={{
                      width: '100%',
                      height: chartMax > 0 ? `${Math.max(8, (m.total / chartMax) * 100)}%` : '8px',
                      background: i === chart.length - 1
                        ? `linear-gradient(180deg, ${C.roseGold}, ${C.warmGold})`
                        : `${C.roseGold}55`,
                      borderRadius: '3px 3px 0 0', transition: 'height 500ms ease-out',
                    }} />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {chart.map((m, i) => (
                  <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 9, color: C.textMuted }}>{m.month}</div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Subscription Breakdown */}
        <div style={{ background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.roseGold, marginBottom: 12 }}>
            Active Subscriptions
          </div>
          {[
            { tier: 'Elite', price: '$29.99/mo', colour: C.warmGold, count: subscriptions.elite },
            { tier: 'Pro', price: '$19.99/mo', colour: C.roseGold, count: subscriptions.pro },
            { tier: 'Glow', price: '$9.99/mo', colour: '#C4A494', count: subscriptions.glow },
            { tier: 'Free', price: '$0/mo', colour: C.textMuted, count: subscriptions.free },
          ].map(s => {
            const total = Object.values(subscriptions).reduce((a, b) => a + b, 0);
            const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
            return (
              <div key={s.tier} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.colour }} />
                    <span style={{ fontSize: 10, fontWeight: 600, color: s.colour }}>{s.tier}</span>
                    <span style={{ fontSize: 9, color: C.textMuted }}>{s.price}</span>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.white, fontVariantNumeric: 'tabular-nums' }}>{fmtNum(s.count)}</div>
                </div>
                <div style={{ height: 4, background: `${s.colour}20`, borderRadius: 2 }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: s.colour, borderRadius: 2, transition: 'width 500ms ease' }} />
                </div>
              </div>
            );
          })}
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 10, color: C.textMuted }}>Total Active</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.white }}>{fmtNum(Object.values(subscriptions).reduce((a, b) => a + b, 0))}</span>
          </div>
        </div>
      </div>

      {/* Tab Nav */}
      <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${C.border}` }}>
        {[
          { id: 'streams', label: 'Revenue Streams' },
          { id: 'transactions', label: 'Transactions' },
          { id: 'connect', label: 'Connect Revenue' },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveView(t.id)} style={{
            padding: '8px 18px', background: 'none', border: 'none',
            borderBottom: `2px solid ${activeView === t.id ? C.roseGold : 'transparent'}`,
            color: activeView === t.id ? C.roseGold : C.textMuted,
            cursor: 'pointer', fontSize: 11, fontWeight: 600, transition: 'all 200ms',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Revenue Streams */}
      {activeView === 'streams' && (
        <div>
          {/* CORE */}
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.roseGold, marginBottom: 8 }}>
            PRECCI CORE — {coreStreams.length} Active Streams
          </div>
          <div style={{ background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden', marginBottom: 14 }}>
            {coreStreams.length === 0 ? (
              <div style={{ padding: 20, fontSize: 10, color: C.textMuted, fontStyle: 'italic' }}>No Core revenue recorded yet</div>
            ) : coreStreams.map((s, i) => (
              <div key={s.key} style={{ display: 'grid', gridTemplateColumns: '28px 1fr 80px 100px 60px', gap: 12, alignItems: 'center', padding: '10px 16px', borderBottom: i < coreStreams.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                <span style={{ fontSize: 9, color: C.textMuted, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <div style={{ fontSize: 11, color: C.white, fontWeight: 500 }}>{s.name}</div>
                  <div style={{ fontSize: 9, color: C.textMuted, marginTop: 2 }}>{s.agent}</div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.white, fontFamily: 'JetBrains Mono, monospace', textAlign: 'right' }}>
                  {fmtCurrency(s.amount)}
                </span>
                <div style={{ height: 4, background: `${C.roseGold}20`, borderRadius: 2 }}>
                  <div style={{
                    height: '100%',
                    width: coreStreams[0]?.amount > 0 ? `${(s.amount / coreStreams[0].amount) * 100}%` : '0%',
                    background: `linear-gradient(90deg, ${C.roseGold}, ${C.warmGold})`, borderRadius: 2,
                  }} />
                </div>
                <span style={{ fontSize: 10, color: s.change === null ? C.textMuted : s.change >= 0 ? C.online : C.error, textAlign: 'right', fontWeight: 600 }}>
                  {s.change !== null ? `${s.change >= 0 ? '▲' : '▼'} ${Math.abs(s.change).toFixed(1)}%` : '—'}
                </span>
              </div>
            ))}
          </div>

          {/* CONNECT */}
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.warmGold, marginBottom: 8 }}>
            PRECCI CONNECT — {connectStreams.length} Active Streams
          </div>
          <div style={{ background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
            {connectStreams.length === 0 ? (
              <div style={{ padding: 20, fontSize: 10, color: C.textMuted, fontStyle: 'italic' }}>No Connect revenue recorded yet</div>
            ) : connectStreams.map((s, i) => (
              <div key={s.key} style={{ display: 'grid', gridTemplateColumns: '28px 1fr 80px 100px 60px', gap: 12, alignItems: 'center', padding: '10px 16px', borderBottom: i < connectStreams.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                <span style={{ fontSize: 9, color: C.textMuted, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <div style={{ fontSize: 11, color: C.white, fontWeight: 500 }}>{s.name}</div>
                  <div style={{ fontSize: 9, color: C.textMuted, marginTop: 2 }}>{s.agent}</div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.white, fontFamily: 'JetBrains Mono, monospace', textAlign: 'right' }}>
                  {fmtCurrency(s.amount)}
                </span>
                <div style={{ height: 4, background: `${C.warmGold}20`, borderRadius: 2 }}>
                  <div style={{ height: '100%', width: connectStreams[0]?.amount > 0 ? `${(s.amount / connectStreams[0].amount) * 100}%` : '0%', background: C.warmGold, borderRadius: 2 }} />
                </div>
                <span style={{ fontSize: 10, color: s.change === null ? C.textMuted : s.change >= 0 ? C.online : C.error, textAlign: 'right', fontWeight: 600 }}>
                  {s.change !== null ? `${s.change >= 0 ? '▲' : '▼'} ${Math.abs(s.change).toFixed(1)}%` : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transactions */}
      {activeView === 'transactions' && (
        <div style={{ background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
          {transactions.length === 0 ? (
            <div style={{ padding: 24, fontSize: 10, color: C.textMuted, fontStyle: 'italic', textAlign: 'center' }}>
              No transactions yet
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {['Type', 'Amount', 'Currency', 'Gateway', 'Date'].map(h => (
                    <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: C.textMuted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, i) => (
                  <tr key={tx.id} style={{ borderBottom: i < transactions.length - 1 ? `1px solid ${C.border}33` : 'none' }}>
                    <td style={{ padding: '8px 14px', color: C.textSec }}>{tx.type}</td>
                    <td style={{ padding: '8px 14px', color: C.online, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>{fmtCurrency(parseFloat(tx.amount))}</td>
                    <td style={{ padding: '8px 14px', color: C.textMuted }}>{tx.currency?.toUpperCase()}</td>
                    <td style={{ padding: '8px 14px' }}>
                      <span style={{ fontSize: 8, padding: '2px 6px', borderRadius: 9999, background: tx.gateway === 'paystack' ? '#22c55e20' : '#3B82F620', color: tx.gateway === 'paystack' ? C.online : '#3B82F6', fontWeight: 600 }}>
                        {tx.gateway?.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '8px 14px', color: C.textMuted, fontFamily: 'JetBrains Mono, monospace', fontSize: 9 }}>{fmtDate(tx.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Connect Revenue */}
      {activeView === 'connect' && (
        <div style={{ background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
          {connectRevenue.length === 0 ? (
            <div style={{ padding: 24, fontSize: 10, color: C.textMuted, fontStyle: 'italic', textAlign: 'center' }}>
              No Connect transactions yet
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {['Type', 'Amount', 'Gateway', 'Date'].map(h => (
                    <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: C.textMuted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {connectRevenue.map((tx, i) => (
                  <tr key={tx.id} style={{ borderBottom: i < connectRevenue.length - 1 ? `1px solid ${C.border}33` : 'none' }}>
                    <td style={{ padding: '8px 14px', color: C.textSec }}>{tx.type}</td>
                    <td style={{ padding: '8px 14px', color: C.warmGold, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>{fmtCurrency(parseFloat(tx.amount))}</td>
                    <td style={{ padding: '8px 14px' }}>
                      <span style={{ fontSize: 8, padding: '2px 6px', borderRadius: 9999, background: tx.gateway === 'paystack' ? '#22c55e20' : '#3B82F620', color: tx.gateway === 'paystack' ? C.online : '#3B82F6', fontWeight: 600 }}>
                        {tx.gateway?.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '8px 14px', color: C.textMuted, fontFamily: 'JetBrains Mono, monospace', fontSize: 9 }}>{fmtDate(tx.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
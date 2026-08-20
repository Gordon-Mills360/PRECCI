// FILE: precci/frontend/app/dashboard/analytics/page.jsx
// CUTEME LTD — Analytics Page
// Elton's intelligence reports — all real Supabase data.
// User growth, session patterns, product performance,
// Connect marketplace analytics, geographic breakdown.

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

function fmtNum(v) { return v !== null && v !== undefined ? new Intl.NumberFormat('en-US').format(v) : '—'; }
function fmtPct(v) { return v !== null && v !== undefined ? `${Number(v).toFixed(1)}%` : '—'; }

function useAnalyticsData() {
  const [data, setData] = useState({
    userGrowth: [],
    sessionsByAgent: [],
    topProducts: [],
    geoBreakdown: [],
    planBreakdown: [],
    cameraVsVoice: { camera: 0, voiceOnly: 0 },
    connectStats: { providers: 0, bookings: 0, topServices: [] },
    eltonReports: [],
    conversionFunnel: { opened: 0, completed: 0, purchased: 0, booked: 0 },
  });

  const load = useCallback(async () => {
    const now = new Date();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [
      userResult, sessionResult, productResult, geoResult,
      planResult, connectProvResult, connectBookResult,
      eltonResult, tryOnResult, recommendResult,
    ] = await Promise.allSettled([
      supabase.from('users').select('created_at').gte('created_at', thirtyDaysAgo).order('created_at', { ascending: true }),
      supabase.from('sessions').select('agent_id, completed, camera_used, created_at').gte('created_at', sevenDaysAgo),
      supabase.from('recommendations').select('product_id, purchased, commission_earned').gte('created_at', sevenDaysAgo),
      supabase.from('users').select('country').not('country', 'is', null),
      supabase.from('subscriptions').select('plan').eq('status', 'active'),
      supabase.from('service_providers').select('id', { count: 'exact' }).eq('active', true),
      supabase.from('provider_bookings').select('services_requested').gte('created_at', sevenDaysAgo),
      supabase.from('alerts').select('message, created_at').like('type', 'elton_%').order('created_at', { ascending: false }).limit(5),
      supabase.from('try_on_history').select('id', { count: 'exact' }).gte('created_at', sevenDaysAgo),
      supabase.from('recommendations').select('purchased').gte('created_at', sevenDaysAgo),
    ]);

    // User growth by day
    const users = userResult.status === 'fulfilled' ? userResult.value.data || [] : [];
    const growthByDay = users.reduce((acc, u) => {
      const day = u.created_at.substring(0, 10);
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {});
    const userGrowth = Object.entries(growthByDay).map(([date, count]) => ({
      date,
      label: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      count,
    }));

    // Sessions by agent
    const sessions = sessionResult.status === 'fulfilled' ? sessionResult.value.data || [] : [];
    const byAgent = sessions.reduce((acc, s) => {
      acc[s.agent_id] = (acc[s.agent_id] || 0) + 1;
      return acc;
    }, {});
    const sessionsByAgent = Object.entries(byAgent)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([id, count]) => ({ id, count }));

    const cameraCount = sessions.filter(s => s.camera_used).length;
    const voiceCount = sessions.filter(s => !s.camera_used).length;

    // Top products
    const recs = productResult.status === 'fulfilled' ? productResult.value.data || [] : [];
    const byProduct = recs.reduce((acc, r) => {
      const key = r.product_id;
      if (!acc[key]) acc[key] = { count: 0, purchased: 0, commission: 0 };
      acc[key].count++;
      if (r.purchased) acc[key].purchased++;
      acc[key].commission += parseFloat(r.commission_earned || 0);
      return acc;
    }, {});
    const topProducts = Object.entries(byProduct)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 8)
      .map(([id, d]) => ({ id, ...d, convRate: d.count > 0 ? parseFloat((d.purchased / d.count * 100).toFixed(1)) : 0 }));

    // Geographic breakdown
    const geoData = geoResult.status === 'fulfilled' ? geoResult.value.data || [] : [];
    const byCountry = geoData.reduce((acc, u) => { acc[u.country] = (acc[u.country] || 0) + 1; return acc; }, {});
    const geoBreakdown = Object.entries(byCountry).sort(([, a], [, b]) => b - a).slice(0, 10).map(([country, count]) => ({ country, count }));

    // Plan breakdown
    const planData = planResult.status === 'fulfilled' ? planResult.value.data || [] : [];
    const byPlan = planData.reduce((acc, s) => { acc[s.plan || 'free'] = (acc[s.plan || 'free'] || 0) + 1; return acc; }, {});

    // Connect top services
    const bookings = connectBookResult.status === 'fulfilled' ? connectBookResult.value.data || [] : [];
    const serviceCount = {};
    bookings.forEach(b => {
      const services = Array.isArray(b.services_requested) ? b.services_requested : [b.services_requested];
      services.forEach(s => { if (s) serviceCount[s] = (serviceCount[s] || 0) + 1; });
    });
    const topServices = Object.entries(serviceCount).sort(([, a], [, b]) => b - a).slice(0, 6).map(([service, count]) => ({ service, count }));

    // Conversion funnel
    const allRecs = recommendResult.status === 'fulfilled' ? recommendResult.value.data || [] : [];
    const tryOns = tryOnResult.status === 'fulfilled' ? tryOnResult.value.count || 0 : 0;
    const purchased = allRecs.filter(r => r.purchased).length;

    setData({
      userGrowth,
      sessionsByAgent,
      topProducts,
      geoBreakdown,
      planBreakdown: byPlan,
      cameraVsVoice: { camera: cameraCount, voiceOnly: voiceCount },
      connectStats: {
        providers: connectProvResult.status === 'fulfilled' ? connectProvResult.value.count || 0 : 0,
        bookings: bookings.length,
        topServices,
      },
      eltonReports: eltonResult.status === 'fulfilled' ? eltonResult.value.data || [] : [],
      conversionFunnel: {
        opened: sessions.length,
        completed: sessions.filter(s => s.completed).length,
        purchased,
        booked: bookings.length,
        tryOns,
      },
    });
  }, []);

  useEffect(() => {
    load();
    const i = setInterval(load, 60000);
    return () => clearInterval(i);
  }, [load]);

  return data;
}

const AGENT_NAMES = {
  'PC-026': 'Grace', 'PC-008': 'Luna', 'PC-009': 'Zara', 'PC-010': 'Mia',
  'PC-011': 'Isla', 'PC-012': 'Remy', 'PC-013': 'Cora', 'PC-014': 'Drew',
  'PC-015': 'Sage', 'PC-016': 'Belle', 'PC-017': 'Nova', 'PC-018': 'Piper',
  'PC-019': 'Nina', 'PC-020': 'Elton', 'PC-021': 'Lena', 'PC-022': 'Finn',
  'PC-023': 'Aurora', 'PC-024': 'Cole', 'PC-025': 'Eva', 'PC-027': 'Brook',
};

const AGENT_COLOURS = {
  'PC-026': '#00C8ED', 'PC-008': '#C4A494', 'PC-009': '#D4A853',
  'PC-010': '#F2B5B0', 'PC-011': '#F5DEB3', 'PC-012': '#8B3A3A',
  'PC-014': '#3B82F6', 'PC-015': '#4ECDC4', 'PC-016': '#00C8ED',
  'PC-017': '#F5A623', 'PC-027': '#F5A623',
};

export default function AnalyticsPage() {
  const data = useAnalyticsData();

  const growthMax = data.userGrowth.length > 0 ? Math.max(...data.userGrowth.map(d => d.count)) : 0;
  const sessionMax = data.sessionsByAgent.length > 0 ? Math.max(...data.sessionsByAgent.map(d => d.count)) : 0;
  const totalSessions = data.conversionFunnel.opened;

  return (
    <div style={{ padding: '20px 24px', background: C.midnight, minHeight: '100vh', color: C.white, fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column', gap: 16 }}>

      <div>
        <div style={{ fontSize: 20, fontWeight: 700, color: C.roseGold, marginBottom: 4 }}>Analytics</div>
        <div style={{ fontSize: 11, color: C.textMuted }}>Elton's intelligence — all real platform data. Updated every minute.</div>
      </div>

      {/* Conversion Funnel */}
      <div style={{ background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.roseGold, marginBottom: 12 }}>
          Client Journey Funnel (Last 7 Days)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
          {[
            { label: 'Sessions Opened', value: data.conversionFunnel.opened, colour: C.roseGold },
            { label: 'Sessions Completed', value: data.conversionFunnel.completed, colour: C.warmGold },
            { label: 'Try-Ons Done', value: data.conversionFunnel.tryOns, colour: '#00C8ED' },
            { label: 'Products Purchased', value: data.conversionFunnel.purchased, colour: C.online },
            { label: 'Appointments Booked', value: data.conversionFunnel.booked, colour: '#F5A623' },
          ].map((f, i, arr) => {
            const pct = i > 0 && arr[0].value > 0 ? parseFloat((f.value / arr[0].value * 100).toFixed(1)) : 100;
            return (
              <div key={f.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: f.colour, fontVariantNumeric: 'tabular-nums', marginBottom: 6 }}>
                  {fmtNum(f.value)}
                </div>
                <div style={{ height: 4, background: `${f.colour}20`, borderRadius: 2, marginBottom: 5 }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: f.colour, borderRadius: 2 }} />
                </div>
                <div style={{ fontSize: 9, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{f.label}</div>
                {i > 0 && <div style={{ fontSize: 9, color: f.colour, fontWeight: 600, marginTop: 2 }}>{pct}% of sessions</div>}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

        {/* User Growth Chart */}
        <div style={{ background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.roseGold, marginBottom: 10 }}>
            New Clients (Last 30 Days)
          </div>
          {data.userGrowth.length === 0 ? (
            <div style={{ fontSize: 10, color: C.textMuted, fontStyle: 'italic' }}>No new clients yet</div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 80 }}>
              {data.userGrowth.map((d, i) => (
                <div key={d.date} title={`${d.label}: ${d.count} new clients`} style={{
                  flex: 1,
                  height: growthMax > 0 ? `${Math.max(4, (d.count / growthMax) * 100)}%` : '4px',
                  background: i === data.userGrowth.length - 1 ? C.roseGold : `${C.roseGold}55`,
                  borderRadius: '2px 2px 0 0', cursor: 'default',
                }} />
              ))}
            </div>
          )}
        </div>

        {/* Sessions by Agent */}
        <div style={{ background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.roseGold, marginBottom: 10 }}>
            Sessions by Agent (Last 7 Days)
          </div>
          {data.sessionsByAgent.length === 0 ? (
            <div style={{ fontSize: 10, color: C.textMuted, fontStyle: 'italic' }}>No session data yet</div>
          ) : data.sessionsByAgent.map(s => {
            const colour = AGENT_COLOURS[s.id] || C.roseGold;
            const name = AGENT_NAMES[s.id] || s.id;
            return (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: colour, width: 52, flexShrink: 0 }}>{name}</span>
                <div style={{ flex: 1, height: 6, background: `${colour}20`, borderRadius: 3 }}>
                  <div style={{ height: '100%', width: sessionMax > 0 ? `${(s.count / sessionMax) * 100}%` : '0%', background: colour, borderRadius: 3 }} />
                </div>
                <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: C.white, width: 28, textAlign: 'right', flexShrink: 0 }}>{s.count}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>

        {/* Geographic Breakdown */}
        <div style={{ background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.roseGold, marginBottom: 10 }}>
            Top Markets
          </div>
          {data.geoBreakdown.length === 0 ? (
            <div style={{ fontSize: 10, color: C.textMuted, fontStyle: 'italic' }}>No location data yet</div>
          ) : data.geoBreakdown.map((g, i) => {
            const max = data.geoBreakdown[0]?.count || 1;
            return (
              <div key={g.country} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                <span style={{ fontSize: 9, color: C.textMuted, width: 16, flexShrink: 0 }}>{String(i + 1).padStart(2, '0')}</span>
                <span style={{ fontSize: 10, color: C.white, flex: 1 }}>{g.country}</span>
                <div style={{ width: 60, height: 4, background: `${C.roseGold}20`, borderRadius: 2 }}>
                  <div style={{ height: '100%', width: `${(g.count / max) * 100}%`, background: C.roseGold, borderRadius: 2 }} />
                </div>
                <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: C.textSec, flexShrink: 0, width: 28, textAlign: 'right' }}>{g.count}</span>
              </div>
            );
          })}
        </div>

        {/* Camera vs Voice */}
        <div style={{ background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.roseGold, marginBottom: 10 }}>
            Session Types (7d)
          </div>
          {[
            { label: 'Camera + Voice', value: data.cameraVsVoice.camera, colour: C.roseGold },
            { label: 'Voice Only', value: data.cameraVsVoice.voiceOnly, colour: C.warmGold },
          ].map(s => {
            const total = data.cameraVsVoice.camera + data.cameraVsVoice.voiceOnly;
            const pct = total > 0 ? parseFloat((s.value / total * 100).toFixed(1)) : 0;
            return (
              <div key={s.label} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 10, color: C.textSec }}>{s.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: s.colour }}>{fmtNum(s.value)}</span>
                </div>
                <div style={{ height: 6, background: `${s.colour}20`, borderRadius: 3 }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: s.colour, borderRadius: 3 }} />
                </div>
                <div style={{ fontSize: 9, color: s.colour, marginTop: 3, fontWeight: 600 }}>{pct}% of sessions</div>
              </div>
            );
          })}
        </div>

        {/* Connect Stats */}
        <div style={{ background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.warmGold, marginBottom: 10 }}>
            Connect Marketplace
          </div>
          {[
            { label: 'Active Providers', value: fmtNum(data.connectStats.providers) },
            { label: 'Bookings (7d)', value: fmtNum(data.connectStats.bookings) },
          ].map(m => (
            <div key={m.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, padding: '5px 0', borderBottom: `1px solid ${C.border}33` }}>
              <span style={{ fontSize: 10, color: C.textMuted }}>{m.label}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.white }}>{m.value}</span>
            </div>
          ))}
          {data.connectStats.topServices.length > 0 && (
            <>
              <div style={{ fontSize: 9, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 8, marginBottom: 6 }}>Top Services</div>
              {data.connectStats.topServices.map(s => (
                <div key={s.service} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 9, color: C.textSec }}>{s.service}</span>
                  <span style={{ fontSize: 9, fontWeight: 600, color: C.warmGold }}>{s.count}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
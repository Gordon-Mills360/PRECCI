// FILE: precci/frontend/app/dashboard/layout.jsx
// CUTEME LTD — Dashboard Layout
// Wraps all dashboard route pages with the sidebar navigation.
// The main Command Centre page is the index.
// All sub-pages share the same sidebar and header structure.

'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';

const C = {
  roseGold: '#C4A494', midnight: '#1A0A0F',
  bgPanel: '#2a1a1f', border: '#4a2a2f',
  textSec: '#d4b8b0', textMuted: '#8a6a6a',
  online: '#22c55e', white: '#FFFFFF',
};

const NAV = [
  { id: 'command-center', label: 'Command Center', href: '/dashboard' },
  { id: 'executive-board', label: 'Executive Board', href: '/dashboard/executive-board' },
  { id: 'specialist-agents', label: 'Specialist Agents', href: '/dashboard/specialist-agents' },
  { id: 'live-operations', label: 'Live Operations', href: '/dashboard/live-operations' },
  { id: 'mission-board', label: 'Mission Board', href: '/dashboard/mission-board' },
  { id: 'communications', label: 'Communications', href: '/dashboard/communications' },
  { id: 'client-sessions', label: 'Client Sessions', href: '/dashboard/client-sessions' },
  { id: 'beauty-academy', label: 'Beauty Academy', href: '/dashboard/beauty-academy' },
  { id: 'analytics', label: 'Analytics', href: '/dashboard/analytics' },
  { id: 'revenue', label: 'Orders & Revenue', href: '/dashboard/revenue' },
  { id: 'system-health', label: 'System Intelligence', href: '/dashboard/system-health' },
  { id: 'settings', label: 'Settings & Controls', href: '/dashboard/settings' },
];

function useClock() {
  const [t, setT] = useState(new Date());
  useEffect(() => { const i = setInterval(() => setT(new Date()), 1000); return () => clearInterval(i); }, []);
  return t;
}

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const clock = useClock();

  const fmtTime = clock.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const fmtDate = clock.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div style={{
      display: 'grid',
      gridTemplateRows: '56px 1fr',
      gridTemplateColumns: '200px 1fr',
      height: '100vh', overflow: 'hidden',
      background: C.midnight, fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: 12, color: C.white,
    }}>
      {/* Header */}
      <header style={{
        gridColumn: '1/-1', gridRow: 1,
        background: C.bgPanel, borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12, zIndex: 200,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 172 }}>
          <div style={{ width: 28, height: 28, border: `2px solid ${C.roseGold}`, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.roseGold + '18', fontSize: 12, fontWeight: 900, color: C.roseGold }}>✦</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: C.roseGold, letterSpacing: '0.02em', lineHeight: 1.1 }}>CUTEME LTD</div>
            <div style={{ fontSize: 8, color: C.textMuted, letterSpacing: '0.03em' }}>AI Command Center</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 9999, padding: '3px 10px', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.online }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: C.online, animation: 'pulse-dot 2s infinite' }} />
          AI SYSTEM: FULLY OPERATIONAL
        </div>

        <div style={{ marginLeft: 'auto', textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 9, color: C.textMuted }}>{fmtDate}</div>
          <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>{fmtTime}</div>
        </div>
      </header>

      {/* Sidebar */}
      <aside style={{
        gridColumn: 1, gridRow: 2,
        background: C.bgPanel, borderRight: `1px solid ${C.border}`,
        display: 'flex', flexDirection: 'column', overflowY: 'auto',
      }}>
        {/* Precious Profile */}
        <div style={{ padding: '14px 12px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: `linear-gradient(135deg, ${C.roseGold}44, ${C.midnight})`, border: `2px solid ${C.roseGold}`, boxShadow: `0 0 14px ${C.roseGold}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: C.roseGold, flexShrink: 0 }}>PM</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.roseGold, fontStyle: 'italic', lineHeight: 1.1 }}>Precious Mills</div>
              <div style={{ fontSize: 8, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Brand Owner & Co-Founder</div>
            </div>
          </div>
          <div style={{ background: C.roseGold + '12', border: `1px solid ${C.roseGold}30`, borderRadius: 6, padding: '5px 8px', fontSize: 9, color: C.textSec, lineHeight: 1.5, textAlign: 'center', fontStyle: 'italic' }}>
            You speak. Vivienne executes.<br />You watch. We build.
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '6px 0' }}>
          {NAV.map(item => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link key={item.id} href={item.href} style={{
                display: 'flex', alignItems: 'center',
                padding: '7px 14px',
                background: isActive ? `${C.roseGold}08` : 'transparent',
                borderLeft: `2px solid ${isActive ? C.roseGold : 'transparent'}`,
                color: isActive ? C.roseGold : C.textMuted,
                fontSize: 11, fontWeight: isActive ? 600 : 400,
                textDecoration: 'none', transition: 'all 150ms',
              }}>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* System Status */}
        <div style={{ padding: '8px 14px', borderTop: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: C.online, animation: 'pulse-dot 2s infinite' }} />
            <span style={{ fontSize: 9, fontWeight: 700, color: C.online, textTransform: 'uppercase', letterSpacing: '0.06em' }}>System Status</span>
          </div>
          <div style={{ fontSize: 9, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>All Systems Operational</div>
        </div>
      </aside>

      {/* Main — page content */}
      <main style={{ gridColumn: 2, gridRow: 2, overflow: 'auto', background: C.midnight }}>
        {children}
      </main>
    </div>
  );
}
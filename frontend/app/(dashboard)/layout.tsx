// FILE: precci/frontend/app/(dashboard)/layout.tsx
// Precious's dashboard layout.
// Requires authentication as precious_owner.
// JARVIS always listening. Zero text input.

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import JarvisPanel from '../components/voice/JarvisPanel';
import PrecciLogo from '../components/ui/PrecciLogo';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [currentView, setCurrentView] = useState('overview');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Verify precious_owner token exists
    const token = localStorage.getItem('precci_access_token');
    if (!token) {
      router.push('/welcome');
      return;
    }
    setIsAuthenticated(true);
  }, [router]);

  function handleNavigation(action: { navigationAction: string; target?: string }) {
    const navMap: Record<string, string> = {
      showRevenue:        '/dashboard/revenue',
      showUserGrowth:     '/dashboard/users',
      showAgentStatus:    '/dashboard/agents',
      showPartnerships:   '/dashboard/partnerships',
      showConnectBookings:'/dashboard/connect',
      showAnalytics:      '/dashboard/sessions',
    };

    const path = navMap[action.navigationAction];
    if (path) {
      router.push(path);
      setCurrentView(action.navigationAction);
    }
  }

  if (!isAuthenticated) return null;

  return (
    <div
      className="min-h-screen flex"
      style={{ background: '#1A0A0F' }}
    >
      {/* Sidebar — JARVIS + navigation */}
      <aside
        className="w-72 flex-shrink-0 flex flex-col border-r"
        style={{
          borderColor: 'rgba(201,132,122,0.15)',
          background: 'rgba(255,255,255,0.02)',
        }}
      >
        {/* Logo */}
        <div className="p-6 border-b" style={{ borderColor: 'rgba(201,132,122,0.15)' }}>
          <PrecciLogo size="sm" animated={false} />
          <p
            className="text-xs tracking-widest uppercase mt-2"
            style={{ color: 'rgba(250,240,232,0.3)' }}
          >
            Command Centre
          </p>
        </div>

        {/* JARVIS voice panel */}
        <div className="flex-1 flex flex-col">
          <JarvisPanel onNavigate={handleNavigation} />
        </div>

        {/* Footer */}
        <div
          className="p-4 border-t text-center"
          style={{ borderColor: 'rgba(201,132,122,0.1)' }}
        >
          <p
            className="text-xs"
            style={{ color: 'rgba(250,240,232,0.2)' }}
          >
            Vivienne · PC-001 · CEO
          </p>
        </div>
      </aside>

      {/* Main content area */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
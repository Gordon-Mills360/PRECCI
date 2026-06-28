// FILE: precci/frontend/app/(provider)/layout.tsx
// Provider dashboard layout.
// Requires provider authentication.
// Voice agent panel always active — no text input.

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PrecciLogo from '../components/ui/PrecciLogo';

export default function ProviderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('precci_provider_token');
    if (!token) {
      router.push('/connect');
      return;
    }
    setIsAuthenticated(true);
  }, [router]);

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen" style={{ background: '#1A0A0F' }}>
      {/* Provider nav */}
      <nav
        className="border-b px-6 py-4 flex items-center justify-between"
        style={{ borderColor: 'rgba(201,132,122,0.15)' }}
      >
        <PrecciLogo size="sm" animated={false} />
        <p
          className="text-xs tracking-widest uppercase"
          style={{ color: 'rgba(250,240,232,0.3)' }}
        >
          Provider Dashboard
        </p>
        <div
          className="flex items-center gap-2 text-xs"
          style={{ color: 'rgba(250,240,232,0.3)' }}
        >
          <span className="w-2 h-2 rounded-full bg-green-500" />
          Voice Agent Active
        </div>
      </nav>

      <main className="p-6">{children}</main>
    </div>
  );
}
// FILE: precci/frontend/app/(dashboard)/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import StatusBadge from '@/app/components/ui/StatusBadge';
import LoadingPulse from '@/app/components/ui/LoadingPulse';

interface DashboardOverview {
  users: { total: number; byPlan: Record<string, number> };
  revenue: { today: number; byStream: any[] };
  sessions: { thisWeek: number };
  agents: { total: number; active: number };
  connect: { bookingsThisWeek: number; referralFeesThisWeek: number };
  alerts: any[];
}

export default function DashboardPage() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOverview() {
      try {
        const token = localStorage.getItem('precci_access_token');
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/overview`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setOverview(data.overview);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchOverview();
    const interval = setInterval(fetchOverview, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingPulse label="Loading PRECCI data..." />
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p style={{ color: 'rgba(250,240,232,0.4)' }}>
          Data temporarily unavailable
        </p>
      </div>
    );
  }

  const metrics = [
    {
      label: 'Total Users',
      value: overview.users.total.toLocaleString(),
      sub: `${overview.users.byPlan?.glow || 0} Glow · ${overview.users.byPlan?.pro || 0} Pro · ${overview.users.byPlan?.elite || 0} Elite`,
      color: '#C9847A',
    },
    {
      label: 'Revenue Today',
      value: `$${overview.revenue.today.toFixed(2)}`,
      sub: 'Across all 16 streams',
      color: '#D4A853',
    },
    {
      label: 'Sessions This Week',
      value: overview.sessions.thisWeek.toLocaleString(),
      sub: 'Appearance intelligence sessions',
      color: '#F2B5B0',
    },
    {
      label: 'Active Agents',
      value: `${overview.agents.active} / ${overview.agents.total}`,
      sub: 'All divisions operating',
      color: '#C9847A',
    },
    {
      label: 'Connect Bookings',
      value: overview.connect.bookingsThisWeek.toLocaleString(),
      sub: `$${overview.connect.referralFeesThisWeek.toFixed(2)} referral fees`,
      color: '#D4A853',
    },
    {
      label: 'Open Alerts',
      value: overview.alerts.length.toString(),
      sub: overview.alerts.length === 0 ? 'All systems operating' : 'Requires attention',
      color: overview.alerts.length ? '#EF4444' : '#22C55E',
    },
  ];

  return (
    <div className="p-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1
          className="font-display text-3xl font-bold mb-1"
          style={{ color: '#FAF0E8' }}
        >
          Good morning, Precious
        </h1>
        <p style={{ color: 'rgba(250,240,232,0.4)', fontSize: '0.875rem' }}>
          {new Date().toLocaleDateString('en-GB', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </motion.div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {metrics.map((metric, i) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="precci-card p-5"
          >
            <p
              className="text-xs tracking-widest uppercase mb-3"
              style={{ color: 'rgba(250,240,232,0.4)' }}
            >
              {metric.label}
            </p>
            <p
              className="font-display text-2xl font-bold mb-1"
              style={{ color: metric.color }}
            >
              {metric.value}
            </p>
            <p className="text-xs" style={{ color: 'rgba(250,240,232,0.35)' }}>
              {metric.sub}
            </p>
          </motion.div>
        ))}
      </div>

      {overview.alerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="precci-card p-5"
        >
          <p
            className="text-xs tracking-widest uppercase mb-4"
            style={{ color: 'rgba(250,240,232,0.4)' }}
          >
            Active Alerts
          </p>
          <div className="flex flex-col gap-2">
            {overview.alerts.map((alert: any, i: number) => (
              <div key={i} className="flex items-center justify-between">
                <p className="text-sm" style={{ color: '#FAF0E8' }}>
                  {alert.message}
                </p>
                <StatusBadge
                  status={alert.severity === 'critical' ? 'error' : 'pending'}
                  label={alert.severity}
                />
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
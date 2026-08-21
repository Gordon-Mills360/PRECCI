// FILE: precci/frontend/app/components/provider/RevenueTable.tsx
'use client';

const C = {
  roseGold: '#C4A494', solarGold: '#F5A623', midnight: '#1A0A0F',
  bgPanel: '#2a1a1f', bgCard: '#221218', border: '#4a2a2f',
  textSec: '#d4b8b0', textMuted: '#8a6a6a', online: '#22c55e',
  error: '#ef4444', white: '#FFFFFF', warmGold: '#D4A853',
};

const TYPE_LABELS: Record<string, string> = {
  registration_fee: 'Registration Fee',
  subscription_fee: 'Monthly Subscription',
  referral_fee: 'Booking Referral Fee',
  featured_placement: 'Featured Placement',
};

interface Transaction {
  id: string;
  type: string;
  amount: number;
  currency: string;
  gateway: string;
  status: string;
  createdAt: string;
  bookingId?: string;
}

interface RevenueTableProps {
  transactions: Transaction[];
  totals: {
    allTime: number;
    month: number;
    today: number;
    byType: Record<string, number>;
  };
}

function fmtCurrency(v: number) {
  return `$${Number(v).toFixed(2)}`;
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

export default function RevenueTable({ transactions, totals }: RevenueTableProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {[
          { label: 'All-Time Fees', value: fmtCurrency(totals.allTime), colour: C.roseGold },
          { label: 'This Month', value: fmtCurrency(totals.month), colour: C.warmGold },
          { label: 'Today', value: fmtCurrency(totals.today), colour: C.solarGold },
        ].map(m => (
          <div key={m.label} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderTop: `2px solid ${m.colour}`, borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: m.colour }}>{m.value}</div>
            <div style={{ fontSize: 9, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* By Type */}
      {Object.keys(totals.byType).length > 0 && (
        <div style={{ background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: C.roseGold, marginBottom: 10 }}>By Fee Type</div>
          {Object.entries(totals.byType).map(([type, amount]) => (
            <div key={type} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${C.border}33` }}>
              <span style={{ fontSize: 11, color: C.textSec }}>{TYPE_LABELS[type] || type}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.white }}>{fmtCurrency(amount)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Transaction log */}
      <div style={{ background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', borderBottom: `1px solid ${C.border}`, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: C.roseGold }}>
          Transaction Log
        </div>
        {transactions.length === 0 ? (
          <div style={{ padding: '16px 14px', fontSize: 11, color: C.textMuted, fontStyle: 'italic' }}>No transactions yet</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {['Date', 'Type', 'Gateway', 'Amount'].map(h => (
                  <th key={h} style={{ padding: '7px 12px', textAlign: 'left', fontSize: 8.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: C.textMuted, fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.map(tx => (
                <tr key={tx.id} style={{ borderBottom: `1px solid ${C.border}22` }}>
                  <td style={{ padding: '8px 12px', color: C.textMuted, fontSize: 9.5, fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'nowrap' }}>{fmtDateTime(tx.createdAt)}</td>
                  <td style={{ padding: '8px 12px', color: C.textSec }}>{TYPE_LABELS[tx.type] || tx.type}</td>
                  <td style={{ padding: '8px 12px', color: C.textMuted, textTransform: 'uppercase', fontSize: 9 }}>{tx.gateway}</td>
                  <td style={{ padding: '8px 12px', color: C.error, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>-{fmtCurrency(tx.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
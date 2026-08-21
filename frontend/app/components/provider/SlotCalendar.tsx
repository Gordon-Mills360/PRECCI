// FILE: precci/frontend/app/components/provider/SlotCalendar.tsx
'use client';

import { useState } from 'react';

const C = {
  roseGold: '#C4A494', midnight: '#1A0A0F', bgPanel: '#2a1a1f',
  bgCard: '#221218', border: '#4a2a2f', textSec: '#d4b8b0',
  textMuted: '#8a6a6a', online: '#22c55e', busy: '#f97316',
  white: '#FFFFFF', warmGold: '#D4A853',
};

const TIME_SLOTS = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00'];

interface Slot {
  id: string;
  date: string;
  timeSlot: string;
  capacity: number;
  bookedCount: number;
}

interface SlotCalendarProps {
  slots: Slot[];
  onAddSlots: (date: string, timeSlots: string[]) => Promise<void>;
  providerId: string;
}

function getDaysAhead(n: number) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });
}

export default function SlotCalendar({ slots, onAddSlots, providerId }: SlotCalendarProps) {
  const [selectedDate, setSelectedDate] = useState(getDaysAhead(7)[0]);
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const days = getDaysAhead(14);

  const daySlots = slots.filter(s => s.date === selectedDate);
  const bookedTimes = new Set(daySlots.map(s => s.timeSlot));

  function toggleTime(t: string) {
    if (bookedTimes.has(t)) return;
    setSelectedTimes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  }

  async function handleSave() {
    if (!selectedTimes.length || saving) return;
    setSaving(true);
    try {
      await onAddSlots(selectedDate, selectedTimes);
      setSelectedTimes([]);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  function fmtDay(dateStr: string) {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Date picker */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '4px 0' }}>
        {days.map(day => {
          const hasSlotsOnDay = slots.some(s => s.date === day);
          return (
            <button key={day} onClick={() => setSelectedDate(day)} style={{
              flexShrink: 0, padding: '7px 12px', borderRadius: 8,
              background: selectedDate === day ? C.roseGold : hasSlotsOnDay ? C.roseGold + '15' : C.bgCard,
              border: `1px solid ${selectedDate === day ? C.roseGold : hasSlotsOnDay ? C.roseGold + '44' : C.border}`,
              color: selectedDate === day ? C.midnight : hasSlotsOnDay ? C.roseGold : C.textMuted,
              fontSize: 9.5, fontWeight: selectedDate === day ? 700 : 400, cursor: 'pointer',
              transition: 'all 150ms', whiteSpace: 'nowrap',
            }}>{fmtDay(day)}</button>
          );
        })}
      </div>

      {/* Time grid */}
      <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.roseGold, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {fmtDay(selectedDate)} — Select Available Times
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
          {TIME_SLOTS.map(t => {
            const existingSlot = daySlots.find(s => s.timeSlot === t);
            const isBooked = existingSlot && existingSlot.bookedCount >= existingSlot.capacity;
            const isAvailable = existingSlot && existingSlot.bookedCount < existingSlot.capacity;
            const isSelected = selectedTimes.includes(t);

            return (
              <button key={t} onClick={() => toggleTime(t)} disabled={!!existingSlot} style={{
                padding: '8px 6px', borderRadius: 6, border: `1px solid`,
                borderColor: isBooked ? C.busy + '44' : isAvailable ? C.online + '44' : isSelected ? C.roseGold : C.border,
                background: isBooked ? C.busy + '10' : isAvailable ? C.online + '10' : isSelected ? C.roseGold + '20' : 'transparent',
                color: isBooked ? C.busy : isAvailable ? C.online : isSelected ? C.roseGold : C.textMuted,
                fontSize: 10, fontWeight: isSelected || isAvailable || isBooked ? 600 : 400,
                cursor: existingSlot ? 'default' : 'pointer', transition: 'all 150ms',
                textAlign: 'center',
              }}>
                {t}
                {isBooked && <div style={{ fontSize: 7, marginTop: 1 }}>FULL</div>}
                {isAvailable && <div style={{ fontSize: 7, marginTop: 1 }}>{existingSlot!.capacity - existingSlot!.bookedCount} left</div>}
              </button>
            );
          })}
        </div>

        {selectedTimes.length > 0 && (
          <button onClick={handleSave} disabled={saving} style={{
            marginTop: 12, width: '100%', padding: '10px', borderRadius: 8,
            background: saved ? C.online : saving ? C.roseGold + '80' : C.roseGold,
            border: 'none', color: C.midnight, fontSize: 12, fontWeight: 700,
            cursor: saving ? 'wait' : 'pointer', transition: 'all 150ms',
          }}>
            {saved ? `✓ ${selectedTimes.length} slots added` : saving ? 'Saving...' : `Add ${selectedTimes.length} slot${selectedTimes.length > 1 ? 's' : ''}`}
          </button>
        )}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, fontSize: 9.5 }}>
        {[
          { col: C.online, label: 'Available' },
          { col: C.busy, label: 'Fully Booked' },
          { col: C.roseGold, label: 'Selected' },
          { col: C.border, label: 'Open' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: l.col, opacity: 0.8 }} />
            <span style={{ color: C.textMuted }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
// FILE: precci/frontend/app/(pwa)/tryon/page.tsx
// Belle's virtual try-on display.
// Simulations appear automatically as agents recommend.
// No button press needed — Belle renders as agents speak.

'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingPulse from '@/app/components/ui/LoadingPulse';

interface Simulation {
  proxiedUrl: string;
  lookType: string;
  description: string;
  historyId: string;
  expiresAt: string;
}

export default function TryOnPage() {
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  useEffect(() => {
    function onVoiceMessage(e: CustomEvent) {
      const msg = e.detail;

      // Belle sends simulation-ready event when a new look is rendered
      if (msg?.type === 'simulation-ready' && msg?.simulation) {
        setSimulations(prev => {
          const updated = [...prev, msg.simulation];
          setActiveIndex(updated.length - 1);
          return updated;
        });
      }
    }

    // Also check for simulations passed via session page
    function onSimulationReady(e: CustomEvent) {
      const sim = e.detail;
      if (sim?.proxiedUrl) {
        setSimulations(prev => {
          const updated = [...prev, sim];
          setActiveIndex(updated.length - 1);
          return updated;
        });
      }
    }

    window.addEventListener('precci:voice-message', onVoiceMessage as EventListener);
    window.addEventListener('precci:simulation-ready', onSimulationReady as EventListener);

    return () => {
      window.removeEventListener('precci:voice-message', onVoiceMessage as EventListener);
      window.removeEventListener('precci:simulation-ready', onSimulationReady as EventListener);
    };
  }, []);

  async function saveSimulation(historyId: string) {
    const token = localStorage.getItem('precci_access_token');
    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/camera/simulations/${historyId}/save`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    setSaved(prev => ({ ...prev, [historyId]: true }));
  }

  const activeSimulation = simulations[activeIndex];

  if (simulations.length === 0) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-6"
        style={{ background: '#1A0A0F' }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: 'rgba(201,132,122,0.1)', border: '1px solid rgba(201,132,122,0.3)' }}
          >
            <span className="text-3xl font-display font-bold" style={{ color: '#C9847A' }}>B</span>
          </div>
          <p className="font-display text-xl font-bold mb-2" style={{ color: '#FAF0E8' }}>
            Belle is ready
          </p>
          <p className="text-sm" style={{ color: 'rgba(250,240,232,0.4)' }}>
            Simulations will appear here automatically as your specialist makes recommendations.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#1A0A0F' }}>
      {/* Active simulation */}
      <AnimatePresence mode="wait">
        {activeSimulation && (
          <motion.div
            key={activeSimulation.historyId}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 relative"
          >
            <img
              src={activeSimulation.proxiedUrl}
              alt={activeSimulation.description}
              className="w-full h-full object-cover"
              style={{ maxHeight: '70vh' }}
            />
            <div
              className="absolute bottom-0 left-0 right-0 p-4"
              style={{ background: 'linear-gradient(transparent, rgba(26,10,15,0.95))' }}
            >
              <p className="text-xs uppercase tracking-widest mb-1" style={{ color: '#C9847A' }}>
                {activeSimulation.lookType}
              </p>
              <p className="text-sm" style={{ color: '#FAF0E8' }}>
                {activeSimulation.description}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save button */}
      {activeSimulation && (
        <div className="px-6 py-4">
          <button
            className={`btn-precci w-full ${saved[activeSimulation.historyId] ? 'opacity-60' : ''}`}
            onClick={() => saveSimulation(activeSimulation.historyId)}
            disabled={saved[activeSimulation.historyId]}
          >
            {saved[activeSimulation.historyId] ? 'Saved ✓' : 'Save This Look'}
          </button>
        </div>
      )}

      {/* Simulation history thumbnails */}
      {simulations.length > 1 && (
        <div className="flex gap-2 px-6 pb-6 overflow-x-auto">
          {simulations.map((sim, i) => (
            <button
              key={sim.historyId}
              onClick={() => setActiveIndex(i)}
              className="flex-shrink-0"
            >
              <div
                className="w-16 h-20 rounded-lg overflow-hidden"
                style={{
                  border: `2px solid ${i === activeIndex ? '#C9847A' : 'rgba(201,132,122,0.2)'}`,
                }}
              >
                <img
                  src={sim.proxiedUrl}
                  alt={sim.description}
                  className="w-full h-full object-cover"
                />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
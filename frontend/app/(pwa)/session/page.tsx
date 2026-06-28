// FILE: precci/frontend/app/(pwa)/session/page.tsx
// Live agent session screen.
// Voice-driven throughout — no text input ever.
// Shows active agent, voice waveform, Belle simulations, Nova products.
// Grace routes here after onboarding. Specialist agents run from here.

'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import VoiceListener from '@/app/components/voice/VoiceListener';
import AgentVoicePanel from '@/app/components/voice/AgentVoicePanel';
import VoiceStatusIndicator from '@/app/components/voice/VoiceStatusIndicator';
import LoadingPulse from '@/app/components/ui/LoadingPulse';
import type { VoiceState } from '@/app/components/voice/VoiceListener';

interface Simulation {
  proxiedUrl: string;
  lookType: string;
  description: string;
  expiresAt: string;
}

interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  currency: string;
  image_url: string;
  affiliate_url: string;
  description: string;
}

export default function SessionPage() {
  const [voiceState, setVoiceState] = useState<VoiceState>({
    isConnected: false,
    isListening: false,
    isSpeaking: false,
    currentAgent: 'Grace',
    error: null,
  });

  const [currentAgent, setCurrentAgent] = useState({
    name: 'Grace',
    pcId: 'PC-026',
  });

  const [activeSimulation, setActiveSimulation] = useState<Simulation | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [sessionStatus, setSessionStatus] = useState<'active' | 'loading' | 'idle'>('active');

  // Agent name to PC ID mapping
  const AGENT_MAP: Record<string, string> = {
    'Grace': 'PC-026', 'Luna': 'PC-008', 'Zara': 'PC-009',
    'Mia': 'PC-010', 'Isla': 'PC-011', 'Remy': 'PC-012',
    'Cora': 'PC-013', 'Drew': 'PC-014', 'Belle': 'PC-016',
    'Nova': 'PC-017', 'Lena': 'PC-021', 'Brook': 'PC-027',
  };

  useEffect(() => {
    function onVoiceMessage(e: CustomEvent) {
      const msg = e.detail;

      // Detect agent routing — update displayed agent
      if (msg?.type === 'function-call' && msg?.functionCall?.name === 'routeToAgent') {
        const targetAgentId = msg.functionCall.parameters?.targetAgentId;
        if (targetAgentId) {
          const agentName = Object.keys(AGENT_MAP).find(
            name => AGENT_MAP[name] === targetAgentId
          ) || 'Agent';
          setCurrentAgent({ name: agentName, pcId: targetAgentId });
        }
      }

      // Receive Belle simulation
      if (msg?.type === 'simulation-ready' && msg?.simulation) {
        setActiveSimulation(msg.simulation);
      }

      // Receive Nova products
      if (msg?.type === 'products-ready' && msg?.products) {
        setProducts(msg.products);
      }
    }

    window.addEventListener('precci:voice-message', onVoiceMessage as EventListener);
    return () =>
      window.removeEventListener('precci:voice-message', onVoiceMessage as EventListener);
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background:
          'radial-gradient(ellipse at 50% 0%, rgba(201,132,122,0.08) 0%, transparent 60%), #1A0A0F',
      }}
    >
      <VoiceListener onStateChange={setVoiceState} />

      {/* Top bar — agent identity + voice status */}
      <div
        className="flex items-center justify-between px-6 py-4 border-b safe-top"
        style={{ borderColor: 'rgba(201,132,122,0.12)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center font-display font-bold text-sm"
            style={{
              background: 'rgba(201,132,122,0.15)',
              border: '1px solid rgba(201,132,122,0.4)',
              color: '#C9847A',
            }}
          >
            {currentAgent.name.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: '#FAF0E8' }}>
              {currentAgent.name}
            </p>
            <p className="text-xs" style={{ color: 'rgba(250,240,232,0.4)' }}>
              {currentAgent.pcId}
            </p>
          </div>
        </div>

        <VoiceStatusIndicator
          isConnected={voiceState.isConnected}
          isSpeaking={voiceState.isSpeaking}
          isListening={voiceState.isListening}
        />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 gap-8">

        {/* Belle simulation display */}
        <AnimatePresence>
          {activeSimulation && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm"
            >
              <div
                className="relative rounded-2xl overflow-hidden"
                style={{ border: '1px solid rgba(201,132,122,0.3)', aspectRatio: '3/4' }}
              >
                <img
                  src={activeSimulation.proxiedUrl}
                  alt={activeSimulation.description}
                  className="w-full h-full object-cover"
                />
                <div
                  className="absolute bottom-0 left-0 right-0 p-3"
                  style={{ background: 'linear-gradient(transparent, rgba(26,10,15,0.9))' }}
                >
                  <p className="text-xs" style={{ color: 'rgba(250,240,232,0.7)' }}>
                    {activeSimulation.description}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Agent voice panel — always visible */}
        <AgentVoicePanel
          agentName={currentAgent.name}
          agentPcId={currentAgent.pcId}
          isSpeaking={voiceState.isSpeaking}
          isListening={voiceState.isListening}
        />

        {/* Nova products display */}
        <AnimatePresence>
          {products.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-sm"
            >
              <p
                className="text-xs tracking-widest uppercase mb-3"
                style={{ color: 'rgba(250,240,232,0.4)' }}
              >
                Nova's Recommendations
              </p>
              <div className="flex flex-col gap-3">
                {products.slice(0, 4).map((product, i) => (
                  <motion.div
                    key={product.id || i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="precci-card p-3 flex items-center gap-3"
                  >
                    {product.image_url && (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-medium truncate"
                        style={{ color: '#FAF0E8' }}
                      >
                        {product.name}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: 'rgba(250,240,232,0.4)' }}
                      >
                        {product.brand} · {product.currency} {product.price}
                      </p>
                    </div>
                    <div
                      className="text-xs px-2 py-1 rounded-full flex-shrink-0"
                      style={{
                        background: 'rgba(201,132,122,0.15)',
                        color: '#C9847A',
                        border: '1px solid rgba(201,132,122,0.3)',
                      }}
                    >
                      View
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom safe area */}
      <div className="safe-bottom" style={{ height: 20 }} />
    </div>
  );
}
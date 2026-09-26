// FILE: precci/frontend/app/(pwa)/session/page.tsx
'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from 'react';

const C = {
  roseGold: '#C9847A', midnight: '#1A0A0F', ivory: 'rgba(250,240,232,0.7)',
  ivoryMuted: 'rgba(250,240,232,0.4)', border: 'rgba(201,132,122,0.15)',
  bgCard: 'rgba(201,132,122,0.06)', online: '#22c55e',
};

const AGENT_COLOURS: Record<string, string> = {
  'PC-026': '#00C8ED', 'PC-008': '#C4A494', 'PC-009': '#D4A853',
  'PC-010': '#F2B5B0', 'PC-011': '#F5DEB3', 'PC-012': '#8B3A3A',
  'PC-013': '#F7F0E8', 'PC-014': '#3B82F6', 'PC-016': '#00C8ED',
  'PC-017': '#F5A623', 'PC-021': '#F7F0E8', 'PC-027': '#F5A623',
};

const AGENT_MAP: Record<string, string> = {
  'Grace': 'PC-026', 'Luna': 'PC-008', 'Zara': 'PC-009',
  'Mia': 'PC-010', 'Isla': 'PC-011', 'Remy': 'PC-012',
  'Cora': 'PC-013', 'Drew': 'PC-014', 'Belle': 'PC-016',
  'Nova': 'PC-017', 'Lena': 'PC-021', 'Brook': 'PC-027',
};

interface Simulation {
  proxiedUrl: string;
  lookType: string;
  description: string;
}

interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  currency: string;
  image_url: string;
  affiliate_url: string;
}

function VoiceWave({ active, colour }: { active: boolean; colour: string }) {
  const heights = [10, 18, 14, 22, 16, 12, 20];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      {heights.map((h, i) => (
        <div key={i} style={{
          width: 3, height: active ? h : 4, background: colour, borderRadius: 2,
          animation: active ? `voice-wave 0.8s ease-in-out infinite ${i * 100}ms` : 'none',
          opacity: active ? 1 : 0.3, transition: 'height 200ms ease',
        }} />
      ))}
    </div>
  );
}

export default function SessionPage() {
  const [mounted, setMounted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentAgent, setCurrentAgent] = useState({ name: 'Grace', pcId: 'PC-026' });
  const [activeSimulation, setActiveSimulation] = useState<Simulation | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;

    function onVoiceStart() { setIsConnected(true); setIsListening(true); }
    function onVoiceEnd() { setIsConnected(false); setIsListening(false); setIsSpeaking(false); }
    function onAgentSpeaking(e: Event) {
      const detail = (e as CustomEvent).detail;
      setIsSpeaking(detail.speaking);
      setIsListening(!detail.speaking);
    }
    function onVoiceMessage(e: Event) {
      const msg = (e as CustomEvent).detail;
      if (msg?.type === 'function-call' && msg?.functionCall?.name === 'routeToAgent') {
        const targetId = msg.functionCall.parameters?.targetAgentId;
        if (targetId) {
          const name = Object.keys(AGENT_MAP).find(n => AGENT_MAP[n] === targetId) || 'Agent';
          setCurrentAgent({ name, pcId: targetId });
        }
      }
      if (msg?.type === 'simulation-ready' && msg?.simulation) setActiveSimulation(msg.simulation);
      if (msg?.type === 'products-ready' && msg?.products) setProducts(msg.products);
    }

    window.addEventListener('precci:voice-start', onVoiceStart);
    window.addEventListener('precci:voice-end', onVoiceEnd);
    window.addEventListener('precci:agent-speaking', onAgentSpeaking);
    window.addEventListener('precci:voice-message', onVoiceMessage);

    return () => {
      window.removeEventListener('precci:voice-start', onVoiceStart);
      window.removeEventListener('precci:voice-end', onVoiceEnd);
      window.removeEventListener('precci:agent-speaking', onAgentSpeaking);
      window.removeEventListener('precci:voice-message', onVoiceMessage);
    };
  }, [mounted]);

  const agentColour = AGENT_COLOURS[currentAgent.pcId] || C.roseGold;

  if (!mounted) {
    return (
      <div style={{ minHeight: '100vh', background: C.midnight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ fontSize: 14, color: C.roseGold }}>Starting session...</div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      background: `radial-gradient(ellipse at 50% 0%, rgba(201,132,122,0.08) 0%, transparent 60%), ${C.midnight}`,
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>

      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 24px', borderBottom: `1px solid ${C.border}`, flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: agentColour + '20', border: `1.5px solid ${agentColour}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 800, color: agentColour,
          }}>
            {currentAgent.name.charAt(0)}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#FAF0E8' }}>{currentAgent.name}</div>
            <div style={{ fontSize: 10, color: C.ivoryMuted }}>{currentAgent.pcId}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: isSpeaking ? agentColour : isListening ? C.online : '#4a2a2f',
            animation: isConnected ? 'pulse-dot 2s infinite' : 'none',
          }} />
          <span style={{ fontSize: 10, color: C.ivoryMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {isSpeaking ? 'Speaking' : isListening ? 'Listening' : isConnected ? 'Connected' : 'Standby'}
          </span>
        </div>
      </div>

      {/* Main */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '32px 24px', gap: 32,
      }}>

        {/* Belle simulation */}
        {activeSimulation && (
          <div style={{ width: '100%', maxWidth: 360 }}>
            <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', border: `1px solid ${C.border}`, aspectRatio: '3/4' }}>
              <img src={activeSimulation.proxiedUrl} alt={activeSimulation.description} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12, background: 'linear-gradient(transparent, rgba(26,10,15,0.9))' }}>
                <div style={{ fontSize: 11, color: C.ivory }}>{activeSimulation.description}</div>
              </div>
            </div>
          </div>
        )}

        {/* Agent voice panel */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
          padding: '24px', background: agentColour + '08',
          border: `1px solid ${agentColour}22`, borderRadius: 20,
          width: '100%', maxWidth: 360,
        }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: agentColour + '20', border: `3px solid ${agentColour}`,
            boxShadow: isSpeaking ? `0 0 30px ${agentColour}55` : `0 0 12px ${agentColour}22`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, fontWeight: 900, color: agentColour,
            transition: 'box-shadow 300ms ease',
          }}>
            {currentAgent.name.charAt(0)}
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: agentColour }}>{currentAgent.name}</div>
            <div style={{ fontSize: 10, color: C.ivoryMuted, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {isSpeaking ? `${currentAgent.name} is speaking...` : isListening ? 'Listening...' : 'Ready'}
            </div>
          </div>
          <VoiceWave active={isSpeaking || isListening} colour={agentColour} />
        </div>

        {/* Nova products */}
        {products.length > 0 && (
          <div style={{ width: '100%', maxWidth: 360 }}>
            <div style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.ivoryMuted, marginBottom: 10 }}>
              Nova's Recommendations
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {products.slice(0, 4).map((product, i) => (
                <a key={product.id || i} href={product.affiliate_url} target="_blank" rel="noopener noreferrer" style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 12px', background: C.bgCard,
                  border: `1px solid ${C.border}`, borderRadius: 12,
                  textDecoration: 'none',
                }}>
                  {product.image_url && (
                    <img src={product.image_url} alt={product.name} style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#FAF0E8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</div>
                    <div style={{ fontSize: 11, color: C.ivoryMuted }}>{product.brand} · {product.currency} {product.price}</div>
                  </div>
                  <div style={{ padding: '4px 10px', borderRadius: 9999, background: C.roseGold + '20', color: C.roseGold, border: `1px solid ${C.roseGold}30`, fontSize: 10, flexShrink: 0 }}>View</div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ height: 20 }} />

      <style>{`
        @keyframes voice-wave { 0%,100%{transform:scaleY(1)} 50%{transform:scaleY(0.4)} }
        @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.85)} }
      `}</style>
    </div>
  );
}

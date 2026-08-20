// FILE: precci/frontend/app/components/tryon/TryOnDisplay.tsx
// CUTEME LTD — Try-On Display
// Shows Belle's virtual try-on simulation.
// Image proxied through backend — never direct Replicate URL.
// Full screen on mobile with save option.
// Loading state while Replicate renders.
// All genders, all skin tones, all looks.

'use client';

import { useState } from 'react';

interface TryOnDisplayProps {
  simulationUrl: string | null;
  lookDescription: string;
  agentColour: string;
  isLoading: boolean;
  onSave: () => void;
  onTryAnother: () => void;
}

export default function TryOnDisplay({
  simulationUrl,
  lookDescription,
  agentColour,
  isLoading,
  onSave,
  onTryAnother,
}: TryOnDisplayProps) {
  const [fullscreen, setFullscreen] = useState(false);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    onSave();
  }

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          gap: 20,
          padding: 24,
        }}
      >
        {/* Belle's rendering animation */}
        <div style={{ position: 'relative', width: 80, height: 80 }}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: `3px solid ${agentColour}22`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: `3px solid transparent`,
              borderTop: `3px solid ${agentColour}`,
              animation: 'spin-slow 0.8s linear infinite',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 8,
              borderRadius: '50%',
              border: `2px solid transparent`,
              borderTop: `2px solid ${agentColour}88`,
              animation: 'spin-slow 1.2s linear infinite reverse',
            }}
          />
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#FFFFFF', marginBottom: 6 }}>
            Belle is rendering your look
          </div>
          <div style={{ fontSize: 11, color: '#8a6a6a', lineHeight: 1.6 }}>
            {lookDescription}
          </div>
          <div style={{ fontSize: 10, color: '#8a6a6a', marginTop: 8, fontStyle: 'italic' }}>
            This takes 10–30 seconds...
          </div>
        </div>
      </div>
    );
  }

  if (!simulationUrl) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          gap: 12,
          padding: 24,
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 32, opacity: 0.3 }}>✨</div>
        <div style={{ fontSize: 13, color: '#8a6a6a', lineHeight: 1.7 }}>
          Belle's virtual try-on will appear here.<br />
          Ask any specialist agent to show you how you will look.
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: fullscreen ? '100vh' : '100%',
        ...(fullscreen ? { position: 'fixed', inset: 0, zIndex: 999, background: '#000' } : {}),
      }}
    >
      {/* The simulation image */}
      <img
        src={simulationUrl}
        alt={lookDescription}
        style={{
          width: '100%',
          height: '100%',
          objectFit: fullscreen ? 'contain' : 'cover',
          display: 'block',
        }}
        onError={e => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />

      {/* Look description overlay */}
      {!fullscreen && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(transparent, rgba(26,10,15,0.95))',
            padding: '32px 16px 16px',
          }}
        >
          <div style={{ fontSize: 12, color: '#d4b8b0', lineHeight: 1.5, marginBottom: 12 }}>
            {lookDescription}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleSave}
              disabled={saved}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: 9999,
                background: saved ? '#22c55e' : agentColour,
                color: '#1A0A0F',
                border: 'none',
                fontSize: 12,
                fontWeight: 700,
                cursor: saved ? 'default' : 'pointer',
                transition: 'all 200ms',
              }}
            >
              {saved ? '✓ Saved' : 'Save Look'}
            </button>
            <button
              onClick={() => setFullscreen(true)}
              style={{
                padding: '10px 14px',
                borderRadius: 9999,
                background: 'rgba(42, 26, 31, 0.9)',
                color: '#d4b8b0',
                border: `1px solid ${agentColour}44`,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              ⛶
            </button>
            <button
              onClick={onTryAnother}
              style={{
                padding: '10px 14px',
                borderRadius: 9999,
                background: 'rgba(42, 26, 31, 0.9)',
                color: '#d4b8b0',
                border: `1px solid ${agentColour}44`,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Try another
            </button>
          </div>
        </div>
      )}

      {/* Fullscreen close */}
      {fullscreen && (
        <button
          onClick={() => setFullscreen(false)}
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'rgba(26, 10, 15, 0.9)',
            border: `1px solid ${agentColour}`,
            color: agentColour,
            fontSize: 18,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
}
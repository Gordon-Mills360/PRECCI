// FILE: precci/frontend/app/components/voice/VoiceWaveform.tsx
// CUTEME LTD — Voice Waveform Animation
// Animated bars showing voice activity.
// Active = animated. Listening = slow pulse. Idle = flat.
// Used across all agent voice panels and the Vivienne interface.

'use client';

interface VoiceWaveformProps {
  state: 'idle' | 'listening' | 'speaking' | 'processing';
  colour?: string;
  barCount?: number;
  height?: number;
}

const STATE_CONFIGS = {
  idle: { opacity: 0.2, animated: false, heights: [4, 4, 4, 4, 4, 4, 4] },
  listening: { opacity: 0.5, animated: true, speed: '1.4s', heights: [8, 12, 10, 14, 10, 12, 8] },
  speaking: { opacity: 1, animated: true, speed: '0.7s', heights: [12, 20, 16, 24, 18, 14, 22] },
  processing: { opacity: 0.7, animated: true, speed: '1.0s', heights: [10, 10, 10, 10, 10, 10, 10] },
};

export default function VoiceWaveform({
  state,
  colour = '#C4A494',
  barCount = 7,
  height = 28,
}: VoiceWaveformProps) {
  const config = STATE_CONFIGS[state];
  const BAR_HEIGHTS = [12, 20, 16, 24, 18, 14, 22].slice(0, barCount);
  const IDLE_HEIGHT = 4;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        height,
      }}
    >
      {BAR_HEIGHTS.map((barH, i) => {
        const finalHeight = state === 'idle' ? IDLE_HEIGHT : barH;
        return (
          <div
            key={i}
            style={{
              width: 3,
              height: finalHeight,
              background: colour,
              borderRadius: 2,
              opacity: config.opacity,
              transformOrigin: 'center',
              animation: config.animated
                ? `voice-waveform ${config.speed || '0.8s'} ease-in-out infinite ${i * 100}ms`
                : 'none',
              transition: 'height 300ms ease, opacity 300ms ease',
              flexShrink: 0,
            }}
          />
        );
      })}
    </div>
  );
}
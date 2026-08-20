// FILE: precci/frontend/app/components/voice/VoiceStatusIndicator.tsx
// CUTEME LTD — Voice Status Indicator
// Shows current voice state with waveform and label.
// Idle: waiting. Listening: client is speaking.
// Speaking: agent is responding. Processing: Claude is reasoning.

'use client';

import VoiceWaveform from './VoiceWaveform';

interface VoiceStatusIndicatorProps {
  state: 'idle' | 'listening' | 'speaking' | 'processing';
  agentName?: string;
  agentColour?: string;
  showLabel?: boolean;
}

const STATE_LABELS = {
  idle: 'Speak to begin',
  listening: 'Listening...',
  speaking: 'Speaking...',
  processing: 'Thinking...',
};

const STATE_COLOURS = {
  idle: '#8a6a6a',
  listening: '#22c55e',
  speaking: '#C4A494',
  processing: '#D4A853',
};

export default function VoiceStatusIndicator({
  state,
  agentName,
  agentColour = '#C4A494',
  showLabel = true,
}: VoiceStatusIndicatorProps) {
  const colour = state === 'idle' ? '#8a6a6a' : agentColour;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <VoiceWaveform state={state} colour={colour} />
      {showLabel && (
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: STATE_COLOURS[state],
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            transition: 'color 300ms ease',
          }}
        >
          {agentName && state !== 'idle'
            ? `${agentName} — ${STATE_LABELS[state]}`
            : STATE_LABELS[state]}
        </div>
      )}
    </div>
  );
}
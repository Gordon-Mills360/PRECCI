// FILE: precci/frontend/app/components/voice/AgentVoicePanel.tsx
// CUTEME LTD — Agent Voice Panel
// The main client-facing voice conversation display.
// Shows agent avatar, name, voice state, live transcript.
// No text input anywhere. Voice only.
// Transcript appears as the conversation happens.
// Agent card updates when Grace routes to a specialist.

'use client';

import { useState, useEffect, useRef } from 'react';
import VoiceWaveform from './VoiceWaveform';
import VoiceStatusIndicator from './VoiceStatusIndicator';

const AGENT_COLOURS: Record<string, string> = {
  'PC-001': '#C4A494', 'PC-026': '#00C8ED', 'PC-008': '#C4A494',
  'PC-009': '#D4A853', 'PC-010': '#F2B5B0', 'PC-011': '#F5DEB3',
  'PC-012': '#8B3A3A', 'PC-013': '#F7F0E8', 'PC-014': '#3B82F6',
  'PC-015': '#4ECDC4', 'PC-016': '#00C8ED', 'PC-017': '#F5A623',
  'PC-018': '#C4A494', 'PC-019': '#F2B5B0', 'PC-020': '#D4A853',
  'PC-021': '#F7F0E8', 'PC-022': '#8B3A3A', 'PC-023': '#F5DEB3',
  'PC-024': '#3B82F6', 'PC-025': '#4ECDC4', 'PC-027': '#F5A623',
};

const AGENT_INITIALS: Record<string, string> = {
  'PC-001': 'VI', 'PC-026': 'GR', 'PC-008': 'LU', 'PC-009': 'ZA',
  'PC-010': 'MI', 'PC-011': 'IS', 'PC-012': 'RE', 'PC-013': 'CO',
  'PC-014': 'DR', 'PC-015': 'SA', 'PC-016': 'BE', 'PC-017': 'NO',
  'PC-018': 'PI', 'PC-019': 'NI', 'PC-020': 'EL', 'PC-021': 'LE',
  'PC-022': 'FI', 'PC-023': 'AU', 'PC-024': 'CL', 'PC-025': 'EV',
  'PC-027': 'BR',
};

interface TranscriptLine {
  id: string;
  speaker: 'user' | 'agent';
  text: string;
  timestamp: string;
}

interface AgentVoicePanelProps {
  agentId: string;
  agentName: string;
  agentRole: string;
  voiceState: 'idle' | 'listening' | 'speaking' | 'processing';
  transcriptLines: TranscriptLine[];
  showCamera?: boolean;
}

export default function AgentVoicePanel({
  agentId,
  agentName,
  agentRole,
  voiceState,
  transcriptLines,
  showCamera = false,
}: AgentVoicePanelProps) {
  const colour = AGENT_COLOURS[agentId] || '#C4A494';
  const initials = AGENT_INITIALS[agentId] || '??';
  const transcriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcriptLines]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#1A0A0F',
      }}
    >
      {/* Agent Identity */}
      <div
        style={{
          padding: '24px 20px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
          borderBottom: '1px solid #4a2a2f',
          background: '#2a1a1f',
          flexShrink: 0,
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: colour + '18',
            border: `3px solid ${colour}`,
            boxShadow: voiceState === 'speaking'
              ? `0 0 30px ${colour}55, 0 0 60px ${colour}22`
              : `0 0 16px ${colour}33`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            fontWeight: 900,
            color: colour,
            transition: 'box-shadow 300ms ease',
            position: 'relative',
          }}
        >
          {initials}
          {/* Status dot */}
          <div
            style={{
              position: 'absolute',
              bottom: 3,
              right: 3,
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: voiceState === 'speaking' ? colour
                : voiceState === 'listening' ? '#22c55e'
                : voiceState === 'processing' ? '#D4A853'
                : '#4a2a2f',
              border: '2px solid #1A0A0F',
              transition: 'background 300ms ease',
              animation: voiceState !== 'idle' ? 'pulse-dot 2s infinite' : 'none',
            }}
          />
        </div>

        {/* Name + Role */}
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: colour,
              lineHeight: 1.1,
              marginBottom: 4,
            }}
          >
            {agentName}
          </div>
          <div
            style={{
              fontSize: 11,
              color: '#8a6a6a',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            {agentRole}
          </div>
        </div>

        {/* Voice waveform */}
        <VoiceStatusIndicator
          state={voiceState}
          agentName={agentName}
          agentColour={colour}
          showLabel={true}
        />
      </div>

      {/* Transcript */}
      <div
        ref={transcriptRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {transcriptLines.length === 0 ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              padding: 32,
            }}
          >
            <VoiceWaveform state="idle" colour={colour} />
            <div
              style={{
                fontSize: 13,
                color: '#8a6a6a',
                textAlign: 'center',
                lineHeight: 1.8,
                fontStyle: 'italic',
              }}
            >
              {agentName} is ready.<br />
              Just start speaking.
            </div>
          </div>
        ) : (
          transcriptLines.map(line => (
            <div
              key={line.id}
              style={{
                display: 'flex',
                justifyContent: line.speaker === 'user' ? 'flex-end' : 'flex-start',
                animation: 'fade-in-up 200ms ease-out',
              }}
            >
              {line.speaker === 'agent' && (
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: colour + '20',
                    border: `1.5px solid ${colour}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 8,
                    fontWeight: 800,
                    color: colour,
                    flexShrink: 0,
                    marginRight: 8,
                    marginTop: 2,
                  }}
                >
                  {initials}
                </div>
              )}
              <div style={{ maxWidth: '75%' }}>
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: line.speaker === 'user'
                      ? '14px 4px 14px 14px'
                      : '4px 14px 14px 14px',
                    background: line.speaker === 'user'
                      ? colour
                      : '#2a1a1f',
                    color: line.speaker === 'user' ? '#1A0A0F' : '#d4b8b0',
                    fontSize: 13,
                    lineHeight: 1.6,
                    fontWeight: line.speaker === 'user' ? 500 : 400,
                    border: line.speaker === 'agent'
                      ? `1px solid ${colour}22`
                      : 'none',
                  }}
                >
                  {line.text}
                </div>
                <div
                  style={{
                    fontSize: 9,
                    color: '#8a6a6a',
                    marginTop: 3,
                    textAlign: line.speaker === 'user' ? 'right' : 'left',
                    fontFamily: 'JetBrains Mono, monospace',
                  }}
                >
                  {line.timestamp}
                </div>
              </div>
            </div>
          ))
        )}

        {/* Typing indicator when processing */}
        {voiceState === 'processing' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: colour + '20',
                border: `1.5px solid ${colour}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 8,
                fontWeight: 800,
                color: colour,
                flexShrink: 0,
              }}
            >
              {initials}
            </div>
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '4px 14px 14px 14px',
                background: '#2a1a1f',
                border: `1px solid ${colour}22`,
                display: 'flex',
                gap: 4,
                alignItems: 'center',
              }}
            >
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: colour,
                    opacity: 0.6,
                    animation: `pulse-dot 1s ease-in-out infinite ${i * 200}ms`,
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
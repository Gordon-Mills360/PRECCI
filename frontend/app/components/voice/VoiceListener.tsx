// FILE: precci/frontend/app/components/voice/VoiceListener.tsx
// CUTEME LTD — Voice Listener
// Always-on Vapi voice listener.
// Initialises Vapi on mount.
// Manages voice state transitions.
// Sends transcripts to backend for agent processing.
// Receives agent audio response and plays it.
// Grace is the default agent — routes to specialists.
// No text input. No buttons to start. Always listening.

'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

interface VoiceListenerProps {
  userId: string;
  sessionId: string;
  agentId: string;
  vapiAssistantId: string;
  onStateChange: (state: 'idle' | 'listening' | 'speaking' | 'processing') => void;
  onTranscript: (speaker: 'user' | 'agent', text: string) => void;
  onAgentRoute: (targetAgentId: string) => void;
  onSessionEnd: () => void;
  autoStart?: boolean;
}

export default function VoiceListener({
  userId,
  sessionId,
  agentId,
  vapiAssistantId,
  onStateChange,
  onTranscript,
  onAgentRoute,
  onSessionEnd,
  autoStart = true,
}: VoiceListenerProps) {
  const vapiRef = useRef<any>(null);
  const [initialised, setInitialised] = useState(false);

  const handleCallStart = useCallback(() => {
    onStateChange('listening');
  }, [onStateChange]);

  const handleCallEnd = useCallback(() => {
    onStateChange('idle');
    onSessionEnd();
  }, [onStateChange, onSessionEnd]);

  const handleSpeechStart = useCallback(() => {
    onStateChange('listening');
  }, [onStateChange]);

  const handleSpeechEnd = useCallback(() => {
    onStateChange('processing');
  }, [onStateChange]);

  const handleMessage = useCallback((message: any) => {
    if (message.type === 'transcript') {
      if (message.role === 'user') {
        onTranscript('user', message.transcript);
      } else if (message.role === 'assistant') {
        onStateChange('speaking');
        onTranscript('agent', message.transcript);
      }
    }

    // Agent routing signal from Vapi function call
    if (message.type === 'function-call' && message.functionCall?.name === 'route_to_agent') {
      const targetId = message.functionCall?.parameters?.agent_id;
      if (targetId) onAgentRoute(targetId);
    }
  }, [onStateChange, onTranscript, onAgentRoute]);

  const handleError = useCallback((error: any) => {
    console.error('Vapi error:', error);
    onStateChange('idle');
  }, [onStateChange]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY) return;

    async function initVapi() {
      try {
        const { default: Vapi } = await import('@vapi-ai/web');
        const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY!);

        vapi.on('call-start', handleCallStart);
        vapi.on('call-end', handleCallEnd);
        vapi.on('speech-start', handleSpeechStart);
        vapi.on('speech-end', handleSpeechEnd);
        vapi.on('message', handleMessage);
        vapi.on('error', handleError);

        vapiRef.current = vapi;
        setInitialised(true);

        if (autoStart && vapiAssistantId) {
          await vapi.start(vapiAssistantId, {
            metadata: {
              userId,
              sessionId,
              agentId,
            },
          });
        }
      } catch (err) {
        console.error('Vapi initialisation failed:', err);
      }
    }

    initVapi();

    return () => {
      if (vapiRef.current) {
        vapiRef.current.stop();
        vapiRef.current = null;
      }
    };
  }, [vapiAssistantId]);

  // Expose stop/start to parent if needed
  useEffect(() => {
    (window as any).__cutemeVapi = vapiRef.current;
  }, [initialised]);

  // This component renders nothing visible
  // Voice state is communicated via callbacks
  return null;
}
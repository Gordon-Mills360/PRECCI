// FILE: precci/frontend/app/components/voice/VoiceListener.tsx
// Manages the Vapi voice session lifecycle.
// Exposes voice state to all child components via window events.
// No text input anywhere in this component.

'use client';

import { useEffect, useState, useCallback } from 'react';

export interface VoiceState {
  isConnected: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  currentAgent: string | null;
  error: string | null;
}

interface VoiceListenerProps {
  onStateChange?: (state: VoiceState) => void;
  onMessage?: (message: any) => void;
  onRouting?: (targetAgent: string) => void;
}

export default function VoiceListener({
  onStateChange,
  onMessage,
  onRouting,
}: VoiceListenerProps) {
  const [voiceState, setVoiceState] = useState<VoiceState>({
    isConnected: false,
    isListening: false,
    isSpeaking: false,
    currentAgent: 'Grace',
    error: null,
  });

  const updateState = useCallback(
    (updates: Partial<VoiceState>) => {
      setVoiceState(prev => {
        const newState = { ...prev, ...updates };
        onStateChange?.(newState);
        return newState;
      });
    },
    [onStateChange]
  );

  useEffect(() => {
    function onVoiceStart() {
      updateState({ isConnected: true, isListening: true, error: null });
    }

    function onVoiceEnd() {
      updateState({ isConnected: false, isListening: false, isSpeaking: false });
    }

    function onAgentSpeaking(e: CustomEvent) {
      updateState({ isSpeaking: e.detail.speaking });
    }

    function onVoiceMessage(e: CustomEvent) {
      onMessage?.(e.detail);

      // Detect agent routing from message
      if (e.detail?.type === 'function-call' && e.detail?.functionCall?.name === 'routeToAgent') {
        const targetAgent = e.detail.functionCall.parameters?.targetAgentId;
        if (targetAgent) {
          onRouting?.(targetAgent);
        }
      }
    }

    function onVoiceError(e: CustomEvent) {
      updateState({ error: 'Voice connection issue. Tap to reconnect.', isListening: false });
    }

    window.addEventListener('precci:voice-start', onVoiceStart);
    window.addEventListener('precci:voice-end', onVoiceEnd);
    window.addEventListener('precci:agent-speaking', onAgentSpeaking as EventListener);
    window.addEventListener('precci:voice-message', onVoiceMessage as EventListener);
    window.addEventListener('precci:voice-error', onVoiceError as EventListener);

    return () => {
      window.removeEventListener('precci:voice-start', onVoiceStart);
      window.removeEventListener('precci:voice-end', onVoiceEnd);
      window.removeEventListener('precci:agent-speaking', onAgentSpeaking as EventListener);
      window.removeEventListener('precci:voice-message', onVoiceMessage as EventListener);
      window.removeEventListener('precci:voice-error', onVoiceError as EventListener);
    };
  }, [updateState, onMessage, onRouting]);

  // This component manages state only — renders nothing
  return null;
}
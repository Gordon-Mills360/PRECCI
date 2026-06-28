// FILE: precci/frontend/app/(pwa)/layout.tsx
'use client';

import { useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';

export default function PWALayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const vapiInitialisedRef = useRef(false);

  useEffect(() => {
    if (vapiInitialisedRef.current) return;
    vapiInitialisedRef.current = true;

    async function initialisePrecciVoice() {
      try {
        const { default: Vapi } = await import('@vapi-ai/web');
        const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;

        if (!publicKey || publicKey === 'your_vapi_public_key_here') {
          console.warn('PRECCI: Vapi public key not configured — voice inactive');
          return;
        }

        const vapi = new Vapi(publicKey);
        (window as any).__precciVapi = vapi;

        const graceAssistantId = process.env.NEXT_PUBLIC_VAPI_GRACE_ASSISTANT_ID;

        if (!graceAssistantId || graceAssistantId === 'vapi_grace_assistant_id_here') {
          console.warn('PRECCI: Grace assistant ID not configured — voice inactive');
          return;
        }

        vapi.on('call-start', () => {
          window.dispatchEvent(new CustomEvent('precci:voice-start'));
        });

        vapi.on('call-end', () => {
          window.dispatchEvent(new CustomEvent('precci:voice-end'));
        });

        vapi.on('speech-start', () => {
          window.dispatchEvent(
            new CustomEvent('precci:agent-speaking', { detail: { speaking: true } })
          );
        });

        vapi.on('speech-end', () => {
          window.dispatchEvent(
            new CustomEvent('precci:agent-speaking', { detail: { speaking: false } })
          );
        });

        vapi.on('message', (message: any) => {
          window.dispatchEvent(
            new CustomEvent('precci:voice-message', { detail: message })
          );
        });

        vapi.on('error', (error: any) => {
          console.warn('PRECCI Vapi error:', error);
          window.dispatchEvent(
            new CustomEvent('precci:voice-error', { detail: error })
          );
        });

        await vapi.start(graceAssistantId);
      } catch (error) {
        console.warn('PRECCI: Voice initialisation failed', error);
      }
    }

    initialisePrecciVoice();

    return () => {
      const vapi = (window as any).__precciVapi;
      if (vapi) {
        try { vapi.stop(); } catch { /* ignore */ }
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-midnight overflow-hidden">
      <AnimatePresence mode="wait">
        {children}
      </AnimatePresence>
    </div>
  );
}
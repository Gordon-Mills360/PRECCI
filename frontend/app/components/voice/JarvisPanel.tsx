// FILE: precci/frontend/app/components/voice/JarvisPanel.tsx
// JARVIS panel for Precious's dashboard.
// Handles audio recording, sends to JARVIS backend endpoint,
// plays Vivienne's audio response, applies dashboard navigation.
// No text input. Voice only.

'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import VoiceWaveform from './VoiceWaveform';

interface NavigationAction {
  navigationAction: string;
  target?: string;
}

interface JarvisPanelProps {
  onNavigate?: (action: NavigationAction) => void;
}

export default function JarvisPanel({ onNavigate }: JarvisPanelProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [statusText, setStatusText] = useState('Tap to speak to Vivienne');
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await sendToJarvis(audioBlob);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100);
      setIsRecording(true);
      setStatusText('Listening to Precious...');
    } catch (error) {
      setStatusText('Microphone access denied');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== 'inactive'
    ) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
      setStatusText('Vivienne is thinking...');
    }
  }, []);

  const sendToJarvis = useCallback(
    async (audioBlob: Blob) => {
      try {
        const token = localStorage.getItem('precci_access_token');
        if (!token) {
          setStatusText('Authentication required');
          setIsProcessing(false);
          return;
        }

        const formData = new FormData();
        formData.append('audio', audioBlob, 'precious-voice.webm');
        formData.append('conversationHistory', JSON.stringify(conversationHistory));
        formData.append('dashboardContext', JSON.stringify({}));

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/voice/jarvis`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          }
        );

        if (!response.ok) {
          throw new Error(`JARVIS request failed: ${response.status}`);
        }

        // Extract metadata from response headers
        const responseText = decodeURIComponent(
          response.headers.get('X-JARVIS-Response-Text') || ''
        );
        const navigationActionsRaw = decodeURIComponent(
          response.headers.get('X-JARVIS-Navigation') || '[]'
        );

        let navigationActions: NavigationAction[] = [];
        try {
          navigationActions = JSON.parse(navigationActionsRaw);
        } catch { /* ignore parse errors */ }

        // Apply dashboard navigation actions
        if (navigationActions.length > 0 && onNavigate) {
          for (const action of navigationActions) {
            onNavigate(action);
          }
        }

        // Update conversation history
        if (responseText) {
          setConversationHistory(prev => [
            ...prev,
            { role: 'assistant', content: responseText },
          ]);
        }

        // Play Vivienne's audio response
        const audioBuffer = await response.arrayBuffer();
        const audioBlob2 = new Blob([audioBuffer], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(audioBlob2);

        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        audio.onplay = () => {
          setIsPlaying(true);
          setStatusText('Vivienne is speaking...');
        };

        audio.onended = () => {
          setIsPlaying(false);
          setStatusText('Tap to speak to Vivienne');
          URL.revokeObjectURL(audioUrl);
        };

        audio.onerror = () => {
          setIsPlaying(false);
          setStatusText('Audio playback failed — try again');
        };

        await audio.play();
        setIsProcessing(false);
      } catch (error) {
        setIsProcessing(false);
        setIsPlaying(false);
        setStatusText('Connection issue — tap to try again');
      }
    },
    [conversationHistory, onNavigate]
  );

  function handleTap() {
    if (isProcessing || isPlaying) return;

    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }

  return (
    <div className="flex flex-col items-center gap-6 p-8">
      {/* JARVIS header */}
      <div className="text-center">
        <p
          className="text-xs tracking-[0.3em] uppercase mb-1"
          style={{ color: 'rgba(212,168,83,0.7)' }}
        >
          JARVIS
        </p>
        <p className="text-sm" style={{ color: 'rgba(250,240,232,0.5)' }}>
          Vivienne is listening
        </p>
      </div>

      {/* Voice orb */}
      <div
        className="relative cursor-pointer"
        style={{ width: 100, height: 100 }}
        onClick={handleTap}
      >
        <AnimatePresence>
          {isRecording && (
            <>
              {[1, 2].map(i => (
                <motion.div
                  key={i}
                  className="absolute inset-0 rounded-full border border-rose-gold/30"
                  initial={{ scale: 1, opacity: 0.8 }}
                  animate={{ scale: 1.4 + i * 0.3, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
                />
              ))}
            </>
          )}
        </AnimatePresence>

        <motion.div
          className="absolute inset-0 rounded-full flex items-center justify-center"
          animate={{
            boxShadow:
              isRecording || isPlaying
                ? '0 0 40px rgba(201,132,122,0.5)'
                : '0 0 15px rgba(201,132,122,0.15)',
          }}
          style={{
            background:
              'radial-gradient(circle, rgba(201,132,122,0.25) 0%, rgba(139,58,58,0.15) 60%, transparent 100%)',
            border: `1px solid rgba(201,132,122,${isRecording || isPlaying ? '0.7' : '0.3'})`,
          }}
        >
          <VoiceWaveform
            isActive={isRecording || isPlaying}
            barCount={5}
            height={30}
            color={isRecording ? '#F2B5B0' : '#C9847A'}
          />

          {!isRecording && !isPlaying && !isProcessing && (
            <span
              className="font-display font-bold text-2xl"
              style={{ color: '#C9847A' }}
            >
              V
            </span>
          )}

          {isProcessing && (
            <motion.div
              className="w-4 h-4 rounded-full border-2 border-rose-gold border-t-transparent"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
            />
          )}
        </motion.div>
      </div>

      {/* Status text */}
      <AnimatePresence mode="wait">
        <motion.p
          key={statusText}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="text-xs tracking-widest uppercase text-center"
          style={{ color: 'rgba(250,240,232,0.4)' }}
        >
          {statusText}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
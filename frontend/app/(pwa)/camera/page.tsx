// FILE: precci/frontend/app/(pwa)/camera/page.tsx
// Camera view — live feed with agent analysis overlay.
// Captures frames every 3 seconds while agent is active.
// Never stores frames on device or in browser.
// Camera activates when specialist agent needs to see client.

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import VoiceStatusIndicator from '@/app/components/voice/VoiceStatusIndicator';

interface CameraPageProps {
  agentId?: string;
  sessionId?: string;
  onAnalysisComplete?: (analysis: any) => void;
}

export default function CameraPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const captureIntervalRef = useRef<NodeJS.Timeout>();

  const [cameraActive, setCameraActive] = useState(false);
  const [analysing, setAnalysing] = useState(false);
  const [hasConsent, setHasConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentAgent, setCurrentAgent] = useState('PC-008');

  // Request camera access
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
        setError(null);
      }
    } catch (err: any) {
      setError('Camera access denied. Please allow camera access to use PRECCI\'s appearance intelligence.');
      setCameraActive(false);
    }
  }, []);

  // Capture and send frame to backend
  const captureAndSendFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !cameraActive || analysing) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context || video.readyState !== 4) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    const frameBase64 = canvas.toDataURL('image/jpeg', 0.85).split(',')[1];

    try {
      setAnalysing(true);

      const token = localStorage.getItem('precci_access_token');
      const sessionId = localStorage.getItem('precci_session_id');

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/camera/analyse`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            frame: frameBase64,
            agentId: currentAgent,
            sessionId,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Dispatch analysis result for the active agent to use
        window.dispatchEvent(
          new CustomEvent('precci:camera-analysis', { detail: data })
        );
      }
    } catch (err) {
      // Non-fatal — continue capturing
    } finally {
      setAnalysing(false);
    }
  }, [cameraActive, analysing, currentAgent]);

  useEffect(() => {
    // Check consent first
    const token = localStorage.getItem('precci_access_token');
    if (!token) return;

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        if (data.user?.camera_consent) {
          setHasConsent(true);
          startCamera();
        }
      })
      .catch(() => {});

    // Listen for agent routing to update current agent
    function onVoiceMessage(e: CustomEvent) {
      const msg = e.detail;
      if (msg?.type === 'function-call' && msg?.functionCall?.name === 'routeToAgent') {
        const targetId = msg.functionCall.parameters?.targetAgentId;
        if (targetId) setCurrentAgent(targetId);
      }
    }

    window.addEventListener('precci:voice-message', onVoiceMessage as EventListener);

    return () => {
      window.removeEventListener('precci:voice-message', onVoiceMessage as EventListener);
      streamRef.current?.getTracks().forEach(t => t.stop());
      clearInterval(captureIntervalRef.current);
    };
  }, [startCamera]);

  // Start frame capture interval once camera is active
  useEffect(() => {
    if (cameraActive && hasConsent) {
      captureIntervalRef.current = setInterval(captureAndSendFrame, 3000);
    }
    return () => clearInterval(captureIntervalRef.current);
  }, [cameraActive, hasConsent, captureAndSendFrame]);

  async function grantConsent() {
    const token = localStorage.getItem('precci_access_token');
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/camera/consent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ consent: true }),
    });
    setHasConsent(true);
    startCamera();
  }

  if (!hasConsent) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: '#1A0A0F' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-xs"
        >
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: 'rgba(201,132,122,0.15)', border: '1px solid rgba(201,132,122,0.4)' }}
          >
            <span className="text-3xl">📷</span>
          </div>
          <h2 className="font-display text-2xl font-bold mb-3" style={{ color: '#FAF0E8' }}>
            Camera Access
          </h2>
          <p className="text-sm mb-8" style={{ color: 'rgba(250,240,232,0.5)' }}>
            PRECCI's AI specialists need to see you to provide personalised analysis.
            Your camera feed is processed securely and never stored without your permission.
          </p>
          <button
            className="btn-precci w-full"
            onClick={grantConsent}
          >
            Allow Camera Access
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-midnight relative overflow-hidden">
      {/* Live camera feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
        style={{ transform: 'scaleX(-1)' }}
      />

      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* PRECCI overlay */}
      <div className="absolute inset-0 flex flex-col">
        {/* Top bar */}
        <div
          className="flex items-center justify-between px-6 py-4 safe-top"
          style={{ background: 'linear-gradient(to bottom, rgba(26,10,15,0.8), transparent)' }}
        >
          <p className="text-xs tracking-widest uppercase" style={{ color: 'rgba(201,132,122,0.8)' }}>
            PRECCI VISION
          </p>
          <VoiceStatusIndicator
            isConnected={cameraActive}
            isSpeaking={false}
            isListening={cameraActive}
          />
        </div>

        {/* Analysis indicator */}
        <div className="flex-1 flex items-center justify-center">
          <AnimatePresence>
            {analysing && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
              >
                <div
                  className="px-4 py-2 rounded-full text-xs tracking-widest uppercase"
                  style={{
                    background: 'rgba(26,10,15,0.8)',
                    border: '1px solid rgba(201,132,122,0.4)',
                    color: '#C9847A',
                  }}
                >
                  Analysing...
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom — Rose Gold frame guides */}
        <div
          className="px-6 pb-8 safe-bottom"
          style={{ background: 'linear-gradient(to top, rgba(26,10,15,0.8), transparent)' }}
        >
          <p
            className="text-xs text-center tracking-widest uppercase"
            style={{ color: 'rgba(201,132,122,0.6)' }}
          >
            {error || 'Your specialist is analysing in real time'}
          </p>
        </div>
      </div>

      {/* Corner frame guides */}
      {['top-4 left-4', 'top-4 right-4', 'bottom-4 left-4', 'bottom-4 right-4'].map((pos, i) => (
        <div key={i} className={`absolute ${pos} w-8 h-8`}>
          <div
            className="w-full h-full"
            style={{
              borderTop: i < 2 ? '2px solid rgba(201,132,122,0.6)' : 'none',
              borderBottom: i >= 2 ? '2px solid rgba(201,132,122,0.6)' : 'none',
              borderLeft: i % 2 === 0 ? '2px solid rgba(201,132,122,0.6)' : 'none',
              borderRight: i % 2 !== 0 ? '2px solid rgba(201,132,122,0.6)' : 'none',
            }}
          />
        </div>
      ))}
    </div>
  );
}
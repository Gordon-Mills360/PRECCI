// FILE: precci/frontend/app/components/camera/CameraView.tsx
// CUTEME LTD — Camera View
// Live camera feed rendered to a video element.
// Face detection overlay drawn on canvas.
// Front camera by default. Mirror mode.
// Activates when agent requests camera.
// Streams are cleaned up on unmount.

'use client';

import { useEffect, useRef, useState } from 'react';

interface CameraViewProps {
  active: boolean;
  agentColour: string;
  onStreamReady: (stream: MediaStream) => void;
  onStreamError: (err: Error) => void;
  showOverlay?: boolean;
  overlayPoints?: Array<{ x: number; y: number }>;
}

export default function CameraView({
  active,
  agentColour,
  onStreamReady,
  onStreamError,
  showOverlay = true,
  overlayPoints = [],
}: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [streaming, setStreaming] = useState(false);

  useEffect(() => {
    if (!active) {
      // Stop stream when deactivated
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        setStreaming(false);
      }
      return;
    }

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user', // Front camera
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            setStreaming(true);
            onStreamReady(stream);
          };
        }
      } catch (err) {
        onStreamError(err as Error);
      }
    }

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [active]);

  // Draw face overlay points on canvas
  useEffect(() => {
    if (!canvasRef.current || !showOverlay || overlayPoints.length === 0) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    // Draw connecting lines
    if (overlayPoints.length > 1) {
      ctx.beginPath();
      ctx.moveTo(overlayPoints[0].x, overlayPoints[0].y);
      overlayPoints.forEach(pt => ctx.lineTo(pt.x, pt.y));
      ctx.closePath();
      ctx.strokeStyle = agentColour + '55';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Draw points
    overlayPoints.forEach(pt => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = agentColour;
      ctx.fill();
    });
  }, [overlayPoints, agentColour, showOverlay]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: '#0a0005',
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      {/* Video feed */}
      <video
        ref={videoRef}
        muted
        playsInline
        autoPlay
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: 'scaleX(-1)', // Mirror front camera
          display: streaming ? 'block' : 'none',
        }}
      />

      {/* Loading state */}
      {!streaming && active && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              border: `3px solid ${agentColour}33`,
              borderTop: `3px solid ${agentColour}`,
              animation: 'spin-slow 0.8s linear infinite',
            }}
          />
          <div style={{ fontSize: 11, color: '#8a6a6a' }}>Activating camera...</div>
        </div>
      )}

      {/* Face overlay canvas */}
      {showOverlay && streaming && (
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Analysis indicator */}
      {streaming && (
        <div
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            background: 'rgba(26, 10, 15, 0.85)',
            borderRadius: 9999,
            padding: '4px 10px',
            fontSize: 9,
            fontWeight: 700,
            color: '#ef4444',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#ef4444',
              animation: 'pulse-dot 2s infinite',
            }}
          />
          LIVE
        </div>
      )}
    </div>
  );
}
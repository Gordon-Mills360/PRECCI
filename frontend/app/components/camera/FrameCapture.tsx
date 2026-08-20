// FILE: precci/frontend/app/components/camera/FrameCapture.tsx
// CUTEME LTD — Frame Capture
// Captures frames from the live video stream.
// Sends frames to backend Claude Vision endpoint.
// Throttled to one frame every 3 seconds.
// Returns analysis result to parent component.
// Stops automatically when deactivated.

'use client';

import { useEffect, useRef, useCallback } from 'react';

interface FrameCaptureProps {
  stream: MediaStream | null;
  active: boolean;
  userId: string;
  sessionId: string;
  agentId: string;
  intervalMs?: number;
  onAnalysis: (result: any) => void;
  onError: (err: string) => void;
}

export default function FrameCapture({
  stream,
  active,
  userId,
  sessionId,
  agentId,
  intervalMs = 3000,
  onAnalysis,
  onError,
}: FrameCaptureProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const capturingRef = useRef(false);

  const captureAndAnalyse = useCallback(async () => {
    if (!stream || !active || capturingRef.current) return;

    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack || videoTrack.readyState !== 'live') return;

    // Create canvas for frame capture if not exists
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }

    const canvas = canvasRef.current;
    const settings = videoTrack.getSettings();
    canvas.width = settings.width || 640;
    canvas.height = settings.height || 480;

    // Draw current video frame to canvas
    const video = document.querySelector('video') as HTMLVideoElement;
    if (!video || video.readyState < 2) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    capturingRef.current = true;

    try {
      // Mirror-correct the frame
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
      ctx.restore();

      // Convert to base64 JPEG
      const frameData = canvas.toDataURL('image/jpeg', 0.8);
      const base64 = frameData.split(',')[1];

      const response = await fetch('/api/camera/analyse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frameBase64: base64,
          userId,
          sessionId,
          agentId,
          mimeType: 'image/jpeg',
        }),
      });

      if (!response.ok) {
        throw new Error(`Camera analysis failed: ${response.status}`);
      }

      const result = await response.json();
      if (result.success && result.data) {
        onAnalysis(result.data);
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Frame capture failed');
    } finally {
      capturingRef.current = false;
    }
  }, [stream, active, userId, sessionId, agentId, onAnalysis, onError]);

  useEffect(() => {
    if (active && stream) {
      // Initial capture
      captureAndAnalyse();
      // Interval captures
      intervalRef.current = setInterval(captureAndAnalyse, intervalMs);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [active, stream, captureAndAnalyse, intervalMs]);

  // This component renders nothing — pure logic
  return null;
}
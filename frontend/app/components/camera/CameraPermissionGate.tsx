// FILE: precci/frontend/app/components/camera/CameraPermissionGate.tsx
// CUTEME LTD — Camera Permission Gate
// Requests camera permission before activating camera view.
// Voice-driven — agent asks for permission by voice first.
// Shows clear explanation. No text input.
// On grant: renders children (CameraView).
// On deny: agent continues voice-only.

'use client';

import { useState, useEffect } from 'react';

interface CameraPermissionGateProps {
  children: React.ReactNode;
  agentName: string;
  agentColour: string;
  onPermissionGranted: () => void;
  onPermissionDenied: () => void;
}

type PermissionState = 'unknown' | 'requesting' | 'granted' | 'denied';

export default function CameraPermissionGate({
  children,
  agentName,
  agentColour,
  onPermissionGranted,
  onPermissionDenied,
}: CameraPermissionGateProps) {
  const [permissionState, setPermissionState] = useState<PermissionState>('unknown');

  useEffect(() => {
    // Check existing permission state
    if (typeof navigator !== 'undefined' && navigator.permissions) {
      navigator.permissions
        .query({ name: 'camera' as PermissionName })
        .then(result => {
          if (result.state === 'granted') {
            setPermissionState('granted');
            onPermissionGranted();
          } else if (result.state === 'denied') {
            setPermissionState('denied');
            onPermissionDenied();
          }
          // 'prompt' = unknown, wait for user to activate
          result.onchange = () => {
            if (result.state === 'granted') {
              setPermissionState('granted');
              onPermissionGranted();
            } else if (result.state === 'denied') {
              setPermissionState('denied');
              onPermissionDenied();
            }
          };
        })
        .catch(() => {
          // Permissions API not supported — request directly
        });
    }
  }, []);

  async function requestPermission() {
    setPermissionState('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Stop immediately — CameraView will request its own stream
      stream.getTracks().forEach(track => track.stop());
      setPermissionState('granted');
      onPermissionGranted();
    } catch {
      setPermissionState('denied');
      onPermissionDenied();
    }
  }

  if (permissionState === 'granted') {
    return <>{children}</>;
  }

  if (permissionState === 'denied') {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          gap: 16,
          padding: 24,
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 32, opacity: 0.4 }}>📷</div>
        <div style={{ fontSize: 13, color: '#d4b8b0', lineHeight: 1.7 }}>
          Camera access was denied.<br />
          {agentName} can still help you by voice.<br />
          <span style={{ fontSize: 11, color: '#8a6a6a' }}>
            Enable camera in your browser settings for the full experience.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: 20,
        padding: 28,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: agentColour + '18',
          border: `2px solid ${agentColour}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 28,
        }}
      >
        📷
      </div>
      <div>
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: '#FFFFFF',
            marginBottom: 8,
          }}
        >
          {agentName} needs to see you
        </div>
        <div
          style={{
            fontSize: 12,
            color: '#d4b8b0',
            lineHeight: 1.7,
            marginBottom: 20,
          }}
        >
          For real-time analysis of your skin, hair and appearance,
          {agentName} uses your camera. Your footage is never stored
          without your consent.
        </div>
      </div>
      <button
        onClick={requestPermission}
        disabled={permissionState === 'requesting'}
        style={{
          padding: '14px 32px',
          borderRadius: 9999,
          background: agentColour,
          color: '#1A0A0F',
          border: 'none',
          fontSize: 14,
          fontWeight: 700,
          cursor: permissionState === 'requesting' ? 'wait' : 'pointer',
          opacity: permissionState === 'requesting' ? 0.7 : 1,
          transition: 'all 150ms',
          letterSpacing: '0.02em',
        }}
      >
        {permissionState === 'requesting' ? 'Requesting...' : 'Allow Camera Access'}
      </button>
      <div style={{ fontSize: 10, color: '#8a6a6a', lineHeight: 1.6 }}>
        You can continue by voice without camera access.
      </div>
    </div>
  );
}
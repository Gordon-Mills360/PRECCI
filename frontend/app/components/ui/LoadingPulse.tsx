// FILE: precci/frontend/app/components/ui/LoadingPulse.tsx
// CUTEME LTD — Loading Pulse
// Branded loading state. Rose Gold animated rings.
// Used across all pages while data loads.
// Optional label text.

'use client';

interface LoadingPulseProps {
  colour?: string;
  size?: number;
  label?: string;
}

export default function LoadingPulse({
  colour = '#C4A494',
  size = 48,
  label,
}: LoadingPulseProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
      }}
    >
      <div style={{ position: 'relative', width: size, height: size }}>
        {/* Outer ring */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: `2px solid ${colour}22`,
          }}
        />
        {/* Spinning ring */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: `2px solid transparent`,
            borderTop: `2px solid ${colour}`,
            animation: 'spin-slow 0.8s linear infinite',
          }}
        />
        {/* Inner counter-rotating ring */}
        <div
          style={{
            position: 'absolute',
            inset: size * 0.18,
            borderRadius: '50%',
            border: `1.5px solid transparent`,
            borderTop: `1.5px solid ${colour}66`,
            animation: 'spin-slow 1.4s linear infinite reverse',
          }}
        />
        {/* Centre dot */}
        <div
          style={{
            position: 'absolute',
            inset: '50%',
            width: size * 0.14,
            height: size * 0.14,
            marginLeft: -(size * 0.07),
            marginTop: -(size * 0.07),
            borderRadius: '50%',
            background: colour,
            animation: 'pulse-dot 1.4s ease-in-out infinite',
          }}
        />
      </div>
      {label && (
        <div
          style={{
            fontSize: 11,
            color: '#8a6a6a',
            fontStyle: 'italic',
            letterSpacing: '0.03em',
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
}
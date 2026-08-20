// FILE: precci/frontend/app/layout.tsx
// CUTEME LTD — Root Next.js Layout
// PWA setup. Brand fonts. CSS variables. Vapi initialisation.
// Service worker registration. Zero text input anywhere.
// Camera permission handled at component level.
// This layout wraps every page in the entire system.

import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'CUTEME LTD — Your Personal AI Appearance Intelligence System',
  description: 'The world\'s first Personal AI Appearance Intelligence System. Camera AI sees you in real time. 28 specialist agents analyse your skin, hair, body and style — then show you exactly how you will look.',
  applicationName: 'CUTEME LTD',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CUTEME LTD',
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'CUTEME LTD',
    description: 'Your Personal AI Appearance Intelligence System',
    type: 'website',
    locale: 'en_US',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#1A0A0F',
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="CUTEME LTD" />

        {/* Brand colours as meta */}
        <meta name="theme-color" content="#1A0A0F" />
        <meta name="msapplication-TileColor" content="#1A0A0F" />

        {/* Prevent zoom on input focus — voice-first, no typing */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />

        {/* JetBrains Mono for logs and timestamps */}
        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap"
          as="style"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap"
        />
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          background: '#1A0A0F',
          color: '#FFFFFF',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          overscrollBehavior: 'none',
          WebkitTapHighlightColor: 'transparent',
          WebkitUserSelect: 'none',
          userSelect: 'none',
        }}
      >
        {children}
        {/* Service worker registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function(err) {
                    console.error('SW registration failed:', err);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
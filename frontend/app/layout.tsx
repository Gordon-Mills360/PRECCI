// FILE: precci/frontend/app/layout.tsx
// Root Next.js layout. PWA meta tags. PRECCI brand colours.
// Vapi client initialisation — microphone always ready when app open.
// ZERO text input fields in this layout shell.
// No gender assumption anywhere in layout.

import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'PRECCI — Personal AI Appearance Intelligence',
  description:
    'The world\'s first Personal AI Appearance Intelligence System. AI agents analyse your skin, hair, body and style in real time — then book real-world appointments instantly.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'PRECCI',
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  icons: {
    icon: [
      { url: '/icons/icon-72x72.png',   sizes: '72x72',   type: 'image/png' },
      { url: '/icons/icon-96x96.png',   sizes: '96x96',   type: 'image/png' },
      { url: '/icons/icon-128x128.png', sizes: '128x128', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'PRECCI — Personal AI Appearance Intelligence',
    description: 'The world\'s first Personal AI Appearance Intelligence System.',
    type: 'website',
    locale: 'en_US',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#C9847A',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <head>
        {/* PWA meta tags */}
        <meta name="application-name" content="PRECCI" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="PRECCI" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#1A0A0F" />
        <meta name="msapplication-tap-highlight" content="no" />

        {/* Service worker registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js', { scope: '/' })
                    .then(function(reg) {
                      console.log('PRECCI SW registered');
                    })
                    .catch(function(err) {
                      console.warn('PRECCI SW registration failed:', err);
                    });
                });
              }
            `,
          }}
        />
      </head>
      <body className="bg-midnight text-ivory-cream antialiased no-select">
        {children}
      </body>
    </html>
  );
}
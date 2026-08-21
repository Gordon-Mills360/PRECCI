// FILE: precci/frontend/next.config.js
// CUTEME LTD — Next.js Configuration
// PWA setup. API proxy to backend.
// Security headers. Image domains.
// No text input anywhere in client-facing routes.

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable PWA features
  reactStrictMode: true,

  // API proxy — all /api calls go to backend
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.BACKEND_URL || 'http://localhost:4000'}/api/:path*`,
      },
    ];
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=self, microphone=self, geolocation=self' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.vapi.ai",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https:",
              "media-src 'self' blob:",
              "connect-src 'self' https://api.cuteme.com https://*.supabase.co wss://*.supabase.co https://cdn.vapi.ai wss://api.vapi.ai https://api.openweathermap.org",
              "worker-src 'self' blob:",
              "frame-src 'none'",
            ].join('; '),
          },
        ],
      },
    ];
  },

  // Image domains for Nova products and provider images
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'api.cuteme.com' },
      { protocol: 'https', hostname: '**.replicate.delivery' },
    ],
  },

  // Environment variables available to frontend
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_VAPI_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY,
  },

  // TypeScript and ESLint
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: false },

  // Output for Vercel
  output: 'standalone',

  // Experimental features
  experimental: {
    serverActions: { allowedOrigins: ['cuteme.com', 'localhost:3000'] },
  },
};

module.exports = nextConfig;
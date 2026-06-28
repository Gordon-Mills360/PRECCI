// FILE: precci/frontend/tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'rose-gold':    '#C9847A',
        'blush-pink':   '#F2B5B0',
        'warm-gold':    '#D4A853',
        'ivory-cream':  '#FAF0E8',
        'deep-rose':    '#8B3A3A',
        'champagne':    '#F5DEB3',
        'midnight':     '#1A0A0F',
        'pure-white':   '#FFFFFF',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-playfair)', 'Georgia', 'serif'],
      },
      animation: {
        'voice-pulse':   'voicePulse 1.5s ease-in-out infinite',
        'voice-ring':    'voiceRing 2s ease-in-out infinite',
        'fade-in':       'fadeIn 0.5s ease-in-out',
        'slide-up':      'slideUp 0.4s ease-out',
        'glow':          'glow 2s ease-in-out infinite',
      },
      keyframes: {
        voicePulse: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%':      { transform: 'scale(1.05)', opacity: '0.8' },
        },
        voiceRing: {
          '0%':   { transform: 'scale(1)', opacity: '0.8' },
          '100%': { transform: 'scale(1.6)', opacity: '0' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideUp: {
          from: { transform: 'translateY(20px)', opacity: '0' },
          to:   { transform: 'translateY(0)', opacity: '1' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(201, 132, 122, 0.3)' },
          '50%':      { boxShadow: '0 0 40px rgba(201, 132, 122, 0.7)' },
        },
      },
      backgroundImage: {
        'precci-gradient':
          'linear-gradient(135deg, #1A0A0F 0%, #2D1218 50%, #1A0A0F 100%)',
        'gold-gradient':
          'linear-gradient(135deg, #C9847A 0%, #D4A853 50%, #C9847A 100%)',
        'rose-gradient':
          'linear-gradient(135deg, #F2B5B0 0%, #C9847A 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
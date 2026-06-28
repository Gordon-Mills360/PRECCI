// FILE: precci/backend/src/index.js
'use strict';

require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const logger = require('./utils/logger');
const { globalErrorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { sanitiseInput, enforceRequestSizeLimits, generalLimiter } = require('./middleware/security');

// ─────────────────────────────────────────────
// VALIDATE CRITICAL ENVIRONMENT VARIABLES
// ─────────────────────────────────────────────
function validateEnvironment() {
  const required = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_KEY',
    'SUPABASE_ANON_KEY',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'ANTHROPIC_API_KEY',
    'ELEVENLABS_API_KEY',
    'OPENAI_API_KEY',
    'VAPI_API_KEY',
    'VAPI_WEBHOOK_SECRET',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    logger.error('CRITICAL: Missing required environment variables', { missing });
    process.exit(1);
  }

  logger.info('Environment validation passed');
}

// ─────────────────────────────────────────────
// SENTRY — only initialise if a real DSN is provided
// Never initialise with placeholder values
// ─────────────────────────────────────────────
function initialiseSentry() {
  const dsn = process.env.SENTRY_DSN;

  if (
    !dsn ||
    dsn.trim() === '' ||
    dsn === 'your_sentry_dsn_here' ||
    !dsn.startsWith('https://')
  ) {
    logger.info('Sentry not configured — skipping (add real SENTRY_DSN to enable)');
    return null;
  }

  try {
    const Sentry = require('@sentry/node');
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      beforeSend(event) {
        if (event.request && event.request.data) {
          delete event.request.data.frame;
          delete event.request.data.audio;
          delete event.request.data.transcript;
        }
        return event;
      },
    });
    logger.info('Sentry initialised');
    return Sentry;
  } catch (error) {
    logger.warn('Sentry initialisation failed — continuing without it', {
      error: error.message,
    });
    return null;
  }
}

// ─────────────────────────────────────────────
// IMPORT ALL BUILT ROUTE MODULES
// ─────────────────────────────────────────────
const authRoutes         = require('./routes/auth');
const usersRoutes        = require('./routes/users');
const jarvisRoutes       = require('./routes/jarvis');
const vapiRoutes         = require('./routes/vapi');
const agentsRoutes       = require('./routes/agents');
const sessionRoutes      = require('./routes/session');
const dashboardRoutes    = require('./routes/dashboard');
const healthRoutes       = require('./routes/health');
const paystackWebhook    = require('./routes/webhooks/paystack');
const stripeWebhook      = require('./routes/webhooks/stripe');
const vapiWebhook        = require('./routes/webhooks/vapi');

// ─────────────────────────────────────────────
// STUB ROUTERS FOR ROUTES NOT YET BUILT
// These will be replaced with full implementations
// in Phase 2 and Phase 3. They allow the server
// to start cleanly right now.
// ─────────────────────────────────────────────
function stubRouter(routeName) {
  const router = express.Router();
  router.all('*', (req, res) => {
    res.status(503).json({
      success: false,
      error: `${routeName} is not yet active — coming in Phase 2/3`,
      code: 'NOT_YET_BUILT',
    });
  });
  return router;
}

const cameraRoutes       = require('./routes/camera');
const paymentsRoutes     = stubRouter('Payments');
const bookingsRoutes     = stubRouter('Bookings');
const providersRoutes    = stubRouter('Providers');
const connectRoutes      = stubRouter('PRECCI Connect');
const contentRoutes      = stubRouter('Content');
const partnershipsRoutes = stubRouter('Partnerships');

// ─────────────────────────────────────────────
// ALLOWED ORIGINS FOR CORS
// ─────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'https://precci.com',
  'https://app.precci.com',
  'https://www.precci.com',
  'https://dashboard.precci.com',
  'https://connect.precci.com',
];

if (process.env.NODE_ENV !== 'production') {
  ALLOWED_ORIGINS.push('http://localhost:3000');
  ALLOWED_ORIGINS.push('http://localhost:3001');
}

// ─────────────────────────────────────────────
// INITIALISE EXPRESS
// ─────────────────────────────────────────────
const app = express();

// ─────────────────────────────────────────────
// SENTRY — must be first if enabled
// ─────────────────────────────────────────────
const Sentry = initialiseSentry();

if (Sentry) {
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());
}

// ─────────────────────────────────────────────
// HELMET — security headers
// ─────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc:  ["'self'"],
        scriptSrc:   ["'self'"],
        styleSrc:    ["'self'", "'unsafe-inline'"],
        imgSrc:      ["'self'", 'data:', 'blob:'],
        mediaSrc:    ["'self'", 'blob:'],
        connectSrc: [
          "'self'",
          'https://api.anthropic.com',
          'https://api.elevenlabs.io',
          'https://api.openai.com',
          'https://api.vapi.ai',
          'https://api.replicate.com',
          'https://api.paystack.co',
          'https://api.stripe.com',
        ],
        frameSrc:    ["'none'"],
        objectSrc:   ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);

// ─────────────────────────────────────────────
// CORS
// ─────────────────────────────────────────────
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        if (process.env.NODE_ENV !== 'production') return callback(null, true);
        return callback(new Error('Origin required in production'), false);
      }
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      logger.warn('CORS blocked request from unknown origin', { origin });
      callback(new Error('Not allowed by CORS'), false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    credentials: true,
    maxAge: 86400,
  })
);

// ─────────────────────────────────────────────
// STRIPE WEBHOOK — raw body BEFORE json parser
// ─────────────────────────────────────────────
app.use(
  '/api/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  stripeWebhook
);

// ─────────────────────────────────────────────
// BODY PARSERS
// ─────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─────────────────────────────────────────────
// REQUEST LOGGING
// ─────────────────────────────────────────────
app.use(
  morgan('combined', {
    stream: { write: (msg) => logger.info(msg.trim()) },
    skip: (req) => req.url === '/health',
  })
);

// ─────────────────────────────────────────────
// REQUEST SIZE + SANITISATION
// ─────────────────────────────────────────────
app.use(enforceRequestSizeLimits);
app.use(sanitiseInput);

// ─────────────────────────────────────────────
// HEALTH CHECK — no auth, no rate limit
// ─────────────────────────────────────────────
app.use('/health', healthRoutes);

// ─────────────────────────────────────────────
// RATE LIMITERS
// ─────────────────────────────────────────────
const {
  authLimiter,
  voiceLimiter,
  cameraLimiter,
  paymentLimiter,
  bookingLimiter,
  providerLimiter,
} = require('./middleware/security');

// ─────────────────────────────────────────────
// MOUNT ALL ROUTES
// ─────────────────────────────────────────────
app.use('/api/auth',               authLimiter,     authRoutes);
app.use('/api/users',              generalLimiter,  usersRoutes);
app.use('/api/voice/jarvis',       voiceLimiter,    jarvisRoutes);
app.use('/api/voice/vapi',         voiceLimiter,    vapiRoutes);
app.use('/api/agents',             generalLimiter,  agentsRoutes);
app.use('/api/sessions',           generalLimiter,  sessionRoutes);
app.use('/api/camera',             cameraLimiter,   cameraRoutes);
app.use('/api/payments',           paymentLimiter,  paymentsRoutes);
app.use('/api/webhooks/paystack',                   paystackWebhook);
app.use('/api/webhooks/vapi',                       vapiWebhook);
app.use('/api/bookings',           bookingLimiter,  bookingsRoutes);
app.use('/api/providers',          providerLimiter, providersRoutes);
app.use('/api/connect',            generalLimiter,  connectRoutes);
app.use('/api/dashboard',          generalLimiter,  dashboardRoutes);
app.use('/api/content',            generalLimiter,  contentRoutes);
app.use('/api/partnerships',       generalLimiter,  partnershipsRoutes);

// ─────────────────────────────────────────────
// SENTRY ERROR HANDLER — before our global handler
// ─────────────────────────────────────────────
if (Sentry) {
  app.use(Sentry.Handlers.errorHandler());
}

// ─────────────────────────────────────────────
// 404 + GLOBAL ERROR HANDLER — always last
// ─────────────────────────────────────────────
app.use(notFoundHandler);
app.use(globalErrorHandler);

// ─────────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────────
const PORT = process.env.PORT || 4000;

async function startServer() {
  try {
    validateEnvironment();

    const server = app.listen(PORT, () => {
      logger.info(`PRECCI Backend running`, {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        url: `http://localhost:${PORT}`,
      });
    });

    process.on('SIGTERM', () => {
      logger.info('SIGTERM received — shutting down gracefully');
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received — shutting down gracefully');
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });

    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Promise Rejection', {
        reason: reason?.message || String(reason),
      });
    });

    return server;
  } catch (error) {
    logger.error('Failed to start PRECCI server', { error: error.message });
    process.exit(1);
  }
}

startServer();

module.exports = app;
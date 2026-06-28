// FILE: precci/backend/src/index.js
'use strict';

require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cron = require('node-cron');

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
const cameraRoutes       = require('./routes/camera');
const paystackWebhook    = require('./routes/webhooks/paystack');
const stripeWebhook      = require('./routes/webhooks/stripe');
const vapiWebhook        = require('./routes/webhooks/vapi');

// ─────────────────────────────────────────────
// STUB ROUTERS — replaced in Phase 3
// ─────────────────────────────────────────────
function stubRouter(routeName) {
  const router = express.Router();
  router.all('*', (req, res) => {
    res.status(503).json({
      success: false,
      error: `${routeName} is not yet active — coming in Phase 3`,
      code: 'NOT_YET_BUILT',
    });
  });
  return router;
}

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
// SCHEDULED CRON JOBS
// All autonomous background operations
// ─────────────────────────────────────────────
function scheduleAllCronJobs() {
  // ── BELLE: Hourly simulation cleanup at :00 ──
  cron.schedule('0 * * * *', async () => {
    logger.info('Belle cleanup: Hourly cron triggered');
    try {
      const { deleteExpiredSimulations } = require('./services/belleCleanup.service');
      await deleteExpiredSimulations();
    } catch (error) {
      logger.error('Belle cleanup: Hourly cron failed', { error: error.message });
    }
  });

  // ── BELLE: Daily deep storage cleanup at 3:00 AM ──
  cron.schedule('0 3 * * *', async () => {
    logger.info('Belle cleanup: Daily deep cleanup triggered');
    try {
      const { deepStorageCleanup } = require('./services/belleCleanup.service');
      await deepStorageCleanup();
    } catch (error) {
      logger.error('Belle cleanup: Daily deep cleanup failed', { error: error.message });
    }
  });

  // ── NOVA: Daily commission report for Celeste at 8:30 AM ──
  cron.schedule('30 8 * * *', async () => {
    logger.info('Nova: Generating daily commission report for Celeste');
    try {
      const { generateDailyCommissionReport } = require('./agents/nova');
      const report = await generateDailyCommissionReport();
      logger.info('Nova: Daily commission report complete', { report });
    } catch (error) {
      logger.error('Nova: Commission report failed', { error: error.message });
    }
  });

  // ── SYSTEM: Token blacklist cleanup at 2:00 AM ──
  cron.schedule('0 2 * * *', async () => {
    logger.info('System: Cleaning expired blacklisted tokens');
    try {
      const { getServiceClient } = require('./config/supabase');
      const supabase = getServiceClient();
      await supabase.rpc('clean_expired_tokens');
      logger.info('System: Token blacklist cleanup complete');
    } catch (error) {
      logger.error('System: Token cleanup failed', { error: error.message });
    }
  });

  // ── ELTON: Daily analytics aggregation at 6:00 PM ──
  cron.schedule('0 18 * * *', async () => {
    logger.info('Elton: Daily intelligence report aggregation triggered');
    try {
      const { getServiceClient } = require('./config/supabase');
      const supabase = getServiceClient();

      // Aggregate today's session counts per agent
      const today = new Date().toISOString().split('T')[0];
      const { data: sessions } = await supabase
        .from('sessions')
        .select('agent_id, camera_used, completed')
        .gte('created_at', `${today}T00:00:00`);

      const agentCounts = (sessions || []).reduce((acc, s) => {
        acc[s.agent_id] = (acc[s.agent_id] || 0) + 1;
        return acc;
      }, {});

      await supabase.from('alerts').insert({
        type: 'daily_analytics',
        message: `Elton: Daily session analytics — ${sessions?.length || 0} sessions today`,
        severity: 'info',
        agent_id: 'PC-020',
        metadata: {
          date: today,
          total_sessions: sessions?.length || 0,
          by_agent: agentCounts,
          camera_sessions: (sessions || []).filter(s => s.camera_used).length,
          completed_sessions: (sessions || []).filter(s => s.completed).length,
        },
      });

      logger.info('Elton: Daily analytics aggregated', {
        totalSessions: sessions?.length || 0,
      });
    } catch (error) {
      logger.error('Elton: Daily analytics failed', { error: error.message });
    }
  });

  // ── CELESTE: Daily revenue summary consolidation at 8:00 AM ──
  cron.schedule('0 8 * * *', async () => {
    logger.info('Celeste: Daily revenue summary consolidation triggered');
    try {
      const { getServiceClient } = require('./config/supabase');
      const supabase = getServiceClient();
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      // Tally all transactions from yesterday
      const { data: transactions } = await supabase
        .from('transactions')
        .select('type, amount, currency, status')
        .gte('created_at', `${yesterday}T00:00:00`)
        .lt('created_at', `${yesterday}T23:59:59`)
        .eq('status', 'success');

      const byType = (transactions || []).reduce((acc, t) => {
        if (!acc[t.type]) acc[t.type] = 0;
        acc[t.type] += parseFloat(t.amount || 0);
        return acc;
      }, {});

      const totalRevenue = Object.values(byType).reduce((sum, v) => sum + v, 0);

      await supabase.from('alerts').insert({
        type: 'daily_revenue',
        message: `Celeste: Yesterday's revenue — $${totalRevenue.toFixed(2)}`,
        severity: 'info',
        agent_id: 'PC-002',
        metadata: {
          date: yesterday,
          total: totalRevenue,
          by_type: byType,
          transaction_count: transactions?.length || 0,
        },
      });

      logger.info('Celeste: Revenue summary complete', {
        date: yesterday,
        total: totalRevenue,
      });
    } catch (error) {
      logger.error('Celeste: Revenue summary failed', { error: error.message });
    }
  });

  // ── NADIA: Agent performance check every 6 hours ──
  cron.schedule('0 */6 * * *', async () => {
    logger.info('Nadia: Agent performance check triggered');
    try {
      const { getServiceClient } = require('./config/supabase');
      const supabase = getServiceClient();

      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();

      const { data: recentSessions } = await supabase
        .from('sessions')
        .select('agent_id, completed')
        .gte('created_at', sixHoursAgo);

      const agentActivity = (recentSessions || []).reduce((acc, s) => {
        acc[s.agent_id] = (acc[s.agent_id] || { sessions: 0, completed: 0 });
        acc[s.agent_id].sessions++;
        if (s.completed) acc[s.agent_id].completed++;
        return acc;
      }, {});

      logger.info('Nadia: Agent performance check complete', {
        activeAgents: Object.keys(agentActivity).length,
        totalSessions: recentSessions?.length || 0,
      });
    } catch (error) {
      logger.error('Nadia: Performance check failed', { error: error.message });
    }
  });

  logger.info('All cron jobs scheduled', {
    jobs: [
      'Belle hourly cleanup (0 * * * *)',
      'Belle daily deep cleanup (0 3 * * *)',
      'Nova commission report (30 8 * * *)',
      'System token cleanup (0 2 * * *)',
      'Elton analytics (0 18 * * *)',
      'Celeste revenue summary (0 8 * * *)',
      'Nadia performance check (0 */6 * * *)',
    ],
  });
}

// ─────────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────────
const PORT = process.env.PORT || 4000;

async function startServer() {
  try {
    validateEnvironment();

    const server = app.listen(PORT, () => {
      logger.info('PRECCI Backend running', {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        url: `http://localhost:${PORT}`,
      });
    });

    // Start all autonomous background operations
    scheduleAllCronJobs();

    // ── GRACEFUL SHUTDOWN ──
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
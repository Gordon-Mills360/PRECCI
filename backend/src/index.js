// FILE: precci/backend/src/index.js
// CUTEME LTD — Main Express Server
// Production-ready. All routes mounted. CORS fixed for Render.

'use strict';

// Force errors to stdout — required for Render logging
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err.message);
  console.error(err.stack);
  process.exit(1);
});

require('dotenv').config();

const express = require('express');
const helmet  = require('helmet');
const cors    = require('cors');
const morgan  = require('morgan');
const cron    = require('node-cron');

const logger            = require('./utils/logger');
const { globalErrorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { sanitiseInput, enforceRequestSizeLimits, generalLimiter,
        authLimiter, voiceLimiter, cameraLimiter,
        paymentLimiter, bookingLimiter, providerLimiter } = require('./middleware/security');

// ── ENV VALIDATION ──────────────────────────────────────────
function validateEnvironment() {
  const critical = [
    'SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'SUPABASE_ANON_KEY',
    'JWT_SECRET', 'JWT_REFRESH_SECRET', 'ANTHROPIC_API_KEY',
  ];
  const optional = [
    'ELEVENLABS_API_KEY', 'OPENAI_API_KEY', 'VAPI_API_KEY',
    'VAPI_WEBHOOK_SECRET', 'RESEND_API_KEY', 'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN', 'GOOGLE_MAPS_API_KEY', 'PAYSTACK_SECRET_KEY',
    'STRIPE_SECRET_KEY', 'REPLICATE_API_TOKEN',
  ];
  const missingCritical = critical.filter(k => !process.env[k]);
  const missingOptional = optional.filter(k => !process.env[k]);
  if (missingCritical.length > 0) {
    console.error('CRITICAL: Missing required environment variables:', missingCritical);
    process.exit(1);
  }
  if (missingOptional.length > 0) {
    console.warn('Optional env vars not set — some features disabled:', missingOptional);
  }
  console.log('Environment validation passed');
}

// ── SENTRY ──────────────────────────────────────────────────
function initialiseSentry() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn || !dsn.startsWith('https://')) {
    logger.info('Sentry not configured — skipping');
    return null;
  }
  try {
    const Sentry = require('@sentry/node');
    Sentry.init({ dsn, environment: process.env.NODE_ENV || 'development', tracesSampleRate: 0.1 });
    logger.info('Sentry initialised');
    return Sentry;
  } catch (e) {
    logger.warn('Sentry init failed', { error: e.message });
    return null;
  }
}

// ── ROUTE IMPORTS ────────────────────────────────────────────
const authRoutes      = require('./routes/auth');
const usersRoutes     = require('./routes/users');
const jarvisRoutes    = require('./routes/jarvis');
const vapiRoutes      = require('./routes/vapi');
const agentsRoutes    = require('./routes/agents');
const sessionRoutes   = require('./routes/session');
const dashboardRoutes = require('./routes/dashboard');
const healthRoutes    = require('./routes/health');
const cameraRoutes    = require('./routes/camera');
const paystackWebhook = require('./routes/webhooks/paystack');
const stripeWebhook   = require('./routes/webhooks/stripe');
const vapiWebhook     = require('./routes/webhooks/vapi');

// ── STUB ROUTERS (Phase 3 routes not yet built) ──────────────
function stubRouter(name) {
  const r = express.Router();
  r.all('*', (req, res) => res.status(503).json({
    success: false, error: `${name} coming in Phase 3`, code: 'NOT_YET_BUILT',
  }));
  return r;
}
const paymentsRoutes     = stubRouter('Payments');
const bookingsRoutes     = stubRouter('Bookings');
const providersRoutes    = stubRouter('Providers');
const connectRoutes      = stubRouter('PRECCI Connect');
const contentRoutes      = stubRouter('Content');
const partnershipsRoutes = stubRouter('Partnerships');

// ── ALLOWED ORIGINS ──────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'https://precci.vercel.app',
  'https://precci.com',
  'https://www.precci.com',
  'https://app.precci.com',
  'https://dashboard.precci.com',
  'https://connect.precci.com',
  'https://cuteme.com',
  'https://www.cuteme.com',
];

// Add FRONTEND_URL from env if set
if (process.env.FRONTEND_URL) {
  ALLOWED_ORIGINS.push(process.env.FRONTEND_URL.replace(/\/$/, ''));
}

// Always allow localhost in development
if (process.env.NODE_ENV !== 'production') {
  ALLOWED_ORIGINS.push('http://localhost:3000', 'http://localhost:3001');
}

// ── EXPRESS APP ──────────────────────────────────────────────
const app = express();
const Sentry = initialiseSentry();

if (Sentry) {
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());
}

// ── HELMET ───────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // Disabled — frontend handles its own CSP
  crossOriginEmbedderPolicy: false,
}));

// ── CORS — fixed for Render ──────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Render health checks, mobile apps)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    // In development allow all
    if (process.env.NODE_ENV !== 'production') return callback(null, true);
    logger.warn('CORS blocked', { origin });
    callback(new Error('Not allowed by CORS'), false);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  credentials: true,
  maxAge: 86400,
}));

// ── STRIPE WEBHOOK — raw body before JSON parser ─────────────
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }), stripeWebhook);

// ── BODY PARSERS ─────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── REQUEST LOGGING ──────────────────────────────────────────
app.use(morgan('combined', {
  stream: { write: (msg) => logger.info(msg.trim()) },
  skip: (req) => req.url === '/health' || req.url === '/ping',
}));

// ── MIDDLEWARE ───────────────────────────────────────────────
app.use(enforceRequestSizeLimits);
app.use(sanitiseInput);

// ── HEALTH + PING — no auth, no rate limit ───────────────────
app.get('/ping', (req, res) => {
  res.json({ pong: true, time: new Date().toISOString(), status: 'CUTEME LTD backend running' });
});
app.use('/health', healthRoutes);

// ── ALL API ROUTES ───────────────────────────────────────────
app.use('/api/auth',              authLimiter,     authRoutes);
app.use('/api/users',             generalLimiter,  usersRoutes);
app.use('/api/voice/jarvis',      voiceLimiter,    jarvisRoutes);
app.use('/api/voice/vapi',        voiceLimiter,    vapiRoutes);
app.use('/api/agents',            generalLimiter,  agentsRoutes);
app.use('/api/sessions',          generalLimiter,  sessionRoutes);
app.use('/api/camera',            cameraLimiter,   cameraRoutes);
app.use('/api/payments',          paymentLimiter,  paymentsRoutes);
app.use('/api/webhooks/paystack',                  paystackWebhook);
app.use('/api/webhooks/vapi',                      vapiWebhook);
app.use('/api/bookings',          bookingLimiter,  bookingsRoutes);
app.use('/api/providers',         providerLimiter, providersRoutes);
app.use('/api/connect',           generalLimiter,  connectRoutes);
app.use('/api/dashboard',         generalLimiter,  dashboardRoutes);
app.use('/api/content',           generalLimiter,  contentRoutes);
app.use('/api/partnerships',      generalLimiter,  partnershipsRoutes);

// ── ERROR HANDLERS ───────────────────────────────────────────
if (Sentry) app.use(Sentry.Handlers.errorHandler());
app.use(notFoundHandler);
app.use(globalErrorHandler);

// ── CRON JOBS ────────────────────────────────────────────────
function scheduleAllCronJobs() {
  cron.schedule('0 * * * *', async () => {
    try {
      const { deleteExpiredSimulations } = require('./services/belleCleanup.service');
      await deleteExpiredSimulations();
    } catch (e) { logger.error('Belle cleanup failed', { error: e.message }); }
  });

  cron.schedule('0 3 * * *', async () => {
    try {
      const { deepStorageCleanup } = require('./services/belleCleanup.service');
      await deepStorageCleanup();
    } catch (e) { logger.error('Belle deep cleanup failed', { error: e.message }); }
  });

  cron.schedule('30 8 * * *', async () => {
    try {
      const { generateDailyCommissionReport } = require('./agents/nova');
      await generateDailyCommissionReport();
    } catch (e) { logger.error('Nova commission report failed', { error: e.message }); }
  });

  cron.schedule('0 2 * * *', async () => {
    try {
      const { getServiceClient } = require('./config/supabase');
      await getServiceClient().rpc('clean_expired_tokens');
    } catch (e) { logger.error('Token cleanup failed', { error: e.message }); }
  });

  cron.schedule('0 18 * * *', async () => {
    try {
      const { getServiceClient } = require('./config/supabase');
      const supabase = getServiceClient();
      const today = new Date().toISOString().split('T')[0];
      const { data: sessions } = await supabase.from('sessions').select('agent_id, camera_used, completed').gte('created_at', `${today}T00:00:00`);
      await supabase.from('alerts').insert({ type: 'daily_analytics', message: `Elton: ${sessions?.length || 0} sessions today`, severity: 'info', agent_id: 'PC-020' });
    } catch (e) { logger.error('Elton analytics failed', { error: e.message }); }
  });

  cron.schedule('0 8 * * *', async () => {
    try {
      const { getServiceClient } = require('./config/supabase');
      const supabase = getServiceClient();
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const { data: txns } = await supabase.from('transactions').select('amount').gte('created_at', `${yesterday}T00:00:00`).lt('created_at', `${yesterday}T23:59:59`).eq('status', 'success');
      const total = (txns || []).reduce((s, t) => s + parseFloat(t.amount || 0), 0);
      await supabase.from('alerts').insert({ type: 'daily_revenue', message: `Celeste: Yesterday revenue $${total.toFixed(2)}`, severity: 'info', agent_id: 'PC-002' });
    } catch (e) { logger.error('Celeste revenue summary failed', { error: e.message }); }
  });

  cron.schedule('0 */6 * * *', async () => {
    try {
      const { getServiceClient } = require('./config/supabase');
      const supabase = getServiceClient();
      const sixHoursAgo = new Date(Date.now() - 6 * 3600000).toISOString();
      const { data } = await supabase.from('sessions').select('agent_id, completed').gte('created_at', sixHoursAgo);
      logger.info('Nadia: Performance check', { sessions: data?.length || 0 });
    } catch (e) { logger.error('Nadia performance check failed', { error: e.message }); }
  });

  logger.info('All cron jobs scheduled', { jobs: [
    'Belle hourly cleanup', 'Belle daily deep cleanup',
    'Nova commission report', 'Token cleanup',
    'Elton analytics', 'Celeste revenue', 'Nadia performance',
  ]});
}

// ── START SERVER ─────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '4000', 10);

async function startServer() {
  try {
    validateEnvironment();
    const server = app.listen(PORT, '0.0.0.0', () => {
      logger.info('CUTEME LTD Backend running', {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
      });
    });
    scheduleAllCronJobs();
    process.on('SIGTERM', () => server.close(() => process.exit(0)));
    process.on('SIGINT',  () => server.close(() => process.exit(0)));
    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Rejection', { reason: String(reason) });
    });
    return server;
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();
module.exports = app;
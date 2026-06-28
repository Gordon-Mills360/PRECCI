// FILE: precci/backend/src/routes/webhooks/vapi.js
// Vapi webhook events that don't require voice session processing.
// SECURITY: Signature validated on every request.

'use strict';

const express = require('express');
const { validateWebhookSignature } = require('../../config/vapi');
const { getServiceClient } = require('../../config/supabase');
const { asyncHandler, PrecciError } = require('../../middleware/errorHandler');
const logger = require('../../utils/logger');

const router = express.Router();

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const isValid = validateWebhookSignature(req);
    if (!isValid) {
      throw new PrecciError('AUTHENTICATION_ERROR', 'Invalid Vapi webhook signature', 401);
    }

    const { message } = req.body;
    const eventType = message?.type;

    logger.info('Vapi secondary webhook received', { eventType });

    res.status(200).json({ received: true });

    // No async processing needed here — main Vapi route handles all events
  })
);

module.exports = router;
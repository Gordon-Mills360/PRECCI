// FILE: precci/backend/src/routes/partnerships.js
// CUTEME LTD — Brand Partnerships Routes
// Cole manages partnership pipeline.
// Rafael negotiates via Vapi.
// Sebastian drafts contracts.
// Eva reviews.
// Lena delivers.
// All autonomous.

'use strict';

const express = require('express');
const router = express.Router();
const { verifyJWT, requireRole } = require('../middleware/auth');
const { generalLimiter, sanitiseInput } = require('../middleware/security');
const { getServiceClient } = require('../config/supabase');
const { processColeSession } = require('../agents/cole');
const { processRafaelSession } = require('../agents/rafael');
const logger = require('../utils/logger');

router.use(verifyJWT);
router.use(generalLimiter);

// POST /api/partnerships/inquiry
// Brand contacts CUTEME — Cole evaluates
router.post('/inquiry', async (req, res) => {
  const supabase = getServiceClient();

  const {
    brandName, brandEmail, brandWebsite,
    partnershipType, proposedFee, message,
  } = sanitiseInput(req.body);

  if (!brandName || !brandEmail) {
    return res.status(400).json({ success: false, error: 'brandName and brandEmail are required' });
  }

  try {
    // Trigger n8n brand partnership pipeline
    await fetch(`${process.env.N8N_WEBHOOK_URL}/brand-partnership-inquiry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        brandName, brandEmail, brandWebsite,
        partnershipType, proposedFee, message,
        source: 'website_form',
        receivedAt: new Date().toISOString(),
      }),
    });

    // Log to alerts
    await supabase.from('alerts').insert({
      type: 'partnership_inquiry_received',
      message: `Cole: New partnership inquiry — ${brandName} (${brandEmail})`,
      severity: 'info',
      agent_id: 'PC-024',
      metadata: {
        brand_name: brandName,
        brand_email: brandEmail,
        partnership_type: partnershipType,
        proposed_fee: proposedFee,
      },
      created_at: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: `Thank you for your interest in partnering with CUTEME LTD. Cole will review your inquiry and Rafael will be in touch within 24 hours.`,
    });
  } catch (error) {
    logger.error('Partnership inquiry error', { error: error.message });
    res.status(500).json({ success: false, error: 'Failed to process inquiry' });
  }
});

// GET /api/partnerships
// All partnerships — Precious dashboard only
router.get('/', requireRole('precious_owner'), async (req, res) => {
  const supabase = getServiceClient();
  const { status } = req.query;

  try {
    let query = supabase
      .from('partnerships')
      .select('id, brand_name, type, fee, status, start_date, end_date, contract_url')
      .order('start_date', { ascending: false });

    if (status) query = query.eq('status', status);

    const { data } = await query;
    res.json({ success: true, data: data || [] });
  } catch (error) {
    logger.error('Get partnerships error', { error: error.message });
    res.status(500).json({ success: false, error: 'Failed to load partnerships' });
  }
});

// GET /api/partnerships/:id
// Single partnership details
router.get('/:id', requireRole('precious_owner'), async (req, res) => {
  const supabase = getServiceClient();

  try {
    const { data } = await supabase
      .from('partnerships')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (!data) {
      return res.status(404).json({ success: false, error: 'Partnership not found' });
    }

    res.json({ success: true, data });
  } catch (error) {
    logger.error('Get partnership error', { error: error.message });
    res.status(500).json({ success: false, error: 'Failed to load partnership' });
  }
});

// PATCH /api/partnerships/:id/status
// Update partnership status — Cole/Sebastian use this
router.patch('/:id/status', async (req, res) => {
  const apiKey = req.headers.authorization?.replace('Bearer ', '');
  const isInternal = apiKey === process.env.INTERNAL_API_KEY;
  const isOwner = req.user?.role === 'precious_owner';

  if (!isInternal && !isOwner) {
    return res.status(403).json({ success: false, error: 'Unauthorised' });
  }

  const supabase = getServiceClient();
  const { status, contractUrl, fee } = sanitiseInput(req.body);

  const allowedStatuses = ['pending', 'negotiating', 'contract_sent', 'signed', 'active', 'completed', 'declined'];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ success: false, error: `Status must be one of: ${allowedStatuses.join(', ')}` });
  }

  try {
    const updates = { status, updated_at: new Date().toISOString() };
    if (contractUrl) updates.contract_url = contractUrl;
    if (fee) updates.fee = fee;
    if (status === 'active') updates.start_date = new Date().toISOString().split('T')[0];
    if (status === 'completed') updates.end_date = new Date().toISOString().split('T')[0];

    await supabase.from('partnerships').update(updates).eq('id', req.params.id);

    // Log to activity feed
    await supabase.from('alerts').insert({
      type: 'partnership_status_updated',
      message: `Cole: Partnership status updated — ${status}`,
      severity: 'info',
      agent_id: 'PC-024',
      metadata: { partnership_id: req.params.id, status },
      created_at: new Date().toISOString(),
    });

    res.json({ success: true, status });
  } catch (error) {
    logger.error('Partnership status error', { error: error.message });
    res.status(500).json({ success: false, error: 'Failed to update status' });
  }
});

// GET /api/partnerships/pipeline/stats
// Partnership pipeline stats for dashboard
router.get('/pipeline/stats', requireRole('precious_owner'), async (req, res) => {
  const supabase = getServiceClient();

  try {
    const { data } = await supabase
      .from('partnerships')
      .select('status, fee');

    const stats = {
      total: data?.length || 0,
      byStatus: {},
      totalValue: 0,
      activeValue: 0,
    };

    (data || []).forEach(p => {
      stats.byStatus[p.status] = (stats.byStatus[p.status] || 0) + 1;
      const fee = parseFloat(p.fee || 0);
      stats.totalValue += fee;
      if (p.status === 'active') stats.activeValue += fee;
    });

    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('Partnership stats error', { error: error.message });
    res.status(500).json({ success: false, error: 'Failed to load stats' });
  }
});

module.exports = router;
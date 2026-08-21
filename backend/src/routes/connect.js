// FILE: precci/backend/src/routes/connect.js
// CUTEME LTD — PRECCI Connect Routes
// Provider marketplace search, slot management,
// appointment code verification, revenue reporting.

'use strict';

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { generalLimiter, bookingLimiter, sanitiseInput } = require('../middleware/security');
const { getServiceClient } = require('../config/supabase');
const { generateAppointmentCode } = require('../agents/brook');
const logger = require('../utils/logger');

// GET /api/connect/providers/search
// Search providers near a location
router.get('/providers/search', verifyToken, generalLimiter, async (req, res) => {
  const supabase = getServiceClient();
  const {
    serviceType,
    lat,
    lng,
    radiusKm = 10,
    maxResults = 3,
    minRating = 3.5,
  } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ success: false, error: 'lat and lng are required' });
  }

  try {
    const { data: providers } = await supabase
      .from('service_providers')
      .select(`
        id, business_name, address, city, country, lat, lng,
        services, operating_hours, capacity_per_slot, slot_duration_minutes,
        subscription_tier, featured, featured_expires_at,
        rating, total_bookings, vapi_assistant_id, active, verified
      `)
      .eq('active', true)
      .eq('verified', true)
      .gte('rating', parseFloat(minRating));

    if (!providers) {
      return res.json({ success: true, found: false, providers: [] });
    }

    // Haversine distance
    const clientLat = parseFloat(lat);
    const clientLng = parseFloat(lng);
    const radius = parseFloat(radiusKm);

    const withDistance = providers
      .filter(p => {
        if (!p.lat || !p.lng) return false;
        if (serviceType) {
          const services = Array.isArray(p.services) ? p.services : [];
          return services.some(s => s && s.toLowerCase().includes(serviceType.toLowerCase()));
        }
        return true;
      })
      .map(p => {
        const R = 6371;
        const dLat = (p.lat - clientLat) * Math.PI / 180;
        const dLng = (p.lng - clientLng) * Math.PI / 180;
        const a = Math.sin(dLat/2)**2 + Math.cos(clientLat * Math.PI/180) * Math.cos(p.lat * Math.PI/180) * Math.sin(dLng/2)**2;
        const distanceKm = parseFloat((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))).toFixed(1));
        return { ...p, distanceKm };
      })
      .filter(p => p.distanceKm <= radius);

    const now = new Date();
    const sorted = withDistance.sort((a, b) => {
      const aFeat = a.featured && a.rating >= 3.5 && (!a.featured_expires_at || new Date(a.featured_expires_at) > now);
      const bFeat = b.featured && b.rating >= 3.5 && (!b.featured_expires_at || new Date(b.featured_expires_at) > now);
      if (aFeat && !bFeat) return -1;
      if (!aFeat && bFeat) return 1;
      const rDiff = (b.rating || 0) - (a.rating || 0);
      if (Math.abs(rDiff) > 0.3) return rDiff;
      return a.distanceKm - b.distanceKm;
    });

    const results = sorted.slice(0, parseInt(maxResults));

    // Get available slots for each
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const providersWithSlots = await Promise.all(results.map(async p => {
      const { data: slots } = await supabase
        .from('booking_slots')
        .select('id, date, time_slot, capacity, booked_count')
        .eq('provider_id', p.id)
        .gte('date', tomorrow)
        .order('date', { ascending: true })
        .order('time_slot', { ascending: true })
        .limit(3);

      return {
        id: p.id,
        businessName: p.business_name,
        address: p.address,
        city: p.city,
        distanceKm: p.distanceKm,
        rating: p.rating || 0,
        totalBookings: p.total_bookings || 0,
        subscriptionTier: p.subscription_tier,
        featured: p.featured || false,
        services: p.services,
        availableSlots: (slots || [])
          .filter(s => s.booked_count < s.capacity)
          .map(s => ({
            slotId: s.id,
            date: s.date,
            time: s.time_slot,
            capacity: s.capacity - s.booked_count,
          })),
      };
    }));

    res.json({
      success: true,
      found: providersWithSlots.length > 0,
      providers: providersWithSlots,
      total: withDistance.length,
    });
  } catch (error) {
    logger.error('Provider search error', { error: error.message });
    res.status(500).json({ success: false, error: 'Provider search failed' });
  }
});

// POST /api/connect/slots
// Create availability slots for a provider
router.post('/slots', verifyToken, generalLimiter, async (req, res) => {
  const supabase = getServiceClient();
  const { providerId, date, timeSlots } = sanitiseInput(req.body);

  if (!providerId || !date || !timeSlots?.length) {
    return res.status(400).json({ success: false, error: 'providerId, date, and timeSlots are required' });
  }

  // Verify provider ownership
  const { data: provider } = await supabase
    .from('service_providers')
    .select('id, capacity_per_slot')
    .eq('id', providerId)
    .eq('email', req.user.email)
    .single();

  if (!provider) {
    return res.status(403).json({ success: false, error: 'Unauthorised' });
  }

  try {
    const slotRecords = timeSlots.map(timeSlot => ({
      provider_id: providerId,
      date,
      time_slot: timeSlot,
      capacity: provider.capacity_per_slot,
      booked_count: 0,
      created_at: new Date().toISOString(),
    }));

    await supabase.from('booking_slots').upsert(slotRecords, {
      onConflict: 'provider_id,date,time_slot',
      ignoreDuplicates: true,
    });

    res.json({ success: true, slotsCreated: slotRecords.length });
  } catch (error) {
    logger.error('Slot creation error', { error: error.message });
    res.status(500).json({ success: false, error: 'Failed to create slots' });
  }
});

// GET /api/connect/revenue
// Connect revenue summary for provider
router.get('/revenue', verifyToken, generalLimiter, async (req, res) => {
  const supabase = getServiceClient();

  const { data: provider } = await supabase
    .from('service_providers')
    .select('id')
    .eq('email', req.user.email)
    .single();

  if (!provider) {
    return res.status(404).json({ success: false, error: 'Provider not found' });
  }

  try {
    const { data: transactions } = await supabase
      .from('provider_transactions')
      .select('type, amount, currency, created_at, status')
      .eq('provider_id', provider.id)
      .eq('status', 'success')
      .order('created_at', { ascending: false });

    const today = new Date().toISOString().split('T')[0];
    const monthStart = new Date(); monthStart.setDate(1);

    const totals = {
      allTime: 0,
      month: 0,
      today: 0,
      byType: {},
    };

    (transactions || []).forEach(t => {
      const amount = parseFloat(t.amount || 0);
      totals.allTime += amount;
      if (t.created_at >= monthStart.toISOString()) totals.month += amount;
      if (t.created_at.startsWith(today)) totals.today += amount;
      totals.byType[t.type] = (totals.byType[t.type] || 0) + amount;
    });

    res.json({ success: true, data: { totals, transactions: transactions || [] } });
  } catch (error) {
    logger.error('Connect revenue error', { error: error.message });
    res.status(500).json({ success: false, error: 'Failed to load revenue' });
  }
});

module.exports = router;
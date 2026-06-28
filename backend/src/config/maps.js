// FILE: precci/backend/src/config/maps.js
// Google Maps integration for Brook's provider proximity search.
// Results sorted: featured providers first, then by rating, then by distance.
// Filtered by service type, availability and active status.

'use strict';

const axios = require('axios');
const { getServiceClient } = require('./supabase');
const logger = require('../utils/logger');

// ─────────────────────────────────────────────
// HAVERSINE DISTANCE CALCULATION
// Returns distance in kilometres between two lat/lng points
// ─────────────────────────────────────────────
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ─────────────────────────────────────────────
// GEOCODE ADDRESS
// Converts a text address to lat/lng coordinates
// Used during provider registration
// ─────────────────────────────────────────────
async function geocodeAddress(address) {
  if (!process.env.GOOGLE_MAPS_API_KEY) {
    throw new Error('GOOGLE_MAPS_API_KEY is not configured');
  }

  try {
    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/geocode/json',
      {
        params: {
          address,
          key: process.env.GOOGLE_MAPS_API_KEY,
        },
        timeout: 10000,
      }
    );

    if (
      response.data.status !== 'OK' ||
      !response.data.results?.length
    ) {
      throw new Error(`Geocoding failed: ${response.data.status}`);
    }

    const location = response.data.results[0].geometry.location;
    const formattedAddress = response.data.results[0].formatted_address;

    return {
      lat: location.lat,
      lng: location.lng,
      formattedAddress,
    };
  } catch (error) {
    logger.error('Geocoding error', { address: '[REDACTED]', error: error.message });
    throw new Error('Address geocoding failed');
  }
}

// ─────────────────────────────────────────────
// SEARCH NEARBY PROVIDERS
// Brook calls this to find providers for a client
// Results ordered: featured → rating → distance
// serviceTypes: array of service strings to match against providers.services
// ─────────────────────────────────────────────
async function searchNearbyProviders({
  clientLat,
  clientLng,
  serviceTypes = [],
  radiusKm = 20,
  maxResults = 5,
  appointmentDate,
  appointmentTime,
}) {
  const supabase = getServiceClient();

  if (!clientLat || !clientLng) {
    throw new Error('Client location is required for provider search');
  }

  // Fetch all active, verified providers with matching services
  let query = supabase
    .from('service_providers')
    .select(
      `id, business_name, owner_name, address, city, country,
       lat, lng, services, operating_hours, capacity_per_slot,
       slot_duration_minutes, subscription_tier, featured,
       featured_expires_at, rating, total_bookings, vapi_assistant_id,
       payment_method, paystack_subscription_code, stripe_customer_id`
    )
    .eq('active', true)
    .eq('verified', true)
    .eq('registration_fee_paid', true);

  const { data: providers, error } = await query;

  if (error) {
    logger.error('Provider search query failed', { error: error.message });
    throw new Error('Provider search failed');
  }

  if (!providers || providers.length === 0) {
    return [];
  }

  // Filter by service type and distance
  const now = new Date();

  const filtered = providers
    .filter(provider => {
      // Check service type match
      if (serviceTypes.length > 0) {
        const providerServices = provider.services || [];
        const hasMatchingService = serviceTypes.some(requestedService =>
          providerServices.some(ps =>
            ps.toLowerCase().includes(requestedService.toLowerCase()) ||
            requestedService.toLowerCase().includes(ps.toLowerCase())
          )
        );
        if (!hasMatchingService) return false;
      }

      // Check coordinates exist
      if (!provider.lat || !provider.lng) return false;

      // Calculate distance
      const distanceKm = haversineDistance(
        clientLat,
        clientLng,
        parseFloat(provider.lat),
        parseFloat(provider.lng)
      );

      provider._distanceKm = distanceKm;

      // Check within radius
      if (distanceKm > radiusKm) return false;

      // Check featured placement hasn't expired
      if (provider.featured && provider.featured_expires_at) {
        if (new Date(provider.featured_expires_at) < now) {
          provider.featured = false;
        }
      }

      return true;
    });

  // Check slot availability for each provider if date/time provided
  let availableProviders = filtered;

  if (appointmentDate && appointmentTime) {
    const availabilityChecks = await Promise.all(
      filtered.map(async provider => {
        const { data: slot } = await supabase
          .from('booking_slots')
          .select('id, booked_count, capacity, available')
          .eq('provider_id', provider.id)
          .eq('date', appointmentDate)
          .eq('time_slot', appointmentTime)
          .single();

        // If no slot exists, provider hasn't blocked this time — assume available
        if (!slot) {
          provider._slotAvailable = true;
          return provider;
        }

        provider._slotAvailable = slot.available;
        return provider;
      })
    );

    availableProviders = availabilityChecks.filter(p => p._slotAvailable !== false);
  }

  // Sort: featured first → rating desc → distance asc
  availableProviders.sort((a, b) => {
    // Featured providers first
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;

    // Then by rating descending
    if (b.rating !== a.rating) return (b.rating || 0) - (a.rating || 0);

    // Then by distance ascending
    return (a._distanceKm || 0) - (b._distanceKm || 0);
  });

  // Return top results — sanitised for client presentation
  return availableProviders.slice(0, maxResults).map(provider => ({
    id: provider.id,
    businessName: provider.business_name,
    address: provider.address,
    city: provider.city,
    distanceKm: parseFloat(provider._distanceKm?.toFixed(1)),
    services: provider.services,
    rating: provider.rating,
    subscriptionTier: provider.subscription_tier,
    featured: provider.featured,
    // Internal fields for Brook's booking process — not sent to client UI
    _vapiAssistantId: provider.vapi_assistant_id,
    _paymentMethod: provider.payment_method,
    _paystackCode: provider.paystack_subscription_code,
    _stripeCustomerId: provider.stripe_customer_id,
    _capacityPerSlot: provider.capacity_per_slot,
  }));
}

// ─────────────────────────────────────────────
// GET DIRECTIONS URL
// Returns Google Maps directions URL for client dashboard
// ─────────────────────────────────────────────
function getDirectionsUrl(fromLat, fromLng, toLat, toLng) {
  return `https://www.google.com/maps/dir/${fromLat},${fromLng}/${toLat},${toLng}`;
}

// ─────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────
async function checkMapsHealth() {
  try {
    await geocodeAddress('Navrongo, Ghana');
    return { healthy: true };
  } catch (error) {
    return { healthy: false, error: error.message };
  }
}

module.exports = {
  haversineDistance,
  geocodeAddress,
  searchNearbyProviders,
  getDirectionsUrl,
  checkMapsHealth,
};
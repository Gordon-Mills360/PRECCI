// FILE: precci/backend/src/utils/haversine.js
// Haversine distance calculation for Brook's provider proximity search.
// Returns distance in kilometres between two coordinate pairs.

'use strict';

const EARTH_RADIUS_KM = 6371;

// ─────────────────────────────────────────────
// HAVERSINE DISTANCE
// Returns distance in km between two lat/lng points
// ─────────────────────────────────────────────
function haversineDistance(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

// ─────────────────────────────────────────────
// DISTANCE IN METRES
// ─────────────────────────────────────────────
function haversineDistanceMetres(lat1, lng1, lat2, lng2) {
  return haversineDistance(lat1, lng1, lat2, lng2) * 1000;
}

// ─────────────────────────────────────────────
// FORMAT DISTANCE FOR DISPLAY
// Returns human-readable distance string
// ─────────────────────────────────────────────
function formatDistance(distanceKm) {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m away`;
  }
  return `${distanceKm.toFixed(1)}km away`;
}

// ─────────────────────────────────────────────
// SORT LOCATIONS BY DISTANCE FROM POINT
// ─────────────────────────────────────────────
function sortByDistance(locations, fromLat, fromLng) {
  return locations
    .map(loc => ({
      ...loc,
      distanceKm: haversineDistance(
        fromLat,
        fromLng,
        parseFloat(loc.lat),
        parseFloat(loc.lng)
      ),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

// ─────────────────────────────────────────────
// FILTER WITHIN RADIUS
// Returns only locations within radiusKm of point
// ─────────────────────────────────────────────
function filterWithinRadius(locations, fromLat, fromLng, radiusKm) {
  return locations.filter(loc => {
    const dist = haversineDistance(
      fromLat,
      fromLng,
      parseFloat(loc.lat),
      parseFloat(loc.lng)
    );
    loc._distanceKm = dist;
    return dist <= radiusKm;
  });
}

module.exports = {
  haversineDistance,
  haversineDistanceMetres,
  formatDistance,
  sortByDistance,
  filterWithinRadius,
};
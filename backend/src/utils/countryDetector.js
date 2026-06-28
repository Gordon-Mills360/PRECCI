// FILE: precci/backend/src/utils/countryDetector.js
// Detects whether a user is in Africa to route payments
// to Paystack (Africa) or Stripe (global).

'use strict';

const { AFRICAN_COUNTRIES } = require('../config/payments');

// ─────────────────────────────────────────────
// DETECT GATEWAY FROM COUNTRY CODE
// ─────────────────────────────────────────────
function getGatewayForCountry(countryCode) {
  if (!countryCode) return 'stripe';
  return AFRICAN_COUNTRIES.has(countryCode.toUpperCase())
    ? 'paystack'
    : 'stripe';
}

// ─────────────────────────────────────────────
// IS AFRICAN COUNTRY
// ─────────────────────────────────────────────
function isAfricanCountry(countryCode) {
  if (!countryCode) return false;
  return AFRICAN_COUNTRIES.has(countryCode.toUpperCase());
}

// ─────────────────────────────────────────────
// GET CURRENCY FOR COUNTRY
// Returns the primary currency for a country
// ─────────────────────────────────────────────
function getCurrencyForCountry(countryCode) {
  const CURRENCY_MAP = {
    GH: 'GHS', // Ghana Cedi
    NG: 'NGN', // Nigerian Naira
    KE: 'KES', // Kenyan Shilling
    ZA: 'ZAR', // South African Rand
    UG: 'UGX', // Ugandan Shilling
    TZ: 'TZS', // Tanzanian Shilling
    RW: 'RWF', // Rwandan Franc
    ET: 'ETB', // Ethiopian Birr
    EG: 'EGP', // Egyptian Pound
    CI: 'XOF', // West African CFA Franc
    SN: 'XOF', // West African CFA Franc
    CM: 'XAF', // Central African CFA Franc
    GB: 'GBP', // British Pound
    EU: 'EUR', // Euro
    US: 'USD', // US Dollar
  };

  if (!countryCode) return 'USD';
  return CURRENCY_MAP[countryCode.toUpperCase()] || 'USD';
}

// ─────────────────────────────────────────────
// GET MOBILE MONEY NETWORKS FOR COUNTRY
// Returns available Mobile Money networks
// ─────────────────────────────────────────────
function getMobileMoneyNetworks(countryCode) {
  const MOBILE_MONEY_MAP = {
    GH: ['MTN', 'Vodafone Cash', 'AirtelTigo'],
    NG: ['MTN', 'Airtel', 'Glo', '9mobile'],
    KE: ['M-Pesa', 'Airtel Money'],
    UG: ['MTN', 'Airtel Money'],
    TZ: ['M-Pesa', 'Tigo Pesa', 'Airtel Money'],
    RW: ['MTN', 'Airtel Money'],
    ZM: ['MTN', 'Airtel Money'],
    CI: ['Orange Money', 'MTN', 'Moov'],
    SN: ['Orange Money', 'Free Money', 'Wave'],
  };

  if (!countryCode) return [];
  return MOBILE_MONEY_MAP[countryCode.toUpperCase()] || [];
}

module.exports = {
  getGatewayForCountry,
  isAfricanCountry,
  getCurrencyForCountry,
  getMobileMoneyNetworks,
};
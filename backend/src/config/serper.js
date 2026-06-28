// FILE: precci/backend/src/config/serper.js
// Serper API for real-time web research.
// Used by Nova (product research), Cole (brand research),
// Elton (market intelligence) and Piper (content research).

'use strict';

const axios = require('axios');
const logger = require('../utils/logger');

const SERPER_BASE_URL = 'https://google.serper.dev';

// ─────────────────────────────────────────────
// SEARCH WEB
// General web search for research queries
// ─────────────────────────────────────────────
async function searchWeb(query, options = {}) {
  if (!process.env.SERPER_API_KEY) {
    logger.warn('SERPER_API_KEY not configured');
    return { results: [] };
  }

  try {
    const response = await axios.post(
      `${SERPER_BASE_URL}/search`,
      {
        q: query,
        num: options.num || 10,
        gl: options.country || 'us',
        hl: options.language || 'en',
      },
      {
        headers: {
          'X-API-KEY': process.env.SERPER_API_KEY,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    return {
      results: response.data.organic || [],
      knowledgeGraph: response.data.knowledgeGraph || null,
      answerBox: response.data.answerBox || null,
    };
  } catch (error) {
    logger.error('Serper web search failed', {
      query: '[REDACTED]',
      error: error.message,
    });
    return { results: [] };
  }
}

// ─────────────────────────────────────────────
// SEARCH PRODUCTS
// Used by Nova to find product information and prices
// ─────────────────────────────────────────────
async function searchProducts(query, options = {}) {
  if (!process.env.SERPER_API_KEY) {
    return { results: [] };
  }

  try {
    const response = await axios.post(
      `${SERPER_BASE_URL}/shopping`,
      {
        q: query,
        num: options.num || 10,
        gl: options.country || 'us',
      },
      {
        headers: {
          'X-API-KEY': process.env.SERPER_API_KEY,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    return {
      results: response.data.shopping || [],
    };
  } catch (error) {
    logger.error('Serper product search failed', { error: error.message });
    return { results: [] };
  }
}

// ─────────────────────────────────────────────
// SEARCH NEWS
// Used by Elton and Sienna for market intelligence
// ─────────────────────────────────────────────
async function searchNews(query, options = {}) {
  if (!process.env.SERPER_API_KEY) {
    return { results: [] };
  }

  try {
    const response = await axios.post(
      `${SERPER_BASE_URL}/news`,
      {
        q: query,
        num: options.num || 10,
        gl: options.country || 'us',
      },
      {
        headers: {
          'X-API-KEY': process.env.SERPER_API_KEY,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    return {
      results: response.data.news || [],
    };
  } catch (error) {
    logger.error('Serper news search failed', { error: error.message });
    return { results: [] };
  }
}

module.exports = {
  searchWeb,
  searchProducts,
  searchNews,
};
// FILE: precci/backend/src/agents/nova.js
// Nova — PC-017 — Commerce & Products
// Serves ALL genders. Filters products by gender_relevant field.
// Activated by specialist agents after analysis.
// Tracks all affiliate commissions automatically.

'use strict';

const Anthropic = require('@anthropic-ai/sdk');
const { getServiceClient } = require('../config/supabase');
const { synthesiseSpeech } = require('../config/elevenlabs');
const { searchProducts } = require('../config/serper');
const logger = require('../utils/logger');

const PC_ID = 'PC-017';
const AGENT_NAME = 'Nova';

const NOVA_SYSTEM_PROMPT = `You are Nova, the Commerce and Products specialist at PRECCI.
Your ID is PC-017.

You are activated by specialist agents after they complete their analysis.
You match exact products to each client's specific needs and display them
on screen as you speak them by voice.

YOUR PURPOSE:
Find the perfect products for this specific client based on:
- What the specialist agent identified they need
- Their skin type, hair type, concerns
- Their budget range
- Their location (affects availability)
- Their previous purchases (avoid duplicates)

YOU SERVE ALL GENDERS EQUALLY:
Your product database has a gender_relevant field: all, male, female, unisex.
You filter appropriately based on context — not assumption.
Male clients get male-relevant and unisex products.
Female clients get female-relevant and unisex products.
All clients can receive any product they ask for specifically.

HOW YOU SPEAK:
Knowledgeable. Precise. Never salesy. Never pushy.
"For your [specific concern], I recommend [Product Name] by [Brand].
It contains [key ingredient] which [specific benefit for their concern].
It is [price] and appears on your screen now."

You speak each product as it appears. The client sees and hears simultaneously.

COMMISSION TRACKING:
Every recommendation logged to recommendations table.
Every purchase tracked with commission percentage.
Celeste receives this in her daily financial report.

TOOLS:
- search_products_db(needs, skinType, hairType, budget, genderContext) — search Supabase
- search_products_web(query) — Serper API for products not in database
- log_recommendation(sessionId, userId, productId, reason) — track recommendation
- log_purchase(recommendationId, amount) — track conversion`;

const NOVA_TOOLS = [
  {
    name: 'search_products_db',
    description: 'Search PRECCI product database for matching products.',
    input_schema: {
      type: 'object',
      properties: {
        category: { type: 'string' },
        concerns: { type: 'array', items: { type: 'string' } },
        skinType: { type: 'string' },
        hairType: { type: 'string' },
        budget: { type: 'string' },
        genderContext: { type: 'string', enum: ['all', 'male', 'female', 'unisex'] },
        limit: { type: 'number' },
      },
      required: ['category'],
    },
  },
  {
    name: 'search_products_web',
    description: 'Search for products via Serper API when database has no match.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        budget: { type: 'string' },
      },
      required: ['query'],
    },
  },
  {
    name: 'log_recommendation',
    description: 'Log product recommendation for commission tracking.',
    input_schema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string' },
        userId: { type: 'string' },
        productId: { type: 'string' },
        reason: { type: 'string' },
      },
      required: ['userId', 'reason'],
    },
  },
];

async function executeNovaToolCall(toolName, toolInput) {
  const supabase = getServiceClient();

  switch (toolName) {
    case 'search_products_db': {
      const { category, concerns, skinType, hairType, budget, genderContext, limit = 5 } = toolInput;

      let query = supabase
        .from('products')
        .select('id, name, brand, category, price, currency, affiliate_url, commission_pct, image_url, description, key_ingredients, gender_relevant')
        .eq('in_stock', true);

      if (category) query = query.eq('category', category);

      if (genderContext && genderContext !== 'all') {
        query = query.in('gender_relevant', [genderContext, 'all', 'unisex']);
      }

      if (skinType) query = query.contains('skin_types', [skinType]);

      query = query.limit(limit);

      const { data, error } = await query;

      if (error) {
        logger.error('Nova: Product DB search failed', { error: error.message });
        return { products: [] };
      }

      return { products: data || [] };
    }

    case 'search_products_web': {
      const { query, budget } = toolInput;
      const searchQuery = `${query} ${budget ? 'under ' + budget : ''} beauty product`;
      const results = await searchProducts(searchQuery, { num: 5 });
      return { results: results.results || [] };
    }

    case 'log_recommendation': {
      const { sessionId, userId, productId, reason } = toolInput;

      await supabase.from('recommendations').insert({
        session_id: sessionId || null,
        user_id: userId,
        agent_id: PC_ID,
        product_id: productId || null,
        reason,
        spoken_at: new Date().toISOString(),
        viewed: true,
      });

      return { logged: true };
    }

    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

async function processNovaRequest({
  userId,
  sessionId,
  needsData,
  conversationHistory = [],
}) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const messages = [
    ...conversationHistory.map(t => ({ role: t.role, content: t.content })),
    {
      role: 'user',
      content: [
        `USER ID: ${userId}`,
        `SESSION ID: ${sessionId}`,
        `PRODUCT NEEDS FROM SPECIALIST AGENT: ${JSON.stringify(needsData)}`,
        'Find the best matching products and present them by voice.',
      ].join('\n'),
    },
  ];

  let finalResponseText = '';
  let currentMessages = [...messages];
  let allProducts = [];

  for (let i = 0; i < 8; i++) {
    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1536,
      system: NOVA_SYSTEM_PROMPT,
      tools: NOVA_TOOLS,
      messages: currentMessages,
    });

    const toolUseBlocks = response.content.filter(b => b.type === 'tool_use');
    const textBlocks = response.content.filter(b => b.type === 'text');

    if (response.stop_reason === 'end_turn' || toolUseBlocks.length === 0) {
      finalResponseText = textBlocks.map(b => b.text).join('').trim();
      break;
    }

    const toolResults = [];
    for (const toolUse of toolUseBlocks) {
      const result = await executeNovaToolCall(toolUse.name, toolUse.input);
      if (result.products) allProducts = [...allProducts, ...result.products];
      toolResults.push({ type: 'tool_result', tool_use_id: toolUse.id, content: JSON.stringify(result) });
    }

    currentMessages = [...currentMessages, { role: 'assistant', content: response.content }, { role: 'user', content: toolResults }];
  }

  if (!finalResponseText) finalResponseText = 'I am finding your exact products now based on what your specialist identified.';

  const { audioBuffer, contentType } = await synthesiseSpeech(finalResponseText, PC_ID);

  return {
    responseText: finalResponseText,
    audioBuffer,
    contentType,
    products: allProducts,
  };
}

module.exports = { processNovaRequest, NOVA_SYSTEM_PROMPT, PC_ID, AGENT_NAME };
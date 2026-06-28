// FILE: precci/backend/src/config/supabase.js
// SECURITY: Service role key is backend-only. Never sent to frontend.
// Anon key used only for RLS-enforced client operations.
// pgvector helpers scoped per agent — no cross-agent memory access.

'use strict';

const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');

// ─────────────────────────────────────────────
// VALIDATE ENVIRONMENT VARIABLES
// ─────────────────────────────────────────────
function validateSupabaseEnv() {
  const required = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_KEY',
    'SUPABASE_ANON_KEY',
  ];

  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing Supabase environment variables: ${missing.join(', ')}`
    );
  }
}

// ─────────────────────────────────────────────
// SERVICE CLIENT — full access, bypasses RLS
// Use ONLY in backend for agent operations, webhooks, admin tasks
// Never send service key to frontend under any circumstances
// ─────────────────────────────────────────────
let _serviceClient = null;

function getServiceClient() {
  if (!_serviceClient) {
    validateSupabaseEnv();
    _serviceClient = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
        db: {
          schema: 'public',
        },
      }
    );
  }
  return _serviceClient;
}

// ─────────────────────────────────────────────
// ANON CLIENT — RLS enforced
// Used for client-scoped operations where user JWT is available
// ─────────────────────────────────────────────
let _anonClient = null;

function getAnonClient() {
  if (!_anonClient) {
    validateSupabaseEnv();
    _anonClient = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );
  }
  return _anonClient;
}

// ─────────────────────────────────────────────
// STORE EMBEDDING (pgvector)
// Stores agent memory with vector embedding
// Memory is strictly scoped: agentId + userId combination
// No agent ever reads another agent's memory
// ─────────────────────────────────────────────
async function storeEmbedding({
  agentId,
  userId,
  providerId = null,
  content,
  memoryType = 'session',
  embedding,
  metadata = {},
}) {
  const supabase = getServiceClient();

  // Validate agentId — must be a known PC ID
  if (!agentId || typeof agentId !== 'string') {
    throw new Error('storeEmbedding: agentId is required');
  }

  if (!content || typeof content !== 'string') {
    throw new Error('storeEmbedding: content is required');
  }

  if (!Array.isArray(embedding) || embedding.length !== 1536) {
    throw new Error('storeEmbedding: embedding must be a 1536-dimension vector');
  }

  const { data, error } = await supabase
    .from('agent_memory')
    .insert({
      agent_id: agentId,
      user_id: userId || null,
      provider_id: providerId || null,
      content,
      memory_type: memoryType,
      embedding,
      metadata,
    })
    .select('id')
    .single();

  if (error) {
    logger.error('Failed to store embedding', {
      agentId,
      error: error.message,
    });
    throw new Error(`Failed to store agent memory: ${error.message}`);
  }

  return data.id;
}

// ─────────────────────────────────────────────
// SEARCH MEMORY (pgvector)
// Searches agent memory using cosine similarity
// Strictly scoped to agentId + userId — no cross-agent access
// ─────────────────────────────────────────────
async function searchMemory({
  agentId,
  userId,
  queryEmbedding,
  matchThreshold = 0.75,
  matchCount = 5,
}) {
  const supabase = getServiceClient();

  if (!agentId || typeof agentId !== 'string') {
    throw new Error('searchMemory: agentId is required');
  }

  if (!Array.isArray(queryEmbedding) || queryEmbedding.length !== 1536) {
    throw new Error('searchMemory: queryEmbedding must be a 1536-dimension vector');
  }

  const { data, error } = await supabase.rpc('match_agent_memory', {
    query_embedding: queryEmbedding,
    match_agent_id: agentId,
    match_user_id: userId || null,
    match_threshold: matchThreshold,
    match_count: matchCount,
  });

  if (error) {
    logger.error('Failed to search memory', {
      agentId,
      error: error.message,
    });
    throw new Error(`Failed to search agent memory: ${error.message}`);
  }

  return data || [];
}

// ─────────────────────────────────────────────
// HEALTH CHECK
// Used by Marcus's monitoring to verify Supabase connection
// ─────────────────────────────────────────────
async function checkSupabaseHealth() {
  try {
    const supabase = getServiceClient();
    const { error } = await supabase
      .from('agents')
      .select('id')
      .limit(1);

    if (error) throw error;
    return { healthy: true };
  } catch (error) {
    logger.error('Supabase health check failed', { error: error.message });
    return { healthy: false, error: error.message };
  }
}

module.exports = {
  getServiceClient,
  getAnonClient,
  storeEmbedding,
  searchMemory,
  checkSupabaseHealth,
};
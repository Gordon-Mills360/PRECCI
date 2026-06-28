// FILE: precci/backend/src/utils/embeddings.js
// pgvector embedding utilities for agent memory.
// All embeddings generated server-side only.
// Each agent's memory is strictly scoped to that agent + user.

'use strict';

const { generateEmbedding } = require('../config/openai');
const { storeEmbedding, searchMemory } = require('../config/supabase');
const logger = require('./logger');

// ─────────────────────────────────────────────
// STORE AGENT MEMORY WITH EMBEDDING
// Generates embedding and stores in pgvector
// Strictly scoped: agentId + userId — no cross-agent access
// ─────────────────────────────────────────────
async function storeAgentMemory({
  agentId,
  userId,
  providerId = null,
  content,
  memoryType = 'session',
  metadata = {},
}) {
  try {
    if (!agentId || !content) {
      throw new Error('storeAgentMemory: agentId and content are required');
    }

    // Generate 1536-dimension embedding
    const embedding = await generateEmbedding(content);

    // Store in pgvector
    const memoryId = await storeEmbedding({
      agentId,
      userId,
      providerId,
      content,
      memoryType,
      embedding,
      metadata,
    });

    return memoryId;
  } catch (error) {
    logger.error('Failed to store agent memory', {
      agentId,
      error: error.message,
    });
    // Non-fatal — agent continues without storing memory
    return null;
  }
}

// ─────────────────────────────────────────────
// SEARCH AGENT MEMORY
// Finds relevant past memories for this agent + user
// Returns most semantically similar memories
// ─────────────────────────────────────────────
async function searchAgentMemory({
  agentId,
  userId,
  query,
  matchThreshold = 0.75,
  matchCount = 5,
}) {
  try {
    if (!agentId || !query) {
      return [];
    }

    // Generate embedding for the search query
    const queryEmbedding = await generateEmbedding(query);

    // Search pgvector
    const memories = await searchMemory({
      agentId,
      userId,
      queryEmbedding,
      matchThreshold,
      matchCount,
    });

    return memories || [];
  } catch (error) {
    logger.error('Failed to search agent memory', {
      agentId,
      error: error.message,
    });
    // Non-fatal — agent continues without memory context
    return [];
  }
}

// ─────────────────────────────────────────────
// BUILD MEMORY CONTEXT STRING
// Formats retrieved memories into a context block
// for injection into agent system prompts
// ─────────────────────────────────────────────
function buildMemoryContext(memories) {
  if (!memories || memories.length === 0) {
    return '';
  }

  const memoryLines = memories.map((m, i) => {
    const date = new Date(m.created_at).toLocaleDateString();
    return `[Memory ${i + 1} — ${date}]: ${m.content}`;
  });

  return `\n\nRELEVANT PAST CONTEXT FOR THIS CLIENT:\n${memoryLines.join('\n')}`;
}

module.exports = {
  storeAgentMemory,
  searchAgentMemory,
  buildMemoryContext,
};
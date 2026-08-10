const crypto = require('crypto');
const { getProvider } = require('./aiProviders');
const Conversation = require('../models/Conversation');
const redis = require('../config/redis');
const env = require('../config/env');
const logger = require('../config/logger');

function cacheKeyFor(messages, model) {
  const hash = crypto.createHash('sha256').update(JSON.stringify({ messages, model })).digest('hex');
  return `ai:cache:${hash}`;
}

// Generic entry point behind /api/ai/chat, /api/ai/generate, /api/ai/analyze.
// All three ultimately call the same pluggable provider — split into separate
// endpoints so the frontend/hackathon logic can evolve each independently
// (e.g. `analyze` later gets structured-output parsing, `generate` gets
// longer max_tokens) without touching the provider layer.
async function runChat({ ownerId, messages, model, conversationId, useCache = true }) {
  const provider = getProvider();
  const cacheKey = cacheKeyFor(messages, model || env.ai.model);

  if (useCache) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) return { ...JSON.parse(cached), cached: true };
    } catch (err) {
      logger.warn({ err }, 'ai cache read failed');
    }
  }

  const result = await provider.chat({ messages, model: model || env.ai.model });

  if (useCache) {
    redis.set(cacheKey, JSON.stringify(result), 'EX', 300).catch((err) => logger.warn({ err }, 'ai cache write failed'));
  }

  if (ownerId) {
    try {
      if (conversationId) {
        await Conversation.findOneAndUpdate(
          { _id: conversationId, ownerId },
          { $push: { messages: { $each: [...messages.slice(-1), { role: 'assistant', content: result.content }] } } }
        );
      } else {
        await Conversation.create({
          ownerId,
          provider: env.ai.provider,
          model: model || env.ai.model,
          messages: [...messages, { role: 'assistant', content: result.content }],
        });
      }
    } catch (err) {
      logger.warn({ err }, 'failed to persist conversation (non-fatal)');
    }
  }

  return { ...result, cached: false };
}

module.exports = { runChat };

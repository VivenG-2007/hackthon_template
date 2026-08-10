const env = require('../../config/env');
const mock = require('./mock');
const groq = require('./groq');
const openai = require('./openai');
const azureOpenai = require('./azureOpenai');

// Every provider module exports the same shape: async chat({ messages, model }) -> { content, usage }.
// Add a new file here + one line below to plug in RAG, embeddings, vision, or speech providers later.
const providers = { mock, groq, openai, 'azure-openai': azureOpenai };

function getProvider() {
  const provider = providers[env.ai.provider];
  if (!provider) {
    throw new Error(`Unknown AI_PROVIDER "${env.ai.provider}". Supported: ${Object.keys(providers).join(', ')}`);
  }
  return provider;
}

module.exports = { getProvider, providers };

const fetch = require('node-fetch');
const env = require('../../config/env');

// Groq exposes an OpenAI-compatible chat completions endpoint.
async function chat({ messages, model }) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${env.ai.apiKey}` },
    body: JSON.stringify({ model: model || env.ai.model, messages }),
  });
  if (!response.ok) {
    const text = await response.text();
    throw Object.assign(new Error(`Groq API error: ${text}`), { status: 502 });
  }
  const data = await response.json();
  return {
    content: data.choices?.[0]?.message?.content || '',
    usage: data.usage || {},
  };
}

module.exports = { chat };

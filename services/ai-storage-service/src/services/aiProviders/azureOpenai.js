const fetch = require('node-fetch');
const env = require('../../config/env');

async function chat({ messages }) {
  if (!env.ai.azureEndpoint || !env.ai.azureDeployment) {
    throw Object.assign(new Error('AZURE_OPENAI_ENDPOINT / AZURE_OPENAI_DEPLOYMENT not configured'), { status: 500 });
  }
  const url = `${env.ai.azureEndpoint}/openai/deployments/${env.ai.azureDeployment}/chat/completions?api-version=2024-06-01`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'api-key': env.ai.apiKey },
    body: JSON.stringify({ messages }),
  });
  if (!response.ok) {
    const text = await response.text();
    throw Object.assign(new Error(`Azure OpenAI error: ${text}`), { status: 502 });
  }
  const data = await response.json();
  return {
    content: data.choices?.[0]?.message?.content || '',
    usage: data.usage || {},
  };
}

module.exports = { chat };

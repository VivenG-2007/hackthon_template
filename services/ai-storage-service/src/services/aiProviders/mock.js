// Zero-dependency provider used by default so the template runs out of the
// box with no API key. Swap AI_PROVIDER in .env once you have real creds.
async function chat({ messages }) {
  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  return {
    content: `[mock provider] I received: "${(lastUser?.content || '').slice(0, 200)}". Set AI_PROVIDER + AI_API_KEY in .env to use a real model.`,
    usage: { promptTokens: 0, completionTokens: 0 },
  };
}

module.exports = { chat };

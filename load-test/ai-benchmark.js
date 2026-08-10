const autocannon = require('autocannon');

const target = process.env.TARGET_URL || 'http://localhost:5001';
const token = process.env.ACCESS_TOKEN || '';

if (!token) {
  console.warn('Set ACCESS_TOKEN to a valid access token to benchmark the authenticated /api/proxy/api/ai/chat route.');
}

autocannon(
  {
    url: `${target}/api/proxy/api/ai/chat`,
    connections: 10, // AI calls are latency-bound by the upstream provider — keep concurrency modest
    duration: 20,
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify({ messages: [{ role: 'user', content: 'Say hello in five words.' }] }),
  },
  (err, result) => {
    if (err) { console.error(err); process.exit(1); }
    console.log(autocannon.printResult(result));
  }
);

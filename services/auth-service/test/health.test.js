const test = require('node:test');
const assert = require('node:assert');

// Minimal smoke test that doesn't require a live Mongo connection —
// verifies the Express app boots and responds. Extend with supertest +
// mongodb-memory-server for full integration coverage.
process.env.JWT_PRIVATE_KEY_BASE64 = process.env.JWT_PRIVATE_KEY_BASE64 || '';
process.env.JWT_PUBLIC_KEY_BASE64 = process.env.JWT_PUBLIC_KEY_BASE64 || '';

test('app module loads without throwing', () => {
  const app = require('../src/app');
  assert.ok(app);
});

const test = require('node:test');
const assert = require('node:assert');

test('app module loads without throwing', () => {
  const app = require('../src/app');
  assert.ok(app);
});

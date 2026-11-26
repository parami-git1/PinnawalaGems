const assert = require('node:assert/strict');
const { before, after, mock, test } = require('node:test');
const { once } = require('node:events');
const mongoose = require('mongoose');

process.env.NODE_ENV = 'test';
for (const name of ['MONGO_URI', 'JWT_SECRET', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET', 'GOOGLE_CLIENT_ID']) delete process.env[name];
let server, base;
before(async () => {
  mock.method(mongoose, 'connect', () => { throw new Error('Real database access is forbidden.'); });
  const Feedback = require('../models/Feedback');
  mock.method(Feedback.prototype, 'save', async () => { throw new Error('mongodb://SYNTHETIC_USER:SYNTHETIC_SECRET@db.example.test/private'); });
  server = require('../server').listen(0, '127.0.0.1'); await once(server, 'listening');
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); mock.restoreAll(); });
test('public review storage failures are retryable sanitized errors and never expose database details', async () => {
  const result = await fetch(base + '/api/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Synthetic guest', review: 'Synthetic feedback error verification.', rating: 5 }) });
  assert.equal(result.status, 500);
  assert.deepEqual(await result.json(), { message: 'Unable to complete this request. Please try again.' });
  assert.equal(result.headers.get('Cache-Control'), 'no-store');
});

const assert = require('node:assert/strict');
const { before, beforeEach, after, mock, test } = require('node:test');
const { once } = require('node:events');
const { createHash } = require('node:crypto');
const fs = require('node:fs');
const zlib = require('node:zlib');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;

// Real local middleware/controllers, synthetic secrets/records/cloud uploads.
// Never read .env or connect to a database/external authentication service.
const SECRET = 'AUDIT_FIX_TEST_ONLY_NOT_A_PRODUCTION_SECRET_123456789';
process.env.JWT_SECRET = SECRET;
process.env.ADMIN_USERNAME = 'synthetic-admin';
process.env.ADMIN_PASSWORD = 'SYNTHETIC_TEST_ONLY_PASSWORD';
process.env.ALLOWED_ORIGINS = 'https://shop.example.test';
process.env.NODE_ENV = 'test';
process.env.TRUST_PROXY_HOPS = '0';
for (const name of ['MONGO_URI', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET', 'GOOGLE_CLIENT_ID', 'ADMIN_GOOGLE_EMAILS', 'ADMIN_EMAIL']) delete process.env[name];
const security = require('../middleware/security');
let server, base, Feedback;
let reviews = [], uploads = [];
const PNG = Buffer.from('89504e470d0a1a0a0000000d4948445200000001000000010806000000', 'hex');
const token = (options = {}) => jwt.sign({ sub: 'synthetic-security-admin', role: 'admin', iss: 'pinnawala-gems-admin', aud: 'pinnawala-gems-api' }, SECRET, { expiresIn: '1h', ...options });

async function api(route, { method = 'GET', body, headers = {}, raw, auth = false } = {}) {
  const response = await fetch(base + route, { method, headers: { ...(body !== undefined || raw !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(auth ? { Authorization: `Bearer ${token()}` } : {}), ...headers }, ...(body !== undefined ? { body: JSON.stringify(body) } : raw !== undefined ? { body: raw } : {}) });
  const text = await response.text();
  let data; try { data = JSON.parse(text); } catch {}
  return { status: response.status, headers: response.headers, data, text };
}
async function legacyUpload(bytes, type = 'image/png') {
  const body = new FormData(); body.append('image', new Blob([bytes], { type }), 'synthetic.png');
  const response = await fetch(base + '/api/upload', { method: 'POST', headers: { Authorization: `Bearer ${token()}` }, body });
  return { status: response.status, data: await response.json() };
}

before(async () => {
  mock.method(mongoose, 'connect', () => { throw new Error('Database access is forbidden in security tests'); });
  mock.method(cloudinary.uploader, 'upload', async (file, options) => {
    assert.equal(fs.existsSync(file), true);
    uploads.push({ file, options });
    return { secure_url: 'https://res.cloudinary.com/synthetic/image/upload/v1/pinnawala_gems/test.png', public_id: 'pinnawala_gems/test' };
  });
  const app = require('../server');
  Feedback = require('../models/Feedback');
  mock.method(Feedback.prototype, 'save', async function () { await this.validate(); reviews.push(this.toObject()); return this; });
  mock.method(Feedback, 'find', (query) => ({ sort: async () => reviews.filter((review) => query.isApproved === undefined || review.isApproved === query.isApproved) }));
  mock.method(Feedback, 'findByIdAndUpdate', async () => null);
  mock.method(Feedback, 'findByIdAndDelete', async () => null);
  server = app.listen(0, '127.0.0.1'); await once(server, 'listening'); base = `http://127.0.0.1:${server.address().port}`;
});
beforeEach(() => {
  reviews = []; uploads = [];
  for (const limiter of [security.apiLimiter, security.loginIpLimiter, security.feedbackLimiter, security.uploadLimiter]) limiter.resetKey('127.0.0.1');
  for (const name of ['synthetic-admin', 'invalid', 'someone-else']) security.loginAccountLimiter.resetKey(`127.0.0.1:${createHash('sha256').update(name).digest('hex')}`);
});
after(async () => { if (server) { server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); } mock.restoreAll(); });

test('API responses have defense headers and omit framework disclosure', async () => {
  const response = await api('/api/health');
  assert.equal(response.status, 503);
  assert.ok(response.data.features.includes('security-hardening'));
  assert.equal(response.headers.get('x-powered-by'), null);
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('x-frame-options'), 'SAMEORIGIN');
  assert.ok(response.headers.get('content-security-policy').includes("default-src 'none'"));
  assert.ok(response.headers.get('strict-transport-security').includes('max-age='));
});
test('CORS permits configured/local origins and rejects unrelated origins', async () => {
  const allowed = await api('/api/health', { headers: { Origin: 'https://shop.example.test' } });
  assert.equal(allowed.headers.get('access-control-allow-origin'), 'https://shop.example.test');
  assert.equal((await api('/api/health', { headers: { Origin: 'http://localhost:5173' } })).status, 503);
  const denied = await api('/api/health', { headers: { Origin: 'https://unrelated.example.test' } });
  assert.equal(denied.status, 403); assert.equal(denied.headers.get('access-control-allow-origin'), null);
  assert.equal(denied.headers.get('cache-control'), 'no-store');
  const preflight = await api('/api/media/upload', { method: 'OPTIONS', headers: { Origin: 'https://shop.example.test', 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'authorization,content-type' } });
  assert.equal(preflight.status, 204);
  const previous = process.env.NODE_ENV; process.env.NODE_ENV = 'production';
  try { assert.equal(security.allowedOrigin('http://localhost:5173'), false); assert.equal(security.allowedOrigin('https://shop.example.test'), true); } finally { process.env.NODE_ENV = previous; }
});
test('malformed, oversized and compressed JSON returns sanitized JSON errors', async () => {
  const malformed = await api('/api/admin/login', { method: 'POST', raw: '{' });
  assert.equal(malformed.status, 400); assert.ok(malformed.headers.get('content-type').includes('application/json')); assert.doesNotMatch(malformed.text, /SyntaxError|node_modules|<html>/i);
  assert.equal((await api('/api/admin/login', { method: 'POST', body: { payload: 'x'.repeat(103000) } })).status, 413);
  const compressed = await api('/api/admin/login', { method: 'POST', raw: zlib.gzipSync(Buffer.from('{}')), headers: { 'Content-Encoding': 'gzip' } });
  assert.equal(compressed.status, 415); assert.ok(compressed.data.message.includes('Compressed'));
});
test('login validates input types and still issues a verifiable administrator session', async () => {
  assert.equal((await api('/api/admin/login', { method: 'POST', body: { username: {}, password: 'bad' } })).status, 400);
  const success = await api('/api/admin/login', { method: 'POST', body: { username: ' synthetic-admin ', password: process.env.ADMIN_PASSWORD } });
  assert.equal(success.status, 200); assert.equal(jwt.verify(success.data.token, SECRET, { algorithms: ['HS256'] }).username, 'synthetic-admin');
  assert.equal((await api('/api/admin/login', { method: 'POST', body: { username: 'someone-else', password: process.env.ADMIN_PASSWORD } })).status, 401);
});
test('repeated password guesses are throttled with a retry deadline', async () => {
  for (let attempt = 0; attempt < 10; attempt++) assert.equal((await api('/api/admin/login', { method: 'POST', body: { username: 'synthetic-admin', password: 'incorrect-test-only' } })).status, 401);
  const blocked = await api('/api/admin/login', { method: 'POST', body: { username: 'synthetic-admin', password: 'incorrect-test-only' } });
  assert.equal(blocked.status, 429); assert.ok(Number(blocked.headers.get('retry-after')) > 0);
});
test('administrator tokens with an unexpected signing algorithm are rejected', async () => {
  const response = await api('/api/stock/stones', { headers: { Authorization: `Bearer ${token({ algorithm: 'HS384' })}` } });
  assert.equal(response.status, 401);
});
test('public reviews are trimmed, bounded, integer-rated and cannot self-approve', async () => {
  const created = await api('/api/feedback', { method: 'POST', body: { name: '  Test customer  ', review: '  A thoughtful experience.  ', rating: 5, isApproved: true } });
  assert.equal(created.status, 201); assert.equal(created.data.name, 'Test customer'); assert.equal(created.data.review, 'A thoughtful experience.'); assert.equal(created.data.isApproved, false);
  const publicReviews = await api('/api/feedback'); assert.deepEqual(publicReviews.data, []);
  assert.equal(publicReviews.headers.get('cache-control'), 'public, max-age=30, stale-while-revalidate=60');
  assert.match(publicReviews.headers.get('vary'), /Authorization/);
  const privateReviews = await api('/api/feedback', { auth: true });
  assert.equal(privateReviews.data.length, 1);
  assert.equal(privateReviews.headers.get('cache-control'), 'no-store');
});
test('invalid public reviews and bot fields are rejected before storage', async () => {
  for (const body of [{ name: '  ', review: 'content', rating: 5 }, { name: 'Test', review: '   ', rating: 5 }, { name: 'Test', review: 'content', rating: 4.5 }, { name: 'x'.repeat(101), review: 'content', rating: 5 }, { name: 'Test', review: 'content', rating: 5, website: 'bot-field' }]) assert.equal((await api('/api/feedback', { method: 'POST', body })).status, 400);
  assert.equal(reviews.length, 0);
});
test('review submission bursts are rate-limited', async () => {
  for (let index = 0; index < 5; index++) assert.equal((await api('/api/feedback', { method: 'POST', body: { name: 'Test customer', review: 'Synthetic feedback.', rating: 4 } })).status, 201);
  assert.equal((await api('/api/feedback', { method: 'POST', body: { name: 'Test customer', review: 'Synthetic feedback.', rating: 4 } })).status, 429); assert.equal(reviews.length, 5);
});
test('missing/invalid review management requests return JSON 404/400', async () => {
  assert.equal((await api('/api/feedback/000000000000000000000088/approve', { method: 'PUT', auth: true })).status, 404);
  assert.equal((await api('/api/feedback/000000000000000000000088', { method: 'DELETE', auth: true })).status, 404);
  assert.equal((await api('/api/feedback/not-an-id/approve', { method: 'PUT', auth: true })).status, 400);
});
test('legacy photo uploads enforce the same size/type/signature constraints as gem media', async () => {
  const tooLarge = Buffer.alloc(8 * 1024 * 1024 + 1); PNG.copy(tooLarge);
  assert.equal((await legacyUpload(tooLarge)).status, 413); assert.equal(uploads.length, 0);
  assert.equal((await legacyUpload(Buffer.from('not a png'))).status, 400); assert.equal(uploads.length, 0);
  assert.equal((await legacyUpload(Buffer.from('video'), 'video/mp4')).status, 400); assert.equal(uploads.length, 0);
  const exact = Buffer.alloc(8 * 1024 * 1024); PNG.copy(exact);
  const result = await legacyUpload(exact); assert.equal(result.status, 200); assert.equal(result.data.imageUrl, result.data.url); assert.equal(result.data.resourceType, 'image');
  assert.equal(uploads.length, 1); assert.equal(fs.existsSync(uploads[0].file), false);
});

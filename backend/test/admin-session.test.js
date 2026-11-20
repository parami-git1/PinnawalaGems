const assert = require('node:assert/strict');
const { before, beforeEach, after, mock, test } = require('node:test');
const { once } = require('node:events');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { OAuth2Client } = require('google-auth-library');

// Synthetic credentials and in-memory API doubles only. Never load .env or
// connect to MongoDB, Google authentication or Cloudinary from these tests.
const SECRET = 'ADMIN_SESSION_TEST_ONLY_NOT_A_PRODUCTION_SECRET_123456';
process.env.JWT_SECRET = SECRET;
process.env.ADMIN_USERNAME = 'synthetic-session-admin';
process.env.ADMIN_PASSWORD = 'SYNTHETIC_SESSION_PASSWORD';
process.env.GOOGLE_CLIENT_ID = 'SYNTHETIC_SESSION_GOOGLE_CLIENT';
process.env.ADMIN_GOOGLE_EMAILS = 'admin-google@example.test';
process.env.ALLOWED_ORIGINS = 'https://shop.example.test';
process.env.NODE_ENV = 'test';
process.env.TRUST_PROXY_HOPS = '0';
for (const key of ['MONGO_URI', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET', 'ADMIN_EMAIL']) delete process.env[key];
const { ADMIN_ISSUER, ADMIN_AUDIENCE } = require('../utils/adminSession');
const scopedClaims = { sub: 'synthetic-session-subject', role: 'admin', iss: ADMIN_ISSUER, aud: ADMIN_AUDIENCE };
const sign = (claims = scopedClaims, options = {}, secret = SECRET) => {
  const settings = { expiresIn: '1h', ...options };
  for (const key of Object.keys(settings)) if (settings[key] === undefined) delete settings[key];
  return jwt.sign(claims, secret, settings);
};
const id = '000000000000000000000088';
let server, base, modelTouches = [], googlePayload;

async function api(path, { method = 'GET', token, body, authorization } = {}) {
  const response = await fetch(base + path, { method, headers: {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(authorization ? { Authorization: authorization } : {}),
    ...(body ? { 'Content-Type': 'application/json' } : {}),
  }, ...(body ? { body: JSON.stringify(body) } : {}) });
  return { status: response.status, headers: response.headers, data: await response.json() };
}

before(async () => {
  mock.method(mongoose, 'connect', () => { throw new Error('Database connections are forbidden in session tests'); });
  mock.method(OAuth2Client.prototype, 'verifyIdToken', async () => ({ getPayload: () => googlePayload }));
  const app = require('../server');
  for (const name of ['Appointment', 'AdminNote', 'StockCategory', 'StockStone', 'Stone', 'Gem', 'GemCategory', 'HomeData', 'ContactData', 'WorkshopStep', 'EventAd', 'Feedback']) {
    const Model = mongoose.model(name);
    for (const method of ['find', 'findOne', 'findById', 'aggregate', 'create', 'findByIdAndUpdate', 'findOneAndUpdate', 'findByIdAndDelete', 'deleteMany']) {
      mock.method(Model, method, () => { modelTouches.push(`${name}.${method}`); throw new Error('An unauthorized request reached a model'); });
    }
  }
  mock.method(mongoose.model('Feedback'), 'find', (query) => {
    modelTouches.push({ model: 'Feedback', query });
    return { sort: async () => query.isApproved ? [{ name: 'Approved synthetic review', isApproved: true }] : [{ name: 'Pending synthetic review', isApproved: false }] };
  });
  mock.method(mongoose.model('HomeData'), 'findById', async () => null);
  mock.method(mongoose.model('HomeData'), 'findOne', () => ({ sort: async () => null }));
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  base = `http://127.0.0.1:${server.address().port}`;
});
beforeEach(() => {
  modelTouches = [];
  googlePayload = { sub: 'synthetic-google-subject', email: 'admin-google@example.test', name: 'Synthetic Google Admin', email_verified: true };
});
after(async () => { if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); } mock.restoreAll(); });

test('read-only session verification returns minimal identity, expiry and no-store without touching models', async () => {
  const token = sign({ ...scopedClaims, username: 'Synthetic Admin', password: 'must-not-be-exposed', extra: 'not-an-identity-field' });
  const claims = jwt.decode(token);
  const response = await api('/api/admin/session', { token });
  assert.equal(response.status, 200);
  assert.deepEqual(response.data.admin, { role: 'admin', subject: scopedClaims.sub, username: 'Synthetic Admin' });
  assert.equal(response.data.expiresAt, claims.exp * 1000);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.match(response.headers.get('vary'), /Authorization/);
  assert.equal(response.data.token, undefined);
  assert.doesNotMatch(JSON.stringify(response.data), /must-not-be-exposed|not-an-identity-field/);
  assert.deepEqual(modelTouches, []);
  assert.equal((await api('/api/admin/session', { authorization: `bearer ${token}` })).status, 200);
});

test('existing password and Google login contracts issue scoped eight-hour admin JWTs', async () => {
  for (const [path, body] of [
    ['/api/admin/login', { username: process.env.ADMIN_USERNAME, password: process.env.ADMIN_PASSWORD }],
    ['/api/admin/google-login', { credential: 'SYNTHETIC_GOOGLE_CREDENTIAL' }],
  ]) {
    const login = await api(path, { method: 'POST', body });
    assert.equal(login.status, 200, path);
    const claims = jwt.verify(login.data.token, SECRET, { algorithms: ['HS256'], issuer: ADMIN_ISSUER, audience: ADMIN_AUDIENCE });
    assert.equal(claims.role, 'admin');
    assert.equal(claims.exp - claims.iat, 8 * 60 * 60);
    assert.equal(login.headers.get('cache-control'), 'no-store');
    assert.equal((await api('/api/admin/session', { token: login.data.token })).status, 200);
  }
  assert.deepEqual(modelTouches, []);
});

test('session endpoint rejects absent, forged, expired, unbounded and malformed authentication', async () => {
  const now = Math.floor(Date.now() / 1000);
  const invalid = [
    {}, { authorization: 'Bearer not-a-token' },
    { token: sign(scopedClaims, {}, 'WRONG_TEST_ONLY_SECRET') },
    { token: sign(scopedClaims, { algorithm: 'HS384' }) },
    { token: sign({ ...scopedClaims, iat: now - 120, exp: now - 60 }, { expiresIn: undefined }) },
    { token: sign({ ...scopedClaims, iat: now + 60 }) },
    { token: sign(scopedClaims, { expiresIn: undefined }) },
    { token: sign(scopedClaims, { noTimestamp: true }) },
    { token: sign(scopedClaims, { expiresIn: '24h' }) },
    { token: jwt.sign(scopedClaims, '', { algorithm: 'none' }) },
  ];
  for (const auth of invalid) {
    const response = await api('/api/admin/session', auth);
    assert.equal(response.status, 401);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal(response.data.admin, undefined);
  }
  assert.deepEqual(modelTouches, []);
});

test('verified non-admin, wrong-purpose and identity-less JWTs cannot become administrator sessions', async () => {
  for (const claims of [
    { ...scopedClaims, role: 'customer' }, { ...scopedClaims, role: null },
    { ...scopedClaims, iss: 'another-service' }, { ...scopedClaims, aud: 'another-api' },
    { ...scopedClaims, sub: '' }, { ...scopedClaims, sub: undefined },
    { sub: 'arbitrary-legacy-signed-subject' }, { ...scopedClaims, role: undefined },
  ]) {
    assert.equal((await api('/api/admin/session', { token: sign(claims) })).status, 403);
  }
  assert.deepEqual(modelTouches, []);
});

test('real legacy administrator token identities remain compatible until their existing expiry', async () => {
  for (const claims of [
    { sub: `password-admin:${process.env.ADMIN_USERNAME}`, username: process.env.ADMIN_USERNAME },
    { sub: 'legacy-google-admin-subject', email: 'admin-google@example.test', name: 'Legacy Google Admin' },
  ]) {
    const response = await api('/api/admin/session', { token: sign(claims, { expiresIn: '8h' }) });
    assert.equal(response.status, 200);
    assert.equal(response.data.admin.role, 'admin');
    assert.equal(response.data.admin.subject, claims.sub);
  }
  for (const claims of [
    { sub: 'password-admin:someone-else', username: process.env.ADMIN_USERNAME },
    { sub: `password-admin:${process.env.ADMIN_USERNAME}`, username: 'someone-else' },
    { sub: 'legacy-google-subject', email: 'not-allowed@example.test' },
  ]) assert.equal((await api('/api/admin/session', { token: sign(claims) })).status, 403);
  assert.deepEqual(modelTouches, []);
});

test('all mounted private reads and administrative mutations reject missing and wrong-role tokens', async () => {
  const routes = [
    ['GET', '/api/admin/session'], ['POST', '/api/upload'], ['POST', '/api/media/upload'],
    ['GET', '/api/stock/categories'], ['POST', '/api/stock/categories'], ['DELETE', `/api/stock/categories/${id}`],
    ['GET', '/api/stock/stones'], ['GET', `/api/stock/categories/${id}/stones`], ['POST', '/api/stock/stones'],
    ['PUT', `/api/stock/stones/${id}`], ['DELETE', `/api/stock/stones/${id}`],
    ['GET', '/api/analytics'], ['GET', '/api/analytics/dashboard-stats'],
    ['GET', '/api/appointments'], ['GET', `/api/appointments/${id}`], ['POST', '/api/appointments'], ['PUT', `/api/appointments/${id}`], ['DELETE', `/api/appointments/${id}`],
    ['GET', '/api/admin-notes'], ['POST', '/api/admin-notes'], ['PUT', `/api/admin-notes/${id}`], ['DELETE', `/api/admin-notes/${id}`],
    ['GET', '/api/planner/notifications'],
    ['POST', '/api/inventory/categories'], ['PUT', `/api/inventory/categories/${id}`], ['DELETE', `/api/inventory/categories/${id}`], ['DELETE', `/api/inventory/categories/${id}/stones`],
    ['POST', '/api/inventory/stones'], ['PUT', `/api/inventory/stones/${id}`], ['PUT', `/api/inventory/stones/${id}/feature`], ['DELETE', `/api/inventory/stones/${id}`],
    ['POST', '/api/gems'], ['PUT', `/api/gems/${id}`], ['DELETE', `/api/gems/${id}`],
    ['PUT', '/api/home'], ['PUT', '/api/contact'],
    ['POST', '/api/workshop'], ['PUT', `/api/workshop/${id}`], ['DELETE', `/api/workshop/${id}`],
    ['POST', '/api/event-ads'], ['PUT', `/api/event-ads/${id}`], ['DELETE', `/api/event-ads/${id}`],
    ['PUT', `/api/feedback/${id}/approve`], ['DELETE', `/api/feedback/${id}`],
  ];
  for (const [method, path] of routes) {
    assert.equal((await api(path, { method })).status, 401, `${method} ${path} without authentication`);
    const denied = await api(path, { method, token: sign({ ...scopedClaims, role: 'customer' }) });
    assert.equal(denied.status, 403, `${method} ${path} with a non-admin token`);
    assert.equal(denied.headers.get('cache-control'), 'no-store');
  }
  assert.deepEqual(modelTouches, []);
});

test('public reads remain public and pending reviews require the same verified administrator role', async () => {
  const home = await api('/api/home');
  assert.equal(home.status, 200);
  assert.equal(home.headers.get('cache-control'), 'public, max-age=30, stale-while-revalidate=60');
  const reviews = await api('/api/feedback');
  assert.equal(reviews.status, 200);
  assert.equal(reviews.data[0].isApproved, true);
  const pending = await api('/api/feedback', { token: sign() });
  assert.equal(pending.status, 200);
  assert.equal(pending.data[0].isApproved, false);
  assert.equal(pending.headers.get('cache-control'), 'no-store');
  const before = modelTouches.length;
  assert.equal((await api('/api/feedback', { token: sign({ ...scopedClaims, role: 'customer' }) })).status, 403);
  assert.equal((await api('/api/feedback', { token: 'invalid-token' })).status, 401);
  assert.equal(modelTouches.length, before);
});

test('unverified or non-allowlisted Google identities cannot obtain admin JWTs', async () => {
  googlePayload.email_verified = false;
  assert.equal((await api('/api/admin/google-login', { method: 'POST', body: { credential: 'SYNTHETIC_GOOGLE_CREDENTIAL' } })).status, 403);
  googlePayload.email_verified = true;
  googlePayload.email = 'another@example.test';
  assert.equal((await api('/api/admin/google-login', { method: 'POST', body: { credential: 'SYNTHETIC_GOOGLE_CREDENTIAL' } })).status, 403);
  googlePayload.email = 'admin-google@example.test';
  googlePayload.sub = '';
  assert.equal((await api('/api/admin/google-login', { method: 'POST', body: { credential: 'SYNTHETIC_GOOGLE_CREDENTIAL' } })).status, 403);
  googlePayload.sub = 'synthetic-google-subject';
  googlePayload.email_verified = 'false';
  assert.equal((await api('/api/admin/google-login', { method: 'POST', body: { credential: 'SYNTHETIC_GOOGLE_CREDENTIAL' } })).status, 403);
});

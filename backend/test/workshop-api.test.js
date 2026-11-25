const assert = require('node:assert/strict');
const { before, beforeEach, after, test, mock } = require('node:test');
const { once } = require('node:events');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// Mounted HTTP routes and real Mongoose validators, without a database or .env.
const SECRET = 'WORKSHOP_TEST_ONLY_PUBLIC_DUMMY_KEY';
const NOW = Date.parse('2026-11-25T09:00:00.000Z');
process.env.JWT_SECRET = SECRET;
process.env.NODE_ENV = 'test';
process.env.ADMIN_USERNAME = 'synthetic-workshop-admin';
process.env.ADMIN_PASSWORD = 'SYNTHETIC_PASSWORD';
for (const key of ['MONGO_URI', 'ADMIN_AUTH_MODE', 'ADMIN_GOOGLE_EMAIL', 'ADMIN_GOOGLE_EMAILS', 'ADMIN_EMAIL', 'GOOGLE_CLIENT_ID']) delete process.env[key];
let server, base, Model;
const rows = [];
const calls = [];
let fail = false;
const plain = value => JSON.parse(JSON.stringify(value));
function matches(row, query) {
  return Object.entries(query).every(([field, condition]) => {
    if (field === '$or') return condition.some(part => matches(row, part));
    if (condition && typeof condition === 'object' && !(condition instanceof Date)) return Object.entries(condition).every(([operator, expected]) => {
      if (operator === '$exists') return Object.hasOwn(row, field) === expected;
      if (operator === '$ne') return row[field] !== expected;
      if (operator === '$lte') return new Date(row[field]).getTime() <= expected.getTime();
      throw new Error('Unexpected synthetic query operator');
    });
    return row[field] === condition;
  });
}
before(async () => {
  mock.method(mongoose, 'connect', () => { throw new Error('Database access is forbidden in this test'); });
  const app = require('../server');
  Model = require('../models/WorkshopStep');
  mock.method(Model, 'find', query => {
    calls.push({ method: 'find', query });
    if (fail) throw new Error('PRIVATE_DATABASE_DETAILS_MUST_NOT_ESCAPE');
    return { sort: async () => rows.filter(row => matches(row, query)).map(plain) };
  });
  mock.method(Model.prototype, 'save', async function () { await this.validate(); rows.push(plain(this)); return this; });
  mock.method(Model, 'findById', async id => { calls.push({ method: 'findById' }); return rows.find(row => row._id === id) || null; });
  mock.method(Model, 'findByIdAndUpdate', async (id, update, options) => {
    calls.push({ method: 'update', options });
    const index = rows.findIndex(row => row._id === id);
    if (index < 0) return null;
    const document = new Model({ ...rows[index], ...update.$set });
    await document.validate(); rows[index] = plain(document); return rows[index];
  });
  mock.method(Model, 'findByIdAndDelete', async id => { const index = rows.findIndex(row => row._id === id); return index < 0 ? null : rows.splice(index, 1)[0]; });
  server = app.listen(0, '127.0.0.1'); await once(server, 'listening'); base = `http://127.0.0.1:${server.address().port}`;
});
beforeEach(t => { rows.length = 0; calls.length = 0; fail = false; t.mock.timers.enable({ apis: ['Date'], now: NOW }); });
after(async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); mock.restoreAll(); });
async function request(path = '', { method = 'GET', body, auth = true } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) headers.Authorization = 'Bearer ' + jwt.sign({ sub: 'password-admin:synthetic-workshop-admin', username: 'synthetic-workshop-admin', role: 'admin', iss: 'pinnawala-gems-admin', aud: 'pinnawala-gems-api' }, SECRET, { expiresIn: '8h' });
  const response = await fetch(base + '/api/workshop' + path, { method, headers, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
  return { status: response.status, body: await response.json(), cache: response.headers.get('cache-control') };
}
async function create(extra = {}) {
  const result = await request('', { method: 'POST', body: { title: 'Synthetic workshop', description: 'Synthetic workshop details', imageUrl: '/gem.png', ...extra } });
  assert.equal(result.status, 201, JSON.stringify(result.body)); return result.body;
}

test('private workshop listing and all writes require verified administrator access', async () => {
  const id = '000000000000000000000001';
  for (const [path, method] of [['/admin', 'GET'], ['', 'POST'], ['/' + id, 'PUT'], ['/' + id, 'DELETE']]) {
    const result = await request(path, { method, auth: false });
    assert.equal(result.status, 401); assert.equal(result.cache, 'no-store');
  }
  assert.equal(calls.length, 0); assert.equal(rows.length, 0);
});

test('public listing retains legacy and published posts but never sends drafts or future schedules', async () => {
  rows.push({ _id: 'legacy', title: 'Legacy', description: 'Legacy story', imageUrl: '/gem.png' });
  await create({ title: 'Published' });
  await create({ title: 'Draft', publicationStatus: 'draft' });
  await create({ title: 'Scheduled', publicationStatus: 'scheduled', publishAt: '2026-11-25T09:01:00Z' });
  const publicResult = await request('?includeDrafts=true&publicationStatus=draft', { auth: false });
  assert.deepEqual(publicResult.body.map(item => item.title), ['Legacy', 'Published']);
  assert.equal(publicResult.cache, 'no-store');
  assert.equal((await request('/admin')).body.length, 4);
  assert.equal((await request('/admin')).cache, 'no-store');
  assert.deepEqual((await request()).body.map(item => item.title), ['Legacy', 'Published'], 'Bearer token cannot turn the public route into an unfiltered admin listing');
});

test('scheduled posts become public exactly at server time without a background write or cron', async t => {
  const post = await create({ publicationStatus: 'scheduled', publishAt: '2026-11-25T14:31:00+05:30' });
  assert.equal(post.publishAt, '2026-11-25T09:01:00.000Z');
  t.mock.timers.setTime(NOW + 59999);
  assert.equal((await request('', { auth: false })).body.length, 0);
  t.mock.timers.setTime(NOW + 60000);
  assert.equal((await request('', { auth: false })).body[0]._id, post._id);
  assert.equal(rows[0].publicationStatus, 'scheduled');
  assert.equal(calls.filter(call => call.method === 'update').length, 0);
});

test('event, venue and independent phone numbers persist and normalize safely', async () => {
  const post = await create({ eventDate: '2026-12-01', eventTime: '10:30', locationName: 'Synthetic Atelier', locationAddress: 'Synthetic Street', locationUrl: 'https://maps.app.goo.gl/example', phoneNumber: '076 925 4499', whatsappNumber: '0094 (77) 830-7334' });
  assert.equal(post.eventDate, '2026-12-01'); assert.equal(post.eventTime, '10:30');
  assert.equal(post.phoneNumber, '+94769254499'); assert.equal(post.whatsappNumber, '+94778307334');
  const changed = await request('/' + post._id, { method: 'PUT', body: { title: 'Changed title', eventTime: '11:15' } });
  assert.equal(changed.status, 200); assert.equal(changed.body.eventDate, '2026-12-01'); assert.equal(changed.body.eventTime, '11:15');
  assert.equal(changed.body.phoneNumber, post.phoneNumber); assert.equal(changed.body.locationUrl, post.locationUrl);
  assert.equal(calls.find(call => call.method === 'update').options.runValidators, true);
});

test('editing an already due schedule preserves its publication time; new past schedules fail', async t => {
  const post = await create({ publicationStatus: 'scheduled', publishAt: '2026-11-25T09:01:00Z' });
  t.mock.timers.setTime(NOW + 120000);
  assert.equal((await request('/' + post._id, { method: 'PUT', body: { description: 'Updated due story', publicationStatus: 'scheduled', publishAt: post.publishAt } })).status, 200);
  assert.equal((await request('/' + post._id, { method: 'PUT', body: { publishAt: '2026-11-25T09:01:01Z' } })).status, 400);
  assert.equal((await request('/' + post._id, { method: 'PUT', body: { publicationStatus: 'published', publishAt: null } })).body.publishAt, null);
});

test('invalid schedule, calendar, URL and contact values never store a post', async () => {
  for (const extra of [
    { publicationStatus: 'unknown' }, { publicationStatus: 'scheduled' },
    { publicationStatus: 'scheduled', publishAt: '2026-11-25T09:00:00Z' },
    { publicationStatus: 'scheduled', publishAt: '2026-11-26T10:00' },
    { publicationStatus: 'scheduled', publishAt: '2026-02-30T10:00:00Z' },
    { eventDate: '2026-02-29' }, { eventTime: '10:00' }, { eventDate: '2026-12-01', eventTime: '24:00' },
    { locationUrl: 'javascript:alert(1)' }, { locationUrl: 'https://owner:password@example.test/' },
    { phoneNumber: '+94++778307334' }, { whatsappNumber: '0778307334?text=bad' }, { imageUrl: 'data:image/png;base64,bad' },
  ]) assert.equal((await request('', { method: 'POST', body: { title: 'Synthetic', description: 'Synthetic', imageUrl: '/gem.png', ...extra } })).status, 400, JSON.stringify(extra));
  assert.equal(rows.length, 0);
});

test('clearing optional fields works and failed edits preserve saved details', async () => {
  const post = await create({ eventDate: '2026-12-01', eventTime: '10:00', phoneNumber: '+94769254499', locationUrl: 'https://example.test/map' });
  assert.equal((await request('/' + post._id, { method: 'PUT', body: { eventDate: '' } })).status, 400);
  assert.equal(rows[0].eventDate, post.eventDate);
  const changed = await request('/' + post._id, { method: 'PUT', body: { eventTime: '', eventDate: '', phoneNumber: '', locationUrl: '' } });
  assert.equal(changed.status, 200); assert.equal(changed.body.eventDate, ''); assert.equal(changed.body.phoneNumber, ''); assert.equal(changed.body.locationUrl, '');
});

test('whitelisted payloads preserve generated IDs and creation dates and return correct 404 errors', async () => {
  const post = await create({ _id: '000000000000000000000001', createdAt: '2000-01-01', admin: true });
  assert.notEqual(post._id, '000000000000000000000001'); assert.equal(post.admin, undefined);
  const changed = await request('/' + post._id, { method: 'PUT', body: { createdAt: '2000-01-01', _id: '000000000000000000000001', title: 'Edited' } });
  assert.equal(changed.body.createdAt, post.createdAt); assert.equal(changed.body._id, post._id);
  assert.equal((await request('/invalid', { method: 'PUT', body: { title: 'Bad id' } })).status, 400);
  assert.equal((await request('/000000000000000000000001', { method: 'DELETE' })).status, 404);
  assert.equal((await request('/' + post._id, { method: 'DELETE' })).status, 200);
});

test('database failures use a generic response instead of disclosing connection details', async () => {
  fail = true;
  const result = await request('', { auth: false });
  assert.equal(result.status, 500); assert.equal(result.cache, 'no-store');
  assert.equal(JSON.stringify(result.body).includes('PRIVATE_DATABASE'), false);
});

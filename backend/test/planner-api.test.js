const assert = require('node:assert/strict');
const { after, before, beforeEach, mock, test } = require('node:test');
const { once } = require('node:events');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// This process never loads .env or connects to a database. Only synthetic records
// and tokens signed with this deliberately public test secret are used.
const TEST_SECRET = 'PLANNER_INTEGRATION_TEST_ONLY_NOT_A_REAL_JWT_SECRET';
process.env.JWT_SECRET = TEST_SECRET;
process.env.NODE_ENV = 'test';
process.env.TZ = 'UTC';
for (const name of ['MONGO_URI', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET', 'GOOGLE_CLIENT_ID', 'ADMIN_USERNAME', 'ADMIN_PASSWORD', 'ADMIN_EMAIL', 'ADMIN_GOOGLE_EMAILS']) delete process.env[name];

let server;
let base;
let appointments;
let notes;
const plain = (value) => JSON.parse(JSON.stringify(value));
const ids = (items) => items.map((item) => item._id);

function matches(row, query) {
  return Object.entries(query).every(([field, condition]) => {
    if (field === '$or') return condition.some((part) => matches(row, part));
    const value = row[field];
    if (condition && typeof condition === 'object' && !(condition instanceof Date)) {
      if ('$regex' in condition) return (Array.isArray(value) ? value : [value]).some((item) => new RegExp(condition.$regex, condition.$options).test(String(item || '')));
      return Object.entries(condition).every(([operator, expected]) => {
        const actual = expected instanceof Date ? new Date(value).getTime() : value;
        const target = expected instanceof Date ? expected.getTime() : expected;
        if (operator === '$gte') return actual >= target;
        if (operator === '$lte') return actual <= target;
        if (operator === '$gt') return actual > target;
        if (operator === '$ne') return actual !== target;
        if (operator === '$nin') return !expected.includes(actual);
        throw new Error(`Unsupported in-memory query operator: ${operator}`);
      });
    }
    return value === condition;
  });
}

function memoryModel(Model) {
  const store = { rows: [], calls: [], failure: null };
  const call = (method, query) => { store.calls.push({ method, query }); if (store.failure === method) throw new Error('Synthetic database failure'); };
  const validate = async (payload) => {
    const document = new Model(payload);
    await document.validate(); // Real Mongoose casting, defaults and validators.
    return plain(document);
  };
  mock.method(Model, 'find', (query) => {
    call('find', query);
    return { sort: async (order) => store.rows.filter((row) => matches(row, query)).sort((left, right) => {
      for (const [field, direction] of Object.entries(order)) {
        if (left[field] < right[field]) return -direction;
        if (left[field] > right[field]) return direction;
      }
      return 0;
    }).map(plain) };
  });
  mock.method(Model, 'create', async (payload) => {
    call('create', payload);
    const item = await validate(payload); store.rows.push(item); return plain(item);
  });
  mock.method(Model, 'findById', async (id) => {
    call('findById', id);
    return plain(store.rows.find((item) => item._id === id) || null);
  });
  mock.method(Model, 'findByIdAndUpdate', async (id, update, options) => {
    call('findByIdAndUpdate', { id, update, options });
    const index = store.rows.findIndex((item) => item._id === id);
    if (index < 0) return null;
    const item = await validate({ ...store.rows[index], ...update.$set });
    store.rows[index] = item; return plain(item);
  });
  mock.method(Model, 'findByIdAndDelete', async (id) => {
    call('findByIdAndDelete', id);
    const index = store.rows.findIndex((item) => item._id === id);
    return index < 0 ? null : store.rows.splice(index, 1)[0];
  });
  return store;
}

before(async () => {
  mock.method(mongoose, 'connect', () => { throw new Error('Database connections are forbidden in these integration tests'); });
  const app = require('../server');
  assert.equal(typeof app.listen, 'function', 'server.js must export its registered Express app without starting a server');
  appointments = memoryModel(require('../models/Appointment'));
  notes = memoryModel(require('../models/AdminNote'));
  assert.equal(mongoose.connection.readyState, 0);
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  base = `http://127.0.0.1:${server.address().port}`;
});

beforeEach(() => {
  for (const store of [appointments, notes]) { store.rows.length = 0; store.calls.length = 0; store.failure = null; }
});

after(async () => {
  if (server) { server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); }
  mock.restoreAll();
  delete process.env.JWT_SECRET;
});

async function request(path, { method = 'GET', body, token = 'valid' } = {}) {
  const headers = { ...(body ? { 'Content-Type': 'application/json' } : {}) };
  if (token) headers.Authorization = `Bearer ${token === 'valid' ? jwt.sign({ sub: 'synthetic-planner-test-admin', role: 'admin', iss: 'pinnawala-gems-admin', aud: 'pinnawala-gems-api' }, TEST_SECRET, { expiresIn: '1h' }) : token}`;
  const response = await fetch(base + path, { method, headers, ...(body ? { body: JSON.stringify(body) } : {}) });
  return { status: response.status, body: await response.json() };
}

async function createAppointment(overrides = {}) {
  const result = await request('/api/appointments', { method: 'POST', body: { customerName: 'Synthetic Customer', date: '2026-11-16', time: '10:00', ...overrides } });
  assert.equal(result.status, 201, JSON.stringify(result.body)); return result.body;
}

async function createNote(overrides = {}) {
  const result = await request('/api/admin-notes', { method: 'POST', body: { title: 'Synthetic note', content: 'Synthetic test details', ...overrides } });
  assert.equal(result.status, 201, JSON.stringify(result.body)); return result.body;
}

test('all real mounted planner routes reject anonymous and invalid JWT requests before touching models', async () => {
  const id = '000000000000000000000001';
  const routes = [['GET', '/api/appointments'], ['GET', `/api/appointments/${id}`], ['POST', '/api/appointments'], ['PUT', `/api/appointments/${id}`], ['DELETE', `/api/appointments/${id}`], ['GET', '/api/admin-notes'], ['POST', '/api/admin-notes'], ['PUT', `/api/admin-notes/${id}`], ['DELETE', `/api/admin-notes/${id}`], ['GET', '/api/planner/notifications']];
  const invalidSignature = jwt.sign({ sub: 'synthetic-invalid-admin' }, 'ANOTHER_PUBLIC_DUMMY_TEST_SECRET');
  for (const token of [null, invalidSignature]) for (const [method, path] of routes) {
    const response = await request(path, { method, token });
    assert.equal(response.status, 401, `${method} ${path}`);
    assert.match(response.body.message, /authentication required|Invalid or expired admin token/);
  }
  assert.equal(appointments.calls.length + notes.calls.length, 0);
});

test('registered appointment and note collections return real authenticated empty lists', async () => {
  assert.deepEqual(await request('/api/appointments?search='), { status: 200, body: [] });
  assert.deepEqual(await request('/api/admin-notes?archived=false'), { status: 200, body: [] });
});

test('appointment create, read, edit, status update and delete preserve fields and schema defaults', async () => {
  const created = await createAppointment({ customerName: '  Synthetic Amara  ', email: '  AMARA@EXAMPLE.TEST ', phone: '+94 77 000 0000', durationMinutes: 45, type: 'Viewing', purpose: 'Synthetic viewing request', internalNotes: 'Synthetic team note' });
  assert.equal(created.customerName, 'Synthetic Amara'); assert.equal(created.email, 'amara@example.test');
  assert.equal(created.status, 'Requested'); assert.equal(created.stoneId, null); assert.equal(created.durationMinutes, 45);
  assert.deepEqual((await request(`/api/appointments/${created._id}`)).body, created);
  const updated = await request(`/api/appointments/${created._id}`, { method: 'PUT', body: { status: 'Confirmed', time: '11:30', internalNotes: 'Updated synthetic note' } });
  assert.equal(updated.status, 200); assert.equal(updated.body.status, 'Confirmed'); assert.equal(updated.body.time, '11:30');
  assert.equal(updated.body.email, created.email); assert.equal(updated.body.purpose, created.purpose); assert.equal(updated.body.internalNotes, 'Updated synthetic note');
  assert.equal(appointments.calls.find((item) => item.method === 'findByIdAndUpdate').query.options.runValidators, true);
  assert.equal((await request(`/api/appointments/${created._id}`, { method: 'PUT', body: { status: 'Completed' } })).body.status, 'Completed');
  assert.equal((await request(`/api/appointments/${created._id}`, { method: 'DELETE' })).status, 200);
  assert.equal((await request(`/api/appointments/${created._id}`)).status, 404);
  assert.equal((await request(`/api/appointments/${created._id}`, { method: 'DELETE' })).status, 404);
});

test('appointment search, status and inclusive date filters use the mounted controller and date/time order', async () => {
  const later = await createAppointment({ customerName: 'Synthetic Amara Later', date: '2026-11-16', time: '14:00', status: 'Confirmed' });
  const earlier = await createAppointment({ customerName: 'Synthetic Amara Earlier', date: '2026-11-16', time: '09:00', status: 'Confirmed' });
  await createAppointment({ customerName: 'Synthetic Amara Requested', date: '2026-11-16', status: 'Requested' });
  await createAppointment({ customerName: 'Synthetic Amara Outside', date: '2026-11-17', status: 'Confirmed' });
  await createAppointment({ customerName: 'Synthetic Other Customer', date: '2026-11-16', status: 'Confirmed' });
  const result = await request('/api/appointments?search=amara&status=Confirmed&from=2026-11-16&to=2026-11-16');
  assert.equal(result.status, 200); assert.deepEqual(ids(result.body), [earlier._id, later._id]);
});

test('actual schema validation rejects missing fields, invalid status and short duration without storing records', async () => {
  for (const body of [{ date: '2026-11-16', time: '10:00' }, { customerName: 'Synthetic', date: '2026-11-16', time: '10:00', status: 'Unknown' }, { customerName: 'Synthetic', date: '2026-11-16', time: '10:00', durationMinutes: 5 }]) assert.equal((await request('/api/appointments', { method: 'POST', body })).status, 400);
  assert.equal((await request('/api/admin-notes', { method: 'POST', body: { title: 'Synthetic without content' } })).status, 400);
  assert.equal(appointments.rows.length + notes.rows.length, 0);
  const item = await createAppointment();
  assert.equal((await request(`/api/appointments/${item._id}`, { method: 'PUT', body: { status: 'Unknown' } })).status, 400);
  assert.equal((await request(`/api/appointments/${item._id}`)).body.status, 'Requested');
});

test('notes preserve appointment links, tags and reminders through edit, pin, archive, restore and delete', async () => {
  const appointment = await createAppointment();
  const created = await createNote({ title: 'Synthetic follow up', category: 'Follow-up', tags: ['ceylon', 'customer'], color: 'amber', reminderAt: '2026-11-16T04:30:00.000Z', customerName: 'Synthetic Customer', appointmentId: appointment._id });
  assert.equal(created.appointmentId, appointment._id); assert.equal(created.reminderAt, '2026-11-16T04:30:00.000Z');
  assert.equal(created.isPinned, false); assert.equal(created.isArchived, false);
  let result = await request(`/api/admin-notes/${created._id}`, { method: 'PUT', body: { content: 'Updated synthetic details', isPinned: true } });
  assert.equal(result.status, 200); assert.equal(result.body.isPinned, true); assert.equal(result.body.appointmentId, appointment._id); assert.deepEqual(result.body.tags, ['ceylon', 'customer']);
  result = await request('/api/admin-notes?search=ceylon&category=Follow-up&archived=false');
  assert.deepEqual(ids(result.body), [created._id]);
  await request(`/api/admin-notes/${created._id}`, { method: 'PUT', body: { isArchived: true } });
  assert.deepEqual((await request('/api/admin-notes?archived=false')).body, []);
  assert.deepEqual(ids((await request('/api/admin-notes?archived=true')).body), [created._id]);
  result = await request(`/api/admin-notes/${created._id}`, { method: 'PUT', body: { isArchived: false, isPinned: false, reminderAt: null, appointmentId: null } });
  assert.equal(result.body.isArchived, false); assert.equal(result.body.isPinned, false); assert.equal(result.body.reminderAt, null); assert.equal(result.body.appointmentId, null);
  assert.equal((await request(`/api/admin-notes/${created._id}`, { method: 'DELETE' })).status, 200);
  assert.equal((await request(`/api/admin-notes/${created._id}`, { method: 'PUT', body: { isPinned: true } })).status, 404);
});

test('notifications use Sri Lanka day boundaries and keep due/upcoming reminder windows inclusive', async (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: new Date('2026-11-15T19:00:00.000Z') });
  const first = await createAppointment({ customerName: 'Synthetic at Colombo day start', date: '2026-11-15T18:30:00.000Z', time: '08:00' });
  const today = await createAppointment({ customerName: 'Synthetic today', date: '2026-11-16T00:00:00.000Z', time: '10:00' });
  const last = await createAppointment({ customerName: 'Synthetic at Colombo day end', date: '2026-11-16T18:29:59.999Z', time: '16:00' });
  await createAppointment({ customerName: 'Synthetic yesterday', date: '2026-11-15T18:29:59.999Z' });
  await createAppointment({ customerName: 'Synthetic tomorrow', date: '2026-11-16T18:30:00.000Z' });
  await createAppointment({ customerName: 'Synthetic cancelled', status: 'Cancelled' });
  await createAppointment({ customerName: 'Synthetic no show', status: 'No-show' });
  const overdue = await createNote({ title: 'Synthetic overdue', reminderAt: '2026-11-14T00:00:00.000Z' });
  const dueStart = await createNote({ title: 'Synthetic reminder at day start', reminderAt: '2026-11-15T18:30:00.000Z' });
  const dueEnd = await createNote({ title: 'Synthetic reminder at day end', reminderAt: '2026-11-16T18:29:59.999Z' });
  const next = await createNote({ title: 'Synthetic next day', reminderAt: '2026-11-16T18:30:00.000Z' });
  const horizon = await createNote({ title: 'Synthetic horizon', reminderAt: '2026-11-23T18:29:59.999Z' });
  await createNote({ title: 'Synthetic beyond horizon', reminderAt: '2026-11-23T18:30:00.000Z' });
  await createNote({ title: 'Synthetic archived reminder', reminderAt: '2026-11-15T18:30:00.000Z', isArchived: true });
  await createNote({ title: 'Synthetic without reminder' });
  const result = await request('/api/planner/notifications');
  assert.equal(result.status, 200);
  assert.deepEqual(ids(result.body.todayAppointments), [first._id, today._id, last._id]);
  assert.deepEqual(ids(result.body.dueNotes), [overdue._id, dueStart._id, dueEnd._id]);
  assert.deepEqual(ids(result.body.upcomingNotes), [next._id, horizon._id]);
  assert.deepEqual(result.body.counts, { todayAppointments: 3, dueNotes: 3, upcomingNotes: 2 });
  const query = appointments.calls.filter((item) => item.method === 'find').at(-1).query;
  assert.equal(query.date.$gte.toISOString(), '2026-11-15T18:30:00.000Z');
  assert.equal(query.date.$lte.toISOString(), '2026-11-16T18:29:59.999Z');
});

test('today changes at Sri Lanka midnight even while the UTC calendar date is unchanged', async (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: new Date('2026-11-15T18:29:59.999Z') });
  const previousDay = await createAppointment({ date: '2026-11-15' });
  const newDay = await createAppointment({ date: '2026-11-16' });
  assert.deepEqual(ids((await request('/api/planner/notifications')).body.todayAppointments), [previousDay._id]);
  t.mock.timers.setTime(new Date('2026-11-15T18:30:00.000Z').getTime());
  assert.deepEqual(ids((await request('/api/planner/notifications')).body.todayAppointments), [newDay._id]);
});

test('controller failures return JSON errors rather than being mistaken for missing routes', async () => {
  appointments.failure = 'find';
  const appointmentResult = await request('/api/appointments');
  assert.equal(appointmentResult.status, 500); assert.equal(appointmentResult.body.message, 'Synthetic database failure');
  appointments.failure = null; notes.failure = 'find';
  assert.equal((await request('/api/admin-notes')).status, 500);
  const notifications = await request('/api/planner/notifications');
  assert.equal(notifications.status, 500); assert.equal(notifications.body.message, 'Synthetic database failure');
});

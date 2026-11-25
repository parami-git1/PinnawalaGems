const assert = require('node:assert/strict');
const { before, beforeEach, after, mock, test } = require('node:test');
const { once } = require('node:events');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;

const SECRET = 'BULK_GEMS_TEST_ONLY_NOT_A_REAL_SECRET';
const OWNER = 'password-admin:synthetic-bulk-admin';
const CATEGORY = '000000000000000000000071';
const FIRST = '0000000000000000000000a1';
const SECOND = '0000000000000000000000a2';
const THIRD = '0000000000000000000000a3';
const IMAGE = 'https://media.example.test/synthetic-sapphire.jpg';
process.env.JWT_SECRET = SECRET;
process.env.NODE_ENV = 'test';
process.env.ADMIN_USERNAME = 'synthetic-bulk-admin';
process.env.ADMIN_PASSWORD = 'SYNTHETIC_BULK_PASSWORD';
for (const name of ['MONGO_URI', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET', 'GOOGLE_CLIENT_ID', 'ADMIN_AUTH_MODE', 'ADMIN_GOOGLE_EMAIL', 'ADMIN_GOOGLE_EMAILS', 'ADMIN_EMAIL']) delete process.env[name];
const Stone = require('../models/Stone');
const StockStone = require('../models/StockStone');
const { parseIds } = require('../utils/bulkGems');
let server, base, rows, stockRows, writes, queries, pipelines, failOnce, beforeAtomic, clock;
const plain = value => value == null ? value : JSON.parse(JSON.stringify(value));
const record = (id = FIRST, extra = {}) => ({ _id: id, stoneId: `blue-sapphire-${id}`, title: 'Synthetic blue sapphire', categoryId: CATEGORY, image: IMAGE, additionalImages: ['https://media.example.test/detail.jpg'], videos: [{ url: 'https://media.example.test/video.mp4' }], certificateImage: 'https://media.example.test/certificate.jpg', quantity: 3, includedInStock: true, isTopGem: true, isFeatured: true, weight: '2.45 ct', color: 'Blue', shape: 'Oval', origin: 'Sri Lanka', __v: 0, updatedAt: '2026-01-01T00:00:00.000Z', ...extra });
const store = Model => Model === Stone ? rows : stockRows;
function equal(actual, wanted) {
  if (wanted === null) return actual == null;
  if (wanted instanceof Date) return new Date(actual).getTime() === wanted.getTime();
  if (wanted && typeof wanted === 'object' && wanted._bsontype === 'ObjectId') return String(actual) === String(wanted);
  return actual === wanted;
}
function matches(row, query) {
  return Object.entries(query).every(([key, value]) => {
    if (key === '$or') return value.some(condition => matches(row, condition));
    const actual = key === '__caratWeight' ? Number.parseFloat(row.weight) : row[key];
    if (value && typeof value === 'object' && !(value instanceof Date) && !value._bsontype) {
      if ('$exists' in value) return Object.hasOwn(row, key) === value.$exists;
      if ('$in' in value) return value.$in.some(entry => equal(actual, entry));
      if ('$regex' in value) return new RegExp(value.$regex, value.$options).test(actual || '');
      return (!('$gte' in value) || actual >= value.$gte) && (!('$lte' in value) || actual <= value.$lte);
    }
    return equal(actual, value);
  });
}
function query(read) {
  let offset = 0, maximum = Infinity;
  const result = {
    lean() { return this; }, sort() { return this; },
    skip(value) { offset = value; return this; }, limit(value) { maximum = value; return this; },
    maxTimeMS(value) { assert.equal(value, 5000); return this; },
    option(value) { assert.equal(value.maxTimeMS, 5000); return this; },
    then(resolve, reject) { return Promise.resolve().then(read).then(value => plain(Array.isArray(value) ? value.slice(offset, offset + maximum) : value)).then(resolve, reject); },
  };
  return result;
}
function mutate(row, fields = {}) { Object.assign(row, fields, { __v: (row.__v || 0) + 1, updatedAt: new Date(++clock).toISOString() }); }
function installModel(Model) {
  mock.method(Model, 'find', filter => { queries.push({ model: Model.modelName, filter }); return query(() => store(Model).filter(row => matches(row, filter || {}))); });
  mock.method(Model, 'countDocuments', filter => query(() => store(Model).filter(row => matches(row, filter)).length));
  mock.method(Model, 'findById', id => query(() => store(Model).find(row => row._id === String(id)) || null));
  mock.method(Model, 'findOneAndUpdate', (filter, update, options) => query(() => {
    assert.equal(options.new, true); assert.equal(options.runValidators, true);
    const id = String(filter._id);
    if (failOnce.delete(id)) throw new Error('Synthetic transient database failure');
    if (beforeAtomic) { const hook = beforeAtomic; beforeAtomic = null; hook(); }
    const row = store(Model).find(entry => matches(entry, filter));
    if (!row) return null;
    writes.push({ model: Model.modelName, id, filter, update });
    mutate(row, update.$set); return row;
  }));
  mock.method(Model, 'findByIdAndUpdate', (id, update) => query(() => {
    const row = store(Model).find(entry => entry._id === String(id));
    if (!row) return null;
    assert.deepEqual(update.$inc, { __v: 1 }); mutate(row, update.$set); return row;
  }));
  mock.method(Model, 'findByIdAndDelete', () => { throw new Error('Bulk actions must never delete records.'); });
  mock.method(Model, 'deleteMany', () => { throw new Error('Bulk actions must never delete records.'); });
}
before(async () => {
  mock.method(mongoose, 'connect', () => { throw new Error('Real database connections are forbidden.'); });
  mock.method(cloudinary.uploader, 'destroy', () => { throw new Error('Bulk actions must never delete assets.'); });
  installModel(Stone); installModel(StockStone);
  mock.method(Stone, 'aggregate', pipeline => {
    pipelines.push(pipeline);
    return query(() => {
      const active = pipeline[0]?.$match ? rows.filter(row => matches(row, pipeline[0].$match)) : rows;
      const facets = pipeline.find(stage => stage.$facet)?.$facet;
      if (!facets) return [];
      if (!facets.stones) return [{ totals: [{ totalStones: active.length, totalQuantity: active.reduce((sum, row) => sum + row.quantity, 0) }], weights: [], byColor: [], byCategory: [] }];
      const filtered = active.filter(row => matches(row, facets.stones[0].$match));
      return [{ stones: filtered, metadata: [{ total: filtered.length }], categoryCounts: active.length ? [{ _id: CATEGORY, count: active.length }] : [], filterOptions: [{ shapes: [...new Set(active.map(row => row.shape))], colors: [...new Set(active.map(row => row.color))], origins: [], cuts: [] }] }];
    });
  });
  server = require('../server').listen(0, '127.0.0.1'); await once(server, 'listening'); base = `http://127.0.0.1:${server.address().port}`;
});
beforeEach(() => { rows = [record()]; stockRows = [record(FIRST, { stoneId: `private-sapphire-stock-${FIRST}` })]; writes = []; queries = []; pipelines = []; failOnce = new Set(); beforeAtomic = null; clock = Date.parse('2026-01-02'); });
after(async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); mock.restoreAll(); });
async function api(path, { body, method = body ? 'POST' : 'GET', anonymous = false, token } = {}) {
  const authorization = token || jwt.sign({ sub: OWNER, username: 'synthetic-bulk-admin', role: 'admin', iss: 'pinnawala-gems-admin', aud: 'pinnawala-gems-api' }, SECRET, { expiresIn: '8h' });
  const response = await fetch(base + path, { method, headers: { ...(!anonymous ? { Authorization: `Bearer ${authorization}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  return { status: response.status, body: await response.json(), cache: response.headers.get('Cache-Control') };
}
const action = (name, body, options) => api(`/api/admin/bulk-gems/${name}`, { body: { scope: 'catalog', ...body }, ...options });
const preview = (ids = [rows[0].stoneId], scope = 'catalog') => action('preview', { scope, ids });
const remove = (reviewToken, scope = 'catalog') => action('remove', { scope, reviewToken });
const restore = (restoreToken, scope = 'catalog') => action('restore', { scope, restoreToken });

test('all bulk actions and archived admin reads require a verified administrator before touching models', async () => {
  for (const name of ['preview', 'remove', 'restore']) {
    assert.equal((await action(name, { ids: [FIRST] }, { anonymous: true })).status, 401);
    const token = jwt.sign({ sub: OWNER, role: 'customer' }, SECRET, { expiresIn: '1h' });
    assert.equal((await action(name, { ids: [FIRST] }, { token })).status, 403);
  }
  assert.equal((await api('/api/inventory/admin/stones?includeArchived=true', { anonymous: true })).status, 401);
  assert.equal(queries.length, 0); assert.equal(writes.length, 0);
});

test('ID parsing is bounded, exact and literal; duplicate references and Mongo IDs are reviewed once', async () => {
  const result = await preview(`${rows[0].stoneId}, ${FIRST.toUpperCase()};\n${rows[0].stoneId}`);
  assert.equal(result.status, 200); assert.equal(result.body.matched.length, 1); assert.equal(result.body.canRemove, true);
  assert.deepEqual(result.body.duplicateIds.sort(), [FIRST, rows[0].stoneId].sort()); assert.equal(result.cache, 'no-store');
  assert.deepEqual((await preview(rows[0].stoneId.toUpperCase())).body.unknownIds, [rows[0].stoneId.toUpperCase()]);
  assert.deepEqual((await preview('(a+)+$')).body.unknownIds, ['(a+)+$']);
  assert.throws(() => parseIds({ $ne: null })); assert.throws(() => parseIds(['valid', {}]));
  assert.throws(() => parseIds('x'.repeat(161))); assert.throws(() => parseIds('a\u0000b'));
  assert.throws(() => parseIds(Array.from({ length: 101 }, (_, index) => `id-${index}`)));
  assert.equal((await preview([], 'other')).status, 400); assert.equal((await preview([])).status, 400);
  assert.equal(writes.length, 0);
});

test('unknown or ambiguous IDs block the entire review without issuing either action token', async () => {
  rows.push(record(SECOND, { stoneId: rows[0].stoneId }));
  const result = await preview([rows[0].stoneId, 'missing-reference']);
  assert.equal(result.status, 200); assert.deepEqual(result.body.ambiguousIds, [rows[0].stoneId]); assert.deepEqual(result.body.unknownIds, ['missing-reference']);
  assert.equal(result.body.canRemove, false); assert.equal(result.body.reviewToken, null); assert.equal(result.body.restoreToken, null); assert.equal(writes.length, 0);
  const collision = await preview(FIRST);
  assert.equal(collision.body.matched.length, 1, 'An unambiguous exact database ID remains usable.');
  rows.push(record(THIRD, { stoneId: FIRST }));
  assert.deepEqual((await preview(FIRST)).body.ambiguousIds, [FIRST], 'A reference colliding with a different database ID is never guessed.');
});

test('sold removal preserves every asset, quantity and flag, hides public records, and restores the reviewed batch', async () => {
  const original = plain(rows[0]); rows.push(record(SECOND, { shape: 'Round', color: 'Yellow' }));
  const reviewed = await preview(original.stoneId); const removed = await remove(reviewed.body.reviewToken);
  assert.equal(removed.status, 200); assert.equal(removed.body.removed.length, 1); assert.ok(removed.body.restoreToken); assert.equal(rows.length, 2);
  for (const key of ['quantity', 'includedInStock', 'image', 'additionalImages', 'videos', 'certificateImage', 'isTopGem', 'isFeatured', 'stoneId']) assert.deepEqual(rows[0][key], original[key], key);
  assert.equal(rows[0].archivedReason, 'sold'); assert.ok(rows[0].archivedAt);
  assert.equal((await api(`/api/inventory/stones/${FIRST}`, { anonymous: true })).status, 404);
  for (const path of ['/api/inventory/stones?includeArchived=true', `/api/inventory/categories/${CATEGORY}/stones?includeArchived=true`]) {
    const catalog = await api(path, { anonymous: true }); assert.equal(catalog.body.total, 1); assert.deepEqual(catalog.body.stones.map(row => row._id), [SECOND]);
    assert.deepEqual(catalog.body.categoryCounts, [{ categoryId: CATEGORY, count: 1 }]); assert.deepEqual(catalog.body.filterOptions.shapes, ['Round']);
  }
  assert.deepEqual((await api('/api/inventory/top-gems', { anonymous: true })).body.map(row => row._id), [SECOND]);
  assert.equal((await api('/api/inventory/admin/stones')).body.total, 1);
  assert.equal((await api('/api/inventory/admin/stones?includeArchived=true')).body.total, 2);
  assert.equal((await api('/api/inventory/admin/stones?includeArchived=1')).status, 400);
  const statistics = await api('/api/analytics/dashboard-stats'); assert.equal(statistics.body.totalStones, 1);
  assert.deepEqual(pipelines.at(-1)[0], { $match: { archivedAt: null } }); assert.deepEqual(pipelines.at(-2)[0], { $match: { archivedAt: null } });
  const undone = await restore(removed.body.restoreToken); assert.equal(undone.body.restored.length, 1); assert.equal(rows[0].archivedAt, null);
  assert.equal((await api(`/api/inventory/stones/${FIRST}`, { anonymous: true })).status, 200);
  assert.equal((await restore(removed.body.restoreToken)).body.alreadyRestored.length, 1);
  assert.equal(cloudinary.uploader.destroy.mock.calls.length, 0);
});

test('private-stock scope archives only private stock and active stock totals exclude it', async () => {
  const reviewed = await preview(stockRows[0].stoneId, 'stock');
  assert.equal((await remove(reviewed.body.reviewToken, 'catalog')).status, 400);
  const removed = await remove(reviewed.body.reviewToken, 'stock'); assert.equal(removed.body.removed.length, 1);
  assert.equal(rows[0].archivedAt, undefined); assert.equal(stockRows[0].quantity, 3);
  assert.equal((await api('/api/stock/stones')).body.total, 0); assert.equal((await api('/api/stock/stones?includeArchived=true')).body.total, 1);
  assert.equal((await api('/api/stock/stones?includeArchived=invalid')).status, 400);
  assert.equal((await restore(removed.body.restoreToken, 'stock')).body.restored.length, 1); assert.equal(stockRows[0].quantity, 3);
});

test('changes after preview and between read and write both prevent stale removal', async () => {
  let reviewed = await preview(); mutate(rows[0], { title: 'Updated after preview' });
  let result = await remove(reviewed.body.reviewToken); assert.equal(result.body.changed.length, 1); assert.equal(writes.length, 0); assert.equal(rows[0].archivedAt, undefined);
  reviewed = await preview(); beforeAtomic = () => mutate(rows[0], { quantity: 2 });
  result = await remove(reviewed.body.reviewToken); assert.equal(result.body.changed.length, 1); assert.equal(writes.length, 0); assert.equal(rows[0].quantity, 2); assert.equal(rows[0].archivedAt, undefined);
});

test('partial transient failure is explicit and retrying the same review is idempotent with complete undo', async () => {
  rows.push(record(SECOND)); const reviewed = await preview(rows.map(row => row.stoneId)); failOnce.add(SECOND);
  const partial = await remove(reviewed.body.reviewToken);
  assert.deepEqual(partial.body.removed.map(row => row._id), [FIRST]); assert.deepEqual(partial.body.failed.map(row => row._id), [SECOND]); assert.ok(partial.body.restoreToken);
  const retried = await remove(reviewed.body.reviewToken);
  assert.deepEqual(retried.body.alreadyRemoved.map(row => row._id), [FIRST]); assert.deepEqual(retried.body.removed.map(row => row._id), [SECOND]); assert.equal(retried.body.failed.length, 0);
  assert.equal(rows[0].__v, 1); assert.equal(rows[1].__v, 1); assert.equal(writes.length, 2);
  const undone = await restore(retried.body.restoreToken); assert.equal(undone.body.restored.length, 2); assert.equal(rows.every(row => row.archivedAt === null), true);
});

test('fresh preview recovers undo after a lost response and rejects incomplete recovery reviews', async () => {
  const reviewed = await preview(); await remove(reviewed.body.reviewToken);
  let recovery = await preview(); assert.equal(recovery.body.canRemove, false); assert.equal(recovery.body.canRestore, true); assert.equal(recovery.body.alreadyRemoved.length, 1);
  assert.equal((await preview([FIRST, 'missing'])).body.restoreToken, null);
  mutate(rows[0], { title: 'Intentionally edited while removed' });
  assert.equal((await restore(recovery.body.restoreToken)).body.changed.length, 1);
  recovery = await preview(); assert.equal((await restore(recovery.body.restoreToken)).body.restored.length, 1); assert.equal(rows[0].title, 'Intentionally edited while removed');
});

test('undo cannot overwrite later edits, a different removal batch or a concurrent update', async () => {
  let reviewed = await preview(); let removed = await remove(reviewed.body.reviewToken);
  mutate(rows[0], { quantity: 9 }); let result = await restore(removed.body.restoreToken);
  assert.equal(result.body.changed.length, 1); assert.equal(rows[0].quantity, 9); assert.ok(rows[0].archivedAt);
  const currentReview = await preview(); beforeAtomic = () => mutate(rows[0], { title: 'Concurrent edit' });
  result = await restore(currentReview.body.restoreToken); assert.equal(result.body.changed.length, 1); assert.ok(rows[0].archivedAt);
  assert.equal((await restore((await preview()).body.restoreToken)).body.restored.length, 1);
  reviewed = await preview(); removed = await remove(reviewed.body.reviewToken); const oldUndo = removed.body.restoreToken;
  await restore(oldUndo); reviewed = await preview(); await remove(reviewed.body.reviewToken);
  assert.equal((await restore(oldUndo)).body.changed.length, 1); assert.ok(rows[0].archivedAt);
});

test('tokens cannot cross admin purpose, scope, identity, expiration or payload validation', async () => {
  const reviewed = await preview(); const token = reviewed.body.reviewToken; const payload = jwt.decode(token);
  assert.equal((await remove(token.slice(0, -5) + 'xxxxx')).status, 400);
  assert.equal((await restore(token)).status, 400); assert.equal((await remove(token, 'stock')).status, 400);
  assert.equal((await action('preview', { ids: FIRST }, { token })).status, 403, 'An action token has no administrator role.');
  const forge = fields => { const changed = { ...payload, ...fields }; return jwt.sign(changed, SECRET); };
  assert.equal((await remove(forge({ sub: 'different-admin' }))).status, 400);
  assert.equal((await remove(forge({ exp: Math.floor(Date.now() / 1000) - 1 }))).status, 400);
  assert.equal((await remove(forge({ entries: [{ ...payload.entries[0], version: -1 }] }))).status, 400);
  assert.equal((await remove(forge({ batchId: 'invalid' }))).status, 400);
  assert.equal(writes.length, 0);
});

test('legacy records without archive or version fields remain removable and safely restorable', async () => {
  delete rows[0].__v; delete rows[0].updatedAt;
  const reviewed = await preview(); const removed = await remove(reviewed.body.reviewToken);
  assert.equal(removed.body.removed.length, 1); assert.equal(rows[0].__v, 1);
  assert.equal((await remove(reviewed.body.reviewToken)).body.alreadyRemoved.length, 1);
  assert.equal((await restore(removed.body.restoreToken)).body.restored.length, 1);
});

test('ordinary catalog, featured and private-stock edits advance review versions and cannot edit archive controls', async () => {
  const reviewed = await preview();
  assert.equal((await api(`/api/inventory/stones/${FIRST}`, { method: 'PUT', body: { title: 'Updated through admin form', archivedAt: '2026-01-01', archiveBatchId: 'forged', archivedReason: 'sold' } })).status, 200);
  assert.equal(rows[0].__v, 1); assert.equal(rows[0].archivedAt, undefined); assert.equal((await remove(reviewed.body.reviewToken)).body.changed.length, 1);
  assert.equal((await api(`/api/inventory/stones/${FIRST}/feature`, { method: 'PUT', body: {} })).status, 200); assert.equal(rows[0].__v, 2);
  assert.equal((await api(`/api/stock/stones/${FIRST}`, { method: 'PUT', body: { title: 'Updated private stone', archivedAt: '2026-01-01' } })).status, 200); assert.equal(stockRows[0].__v, 1); assert.equal(stockRows[0].archivedAt, undefined);
});

const assert = require('node:assert/strict');
const { before, beforeEach, after, mock, test } = require('node:test');
const { once } = require('node:events');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;

const SECRET = 'CATALOG_DATA_TEST_ONLY_NOT_A_REAL_SECRET';
const CATEGORY = '000000000000000000000071';
const IMAGE = 'https://media.example.test/cover.jpg';
process.env.JWT_SECRET = SECRET;
process.env.NODE_ENV = 'test';
process.env.ADMIN_USERNAME = 'synthetic-catalog-admin';
process.env.ADMIN_PASSWORD = 'SYNTHETIC_CATALOG_PASSWORD';
for (const name of ['MONGO_URI','CLOUDINARY_CLOUD_NAME','CLOUDINARY_API_KEY','CLOUDINARY_API_SECRET','GOOGLE_CLIENT_ID', 'ADMIN_AUTH_MODE', 'ADMIN_GOOGLE_EMAIL', 'ADMIN_GOOGLE_EMAILS', 'ADMIN_EMAIL']) delete process.env[name];
const Stone = require('../models/Stone');
const Category = require('../models/GemCategory');
const StockStone = require('../models/StockStone');
const StockCategory = require('../models/StockCategory');
const HomeData = require('../models/HomeData');
const ContactData = require('../models/ContactData');
const { SINGLETON_ID } = require('../utils/singletonContent');
const { escapeRegex, carats } = require('../utils/catalogData');
const { cloudinaryAsset } = require('../utils/assetCleanup');
let server, base, rows = [], stockRows = [], pipelines = [], updates = [], singletonWrites = [], canonical = {}, aggregateResult;
const plain = (value) => JSON.parse(JSON.stringify(value));

async function api(route, { method = 'GET', body, anonymous = false } = {}) {
  const response = await fetch(base + route, { method, headers: { ...(!anonymous ? { Authorization: `Bearer ${jwt.sign({ sub: 'password-admin:synthetic-catalog-admin', username: 'synthetic-catalog-admin', role: 'admin', iss: 'pinnawala-gems-admin', aud: 'pinnawala-gems-api' }, SECRET, { expiresIn: '1h' })}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  return { status: response.status, body: await response.json() };
}
const create = (body = {}) => api('/api/inventory/stones', { method: 'POST', body: { title: 'Synthetic sapphire', image: IMAGE, categoryId: CATEGORY, ...body } });
const createStock = (body = {}) => api('/api/stock/stones', { method: 'POST', body: { title: 'Synthetic private sapphire', image: IMAGE, categoryId: CATEGORY, ...body } });

before(async () => {
  mock.method(mongoose, 'connect', () => { throw new Error('Real database connections are forbidden.'); });
  mock.method(Category, 'findById', async () => ({ _id: CATEGORY, title: 'Blue Sapphire' }));
  mock.method(StockCategory, 'findById', async () => ({ _id: CATEGORY, title: 'Private Sapphire' }));
  mock.method(StockStone.prototype, 'save', async function save() { await this.validate(); stockRows.push(plain(this)); return this; });
  mock.method(StockStone, 'findById', async (id) => plain(stockRows.find((row) => row._id === String(id)) || null));
  mock.method(StockStone, 'findByIdAndUpdate', async (id, update, options) => {
    assert.equal(options.runValidators, true);
    const index = stockRows.findIndex((row) => row._id === String(id));
    if (index < 0) return null;
    const document = new StockStone({ ...stockRows[index], ...update.$set });
    await document.validate(); stockRows[index] = plain(document); return plain(document);
  });
  mock.method(Stone.prototype, 'save', async function save() { await this.validate(); const value = plain(this); rows.push(value); return this; });
  mock.method(Stone, 'findById', async (id) => plain(rows.find((row) => row._id === String(id)) || null));
  mock.method(Stone, 'findByIdAndUpdate', async (id, update, options) => {
    updates.push({ update, options });
    const index = rows.findIndex((row) => row._id === String(id));
    if (index < 0) return null;
    const document = new Stone({ ...rows[index], ...update.$set });
    await document.validate(); rows[index] = plain(document); return plain(document);
  });
  mock.method(Stone, 'findByIdAndDelete', async (id) => { const index = rows.findIndex((row) => row._id === String(id)); if (index < 0) return null; return rows.splice(index, 1)[0]; });
  mock.method(Stone, 'aggregate', (pipeline) => { pipelines.push(pipeline); return { option: async (options) => { assert.equal(options.maxTimeMS, 5000); return aggregateResult; } }; });
  mock.method(cloudinary.uploader, 'destroy', async () => ({ result: 'ok' }));
  for (const Model of [HomeData, ContactData]) {
    mock.method(Model, 'findById', async (id) => canonical[Model.modelName] || null);
    mock.method(Model, 'findOne', () => ({ sort: async () => null }));
    mock.method(Model, 'create', () => { throw new Error('A public GET must never create content.'); });
    mock.method(Model, 'findOneAndUpdate', async (filter, update, options) => {
      singletonWrites.push({ model: Model.modelName, filter, update, options });
      const value = { ...plain(new Model({ _id: SINGLETON_ID })), ...(canonical[Model.modelName] || update.$setOnInsert), ...update.$set };
      canonical[Model.modelName] = value; return value;
    });
  }
  const app = require('../server'); server = app.listen(0, '127.0.0.1'); await once(server, 'listening'); base = `http://127.0.0.1:${server.address().port}`;
});
beforeEach(() => { rows = []; stockRows = []; pipelines = []; updates = []; singletonWrites = []; canonical = {}; aggregateResult = [{ stones: [], metadata: [], categoryCounts: [], filterOptions: [] }]; });
after(async () => { server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); mock.restoreAll(); });

test('stock categories, global stock and category stock reads reject anonymous callers', async () => {
  for (const route of ['/api/stock/categories','/api/stock/stones',`/api/stock/categories/${CATEGORY}/stones`]) assert.equal((await api(route, { anonymous: true })).status, 401);
});

test('quantity zero is preserved and numeric carats normalize display strings', async () => {
  const result = await create({ quantity: 0, weight: '10.25 ct', price: 0 });
  assert.equal(result.status, 201, JSON.stringify(result));
  assert.equal(result.body.quantity, 0); assert.equal(result.body.caratWeight, 10.25); assert.equal(result.body.weight, '10.25 ct'); assert.equal(result.body.price, 0);
});

test('stock inclusion defaults preserve existing meaning and false remains explicit on catalog edits', async () => {
  const created = await create({ stockStatus: 'Reserved', treatment: 'Heated' });
  assert.equal(created.status, 201); assert.equal(created.body.includedInStock, true);
  assert.equal(Object.hasOwn(created.body, 'stockStatus'), false, 'Private reservation data is not a public catalog field');
  assert.equal(Object.hasOwn(created.body, 'treatment'), false);
  const excluded = await api(`/api/inventory/stones/${created.body._id}`, { method: 'PUT', body: { includedInStock: false, quantity: 0, price: 0 } });
  assert.equal(excluded.status, 200); assert.equal(excluded.body.includedInStock, false);
  assert.equal(excluded.body.quantity, 0); assert.equal(excluded.body.price, 0);
  const edited = await api(`/api/inventory/stones/${created.body._id}`, { method: 'PUT', body: { title: 'Still excluded from stock' } });
  assert.equal(edited.body.includedInStock, false, 'Unrelated edits must not include an excluded record again');
  const publicRead = await api(`/api/inventory/stones/${created.body._id}`, { anonymous: true });
  assert.equal(publicRead.status, 200, 'Stock inclusion must never hide a website gemstone');
  for (const includedInStock of ['true', 'false', 1, 0, null, {}]) {
    assert.equal((await api(`/api/inventory/stones/${created.body._id}`, { method: 'PUT', body: { includedInStock } })).status, 400);
  }
  assert.equal(rows[0].includedInStock, false);
});

test('private stock accepts useful details without accepting customer-supplied generated IDs', async () => {
  const created = await createStock({ stoneId: 'client-supplied-id', weight: '2.45 ct', quantity: 0, price: 0, includedInStock: false, stockStatus: ' Reserved ', treatment: ' Unheated ', cut: ' Mixed cut ', origin: ' Sri Lanka ', hasCertificate: true, certificateImage: IMAGE, certificateDetails: 'Synthetic certificate details' });
  assert.equal(created.status, 201, JSON.stringify(created));
  assert.equal(created.body.stoneId, `private-sapphire-stock-${created.body._id}`);
  assert.equal(created.body.weight, 2.45); assert.equal(created.body.quantity, 0); assert.equal(created.body.price, 0);
  assert.equal(created.body.includedInStock, false); assert.equal(created.body.stockStatus, 'Reserved'); assert.equal(created.body.treatment, 'Unheated');
  assert.equal(created.body.cut, 'Mixed cut'); assert.equal(created.body.origin, 'Sri Lanka'); assert.equal(created.body.certificateDetails, 'Synthetic certificate details');
  const updated = await api(`/api/stock/stones/${created.body._id}`, { method: 'PUT', body: { title: 'Updated private stone' } });
  assert.equal(updated.status, 200); assert.equal(updated.body.stockStatus, 'Reserved'); assert.equal(updated.body.includedInStock, false);
  assert.equal(updated.body.cut, 'Mixed cut'); assert.equal(updated.body.certificateImage, IMAGE); assert.equal(updated.body.stoneId, created.body.stoneId);
  assert.equal((await api(`/api/stock/stones/${created.body._id}`, { method: 'PUT', body: { stoneId: 'a-new-id' } })).status, 400);
});

test('private stock details have backward-compatible defaults and strict validation before saving', async () => {
  const created = await createStock();
  assert.equal(created.status, 201); assert.equal(created.body.includedInStock, true); assert.equal(created.body.stockStatus, 'Available'); assert.equal(created.body.treatment, 'Unspecified');
  assert.equal(created.body.cut, ''); assert.equal(created.body.origin, '');
  const invalid = [{ includedInStock: 'false' }, { stockStatus: 'Unknown' }, { stockStatus: '' }, { treatment: 'Natural' }, { treatment: [] }, { cut: 'x'.repeat(201) }, { origin: 12 }, { certificateDetails: 'x'.repeat(10001) }, { certificateImage: 'javascript:alert(1)' }];
  for (const body of invalid) assert.equal((await api(`/api/stock/stones/${created.body._id}`, { method: 'PUT', body })).status, 400, JSON.stringify(body));
  for (const body of [{ stockStatus: 'Unknown' }, { includedInStock: 'false' }, { treatment: 'Natural' }]) assert.equal((await createStock(body)).status, 400);
  assert.equal(stockRows.length, 1); assert.equal(stockRows[0].stockStatus, 'Available'); assert.equal(stockRows[0].includedInStock, true);
  await assert.rejects(new StockStone({ categoryId: CATEGORY, title: 'Synthetic invalid model', image: IMAGE, stockStatus: 'Invalid' }).validate());
  await assert.rejects(new StockStone({ categoryId: CATEGORY, title: 'Synthetic invalid treatment', image: IMAGE, treatment: 'Invalid' }).validate());
});

test('inventory creation and editing reject invalid title, quantity, price, weight and category input', async () => {
  for (const body of [{ title: '   ' }, { quantity: -1 }, { quantity: 1.5 }, { price: -1 }, { weight: 'blue' }, { weight: '-2 ct' }, { categoryId: 'not-an-id' }]) assert.equal((await create(body)).status, 400);
  assert.equal(rows.length, 0);
  const created = await create();
  for (const body of [{ title: '' }, { quantity: -2 }, { quantity: 0.5 }, { price: -10 }, { weight: 'NaN' }]) assert.equal((await api(`/api/inventory/stones/${created.body._id}`, { method: 'PUT', body })).status, 400);
  assert.equal(rows[0].title, 'Synthetic sapphire');
});

test('concurrent creates use different references without querying a last-sequence snapshot', async () => {
  const results = await Promise.all([create(), create()]);
  assert.equal(results[0].status, 201); assert.equal(results[1].status, 201);
  assert.notEqual(results[0].body.stoneId, results[1].body.stoneId);
  for (const item of results) assert.equal(item.body.stoneId, `blue-sapphire-${item.body._id}`);
});

test('updates allowlist editable data, enable validators and preserve immutable references', async () => {
  const created = await create();
  const changed = await api(`/api/inventory/stones/${created.body._id}`, { method: 'PUT', body: { title: 'Edited sapphire', quantity: 0, weight: '2.5 carats', unexpectedField: 'ignored', _id: CATEGORY } });
  assert.equal(changed.status, 200); assert.equal(changed.body.quantity, 0); assert.equal(changed.body.caratWeight, 2.5);
  assert.equal(updates[0].options.runValidators, true); assert.equal(Object.hasOwn(updates[0].update.$set, '_id'), false); assert.equal(Object.hasOwn(updates[0].update.$set, 'unexpectedField'), false);
  const reference = await api(`/api/inventory/stones/${created.body._id}`, { method: 'PUT', body: { stoneId: 'duplicate-reference' } });
  assert.equal(reference.status, 400); assert.equal(rows[0].stoneId, created.body.stoneId);
});

test('missing feature/edit records return 404 and malformed object IDs return 400', async () => {
  assert.equal((await api(`/api/inventory/stones/${CATEGORY}/feature`, { method: 'PUT', body: {} })).status, 404);
  assert.equal((await api(`/api/inventory/stones/${CATEGORY}`, { method: 'PUT', body: {} })).status, 404);
  assert.equal((await api('/api/inventory/stones/not-an-id')).status, 400);
});

test('public pagination rejects zero/negative/noninteger bounds and caps page size at 200', async () => {
  for (const query of ['limit=0','page=0','limit=-1','page=1.5','limit=abc']) assert.equal((await api(`/api/inventory/stones?${query}`, { anonymous: true })).status, 400);
  assert.equal(pipelines.length, 0);
  const result = await api('/api/inventory/stones?limit=1000&page=2', { anonymous: true });
  assert.equal(result.status, 200); assert.equal(result.body.limit, 200); assert.equal(result.body.currentPage, 2);
  const stages = pipelines[0].find((stage) => stage.$facet).$facet.stones;
  assert.deepEqual(stages.find((stage) => stage.$limit), { $limit: 200 }); assert.deepEqual(stages.find((stage) => stage.$skip), { $skip: 200 });
});

test('search input is escaped as literal text and numeric ranges stay numeric through aggregation', async () => {
  const pattern = '(a+)+$[';
  const result = await api(`/api/inventory/stones?search=${encodeURIComponent(pattern)}&minWeight=2&maxWeight=10&hasCertificate=false&sort=weight-low`, { anonymous: true });
  assert.equal(result.status, 200);
  const pipeline = pipelines[0]; const stages = pipeline.find((stage) => stage.$facet).$facet.stones;
  const match = stages[0].$match;
  assert.deepEqual(match.__caratWeight, { $gte: 2, $lte: 10 }); assert.equal(match.hasCertificate, false);
  assert.equal(match.$or[0].title.$regex, '\\(a\\+\\)\\+\\$\\['); assert.equal(new RegExp(escapeRegex(pattern)).test(pattern), true);
  assert.deepEqual(pipeline[0], { $match: { archivedAt: null } }, 'Sold records are excluded before every facet.');
  assert.ok(pipeline.find((stage) => stage.$set?.__caratWeight).$set.__caratWeight.$ifNull, 'Legacy weight strings are converted before numeric matching/sorting.');
  assert.deepEqual(stages.find((stage) => stage.$sort).$sort, { __caratMissing: 1, __caratWeight: 1, _id: 1 });
});

test('catalog returns complete totals, category counts and filter options separately from the current page', async () => {
  aggregateResult = [{ stones: [{ _id: CATEGORY, title: 'One page item' }], metadata: [{ total: 501 }], categoryCounts: [{ _id: CATEGORY, count: 501 }], filterOptions: [{ shapes: ['Oval','Round',''], cuts: ['Brilliant'], origins: ['Sri Lanka'], colors: ['Blue'] }] }];
  const result = await api('/api/inventory/stones?page=17&limit=30', { anonymous: true });
  assert.equal(result.body.total, 501); assert.equal(result.body.totalPages, 17); assert.equal(result.body.currentPage, 17); assert.equal(result.body.stones.length, 1);
  assert.deepEqual(result.body.categoryCounts, [{ categoryId: CATEGORY, count: 501 }]); assert.deepEqual(result.body.filterOptions.shapes, ['Oval','Round']);
  const facets = pipelines[0].find((stage) => stage.$facet).$facet;
  assert.equal(facets.categoryCounts.some((stage) => stage.$limit), false); assert.equal(facets.filterOptions.some((stage) => stage.$skip), false);
});

test('real numeric schemas reject invalid inventory and stock availability and accept zero', async () => {
  for (const Model of [Stone, StockStone]) {
    await new Model({ categoryId: CATEGORY, title: 'A stone', image: IMAGE, quantity: 0, price: 0 }).validate();
    await assert.rejects(new Model({ categoryId: CATEGORY, title: 'A stone', image: IMAGE, quantity: -1 }).validate());
    await assert.rejects(new Model({ categoryId: CATEGORY, title: 'A stone', image: IMAGE, quantity: 0.5 }).validate());
  }
  assert.equal(carats('2.5 ct'), 2.5); assert.equal(carats('10'), 10); assert.throws(() => carats('2-10 ct'));
});

test('asset identification preserves dotted IDs while record deletion retains all shared media', async () => {
  const previous = cloudinary.config().cloud_name; cloudinary.config({ cloud_name: 'synthetic-test' });
  try {
    const image = 'https://res.cloudinary.com/synthetic-test/image/upload/v173123/pinnawala_gems/stone.preview.jpg';
    assert.equal(cloudinaryAsset(image), 'pinnawala_gems/stone.preview');
    assert.equal(cloudinaryAsset(image.replace('synthetic-test','foreign-test')), null); assert.equal(cloudinaryAsset('/gem.png'), null);
    const created = await create({ image });
    const oldCalls = cloudinary.uploader.destroy.mock.calls.length;
    assert.equal((await api(`/api/inventory/stones/${created.body._id}`, { method: 'DELETE' })).status, 200);
    assert.equal(cloudinary.uploader.destroy.mock.calls.length, oldCalls, 'Record deletion must never purge reusable Cloudinary media');
  } finally { cloudinary.config({ cloud_name: previous }); }
});

test('empty public content reads return stable defaults without creating database records', async () => {
  for (const route of ['/api/home','/api/contact']) {
    const first = await api(route, { anonymous: true }); const second = await api(route, { anonymous: true });
    assert.equal(first.status, 200); assert.equal(first.body._id, SINGLETON_ID); assert.deepEqual(first.body, second.body);
  }
  assert.equal(singletonWrites.length, 0);
});

test('content updates converge on the canonical singleton with validators and preserve its public value', async () => {
  const results = await Promise.all([api('/api/home', { method: 'PUT', body: { heroTitle: 'One title' } }), api('/api/home', { method: 'PUT', body: { brandIntro: 'One introduction' } })]);
  assert.equal(results.every((item) => item.status === 200), true);
  for (const write of singletonWrites) { assert.deepEqual(write.filter, { _id: SINGLETON_ID }); assert.equal(write.options.upsert, true); assert.equal(write.options.runValidators, true); }
  const read = await api('/api/home', { anonymous: true }); assert.equal(read.body._id, SINGLETON_ID);
  assert.equal((await api('/api/contact', { method: 'PUT', body: { contactVideo: 'javascript:alert(1)' } })).status, 400);
  assert.equal((await api('/api/home', { method: 'PUT', body: { topGems: [null] } })).status, 400);
});

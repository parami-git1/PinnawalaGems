const assert = require('node:assert/strict');
const { before, beforeEach, after, mock, test } = require('node:test');
const { once } = require('node:events');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;

const SECRET = 'MEDIA_RETENTION_SYNTHETIC_TEST_SECRET_ONLY';
process.env.NODE_ENV = 'test'; process.env.JWT_SECRET = SECRET;
process.env.ADMIN_USERNAME = 'synthetic-media-owner'; process.env.ADMIN_PASSWORD = 'SYNTHETIC_MEDIA_PASSWORD';
for (const key of ['MONGO_URI', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET', 'GOOGLE_CLIENT_ID', 'ADMIN_AUTH_MODE', 'ADMIN_GOOGLE_EMAIL', 'ADMIN_GOOGLE_EMAILS', 'ADMIN_EMAIL']) delete process.env[key];
const Stone = require('../models/Stone'), StockStone = require('../models/StockStone');
const Category = require('../models/GemCategory'), StockCategory = require('../models/StockCategory'), EventAd = require('../models/EventAd');
const CATEGORY = '000000000000000000000071', OTHER_CATEGORY = '000000000000000000000072';
const FIRST = '000000000000000000000081', SECOND = '000000000000000000000082', OTHER = '000000000000000000000083';
const IMAGE = 'https://res.cloudinary.com/synthetic-test/image/upload/v1/pinnawala_gems/shared.cover.jpg';
const VIDEO = 'https://res.cloudinary.com/synthetic-test/video/upload/v1/pinnawala_gems/shared.video.mp4';
let server, base, stores, failures, calls;
const clone = value => value == null ? value : JSON.parse(JSON.stringify(value));
const gem = (id, extra = {}) => ({ _id: id, title: 'Synthetic shared gemstone', categoryId: CATEGORY, image: IMAGE, certificateImage: IMAGE, additionalImages: [IMAGE], videos: [VIDEO], quantity: 2, ...extra });
before(async () => {
  mock.method(mongoose, 'connect', () => { throw new Error('Real database access is forbidden.'); });
  mock.method(cloudinary.uploader, 'destroy', () => { throw new Error('Automatic asset destruction is forbidden.'); });
  for (const Model of [Stone, StockStone, Category, StockCategory, EventAd]) {
    mock.method(Model, 'findById', async id => { calls.push(`${Model.modelName}:find`); return clone(stores.get(Model).find(row => row._id === String(id)) || null); });
    mock.method(Model, 'findByIdAndDelete', async id => {
      calls.push(`${Model.modelName}:delete`); if (failures.has(`${Model.modelName}:delete`)) throw new Error('Synthetic database delete failure');
      const rows = stores.get(Model), index = rows.findIndex(row => row._id === String(id));
      return index < 0 ? null : rows.splice(index, 1)[0];
    });
    mock.method(Model, 'deleteMany', async query => {
      calls.push(`${Model.modelName}:deleteMany`); if (failures.has(`${Model.modelName}:deleteMany`)) throw new Error('Synthetic database cascade failure');
      const rows = stores.get(Model), remaining = rows.filter(row => row.categoryId !== String(query.categoryId));
      stores.set(Model, remaining); return { deletedCount: rows.length - remaining.length };
    });
  }
  server = require('../server').listen(0, '127.0.0.1'); await once(server, 'listening'); base = `http://127.0.0.1:${server.address().port}`;
});
beforeEach(() => {
  stores = new Map([[Stone, [gem(FIRST), gem(SECOND, { archivedAt: '2026-01-01' }), gem(OTHER, { categoryId: OTHER_CATEGORY })]], [StockStone, [gem(FIRST), gem(SECOND), gem(OTHER, { categoryId: OTHER_CATEGORY })]], [Category, [{ _id: CATEGORY, title: 'Synthetic category', mainImage: IMAGE, coverImage: IMAGE }]], [StockCategory, [{ _id: CATEGORY, title: 'Synthetic private category', mainImage: IMAGE }]], [EventAd, [{ _id: FIRST, title: 'Synthetic ad', image: IMAGE }]]]);
  failures = new Set(); calls = [];
});
after(async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); mock.restoreAll(); });
async function remove(path, authenticated = true) {
  const token = jwt.sign({ sub: 'password-admin:synthetic-media-owner', username: 'synthetic-media-owner', role: 'admin', iss: 'pinnawala-gems-admin', aud: 'pinnawala-gems-api' }, SECRET, { expiresIn: '1h' });
  const response = await fetch(base + path, { method: 'DELETE', headers: authenticated ? { Authorization: `Bearer ${token}` } : {} });
  return { status: response.status, body: await response.json() };
}
test('single public and private gem deletes retain media reused by other gem, category and ad records', async () => {
  for (const [prefix, Model] of [['inventory', Stone], ['stock', StockStone]]) {
    const result = await remove(`/api/${prefix}/stones/${FIRST}`); assert.equal(result.status, 200); assert.equal(result.body.mediaRetained, true);
    assert.equal(stores.get(Model).some(row => row._id === FIRST), false); assert.equal(stores.get(Model).find(row => row._id === SECOND).image, IMAGE);
  }
  assert.equal(stores.get(Category)[0].mainImage, IMAGE); assert.equal(stores.get(EventAd)[0].image, IMAGE);
  assert.equal(cloudinary.uploader.destroy.mock.calls.length, 0);
});
test('failed record deletes leave records and every image/video reference intact without any external destruction', async () => {
  for (const [path, Model] of [[`/api/inventory/stones/${FIRST}`, Stone], [`/api/stock/stones/${FIRST}`, StockStone], [`/api/event-ads/${FIRST}`, EventAd]]) {
    failures.add(`${Model.modelName}:delete`); const before = clone(stores.get(Model));
    const result = await remove(path); assert.equal(result.status, 500); assert.deepEqual(stores.get(Model), before);
    assert.doesNotMatch(result.body.message, /Synthetic database/);
  }
  assert.equal(cloudinary.uploader.destroy.mock.calls.length, 0);
});
test('category deletes preserve existing database cascades, other categories and all reusable uploaded assets', async () => {
  for (const [prefix, Model, CategoryModel] of [['inventory', Stone, Category], ['stock', StockStone, StockCategory]]) {
    const result = await remove(`/api/${prefix}/categories/${CATEGORY}`); assert.equal(result.status, 200); assert.equal(result.body.mediaRetained, true);
    assert.deepEqual(stores.get(Model).map(row => row._id), [OTHER]); assert.equal(stores.get(CategoryModel).length, 0);
    assert.equal(stores.get(Model)[0].image, IMAGE);
  }
  assert.equal(cloudinary.uploader.destroy.mock.calls.length, 0);
});
test('category-only stone removal retains the category and unrelated shared media records', async () => {
  const result = await remove(`/api/inventory/categories/${CATEGORY}/stones`); assert.equal(result.status, 200); assert.equal(result.body.mediaRetained, true);
  assert.deepEqual(stores.get(Stone).map(row => row._id), [OTHER]); assert.equal(stores.get(Category).length, 1); assert.equal(stores.get(StockStone).length, 3);
  assert.equal(cloudinary.uploader.destroy.mock.calls.length, 0);
});
test('failed cascade writes cannot erase uploaded media or remove the existing category', async () => {
  for (const [prefix, Model, CategoryModel] of [['inventory', Stone, Category], ['stock', StockStone, StockCategory]]) {
    failures.add(`${Model.modelName}:deleteMany`); const before = clone(stores.get(Model));
    assert.equal((await remove(`/api/${prefix}/categories/${CATEGORY}`)).status, 500);
    assert.deepEqual(stores.get(Model), before); assert.equal(stores.get(CategoryModel).length, 1);
  }
  assert.equal(cloudinary.uploader.destroy.mock.calls.length, 0);
});
test('advertisement deletion removes only its record and retains a banner shared with the catalog', async () => {
  const result = await remove(`/api/event-ads/${FIRST}`); assert.equal(result.status, 200); assert.equal(result.body.mediaRetained, true);
  assert.equal(stores.get(EventAd).length, 0); assert.equal(stores.get(Stone)[0].image, IMAGE); assert.equal(stores.get(Category)[0].coverImage, IMAGE);
  assert.equal(cloudinary.uploader.destroy.mock.calls.length, 0);
});
test('unauthorized and malformed deletion requests cannot touch records or uploaded assets', async () => {
  assert.equal((await remove(`/api/inventory/stones/${FIRST}`, false)).status, 401);
  assert.equal(calls.length, 0);
  for (const path of ['/api/inventory/stones/invalid', '/api/stock/categories/invalid', '/api/event-ads/invalid']) assert.equal((await remove(path)).status, 400);
  assert.equal(calls.length, 0); assert.equal(cloudinary.uploader.destroy.mock.calls.length, 0);
});

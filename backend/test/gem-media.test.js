const assert = require('node:assert/strict');
const { after, before, beforeEach, mock, test } = require('node:test');
const { once } = require('node:events');
const fs = require('node:fs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;

// Exercise the actual Express/Multer routes without reading .env, contacting
// Cloudinary, connecting to MongoDB or creating any production records.
const SECRET = 'GEM_MEDIA_TEST_ONLY_PUBLIC_DUMMY_JWT_SECRET';
const CATEGORY = '000000000000000000000071';
const IMAGE_LIMIT = 8 * 1024 * 1024;
const VIDEO_LIMIT = 50 * 1024 * 1024;
const IMAGE = 'https://media.example.test/sapphire-cover.jpg';
const VIDEO = 'https://media.example.test/sapphire-turn.mp4';
process.env.JWT_SECRET = SECRET;
process.env.NODE_ENV = 'test';
for (const name of ['MONGO_URI', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET', 'GOOGLE_CLIENT_ID', 'ADMIN_USERNAME', 'ADMIN_PASSWORD', 'ADMIN_EMAIL', 'ADMIN_GOOGLE_EMAILS']) delete process.env[name];

let server;
let base;
let Stone;
let rows = [];
let uploads = [];
let uploadFailure = false;
let databaseCalls = 0;
const plain = (value) => JSON.parse(JSON.stringify(value));
const signatures = {
  'image/png': Buffer.from('89504e470d0a1a0a0000000d4948445200000001000000010806000000', 'hex'),
  'image/jpeg': Buffer.from('ffd8ffe000104a46494600010100000100010000ffd9', 'hex'),
  'image/webp': Buffer.from('524946461a000000574542505650384c0d0000002f00000000071011118888fe0700', 'hex'),
  'video/mp4': Buffer.from('000000186674797069736f6d0000020069736f6d6d703432', 'hex'),
  'video/webm': Buffer.from('1a45dfa39f4286810142f7810142f2810442f381084282847765626d42878104', 'hex'),
};

async function api(path, { method = 'GET', body, token = true } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${typeof token === 'string' ? token : jwt.sign({ sub: 'synthetic-gem-media-admin' }, SECRET, { expiresIn: '1h' })}`;
  if (body) headers['Content-Type'] = 'application/json';
  const response = await fetch(base + path, { method, headers, ...(body ? { body: JSON.stringify(body) } : {}) });
  return { status: response.status, body: await response.json() };
}

async function upload({ type = 'image/png', name = 'synthetic.png', bytes = signatures[type], token = true, field = 'file', second = false } = {}) {
  const body = new FormData();
  if (bytes) body.append(field, new Blob([bytes], { type }), name);
  if (second) body.append(field, new Blob([signatures['image/png']], { type: 'image/png' }), 'second.png');
  const headers = token ? { Authorization: `Bearer ${typeof token === 'string' ? token : jwt.sign({ sub: 'synthetic-gem-media-admin' }, SECRET, { expiresIn: '1h' })}` } : {};
  const response = await fetch(`${base}/api/media/upload`, { method: 'POST', headers, body });
  return { status: response.status, body: await response.json() };
}

async function createGem(overrides = {}) {
  return api('/api/inventory/stones', { method: 'POST', body: { title: 'Synthetic Ceylon sapphire', categoryId: CATEGORY, image: IMAGE, ...overrides } });
}

before(async () => {
  mock.method(mongoose, 'connect', () => { throw new Error('Database connections are forbidden in gem-media tests'); });
  mock.method(cloudinary.uploader, 'upload', async (filePath, options) => {
    assert.equal(typeof filePath, 'string');
    assert.equal(fs.existsSync(filePath), true, 'Multer must provide an existing temporary file');
    const bytes = fs.statSync(filePath).size;
    uploads.push({ filePath, options, bytes });
    if (uploadFailure) throw new Error('Synthetic Cloudinary failure');
    const extension = options.resource_type === 'video' ? 'mp4' : 'jpg';
    return { secure_url: `https://res.cloudinary.com/synthetic-test/${options.resource_type}/upload/v1/pinnawala_gems/synthetic.${extension}`, public_id: 'pinnawala_gems/synthetic', resource_type: options.resource_type, bytes, width: 100, height: 100 };
  });
  mock.method(cloudinary.uploader, 'destroy', async () => ({ result: 'ok' }));
  const app = require('../server');
  Stone = require('../models/Stone');
  const Category = require('../models/GemCategory');
  mock.method(Category, 'findById', async () => { databaseCalls++; return { _id: CATEGORY, title: 'Blue Sapphire' }; });
  mock.method(Stone, 'findOne', (query) => ({ sort: async () => {
    databaseCalls++;
    return plain(rows.filter((row) => String(row.categoryId) === String(query.categoryId)).at(-1) || null);
  } }));
  mock.method(Stone.prototype, 'save', async function save() {
    databaseCalls++;
    await this.validate();
    const item = plain(this);
    rows.push(item);
    return this;
  });
  mock.method(Stone, 'findById', async (id) => { databaseCalls++; return plain(rows.find((row) => row._id === String(id)) || null); });
  mock.method(Stone, 'findByIdAndUpdate', async (id, update) => {
    databaseCalls++;
    const index = rows.findIndex((row) => row._id === String(id));
    if (index < 0) return null;
    const document = new Stone({ ...rows[index], ...(update.$set || update) });
    await document.validate();
    rows[index] = plain(document);
    return plain(document);
  });
  mock.method(Stone, 'findByIdAndDelete', async (id) => {
    databaseCalls++;
    const index = rows.findIndex((row) => row._id === String(id));
    return index < 0 ? null : rows.splice(index, 1)[0];
  });
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  base = `http://127.0.0.1:${server.address().port}`;
});

beforeEach(() => { rows = []; uploads = []; uploadFailure = false; databaseCalls = 0; });
after(async () => {
  if (server) { server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); }
  mock.restoreAll();
  delete process.env.JWT_SECRET;
});

test('media upload rejects missing/invalid administrator tokens before handling files', async () => {
  for (const token of [false, jwt.sign({ sub: 'synthetic-wrong-admin' }, 'ANOTHER_PUBLIC_DUMMY_SECRET')]) {
    const response = await upload({ token });
    assert.equal(response.status, 401);
  }
  assert.equal(uploads.length, 0);
  assert.equal(databaseCalls, 0);
});

test('JPEG, PNG and WebP uploads return a usable image URL and remove their temporary file', async () => {
  for (const [type, name] of [['image/jpeg', 'stone.jpg'], ['image/png', 'stone.png'], ['image/webp', 'stone.webp']]) {
    const response = await upload({ type, name });
    assert.equal(response.status, 201, JSON.stringify(response.body));
    assert.equal(response.body.resourceType, 'image');
    assert.match(response.body.url, /^https:\/\//);
    assert.equal(uploads.at(-1).options.resource_type, 'image');
    assert.equal(uploads.at(-1).options.folder, 'pinnawala_gems');
    assert.equal(fs.existsSync(uploads.at(-1).filePath), false, 'Temporary image is removed after upload');
  }
});

test('MP4 and WebM uploads explicitly use Cloudinary video resources and remove temporary files', async () => {
  for (const [type, name] of [['video/mp4', 'stone.mp4'], ['video/webm', 'stone.webm']]) {
    const response = await upload({ type, name });
    assert.equal(response.status, 201, JSON.stringify(response.body));
    assert.equal(response.body.resourceType, 'video');
    assert.equal(uploads.at(-1).options.resource_type, 'video');
    assert.equal(fs.existsSync(uploads.at(-1).filePath), false);
  }
});

test('empty, unsupported, forged and multi-file requests return JSON errors without a cloud upload', async () => {
  const attempts = [
    { bytes: null },
    { bytes: Buffer.alloc(0) },
    { type: 'text/plain', name: 'stone.txt', bytes: Buffer.from('not a photograph') },
    { type: 'image/png', name: 'stone.png', bytes: Buffer.from('forged PNG content') },
    { type: 'video/mp4', name: 'stone.mp4', bytes: signatures['image/png'] },
    { field: 'unexpected' },
    { second: true },
  ];
  for (const attempt of attempts) {
    const response = await upload(attempt);
    assert.equal(response.status, 400, JSON.stringify({ attempt, response }));
    assert.equal(typeof response.body.message, 'string');
  }
  assert.equal(uploads.length, 0);
});

test('an image larger than 8 MiB is rejected before Cloudinary upload', async () => {
  const bytes = Buffer.alloc(IMAGE_LIMIT + 1);
  signatures['image/png'].copy(bytes);
  const response = await upload({ bytes });
  assert.equal(response.status, 413, JSON.stringify(response.body));
  assert.match(response.body.message, /8|large|limit/i);
  assert.equal(uploads.length, 0);
});

test('a video larger than 50 MiB is rejected during multipart handling', async () => {
  const bytes = Buffer.alloc(VIDEO_LIMIT + 1);
  signatures['video/mp4'].copy(bytes);
  const response = await upload({ type: 'video/mp4', name: 'large.mp4', bytes });
  assert.equal(response.status, 413, JSON.stringify(response.body));
  assert.match(response.body.message, /50|large|limit/i);
  assert.equal(uploads.length, 0);
});

test('files exactly at the displayed 8 MiB photo and 50 MiB video limits are accepted', async () => {
  for (const [type, name, limit] of [['image/png', 'limit.png', IMAGE_LIMIT], ['video/mp4', 'limit.mp4', VIDEO_LIMIT]]) {
    const bytes = Buffer.alloc(limit);
    signatures[type].copy(bytes);
    const response = await upload({ type, name, bytes });
    assert.equal(response.status, 201, JSON.stringify(response.body));
    assert.equal(response.body.bytes, limit);
    assert.equal(fs.existsSync(uploads.at(-1).filePath), false);
  }
});

test('Cloudinary failure returns a recoverable JSON error and cleans the temporary file', async () => {
  uploadFailure = true;
  const response = await upload();
  assert.equal(response.status, 502, JSON.stringify(response.body));
  assert.equal(typeof response.body.message, 'string');
  assert.equal(uploads.length, 1);
  assert.equal(fs.existsSync(uploads[0].filePath), false);
});

test('gem schema remains compatible with photo-only records and optional videos', async () => {
  const document = new Stone({ title: 'Synthetic photo-only sapphire', image: IMAGE, categoryId: CATEGORY });
  await document.validate();
  assert.deepEqual(plain(document).videos, []);
});

test('legacy local image paths and unrelated edits of older large galleries remain supported', async () => {
  const created = await createGem({ image: '/gem.png', additionalImages: ['/images/side.webp'] });
  assert.equal(created.status, 201, JSON.stringify(created.body));
  assert.equal(created.body.image, '/gem.png');
  assert.deepEqual(created.body.additionalImages, ['/images/side.webp']);
  const legacyId = '000000000000000000000072';
  rows.push({ _id: legacyId, title: 'Synthetic legacy large gallery', categoryId: CATEGORY, image: IMAGE, additionalImages: Array.from({ length: 12 }, (_, index) => `https://media.example.test/old-${index}.jpg`) });
  const updated = await api(`/api/inventory/stones/${legacyId}`, { method: 'PUT', body: { title: 'Synthetic renamed legacy gem' } });
  assert.equal(updated.status, 200, JSON.stringify(updated.body));
  assert.equal(updated.body.additionalImages.length, 12);
});

test('gem create and public read preserve normalized photos and optional video URLs', async () => {
  const created = await createGem({ additionalImages: [` ${IMAGE} `, ' https://media.example.test/side.webp ', 'https://media.example.test/side.webp'], videos: [` ${VIDEO} `, VIDEO] });
  assert.equal(created.status, 201, JSON.stringify(created.body));
  assert.deepEqual(created.body.additionalImages, ['https://media.example.test/side.webp']);
  assert.deepEqual(created.body.videos, [VIDEO]);
  const viewed = await api(`/api/inventory/stones/${created.body._id}`, { token: false });
  assert.equal(viewed.status, 200);
  assert.deepEqual(viewed.body.videos, [VIDEO]);
  assert.deepEqual(viewed.body.additionalImages, created.body.additionalImages);
});

test('gem edit can add/remove videos while unrelated edits preserve its gallery', async () => {
  const created = await createGem({ additionalImages: ['https://media.example.test/side.png'] });
  assert.equal(created.status, 201, JSON.stringify(created.body));
  const path = `/api/inventory/stones/${created.body._id}`;
  const added = await api(path, { method: 'PUT', body: { videos: [VIDEO, 'https://media.example.test/stone.webm?download=1'] } });
  assert.equal(added.status, 200, JSON.stringify(added.body));
  assert.equal(added.body.videos.length, 2);
  const renamed = await api(path, { method: 'PUT', body: { title: 'Synthetic renamed sapphire' } });
  assert.equal(renamed.status, 200);
  assert.deepEqual(renamed.body.videos, added.body.videos);
  assert.deepEqual(renamed.body.additionalImages, created.body.additionalImages);
  const removed = await api(path, { method: 'PUT', body: { videos: [] } });
  assert.equal(removed.status, 200);
  assert.deepEqual(removed.body.videos, []);
});

test('gem create rejects media count overflow, malformed arrays and unsafe video URLs', async () => {
  for (const payload of [
    { additionalImages: Array.from({ length: 10 }, (_, index) => `https://media.example.test/photo-${index}.jpg`) },
    { videos: [VIDEO, 'https://media.example.test/second.mp4', 'https://media.example.test/third.webm'] },
    { videos: 'https://media.example.test/stone.mp4' },
    { additionalImages: 'https://media.example.test/stone.jpg' },
    { videos: ['javascript:alert(1)'] },
    { videos: ['https://media.example.test/not-a-video.jpg'] },
  ]) {
    const response = await createGem(payload);
    assert.equal(response.status, 400, JSON.stringify({ payload, response }));
  }
  assert.equal(rows.length, 0);
});

test('gem update enforces gallery count/type limits without modifying stored records', async () => {
  const created = await createGem({ videos: [VIDEO] });
  assert.equal(created.status, 201);
  for (const body of [
    { videos: [VIDEO, 'https://media.example.test/second.mp4', 'https://media.example.test/third.mp4'] },
    { videos: { url: VIDEO } },
    { videos: ['data:video/mp4;base64,AAAA'] },
    { additionalImages: Array.from({ length: 10 }, (_, index) => `https://media.example.test/photo-${index}.jpg`) },
  ]) assert.equal((await api(`/api/inventory/stones/${created.body._id}`, { method: 'PUT', body })).status, 400);
  const viewed = await api(`/api/inventory/stones/${created.body._id}`, { token: false });
  assert.deepEqual(viewed.body.videos, [VIDEO]);
  assert.deepEqual(viewed.body.additionalImages, []);
});

test('deleting a gem removes its own versioned Cloudinary video with the correct resource type and preserves external assets', async () => {
  const previousCloudName = cloudinary.config().cloud_name;
  cloudinary.config({ cloud_name: 'synthetic-test' });
  try {
    const ownedVideo = 'https://res.cloudinary.com/synthetic-test/video/upload/v1731234567/pinnawala_gems/stone.preview.mp4';
    for (const externalVideo of [
      'https://media.example.test/external-stone.mp4',
      'https://res.cloudinary.com/another-synthetic-cloud/video/upload/v1731234567/pinnawala_gems/external-stone.mp4',
    ]) {
      const created = await createGem({ videos: [ownedVideo, externalVideo] });
      assert.equal(created.status, 201, JSON.stringify(created.body));
      const previousCalls = cloudinary.uploader.destroy.mock.calls.length;
      const deleted = await api(`/api/inventory/stones/${created.body._id}`, { method: 'DELETE' });
      assert.equal(deleted.status, 200, JSON.stringify(deleted.body));
      const cleanupCalls = cloudinary.uploader.destroy.mock.calls.slice(previousCalls);
      assert.equal(cleanupCalls.length, 1, 'External URLs and videos in another cloud are never destroyed');
      assert.deepEqual(cleanupCalls[0].arguments, ['pinnawala_gems/stone.preview', { resource_type: 'video', invalidate: true }]);
      assert.equal((await api(`/api/inventory/stones/${created.body._id}`, { token: false })).status, 404);
    }
  } finally { cloudinary.config({ cloud_name: previousCloudName }); }
});

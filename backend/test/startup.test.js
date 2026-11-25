const assert = require('node:assert/strict');
const { test, afterEach, mock } = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const express = require('express');
const mongoose = require('mongoose');
const { startupConfig, startupError, databaseStartupError, startupFailure, listenForConnections } = require('../utils/startup');

// Synthetic configuration only. Never load the real .env or connect to MongoDB,
// Google, Cloudinary, Render or production data during startup verification.
const valid = () => ({
  MONGO_URI: 'mongodb://synthetic-user:SYNTHETIC_URI_PASSWORD@127.0.0.1:27017/startup-test',
  JWT_SECRET: 'SYNTHETIC_STARTUP_SIGNING_KEY_ONLY', NODE_ENV: 'production',
  ALLOWED_ORIGINS: 'https://pinnawala-gems.vercel.app', TRUST_PROXY_HOPS: '1', PORT: '10000',
});
const managed = ['MONGO_URI', 'JWT_SECRET', 'NODE_ENV', 'ALLOWED_ORIGINS', 'TRUST_PROXY_HOPS', 'PORT', 'RENDER'];
const original = Object.fromEntries(managed.map(key => [key, process.env[key]]));
const applyEnvironment = (env) => managed.forEach(key => { if (env[key] === undefined) delete process.env[key]; else process.env[key] = env[key]; });
const close = async server => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); };
afterEach(() => { mock.restoreAll(); applyEnvironment(original); });

test('Render startup uses a numeric supplied port and explicit public IPv4 binding', () => {
  const config = startupConfig(valid());
  assert.equal(config.port, 10000); assert.equal(typeof config.port, 'number');
  assert.equal(config.host, '0.0.0.0');
  assert.equal(config.mongoUri, valid().MONGO_URI);
  assert.equal(startupConfig({ ...valid(), PORT: ' 5001 ' }).port, 5001);
});

test('missing PORT keeps local compatibility and uses the Render default only on Render', () => {
  assert.equal(startupConfig({ ...valid(), PORT: undefined }).port, 5000);
  assert.equal(startupConfig({ ...valid(), PORT: undefined, RENDER: 'true' }).port, 10000);
});

test('missing required values name only missing keys without exposing any configured secret', () => {
  for (const missing of [['MONGO_URI'], ['JWT_SECRET'], ['MONGO_URI', 'JWT_SECRET']]) {
    const env = valid(); missing.forEach(key => { env[key] = '  '; });
    assert.throws(() => startupConfig(env), error => {
      const failure = startupFailure(error);
      assert.equal(failure.code, 'MISSING_ENV');
      missing.forEach(key => assert(failure.message.includes(key)));
      assert.doesNotMatch(JSON.stringify(failure), /SYNTHETIC_URI_PASSWORD|SYNTHETIC_STARTUP_SIGNING_KEY/);
      return true;
    });
  }
});

test('production origins are required and invalid origins fail with redacted guidance', () => {
  for (const value of ['', '   ']) assert.throws(() => startupConfig({ ...valid(), ALLOWED_ORIGINS: value }), { code: 'MISSING_ALLOWED_ORIGINS' });
  for (const value of ['*', 'not-an-origin', 'https://shop.example.test/path', 'https://PRIVATE_USER:PRIVATE_PASSWORD@shop.example.test']) {
    assert.throws(() => startupConfig({ ...valid(), ALLOWED_ORIGINS: value }), error => {
      assert.equal(error.code, 'INVALID_ALLOWED_ORIGINS');
      assert.doesNotMatch(JSON.stringify(startupFailure(error)), /PRIVATE_USER|PRIVATE_PASSWORD/); return true;
    });
  }
  assert.doesNotThrow(() => startupConfig({ ...valid(), ALLOWED_ORIGINS: 'https://pinnawala-gems.vercel.app/,https://shop.example.test' }));
  assert.doesNotThrow(() => startupConfig({ ...valid(), NODE_ENV: 'development', ALLOWED_ORIGINS: '' }));
});

test('invalid ports cannot silently become named pipes or an unscannable random port', () => {
  for (const value of ['0', '-1', '65536', '5000/socket', 'localhost:5000', '$PORT', '1e4', '10.5', 'PRIVATE_PORT_VALUE']) {
    assert.throws(() => startupConfig({ ...valid(), PORT: value }), error => {
      assert.equal(error.code, 'INVALID_PORT'); assert(!startupFailure(error).message.includes(value)); return true;
    });
  }
});

test('invalid proxy settings fail in controlled startup validation', () => {
  for (const value of ['-1', '4', '1.5', 'PRIVATE_PROXY_VALUE']) assert.throws(() => startupConfig({ ...valid(), TRUST_PROXY_HOPS: value }), { code: 'INVALID_TRUST_PROXY' });
});

test('invalid Mongo URI syntax is reported without printing the supplied value', () => {
  assert.throws(() => startupConfig({ ...valid(), MONGO_URI: 'PRIVATE_DATABASE_VALUE' }), error => {
    assert.equal(error.code, 'DATABASE_URI_INVALID'); assert(!startupFailure(error).message.includes('PRIVATE_DATABASE_VALUE')); return true;
  });
});

test('database failures distinguish authentication, URI, DNS, TLS and connectivity without raw messages', () => {
  const privateMessage = 'mongodb+srv://PRIVATE_USER:PRIVATE_PASSWORD@private.example/db?token=PRIVATE_TOKEN';
  const cases = [
    [{ code: 18 }, 'DATABASE_AUTH_FAILED'],
    [{ codeName: 'AuthenticationFailed' }, 'DATABASE_AUTH_FAILED'],
    [{ name: 'MongoParseError' }, 'DATABASE_URI_INVALID'],
    [{ cause: { code: 'ENOTFOUND', message: privateMessage } }, 'DATABASE_DNS_FAILED'],
    [{ reason: { servers: new Map([['private-host', { error: { cause: { code: 'EAI_AGAIN' } } }]]) } }, 'DATABASE_DNS_FAILED'],
    [{ cause: { code: 'CERT_HAS_EXPIRED' } }, 'DATABASE_TLS_FAILED'],
    [{ name: 'MongooseServerSelectionError' }, 'DATABASE_CONNECT_FAILED'],
    [{ cause: { code: 'ECONNREFUSED' } }, 'DATABASE_CONNECT_FAILED'],
  ];
  for (const [details, code] of cases) {
    const failure = startupFailure(databaseStartupError({ message: privateMessage, stack: privateMessage, ...details }));
    assert.equal(failure.code, code);
    assert.doesNotMatch(JSON.stringify(failure), /PRIVATE_USER|PRIVATE_PASSWORD|PRIVATE_TOKEN|private-host|private\.example/);
  }
});

test('unknown errors and unexpected error names cannot leak secrets into startup logging', () => {
  const failure = startupFailure({ name: 'PRIVATE_SECRET', message: 'PRIVATE_PASSWORD', stack: 'PRIVATE_DATABASE_URI' });
  assert.equal(failure.code, 'UNEXPECTED_STARTUP_FAILURE');
  assert.doesNotMatch(JSON.stringify(failure), /PRIVATE_/);
  const controlled = startupFailure(startupError('MISSING_ENV', ['MONGO_URI', 'PRIVATE_SECRET']));
  assert(controlled.message.includes('MONGO_URI')); assert(!controlled.message.includes('PRIVATE_SECRET'));
});

test('real Express listener is reachable over IPv4 and resolves only after binding', async () => {
  const app = express(); app.get('/ready', (_req, res) => res.json({ ready: true }));
  const server = await listenForConnections(app, 0);
  try {
    assert.equal(server.listening, true); assert.equal(server.address().address, '0.0.0.0');
    const response = await fetch(`http://127.0.0.1:${server.address().port}/ready`);
    assert.equal(response.status, 200); assert.deepEqual(await response.json(), { ready: true });
  } finally { await close(server); }
});

test('Express 5 bind failure rejects instead of falsely reporting successful startup', async () => {
  const app = require('../server');
  const occupied = await listenForConnections(express(), 0);
  const env = { ...valid(), PORT: String(occupied.address().port) };
  applyEnvironment(env);
  mock.method(mongoose, 'connect', async () => mongoose);
  const logs = []; mock.method(console, 'info', message => logs.push(message));
  try {
    await assert.rejects(app.startServer(), error => {
      assert.equal(startupFailure(error).code, 'PORT_IN_USE'); return true;
    });
    assert.equal(logs.some(message => message.includes('API is listening')), false);
  } finally { await close(occupied); }
});

test('actual startup validates configuration before database access or port binding', async () => {
  const app = require('../server');
  applyEnvironment({ ...valid(), TRUST_PROXY_HOPS: 'not-a-number' });
  let calls = 0;
  mock.method(mongoose, 'connect', () => { calls++; throw new Error('Database access must not happen'); });
  mock.method(app, 'listen', () => { calls++; throw new Error('Listener must not open'); });
  await assert.rejects(app.startServer(), { code: 'INVALID_TRUST_PROXY' });
  assert.equal(calls, 0);
});

test('a failed database connection never starts an unready API listener', async () => {
  const app = require('../server'); applyEnvironment(valid());
  let listens = 0;
  mock.method(console, 'info', () => {});
  mock.method(mongoose, 'connect', async () => { throw Object.assign(new Error('PRIVATE_CONNECTION_PASSWORD'), { code: 18 }); });
  mock.method(app, 'listen', () => { listens++; throw new Error('Unready API must not listen'); });
  await assert.rejects(app.startServer(), error => {
    const failure = startupFailure(error); assert.equal(failure.code, 'DATABASE_AUTH_FAILED');
    assert(!failure.message.includes('PRIVATE_CONNECTION_PASSWORD')); return true;
  });
  assert.equal(listens, 0);
});

test('the real CLI exits cleanly with actionable missing-key diagnostics and no live .env access', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'pinnawala-startup-'));
  try {
    const result = spawnSync(process.execPath, [path.resolve(__dirname, '../server.js')], {
      cwd: directory, encoding: 'utf8', timeout: 15000, windowsHide: true,
      env: { ...Object.fromEntries(['PATH', 'SystemRoot', 'WINDIR', 'TEMP', 'TMP'].filter(key => process.env[key]).map(key => [key, process.env[key]])),
        NODE_ENV: 'production', MONGO_URI: '', JWT_SECRET: '', ALLOWED_ORIGINS: '', TRUST_PROXY_HOPS: '1' },
    });
    assert.equal(result.status, 1); assert.equal(result.error, undefined);
    assert.match(result.stderr, /Backend startup failed \[MISSING_ENV\]/);
    assert.match(result.stderr, /MONGO_URI, JWT_SECRET/);
    assert.doesNotMatch(result.stdout + result.stderr, /SYNTHETIC_URI_PASSWORD|PRIVATE_|API is listening|injected env/);
  } finally { fs.rmdirSync(directory); }
});

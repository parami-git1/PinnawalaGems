const { configuredOrigins } = require('../middleware/security');

const MESSAGES = Object.freeze({
  MISSING_ENV: 'Set the missing required keys in the Render Environment settings.',
  MISSING_ALLOWED_ORIGINS: 'Set ALLOWED_ORIGINS to the production frontend origin, for example https://pinnawala-gems.vercel.app.',
  INVALID_ALLOWED_ORIGINS: 'ALLOWED_ORIGINS must contain full http/https origins without credentials, paths, queries or fragments.',
  INVALID_TRUST_PROXY: 'TRUST_PROXY_HOPS must be an integer from 0 to 3. Standard Render hosting uses 1.',
  INVALID_PORT: 'PORT must be a decimal TCP port from 1 to 65535. Use the PORT supplied by Render.',
  DATABASE_URI_INVALID: 'Check the MONGO_URI connection-string format and URL-encoding of database credentials. Do not print the URI.',
  DATABASE_AUTH_FAILED: 'MongoDB rejected authentication. Check the existing Atlas database user, password and connection-string encoding.',
  DATABASE_DNS_FAILED: 'MongoDB hostname lookup failed. Check the Atlas cluster hostname and DNS/network availability.',
  DATABASE_TLS_FAILED: 'MongoDB TLS verification failed. Check the runtime certificates and database TLS configuration; keep verification enabled.',
  DATABASE_CONNECT_FAILED: 'MongoDB connection failed. Check cluster availability, Atlas Network Access and the existing MONGO_URI settings.',
  PORT_IN_USE: 'The HTTP port is already in use. Check PORT and ensure only one backend listener starts.',
  PORT_ACCESS_DENIED: 'The process cannot bind the HTTP port. Use the PORT supplied by Render.',
  LISTENER_FAILED: 'The HTTP listener could not start. Check the Render port and service settings.',
  UNEXPECTED_STARTUP_FAILURE: 'Unexpected startup failure. Check the deployed runtime, service settings and startup checks.',
});

function startupError(code, missingKeys = []) {
  const error = new Error(MESSAGES[code] || MESSAGES.UNEXPECTED_STARTUP_FAILURE);
  error.name = 'BackendStartupError';
  error.code = code;
  error.missingKeys = missingKeys;
  return error;
}

function startupConfig(env = process.env) {
  const missing = ['MONGO_URI', 'JWT_SECRET'].filter(key => typeof env[key] !== 'string' || !env[key].trim());
  if (missing.length) throw startupError('MISSING_ENV', missing);
  if (!/^mongodb(?:\+srv)?:\/\//.test(env.MONGO_URI)) throw startupError('DATABASE_URI_INVALID');
  let origins;
  try { origins = configuredOrigins(env.ALLOWED_ORIGINS || ''); }
  catch { throw startupError('INVALID_ALLOWED_ORIGINS'); }
  if (env.NODE_ENV === 'production' && !origins.size) throw startupError('MISSING_ALLOWED_ORIGINS');
  const proxy = Number(env.TRUST_PROXY_HOPS || (env.RENDER === 'true' ? '1' : '0'));
  if (!Number.isInteger(proxy) || proxy < 0 || proxy > 3) throw startupError('INVALID_TRUST_PROXY');
  const rawPort = String(env.PORT ?? '').trim();
  const port = rawPort ? Number(rawPort) : env.RENDER === 'true' ? 10000 : 5000;
  if ((rawPort && !/^\d+$/.test(rawPort)) || !Number.isInteger(port) || port < 1 || port > 65535) throw startupError('INVALID_PORT');
  return { mongoUri: env.MONGO_URI, host: '0.0.0.0', port };
}

function databaseStartupError(error) {
  // Inspect only known metadata, never raw messages/stacks that can contain
  // connection strings, database usernames or passwords.
  const failures = [];
  const seen = new Set();
  const add = (item) => {
    if (!item || typeof item !== 'object' || seen.has(item) || failures.length >= 16) return;
    seen.add(item); failures.push(item);
  };
  add(error);
  for (let index = 0; index < failures.length; index++) {
    const item = failures[index];
    add(item.cause); add(item.reason); add(item.error);
    if (item.servers instanceof Map) {
      for (const server of item.servers.values()) add(server?.error);
    }
  }
  const has = (predicate) => failures.some(predicate);
  if (has(item => item.code === 18 || item.code === '18' || item.codeName === 'AuthenticationFailed')) return startupError('DATABASE_AUTH_FAILED');
  if (has(item => item.name === 'MongoParseError' || item.name === 'MongoInvalidArgumentError')) return startupError('DATABASE_URI_INVALID');
  if (has(item => ['ENOTFOUND', 'EAI_AGAIN', 'ENODATA'].includes(item.code))) return startupError('DATABASE_DNS_FAILED');
  if (has(item => ['ERR_TLS_CERT_ALTNAME_INVALID', 'CERT_HAS_EXPIRED', 'DEPTH_ZERO_SELF_SIGNED_CERT', 'UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'ERR_TLS_CERT_SIGNATURE_ALGORITHM_UNSUPPORTED'].includes(item.code))) return startupError('DATABASE_TLS_FAILED');
  return startupError('DATABASE_CONNECT_FAILED');
}

function startupFailure(error) {
  const code = error?.code === 'EADDRINUSE' ? 'PORT_IN_USE'
    : error?.code === 'EACCES' ? 'PORT_ACCESS_DENIED'
    : error?.name === 'BackendStartupError' && Object.hasOwn(MESSAGES, error.code) ? error.code : 'UNEXPECTED_STARTUP_FAILURE';
  const missing = code === 'MISSING_ENV' && Array.isArray(error.missingKeys)
    ? error.missingKeys.filter(key => ['MONGO_URI', 'JWT_SECRET'].includes(key)) : [];
  return { code, message: MESSAGES[code] + (missing.length ? ` Missing: ${missing.join(', ')}.` : '') };
}

function listenForConnections(app, port, host = '0.0.0.0') {
  return new Promise((resolve, reject) => {
    let server;
    let settled = false;
    const failed = (error) => {
      if (settled) return;
      settled = true;
      server?.removeListener('error', failed);
      reject(error);
    };
    try {
      // Express 5 also passes bind errors to this callback. A callback alone
      // therefore cannot be treated as successful binding.
      server = app.listen(port, host, (error) => {
        if (error) { failed(error); return; }
        if (settled) return;
        if (!server.listening) { failed(startupError('LISTENER_FAILED')); return; }
        settled = true;
        server.removeListener('error', failed);
        resolve(server);
      });
      server.once('error', failed);
    } catch (error) { failed(error); }
  });
}

module.exports = { startupConfig, startupError, databaseStartupError, startupFailure, listenForConnections };

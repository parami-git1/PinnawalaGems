const helmet = require('helmet');
const cors = require('cors');
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const { createHash } = require('node:crypto');

function configuredOrigins() {
  return new Set((process.env.ALLOWED_ORIGINS || '').split(',').map((value) => value.trim()).filter(Boolean).map((value) => {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error('ALLOWED_ORIGINS must contain comma-separated frontend origins, without paths.');
    return url.origin;
  }));
}

function allowedOrigin(origin) {
  if (!origin) return true;
  try {
    if (configuredOrigins().has(origin)) return true;
    const url = new URL(origin);
    return process.env.NODE_ENV !== 'production' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) && ['http:', 'https:'].includes(url.protocol);
  } catch { return false; }
}

const corsPolicy = cors({
  origin: (origin, done) => allowedOrigin(origin) ? done(null, true) : done(Object.assign(new Error('This website origin is not allowed to access the API.'), { status: 403 })),
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Retry-After', 'RateLimit'],
  maxAge: 600,
});

const secureHeaders = helmet({
  contentSecurityPolicy: { directives: { defaultSrc: ["'none'"], baseUri: ["'none'"], frameAncestors: ["'none'"], formAction: ["'none'"] } },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
});

const common = { standardHeaders: 'draft-8', legacyHeaders: false, message: { message: 'Too many requests. Please wait and try again.' } };
const apiLimiter = rateLimit({ ...common, windowMs: 5 * 60 * 1000, limit: 600 });
const loginIpLimiter = rateLimit({ ...common, windowMs: 15 * 60 * 1000, limit: 20, skipSuccessfulRequests: true, message: { message: 'Too many sign-in attempts. Please try again in 15 minutes.' } });
const loginAccountLimiter = rateLimit({ ...common, windowMs: 15 * 60 * 1000, limit: 10, skipSuccessfulRequests: true, keyGenerator: (req) => {
  const identifier = typeof req.body?.email === 'string' ? req.body.email : req.body?.username;
  return `${ipKeyGenerator(req.ip)}:${createHash('sha256').update(typeof identifier === 'string' ? identifier.trim().toLowerCase().slice(0, 256) : 'invalid').digest('hex')}`;
}, message: { message: 'Too many sign-in attempts. Please try again in 15 minutes.' } });
const feedbackLimiter = rateLimit({ ...common, windowMs: 15 * 60 * 1000, limit: 5, message: { message: 'You have submitted several reviews recently. Please try again in 15 minutes.' } });
const uploadLimiter = rateLimit({ ...common, windowMs: 15 * 60 * 1000, limit: 60, message: { message: 'Too many media uploads. Please wait before uploading more files.' } });

function configureProxy(app) {
  const raw = process.env.TRUST_PROXY_HOPS || (process.env.RENDER === 'true' ? '1' : '0');
  const hops = Number(raw);
  if (!Number.isInteger(hops) || hops < 0 || hops > 3) throw new Error('TRUST_PROXY_HOPS must be an integer from 0 to 3.');
  app.set('trust proxy', hops || false);
}

function apiCaching(req, res, next) {
  res.set('Cache-Control', 'no-store');
  res.vary('Authorization');
  const publicRead = req.method === 'GET' && !req.headers.authorization && /^\/(?:home|contact|feedback|workshop|event-ads|inventory\/(?:categories(?:\/[^/]+\/stones)?|stones(?:\/[^/]+)?|top-gems))\/?$/.test(req.path);
  const send = res.json;
  res.json = function (body) {
    if (publicRead && this.statusCode >= 200 && this.statusCode < 300) this.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
    return send.call(this, body);
  };
  next();
}

function apiErrorHandler(error, _req, res, next) {
  if (res.headersSent) return next(error);
  let status = Number(error.status || error.statusCode) || 500;
  if (error.name === 'ValidationError' || error.name === 'CastError') status = 400;
  if (error.code === 11000) status = 409;
  if (status < 400 || status > 599) status = 500;
  const message = status >= 500 ? 'The service could not complete this request. Please try again.' : error.type === 'entity.too.large' ? 'The request is too large.' : error.type === 'encoding.unsupported' ? 'Compressed request bodies are not supported.' : error instanceof SyntaxError ? 'Send a valid JSON request.' : error.name === 'CastError' ? 'A record identifier or value is invalid.' : error.message || 'Unable to process this request.';
  res.status(status).json({ message });
}

module.exports = { allowedOrigin, configuredOrigins, configureProxy, secureHeaders, corsPolicy, apiCaching, apiLimiter, loginIpLimiter, loginAccountLimiter, feedbackLimiter, uploadLimiter, apiErrorHandler };

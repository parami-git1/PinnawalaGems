const jwt = require('jsonwebtoken');
const { adminAuthPolicy, identityAllowed } = require('./adminAuthPolicy');

const ADMIN_ISSUER = 'pinnawala-gems-admin';
const ADMIN_AUDIENCE = 'pinnawala-gems-api';
const MAX_SESSION_SECONDS = 8 * 60 * 60;
const CLOCK_TOLERANCE_SECONDS = 5;

function allowedGoogleEmails() {
  return adminAuthPolicy().googleEmails;
}

function unauthorized(message = 'Invalid or expired admin token') {
  return Object.assign(new Error(message), { status: 401 });
}

function forbidden() {
  return Object.assign(new Error('Administrator access is required'), { status: 403 });
}

function verifyAdminToken(token) {
  if (typeof token !== 'string' || !token || token.length > 16384 || !process.env.JWT_SECRET) throw unauthorized();
  let claims;
  try {
    claims = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'], maxAge: `${MAX_SESSION_SECONDS}s`, clockTolerance: CLOCK_TOLERANCE_SECONDS,
    });
  } catch { throw unauthorized(); }
  const now = Math.floor(Date.now() / 1000);
  if (!claims || typeof claims !== 'object' || Array.isArray(claims)
    || !Number.isInteger(claims.iat) || !Number.isInteger(claims.exp)
    || claims.iat > now + CLOCK_TOLERANCE_SECONDS || claims.exp <= claims.iat
    || claims.exp - claims.iat > MAX_SESSION_SECONDS) throw unauthorized();
  if (typeof claims.sub !== 'string' || !claims.sub.trim() || claims.sub.length > 512) throw forbidden();

  if (Object.hasOwn(claims, 'role')) {
    if (claims.role !== 'admin' || claims.iss !== ADMIN_ISSUER || claims.aud !== ADMIN_AUDIENCE) throw forbidden();
    if (!identityAllowed(claims)) throw forbidden();
    return claims;
  }

  // Existing eight-hour sessions predate explicit role/issuer/audience claims.
  // Accept only identities that the existing administrator login could issue.
  if (claims.iss !== undefined || claims.aud !== undefined) throw forbidden();
  if (!identityAllowed(claims)) throw forbidden();
  return claims;
}

function signAdminToken(identity) {
  return jwt.sign({ ...identity, role: 'admin' }, process.env.JWT_SECRET, {
    algorithm: 'HS256', expiresIn: MAX_SESSION_SECONDS, issuer: ADMIN_ISSUER, audience: ADMIN_AUDIENCE,
  });
}

function publicAdminIdentity(claims) {
  const admin = { role: 'admin', subject: claims.sub };
  for (const key of ['username', 'email', 'name']) {
    if (typeof claims[key] === 'string' && claims[key]) admin[key] = claims[key];
  }
  return admin;
}

module.exports = { ADMIN_ISSUER, ADMIN_AUDIENCE, MAX_SESSION_SECONDS, allowedGoogleEmails, verifyAdminToken, signAdminToken, publicAdminIdentity };

const express = require('express');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const { loginIpLimiter, loginAccountLimiter } = require('../middleware/security');
const requireAdmin = require('../middleware/adminAuth');
const { allowedGoogleEmails, signAdminToken, publicAdminIdentity } = require('../utils/adminSession');
const { adminAuthPolicy, publicAuthOptions, normalizeEmail } = require('../utils/adminAuthPolicy');

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });

// Public login capabilities only. Never disclose the owner email or secrets.
router.get('/auth-options', (_req, res) => res.json(publicAuthOptions()));

// Read-only verification before the frontend mounts any administrator screen.
router.get('/session', requireAdmin, (req, res) => {
  res.json({ admin: publicAdminIdentity(req.admin), expiresAt: req.admin.exp * 1000 });
});

function matchesSecret(value, expected) {
  if (typeof value !== 'string' || typeof expected !== 'string' || !value || !expected) return false;
  const actualBuffer = crypto.createHash('sha256').update(value).digest();
  const expectedBuffer = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(actualBuffer, expectedBuffer);
}

// An administrator can use an email address as the existing configured login
// identifier. Keep legacy usernames case sensitive and never normalize secrets.
function normalizeIdentifier(value) {
  return normalizeEmail(value) || value.trim();
}

function loginIdentifier(body) {
  const hasEmail = Object.hasOwn(body, 'email');
  const hasUsername = Object.hasOwn(body, 'username');
  if (!hasEmail && !hasUsername) return null;
  if (hasUsername && (typeof body.username !== 'string' || !body.username.trim() || body.username.length > 256)) return null;
  if (hasEmail && (typeof body.email !== 'string' || body.email.length > 256 || !normalizeEmail(body.email))) return null;
  const email = hasEmail ? normalizeEmail(body.email) : null;
  const username = hasUsername ? normalizeIdentifier(body.username) : null;
  // Do not silently choose one account when callers supply conflicting aliases.
  if (hasEmail && hasUsername && email !== username) return null;
  return email || username;
}

router.post('/login', loginIpLimiter, loginAccountLimiter, (req, res) => {
  const policy = adminAuthPolicy();
  if (policy.mode !== 'mixed' || !policy.valid) return res.status(403).json({ message: 'Password sign-in is disabled. Use the authorized Google account.' });
  const body = req.body || {};
  const identifier = loginIdentifier(body);
  const { password } = body;
  if (!identifier || typeof password !== 'string' || !password || password.length > 1024) return res.status(400).json({ message: 'Enter a valid administrator email or username and password.' });
  const configuredUsername = process.env.ADMIN_USERNAME;
  const configuredPassword = process.env.ADMIN_PASSWORD;

  if (!configuredUsername || !configuredPassword || !process.env.JWT_SECRET) {
    return res.status(503).json({ message: 'Password authentication is not configured' });
  }

  if (!matchesSecret(identifier, normalizeIdentifier(configuredUsername)) || !matchesSecret(password, configuredPassword)) {
    return res.status(401).json({ message: 'Invalid email, username or password' });
  }

  const token = signAdminToken({ sub: `password-admin:${configuredUsername}`, username: configuredUsername });

  res.json({ token, admin: { username: configuredUsername } });
});

router.post('/google-login', loginIpLimiter, async (req, res) => {
  try {
    const policy = adminAuthPolicy();
    if (!policy.googleEnabled) return res.status(503).json({ message: 'Google administrator sign-in is unavailable. Contact the site owner.' });
    const { credential } = req.body || {};
    if (typeof credential !== 'string' || !credential || credential.length > 10000 || !process.env.GOOGLE_CLIENT_ID || !process.env.JWT_SECRET) {
      return res.status(400).json({ message: 'Google authentication is not configured' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: policy.googleClientId
    });
    const payload = ticket.getPayload();
    const email = normalizeEmail(payload?.email);
    const allowedEmails = allowedGoogleEmails();

    if (payload?.email_verified !== true || typeof payload.sub !== 'string' || !payload.sub.trim() || payload.sub.length > 512 || !email || !allowedEmails.includes(email)) {
      return res.status(403).json({ message: 'This Google account is not authorized as an admin' });
    }

    const token = signAdminToken({ sub: payload.sub, email, name: payload.name || '' });

    res.json({ token, admin: { email, name: payload.name || '' } });
  } catch (error) {
    res.status(401).json({ message: 'Unable to verify Google account' });
  }
});

module.exports = router;

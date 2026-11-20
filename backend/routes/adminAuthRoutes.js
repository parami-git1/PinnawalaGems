const express = require('express');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const { loginIpLimiter, loginAccountLimiter } = require('../middleware/security');
const requireAdmin = require('../middleware/adminAuth');
const { allowedGoogleEmails, signAdminToken, publicAdminIdentity } = require('../utils/adminSession');

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });

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

router.post('/login', loginIpLimiter, loginAccountLimiter, (req, res) => {
  const { username, password } = req.body || {};
  if (typeof username !== 'string' || typeof password !== 'string' || !username.trim() || !password || username.length > 256 || password.length > 1024) return res.status(400).json({ message: 'Enter a valid admin username and password.' });
  const configuredUsername = process.env.ADMIN_USERNAME;
  const configuredPassword = process.env.ADMIN_PASSWORD;

  if (!configuredUsername || !configuredPassword || !process.env.JWT_SECRET) {
    return res.status(503).json({ message: 'Password authentication is not configured' });
  }

  if (!matchesSecret(username.trim(), configuredUsername) || !matchesSecret(password, configuredPassword)) {
    return res.status(401).json({ message: 'Invalid admin username or password' });
  }

  const token = signAdminToken({ sub: `password-admin:${configuredUsername}`, username: configuredUsername });

  res.json({ token, admin: { username: configuredUsername } });
});

router.post('/google-login', loginIpLimiter, async (req, res) => {
  try {
    const { credential } = req.body || {};
    if (typeof credential !== 'string' || !credential || credential.length > 10000 || !process.env.GOOGLE_CLIENT_ID || !process.env.JWT_SECRET) {
      return res.status(400).json({ message: 'Google authentication is not configured' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    const email = payload?.email?.toLowerCase();
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

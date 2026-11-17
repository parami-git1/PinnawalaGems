const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const { loginIpLimiter, loginAccountLimiter } = require('../middleware/security');

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function getAllowedEmails() {
  return (process.env.ADMIN_GOOGLE_EMAILS || process.env.ADMIN_EMAIL || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

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

  const token = jwt.sign(
    { sub: `password-admin:${configuredUsername}`, username: configuredUsername },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

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
    const allowedEmails = getAllowedEmails();

    if (!payload?.email_verified || !email || !allowedEmails.includes(email)) {
      return res.status(403).json({ message: 'This Google account is not authorized as an admin' });
    }

    const token = jwt.sign(
      { sub: payload.sub, email, name: payload.name || '' },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ token, admin: { email, name: payload.name || '' } });
  } catch (error) {
    res.status(401).json({ message: 'Unable to verify Google account' });
  }
});

module.exports = router;

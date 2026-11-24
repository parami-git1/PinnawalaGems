// Authentication configuration is read for every request so removing an
// account or disabling password access also revokes its existing JWT access.
function normalizeEmail(value) {
  if (typeof value !== 'string') return '';
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(email)) return '';
  return email;
}

function adminAuthPolicy() {
  const mode = (process.env.ADMIN_AUTH_MODE || 'mixed').trim().toLowerCase();
  const singleOwner = (process.env.ADMIN_GOOGLE_EMAIL || '').trim();
  const source = singleOwner || (process.env.ADMIN_GOOGLE_EMAILS || process.env.ADMIN_EMAIL || '');
  const addresses = source.split(',').map(value => value.trim()).filter(Boolean);
  const emails = addresses.map(normalizeEmail);
  const validEmails = emails.length > 0 && emails.every(Boolean);
  const googleClientId = (process.env.GOOGLE_CLIENT_ID || '').trim();
  const hasClient = googleClientId.length > 0 && googleClientId.length <= 512;
  const hasSecret = typeof process.env.JWT_SECRET === 'string' && Boolean(process.env.JWT_SECRET);
  const strictOwner = Boolean(singleOwner) && addresses.length === 1 && validEmails && /^[a-z0-9][a-z0-9.+_-]*@gmail\.com$/.test(emails[0]);
  const valid = mode === 'mixed' || (mode === 'google' && strictOwner);
  const passwordEnabled = valid && mode === 'mixed' && hasSecret
    && Boolean(process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD);
  const googleEnabled = valid && hasClient && hasSecret && validEmails;
  return { mode, valid, passwordEnabled, googleEnabled, googleClientId: googleEnabled ? googleClientId : '', googleEmails: googleEnabled ? [...new Set(emails)] : [] };
}

function publicAuthOptions() {
  const { passwordEnabled, googleEnabled, googleClientId } = adminAuthPolicy();
  return { passwordEnabled, googleEnabled, googleClientId };
}

function identityAllowed(claims) {
  const policy = adminAuthPolicy();
  if (!policy.valid) return false;
  const email = normalizeEmail(claims.email);
  const google = policy.googleEnabled && email && policy.googleEmails.includes(email)
    && claims.username === undefined && !claims.sub.startsWith('password-admin:');
  const password = policy.passwordEnabled && claims.email === undefined
    && claims.username === process.env.ADMIN_USERNAME && claims.sub === `password-admin:${process.env.ADMIN_USERNAME}`;
  return Boolean(google || password);
}

module.exports = { normalizeEmail, adminAuthPolicy, publicAuthOptions, identityAllowed };

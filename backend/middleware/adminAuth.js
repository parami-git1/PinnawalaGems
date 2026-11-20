const { verifyAdminToken } = require('../utils/adminSession');

function requireAdmin(req, res, next) {
  res.set('Cache-Control', 'no-store');
  res.vary('Authorization');
  const authorization = req.headers.authorization || '';
  const token = typeof authorization === 'string' ? /^Bearer ([^\s]+)$/i.exec(authorization)?.[1] : null;

  if (!token) {
    return res.status(401).json({ message: 'Admin authentication required' });
  }

  try {
    req.admin = verifyAdminToken(token);
    next();
  } catch (error) {
    return res.status(error.status === 403 ? 403 : 401).json({ message: error.status === 403 ? 'Administrator access is required' : 'Invalid or expired admin token' });
  }
}

module.exports = requireAdmin;

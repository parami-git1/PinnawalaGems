const jwt = require('jsonwebtoken');

function requireAdmin(req, res, next) {
  const authorization = req.headers.authorization || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Admin authentication required' });
  }

  try {
    req.admin = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'], maxAge: '8h', clockTolerance: 5 });
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired admin token' });
  }
}

module.exports = requireAdmin;

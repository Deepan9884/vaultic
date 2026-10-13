const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ success: false, message: 'Missing token' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'changeme');
    req.user = { id: String(payload.id || payload.sub), role: payload.role || 'employee', team: payload.team || 'general' };
    if (!req.user.id || req.user.id === 'undefined') {
      return res.status(401).json({ success: false, message: 'Invalid token payload' });
    }
    return next();
  } catch (e) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    return next();
  };
}

module.exports = { authenticate, authorize };

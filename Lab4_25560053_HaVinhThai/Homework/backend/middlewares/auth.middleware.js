const jwt = require('jsonwebtoken');

// Reads "Authorization: Bearer <token>" and verifies it; sets req.user = { id, type, iat, exp }
function protect(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ success: false, message: 'Please log in first' });
  }
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

// Must run after protect: a valid token whose role is not admin gets 403
function adminOnly(req, res, next) {
  if (req.user.type !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: only admin users can perform this action.'
    });
  }
  next();
}

module.exports = { protect, adminOnly };

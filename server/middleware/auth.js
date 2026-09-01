const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'wastewatch_jwt_secret_key_2026_super_secure';

async function getUserById(userId) {
  if (db.isMysqlActive) {
    const [rows] = await db.getPool().query('SELECT id, name, email, role, avatar, bio, phone, status, created_at FROM users WHERE id = ?', [userId]);
    return rows[0] || null;
  }
  const user = db.fallbackStore.data.users.find(u => Number(u.id) === Number(userId));
  if (!user) return null;
  const { password_hash, ...safeUser } = user;
  return safeUser;
}

async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await getUserById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User account not found or expired.' });
    }

    if (user.status === 'banned') {
      return res.status(403).json({ success: false, message: 'Your account has been suspended by an administrator.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired authentication session.' });
  }
}

async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await getUserById(decoded.id);
      if (user && user.status !== 'banned') {
        req.user = user;
      }
    }
  } catch (err) {
    // Continue anonymously
  }
  next();
}

function requireRole(roles) {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. You need ${allowedRoles.join(' or ')} privileges to perform this action.`
      });
    }
    next();
  };
}

module.exports = {
  requireAuth,
  optionalAuth,
  requireRole,
  JWT_SECRET,
  getUserById
};

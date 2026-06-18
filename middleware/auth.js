const jwt = require('jsonwebtoken');

// Bouncer 1: Check if they have a valid wristband (JWT)
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).json({ error: 'No wristband. Access denied.' });

  try {
    // Clean the token format
    const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;
    const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET || 'fallback_secret');
    req.user = decoded; // Attach user info to the request
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Fake or expired wristband.' });
  }
};

// Bouncer 2: VIP list (Role-Based Access Control)
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'VIPs only. Admin access required.' });
  }
};

module.exports = { verifyToken, requireAdmin };

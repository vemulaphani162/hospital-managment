const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    
    const dbUser = await User.findByEmail(user.email);
    if (!dbUser) return res.status(403).json({ error: 'User not found' });
    
    req.user = dbUser;
    next();
  });
};

module.exports = { authenticateToken };

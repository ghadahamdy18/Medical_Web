const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const TokenBlacklist = require('../models/tokenBlacklist.model');

const authMiddleware = async (req, res, next) => {
  try {
    // 1. Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const token = authHeader.split(' ')[1];


    const blacklistedToken = await TokenBlacklist.findOne({ token });

    if (blacklistedToken) {
      return res.status(401).json({
        success: false,
        message: 'Token has been logged out. Please login again.',
      });
    }




    // 2. Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Token expired. Please login again.' });
      }
      return res.status(401).json({ success: false, message: 'Invalid token.' });
    }

    // 3. Find user
    const user = await User.findById(decoded.id).select('-password -otp');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User no longer exists.' });
    }

    // 4. Check account status
    if (user.isBlocked()) {
      return res.status(403).json({
        success: false,
        message: 'Account is blocked or inactive. Please contact admin.',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = authMiddleware;

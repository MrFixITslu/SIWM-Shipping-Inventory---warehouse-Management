

const jwt = require('jsonwebtoken');
const { findUserById } = require('../services/userService');
const { ALL_ROLES } = require('../config/roles');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query.token) { // Check for token in query parameter for SSE
    token = req.query.token;
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
    return;
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from the token
    const user = await findUserById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }
    req.user = user;

    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

// Middleware for role-based access
const authorize = (...roles) => {
  return (req, res, next) => {
    // Validate that the roles passed to the middleware are valid system roles
    const invalidRoles = roles.filter(r => !ALL_ROLES.includes(r));
    if (invalidRoles.length > 0) {
      console.error(`FATAL: Invalid role(s) used in 'authorize' middleware: ${invalidRoles.join(', ')}. Check route definitions.`);
      return res.status(500).json({ message: 'Internal Server Error: Invalid authorization configuration.' });
    }

    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: `User group '${req.user ? req.user.role : 'guest'}' is not authorized to access this route` });
    }
    next();
  };
};


module.exports = { protect, authorize };
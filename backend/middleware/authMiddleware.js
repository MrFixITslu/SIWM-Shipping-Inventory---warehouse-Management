

const jwt = require('jsonwebtoken');
const { findUserById } = require('../services/userService');
const { ALL_ROLES } = require('../config/roles');

// Token validation cache to prevent timing attacks
const tokenValidationCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    // Check cache first to prevent timing attacks
    const cacheKey = `token_${token.substring(0, 20)}`;
    const cachedResult = tokenValidationCache.get(cacheKey);
    
    if (cachedResult && Date.now() - cachedResult.timestamp < CACHE_TTL) {
      if (cachedResult.valid) {
        req.user = cachedResult.user;
        return next();
      } else {
        return res.status(401).json({ message: 'Not authorized, invalid token' });
      }
    }

    // Verify token with proper error handling
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      // Cache invalid token to prevent timing attacks
      tokenValidationCache.set(cacheKey, { valid: false, timestamp: Date.now() });
      
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired, please log in again' });
      } else if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Invalid token format' });
      } else {
        return res.status(401).json({ message: 'Token verification failed' });
      }
    }

    // Validate token payload
    if (!decoded.id || typeof decoded.id !== 'number') {
      tokenValidationCache.set(cacheKey, { valid: false, timestamp: Date.now() });
      return res.status(401).json({ message: 'Invalid token payload' });
    }

    // Get user from the token
    const user = await findUserById(decoded.id);
    if (!user) {
      tokenValidationCache.set(cacheKey, { valid: false, timestamp: Date.now() });
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }

    // Check if user is active
    if (user.status !== 'active') {
      tokenValidationCache.set(cacheKey, { valid: false, timestamp: Date.now() });
      return res.status(401).json({ message: 'Account is not active' });
    }

    // Check for forced re-login (token invalidation)
    if (user.token_invalidated_at) {
      const tokenIssuedAt = decoded.iat ? decoded.iat * 1000 : 0; // JWT iat is in seconds
      const invalidatedAt = new Date(user.token_invalidated_at).getTime();
      if (tokenIssuedAt < invalidatedAt) {
        tokenValidationCache.set(cacheKey, { valid: false, timestamp: Date.now() });
        return res.status(401).json({ message: 'Session expired due to role or permission change. Please log in again.' });
      }
    }

    // Cache valid token
    tokenValidationCache.set(cacheKey, { 
      valid: true, 
      user, 
      timestamp: Date.now() 
    });

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ message: 'Internal server error during authentication' });
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

    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `User group '${req.user.role}' is not authorized to access this route` 
      });
    }
    
    next();
  };
};

// Clean up expired cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of tokenValidationCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      tokenValidationCache.delete(key);
    }
  }
}, CACHE_TTL);

module.exports = { protect, authorize };
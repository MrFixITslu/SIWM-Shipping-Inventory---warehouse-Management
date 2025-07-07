
const jwt = require('jsonwebtoken');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '30d', // Token expires in 30 days. 
    // Note on Security: For production applications, access tokens typically have a much shorter lifespan 
    // (e.g., 15-60 minutes) and are used in conjunction with refresh tokens for better security.
    // A refresh token (longer-lived) would be stored securely (e.g., HttpOnly cookie) and used
    // to obtain new access tokens without requiring the user to log in again frequently.
    // This current setup is simpler but less secure against token theft if an access token is compromised,
    // as it remains valid for a longer period.
  });
};

module.exports = generateToken;
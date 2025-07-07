
// backend/utils/idGenerator.js

/**
 * Generates a simple, non-cryptographically secure unique ID.
 * Good for temporary client-side IDs before an item is saved to the database.
 * @param {string} [prefix=''] - An optional prefix for the ID.
 * @returns {string} A unique string ID.
 */
function generateSimpleId(prefix = '') {
  // Combine timestamp with a random number to reduce collision probability
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 9);
  return `${prefix}${timestamp}${randomPart}`;
}

module.exports = {
  generateSimpleId,
};

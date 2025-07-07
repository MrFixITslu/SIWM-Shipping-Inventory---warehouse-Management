// backend/utils/dbMappers.js

/**
 * Converts a snake_case or kebab-case string to camelCase.
 * @param {string} s The string to convert.
 * @returns {string} The camelCase string.
 */
const toCamel = (s) => {
  if (typeof s !== 'string') return s;
  return s.replace(/([-_][a-z])/ig, ($1) => {
    return $1.toUpperCase()
      .replace('-', '')
      .replace('_', '');
  });
};

/**
 * Converts a camelCase string to snake_case.
 * @param {string} s The string to convert.
 * @returns {string} The snake_case string.
 */
const toSnake = (s) => {
    if (typeof s !== 'string') return s;
    return s.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * Recursively maps the keys of an object or an array of objects.
 * @param {object|object[]} obj The object or array to map.
 * @param {function} transformer The key transformation function (e.g., toCamel, toSnake).
 * @returns {object|object[]} The new object or array with transformed keys.
 */
const mapKeys = (obj, transformer) => {
  if (Array.isArray(obj)) {
    return obj.map(i => mapKeys(i, transformer));
  }
  if (obj === null || typeof obj !== 'object' || obj instanceof Date) {
    return obj;
  }
  const newObj = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      newObj[transformer(key)] = mapKeys(obj[key], transformer);
    }
  }
  return newObj;
};

const mapToCamel = (obj) => mapKeys(obj, toCamel);
const mapToSnake = (obj) => mapKeys(obj, toSnake);

module.exports = { mapToCamel, mapToSnake, toCamel, toSnake };

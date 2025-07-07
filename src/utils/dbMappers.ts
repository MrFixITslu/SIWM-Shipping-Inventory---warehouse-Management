// utils/dbMappers.ts

/**
 * Converts a snake_case or kebab-case string to camelCase.
 * @param s The string to convert.
 * @returns The camelCase string.
 */
const toCamel = (s: string): string => {
  if (typeof s !== 'string') return s;
  return s.replace(/([-_][a-z])/ig, ($1) => {
    return $1.toUpperCase()
      .replace('-', '')
      .replace('_', '');
  });
};

/**
 * Recursively maps the keys of an object or an array of objects to camelCase.
 * @param obj The object or array to map.
 * @returns The new object or array with camelCase keys.
 */
export const mapToCamel = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(v => mapToCamel(v));
  }
  if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
    return Object.keys(obj).reduce((result, key) => {
      result[toCamel(key)] = mapToCamel(obj[key]);
      return result;
    }, {} as {[key: string]: any});
  }
  return obj;
};
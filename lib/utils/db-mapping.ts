/**
 * Utility functions to map between Prisma camelCase and Supabase snake_case
 */

// Convert camelCase to snake_case
export function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

// Convert snake_case to camelCase
export function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

// Convert an object's keys from camelCase to snake_case
export function objectToSnakeCase(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      const snakeKey = toSnakeCase(key);
      
      if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        result[snakeKey] = objectToSnakeCase(value);
      } else {
        result[snakeKey] = value;
      }
    }
  }
  
  return result;
}

// Convert an object's keys from snake_case to camelCase
export function objectToCamelCase(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      const camelKey = toCamelCase(key);
      
      if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        result[camelKey] = objectToCamelCase(value);
      } else {
        result[camelKey] = value;
      }
    }
  }
  
  return result;
}
export const ensureArray = <T>(value: T | T[] | undefined): T[] => {
  if (Array.isArray(value)) {
    return value;
  }
  if (value === undefined || value === null) {
    return [];
  }
  return [value] as T[]; // If it's a single value, wrap it in an array
};
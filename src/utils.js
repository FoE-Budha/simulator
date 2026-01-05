export function uuid(prefix = "") {
  return prefix + Math.random().toString(36).slice(2,8);
}

export function rectsOverlap(a, b) {
  return !(
    a.x + a.w <= b.x ||
    b.x + b.w <= a.x ||
    a.y + a.h <= b.y ||
    b.y + b.h <= a.y
  );
}

export function nowTimestamp() {
  return new Date().toISOString();
}


/**
 * Format a number with thousands separators
 * Simple version for thousands separation only
 */
export const formatNumber = (num) => {
  if (num == null || isNaN(num)) return "0";
  
  // Convert to number if it's a string
  const number = typeof num === 'string' ? parseFloat(num) : num;
  
  // Basic thousands separator
  return number.toLocaleString('en-US');
};
export function sanitizePlayerName(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * Ban names that start with "rahul" including variants like "raahul", "raaahul", etc.
 * Case-insensitive; leading/trailing spaces ignored.
 */
export function isBannedPlayerName(name: string): boolean {
  const n = name.trim().toLowerCase();
  return /^ra+hul/.test(n);
}

export const BANNED_NAME_ERROR = "Names starting with 'rahul' are not allowed.";

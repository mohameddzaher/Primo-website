// ============================================
// PRIMO API - Regex helpers
// ============================================

/**
 * Escape regex metacharacters so user input is matched LITERALLY.
 *
 * Every admin/storefront search box feeds `$regex`. Without escaping:
 *   - a lone "(" or "[" builds an invalid RegExp → a 500 on a normal typo
 *   - ".*" matches every document, leaking the whole collection
 *   - a nested quantifier like "(a+)+" is a ReDoS against the API process
 *
 * The Mongo-operator sanitiser mounted in index.ts strips `$`-prefixed KEYS.
 * It does not — and cannot — neutralise regex syntax inside a string VALUE,
 * so every `$regex` built from request input must go through this.
 */
export function escapeRegex(input: unknown): string {
  return String(input ?? '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Build a safe case-insensitive "contains" matcher for a search box.
 * Returns undefined for blank input so callers can skip the condition.
 */
export function containsInsensitive(input: unknown): RegExp | undefined {
  const escaped = escapeRegex(input).trim();
  if (!escaped) return undefined;
  return new RegExp(escaped, 'i');
}

// ============================================
// PRIMO API - Response Cache Middleware
// ============================================
// Public, read-heavy endpoints (categories, brands, CMS, settings, banners,
// product listings) are hit on every storefront page load. Each one costs a
// round trip to MongoDB Atlas (~80-250ms), and the homepage alone fires ~20 of
// them. This in-process TTL cache serves repeat reads in ~0ms and also sets
// Cache-Control so the browser/CDN can skip the request entirely.
//
// Writes invalidate by prefix (see invalidateCache) so the storefront always
// reflects admin changes immediately instead of waiting for the TTL.

import { Request, Response, NextFunction } from 'express';

interface CacheEntry {
  body: any;
  expiresAt: number;
}

const store = new Map<string, CacheEntry>();

// Hard cap so a long-running process can't grow unbounded from query-string variants
const MAX_ENTRIES = 500;

function pruneIfNeeded() {
  if (store.size <= MAX_ENTRIES) return;
  const now = Date.now();
  // Drop expired first
  for (const [k, v] of store) {
    if (v.expiresAt <= now) store.delete(k);
  }
  // Still too big — evict oldest insertions (Map preserves insertion order)
  while (store.size > MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    if (oldest === undefined) break;
    store.delete(oldest);
  }
}

/**
 * Cache a GET response in memory for `ttlSeconds`.
 * `tag` groups entries so related writes can invalidate them together.
 */
export function cacheResponse(tag: string, ttlSeconds = 60) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') return next();

    const key = `${tag}:${req.originalUrl}`;
    const hit = store.get(key);
    const now = Date.now();

    // Cache-Control policy: the expensive part is the MongoDB round trip, and
    // the in-process cache above already removes it (~200ms -> ~2ms). Letting
    // the BROWSER hold the response too buys almost nothing and actively hurts:
    // this data is admin-editable, and a private browser cache cannot be purged
    // by invalidateOnWrite(), so an edit would keep showing the old content to
    // that visitor until their copy expired.
    //
    // So: browsers must revalidate every time (cheap — we answer from memory),
    // while shared caches / CDNs may still serve it for the TTL via s-maxage.
    const cacheControl = `public, max-age=0, must-revalidate, s-maxage=${ttlSeconds}`;

    if (hit && hit.expiresAt > now) {
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('Cache-Control', cacheControl);
      return res.json(hit.body);
    }

    res.setHeader('X-Cache', 'MISS');
    res.setHeader('Cache-Control', cacheControl);

    // Intercept res.json to store the payload once the handler produces it
    const originalJson = res.json.bind(res);
    (res as any).json = (body: any) => {
      // Only cache successful payloads
      if (res.statusCode >= 200 && res.statusCode < 300) {
        store.set(key, { body, expiresAt: Date.now() + ttlSeconds * 1000 });
        pruneIfNeeded();
      }
      return originalJson(body);
    };

    next();
  };
}

/**
 * Drop every cached entry whose tag matches one of `tags`.
 * Call this from admin write handlers so the storefront updates instantly.
 */
export function invalidateCache(...tags: string[]): void {
  if (!tags.length) {
    store.clear();
    return;
  }
  for (const key of Array.from(store.keys())) {
    const keyTag = key.slice(0, key.indexOf(':'));
    if (tags.includes(keyTag)) store.delete(key);
  }
}

/**
 * Router-level guard: after any successful non-GET request, drop the cached
 * entries for `tags`. Mount once per router (before the route handlers) so
 * every create/update/delete keeps the storefront in sync automatically.
 */
export function invalidateOnWrite(...tags: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'GET') return next();

    const originalJson = res.json.bind(res);
    (res as any).json = (body: any) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        invalidateCache(...tags);
      }
      return originalJson(body);
    };

    next();
  };
}

/** Exposed for diagnostics/tests */
export function cacheStats() {
  return { size: store.size };
}

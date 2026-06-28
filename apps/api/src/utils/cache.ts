// ============================================
// PRIMO API - Lightweight in-process TTL cache
// ============================================
//
// Zero-dependency cache for expensive, tolerably-stale reads (e.g. the admin
// analytics dashboard, which runs ~9 aggregations per load). Keeps the DB from
// being hammered when many admins/dashboards poll at once.
//
// NOTE: this is per-process. When you scale to multiple API instances, swap the
// implementation for a shared store (Redis) — keep the same `cached()` signature
// so call sites don't change.

interface Entry {
  value: any;
  expiresAt: number;
}

const store = new Map<string, Entry>();

// Periodically evict expired entries so the map can't grow unbounded.
const SWEEP_INTERVAL_MS = 60_000;
const sweeper = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.expiresAt <= now) store.delete(key);
  }
}, SWEEP_INTERVAL_MS);
sweeper.unref?.();

export function cacheGet<T>(key: string): T | undefined {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (entry.expiresAt <= Date.now()) {
    store.delete(key);
    return undefined;
  }
  return entry.value as T;
}

export function cacheSet(key: string, value: any, ttlMs: number): void {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

// Invalidate a single key or every key sharing a prefix (e.g. "dashboard:").
export function cacheInvalidate(prefix: string): void {
  for (const key of store.keys()) {
    if (key === prefix || key.startsWith(prefix)) store.delete(key);
  }
}

// Wrap an async producer: returns the cached value when fresh, otherwise runs
// `fn`, stores the result, and returns it. Concurrent callers for the same key
// share the same in-flight promise so the expensive work runs only once.
const inflight = new Map<string, Promise<any>>();

export async function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const hit = cacheGet<T>(key);
  if (hit !== undefined) return hit;

  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;

  const promise = (async () => {
    try {
      const value = await fn();
      cacheSet(key, value, ttlMs);
      return value;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, promise);
  return promise;
}

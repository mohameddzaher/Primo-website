// ============================================
// PRIMO WEB - API base URLs
// ============================================
// There are two different answers to "where is the API?", and using the wrong
// one breaks in ways that are annoying to debug.
//
//  - The BROWSER uses NEXT_PUBLIC_API_URL. In a single-service deployment this
//    is the relative path '/api/proxy', which Next rewrites to the API running
//    beside it in the same container. Relative keeps everything same-origin,
//    so there is no CORS to configure at all.
//
//  - The SERVER (server components, sitemap, metadata) cannot fetch a relative
//    URL — there is no origin to resolve it against, and `fetch('/api/...')`
//    throws. It needs an absolute address, and it should talk to the API
//    directly over localhost rather than looping back out through the public
//    hostname.
//
// Hence API_INTERNAL_URL: server-only, always absolute.

const publicUrl = process.env.NEXT_PUBLIC_API_URL;

/**
 * Absolute API base for server-side fetches. Falls back to the public URL only
 * when that is itself absolute — a relative public URL is unusable here.
 */
export const SERVER_API_URL =
  process.env.API_INTERNAL_URL ||
  (publicUrl && /^https?:\/\//i.test(publicUrl) ? publicUrl : 'http://localhost:5005/api/v1');

/** API base for browser requests. May be relative. */
export const BROWSER_API_URL = publicUrl || 'http://localhost:5005/api/v1';

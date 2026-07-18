// ============================================
// Response cache middleware tests
// ============================================
// The storefront was issuing ~20 uncached requests per page load, each costing
// a MongoDB Atlas round trip. These tests pin the cache's correctness: it must
// serve repeat reads, never cache errors, and drop entries the moment an admin
// writes — otherwise the storefront would show stale prices or stock.

import { Request, Response, NextFunction } from 'express';
import { cacheResponse, invalidateCache, invalidateOnWrite } from '../middleware/cache';

function mockRes() {
  const res: any = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: undefined as any,
    setHeader(k: string, v: string) {
      this.headers[k.toLowerCase()] = v;
    },
    json(body: any) {
      this.body = body;
      return this;
    },
  };
  return res as Response & { headers: Record<string, string>; body: any; statusCode: number };
}

function get(url: string) {
  return { method: 'GET', originalUrl: url } as unknown as Request;
}

describe('cacheResponse', () => {
  beforeEach(() => invalidateCache());

  it('misses first, then serves a hit without invoking the handler again', () => {
    const mw = cacheResponse('products', 60);

    const res1 = mockRes();
    const next1 = jest.fn(() => res1.json({ data: 'from-db' })) as unknown as NextFunction;
    mw(get('/api/v1/products?limit=8'), res1, next1);
    expect(next1).toHaveBeenCalledTimes(1);
    expect(res1.headers['x-cache']).toBe('MISS');

    const res2 = mockRes();
    const next2 = jest.fn() as unknown as NextFunction;
    mw(get('/api/v1/products?limit=8'), res2, next2);
    // The handler must NOT run — this is the whole point (no DB round trip).
    expect(next2).not.toHaveBeenCalled();
    expect(res2.headers['x-cache']).toBe('HIT');
    expect(res2.body).toEqual({ data: 'from-db' });
  });

  it('treats different query strings as different entries', () => {
    const mw = cacheResponse('products', 60);

    const resA = mockRes();
    mw(get('/api/v1/products?limit=8'), resA, (() =>
      resA.json({ page: 1 })) as unknown as NextFunction);

    const resB = mockRes();
    const nextB = jest.fn(() => resB.json({ page: 2 })) as unknown as NextFunction;
    mw(get('/api/v1/products?limit=8&page=2'), resB, nextB);

    expect(nextB).toHaveBeenCalled(); // different URL => must miss
    expect(resB.headers['x-cache']).toBe('MISS');
  });

  it('never caches a non-2xx response', () => {
    const mw = cacheResponse('products', 60);

    const res1 = mockRes();
    res1.statusCode = 500;
    mw(get('/api/v1/products'), res1, (() =>
      res1.json({ error: 'boom' })) as unknown as NextFunction);

    const res2 = mockRes();
    const next2 = jest.fn(() => res2.json({ ok: true })) as unknown as NextFunction;
    mw(get('/api/v1/products'), res2, next2);

    expect(next2).toHaveBeenCalled(); // the error must not have been stored
    expect(res2.headers['x-cache']).toBe('MISS');
  });

  it('sets a Cache-Control header so the browser can skip the request', () => {
    const mw = cacheResponse('categories', 120);
    const res = mockRes();
    mw(get('/api/v1/categories'), res, (() => res.json({ ok: 1 })) as unknown as NextFunction);
    expect(res.headers['cache-control']).toContain('max-age=120');
  });

  it('does not cache non-GET requests', () => {
    const mw = cacheResponse('products', 60);
    const req = { method: 'POST', originalUrl: '/api/v1/products' } as unknown as Request;
    const res = mockRes();
    const next = jest.fn() as unknown as NextFunction;
    mw(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.headers['x-cache']).toBeUndefined();
  });
});

describe('cache invalidation — admin writes must surface immediately', () => {
  beforeEach(() => invalidateCache());

  it('invalidateCache drops only the named tag', () => {
    const products = cacheResponse('products', 60);
    const categories = cacheResponse('categories', 60);

    const p1 = mockRes();
    products(get('/api/v1/products'), p1, (() => p1.json({ v: 1 })) as unknown as NextFunction);
    const c1 = mockRes();
    categories(get('/api/v1/categories'), c1, (() => c1.json({ v: 1 })) as unknown as NextFunction);

    invalidateCache('products');

    const p2 = mockRes();
    const pNext = jest.fn(() => p2.json({ v: 2 })) as unknown as NextFunction;
    products(get('/api/v1/products'), p2, pNext);
    expect(pNext).toHaveBeenCalled(); // products was dropped

    const c2 = mockRes();
    const cNext = jest.fn() as unknown as NextFunction;
    categories(get('/api/v1/categories'), c2, cNext);
    expect(cNext).not.toHaveBeenCalled(); // categories untouched
  });

  it('invalidateOnWrite clears the tag after a successful write', () => {
    const products = cacheResponse('products', 60);

    const seed = mockRes();
    products(get('/api/v1/products'), seed, (() =>
      seed.json({ stale: true })) as unknown as NextFunction);

    // Simulate an admin PATCH going through the router-level guard
    const guard = invalidateOnWrite('products');
    const writeReq = { method: 'PATCH', originalUrl: '/api/v1/products/1' } as unknown as Request;
    const writeRes = mockRes();
    guard(writeReq, writeRes, (() => writeRes.json({ success: true })) as unknown as NextFunction);

    const after = mockRes();
    const afterNext = jest.fn(() => after.json({ stale: false })) as unknown as NextFunction;
    products(get('/api/v1/products'), after, afterNext);
    expect(afterNext).toHaveBeenCalled(); // cache was busted by the write
  });

  it('does NOT invalidate when the write failed', () => {
    const products = cacheResponse('products', 60);

    const seed = mockRes();
    products(get('/api/v1/products'), seed, (() =>
      seed.json({ v: 1 })) as unknown as NextFunction);

    const guard = invalidateOnWrite('products');
    const writeRes = mockRes();
    writeRes.statusCode = 400;
    guard(
      { method: 'POST', originalUrl: '/api/v1/products' } as unknown as Request,
      writeRes,
      (() => writeRes.json({ error: 'invalid' })) as unknown as NextFunction
    );

    const after = mockRes();
    const afterNext = jest.fn() as unknown as NextFunction;
    products(get('/api/v1/products'), after, afterNext);
    expect(afterNext).not.toHaveBeenCalled(); // still cached — write never happened
  });
});

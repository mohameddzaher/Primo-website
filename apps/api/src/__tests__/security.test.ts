// ============================================
// Security regression tests
// ============================================
// These cover vulnerabilities that were found and fixed in a security audit.
// They are deliberately dependency-free (no DB, no network) so they run fast
// in CI and fail loudly if anyone reintroduces the hole.

import { Request, Response, NextFunction } from 'express';
import { mongoSanitize } from '../middleware/validate';

function runSanitizer(payload: {
  body?: any;
  query?: any;
  params?: any;
}): { body: any; query: any; params: any } {
  const req = {
    body: payload.body ?? {},
    query: payload.query ?? {},
    params: payload.params ?? {},
  } as unknown as Request;

  const next = jest.fn() as unknown as NextFunction;
  mongoSanitize(req, {} as Response, next);
  expect(next).toHaveBeenCalled();

  return { body: req.body, query: req.query, params: req.params };
}

describe('mongoSanitize — NoSQL operator injection', () => {
  it('strips $-prefixed operators from the body', () => {
    // The real attack: POST /newsletter/unsubscribe {"email": {"$ne": null}}
    // matched an arbitrary subscriber and deleted them one call at a time.
    const { body } = runSanitizer({ body: { email: { $ne: null } } });
    expect(body.email).toEqual({});
    expect(body.email.$ne).toBeUndefined();
  });

  it('strips operators used to bypass a login lookup', () => {
    const { body } = runSanitizer({
      body: { email: { $gt: '' }, password: { $gt: '' } },
    });
    expect(body.email.$gt).toBeUndefined();
    expect(body.password.$gt).toBeUndefined();
  });

  it('strips dotted keys that could reach nested paths', () => {
    const { body } = runSanitizer({ body: { 'user.role': 'super_admin' } });
    expect(body['user.role']).toBeUndefined();
  });

  it('sanitizes query and params too, not just the body', () => {
    const { query, params } = runSanitizer({
      query: { sort: { $where: 'sleep(5000)' } },
      params: { id: { $ne: '1' } },
    });
    expect(query.sort.$where).toBeUndefined();
    expect(params.id.$ne).toBeUndefined();
  });

  it('recurses into nested objects and arrays', () => {
    const { body } = runSanitizer({
      body: { filter: { nested: { $ne: 1 } }, list: [{ $gt: 2 }, { ok: 'yes' }] },
    });
    expect(body.filter.nested.$ne).toBeUndefined();
    expect(body.list[0].$gt).toBeUndefined();
    expect(body.list[1].ok).toBe('yes');
  });

  it('leaves ordinary user input completely untouched', () => {
    const { body } = runSanitizer({
      body: {
        email: 'customer@example.com',
        quantity: 3,
        price: 1499.5,
        title: 'Samsung Fridge — 387L',
        nested: { sku: 'ABC-123', tags: ['a', 'b'] },
        nothing: null,
      },
    });
    expect(body).toEqual({
      email: 'customer@example.com',
      quantity: 3,
      price: 1499.5,
      title: 'Samsung Fridge — 387L',
      nested: { sku: 'ABC-123', tags: ['a', 'b'] },
      nothing: null,
    });
  });
});

describe('config — JWT secret hardening', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  function loadValidateConfig() {
    // The real apps/api/.env would otherwise be loaded here and repopulate the
    // very variables these tests are trying to remove — stub dotenv so each
    // case sees exactly the environment it set up.
    jest.doMock('dotenv', () => ({ config: jest.fn(), default: { config: jest.fn() } }));
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('../config').validateConfig as () => void;
  }

  it('refuses to boot in production when JWT secrets are missing', () => {
    process.env.NODE_ENV = 'production';
    process.env.MONGODB_URI = 'mongodb://localhost:27017/primo';
    delete process.env.JWT_ACCESS_SECRET;
    delete process.env.JWT_REFRESH_SECRET;

    expect(() => loadValidateConfig()()).toThrow(/Missing required environment variables/);
  });

  it('refuses to boot in production with the published placeholder secrets', () => {
    process.env.NODE_ENV = 'production';
    process.env.MONGODB_URI = 'mongodb://localhost:27017/primo';
    process.env.JWT_ACCESS_SECRET = 'default-access-secret-change-in-production';
    process.env.JWT_REFRESH_SECRET = 'default-refresh-secret-change-in-production';

    expect(() => loadValidateConfig()()).toThrow(/placeholder/i);
  });

  it('refuses identical access and refresh secrets in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.MONGODB_URI = 'mongodb://localhost:27017/primo';
    const same = 'x'.repeat(48);
    process.env.JWT_ACCESS_SECRET = same;
    process.env.JWT_REFRESH_SECRET = same;

    expect(() => loadValidateConfig()()).toThrow(/must be different/i);
  });

  it('refuses short secrets in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.MONGODB_URI = 'mongodb://localhost:27017/primo';
    process.env.JWT_ACCESS_SECRET = 'too-short';
    process.env.JWT_REFRESH_SECRET = 'also-short-but-different';

    expect(() => loadValidateConfig()()).toThrow(/at least 32 characters/i);
  });

  it('accepts strong, distinct secrets in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.MONGODB_URI = 'mongodb://localhost:27017/primo';
    process.env.JWT_ACCESS_SECRET = 'a'.repeat(48);
    process.env.JWT_REFRESH_SECRET = 'b'.repeat(48);

    expect(() => loadValidateConfig()()).not.toThrow();
  });
});

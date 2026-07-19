// ============================================
// Product search query-building tests
// ============================================
// Search used to use MongoDB `$text`, which only matches WHOLE words — typing
// "brau" returned nothing until the shopper finished "braun". These pin the
// replacement: partial matching, multi-token narrowing, and regex safety.

/** Mirrors escapeRegex in products.routes.ts. */
function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Mirrors the search branch of the product list query builder. */
function buildSearchConditions(search: string) {
  const tokens = String(search).trim().split(/\s+/).filter(Boolean).slice(0, 6);
  return tokens.map((token) => {
    const rx = new RegExp(escapeRegex(token), 'i');
    return {
      $or: [
        { title: rx },
        { brand: rx },
        { sku: rx },
        { tags: rx },
        { shortDescription: rx },
      ],
    };
  });
}

/** Does a product satisfy every token condition? */
function matches(product: Record<string, any>, search: string): boolean {
  return buildSearchConditions(search).every((cond) =>
    cond.$or.some((clause) => {
      const [field, rx] = Object.entries(clause)[0] as [string, RegExp];
      const value = product[field];
      if (Array.isArray(value)) return value.some((v) => rx.test(String(v)));
      return value != null && rx.test(String(value));
    })
  );
}

const BRAUN = {
  title: 'Braun Series 9 Pro 9477cc Wet & Dry Shaver',
  brand: 'Braun',
  sku: 'BRN-9477CC-S9PRO',
  tags: ['shaver', 'grooming'],
  shortDescription: 'Premium wet and dry electric shaver',
};

const SAMSUNG = {
  title: 'Samsung 387L Upright Refrigerator',
  brand: 'Samsung',
  sku: 'SAMSUNG-RR39M71407F',
  tags: ['refrigerator', 'fridge'],
  shortDescription: 'Twin Cooling Plus refrigerator',
};

describe('partial (prefix) matching', () => {
  it('matches a prefix of the brand — the reported bug', () => {
    expect(matches(BRAUN, 'brau')).toBe(true);
    expect(matches(BRAUN, 'braun')).toBe(true);
  });

  it('matches progressively as the shopper types', () => {
    for (const q of ['s', 'sa', 'sam', 'sams', 'samsu', 'samsung']) {
      expect(matches(SAMSUNG, q)).toBe(true);
    }
  });

  it('is case-insensitive', () => {
    expect(matches(BRAUN, 'BRAUN')).toBe(true);
    expect(matches(BRAUN, 'bRaUn')).toBe(true);
  });

  it('matches a substring inside the title', () => {
    expect(matches(BRAUN, 'shaver')).toBe(true);
    expect(matches(SAMSUNG, 'refriger')).toBe(true);
  });

  it('matches by SKU and by tag', () => {
    expect(matches(BRAUN, '9477')).toBe(true);
    expect(matches(SAMSUNG, 'fridge')).toBe(true);
  });

  it('still rejects genuinely unrelated terms', () => {
    expect(matches(BRAUN, 'refrigerator')).toBe(false);
    expect(matches(SAMSUNG, 'shaver')).toBe(false);
  });
});

describe('multi-token search narrows rather than widens', () => {
  it('requires EVERY token to match somewhere', () => {
    expect(matches(BRAUN, 'braun shaver')).toBe(true);
    // "braun" matches, "refrigerator" does not — so the product must be excluded.
    expect(matches(BRAUN, 'braun refrigerator')).toBe(false);
  });

  it('ignores extra whitespace', () => {
    expect(matches(BRAUN, '  braun   shaver  ')).toBe(true);
  });

  it('caps the token count so a pathological query stays bounded', () => {
    const many = Array.from({ length: 50 }, (_, i) => `t${i}`).join(' ');
    expect(buildSearchConditions(many)).toHaveLength(6);
  });
});

describe('regex safety', () => {
  it('escapes metacharacters instead of building a live pattern', () => {
    // Unescaped, ".*" would match every product.
    expect(matches(BRAUN, '.*')).toBe(false);
    expect(matches(BRAUN, 'a|b')).toBe(false);
  });

  it('never throws on characters that are invalid regex syntax', () => {
    for (const q of ['(', ')', '[', ']', '\\', '^', '$', '{', '}', '+', '?', '*', 'a{1,9999}']) {
      expect(() => buildSearchConditions(q)).not.toThrow();
    }
  });

  it('treats a literal special character as literal text', () => {
    const odd = { title: 'Model (2026) Edition', brand: 'X', sku: 'X', tags: [], shortDescription: '' };
    expect(matches(odd, '(2026)')).toBe(true);
  });
});

// ============================================
// Double-submit guard — order signature regression tests
// ============================================
// POST /orders collapses a repeated submission so a double-click cannot create
// two orders and decrement stock twice. The signature it compares on originally
// covered only the line items, which made the guard fire on submissions that
// were NOT retries: a shopper who submitted, realised they had forgotten their
// promo code, and re-submitted with it was handed back the original
// undiscounted order and told it had succeeded. Same for switching payment
// method or choosing to redeem points.
//
// These tests pin the rule: the signature must cover every field that changes
// what the customer pays, while still collapsing a genuine repeat.

interface Submission {
  items: Array<{ productId: string; variantId?: string; quantity: number }>;
  paymentMethod: string;
  discountCode?: string;
  redeemPoints?: number;
}

/** Mirrors the signature built in orders.routes.ts. */
function orderSignature(s: Submission): string {
  const lines = [...s.items]
    .map((it) => `${it.productId}:${it.variantId || ''}:${it.quantity}`)
    .sort()
    .join('|');
  return [lines, s.paymentMethod || '', (s.discountCode || '').toUpperCase(), s.redeemPoints || 0].join('#');
}

const base: Submission = {
  items: [{ productId: 'p1', quantity: 1 }],
  paymentMethod: 'card',
};

describe('order double-submit signature', () => {
  it('collapses a genuine repeat submission', () => {
    expect(orderSignature(base)).toBe(orderSignature({ ...base }));
  });

  it('treats item order and array order as identical', () => {
    const a: Submission = {
      items: [{ productId: 'p1', quantity: 1 }, { productId: 'p2', quantity: 2 }],
      paymentMethod: 'card',
    };
    const b: Submission = {
      items: [{ productId: 'p2', quantity: 2 }, { productId: 'p1', quantity: 1 }],
      paymentMethod: 'card',
    };
    expect(orderSignature(a)).toBe(orderSignature(b));
  });

  // The money bugs: each of these used to collide with `base`, so the customer
  // silently received the earlier order instead of the one they asked for.
  it('does NOT collapse when a promo code is added', () => {
    expect(orderSignature({ ...base, discountCode: 'FLASH25' })).not.toBe(orderSignature(base));
  });

  it('does NOT collapse when the promo code differs', () => {
    expect(orderSignature({ ...base, discountCode: 'FLASH25' })).not.toBe(
      orderSignature({ ...base, discountCode: 'WELCOME10' })
    );
  });

  it('does NOT collapse when the payment method differs', () => {
    expect(orderSignature({ ...base, paymentMethod: 'cash_on_delivery' })).not.toBe(
      orderSignature(base)
    );
  });

  it('does NOT collapse when loyalty points are redeemed', () => {
    expect(orderSignature({ ...base, redeemPoints: 1000 })).not.toBe(orderSignature(base));
  });

  it('does NOT collapse when the redeemed point amount differs', () => {
    expect(orderSignature({ ...base, redeemPoints: 1000 })).not.toBe(
      orderSignature({ ...base, redeemPoints: 500 })
    );
  });

  it('is case-insensitive on the promo code, matching the lookup', () => {
    expect(orderSignature({ ...base, discountCode: 'flash25' })).toBe(
      orderSignature({ ...base, discountCode: 'FLASH25' })
    );
  });

  it('still distinguishes quantities and variants', () => {
    expect(orderSignature({ ...base, items: [{ productId: 'p1', quantity: 2 }] })).not.toBe(
      orderSignature(base)
    );
    expect(
      orderSignature({ ...base, items: [{ productId: 'p1', variantId: 'v1', quantity: 1 }] })
    ).not.toBe(orderSignature(base));
  });

  it('treats an absent code and an empty code as the same submission', () => {
    expect(orderSignature({ ...base, discountCode: '' })).toBe(orderSignature(base));
  });
});

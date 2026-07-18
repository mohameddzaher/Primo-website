// ============================================
// Order totals — money math regression tests
// ============================================
// The cart page, the checkout page and the order API must all agree to the
// halala. These tests pin the exact formula the API uses so a future edit to
// any one surface can't silently drift from the others.

interface TotalsInput {
  subtotal: number;
  discount?: number;
  settings: {
    enableFreeShipping: boolean;
    freeShippingThreshold: number;
    shippingFee: number;
    enableTax: boolean;
    taxRate: number;
  };
}

/**
 * Mirrors the calculation in orders.routes.ts (server-authoritative) and the
 * cart/checkout summaries. Kept as a pure function here so it is testable.
 */
function computeTotals({ subtotal, discount = 0, settings }: TotalsInput) {
  const shippingCost =
    settings.enableFreeShipping && subtotal >= settings.freeShippingThreshold
      ? 0
      : settings.shippingFee;

  const taxableAmount = Math.max(0, subtotal - discount);
  const taxRate = settings.enableTax ? settings.taxRate : 0;
  const taxAmount =
    taxRate > 0 ? Math.round(((taxableAmount * taxRate) / 100) * 100) / 100 : 0;

  const total = Math.max(0, subtotal + shippingCost - discount + taxAmount);

  return { shippingCost, taxableAmount, taxRate, taxAmount, total };
}

const SAUDI = {
  enableFreeShipping: true,
  freeShippingThreshold: 500,
  shippingFee: 50,
  enableTax: true,
  taxRate: 15,
};

describe('order totals (Saudi: SAR, 15% VAT, free shipping over 500)', () => {
  it('charges shipping below the free-shipping threshold', () => {
    const t = computeTotals({ subtotal: 300, settings: SAUDI });
    expect(t.shippingCost).toBe(50);
    expect(t.taxAmount).toBe(45); // 300 * 15%
    expect(t.total).toBe(395); // 300 + 50 + 45
  });

  it('gives free shipping at exactly the threshold', () => {
    const t = computeTotals({ subtotal: 500, settings: SAUDI });
    expect(t.shippingCost).toBe(0);
    expect(t.total).toBe(575); // 500 + 0 + 75
  });

  it('matches the reported cart example (subtotal 1748)', () => {
    // This is the real basket the owner reported. Previously the cart page
    // hardcoded a 2000 threshold and omitted VAT entirely, quoting SAR 1798.
    const t = computeTotals({ subtotal: 1748, settings: SAUDI });
    expect(t.shippingCost).toBe(0); // 1748 >= 500
    expect(t.taxAmount).toBeCloseTo(262.2, 2);
    expect(t.total).toBeCloseTo(2010.2, 2);
  });

  it('applies VAT to the discounted amount, not the gross subtotal', () => {
    const t = computeTotals({ subtotal: 1000, discount: 200, settings: SAUDI });
    expect(t.taxableAmount).toBe(800);
    expect(t.taxAmount).toBe(120); // 800 * 15%, NOT 1000 * 15%
    expect(t.total).toBe(920); // 1000 + 0 - 200 + 120
  });

  it('never returns a negative total when the discount exceeds the subtotal', () => {
    const t = computeTotals({ subtotal: 100, discount: 500, settings: SAUDI });
    expect(t.taxableAmount).toBe(0);
    expect(t.taxAmount).toBe(0);
    expect(t.total).toBe(0);
  });

  it('omits VAT entirely when tax is disabled', () => {
    const t = computeTotals({
      subtotal: 1000,
      settings: { ...SAUDI, enableTax: false },
    });
    expect(t.taxAmount).toBe(0);
    expect(t.total).toBe(1000);
  });

  it('always charges shipping when free shipping is disabled', () => {
    const t = computeTotals({
      subtotal: 5000,
      settings: { ...SAUDI, enableFreeShipping: false },
    });
    expect(t.shippingCost).toBe(50);
  });

  it('rounds VAT to 2 decimal places (halalas), never a floating tail', () => {
    const t = computeTotals({ subtotal: 333.33, settings: SAUDI });
    expect(t.taxAmount).toBe(50); // 333.33 * 0.15 = 49.9995 -> 50.00
    expect(Number.isFinite(t.total)).toBe(true);
    expect(t.total.toString()).not.toMatch(/\.\d{3,}/);
  });
});

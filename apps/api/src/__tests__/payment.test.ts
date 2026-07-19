// ============================================
// Payment gateway service tests
// ============================================
// The webhook is the ONLY thing that can move an order to "paid", so forging a
// webhook would mean free products. These tests pin the signature check and the
// "no credentials => online payment is off" behaviour.

import crypto from 'crypto';

const ORIGINAL_ENV = process.env;

function loadService() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require('../services/payment.service');
  mod.__resetPaymentProviderCache();
  return mod;
}

describe('payment provider resolution', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('is disabled when no provider is configured', () => {
    delete process.env.PAYMENT_PROVIDER;
    const { getPaymentProvider, isOnlinePaymentEnabled } = loadService();
    expect(getPaymentProvider()).toBeNull();
    expect(isOnlinePaymentEnabled()).toBe(false);
  });

  it('is disabled when the provider is named but the secret key is missing', () => {
    // This is the dangerous case: a half-configured deploy must fall back to
    // cash on delivery, never silently "succeed".
    process.env.PAYMENT_PROVIDER = 'moyasar';
    delete process.env.MOYASAR_SECRET_KEY;
    const { getPaymentProvider } = loadService();
    expect(getPaymentProvider()).toBeNull();
  });

  it('resolves the Moyasar provider when fully configured', () => {
    process.env.PAYMENT_PROVIDER = 'moyasar';
    process.env.MOYASAR_SECRET_KEY = 'sk_test_123';
    process.env.MOYASAR_WEBHOOK_SECRET = 'whsec_abc';
    const { getPaymentProvider, isOnlinePaymentEnabled } = loadService();
    expect(getPaymentProvider()?.name).toBe('moyasar');
    expect(isOnlinePaymentEnabled()).toBe(true);
  });
});

// The demo provider marks orders paid without collecting any money. It exists
// so the card flow can be shown end to end without PSP credentials — before it,
// checkout offered "Card" with nothing behind it and left the customer holding
// an order they could never pay. Because it settles orders for free, the
// production guard below is the single most important assertion in this file.
describe('demo payment provider', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('resolves outside production', () => {
    process.env.PAYMENT_PROVIDER = 'demo';
    process.env.NODE_ENV = 'development';
    const { getPaymentProvider } = loadService();
    expect(getPaymentProvider()?.name).toBe('demo');
  });

  it('is REFUSED in production without the explicit acknowledgement', () => {
    process.env.PAYMENT_PROVIDER = 'demo';
    process.env.NODE_ENV = 'production';
    delete process.env.ALLOW_DEMO_PAYMENTS;
    const { getPaymentProvider, isOnlinePaymentEnabled } = loadService();
    expect(getPaymentProvider()).toBeNull();
    expect(isOnlinePaymentEnabled()).toBe(false);
  });

  // Hosts set NODE_ENV=production automatically, so a demo deployment needs a
  // way through. It must be a deliberate one — these pin that near-misses and
  // generic truthy values do NOT unlock simulated payments.
  it.each(['true', '1', 'yes', 'I-UNDERSTAND-NO-MONEY-IS-COLLECTED', 'i-understand'])(
    'is still refused in production when ALLOW_DEMO_PAYMENTS is %p',
    (value) => {
      process.env.PAYMENT_PROVIDER = 'demo';
      process.env.NODE_ENV = 'production';
      process.env.ALLOW_DEMO_PAYMENTS = value;
      const { getPaymentProvider } = loadService();
      expect(getPaymentProvider()).toBeNull();
    }
  );

  it('is allowed in production only with the exact acknowledgement', () => {
    process.env.PAYMENT_PROVIDER = 'demo';
    process.env.NODE_ENV = 'production';
    const { DEMO_PAYMENTS_ACK } = require('../services/payment.service');
    process.env.ALLOW_DEMO_PAYMENTS = DEMO_PAYMENTS_ACK;
    const { getPaymentProvider } = loadService();
    expect(getPaymentProvider()?.name).toBe('demo');
  });

  it('does not unlock a real provider — the acknowledgement is demo-only', () => {
    process.env.PAYMENT_PROVIDER = 'moyasar';
    process.env.NODE_ENV = 'production';
    process.env.ALLOW_DEMO_PAYMENTS = 'i-understand-no-money-is-collected';
    delete process.env.MOYASAR_SECRET_KEY;
    const { getPaymentProvider } = loadService();
    expect(getPaymentProvider()).toBeNull();
  });

  it('never accepts a webhook — nothing may be settled unsigned', () => {
    process.env.PAYMENT_PROVIDER = 'demo';
    process.env.NODE_ENV = 'development';
    const { getPaymentProvider } = loadService();
    const provider = getPaymentProvider();
    expect(provider.verifyWebhookSignature('{}', 'anything')).toBe(false);
    expect(provider.parseWebhook({ id: 'demo_x_1.00' })).toBeNull();
  });

  it('reports the amount encoded at creation so the caller amount-check still runs', async () => {
    process.env.PAYMENT_PROVIDER = 'demo';
    process.env.NODE_ENV = 'development';
    const { getPaymentProvider } = loadService();
    const provider = getPaymentProvider();
    const created = await provider.createPayment({
      orderId: 'o1',
      orderNumber: 'PRM-TEST-1',
      amount: 566.35,
      description: 'test',
      callbackUrl: 'http://localhost:3000/checkout/payment-result',
    });
    const fetched = await provider.fetchPayment(created.paymentId);
    expect(fetched?.status).toBe('paid');
    expect(fetched?.amount).toBe(566.35);
  });

  it('does not recognise a payment id it did not issue', async () => {
    process.env.PAYMENT_PROVIDER = 'demo';
    process.env.NODE_ENV = 'development';
    const { getPaymentProvider } = loadService();
    expect(await getPaymentProvider().fetchPayment('pay_realmoyasarid')).toBeNull();
  });
});

describe('webhook signature verification', () => {
  const SECRET = 'whsec_super_secret';
  const body = JSON.stringify({ data: { id: 'pay_123', status: 'paid', amount: 174800 } });

  function provider() {
    process.env.PAYMENT_PROVIDER = 'moyasar';
    process.env.MOYASAR_SECRET_KEY = 'sk_test_123';
    process.env.MOYASAR_WEBHOOK_SECRET = SECRET;
    return loadService().getPaymentProvider();
  }

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  function sign(payload: string, secret = SECRET) {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }

  it('accepts a correctly signed payload', () => {
    expect(provider().verifyWebhookSignature(body, sign(body))).toBe(true);
  });

  it('rejects a missing signature', () => {
    expect(provider().verifyWebhookSignature(body, undefined)).toBe(false);
  });

  it('rejects a signature made with the wrong secret', () => {
    expect(provider().verifyWebhookSignature(body, sign(body, 'attacker-secret'))).toBe(false);
  });

  it('rejects when the body was tampered with after signing', () => {
    const signature = sign(body);
    const tampered = JSON.stringify({ data: { id: 'pay_123', status: 'paid', amount: 1 } });
    expect(provider().verifyWebhookSignature(tampered, signature)).toBe(false);
  });

  it('rejects a malformed signature without throwing', () => {
    expect(() => provider().verifyWebhookSignature(body, 'not-hex')).not.toThrow();
    expect(provider().verifyWebhookSignature(body, 'not-hex')).toBe(false);
  });
});

describe('webhook payload parsing', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
    process.env.PAYMENT_PROVIDER = 'moyasar';
    process.env.MOYASAR_SECRET_KEY = 'sk_test_123';
    process.env.MOYASAR_WEBHOOK_SECRET = 'whsec_abc';
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('converts minor units (halalas) back to SAR', () => {
    const p = loadService().getPaymentProvider();
    const parsed = p.parseWebhook({
      data: { id: 'pay_1', status: 'paid', amount: 201020, metadata: { orderNumber: 'ORD-1' } },
    });
    expect(parsed).toEqual({
      paymentId: 'pay_1',
      orderNumber: 'ORD-1',
      status: 'paid',
      amount: 2010.2,
    });
  });

  it('maps non-successful statuses away from "paid"', () => {
    const p = loadService().getPaymentProvider();
    expect(p.parseWebhook({ data: { id: 'x', status: 'failed', amount: 100 } }).status).toBe('failed');
    expect(p.parseWebhook({ data: { id: 'x', status: 'voided', amount: 100 } }).status).toBe('failed');
    expect(p.parseWebhook({ data: { id: 'x', status: 'initiated', amount: 100 } }).status).toBe('pending');
  });

  it('returns null for a payload with no payment id', () => {
    const p = loadService().getPaymentProvider();
    expect(p.parseWebhook({ data: {} })).toBeNull();
  });
});

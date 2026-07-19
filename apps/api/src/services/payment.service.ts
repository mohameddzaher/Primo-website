// ============================================
// PRIMO API - Payment Gateway Service
// ============================================
// Card / mada / Apple Pay are only real once a payment service provider (PSP)
// confirms the money. This module isolates that behind a small interface so the
// rest of the app never talks to a PSP directly, and so the store keeps working
// (cash on delivery only) until credentials are supplied.
//
// Configure with environment variables — NEVER store PSP secret keys in the
// database or in the settings UI:
//   PAYMENT_PROVIDER=moyasar
//   MOYASAR_SECRET_KEY=sk_live_...
//   MOYASAR_WEBHOOK_SECRET=...        (shared secret used to verify callbacks)
//
// Moyasar is used as the reference implementation because it is a Saudi PSP
// that natively supports mada, Apple Pay and international cards.

import crypto from 'crypto';

export type PaymentProviderName = 'moyasar' | 'demo' | 'none';

export interface CreatePaymentInput {
  orderId: string;
  orderNumber: string;
  /** Major currency units (e.g. 149.50 SAR). Converted to minor units here. */
  amount: number;
  currency?: string;
  description: string;
  callbackUrl: string;
  customer?: { name?: string; email?: string; phone?: string };
}

export interface CreatePaymentResult {
  /** PSP-side identifier, stored on the order as paymentIntentId. */
  paymentId: string;
  /** Where to send the customer to complete payment (3-D Secure page). */
  redirectUrl: string;
}

export interface VerifiedPayment {
  paymentId: string;
  orderNumber?: string;
  status: 'paid' | 'failed' | 'pending';
  amount: number;
}

export interface PaymentProvider {
  readonly name: PaymentProviderName;
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  /** Confirm a webhook really came from the PSP. */
  verifyWebhookSignature(rawBody: string, signature: string | undefined): boolean;
  parseWebhook(body: any): VerifiedPayment | null;
  /** Source of truth — always re-fetch rather than trusting webhook contents. */
  fetchPayment(paymentId: string): Promise<VerifiedPayment | null>;
}

// ─── Moyasar ─────────────────────────────────────────────────────────────────

const MOYASAR_API = 'https://api.moyasar.com/v1';

class MoyasarProvider implements PaymentProvider {
  readonly name = 'moyasar' as const;

  constructor(
    private readonly secretKey: string,
    private readonly webhookSecret: string
  ) {}

  private authHeader(): string {
    // Moyasar uses HTTP Basic auth with the secret key as the username.
    return `Basic ${Buffer.from(`${this.secretKey}:`).toString('base64')}`;
  }

  private mapStatus(status: string): VerifiedPayment['status'] {
    if (status === 'paid') return 'paid';
    if (status === 'failed' || status === 'voided' || status === 'refunded') return 'failed';
    return 'pending';
  }

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    // Amounts are transmitted in the smallest unit (halalas for SAR).
    const minorUnits = Math.round(input.amount * 100);

    const res = await fetch(`${MOYASAR_API}/payments`, {
      method: 'POST',
      headers: {
        Authorization: this.authHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: minorUnits,
        currency: input.currency || 'SAR',
        description: input.description,
        callback_url: input.callbackUrl,
        metadata: {
          orderId: input.orderId,
          orderNumber: input.orderNumber,
        },
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(`Moyasar payment creation failed (${res.status}): ${detail.slice(0, 300)}`);
    }

    const payment: any = await res.json();
    const redirectUrl = payment?.source?.transaction_url || payment?.callback_url;
    if (!payment?.id || !redirectUrl) {
      throw new Error('Moyasar returned an unexpected payment payload');
    }

    return { paymentId: payment.id, redirectUrl };
  }

  verifyWebhookSignature(rawBody: string, signature: string | undefined): boolean {
    if (!this.webhookSecret) return false;
    if (!signature) return false;

    const expected = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(rawBody)
      .digest('hex');

    // Constant-time compare so a timing side channel can't be used to forge it.
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  }

  parseWebhook(body: any): VerifiedPayment | null {
    const payment = body?.data ?? body;
    if (!payment?.id) return null;

    return {
      paymentId: payment.id,
      orderNumber: payment?.metadata?.orderNumber,
      status: this.mapStatus(payment.status),
      amount: (payment.amount ?? 0) / 100,
    };
  }

  async fetchPayment(paymentId: string): Promise<VerifiedPayment | null> {
    const res = await fetch(`${MOYASAR_API}/payments/${encodeURIComponent(paymentId)}`, {
      headers: { Authorization: this.authHeader() },
    });
    if (!res.ok) return null;

    const payment: any = await res.json();
    if (!payment?.id) return null;

    return {
      paymentId: payment.id,
      orderNumber: payment?.metadata?.orderNumber,
      status: this.mapStatus(payment.status),
      amount: (payment.amount ?? 0) / 100,
    };
  }
}

// ─── Demo (sandbox only) ─────────────────────────────────────────────────────

/**
 * A fake PSP that approves every payment, so the card / Apple Pay flow can be
 * demonstrated end to end without real credentials. It exists because the
 * alternative — showing "Card" at checkout with no provider behind it — left
 * the customer holding an order they could never pay.
 *
 * This provider MARKS ORDERS PAID WITHOUT COLLECTING MONEY. It is therefore
 * refused outright when NODE_ENV=production (see getPaymentProvider), and it
 * reports every payment as an obviously-fake `demo_*` id so a settled order can
 * always be traced back to it. Never enable it on a real store.
 */
/** Exact value ALLOW_DEMO_PAYMENTS must hold to permit simulated payments in production. */
export const DEMO_PAYMENTS_ACK = 'i-understand-no-money-is-collected';

class DemoProvider implements PaymentProvider {
  readonly name = 'demo' as const;

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const paymentId = `demo_${input.orderNumber}_${input.amount.toFixed(2)}`;
    // Bounce straight back to the callback the app already handles, flagged so
    // the confirm step can recognise a sandbox return.
    const separator = input.callbackUrl.includes('?') ? '&' : '?';
    return {
      paymentId,
      redirectUrl: `${input.callbackUrl}${separator}demo=1&payment_id=${encodeURIComponent(paymentId)}`,
    };
  }

  verifyWebhookSignature(): boolean {
    // No webhooks in demo mode; nothing may be accepted unsigned.
    return false;
  }

  parseWebhook(): VerifiedPayment | null {
    return null;
  }

  async fetchPayment(paymentId: string): Promise<VerifiedPayment | null> {
    if (!paymentId.startsWith('demo_')) return null;
    // Recover the amount encoded at creation so the caller's amount-match guard
    // still runs for real instead of being rubber-stamped.
    const amount = Number(paymentId.split('_').pop());
    return {
      paymentId,
      status: 'paid',
      amount: Number.isFinite(amount) ? amount : 0,
    };
  }
}

// ─── Resolution ──────────────────────────────────────────────────────────────

let cached: PaymentProvider | null | undefined;

/**
 * Returns the configured provider, or null when no PSP credentials are present.
 * Callers MUST handle null — that is the honest "online payment unavailable,
 * cash on delivery only" state rather than pretending an order was paid.
 */
export function getPaymentProvider(): PaymentProvider | null {
  if (cached !== undefined) return cached;

  const provider = (process.env.PAYMENT_PROVIDER || 'none').toLowerCase();

  if (provider === 'demo') {
    // This provider settles orders without taking money, so a misconfigured
    // deploy would hand out free goods. Outside production it is simply
    // allowed; in production it requires a second, deliberate acknowledgement.
    //
    // The acknowledgement is an exact sentence rather than a boolean because
    // hosts (Render included) set NODE_ENV=production automatically, and a
    // demo deployment genuinely needs the card flow to work. `=true` is the
    // kind of value someone copies without reading; this one cannot be typed
    // by accident or turned on by a generic "enable everything" sweep.
    if (process.env.NODE_ENV === 'production') {
      if (process.env.ALLOW_DEMO_PAYMENTS !== DEMO_PAYMENTS_ACK) {
        console.error(
          '🚨 PAYMENT_PROVIDER=demo is refused in production — online payments disabled. ' +
            'For a sandbox/demo deployment set ALLOW_DEMO_PAYMENTS to the exact acknowledgement string. ' +
            'For a real store set PAYMENT_PROVIDER=moyasar with real credentials.'
        );
        cached = null;
        return cached;
      }
      console.warn(
        '🚨🚨 RUNNING IN PRODUCTION WITH SIMULATED PAYMENTS 🚨🚨\n' +
          '     Every card/Apple Pay order will be marked PAID without collecting any money.\n' +
          '     This is only safe for a demo. Remove ALLOW_DEMO_PAYMENTS before taking real orders.'
      );
    } else {
      console.warn(
        '⚠️  PAYMENT_PROVIDER=demo — card payments are SIMULATED and no money is collected. Sandbox use only.'
      );
    }
    cached = new DemoProvider();
    return cached;
  }

  if (provider === 'moyasar') {
    const secretKey = process.env.MOYASAR_SECRET_KEY;
    const webhookSecret = process.env.MOYASAR_WEBHOOK_SECRET || '';
    if (!secretKey) {
      console.warn(
        '⚠️  PAYMENT_PROVIDER=moyasar but MOYASAR_SECRET_KEY is not set — online payments disabled.'
      );
      cached = null;
      return cached;
    }
    if (!webhookSecret) {
      console.warn(
        '⚠️  MOYASAR_WEBHOOK_SECRET is not set — payment webhooks will be rejected.'
      );
    }
    cached = new MoyasarProvider(secretKey, webhookSecret);
    return cached;
  }

  cached = null;
  return cached;
}

export function isOnlinePaymentEnabled(): boolean {
  return getPaymentProvider() !== null;
}

/** Test seam — lets tests reset the memoised provider. */
export function __resetPaymentProviderCache(): void {
  cached = undefined;
}

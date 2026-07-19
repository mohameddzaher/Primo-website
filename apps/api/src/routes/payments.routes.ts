// ============================================
// PRIMO API - Payment Routes
// ============================================
// The ONLY place allowed to move an order to paymentStatus 'paid' for online
// payments. Confirmation always comes from the PSP (verified webhook or a
// server-side re-fetch) — never from the browser, which the customer controls.

import { Router, Response, raw } from 'express';
import mongoose from 'mongoose';
import { Order } from '../models/Order';
import { AuditLog } from '../models/AuditLog';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler, NotFoundError, BadRequestError } from '../middleware/errorHandler';
import { getPaymentProvider } from '../services/payment.service';
import { bookOrderRevenue } from '../services/ledger.service';
import { config } from '../config';

const router = Router();

/** Whether online payment is available — the storefront uses this to decide
 *  if it can offer card/Apple Pay or must fall back to cash on delivery. */
router.get(
  '/availability',
  asyncHandler(async (_req: AuthRequest, res: Response) => {
    const provider = getPaymentProvider();
    res.json({
      success: true,
      data: {
        online: provider !== null,
        provider: provider?.name ?? 'none',
        // Lets the storefront label a demo deployment honestly. Anyone the
        // client forwards the link to would otherwise have no way to tell that
        // a completed "payment" never moved any money.
        simulated: provider?.name === 'demo',
      },
    });
  })
);

/**
 * Start an online payment for an order the caller owns.
 * Returns a redirect URL to the PSP's secure page.
 */
router.post(
  '/:orderId/initiate',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      throw new BadRequestError('Invalid order ID');
    }

    const provider = getPaymentProvider();
    if (!provider) {
      throw new BadRequestError(
        'Online payment is not configured. Please choose cash on delivery.'
      );
    }

    // Scope by userId — a customer may only pay for their own order.
    const order = await Order.findOne({ _id: orderId, userId: req.userId });
    if (!order) throw new NotFoundError('Order');

    if (order.paymentStatus === 'paid') {
      throw new BadRequestError('This order has already been paid');
    }
    if (['cancelled', 'failed'].includes(order.status)) {
      throw new BadRequestError('This order can no longer be paid');
    }

    const result = await provider.createPayment({
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      amount: order.total,
      description: `PRIMO order ${order.orderNumber}`,
      callbackUrl: `${config.frontendUrl}/checkout/payment-result?order=${order.orderNumber}`,
      customer: {
        name: order.shippingAddress?.fullName,
        email: order.shippingAddress?.email,
        phone: order.shippingAddress?.phone,
      },
    });

    order.paymentIntentId = result.paymentId;
    await order.save();

    res.json({
      success: true,
      data: { redirectUrl: result.redirectUrl, paymentId: result.paymentId },
    });
  })
);

/**
 * Mark an order paid from a PSP-verified payment. Idempotent and safe to call
 * from both the webhook and the return-URL confirmation.
 */
async function settleOrderFromPayment(paymentId: string): Promise<void> {
  const provider = getPaymentProvider();
  if (!provider) return;

  // Re-fetch from the PSP rather than trusting the payload we were handed.
  const verified = await provider.fetchPayment(paymentId);
  if (!verified || verified.status !== 'paid') return;

  const order = await Order.findOne({ paymentIntentId: paymentId });
  if (!order) {
    console.warn(`Payment ${paymentId} confirmed but no matching order found`);
    return;
  }

  // Guard: the amount actually captured must match what we billed, so a
  // tampered or partially-captured payment can't mark a large order paid.
  if (Math.round(verified.amount * 100) !== Math.round(order.total * 100)) {
    console.error(
      `Payment ${paymentId} amount ${verified.amount} != order total ${order.total} — not settling`
    );
    return;
  }

  // Atomic + idempotent: only the first confirmation flips the status, so a
  // retried webhook can't book revenue twice.
  const claimed = await Order.findOneAndUpdate(
    { _id: order._id, paymentStatus: { $ne: 'paid' } },
    { $set: { paymentStatus: 'paid', paidAt: new Date() } },
    { new: true }
  );
  if (!claimed) return; // already settled by an earlier delivery of this webhook

  await bookOrderRevenue(claimed);

  // The money is captured and the order is already flipped by this point, so a
  // problem writing the audit trail must not fail the caller: the storefront
  // would show the customer a payment error after a successful payment, and a
  // PSP webhook would be retried against an order that is already settled.
  //
  // `userId` is required on AuditLog and there is no admin acting here — this
  // is settlement triggered by the PSP — so it is attributed to the customer
  // who actually made the payment. Omitting it threw a validation error that
  // surfaced as "Validation failed" on an otherwise successful checkout.
  try {
    await AuditLog.create({
      userId: claimed.userId,
      action: 'update',
      resource: 'order',
      resourceId: claimed._id.toString(),
      newValue: { paymentStatus: 'paid', paymentIntentId: paymentId },
    });
  } catch (auditErr) {
    console.error(
      `Order ${claimed.orderNumber} settled but the audit entry failed to write:`,
      auditErr
    );
  }
}

/**
 * PSP webhook. Mounted with a raw body parser so the signature can be verified
 * against the exact bytes that were signed.
 */
router.post(
  '/webhook',
  raw({ type: '*/*' }),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const provider = getPaymentProvider();
    if (!provider) {
      res.status(200).json({ success: true, ignored: true });
      return;
    }

    const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : String(req.body ?? '');
    const signature =
      (req.headers['x-moyasar-signature'] as string | undefined) ||
      (req.headers['x-signature'] as string | undefined);

    if (!provider.verifyWebhookSignature(rawBody, signature)) {
      // Do not leak why it failed.
      res.status(401).json({ success: false, error: 'Invalid signature' });
      return;
    }

    let parsedBody: any;
    try {
      parsedBody = JSON.parse(rawBody);
    } catch {
      throw new BadRequestError('Malformed webhook payload');
    }

    const event = provider.parseWebhook(parsedBody);
    if (event?.paymentId) {
      await settleOrderFromPayment(event.paymentId);
    }

    // Always 200 on a verified webhook so the PSP stops retrying.
    res.json({ success: true });
  })
);

/**
 * Called by the storefront when the customer returns from the PSP page.
 * This does NOT trust the browser — it re-verifies with the PSP.
 */
router.post(
  '/:orderId/confirm',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      throw new BadRequestError('Invalid order ID');
    }

    const order = await Order.findOne({ _id: orderId, userId: req.userId });
    if (!order) throw new NotFoundError('Order');

    if (order.paymentIntentId) {
      await settleOrderFromPayment(order.paymentIntentId);
    }

    const fresh = await Order.findById(order._id).select('paymentStatus status orderNumber').lean();
    res.json({ success: true, data: fresh });
  })
);

export default router;

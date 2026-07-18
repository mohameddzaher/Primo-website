// ============================================
// PRIMO API - Ledger Service
// ============================================
// Single place that writes order money into the accounting ledger, so the
// order routes and the payment-gateway webhook can't drift apart or
// double-book the same revenue.

import { Transaction } from '../models/Transaction';

/**
 * Recognise an order's revenue — called at the moment payment completes
 * (COD: on delivery; card/Apple Pay/mada: on gateway confirmation), never at
 * order creation. Booking at creation inflated revenue and left a stranded
 * credit whenever an unpaid order was cancelled.
 *
 * Idempotent: a repeated status update, a re-delivery, or a retried gateway
 * webhook must not double-book, so an existing order_revenue entry short-circuits.
 */
export async function bookOrderRevenue(order: any, actorUserId?: string): Promise<void> {
  const existing = await Transaction.findOne({
    orderId: order._id,
    category: 'order_revenue',
  });
  if (existing) return;

  await Transaction.create({
    type: 'credit',
    amount: order.total,
    category: 'order_revenue',
    description: `Revenue from order ${order.orderNumber}`,
    reference: order.orderNumber,
    orderId: order._id,
    date: new Date(),
    ...(actorUserId && { createdBy: actorUserId }),
  });
}

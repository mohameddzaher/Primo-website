// ============================================
// PRIMO API - Order Routes
// ============================================

import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { createOrderSchema, updateOrderStatusSchema, orderFiltersSchema, paginationSchema } from '@primo/shared';
import { Order, IOrderItem } from '../models/Order';
import { Product, resolveLinePricing } from '../models/Product';
import { Cart } from '../models/Cart';
import { Settings } from '../models/Settings';
import { AuditLog } from '../models/AuditLog';
import { User } from '../models/User';
import { Referral } from '../models/Referral';
import { StockMovement } from '../models/StockMovement';
import { Transaction } from '../models/Transaction';
import { Offer } from '../models/Offer';
import { PointsTransaction } from '../models/PointsTransaction';
import { authenticate, requireAdmin, requirePermission, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { invalidateOnWrite } from '../middleware/cache';
import { bookOrderRevenue } from '../services/ledger.service';
import { asyncHandler, NotFoundError, BadRequestError, ConflictError } from '../middleware/errorHandler';
import { sendOrderConfirmationEmail, sendOrderStatusEmail } from '../services/email.service';
import { notifyAdminsNewOrder, notifyOrderStatusChange, notifyAdminsLowStock } from '../services/notification.service';
import { getOrderStatusLabel } from '@primo/shared';

const router = Router();

// Stock/rating changes here must refresh cached product listings
router.use(invalidateOnWrite('products'));

// ─── Shipment tracking ───────────────────────────────────────────────────────
// Carriers that actually operate in Saudi Arabia. `{tracking}` is replaced with
// the consignment number.
const CARRIER_TRACKING_URLS: Record<string, string> = {
  smsa: 'https://www.smsaexpress.com/trackn?tracknumbers={tracking}',
  aramex: 'https://www.aramex.com/track/results?ShipmentNumber={tracking}',
  naqel: 'https://www.naqelexpress.com/en/track-shipment/?waybill={tracking}',
  spl: 'https://splonline.com.sa/en/track-and-trace/?trackingNumber={tracking}',
  'saudi post': 'https://splonline.com.sa/en/track-and-trace/?trackingNumber={tracking}',
  dhl: 'https://www.dhl.com/sa-en/home/tracking.html?tracking-id={tracking}',
};

// Common spellings/aliases an admin might type, mapped to the keys above.
const CARRIER_ALIASES: Record<string, string> = {
  'smsa express': 'smsa',
  'aramex express': 'aramex',
  'naqel express': 'naqel',
  'saudi post | spl': 'spl',
  splonline: 'spl',
  'dhl express': 'dhl',
};

/**
 * Build a customer-facing tracking URL for a carrier. Falls back to a generic
 * multi-carrier tracker so an unknown courier still yields a working link
 * rather than a dead end.
 */
function buildTrackingUrl(carrier: string, trackingNumber: string): string {
  const key = carrier.trim().toLowerCase();
  const resolved = CARRIER_ALIASES[key] || key;
  const template = CARRIER_TRACKING_URLS[resolved];
  const encoded = encodeURIComponent(trackingNumber);

  if (template) return template.replace('{tracking}', encoded);
  return `https://t.17track.net/en#nums=${encoded}`;
}

// ─── Stock movement (variant-aware) ──────────────────────────────────────────
// A single, shared pair of primitives for every stock change an order causes, so
// there is exactly ONE stock path whether or not a variant is involved.
//
// When a line carries a variantId, the variant's own stock and the product's
// aggregate `stockQuantity` are moved together inside ONE `$inc`, matched by
// `arrayFilters`. That keeps the aggregate (which powers listing pages, the
// isInStock virtual and low-stock alerts) exactly in step with the sum of its
// variants, with no second round-trip that could interleave with another buyer.

/**
 * Atomically RESERVE `quantity` units. The filter guards on sufficient stock —
 * on the variant AND the product — so a concurrent checkout of the last unit
 * makes this return null rather than overselling.
 */
async function reserveLineStock(
  productId: any,
  variantId: string | undefined,
  quantity: number
): Promise<any | null> {
  const filter: any = {
    _id: productId,
    isActive: true,
    stockQuantity: { $gte: quantity },
  };
  const inc: any = { stockQuantity: -quantity, soldCount: quantity };
  const options: any = { new: true };

  if (variantId) {
    filter.variants = { $elemMatch: { id: variantId, stockQuantity: { $gte: quantity } } };
    inc['variants.$[v].stockQuantity'] = -quantity;
    options.arrayFilters = [{ 'v.id': variantId }];
  }

  return Product.findOneAndUpdate(filter, { $inc: inc }, options);
}

/**
 * RELEASE `quantity` units back — used both to roll back a partially reserved
 * order and to restore stock on cancellation/return. Unguarded by design: giving
 * stock back must always succeed.
 */
async function releaseLineStock(
  productId: any,
  variantId: string | undefined,
  quantity: number
): Promise<void> {
  const inc: any = { stockQuantity: quantity, soldCount: -quantity };
  const options: any = {};

  if (variantId) {
    inc['variants.$[v].stockQuantity'] = quantity;
    options.arrayFilters = [{ 'v.id': variantId }];
  }

  await Product.updateOne({ _id: productId }, { $inc: inc }, options);
}

// Shared side-effects when an order is cancelled or failed (used by the customer
// self-cancel route and the admin status-change route): restore stock, refund
// any redeemed loyalty points, and — only when money was actually collected —
// record a refund transaction. Sets the cancellation fields on the order but
// leaves status/save to the caller.
// `terminalStatus` is the status the order is moving into ('cancelled' | 'failed');
// a failed delivery leaks exactly the same stock/revenue as a cancellation, so it
// is handled identically here.
async function restoreOrderOnCancel(
  order: any,
  actorUserId: string | undefined,
  reason?: string,
  terminalStatus: 'cancelled' | 'failed' = 'cancelled'
): Promise<void> {
  const label = terminalStatus === 'failed' ? 'failed' : 'cancelled';

  // Was any money actually collected? COD orders are only marked 'paid' on
  // delivery, so an unpaid order must NOT produce a refund entry in the ledger.
  const wasPaid = order.paymentStatus === 'paid';

  order.cancelledAt = new Date();
  if (reason) order.cancelReason = reason;
  // Only a genuinely paid order can be refunded; otherwise the payment simply
  // never completed.
  order.paymentStatus = wasPaid ? 'refunded' : 'failed';

  // Restore stock + return movements. Batch-fetch all products (avoids N+1) and
  // restore each with an atomic $inc so concurrent stock changes aren't lost.
  const itemProductIds = order.items.map((i: any) => i.productId);
  const cancelProducts = await Product.find({ _id: { $in: itemProductIds } })
    .select('_id stockQuantity')
    .lean();
  const stockBefore = new Map(
    cancelProducts.map((p: any) => [p._id.toString(), p.stockQuantity])
  );

  for (const item of order.items) {
    const key = item.productId.toString();
    if (!stockBefore.has(key)) continue;

    const previousStock = stockBefore.get(key) as number;
    const newStock = previousStock + item.quantity;

    // Restores the variant's stock too when the line was bought with an option.
    await releaseLineStock(item.productId, item.variantId, item.quantity);

    await StockMovement.create({
      productId: item.productId,
      type: 'return',
      quantity: item.quantity,
      previousStock,
      newStock,
      reason: `Order ${order.orderNumber} ${label}`,
      reference: order.orderNumber,
      orderId: order._id,
      userId: actorUserId,
    });
  }

  // Refund redeemed loyalty points back to the customer
  if (order.pointsRedeemed && order.pointsRedeemed > 0) {
    await User.findByIdAndUpdate(order.userId, {
      $inc: {
        loyaltyPoints: order.pointsRedeemed,
        totalPointsRedeemed: -order.pointsRedeemed,
      },
    });
    await PointsTransaction.create({
      userId: order.userId,
      type: 'refund',
      points: order.pointsRedeemed,
      orderId: order._id,
      description: `Refund of ${order.pointsRedeemed} points for ${label} order ${order.orderNumber}`,
    });
  }

  // Record refund transaction in the ledger — ONLY when the customer actually
  // paid. Booking a debit for an unpaid (e.g. COD) order would invent a refund
  // for money that was never collected and understate revenue.
  if (wasPaid) {
    await Transaction.create({
      type: 'debit',
      amount: order.total,
      category: 'order_refund',
      description: `Refund for ${label} order ${order.orderNumber}`,
      reference: order.orderNumber,
      orderId: order._id,
      date: new Date(),
      createdBy: actorUserId,
    });
  }
}

// Customer-facing email for meaningful order status transitions. Addressed to
// the ORDER's customer (shippingAddress.email), never an admin. Fire-and-forget:
// a mail failure must never fail the status update, so everything is swallowed.
const CUSTOMER_EMAIL_STATUSES = ['accepted', 'out_for_delivery', 'delivered', 'cancelled', 'failed'];

async function emailCustomerOrderStatus(order: any, status: string): Promise<void> {
  try {
    if (!CUSTOMER_EMAIL_STATUSES.includes(status)) return;

    const to = order.shippingAddress?.email;
    if (!to) return;

    await sendOrderStatusEmail(to, order.orderNumber, status, getOrderStatusLabel(status), {
      customerName: order.shippingAddress?.fullName,
      items: order.items.map((i: any) => ({
        title: i.title,
        quantity: i.quantity,
        price: i.price,
      })),
      total: order.total,
    });
  } catch (emailErr) {
    console.error('Error sending order status email:', emailErr);
  }
}

// Get user's orders
router.get(
  '/my-orders',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page = 1, limit = 10 } = req.query as any;
    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      Order.find({ userId: req.userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Order.countDocuments({ userId: req.userId }),
    ]);

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  })
);

// Get single order for user
router.get(
  '/my-orders/:orderNumber',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { orderNumber } = req.params;

    const order = await Order.findOne({
      orderNumber,
      userId: req.userId,
    }).lean();

    if (!order) {
      throw new NotFoundError('Order');
    }

    res.json({
      success: true,
      data: order,
    });
  })
);

// Create new order
router.post(
  '/',
  authenticate,
  validate(createOrderSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { items, shippingAddress, paymentMethod, discountCode, notes, redeemPoints } = req.body;

    // Double-submit guard: if the customer already created an identical order in
    // the last 20s (double-click / retry / flaky network), return that order
    // instead of creating a duplicate + decrementing stock twice.
    const itemSignature = [...items]
      .map((it: any) => `${it.productId}:${it.variantId || ''}:${it.quantity}`)
      .sort()
      .join('|');
    const recentOrder = await Order.findOne({
      userId: req.userId,
      createdAt: { $gte: new Date(Date.now() - 20_000) },
    })
      .sort({ createdAt: -1 })
      .lean();
    if (recentOrder) {
      const recentSig = (recentOrder.items || [])
        .map((it: any) => `${it.productId}:${it.variantId || ''}:${it.quantity}`)
        .sort()
        .join('|');
      if (recentSig === itemSignature) {
        res.status(200).json({ success: true, data: recentOrder, duplicate: true });
        return;
      }
    }

    // Validate and get products
    // Distinct — one product may appear on several lines when the customer
    // bought two different variants of it (e.g. the same fridge in two colours).
    const productIds = [...new Set(items.map((item: any) => String(item.productId)))];
    const products = await Product.find({
      _id: { $in: productIds },
      isActive: true,
    });

    if (products.length !== productIds.length) {
      throw new BadRequestError('One or more products not found or unavailable');
    }

    // Get settings for dynamic shipping and delivery calculation
    const settings = await (Settings as any).getSettings();

    // Check stock and calculate totals
    const orderItems: IOrderItem[] = [];
    let subtotal = 0;

    for (const item of items) {
      const product = products.find((p) => p._id.toString() === item.productId);
      if (!product) {
        throw new BadRequestError(`Product ${item.productId} not found`);
      }

      // Resolve the variant (if any) server-side. The client's variantId is only
      // ever a *reference* — its price modifier and stock are read from the DB.
      const { variant, variantMissing, unitPrice, availableStock } = resolveLinePricing(
        product,
        item.variantId
      );

      if (product.variants.length > 0 && !item.variantId) {
        throw new BadRequestError(`Please choose an option for ${product.title}`);
      }
      if (variantMissing) {
        throw new BadRequestError(`The selected option for ${product.title} is no longer available`);
      }

      // Variant stock, not the product aggregate, gates a variant line.
      if (availableStock < item.quantity) {
        throw new BadRequestError(`Insufficient stock for ${product.title}`);
      }

      const discountPct = product.discount ?? 0;
      const hasDiscount = discountPct > 0 &&
        (!product.discountEndsAt || new Date(product.discountEndsAt) > new Date());
      // unitPrice = discounted base price + the variant's priceModifier. The
      // downstream shipping/discount/VAT math is unchanged.
      const itemPrice = unitPrice;

      orderItems.push({
        productId: product._id,
        title: product.title,
        // The variant's SKU is what the warehouse actually picks.
        sku: variant?.sku || product.sku,
        variantId: variant?.id,
        variantName: variant?.name,
        variantValue: variant?.value,
        price: itemPrice,
        originalPrice: hasDiscount ? product.price + (variant?.priceModifier || 0) : undefined,
        discount: hasDiscount ? discountPct : undefined,
        quantity: item.quantity,
        image: variant?.image || product.images[0]?.url,
      });

      subtotal += itemPrice * item.quantity;
    }

    // Atomically RESERVE stock for every item before doing anything else. A guarded
    // $inc (decrement only when stockQuantity >= requested) makes this safe under
    // high concurrency — it prevents overselling when many customers check out the
    // same product at once. If any item can't be reserved, roll back the ones that
    // were and abort so no order/charge/points side-effects happen.
    // For a line with a variant the SAME guarded $inc also decrements that
    // variant's stock (see reserveLineStock) — one atomic op covers both.
    const stockReservations: {
      productId: any;
      variantId?: string;
      quantity: number;
      previousStock: number;
      newStock: number;
      product: any;
    }[] = [];
    for (const item of items) {
      const reserved = await reserveLineStock(item.productId, item.variantId, item.quantity);
      if (!reserved) {
        for (const r of stockReservations) {
          await releaseLineStock(r.productId, r.variantId, r.quantity);
        }
        const p = products.find((x) => x._id.toString() === String(item.productId));
        throw new BadRequestError(
          `Insufficient stock for ${p?.title || 'an item in your cart'} — the last units were just purchased. Please update your cart and try again.`
        );
      }
      stockReservations.push({
        productId: reserved._id,
        variantId: item.variantId,
        quantity: item.quantity,
        previousStock: reserved.stockQuantity + item.quantity,
        newStock: reserved.stockQuantity,
        product: reserved,
      });
    }

    // Calculate shipping based on settings
    let shippingCost = settings.shippingFee || 50;
    if (settings.enableFreeShipping && subtotal >= (settings.freeShippingThreshold || 500)) {
      shippingCost = 0;
    }

    // Apply discount code if provided
    let promoDiscount = 0;
    if (discountCode) {
      const offer = await Offer.findOne({
        code: discountCode.toUpperCase(),
        isActive: true,
        startsAt: { $lte: new Date() },
        endsAt: { $gt: new Date() },
      });

      if (offer && (!offer.minOrderAmount || subtotal >= offer.minOrderAmount)) {
        // Atomically claim a usage slot so a limited code can never exceed its
        // usageLimit under concurrent redemptions (check-and-increment in one op).
        const claimed = await Offer.findOneAndUpdate(
          offer.usageLimit
            ? { _id: offer._id, $expr: { $lt: ['$usedCount', '$usageLimit'] } }
            : { _id: offer._id },
          { $inc: { usedCount: 1 } },
          { new: true }
        );

        if (claimed) {
          if (offer.type === 'percentage') {
            promoDiscount = (subtotal * offer.value) / 100;
            if (offer.maxDiscount) {
              promoDiscount = Math.min(promoDiscount, offer.maxDiscount);
            }
          } else if (offer.type === 'fixed') {
            promoDiscount = offer.value;
          }
        }
      }
    }

    // Check for referral discount (first order only)
    let referralDiscount = 0;
    let referralApplied = false;
    const existingOrdersCount = await Order.countDocuments({ userId: req.userId });
    if (existingOrdersCount === 0) {
      // This is the user's first order - check for pending referral
      const pendingReferral = await Referral.findOne({
        referee: req.userId,
        status: 'pending',
      });

      if (pendingReferral) {
        referralDiscount = pendingReferral.refereeDiscount || 100;
        referralApplied = true;
      }
    }

    // Loyalty points redemption
    let loyaltyDiscount = 0;
    let pointsRedeemed = 0;
    if (redeemPoints && redeemPoints > 0 && settings.enableLoyaltyProgram) {
      const orderUser = await User.findById(req.userId);
      if (orderUser && !orderUser.pointsFrozen && orderUser.loyaltyPoints >= redeemPoints) {
        if (redeemPoints >= (settings.minPointsToRedeem || 0)) {
          let actualPoints = redeemPoints;
          if (settings.maxPointsPerOrder > 0) {
            actualPoints = Math.min(actualPoints, settings.maxPointsPerOrder);
          }
          actualPoints = Math.min(actualPoints, orderUser.loyaltyPoints);
          loyaltyDiscount = settings.pointsRedemptionRate > 0
            ? Math.floor(actualPoints / settings.pointsRedemptionRate)
            : 0;
          pointsRedeemed = actualPoints;
        }
      }
    }

    // Total discount combines promo code, referral discount, and loyalty points
    const discount = promoDiscount + referralDiscount + loyaltyDiscount;

    // Calculate tax based on settings
    const taxableAmount = Math.max(0, subtotal - discount);
    const taxRate = settings.enableTax ? (settings.taxRate || 0) : 0;
    const taxAmount = taxRate > 0 ? Math.round((taxableAmount * taxRate) / 100 * 100) / 100 : 0;
    const taxLabel = settings.taxLabel || 'VAT';

    const total = Math.max(0, subtotal + shippingCost - discount + taxAmount);

    // Create order
    const order = await Order.create({
      userId: req.userId,
      items: orderItems,
      subtotal,
      shippingCost,
      discount,
      discountCode: promoDiscount > 0 ? discountCode : (referralApplied ? 'REFERRAL' : undefined),
      pointsRedeemed,
      taxRate,
      taxAmount,
      taxLabel,
      total,
      status: 'new',
      statusHistory: [
        {
          status: 'new',
          timestamp: new Date(),
          updatedBy: new mongoose.Types.ObjectId(req.userId),
        },
      ],
      paymentMethod,
      // No payment gateway is integrated yet, so NO order may be reported as
      // 'paid' at creation time — card/apple_pay included. Every method starts
      // 'pending':
      //   - cash_on_delivery -> flipped to 'paid' by the PATCH /:id/status
      //     handler below when the order reaches 'delivered'.
      //   - card / apple_pay -> TODO: when a real gateway (e.g. Moyasar/HyperPay/
      //     Stripe) is integrated, its server-side webhook/confirmation handler is
      //     the ONLY place allowed to set paymentStatus = 'paid' (together with
      //     paymentIntentId). Never trust the client for this.
      paymentStatus: 'pending',
      shippingAddress,
      notes,
      estimatedDelivery: new Date(Date.now() + (settings.estimatedDeliveryDays || 3) * 24 * 60 * 60 * 1000),
    });

    // Stock was already reserved atomically above; here we only record the
    // inventory movements and fire low-stock alerts (no further decrement).
    for (const r of stockReservations) {
      await StockMovement.create({
        productId: r.productId,
        type: 'sale',
        quantity: r.quantity,
        previousStock: r.previousStock,
        newStock: r.newStock,
        reason: `Order ${order.orderNumber}`,
        reference: order.orderNumber,
        orderId: order._id,
        userId: req.userId,
      });

      if (r.newStock <= r.product.lowStockThreshold) {
        notifyAdminsLowStock(r.product.title, r.product.sku, r.newStock).catch(console.error);
      }
    }

    // NOTE: revenue is deliberately NOT booked here.
    //
    // An order is created with paymentStatus 'pending' — no money has changed
    // hands yet (COD is collected on delivery, and card/Apple Pay await gateway
    // confirmation). Booking a credit at creation inflated revenue and, because
    // a refund is only written for orders that were actually paid, a cancelled
    // unpaid order left that credit stranded in the ledger forever.
    // Revenue is now recognised in `bookOrderRevenue()` at the moment payment
    // completes. See the `delivered` branch of the status handler.

    // Deduct loyalty points if redeemed
    if (pointsRedeemed > 0) {
      try {
        await User.findByIdAndUpdate(req.userId, {
          $inc: {
            loyaltyPoints: -pointsRedeemed,
            totalPointsRedeemed: pointsRedeemed,
          },
        });

        await PointsTransaction.create({
          userId: req.userId,
          type: 'redeemed',
          points: -pointsRedeemed,
          orderId: order._id,
          description: `Redeemed ${pointsRedeemed} points for SAR ${loyaltyDiscount} discount on order ${order.orderNumber}`,
        });
      } catch (loyaltyErr) {
        console.error('Error deducting loyalty points:', loyaltyErr);
      }
    }

    // Clear user's cart
    await Cart.findOneAndUpdate({ userId: req.userId }, { items: [], discountCode: null, discountAmount: 0 });

    // Send confirmation email
    sendOrderConfirmationEmail(shippingAddress.email, order.orderNumber, {
      items: orderItems.map((i) => ({ title: i.title, quantity: i.quantity, price: i.price })),
      subtotal,
      shipping: shippingCost,
      discount,
      total,
    }).catch(console.error);

    // Notify admins
    notifyAdminsNewOrder(
      order.orderNumber,
      total,
      shippingAddress.fullName,
      order._id.toString()
    ).catch(console.error);

    // Handle referral completion for first-time orders
    try {
      // Check if this is the user's first order
      const existingOrdersCount = await Order.countDocuments({
        userId: req.userId,
        _id: { $ne: order._id },
      });

      if (existingOrdersCount === 0) {
        // This is the user's first order — complete any pending referral.
        const minOrderAmount = settings.referralMinOrderAmount || 500;

        if (total >= minOrderAmount) {
          // Atomically flip the referral to completed (status:'pending' guard) so
          // two concurrent first-orders can never complete it twice / double-credit.
          const completedReferral = await Referral.findOneAndUpdate(
            { referee: req.userId, status: 'pending' },
            {
              $set: {
                status: 'completed',
                orderAmount: total,
                orderId: order._id,
                completedAt: new Date(),
              },
            },
            { new: true }
          );

          if (completedReferral) {
            // Credit the referrer with rewards (atomic)
            await User.findByIdAndUpdate(completedReferral.referrer, {
              $inc: {
                referralCredits: completedReferral.referrerReward || 100,
                successfulReferrals: 1,
              },
            });

            // Award referral bonus loyalty points (atomic, respects frozen flag)
            if (settings.enableLoyaltyProgram && settings.referralBonusPoints > 0) {
              const updatedReferrer = await User.findOneAndUpdate(
                { _id: completedReferral.referrer, pointsFrozen: { $ne: true } },
                {
                  $inc: {
                    loyaltyPoints: settings.referralBonusPoints,
                    totalPointsEarned: settings.referralBonusPoints,
                  },
                },
                { new: true }
              );

              if (updatedReferrer) {
                await PointsTransaction.create({
                  userId: completedReferral.referrer,
                  type: 'earned_referral',
                  points: settings.referralBonusPoints,
                  description: `Earned ${settings.referralBonusPoints} bonus points for successful referral`,
                });
              }
            }

            console.log(`Referral completed: Referrer ${completedReferral.referrer} credited for order ${order.orderNumber}`);
          }
        }
      }
    } catch (referralError) {
      // Log but don't fail the order creation
      console.error('Error processing referral completion:', referralError);
    }

    res.status(201).json({
      success: true,
      data: order,
    });
  })
);

// Reorder - add previous order items to cart
router.post(
  '/reorder/:orderNumber',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { orderNumber } = req.params;

    const order = await Order.findOne({
      orderNumber,
      userId: req.userId,
    });

    if (!order) {
      throw new NotFoundError('Order');
    }

    // Get or create cart
    let cart = await Cart.findOne({ userId: req.userId });
    if (!cart) {
      cart = await Cart.create({ userId: req.userId, items: [] });
    }

    // Add items to cart
    for (const item of order.items) {
      // Check if product still exists and is in stock
      const product = await Product.findOne({
        _id: item.productId,
        isActive: true,
        stockQuantity: { $gt: 0 },
      });

      if (product) {
        // Re-add the exact variant that was bought. If that option has since
        // been removed or sold out, skip the line rather than silently
        // substituting a different one.
        const { variantMissing, availableStock } = resolveLinePricing(product, item.variantId);
        if (variantMissing || availableStock <= 0) continue;

        const existingItem = cart.items.find(
          (i) =>
            i.productId.toString() === item.productId.toString() &&
            (i.variantId || '') === (item.variantId || '')
        );

        if (existingItem) {
          existingItem.quantity += item.quantity;
        } else {
          cart.items.push({
            productId: item.productId,
            ...(item.variantId ? { variantId: item.variantId } : {}),
            quantity: Math.min(item.quantity, availableStock),
            addedAt: new Date(),
          });
        }
      }
    }

    await cart.save();

    res.json({
      success: true,
      message: 'Items added to cart',
      data: { itemsAdded: cart.items.length },
    });
  })
);

// Cancel an order (customer self-service). Allowed only while the order is
// still cancellable (not yet being prepared/shipped). Restores stock and
// refunds any redeemed loyalty points.
router.post(
  '/:id/cancel',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body || {};

    const query: any = { $or: [{ orderNumber: id }], userId: req.userId };
    if (mongoose.Types.ObjectId.isValid(id)) query.$or.push({ _id: id });

    const order = await Order.findOne(query);
    if (!order) {
      throw new NotFoundError('Order');
    }

    const cancellable = ['new', 'accepted'];
    if (!cancellable.includes(order.status)) {
      throw new BadRequestError(
        `Order can no longer be cancelled (current status: ${order.status}). Please contact support.`
      );
    }

    const oldStatus = order.status;
    await restoreOrderOnCancel(order, req.userId, reason || 'Cancelled by customer');
    order.status = 'cancelled';
    order.statusHistory.push({
      status: 'cancelled',
      timestamp: new Date(),
      updatedBy: new mongoose.Types.ObjectId(req.userId),
    } as any);
    await order.save();

    await AuditLog.create({
      userId: req.userId,
      action: 'status_change',
      resource: 'order',
      resourceId: order._id.toString(),
      oldValue: { status: oldStatus },
      newValue: { status: 'cancelled', reason: reason || 'Cancelled by customer' },
    });

    // Notify admins/customer of the cancellation
    notifyOrderStatusChange(
      order.userId.toString(),
      order.orderNumber,
      'cancelled',
      getOrderStatusLabel('cancelled')
    ).catch(console.error);

    // Confirm the cancellation to the customer by email
    emailCustomerOrderStatus(order, 'cancelled').catch(console.error);

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: { orderNumber: order.orderNumber, status: order.status },
    });
  })
);

// ========== ADMIN ROUTES ==========

// Get all orders (admin)
router.get(
  '/',
  authenticate,
  requireAdmin,
  requirePermission('orders', 'read'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page = 1, limit = 20 } = req.query as any;
    const filters = orderFiltersSchema.parse(req.query);
    const skip = (Number(page) - 1) * Number(limit);

    const query: any = {};

    // Status filter
    if (filters.status?.length) {
      query.status = { $in: filters.status };
    }

    // Payment method filter
    if (filters.paymentMethod?.length) {
      query.paymentMethod = { $in: filters.paymentMethod };
    }

    // Payment status filter
    if (filters.paymentStatus?.length) {
      query.paymentStatus = { $in: filters.paymentStatus };
    }

    // Date range filter
    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
      if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
    }

    // Search filter
    if (filters.search) {
      query.$or = [
        { orderNumber: { $regex: filters.search, $options: 'i' } },
        { 'shippingAddress.phone': { $regex: filters.search, $options: 'i' } },
        { 'shippingAddress.email': { $regex: filters.search, $options: 'i' } },
        { 'shippingAddress.fullName': { $regex: filters.search, $options: 'i' } },
      ];
    }

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('userId', 'firstName lastName email')
        .lean(),
      Order.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  })
);

// Get order by ID (admin)
router.get(
  '/:id',
  authenticate,
  requireAdmin,
  requirePermission('orders', 'read'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    let order;
    if (mongoose.Types.ObjectId.isValid(id)) {
      order = await Order.findById(id)
        .populate('userId', 'firstName lastName email phone')
        .populate('statusHistory.updatedBy', 'firstName lastName')
        .lean();
    } else {
      // Fallback: try finding by orderNumber (e.g., "ORD-1234")
      order = await Order.findOne({ orderNumber: id })
        .populate('userId', 'firstName lastName email phone')
        .populate('statusHistory.updatedBy', 'firstName lastName')
        .lean();
    }

    if (!order) {
      throw new NotFoundError('Order');
    }

    res.json({
      success: true,
      data: order,
    });
  })
);

// Update order status (admin)
router.patch(
  '/:id/status',
  authenticate,
  requireAdmin,
  requirePermission('orders', 'write'),
  validate(updateOrderStatusSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { status, note } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError('Invalid order ID');
    }

    const order = await Order.findById(id);
    if (!order) {
      throw new NotFoundError('Order');
    }

    const oldStatus = order.status;

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      new: ['accepted', 'cancelled'],
      accepted: ['in_progress', 'cancelled'],
      in_progress: ['out_for_delivery', 'cancelled'],
      out_for_delivery: ['delivered', 'failed'],
      delivered: [],
      cancelled: [],
      failed: [],
    };

    if (!validTransitions[oldStatus]?.includes(status)) {
      throw new BadRequestError(`Cannot transition from ${oldStatus} to ${status}`);
    }

    // Update order
    order.status = status;
    order.statusHistory.push({
      status,
      timestamp: new Date(),
      updatedBy: new mongoose.Types.ObjectId(req.userId),
      note,
    });

    if (status === 'delivered') {
      order.deliveredAt = new Date();
      order.paymentStatus = 'paid';

      // Payment has now completed (COD collected on delivery) — this is the
      // point at which the revenue is real, so book it. Idempotent.
      try {
        await bookOrderRevenue(order, req.userId);
      } catch (revenueErr) {
        console.error('Failed to book order revenue:', revenueErr);
      }

      // Award loyalty points on delivery
      try {
        const loyaltySettings = await (Settings as any).getSettings();
        if (loyaltySettings.enableLoyaltyProgram) {
          const orderUser = await User.findById(order.userId);
          if (orderUser && !orderUser.pointsFrozen) {
            const pointsEarned = Math.floor(order.total * (loyaltySettings.pointsPerCurrency || 1));
            if (pointsEarned > 0) {
              orderUser.loyaltyPoints += pointsEarned;
              orderUser.totalPointsEarned += pointsEarned;
              await orderUser.save();

              await PointsTransaction.create({
                userId: orderUser._id,
                type: 'earned_purchase',
                points: pointsEarned,
                orderId: order._id,
                description: `Earned ${pointsEarned} points from order ${order.orderNumber}`,
              });
            }
          }
        }
      } catch (loyaltyErr) {
        console.error('Error awarding loyalty points:', loyaltyErr);
      }
    }

    // Both 'cancelled' and 'failed' end the order without the goods leaving us,
    // so both must release the reserved stock and reverse any collected money.
    // The `oldStatus` guard makes this idempotent: an order that was already
    // cancelled/failed can never be restocked twice.
    if (
      (status === 'cancelled' || status === 'failed') &&
      oldStatus !== 'cancelled' &&
      oldStatus !== 'failed'
    ) {
      // Restore stock, refund redeemed loyalty points, and record the refund
      // (the latter only if the order was actually paid).
      await restoreOrderOnCancel(order, req.userId, note, status);
    }

    await order.save();

    // Log audit
    await AuditLog.create({
      userId: req.userId,
      action: 'status_change',
      resource: 'order',
      resourceId: order._id.toString(),
      oldValue: { status: oldStatus },
      newValue: { status, note },
    });

    // Notify customer
    notifyOrderStatusChange(
      order.userId.toString(),
      order.orderNumber,
      status,
      getOrderStatusLabel(status)
    ).catch(console.error);

    // Email the customer about the transition (accepted / out_for_delivery /
    // delivered / cancelled / failed)
    emailCustomerOrderStatus(order, status).catch(console.error);

    res.json({
      success: true,
      data: order,
    });
  })
);

// Set / update shipment tracking (admin)
router.patch(
  '/:id/shipment',
  authenticate,
  requireAdmin,
  requirePermission('orders', 'write'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { carrier, trackingNumber, trackingUrl, estimatedDelivery } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError('Invalid order ID');
    }

    if (typeof carrier !== 'string' || !carrier.trim()) {
      throw new BadRequestError('Carrier is required');
    }
    if (typeof trackingNumber !== 'string' || !trackingNumber.trim()) {
      throw new BadRequestError('Tracking number is required');
    }

    const order = await Order.findById(id);
    if (!order) {
      throw new NotFoundError('Order');
    }

    if (order.status === 'cancelled' || order.status === 'failed') {
      throw new BadRequestError(
        `Cannot add shipment tracking to a ${order.status} order`
      );
    }

    const cleanCarrier = carrier.trim();
    const cleanTracking = trackingNumber.trim();
    const oldShipment = order.shipment
      ? {
          carrier: order.shipment.carrier,
          trackingNumber: order.shipment.trackingNumber,
        }
      : null;

    order.shipment = {
      carrier: cleanCarrier,
      trackingNumber: cleanTracking,
      // Respect an explicitly supplied URL, otherwise derive one from the carrier map.
      trackingUrl:
        typeof trackingUrl === 'string' && trackingUrl.trim()
          ? trackingUrl.trim()
          : buildTrackingUrl(cleanCarrier, cleanTracking),
      // Stamp the ship date the first time tracking is recorded; later edits
      // (typo fix, carrier swap) must not move it.
      shippedAt: order.shipment?.shippedAt || new Date(),
      estimatedDelivery: estimatedDelivery
        ? new Date(estimatedDelivery)
        : order.shipment?.estimatedDelivery || order.estimatedDelivery,
    };

    await order.save();

    await AuditLog.create({
      userId: req.userId,
      action: 'update',
      resource: 'order',
      resourceId: order._id.toString(),
      oldValue: { shipment: oldShipment },
      newValue: {
        shipment: {
          carrier: order.shipment.carrier,
          trackingNumber: order.shipment.trackingNumber,
          trackingUrl: order.shipment.trackingUrl,
        },
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      success: true,
      data: order,
    });
  })
);

// Issue a (possibly partial) refund against an order (admin)
router.post(
  '/:id/refund',
  authenticate,
  requireAdmin,
  requirePermission('orders', 'write'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { amount, reason } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError('Invalid order ID');
    }

    const rawAmount = Number(amount);
    if (!Number.isFinite(rawAmount) || rawAmount <= 0) {
      throw new BadRequestError('Refund amount must be greater than 0');
    }
    // Money is SAR with 2 decimals; normalise so float noise can never sneak a
    // fraction of a halala past the "must not exceed the total" guard.
    const refundAmount = Math.round(rawAmount * 100) / 100;

    const order = await Order.findById(id);
    if (!order) {
      throw new NotFoundError('Order');
    }

    // Only money that was actually collected can be given back. A 'pending'
    // (e.g. undelivered COD) or 'failed' order never produced a payment, and an
    // already fully-'refunded' order has nothing left to return.
    if (order.paymentStatus !== 'paid') {
      throw new BadRequestError(
        order.paymentStatus === 'refunded'
          ? 'This order has already been fully refunded'
          : 'Only a paid order can be refunded'
      );
    }

    const alreadyRefunded = (order.refunds || []).reduce(
      (sum, r) => sum + (r.amount || 0),
      0
    );
    if (Math.round((alreadyRefunded + refundAmount) * 100) / 100 > order.total) {
      throw new BadRequestError(
        `Refund exceeds the order total. Already refunded SAR ${alreadyRefunded.toFixed(
          2
        )} of SAR ${order.total.toFixed(2)}.`
      );
    }

    // The check above is only advisory — it produces a friendly error. The
    // binding guarantee is this single guarded atomic update, mirroring the
    // returns refund flow: the refund is only appended if, *at write time*, the
    // order is still 'paid' AND the existing refunds plus this one still fit
    // inside the total. Two concurrent refund clicks therefore cannot both
    // land beyond the total, and an identical amount submitted twice within
    // 20s (double-click / retry) is rejected outright — same double-submit
    // window used by order creation. Only the request that wins the claim
    // writes to the ledger, so a Transaction is never double-written.
    const claimed = await Order.findOneAndUpdate(
      {
        _id: order._id,
        paymentStatus: 'paid',
        refunds: {
          $not: {
            $elemMatch: {
              amount: refundAmount,
              refundedAt: { $gte: new Date(Date.now() - 20_000) },
            },
          },
        },
        $expr: {
          $lte: [
            {
              $round: [
                { $add: [{ $sum: '$refunds.amount' }, refundAmount] },
                2,
              ],
            },
            '$total',
          ],
        },
      },
      {
        $push: {
          refunds: {
            amount: refundAmount,
            reason: reason || undefined,
            refundedAt: new Date(),
            refundedBy: req.userId,
          },
        },
      },
      { new: true }
    );

    if (!claimed) {
      throw new ConflictError(
        'This refund could not be applied — it was either just processed or it would exceed the order total'
      );
    }

    const refundedTotal =
      Math.round(
        (claimed.refunds || []).reduce((sum, r) => sum + (r.amount || 0), 0) * 100
      ) / 100;
    const fullyRefunded = refundedTotal >= claimed.total;

    // Record the refund in the accounting ledger. This is the mirror of
    // `bookOrderRevenue()`'s credit — the revenue was recognised once, at
    // payment, so each refund writes exactly one offsetting debit for its own
    // amount and never re-touches the original credit.
    await Transaction.create({
      type: 'debit',
      amount: refundAmount,
      category: 'order_refund',
      description: `${fullyRefunded ? 'Refund' : 'Partial refund'} for order ${
        claimed.orderNumber
      }${reason ? ` — ${reason}` : ''}`,
      reference: claimed.orderNumber,
      orderId: claimed._id,
      date: new Date(),
      createdBy: req.userId,
    });

    // Only a cumulative refund that reaches the full total flips the payment
    // status; anything less leaves the order 'paid' (it is a partial refund).
    // Guarded on 'paid' so it stays idempotent under concurrency.
    if (fullyRefunded) {
      await Order.updateOne(
        { _id: claimed._id, paymentStatus: 'paid' },
        { $set: { paymentStatus: 'refunded' } }
      );
      claimed.paymentStatus = 'refunded';
    }

    await AuditLog.create({
      userId: req.userId,
      action: 'update',
      resource: 'order',
      resourceId: claimed._id.toString(),
      oldValue: { refundedTotal: refundedTotal - refundAmount, paymentStatus: 'paid' },
      newValue: {
        refundAmount,
        reason,
        refundedTotal,
        paymentStatus: claimed.paymentStatus,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      success: true,
      message: fullyRefunded
        ? 'Order fully refunded'
        : `Partial refund of SAR ${refundAmount.toFixed(2)} recorded`,
      data: {
        orderNumber: claimed.orderNumber,
        refundAmount,
        refundedTotal,
        remaining: Math.round((claimed.total - refundedTotal) * 100) / 100,
        paymentStatus: claimed.paymentStatus,
        refunds: claimed.refunds,
      },
    });
  })
);

// Get order statistics (admin)
router.get(
  '/stats/summary',
  authenticate,
  requireAdmin,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [statusCounts, todayStats, weekStats] = await Promise.all([
      Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: today } } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            revenue: { $sum: '$total' },
          },
        },
      ]),
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          },
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            revenue: { $sum: '$total' },
          },
        },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        statusCounts: statusCounts.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
        today: todayStats[0] || { count: 0, revenue: 0 },
        week: weekStats[0] || { count: 0, revenue: 0 },
      },
    });
  })
);

export default router;

// ============================================
// PRIMO API - Order Routes
// ============================================

import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { createOrderSchema, updateOrderStatusSchema, orderFiltersSchema, paginationSchema } from '@primo/shared';
import { Order, IOrderItem } from '../models/Order';
import { Product } from '../models/Product';
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
import { asyncHandler, NotFoundError, BadRequestError } from '../middleware/errorHandler';
import { sendOrderConfirmationEmail } from '../services/email.service';
import { notifyAdminsNewOrder, notifyOrderStatusChange, notifyAdminsLowStock } from '../services/notification.service';
import { getOrderStatusLabel } from '@primo/shared';

const router = Router();

// Shared side-effects when an order is cancelled (used by both the customer
// self-cancel route and the admin status-change route): restore stock, refund
// any redeemed loyalty points, and record a refund transaction. Sets the
// cancellation fields on the order but leaves status/save to the caller.
async function restoreOrderOnCancel(
  order: any,
  actorUserId: string | undefined,
  reason?: string
): Promise<void> {
  order.cancelledAt = new Date();
  if (reason) order.cancelReason = reason;
  order.paymentStatus = 'refunded';

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

    await Product.updateOne(
      { _id: item.productId },
      { $inc: { stockQuantity: item.quantity, soldCount: -item.quantity } }
    );

    await StockMovement.create({
      productId: item.productId,
      type: 'return',
      quantity: item.quantity,
      previousStock,
      newStock,
      reason: `Order ${order.orderNumber} cancelled`,
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
      description: `Refund of ${order.pointsRedeemed} points for cancelled order ${order.orderNumber}`,
    });
  }

  // Record refund transaction in the ledger
  await Transaction.create({
    type: 'debit',
    amount: order.total,
    category: 'order_refund',
    description: `Refund for cancelled order ${order.orderNumber}`,
    reference: order.orderNumber,
    orderId: order._id,
    date: new Date(),
    createdBy: actorUserId,
  });
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
      .map((it: any) => `${it.productId}:${it.quantity}`)
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
        .map((it: any) => `${it.productId}:${it.quantity}`)
        .sort()
        .join('|');
      if (recentSig === itemSignature) {
        res.status(200).json({ success: true, data: recentOrder, duplicate: true });
        return;
      }
    }

    // Validate and get products
    const productIds = items.map((item: any) => item.productId);
    const products = await Product.find({
      _id: { $in: productIds },
      isActive: true,
    });

    if (products.length !== items.length) {
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

      if (product.stockQuantity < item.quantity) {
        throw new BadRequestError(`Insufficient stock for ${product.title}`);
      }

      const discountPct = product.discount ?? 0;
      const hasDiscount = discountPct > 0 &&
        (!product.discountEndsAt || new Date(product.discountEndsAt) > new Date());
      const itemPrice = hasDiscount
        ? product.price * (1 - discountPct / 100)
        : product.price;

      orderItems.push({
        productId: product._id,
        title: product.title,
        sku: product.sku,
        price: itemPrice,
        originalPrice: hasDiscount ? product.price : undefined,
        discount: hasDiscount ? discountPct : undefined,
        quantity: item.quantity,
        image: product.images[0]?.url,
      });

      subtotal += itemPrice * item.quantity;
    }

    // Atomically RESERVE stock for every item before doing anything else. A guarded
    // $inc (decrement only when stockQuantity >= requested) makes this safe under
    // high concurrency — it prevents overselling when many customers check out the
    // same product at once. If any item can't be reserved, roll back the ones that
    // were and abort so no order/charge/points side-effects happen.
    const stockReservations: {
      productId: any;
      quantity: number;
      previousStock: number;
      newStock: number;
      product: any;
    }[] = [];
    for (const item of items) {
      const reserved = await Product.findOneAndUpdate(
        { _id: item.productId, isActive: true, stockQuantity: { $gte: item.quantity } },
        { $inc: { stockQuantity: -item.quantity, soldCount: item.quantity } },
        { new: true }
      );
      if (!reserved) {
        for (const r of stockReservations) {
          await Product.updateOne(
            { _id: r.productId },
            { $inc: { stockQuantity: r.quantity, soldCount: -r.quantity } }
          );
        }
        const p = products.find((x) => x._id.toString() === item.productId);
        throw new BadRequestError(
          `Insufficient stock for ${p?.title || 'an item in your cart'} — the last units were just purchased. Please update your cart and try again.`
        );
      }
      stockReservations.push({
        productId: reserved._id,
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
      paymentStatus: paymentMethod === 'cash_on_delivery' ? 'pending' : 'pending',
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

    // Create transaction record for accounting
    await Transaction.create({
      type: 'credit',
      amount: total,
      category: 'order_revenue',
      description: `Revenue from order ${order.orderNumber}`,
      reference: order.orderNumber,
      orderId: order._id,
      date: new Date(),
      createdBy: req.userId,
    });

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
        const existingItem = cart.items.find(
          (i) => i.productId.toString() === item.productId.toString()
        );

        if (existingItem) {
          existingItem.quantity += item.quantity;
        } else {
          cart.items.push({
            productId: item.productId,
            quantity: Math.min(item.quantity, product.stockQuantity),
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

    if (status === 'cancelled') {
      // Restore stock, refund redeemed loyalty points, and record the refund.
      await restoreOrderOnCancel(order, req.userId, note);
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

    res.json({
      success: true,
      data: order,
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

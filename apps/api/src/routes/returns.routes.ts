// ============================================
// PRIMO API - Return / RMA Routes
// ============================================

import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { Return, RETURN_REASONS, RETURN_STATUSES, ReturnStatus } from '../models/Return';
import { Order } from '../models/Order';
import { Product } from '../models/Product';
import { Settings } from '../models/Settings';
import { StockMovement } from '../models/StockMovement';
import { Transaction } from '../models/Transaction';
import { AuditLog } from '../models/AuditLog';
import { authenticate, requireAdmin, requirePermission, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { invalidateOnWrite } from '../middleware/cache';
import { asyncHandler, NotFoundError, BadRequestError, ConflictError } from '../middleware/errorHandler';

const router = Router();

// Refunding a return puts stock back on the shelf, so cached product listings
// must be dropped after any write here.
router.use(invalidateOnWrite('products'));

// Fallback when no return-window setting is configured — matches the 30-day
// policy advertised on the storefront.
const DEFAULT_RETURN_WINDOW_DAYS = 30;

const createReturnSchema = z.object({
  orderId: z.string().min(1, 'Order is required'),
  reason: z.enum(RETURN_REASONS as [string, ...string[]]),
  description: z.string().max(2000).optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        // MUST be declared: validate() replaces req.body with the parsed result,
        // so an undeclared field is silently dropped — which would make every
        // returned line fall back to the product default and restock the wrong
        // variant.
        variantId: z.string().optional(),
        quantity: z.number().int().positive(),
        reason: z.enum(RETURN_REASONS as [string, ...string[]]).optional(),
      })
    )
    .min(1, 'Select at least one item to return'),
});

const updateReturnStatusSchema = z.object({
  status: z.enum(RETURN_STATUSES as [string, ...string[]]),
  adminNote: z.string().max(2000).optional(),
  refundAmount: z.number().min(0).optional(),
});

/** Resolve the return window (in days) from Settings, falling back to 30. */
async function getReturnWindowDays(): Promise<number> {
  try {
    const settings = await (Settings as any).getSettings();
    const configured =
      settings?.returnWindowDays ?? settings?.returnPolicyDays ?? settings?.returnDays;
    if (typeof configured === 'number' && configured > 0) return configured;
  } catch {
    // Settings unavailable — fall through to the default.
  }
  return DEFAULT_RETURN_WINDOW_DAYS;
}

// ========== CUSTOMER ROUTES ==========

// Request a return against a delivered order
router.post(
  '/',
  authenticate,
  validate(createReturnSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { orderId, reason, description, items } = req.body;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      throw new BadRequestError('Invalid order ID');
    }

    // Ownership check is part of the query — a customer can never open a return
    // against somebody else's order.
    const order = await Order.findOne({ _id: orderId, userId: req.userId }).lean();
    if (!order) {
      throw new NotFoundError('Order');
    }

    if (order.status !== 'delivered') {
      throw new BadRequestError('Only delivered orders can be returned');
    }

    // Return window: measured from delivery, falling back to the order date if
    // deliveredAt was never stamped.
    const windowDays = await getReturnWindowDays();
    const deliveredAt = order.deliveredAt ? new Date(order.deliveredAt) : new Date(order.createdAt);
    const windowEnds = new Date(deliveredAt.getTime() + windowDays * 24 * 60 * 60 * 1000);
    if (Date.now() > windowEnds.getTime()) {
      throw new BadRequestError(
        `The ${windowDays}-day return window for this order closed on ${windowEnds.toDateString()}`
      );
    }

    // One live return per order (rejected ones may be re-requested).
    const existing = await Return.findOne({
      orderId: order._id,
      status: { $ne: 'rejected' },
    }).lean();
    if (existing) {
      throw new ConflictError('A return request already exists for this order');
    }

    // Map ordered quantities so a customer can't return more than they bought
    // (or return a product that was never on the order). Keyed on
    // product + variant: the same product bought in two options is two
    // separate returnable lines, and each restocks its own variant.
    const lineKey = (productId: unknown, variantId?: string | null) =>
      `${String(productId)}::${variantId || ''}`;

    const orderedByProduct = new Map<string, any>();
    for (const item of order.items) {
      const key = lineKey(item.productId, (item as any).variantId);
      const seen = orderedByProduct.get(key);
      if (seen) {
        seen.quantity += item.quantity;
      } else {
        orderedByProduct.set(key, { ...item, quantity: item.quantity });
      }
    }

    const returnItems: any[] = [];
    let refundAmount = 0;
    const seenProducts = new Set<string>();

    for (const item of items) {
      const key = lineKey(item.productId, item.variantId);

      if (seenProducts.has(key)) {
        throw new BadRequestError('Each product may only appear once in a return request');
      }
      seenProducts.add(key);

      const ordered = orderedByProduct.get(key);
      if (!ordered) {
        throw new BadRequestError('One or more items are not part of this order');
      }

      if (item.quantity > ordered.quantity) {
        throw new BadRequestError(
          `Cannot return ${item.quantity} x "${ordered.title}" — only ${ordered.quantity} were ordered`
        );
      }

      returnItems.push({
        productId: ordered.productId,
        // Snapshot the option so the refund restocks the right variant.
        ...(ordered.variantId && {
          variantId: ordered.variantId,
          variantName: ordered.variantName,
          variantValue: ordered.variantValue,
        }),
        title: ordered.title,
        sku: ordered.sku,
        quantity: item.quantity,
        price: ordered.price,
        reason: item.reason || reason,
      });

      refundAmount += ordered.price * item.quantity;
    }

    refundAmount = Math.round(refundAmount * 100) / 100;

    let returnRequest;
    try {
      returnRequest = await Return.create({
        orderId: order._id,
        userId: req.userId,
        orderNumber: order.orderNumber,
        items: returnItems,
        reason,
        description,
        status: 'requested',
        refundAmount,
        requestedAt: new Date(),
      });
    } catch (err: any) {
      // Unique partial index on orderId — a concurrent submission won the race.
      if (err?.code === 11000) {
        throw new ConflictError('A return request already exists for this order');
      }
      throw err;
    }

    await AuditLog.create({
      userId: req.userId,
      action: 'create',
      resource: 'return',
      resourceId: returnRequest._id.toString(),
      newValue: {
        orderNumber: order.orderNumber,
        reason,
        items: returnItems.length,
        refundAmount,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json({
      success: true,
      data: returnRequest,
    });
  })
);

// Get the authenticated customer's own returns
router.get(
  '/my',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page = 1, limit = 10 } = req.query as any;
    const skip = (Number(page) - 1) * Number(limit);

    const [returns, total] = await Promise.all([
      Return.find({ userId: req.userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Return.countDocuments({ userId: req.userId }),
    ]);

    res.json({
      success: true,
      data: returns,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  })
);

// ========== ADMIN ROUTES ==========

// List all returns (admin)
router.get(
  '/',
  authenticate,
  requireAdmin,
  requirePermission('orders', 'read'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page = 1, limit = 20, status, search } = req.query as any;
    const skip = (Number(page) - 1) * Number(limit);

    const query: any = {};

    if (status) {
      const statuses = String(status)
        .split(',')
        .map((s) => s.trim())
        .filter((s) => RETURN_STATUSES.includes(s as ReturnStatus));
      if (statuses.length) query.status = { $in: statuses };
    }

    if (search) {
      query.orderNumber = { $regex: String(search), $options: 'i' };
    }

    const [returns, total] = await Promise.all([
      Return.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('userId', 'firstName lastName email')
        .lean(),
      Return.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: returns,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  })
);

// Update a return's status (admin): approve / reject / receive / refund
router.patch(
  '/:id/status',
  authenticate,
  requireAdmin,
  requirePermission('orders', 'write'),
  validate(updateReturnStatusSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { status, adminNote, refundAmount } = req.body as {
      status: ReturnStatus;
      adminNote?: string;
      refundAmount?: number;
    };

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError('Invalid return ID');
    }

    const returnRequest = await Return.findById(id);
    if (!returnRequest) {
      throw new NotFoundError('Return');
    }

    const oldStatus = returnRequest.status;

    const validTransitions: Record<ReturnStatus, ReturnStatus[]> = {
      requested: ['approved', 'rejected'],
      approved: ['received', 'rejected'],
      received: ['refunded', 'rejected'],
      rejected: [],
      refunded: [],
    };

    if (!validTransitions[oldStatus]?.includes(status)) {
      throw new BadRequestError(`Cannot transition a return from ${oldStatus} to ${status}`);
    }

    if (typeof refundAmount === 'number') {
      returnRequest.refundAmount = refundAmount;
    }
    if (adminNote !== undefined) {
      returnRequest.adminNote = adminNote;
    }

    if (status === 'refunded') {
      // Flip the status with a guarded update FIRST so two concurrent refund
      // clicks can never both restock and both write the ledger. Only the
      // request that actually performs the transition continues.
      const claimed = await Return.findOneAndUpdate(
        { _id: returnRequest._id, status: oldStatus },
        {
          $set: {
            status: 'refunded',
            refundAmount: returnRequest.refundAmount,
            adminNote: returnRequest.adminNote,
            resolvedAt: new Date(),
            resolvedBy: req.userId,
          },
        },
        { new: true }
      );

      if (!claimed) {
        throw new ConflictError('This return was already processed');
      }

      // Restore stock for every returned unit, recording an inventory movement.
      // Atomic $inc so concurrent stock changes elsewhere aren't clobbered.
      const productIds = claimed.items.map((i) => i.productId);
      const products = await Product.find({ _id: { $in: productIds } })
        .select('_id stockQuantity')
        .lean();
      const stockBefore = new Map(
        products.map((p: any) => [p._id.toString(), p.stockQuantity as number])
      );

      for (const item of claimed.items) {
        const key = item.productId.toString();
        if (!stockBefore.has(key)) continue;

        const previousStock = stockBefore.get(key) as number;
        const newStock = previousStock + item.quantity;

        if (item.variantId) {
          // Restore the aggregate AND the specific option in one atomic update.
          // Without the arrayFilters half, the variant's own stock would stay
          // understated forever and it would eventually read as sold out.
          await Product.updateOne(
            { _id: item.productId, 'variants.id': item.variantId },
            {
              $inc: {
                stockQuantity: item.quantity,
                soldCount: -item.quantity,
                'variants.$[v].stockQuantity': item.quantity,
              },
            },
            { arrayFilters: [{ 'v.id': item.variantId }] }
          );
        } else {
          await Product.updateOne(
            { _id: item.productId },
            { $inc: { stockQuantity: item.quantity, soldCount: -item.quantity } }
          );
        }

        await StockMovement.create({
          productId: item.productId,
          type: 'return',
          quantity: item.quantity,
          previousStock,
          newStock,
          reason: `Return for order ${claimed.orderNumber}`,
          reference: claimed.orderNumber,
          orderId: claimed.orderId,
          userId: req.userId,
        });
      }

      // Record the refund in the accounting ledger
      if (claimed.refundAmount > 0) {
        await Transaction.create({
          type: 'debit',
          amount: claimed.refundAmount,
          category: 'order_refund',
          description: `Refund for returned items on order ${claimed.orderNumber}`,
          reference: claimed.orderNumber,
          orderId: claimed.orderId,
          date: new Date(),
          createdBy: req.userId,
        });
      }

      await AuditLog.create({
        userId: req.userId,
        action: 'status_change',
        resource: 'return',
        resourceId: claimed._id.toString(),
        oldValue: { status: oldStatus },
        newValue: { status: 'refunded', refundAmount: claimed.refundAmount, adminNote },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({ success: true, data: claimed });
      return;
    }

    returnRequest.status = status;
    if (status === 'rejected' || status === 'received') {
      returnRequest.resolvedAt = new Date();
      returnRequest.resolvedBy = new mongoose.Types.ObjectId(req.userId);
    }
    await returnRequest.save();

    await AuditLog.create({
      userId: req.userId,
      action: 'status_change',
      resource: 'return',
      resourceId: returnRequest._id.toString(),
      oldValue: { status: oldStatus },
      newValue: { status, adminNote },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      success: true,
      data: returnRequest,
    });
  })
);

export default router;

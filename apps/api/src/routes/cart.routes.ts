// ============================================
// PRIMO API - Cart Routes
// ============================================

import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { addToCartSchema, updateCartItemSchema } from '@primo/shared';
import { Cart } from '../models/Cart';
import { Product, resolveLinePricing } from '../models/Product';
import { Settings } from '../models/Settings';
import { Referral } from '../models/Referral';
import { Order } from '../models/Order';
import { Offer } from '../models/Offer';
import { User } from '../models/User';
import { authenticate, optionalAuth, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { asyncHandler, NotFoundError, BadRequestError } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// A cart LINE is identified by product + selected variant, so the same product
// in two colours occupies two independent lines. Items saved before variants
// existed have no variantId and collapse to the plain productId key.
const lineKey = (productId: unknown, variantId?: string | null) =>
  `${String(productId)}::${variantId || ''}`;

// Get session ID from cookie or generate new one
const getSessionId = (req: AuthRequest, res: Response): string => {
  let sessionId = req.cookies.cartSessionId;
  if (!sessionId) {
    sessionId = uuidv4();
    res.cookie('cartSessionId', sessionId, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      sameSite: 'lax',
    });
  }
  return sessionId;
};

// Get or create cart
const getOrCreateCart = async (req: AuthRequest, res: Response) => {
  if (req.userId) {
    let cart = await Cart.findOne({ userId: req.userId });
    if (!cart) {
      // Check if there's a session cart to merge
      const sessionId = req.cookies.cartSessionId;
      if (sessionId) {
        const sessionCart = await Cart.findOne({ sessionId });
        if (sessionCart && sessionCart.items.length > 0) {
          cart = await Cart.create({
            userId: req.userId,
            items: sessionCart.items,
          });
          await sessionCart.deleteOne();
        } else {
          cart = await Cart.create({ userId: req.userId, items: [] });
        }
      } else {
        cart = await Cart.create({ userId: req.userId, items: [] });
      }
    }
    return cart;
  } else {
    const sessionId = getSessionId(req, res);
    let cart = await Cart.findOne({ sessionId });
    if (!cart) {
      cart = await Cart.create({ sessionId, items: [] });
    }
    return cart;
  }
};

// Get cart with populated products
router.get(
  '/',
  optionalAuth,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const cart = await getOrCreateCart(req, res);

    // Get product details
    const productIds = cart.items.map((item) => item.productId);
    const products = await Product.find({
      _id: { $in: productIds },
      isActive: true,
    })
      .select('title slug price compareAtPrice discount discountEndsAt stockQuantity variants images')
      .lean();

    // Build cart with product details. Price and stock are resolved server-side
    // per line through `resolveLinePricing`, so a selected variant's own stock
    // and price modifier — never the product aggregate — drive the totals.
    const items = cart.items
      .map((item) => {
        const product = products.find((p) => p._id.toString() === item.productId.toString());
        if (!product) return null;

        const { variant, variantMissing, unitPrice, availableStock } = resolveLinePricing(
          product,
          item.variantId
        );
        // The admin deleted this variant while it sat in the cart — drop the
        // line rather than silently charging the base price for it.
        if (variantMissing) return null;

        return {
          productId: product._id,
          variantId: variant?.id,
          variantName: variant?.name,
          variantValue: variant?.value,
          title: product.title,
          slug: product.slug,
          price: product.price,
          finalPrice: unitPrice,
          discount: product.discount,
          quantity: Math.min(item.quantity, availableStock),
          stockQuantity: availableStock,
          image: variant?.image || product.images?.[0]?.url,
          addedAt: item.addedAt,
        };
      })
      .filter(Boolean);

    // Get settings for dynamic shipping calculation
    const settings = await (Settings as any).getSettings();

    // Calculate totals
    const subtotal = items.reduce((sum, item: any) => sum + item.finalPrice * item.quantity, 0);
    let discount = 0;
    let discountCode = cart.discountCode;

    // Recalculate discount based on current cart if a code is saved
    if (discountCode) {
      const savedOffer = await Offer.findOne({
        code: discountCode,
        isActive: true,
        startsAt: { $lte: new Date() },
        endsAt: { $gt: new Date() },
      });
      if (savedOffer && subtotal > 0) {
        if (savedOffer.type === 'percentage') {
          discount = (subtotal * savedOffer.value) / 100;
          if (savedOffer.maxDiscount) {
            discount = Math.min(discount, savedOffer.maxDiscount);
          }
        } else if (savedOffer.type === 'fixed') {
          discount = Math.min(savedOffer.value, subtotal);
        }
        // Update saved amount with recalculated value
        if (cart.discountAmount !== discount) {
          cart.discountAmount = discount;
          await cart.save();
        }
      } else {
        // Offer expired or invalid, clear it
        cart.discountCode = undefined;
        cart.discountAmount = 0;
        discountCode = undefined;
        await cart.save();
      }
    }

    // Check for referral discount (only for authenticated users)
    let referralDiscount = 0;
    let hasReferralDiscount = false;
    if (req.userId) {
      // Check if user has a pending referral and hasn't placed any orders yet
      const [pendingReferral, existingOrders] = await Promise.all([
        Referral.findOne({ referee: req.userId, status: 'pending' }),
        Order.countDocuments({ userId: req.userId }),
      ]);

      if (pendingReferral && existingOrders === 0) {
        referralDiscount = pendingReferral.refereeDiscount ?? 0;
        hasReferralDiscount = true;
      }
    }

    // Calculate shipping based on settings
    let shipping = settings.shippingFee || 50;
    if (settings.enableFreeShipping && subtotal >= (settings.freeShippingThreshold || 500)) {
      shipping = 0;
    }

    // Total discount is promo code discount + referral discount
    const totalDiscount = discount + referralDiscount;
    const total = Math.max(0, subtotal + shipping - totalDiscount);

    // Get loyalty points info for authenticated users
    let loyaltyPoints = 0;
    let pointsRedemptionRate = 0;
    let loyaltyProgramEnabled = false;
    let minPointsToRedeem = 0;
    let maxPointsPerOrder = 0;
    if (req.userId) {
      const userForPoints = await User.findById(req.userId).select('loyaltyPoints pointsFrozen').lean();
      if (userForPoints && !(userForPoints as any).pointsFrozen) {
        loyaltyPoints = (userForPoints as any).loyaltyPoints || 0;
      }
      loyaltyProgramEnabled = settings.enableLoyaltyProgram || false;
      pointsRedemptionRate = settings.pointsRedemptionRate || 100;
      minPointsToRedeem = settings.minPointsToRedeem || 100;
      maxPointsPerOrder = settings.maxPointsPerOrder || 0;
    }

    res.json({
      success: true,
      data: {
        items,
        itemCount: items.reduce((sum, item: any) => sum + item.quantity, 0),
        subtotal,
        discount: totalDiscount,
        promoDiscount: discount,
        discountCode,
        referralDiscount,
        hasReferralDiscount,
        shipping,
        total,
        loyaltyPoints,
        loyaltyProgramEnabled,
        pointsRedemptionRate,
        minPointsToRedeem,
        maxPointsPerOrder,
      },
    });
  })
);

// Add item to cart
router.post(
  '/items',
  optionalAuth,
  validate(addToCartSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { productId, variantId, quantity } = req.body;

    // Verify product exists and has stock
    const product = await Product.findOne({
      _id: productId,
      isActive: true,
    });

    if (!product) {
      throw new NotFoundError('Product');
    }

    // A product WITH options must be added with one of them selected, otherwise
    // we'd have no idea which variant's stock to reserve at checkout.
    if (product.variants.length > 0 && !variantId) {
      throw new BadRequestError('Please choose an option before adding this product to the cart');
    }

    const { variantMissing, availableStock } = resolveLinePricing(product, variantId);
    if (variantMissing) {
      throw new BadRequestError('The selected option is no longer available');
    }

    if (availableStock < quantity) {
      throw new BadRequestError(`Only ${availableStock} items available`);
    }

    const cart = await getOrCreateCart(req, res);

    // Check if this exact product + variant line is already in the cart
    const existingItem = cart.items.find(
      (item) => lineKey(item.productId, item.variantId) === lineKey(productId, variantId)
    );

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > availableStock) {
        throw new BadRequestError(`Cannot add more than ${availableStock} items`);
      }
      existingItem.quantity = newQuantity;
    } else {
      cart.items.push({
        productId: new mongoose.Types.ObjectId(productId),
        ...(variantId ? { variantId } : {}),
        quantity,
        addedAt: new Date(),
      });
    }

    await cart.save();

    res.json({
      success: true,
      message: 'Item added to cart',
      data: {
        itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
      },
    });
  })
);

// Update cart item quantity
router.patch(
  '/items/:productId',
  optionalAuth,
  validate(updateCartItemSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { productId } = req.params;
    const { quantity, variantId } = req.body;

    const cart = await getOrCreateCart(req, res);

    // With a variantId, target that exact line; without one, fall back to the
    // first line for the product so pre-variant clients keep working.
    const itemIndex = variantId
      ? cart.items.findIndex(
          (item) => lineKey(item.productId, item.variantId) === lineKey(productId, variantId)
        )
      : cart.items.findIndex((item) => item.productId.toString() === productId);

    if (itemIndex === -1) {
      throw new NotFoundError('Cart item');
    }

    if (quantity === 0) {
      // Remove item
      cart.items.splice(itemIndex, 1);
    } else {
      // Verify stock — against the variant's own stock when one is selected
      const product = await Product.findById(productId);
      if (!product) {
        throw new BadRequestError('Insufficient stock');
      }
      const { variantMissing, availableStock } = resolveLinePricing(
        product,
        cart.items[itemIndex].variantId
      );
      if (variantMissing || availableStock < quantity) {
        throw new BadRequestError('Insufficient stock');
      }
      cart.items[itemIndex].quantity = quantity;
    }

    await cart.save();

    res.json({
      success: true,
      message: quantity === 0 ? 'Item removed from cart' : 'Cart updated',
    });
  })
);

// Remove item from cart
router.delete(
  '/items/:productId',
  optionalAuth,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { productId } = req.params;
    const variantId = req.query.variantId ? String(req.query.variantId) : undefined;

    const cart = await getOrCreateCart(req, res);

    // `?variantId=` removes just that option's line; without it every line for
    // the product is removed (the pre-variant behaviour).
    cart.items = cart.items.filter((item) =>
      variantId
        ? lineKey(item.productId, item.variantId) !== lineKey(productId, variantId)
        : item.productId.toString() !== productId
    );

    await cart.save();

    res.json({
      success: true,
      message: 'Item removed from cart',
    });
  })
);

// Sync cart - replaces cart items with provided items (sets absolute quantities)
router.post(
  '/sync',
  optionalAuth,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { items: syncItems } = req.body;

    if (!Array.isArray(syncItems)) {
      throw new BadRequestError('Items must be an array');
    }

    const cart = await getOrCreateCart(req, res);

    // Validate all products and build new items array. Batch-fetch every product
    // in ONE query (avoids an N+1 lookup per cart line under load).
    const validItems: {
      productId: mongoose.Types.ObjectId;
      variantId?: string;
      quantity: number;
      addedAt: Date;
    }[] = [];

    const requestedIds = syncItems
      .filter((it: any) => it.productId && mongoose.Types.ObjectId.isValid(it.productId))
      .map((it: any) => it.productId);
    const products = await Product.find({ _id: { $in: requestedIds }, isActive: true })
      .select('_id price discount discountEndsAt stockQuantity variants')
      .lean();
    const productMap = new Map(products.map((p: any) => [p._id.toString(), p]));

    for (const item of syncItems) {
      if (!item.productId || !mongoose.Types.ObjectId.isValid(item.productId)) continue;
      const qty = Math.max(1, Math.floor(item.quantity || 1));

      const product = productMap.get(item.productId.toString());
      if (!product) continue;

      const variantId = item.variantId ? String(item.variantId) : undefined;
      const { variantMissing, availableStock } = resolveLinePricing(product, variantId);
      // Skip stale lines: a deleted variant, or a variant-only product synced
      // from an old client that never picked an option.
      if (variantMissing) continue;
      if (product.variants?.length > 0 && !variantId) continue;

      const clampedQty = Math.min(qty, availableStock);
      if (clampedQty > 0) {
        validItems.push({
          productId: new mongoose.Types.ObjectId(item.productId),
          ...(variantId ? { variantId } : {}),
          quantity: clampedQty,
          addedAt: new Date(),
        });
      }
    }

    cart.items = validItems as any;
    await cart.save();

    res.json({
      success: true,
      message: 'Cart synced',
      data: {
        itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
      },
    });
  })
);

// Clear cart
router.delete(
  '/',
  optionalAuth,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const cart = await getOrCreateCart(req, res);

    cart.items = [];
    cart.discountCode = undefined;
    cart.discountAmount = 0;

    await cart.save();

    res.json({
      success: true,
      message: 'Cart cleared',
    });
  })
);

// Apply discount code
router.post(
  '/discount',
  optionalAuth,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { code } = req.body;

    if (!code) {
      throw new BadRequestError('Discount code required');
    }

    const cart = await getOrCreateCart(req, res);

    if (cart.items.length === 0) {
      throw new BadRequestError('Cart is empty');
    }

    // Get settings for currency
    const settings = await (Settings as any).getSettings();

    // Find offer
    const offer = await Offer.findOne({
      code: code.toUpperCase(),
      isActive: true,
      startsAt: { $lte: new Date() },
      endsAt: { $gt: new Date() },
    });

    if (!offer) {
      throw new BadRequestError('Invalid or expired discount code');
    }

    if (offer.usageLimit && offer.usedCount >= offer.usageLimit) {
      throw new BadRequestError('Discount code usage limit reached');
    }

    // Calculate cart subtotal
    const productIds = cart.items.map((item) => item.productId);
    const products = await Product.find({ _id: { $in: productIds } });

    const subtotal = cart.items.reduce((sum, item) => {
      const product = products.find((p) => p._id.toString() === item.productId.toString());
      if (!product) return sum;
      const { variantMissing, unitPrice } = resolveLinePricing(product, item.variantId);
      if (variantMissing) return sum;
      return sum + unitPrice * item.quantity;
    }, 0);

    // Check minimum order amount
    if (offer.minOrderAmount && subtotal < offer.minOrderAmount) {
      throw new BadRequestError(`Minimum order amount is ${settings.currency || 'SAR'} ${offer.minOrderAmount}`);
    }

    // Calculate discount
    let discount = 0;
    if (offer.type === 'percentage') {
      discount = (subtotal * offer.value) / 100;
      if (offer.maxDiscount) {
        discount = Math.min(discount, offer.maxDiscount);
      }
    } else if (offer.type === 'fixed') {
      discount = Math.min(offer.value, subtotal);
    }

    cart.discountCode = code.toUpperCase();
    cart.discountAmount = discount;
    await cart.save();

    res.json({
      success: true,
      message: 'Discount applied',
      data: {
        discountCode: cart.discountCode,
        discountAmount: discount,
        discountType: offer.type,
        discountValue: offer.value,
        maxDiscount: offer.maxDiscount || null,
      },
    });
  })
);

// Remove discount code
router.delete(
  '/discount',
  optionalAuth,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const cart = await getOrCreateCart(req, res);

    cart.discountCode = undefined;
    cart.discountAmount = 0;
    await cart.save();

    res.json({
      success: true,
      message: 'Discount removed',
    });
  })
);

// Merge guest cart with user cart (called after login)
router.post(
  '/merge',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const sessionId = req.cookies.cartSessionId;

    if (!sessionId) {
      res.json({
        success: true,
        message: 'No session cart to merge',
      });
      return;
    }

    const sessionCart = await Cart.findOne({ sessionId });
    if (!sessionCart || sessionCart.items.length === 0) {
      res.json({
        success: true,
        message: 'No items to merge',
      });
      return;
    }

    let userCart = await Cart.findOne({ userId: req.userId });
    if (!userCart) {
      userCart = await Cart.create({ userId: req.userId, items: [] });
    }

    // Merge items
    for (const sessionItem of sessionCart.items) {
      const existingItem = userCart.items.find(
        (item) =>
          lineKey(item.productId, item.variantId) ===
          lineKey(sessionItem.productId, sessionItem.variantId)
      );

      if (existingItem) {
        existingItem.quantity += sessionItem.quantity;
      } else {
        userCart.items.push(sessionItem);
      }
    }

    await userCart.save();
    await sessionCart.deleteOne();

    res.clearCookie('cartSessionId');

    res.json({
      success: true,
      message: 'Cart merged successfully',
    });
  })
);

export default router;

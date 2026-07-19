// ============================================
// PRIMO API - Review Routes
// ============================================

import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { createReviewSchema, moderateReviewSchema, paginationSchema } from '@primo/shared';
import { Review } from '../models/Review';
import { Settings } from '../models/Settings';
import { Product } from '../models/Product';
import { Order } from '../models/Order';
import { AuditLog } from '../models/AuditLog';
import { authenticate, requireAdmin, requirePermission, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { invalidateOnWrite } from '../middleware/cache';
import { asyncHandler, NotFoundError, BadRequestError, ForbiddenError } from '../middleware/errorHandler';
import { notifyAdminsNewReview } from '../services/notification.service';

const router = Router();

// Stock/rating changes here must refresh cached product listings
router.use(invalidateOnWrite('products'));

// Recompute a product's averageRating + reviewCount from its approved reviews
// using a DB-side aggregation. This avoids loading every review into memory
// (unbounded on popular products) and is consistent when many reviews land at
// once. Call after any create/update/delete/moderate that changes approval.
async function syncProductRating(productId: any): Promise<void> {
  const [stats] = await Review.aggregate([
    {
      $match: {
        productId: new mongoose.Types.ObjectId(productId.toString()),
        status: 'approved',
      },
    },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  await Product.findByIdAndUpdate(productId, {
    averageRating: stats ? Math.round(stats.avg * 10) / 10 : 0,
    reviewCount: stats ? stats.count : 0,
  });
}

// Get reviews for a product (public)
router.get(
  '/product/:productId',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { productId } = req.params;
    const { page = 1, limit = 10 } = req.query as any;
    const skip = (Number(page) - 1) * Number(limit);

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new BadRequestError('Invalid product ID');
    }

    const [reviews, total, stats] = await Promise.all([
      Review.find({ productId, status: 'approved' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Review.countDocuments({ productId, status: 'approved' }),
      Review.aggregate([
        { $match: { productId: new mongoose.Types.ObjectId(productId), status: 'approved' } },
        {
          $group: {
            _id: null,
            averageRating: { $avg: '$rating' },
            totalReviews: { $sum: 1 },
            rating5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
            rating4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
            rating3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
            rating2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
            rating1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
          },
        },
      ]),
    ]);

    const ratingStats = stats[0] || {
      averageRating: 0,
      totalReviews: 0,
      rating5: 0,
      rating4: 0,
      rating3: 0,
      rating2: 0,
      rating1: 0,
    };

    res.json({
      success: true,
      data: {
        reviews,
        stats: {
          averageRating: Math.round(ratingStats.averageRating * 10) / 10,
          totalReviews: ratingStats.totalReviews,
          distribution: {
            5: ratingStats.rating5,
            4: ratingStats.rating4,
            3: ratingStats.rating3,
            2: ratingStats.rating2,
            1: ratingStats.rating1,
          },
        },
      },
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  })
);

// Get user's reviews
router.get(
  '/my-reviews',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const reviews = await Review.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .populate('productId', 'title slug images')
      .lean();

    res.json({
      success: true,
      data: reviews,
    });
  })
);

// Check if user can review a product
router.get(
  '/can-review/:productId',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { productId } = req.params;

    // Check if user has a delivered order with this product
    const order = await Order.findOne({
      userId: req.userId,
      status: 'delivered',
      'items.productId': productId,
    });

    if (!order) {
      res.json({
        success: true,
        data: { canReview: false, reason: 'No delivered order found' },
      });
      return;
    }

    // Check if user already reviewed this product for this order
    const existingReview = await Review.findOne({
      userId: req.userId,
      productId,
      orderId: order._id,
    });

    if (existingReview) {
      res.json({
        success: true,
        data: { canReview: false, reason: 'Already reviewed' },
      });
      return;
    }

    res.json({
      success: true,
      data: { canReview: true, orderId: order._id },
    });
  })
);

// Create review
router.post(
  '/',
  authenticate,
  validate(createReviewSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { productId, orderId, rating, title, comment, images } = req.body;

    // Verify product exists
    const product = await Product.findById(productId);
    if (!product) {
      throw new NotFoundError('Product');
    }

    // Verify order exists and belongs to user
    const order = await Order.findOne({
      _id: orderId,
      userId: req.userId,
      status: 'delivered',
      'items.productId': productId,
    });

    if (!order) {
      throw new ForbiddenError('You can only review products from your delivered orders');
    }

    // Check for existing review
    const existingReview = await Review.findOne({
      userId: req.userId,
      productId,
      orderId,
    });

    if (existingReview) {
      throw new BadRequestError('You have already reviewed this product');
    }

    // Respect the moderation settings. These were previously ignored: reviews
    // were hardcoded to 'approved', so an admin who had switched reviews off —
    // or who required approval (the default) — still got every review published
    // instantly, with no way to vet it first.
    const reviewSettings = await (Settings as any).getSettings();

    if (reviewSettings.enableReviews === false) {
      throw new ForbiddenError('Reviews are currently disabled');
    }

    const requiresApproval = reviewSettings.reviewsRequireApproval !== false;

    const review = await Review.create({
      productId,
      userId: req.userId,
      userName: req.user!.fullName,
      orderId,
      rating,
      title,
      comment,
      images,
      status: requiresApproval ? 'pending' : 'approved',
      isVerifiedPurchase: true,
    });

    // Only an approved review may move the public rating. A pending one must
    // not, or moderation would be cosmetic.
    if (!requiresApproval) {
      await syncProductRating(productId);
    }

    // Notify admins (they can still delete inappropriate reviews)
    notifyAdminsNewReview(product.title, rating, req.user!.fullName).catch(console.error);

    res.status(201).json({
      success: true,
      data: review,
      message: requiresApproval
        ? 'Review submitted — it will appear once approved by our team'
        : 'Review submitted successfully',
    });
  })
);

// Update own review
router.patch(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { rating, title, comment } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError('Invalid review ID');
    }

    const review = await Review.findById(id);
    if (!review) {
      throw new NotFoundError('Review');
    }

    // Only allow the review author to update
    if (review.userId.toString() !== req.userId) {
      throw new ForbiddenError('You can only edit your own reviews');
    }

    if (rating !== undefined) review.rating = rating;
    if (title !== undefined) review.title = title;
    if (comment !== undefined) review.comment = comment;
    await review.save();

    // Update product rating
    await syncProductRating(review.productId);

    res.json({
      success: true,
      data: review,
      message: 'Review updated successfully',
    });
  })
);

// Delete own review
router.delete(
  '/:id/mine',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError('Invalid review ID');
    }

    const review = await Review.findById(id);
    if (!review) {
      throw new NotFoundError('Review');
    }

    // Only allow the review author to delete
    if (review.userId.toString() !== req.userId) {
      throw new ForbiddenError('You can only delete your own reviews');
    }

    await review.deleteOne();

    // Update product rating
    await syncProductRating(review.productId);

    res.json({
      success: true,
      message: 'Review deleted',
    });
  })
);

// Mark review as helpful
router.post(
  '/:id/helpful',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError('Invalid review ID');
    }

    const review = await Review.findByIdAndUpdate(
      id,
      { $inc: { helpfulCount: 1 } },
      { new: true }
    );

    if (!review) {
      throw new NotFoundError('Review');
    }

    res.json({
      success: true,
      data: { helpfulCount: review.helpfulCount },
    });
  })
);

// ========== ADMIN ROUTES ==========

// Get all reviews (admin)
router.get(
  '/',
  authenticate,
  requireAdmin,
  requirePermission('reviews', 'moderate'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page = 1, limit = 20, status } = req.query as any;
    const skip = (Number(page) - 1) * Number(limit);

    const query: any = {};
    if (status) {
      query.status = status;
    }

    const [reviews, total] = await Promise.all([
      Review.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('productId', 'title slug')
        .populate('userId', 'firstName lastName email')
        .lean(),
      Review.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: reviews,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  })
);

// Moderate review (admin)
router.patch(
  '/:id/moderate',
  authenticate,
  requireAdmin,
  requirePermission('reviews', 'moderate'),
  validate(moderateReviewSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError('Invalid review ID');
    }

    const review = await Review.findById(id);
    if (!review) {
      throw new NotFoundError('Review');
    }

    const wasApproved = review.status === 'approved';
    const isNowApproved = status === 'approved';
    const oldStatus = review.status;

    review.status = status;
    review.moderatedBy = new mongoose.Types.ObjectId(req.userId);
    review.moderatedAt = new Date();
    await review.save();

    // Log audit
    await AuditLog.create({
      userId: req.userId,
      action: 'update',
      resource: 'review',
      resourceId: review._id.toString(),
      oldValue: { status: oldStatus, productId: review.productId.toString(), rating: review.rating },
      newValue: { status, moderatedAt: review.moderatedAt },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    // Update product rating if status changed
    if (wasApproved !== isNowApproved) {
      await syncProductRating(review.productId);
    }

    res.json({
      success: true,
      data: review,
    });
  })
);

// Delete review (admin)
router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  requirePermission('reviews', 'moderate'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError('Invalid review ID');
    }

    const review = await Review.findById(id);
    if (!review) {
      throw new NotFoundError('Review');
    }

    const reviewData = { rating: review.rating, status: review.status, productId: review.productId.toString(), userId: review.userId?.toString() };
    await review.deleteOne();

    // Log audit
    await AuditLog.create({
      userId: req.userId,
      action: 'delete',
      resource: 'review',
      resourceId: id,
      oldValue: reviewData,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    // Update product rating
    await syncProductRating(review.productId);

    res.json({
      success: true,
      message: 'Review deleted',
    });
  })
);

export default router;

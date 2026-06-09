'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiStar,
  HiOutlineStar,
  HiCheck,
  HiOutlineThumbUp,
  HiOutlineTrash,
  HiOutlinePencilAlt,
  HiX,
} from 'react-icons/hi';
import { reviewsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { Button, Input, Textarea, Card, Badge, RatingSummary, Rating } from '@/components/ui';
import toast from 'react-hot-toast';

const reviewSchema = z.object({
  title: z.string().max(100).optional(),
  comment: z.string().min(10, 'Review must be at least 10 characters'),
});

type ReviewForm = z.infer<typeof reviewSchema>;

interface ProductReviewsProps {
  productId: string;
  productTitle: string;
  averageRating?: number;
  reviewCount?: number;
  ratingDistribution?: Record<number, number>;
}

export function ProductReviews({
  productId,
  productTitle,
  averageRating = 0,
  reviewCount = 0,
  ratingDistribution = {},
}: ProductReviewsProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<any>(null);
  const [selectedRating, setSelectedRating] = useState(5);
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();
  const isSuperAdmin = user?.role === 'super_admin';
  const userId = user?.id || user?._id;

  // Fetch reviews
  const { data: reviewsData, isLoading } = useQuery({
    queryKey: ['product-reviews', productId, page],
    queryFn: () => reviewsApi.getByProduct(productId, { page, limit: 10 }),
    enabled: !!productId,
  });

  // Check if user can review
  const { data: canReviewData } = useQuery({
    queryKey: ['can-review', productId],
    queryFn: () => reviewsApi.canReview(productId),
    enabled: !!productId && isAuthenticated,
  });

  const reviews = reviewsData?.reviews || [];
  const stats = reviewsData?.stats;
  const pagination = reviewsData?.pagination;

  // Create review mutation
  const createReviewMutation = useMutation({
    mutationFn: (data: { productId: string; orderId: string; rating: number; title?: string; comment: string }) =>
      reviewsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-reviews', productId] });
      queryClient.invalidateQueries({ queryKey: ['can-review', productId] });
      // Invalidate product details to update reviewCount in tabs
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Review submitted successfully!');
      setIsFormOpen(false);
      reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to submit review');
    },
  });

  // Update review mutation (own review)
  const updateReviewMutation = useMutation({
    mutationFn: ({ reviewId, data }: { reviewId: string; data: { rating?: number; title?: string; comment?: string } }) =>
      reviewsApi.update(reviewId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-reviews', productId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Review updated successfully!');
      setEditingReview(null);
      reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update review');
    },
  });

  // Delete own review mutation
  const deleteOwnReviewMutation = useMutation({
    mutationFn: (reviewId: string) => reviewsApi.deleteOwn(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-reviews', productId] });
      queryClient.invalidateQueries({ queryKey: ['can-review', productId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Review deleted');
    },
    onError: () => toast.error('Failed to delete review'),
  });

  // Delete review mutation (super admin)
  const deleteReviewMutation = useMutation({
    mutationFn: (reviewId: string) => reviewsApi.delete(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-reviews', productId] });
      queryClient.invalidateQueries({ queryKey: ['can-review', productId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Review deleted');
    },
    onError: () => toast.error('Failed to delete review'),
  });

  // Mark helpful mutation
  const markHelpfulMutation = useMutation({
    mutationFn: (reviewId: string) => reviewsApi.markHelpful(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-reviews', productId] });
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ReviewForm>({
    resolver: zodResolver(reviewSchema),
  });

  const onSubmit = (data: ReviewForm) => {
    if (editingReview) {
      updateReviewMutation.mutate({
        reviewId: editingReview._id,
        data: { rating: selectedRating, title: data.title, comment: data.comment },
      });
      return;
    }
    if (!canReviewData?.orderId) {
      toast.error('You must purchase this product before reviewing');
      return;
    }
    createReviewMutation.mutate({
      productId,
      orderId: canReviewData.orderId,
      rating: selectedRating,
      title: data.title,
      comment: data.comment,
    });
  };

  const handleEditReview = (review: any) => {
    setEditingReview(review);
    setSelectedRating(review.rating);
    reset({ title: review.title || '', comment: review.comment || '' });
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingReview(null);
    reset();
    setSelectedRating(5);
  };

  const canWriteReview = isAuthenticated && canReviewData?.canReview;

  return (
    <div className="space-y-8">
      {/* Rating Summary */}
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/3">
          <RatingSummary
            averageRating={stats?.averageRating || averageRating}
            totalReviews={stats?.totalReviews || reviewCount}
            distribution={stats?.distribution || ratingDistribution}
          />

          {/* Write Review Button */}
          {canWriteReview && (
            <Button
              className="mt-4 w-full"
              leftIcon={<HiOutlinePencilAlt size={18} />}
              onClick={() => setIsFormOpen(true)}
            >
              Write a Review
            </Button>
          )}

          {isAuthenticated && !canReviewData?.canReview && canReviewData?.reason && (
            <p className="mt-4 text-sm text-dark-500 text-center">
              {canReviewData.reason === 'Already reviewed'
                ? 'You have already reviewed this product'
                : 'Purchase this product to write a review'}
            </p>
          )}

          {!isAuthenticated && (
            <p className="mt-4 text-sm text-dark-500 text-center">
              Sign in to write a review
            </p>
          )}
        </div>

        {/* Reviews List */}
        <div className="md:w-2/3 space-y-4">
          {isLoading ? (
            [...Array(3)].map((_, i) => (
              <Card key={i} padding="md" className="animate-pulse">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-beige-200"></div>
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-beige-200 rounded w-1/4"></div>
                    <div className="h-3 bg-beige-200 rounded w-1/3"></div>
                    <div className="h-16 bg-beige-200 rounded"></div>
                  </div>
                </div>
              </Card>
            ))
          ) : reviews.length > 0 ? (
            <>
              {reviews.map((review: any) => (
                <motion.div
                  key={review._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card padding="md">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-lg font-semibold text-primary-600">
                            {(review.userName || 'A').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-dark-900">
                              {review.userName || 'Anonymous'}
                            </span>
                            {review.isVerifiedPurchase && (
                              <Badge variant="success" size="sm">
                                <HiCheck size={12} className="mr-1" />
                                Verified
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Rating value={review.rating} size="sm" />
                            <span className="text-xs text-dark-400">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Edit/Delete for own review or super admin */}
                      <div className="flex items-center gap-1">
                        {userId && review.userId === userId && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditReview(review)}
                              title="Edit review"
                            >
                              <HiOutlinePencilAlt size={16} className="text-dark-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm('Are you sure you want to delete your review?')) {
                                  deleteOwnReviewMutation.mutate(review._id);
                                }
                              }}
                              title="Delete review"
                            >
                              <HiOutlineTrash size={16} className="text-red-500" />
                            </Button>
                          </>
                        )}
                        {isSuperAdmin && review.userId !== userId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this review?')) {
                                deleteReviewMutation.mutate(review._id);
                              }
                            }}
                            title="Delete review (Admin)"
                          >
                            <HiOutlineTrash size={18} className="text-red-600" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {review.title && (
                      <h4 className="mt-3 font-medium text-dark-900">{review.title}</h4>
                    )}

                    {review.comment && (
                      <p className="mt-2 text-dark-600 text-sm">{review.comment}</p>
                    )}

                    {/* Helpful button */}
                    <div className="mt-4 flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => markHelpfulMutation.mutate(review._id)}
                        className="flex items-center gap-1 text-sm text-dark-500 hover:text-primary-600 transition-colors"
                      >
                        <HiOutlineThumbUp size={16} />
                        <span>Helpful ({review.helpfulCount || 0})</span>
                      </button>
                    </div>
                  </Card>
                </motion.div>
              ))}

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-dark-500">
                    Page {page} of {pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === pagination.totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-beige-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <HiOutlineStar className="text-beige-400" size={32} />
              </div>
              <p className="text-dark-500">No reviews yet.</p>
              {canWriteReview && (
                <Button
                  className="mt-4"
                  variant="outline"
                  onClick={() => setIsFormOpen(true)}
                >
                  Be the first to review
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Review Form Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-dark-950/60 backdrop-blur-sm z-50"
              onClick={handleCloseForm}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-dark-900">
                    {editingReview ? 'Edit Your Review' : 'Write a Review'}
                  </h3>
                  <button
                    type="button"
                    onClick={handleCloseForm}
                    className="p-2 text-dark-400 hover:text-dark-600 transition-colors"
                    title="Close"
                    aria-label="Close form"
                  >
                    <HiX size={20} />
                  </button>
                </div>

                <p className="text-sm text-dark-500 mb-4">
                  {editingReview ? 'Editing review for:' : 'Reviewing:'}{' '}
                  <span className="font-medium text-dark-900">{productTitle}</span>
                </p>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-2">
                      Your Rating
                    </label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          type="button"
                          onClick={() => setSelectedRating(rating)}
                          className="p-1 transition-transform hover:scale-110"
                          title={`Rate ${rating} star${rating > 1 ? 's' : ''}`}
                          aria-label={`Rate ${rating} star${rating > 1 ? 's' : ''}`}
                        >
                          <HiStar
                            size={28}
                            className={rating <= selectedRating ? 'text-yellow-400' : 'text-gray-300'}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <Input
                    label="Review Title (Optional)"
                    placeholder="Summarize your experience"
                    {...register('title')}
                  />

                  <Textarea
                    label="Your Review"
                    placeholder="Tell us what you think about this product..."
                    rows={4}
                    error={errors.comment?.message}
                    {...register('comment')}
                  />

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      fullWidth
                      onClick={handleCloseForm}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      fullWidth
                      isLoading={editingReview ? updateReviewMutation.isPending : createReviewMutation.isPending}
                    >
                      {editingReview ? 'Update Review' : 'Submit Review'}
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ProductReviews;

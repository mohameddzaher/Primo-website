'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { HiOutlineStar, HiOutlineTrash, HiOutlineCheck, HiOutlineX, HiOutlineDownload } from 'react-icons/hi';
import { Button, Card, Select, ConfirmModal } from '@/components/ui';
import { adminApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-error';
import { exportToCSV, reviewColumns } from '@/lib/export';
import toast from 'react-hot-toast';

export default function AdminReviewsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('all');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string }>({
    isOpen: false,
    id: '',
  });
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reviews', page, status],
    queryFn: () => adminApi.getReviews({ page, limit: 20, status: status !== 'all' ? status : undefined }),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => adminApi.approveReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      toast.success('Review approved');
    },
    onError: (error: any) => toast.error(getApiErrorMessage(error, 'Failed to approve review')),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => adminApi.rejectReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      toast.success('Review rejected');
    },
    onError: (error: any) => toast.error(getApiErrorMessage(error, 'Failed to reject review')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      toast.success('Review deleted');
      setDeleteModal({ isOpen: false, id: '' });
    },
    onError: (error: any) => toast.error(getApiErrorMessage(error, 'Failed to delete review')),
  });

  const reviews = data?.reviews || [];
  const pagination = data?.pagination;

  const handleDelete = (id: string) => {
    setDeleteModal({ isOpen: true, id });
  };

  const confirmDelete = () => {
    deleteMutation.mutate(deleteModal.id);
  };

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <HiOutlineStar
        key={i}
        size={16}
        className={i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
      />
    ));
  };

  const handleExport = () => {
    if (reviews.length === 0) {
      toast.error('No reviews to export');
      return;
    }
    exportToCSV(reviews, reviewColumns, `reviews-${new Date().toISOString().split('T')[0]}`);
    toast.success('Reviews exported successfully');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-dark-900">Reviews</h1>
          <p className="text-dark-500 mt-1">Manage product reviews and ratings</p>
        </div>
        <Button variant="outline" leftIcon={<HiOutlineDownload size={18} />} onClick={handleExport}>
          Export
        </Button>
      </div>

      <Card padding="md">
        <div className="flex flex-wrap gap-4">
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-48"
            options={[
              { value: 'all', label: 'All Reviews' },
              { value: 'pending', label: 'Pending' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' },
            ]}
          />
        </div>
      </Card>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-beige-50 border-b border-beige-200">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase">Product</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase">Customer</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase">Rating</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase">Review</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase">Status</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase">Date</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-beige-200">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-6 py-4">
                      <div className="h-8 bg-beige-200 rounded animate-pulse"></div>
                    </td>
                  </tr>
                ))
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-dark-500">
                    No reviews found
                  </td>
                </tr>
              ) : (
                reviews.map((review: any) => (
                  <motion.tr
                    key={review._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-beige-50"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-beige-100 rounded-lg overflow-hidden">
                          {review.productId?.images?.[0]?.url ? (
                            <img
                              src={review.productId.images[0].url}
                              alt={review.productId.images[0].alt || review.productId.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-beige-400">
                              No img
                            </div>
                          )}
                        </div>
                        <p className="font-medium text-dark-900 line-clamp-1 max-w-[150px]">
                          {review.productId?.title || 'Unknown Product'}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-dark-900">{review.userId?.firstName} {review.userId?.lastName || ''}</p>
                      <p className="text-sm text-dark-500">{review.userId?.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        {renderStars(review.rating)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-dark-600 line-clamp-2 max-w-[200px]">
                        {review.comment || '-'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          review.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : review.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {review.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-dark-600">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {review.status === 'pending' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => approveMutation.mutate(review._id)}
                              isLoading={approveMutation.isPending}
                            >
                              <HiOutlineCheck size={18} className="text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => rejectMutation.mutate(review._id)}
                              isLoading={rejectMutation.isPending}
                            >
                              <HiOutlineX size={18} className="text-red-600" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(review._id)}
                        >
                          <HiOutlineTrash size={18} className="text-red-600" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-beige-200">
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
      </Card>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: '' })}
        onConfirm={confirmDelete}
        title="Delete Review"
        message="Are you sure you want to delete this review? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

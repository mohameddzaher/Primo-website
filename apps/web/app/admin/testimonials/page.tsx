'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  HiOutlineStar,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineTrash,
  HiOutlineSparkles,
  HiOutlineDownload,
} from 'react-icons/hi';
import { Button, Input, Card, ConfirmModal } from '@/components/ui';
import { adminApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-error';
import { exportToCSV } from '@/lib/export';
import toast from 'react-hot-toast';

const testimonialColumns = [
  { key: 'customerName', header: 'Customer' },
  { key: 'customerEmail', header: 'Email' },
  { key: 'rating', header: 'Rating' },
  { key: 'title', header: 'Title' },
  { key: 'content', header: 'Content' },
  { key: 'status', header: 'Status' },
  { key: 'isFeatured', header: 'Featured' },
  { key: 'createdAt', header: 'Date', transform: (v: string) => new Date(v).toLocaleDateString() },
];

export default function AdminTestimonialsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string; name: string }>({
    isOpen: false,
    id: '',
    name: '',
  });
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-testimonials', page, search, statusFilter],
    queryFn: () => adminApi.getTestimonials({ page, limit: 20, search, status: statusFilter || undefined }),
  });

  const moderateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'approved' | 'rejected' }) =>
      adminApi.moderateTestimonial(id, status),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-testimonials'] });
      toast.success(`Testimonial ${status}`);
    },
    onError: (error: any) => toast.error(getApiErrorMessage(error, 'Failed to moderate testimonial')),
  });

  const toggleFeaturedMutation = useMutation({
    mutationFn: (id: string) => adminApi.toggleTestimonialFeatured(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-testimonials'] });
      toast.success('Featured status updated');
    },
    onError: (error: any) => toast.error(getApiErrorMessage(error, 'Failed to update featured status')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteTestimonial(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-testimonials'] });
      toast.success('Testimonial deleted');
      setDeleteModal({ isOpen: false, id: '', name: '' });
    },
    onError: (error: any) => toast.error(getApiErrorMessage(error, 'Failed to delete testimonial')),
  });

  const handleDelete = (id: string, name: string) => {
    setDeleteModal({ isOpen: true, id, name });
  };

  const confirmDelete = () => {
    deleteMutation.mutate(deleteModal.id);
  };

  const testimonials = data?.testimonials || [];
  const pagination = data?.pagination;

  const handleExport = () => {
    if (testimonials.length === 0) {
      toast.error('No testimonials to export');
      return;
    }
    exportToCSV(testimonials, testimonialColumns, `testimonials-${new Date().toISOString().split('T')[0]}`);
    toast.success('Testimonials exported successfully');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
            Rejected
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
            Pending
          </span>
        );
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <HiOutlineStar
            key={i}
            size={14}
            className={i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-dark-900">Testimonials</h1>
          <p className="text-dark-500 mt-1">Manage customer testimonials and reviews</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" leftIcon={<HiOutlineDownload size={18} />} onClick={handleExport}>
            Export
          </Button>
        </div>
      </div>

      <Card padding="md">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by name, email, or content..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="px-3 py-2 border border-beige-200 rounded-lg bg-white text-dark-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </Card>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-beige-50 border-b border-beige-200">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase">Customer</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase">Rating</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase">Content</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase">Status</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase">Featured</th>
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
              ) : testimonials.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-dark-500">
                    No testimonials found
                  </td>
                </tr>
              ) : (
                testimonials.map((testimonial: any) => (
                  <motion.tr
                    key={testimonial._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-beige-50"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-dark-900">{testimonial.customerName}</p>
                        <p className="text-sm text-dark-500">{testimonial.customerEmail}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">{renderStars(testimonial.rating)}</td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        {testimonial.title && (
                          <p className="font-medium text-dark-900 text-sm mb-1">{testimonial.title}</p>
                        )}
                        <p className="text-dark-600 text-sm line-clamp-2">{testimonial.content}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(testimonial.status)}</td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => toggleFeaturedMutation.mutate(testimonial._id)}
                        className={`p-2 rounded-lg transition-colors ${
                          testimonial.isFeatured
                            ? 'bg-primary-100 text-primary-600'
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        }`}
                        title={testimonial.isFeatured ? 'Remove from featured' : 'Add to featured'}
                      >
                        <HiOutlineSparkles size={18} />
                      </button>
                    </td>
                    <td className="px-6 py-4 text-dark-600 text-sm">
                      {new Date(testimonial.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {testimonial.status === 'pending' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => moderateMutation.mutate({ id: testimonial._id, status: 'approved' })}
                              title="Approve"
                            >
                              <HiOutlineCheckCircle size={18} className="text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => moderateMutation.mutate({ id: testimonial._id, status: 'rejected' })}
                              title="Reject"
                            >
                              <HiOutlineXCircle size={18} className="text-red-600" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(testimonial._id, testimonial.customerName)}
                          title="Delete"
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
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
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
        onClose={() => setDeleteModal({ isOpen: false, id: '', name: '' })}
        onConfirm={confirmDelete}
        title="Delete Testimonial"
        message={`Are you sure you want to delete the testimonial from "${deleteModal.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

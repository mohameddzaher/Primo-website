'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineTag, HiOutlineDownload } from 'react-icons/hi';
import { Button, Card, ConfirmModal } from '@/components/ui';
import { adminApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-error';
import { exportToCSV, offerColumns } from '@/lib/export';
import toast from 'react-hot-toast';

export default function AdminOffersPage() {
  const [page, setPage] = useState(1);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string; title: string }>({
    isOpen: false,
    id: '',
    title: '',
  });
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-offers', page],
    queryFn: () => adminApi.getOffers({ page, limit: 20 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteOffer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-offers'] });
      toast.success('Offer deleted');
      setDeleteModal({ isOpen: false, id: '', title: '' });
    },
    onError: (error: any) => toast.error(getApiErrorMessage(error, 'Failed to delete offer')),
  });

  const handleDelete = (id: string, title: string) => {
    setDeleteModal({ isOpen: true, id, title });
  };

  const confirmDelete = () => {
    deleteMutation.mutate(deleteModal.id);
  };

  const offers = data?.offers || [];
  const pagination = data?.pagination;

  const handleExport = () => {
    if (offers.length === 0) {
      toast.error('No offers to export');
      return;
    }
    exportToCSV(offers, offerColumns, `offers-${new Date().toISOString().split('T')[0]}`);
    toast.success('Offers exported successfully');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-dark-900">Offers & Promotions</h1>
          <p className="text-dark-500 mt-1">Manage discount offers and promotional campaigns</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" leftIcon={<HiOutlineDownload size={18} />} onClick={handleExport}>
            Export
          </Button>
          <Link href="/admin/offers/new">
            <Button leftIcon={<HiOutlinePlus size={18} />}>Add Offer</Button>
          </Link>
        </div>
      </div>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-beige-50 border-b border-beige-200">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase">Offer</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase">Code</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase">Discount</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase">Usage</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase">Valid Period</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase">Status</th>
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
              ) : offers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-dark-500">
                    No offers found. Create your first promotional offer!
                  </td>
                </tr>
              ) : (
                offers.map((offer: any) => (
                  <motion.tr
                    key={offer._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-beige-50"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                          <HiOutlineTag className="text-primary-600" size={20} />
                        </div>
                        <div>
                          <p className="font-medium text-dark-900">{offer.title}</p>
                          <p className="text-sm text-dark-500 line-clamp-1">{offer.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="px-2 py-1 bg-beige-100 rounded text-sm font-mono">
                        {offer.code}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-dark-900">
                        {offer.type === 'percentage'
                          ? `${offer.value}%`
                          : `SAR ${offer.value}`}
                      </span>
                      {offer.minOrderAmount && (
                        <p className="text-sm text-dark-500">
                          Min: SAR {offer.minOrderAmount}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-dark-600">
                      {offer.usedCount || 0} / {offer.usageLimit || '∞'}
                    </td>
                    <td className="px-6 py-4 text-dark-600 text-sm">
                      <p>{new Date(offer.startsAt).toLocaleDateString()}</p>
                      <p>to {new Date(offer.endsAt).toLocaleDateString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          offer.isActive && new Date(offer.endsAt) > new Date()
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {offer.isActive && new Date(offer.endsAt) > new Date()
                          ? 'Active'
                          : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/offers/${offer._id}`}>
                          <Button variant="ghost" size="sm">
                            <HiOutlinePencil size={18} />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(offer._id, offer.title)}
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
        onClose={() => setDeleteModal({ isOpen: false, id: '', title: '' })}
        onConfirm={confirmDelete}
        title="Delete Offer"
        message={`Are you sure you want to delete "${deleteModal.title}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlinePhotograph, HiOutlineDownload } from 'react-icons/hi';
import { Button, Card, ConfirmModal } from '@/components/ui';
import { adminApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-error';
import { exportToCSV, bannerColumns } from '@/lib/export';
import toast from 'react-hot-toast';

export default function AdminBannersPage() {
  const [page, setPage] = useState(1);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string; title: string }>({
    isOpen: false,
    id: '',
    title: '',
  });
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-banners', page],
    queryFn: () => adminApi.getBanners({ page, limit: 20 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteBanner(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      toast.success('Banner deleted');
      setDeleteModal({ isOpen: false, id: '', title: '' });
    },
    onError: (error: any) => toast.error(getApiErrorMessage(error, 'Failed to delete banner')),
  });

  const handleDelete = (id: string, title: string) => {
    setDeleteModal({ isOpen: true, id, title });
  };

  const confirmDelete = () => {
    deleteMutation.mutate(deleteModal.id);
  };

  const banners = data?.banners || [];
  const pagination = data?.pagination;

  const handleExport = () => {
    if (banners.length === 0) {
      toast.error('No banners to export');
      return;
    }
    exportToCSV(banners, bannerColumns, `banners-${new Date().toISOString().split('T')[0]}`);
    toast.success('Banners exported successfully');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-dark-900">Banners</h1>
          <p className="text-dark-500 mt-1">Manage homepage and promotional banners</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" leftIcon={<HiOutlineDownload size={18} />} onClick={handleExport}>
            Export
          </Button>
          <Link href="/admin/banners/new">
            <Button leftIcon={<HiOutlinePlus size={18} />}>Add Banner</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <Card key={i} padding="none" className="animate-pulse">
              <div className="h-48 bg-beige-200"></div>
            </Card>
          ))
        ) : banners.length === 0 ? (
          <Card padding="lg" className="text-center">
            <div className="w-16 h-16 bg-beige-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <HiOutlinePhotograph className="text-beige-400" size={32} />
            </div>
            <h3 className="text-lg font-medium text-dark-900 mb-2">No banners yet</h3>
            <p className="text-dark-500 mb-4">Create your first banner to display on the homepage</p>
            <Link href="/admin/banners/new">
              <Button leftIcon={<HiOutlinePlus size={18} />}>Add Banner</Button>
            </Link>
          </Card>
        ) : (
          banners.map((banner: any) => (
            <motion.div
              key={banner._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card padding="none" className="overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1/3 h-48 md:h-auto bg-beige-100">
                    {(banner.image?.url || banner.image) ? (
                      <img
                        src={banner.image?.url || banner.image}
                        alt={banner.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-beige-400">
                        <HiOutlinePhotograph size={48} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-dark-900">{banner.title}</h3>
                        <p className="text-dark-500 mt-1">{banner.subtitle}</p>
                        {(banner.buttonLink || banner.link) && (
                          <p className="text-sm text-primary-600 mt-2">
                            Link: {banner.buttonLink || banner.link}
                          </p>
                        )}
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          banner.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {banner.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="mt-4 flex items-center gap-4 text-sm text-dark-500">
                      <span>Position: {banner.position || 'hero'}</span>
                      <span>Order: {banner.order || 0}</span>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      <Link href={`/admin/banners/${banner._id}`}>
                        <Button variant="outline" size="sm" leftIcon={<HiOutlinePencil size={16} />}>
                          Edit
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(banner._id, banner.title)}
                      >
                        <HiOutlineTrash size={16} className="text-red-600" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
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

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: '', title: '' })}
        onConfirm={confirmDelete}
        title="Delete Banner"
        message={`Are you sure you want to delete "${deleteModal.title}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

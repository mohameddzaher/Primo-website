'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineDownload, HiOutlineGlobe } from 'react-icons/hi';
import { Button, Card, ConfirmModal } from '@/components/ui';
import { brandsApi, adminApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-error';
import toast from 'react-hot-toast';

export default function AdminBrandsPage() {
  const queryClient = useQueryClient();
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string; name: string }>({
    isOpen: false,
    id: '',
    name: '',
  });

  const { data: brands, isLoading } = useQuery({
    queryKey: ['admin-brands'],
    queryFn: () => brandsApi.getAll(true),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteBrand(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-brands'] });
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      toast.success('Brand deleted');
      setDeleteModal({ isOpen: false, id: '', name: '' });
    },
    onError: (error: any) => {
      toast.error(getApiErrorMessage(error, 'Failed to delete brand'));
    },
  });

  const handleDelete = (id: string, name: string) => {
    setDeleteModal({ isOpen: true, id, name });
  };

  const confirmDelete = () => {
    deleteMutation.mutate(deleteModal.id);
  };

  const handleExport = () => {
    if (!brands || brands.length === 0) {
      toast.error('No brands to export');
      return;
    }
    const csvContent = [
      ['Name', 'Slug', 'Description', 'Website', 'Product Count', 'Status'].join(','),
      ...brands.map((brand: any) => [
        `"${brand.name}"`,
        brand.slug,
        `"${brand.description || ''}"`,
        brand.website || '',
        brand.productCount || 0,
        brand.isActive ? 'Active' : 'Inactive',
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brands-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Brands exported successfully');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-dark-900">Brands</h1>
          <p className="text-dark-500 mt-1">Manage product brands</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" leftIcon={<HiOutlineDownload size={18} />} onClick={handleExport}>
            Export
          </Button>
          <Link href="/admin/brands/new">
            <Button leftIcon={<HiOutlinePlus size={18} />}>Add Brand</Button>
          </Link>
        </div>
      </div>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-beige-50 border-b border-beige-200">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase">Brand</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase">Slug</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase">Products</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase">Website</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase">Status</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-dark-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-beige-200">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-6 py-4">
                      <div className="h-8 bg-beige-200 rounded animate-pulse"></div>
                    </td>
                  </tr>
                ))
              ) : !brands || brands.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-dark-500">No brands found</td>
                </tr>
              ) : (
                brands.map((brand: any) => (
                  <motion.tr key={brand._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-beige-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {brand.logo ? (
                          <img src={brand.logo} alt={brand.name} className="w-10 h-10 rounded-lg object-cover" />
                        ) : (
                          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                            <span className="text-primary-600 font-semibold">{brand.name.charAt(0)}</span>
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-dark-900">{brand.name}</p>
                          {brand.description && (
                            <p className="text-xs text-dark-500 line-clamp-1">{brand.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-dark-600">{brand.slug}</td>
                    <td className="px-6 py-4 text-dark-600">{brand.productCount || 0}</td>
                    <td className="px-6 py-4">
                      {brand.website ? (
                        <a
                          href={brand.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
                        >
                          <HiOutlineGlobe size={16} />
                          <span className="text-sm">Visit</span>
                        </a>
                      ) : (
                        <span className="text-dark-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        brand.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {brand.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/brands/${brand._id}`}>
                          <Button variant="ghost" size="sm"><HiOutlinePencil size={18} /></Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(brand._id, brand.name)}
                          className="text-error-600 hover:bg-error-50"
                        >
                          <HiOutlineTrash size={18} />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: '', name: '' })}
        onConfirm={confirmDelete}
        title="Delete Brand"
        message={`Are you sure you want to delete "${deleteModal.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineDownload } from 'react-icons/hi';
import { Button, Card, ConfirmModal } from '@/components/ui';
import { categoriesApi, adminApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-error';
import { exportToCSV, categoryColumns } from '@/lib/export';
import toast from 'react-hot-toast';

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string; name: string }>({
    isOpen: false,
    id: '',
    name: '',
  });

  const { data: categories, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => categoriesApi.getAll(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      toast.success('Category deleted');
      setDeleteModal({ isOpen: false, id: '', name: '' });
    },
    onError: (error: any) => {
      toast.error(getApiErrorMessage(error, 'Failed to delete category'));
    },
  });

  const handleDelete = (id: string, name: string) => {
    setDeleteModal({ isOpen: true, id, name });
  };

  const confirmDelete = () => {
    deleteMutation.mutate(deleteModal.id);
  };

  const handleExport = () => {
    if (!categories || categories.length === 0) {
      toast.error('No categories to export');
      return;
    }
    exportToCSV(categories, categoryColumns, `categories-${new Date().toISOString().split('T')[0]}`);
    toast.success('Categories exported successfully');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-dark-900">Categories</h1>
          <p className="text-dark-500 mt-1">Organize your products into categories</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" leftIcon={<HiOutlineDownload size={18} />} onClick={handleExport}>
            Export
          </Button>
          <Link href="/admin/categories/new">
            <Button leftIcon={<HiOutlinePlus size={18} />}>Add Category</Button>
          </Link>
        </div>
      </div>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-beige-50 border-b border-beige-200">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase">Category</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase">Slug</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase">Products</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase">Status</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-dark-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-beige-200">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-6 py-4">
                      <div className="h-8 bg-beige-200 rounded animate-pulse"></div>
                    </td>
                  </tr>
                ))
              ) : !categories || categories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-dark-500">No categories found</td>
                </tr>
              ) : (
                categories.map((category: any) => (
                  <motion.tr key={category._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-beige-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                          <span className="text-primary-600 font-semibold">{category.name.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="font-medium text-dark-900">{category.name}</p>
                          {category.description && (
                            <p className="text-xs text-dark-500 line-clamp-1">{category.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-dark-600">{category.slug}</td>
                    <td className="px-6 py-4 text-dark-600">{category.productCount || 0}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        category.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {category.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/categories/${category._id}`}>
                          <Button variant="ghost" size="sm"><HiOutlinePencil size={18} /></Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(category._id, category.name)}
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
        title="Delete Category"
        message={`Are you sure you want to delete "${deleteModal.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

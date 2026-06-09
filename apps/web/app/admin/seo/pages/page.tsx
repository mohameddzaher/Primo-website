'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineSearch,
} from 'react-icons/hi';
import { Button, Card, Badge, ConfirmModal, Input } from '@/components/ui';
import { adminApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-error';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function SEOPagesListPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string; path: string }>({
    isOpen: false,
    id: '',
    path: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-seo-pages', page, search],
    queryFn: () => adminApi.getSEOPages({ page, limit: 20, search: search || undefined }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteSEOPage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-seo-pages'] });
      toast.success('Page SEO config deleted');
      setDeleteModal({ isOpen: false, id: '', path: '' });
    },
    onError: (error: any) => {
      toast.error(getApiErrorMessage(error, 'Failed to delete page config'));
    },
  });

  const pages = data?.pages || [];
  const pagination = data?.pagination;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleDelete = (id: string, path: string) => {
    setDeleteModal({ isOpen: true, id, path });
  };

  const confirmDelete = () => {
    deleteMutation.mutate(deleteModal.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-dark-900">Page SEO Configurations</h1>
          <p className="text-dark-500 mt-1">Manage meta tags and SEO settings for individual pages</p>
        </div>
        <Link href="/admin/seo/pages/new">
          <Button leftIcon={<HiOutlinePlus size={18} />}>Add Page Config</Button>
        </Link>
      </div>

      {/* Search */}
      <Card padding="md">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search by path or title..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              leftIcon={<HiOutlineSearch size={18} />}
            />
          </div>
          <Button type="submit" variant="secondary">Search</Button>
        </form>
      </Card>

      {/* Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-beige-50 border-b border-beige-200">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase">Path</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase">Meta Title</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase">Meta Description</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase">noIndex</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase">noFollow</th>
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
              ) : pages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-dark-500">
                    No page configurations found
                  </td>
                </tr>
              ) : (
                pages.map((pageItem: any) => (
                  <motion.tr
                    key={pageItem._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-beige-50"
                  >
                    <td className="px-6 py-4">
                      <p className="font-medium text-dark-900 font-mono text-sm">{pageItem.path}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-dark-700 text-sm max-w-[200px] truncate">
                        {pageItem.metaTitle || '-'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-dark-500 text-sm max-w-[250px] truncate">
                        {pageItem.metaDescription || '-'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={pageItem.noIndex ? 'warning' : 'success'} size="sm">
                        {pageItem.noIndex ? 'Yes' : 'No'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={pageItem.noFollow ? 'warning' : 'success'} size="sm">
                        {pageItem.noFollow ? 'Yes' : 'No'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/seo/pages/${pageItem._id}`}>
                          <Button variant="ghost" size="sm">
                            <HiOutlinePencil size={18} />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(pageItem._id, pageItem.path)}
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
        onClose={() => setDeleteModal({ isOpen: false, id: '', path: '' })}
        onConfirm={confirmDelete}
        title="Delete Page Config"
        message={`Are you sure you want to delete the SEO configuration for "${deleteModal.path}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

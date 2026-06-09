'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  HiOutlineSave,
  HiOutlineCheck,
  HiOutlineFilter,
  HiOutlinePencil,
} from 'react-icons/hi';
import Link from 'next/link';
import { Button, Card, Badge, Select } from '@/components/ui';
import { adminApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-error';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface ProductSEOEdit {
  productId: string;
  metaTitle: string;
  metaDescription: string;
  dirty: boolean;
}

export default function ProductSEOBulkEditorPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [edits, setEdits] = useState<Record<string, ProductSEOEdit>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['admin-seo-products', page, statusFilter],
    queryFn: () =>
      adminApi.getSEOProducts({
        page,
        limit: 20,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      }),
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: (updates: { productId: string; metaTitle?: string; metaDescription?: string }[]) =>
      adminApi.bulkUpdateProductSEO(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-seo-products'] });
      setEdits({});
      toast.success('Product SEO updated successfully');
    },
    onError: (error: any) => {
      toast.error(getApiErrorMessage(error, 'Failed to update product SEO'));
    },
  });

  const singleUpdateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { metaTitle?: string; metaDescription?: string } }) =>
      adminApi.updateProductSEO(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-seo-products'] });
      setEdits((prev) => {
        const next = { ...prev };
        delete next[variables.id];
        return next;
      });
      toast.success('Product SEO updated');
    },
    onError: (error: any) => {
      toast.error(getApiErrorMessage(error, 'Failed to update product SEO'));
    },
  });

  const products = data?.products || [];
  const pagination = data?.pagination;

  const handleFieldChange = useCallback(
    (productId: string, field: 'metaTitle' | 'metaDescription', value: string, original: any) => {
      setEdits((prev) => {
        const existing = prev[productId] || {
          productId,
          metaTitle: original.metaTitle || '',
          metaDescription: original.metaDescription || '',
          dirty: false,
        };
        const updated = { ...existing, [field]: value };
        updated.dirty =
          updated.metaTitle !== (original.metaTitle || '') ||
          updated.metaDescription !== (original.metaDescription || '');
        return { ...prev, [productId]: updated };
      });
    },
    []
  );

  const getFieldValue = (productId: string, field: 'metaTitle' | 'metaDescription', original: string) => {
    if (edits[productId]) {
      return edits[productId][field];
    }
    return original || '';
  };

  const dirtyEdits = Object.values(edits).filter((e) => e.dirty);
  const hasDirtyEdits = dirtyEdits.length > 0;

  const handleSaveAll = () => {
    const updates = dirtyEdits.map((edit) => ({
      productId: edit.productId,
      metaTitle: edit.metaTitle || undefined,
      metaDescription: edit.metaDescription || undefined,
    }));
    if (updates.length === 0) {
      toast.error('No changes to save');
      return;
    }
    bulkUpdateMutation.mutate(updates);
  };

  const handleSaveRow = (productId: string) => {
    const edit = edits[productId];
    if (!edit || !edit.dirty) return;
    singleUpdateMutation.mutate({
      id: productId,
      data: {
        metaTitle: edit.metaTitle || undefined,
        metaDescription: edit.metaDescription || undefined,
      },
    });
  };

  const isComplete = (product: any) => {
    return product.metaTitle && product.metaDescription;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-dark-900">Product SEO Editor</h1>
          <p className="text-dark-500 mt-1">Bulk edit meta titles and descriptions for products</p>
        </div>
        {hasDirtyEdits && (
          <Button
            leftIcon={<HiOutlineSave size={18} />}
            onClick={handleSaveAll}
            isLoading={bulkUpdateMutation.isPending}
          >
            Save All ({dirtyEdits.length} changes)
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card padding="md">
        <div className="flex flex-wrap items-center gap-4">
          <HiOutlineFilter size={18} className="text-dark-400" />
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-48"
            options={[
              { value: 'all', label: 'All Products' },
              { value: 'complete', label: 'SEO Complete' },
              { value: 'incomplete', label: 'SEO Incomplete' },
            ]}
          />
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-beige-50 border-b border-beige-200">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase">Product</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase">Slug</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase min-w-[220px]">Meta Title</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase min-w-[280px]">Meta Description</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase">Status</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-dark-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-beige-200">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-6 py-4">
                      <div className="h-12 bg-beige-200 rounded animate-pulse"></div>
                    </td>
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-dark-500">
                    No products found
                  </td>
                </tr>
              ) : (
                products.map((product: any) => {
                  const isDirty = edits[product._id]?.dirty;
                  return (
                    <motion.tr
                      key={product._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={cn('hover:bg-beige-50', isDirty && 'bg-yellow-50/50')}
                    >
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-beige-100 rounded-lg overflow-hidden flex-shrink-0">
                            {product.image?.url ? (
                              <img
                                src={product.image.url}
                                alt={product.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-beige-400 text-xs">
                                N/A
                              </div>
                            )}
                          </div>
                          <p className="font-medium text-dark-900 text-sm line-clamp-1 max-w-[150px]">
                            {product.title}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <p className="text-dark-500 text-sm font-mono">{product.slug}</p>
                      </td>
                      <td className="px-6 py-3">
                        <input
                          type="text"
                          value={getFieldValue(product._id, 'metaTitle', product.metaTitle)}
                          onChange={(e) => handleFieldChange(product._id, 'metaTitle', e.target.value, product)}
                          placeholder="Enter meta title..."
                          className="w-full rounded-lg border border-beige-300 bg-white px-3 py-1.5 text-sm text-dark-900 placeholder:text-dark-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-all"
                        />
                      </td>
                      <td className="px-6 py-3">
                        <input
                          type="text"
                          value={getFieldValue(product._id, 'metaDescription', product.metaDescription)}
                          onChange={(e) => handleFieldChange(product._id, 'metaDescription', e.target.value, product)}
                          placeholder="Enter meta description..."
                          className="w-full rounded-lg border border-beige-300 bg-white px-3 py-1.5 text-sm text-dark-900 placeholder:text-dark-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-all"
                        />
                      </td>
                      <td className="px-6 py-3">
                        <Badge
                          variant={isComplete(product) ? 'success' : 'error'}
                          dot
                        >
                          {isComplete(product) ? 'Complete' : 'Incomplete'}
                        </Badge>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/admin/products/${product._id}`}>
                            <Button variant="ghost" size="sm" title="Edit product">
                              <HiOutlinePencil size={18} />
                            </Button>
                          </Link>
                          {isDirty && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSaveRow(product._id)}
                              isLoading={singleUpdateMutation.isPending}
                              title="Save SEO changes"
                            >
                              <HiOutlineCheck size={18} className="text-green-600" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
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
    </div>
  );
}

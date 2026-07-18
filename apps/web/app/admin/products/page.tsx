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
  HiOutlineEye,
  HiOutlineDownload,
} from 'react-icons/hi';
import { Button, Input, Select, Card, ConfirmModal } from '@/components/ui';
import { productsApi, adminApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-error';
import { exportToCSV, productColumns } from '@/lib/export';
import toast from 'react-hot-toast';

const stockOptions = [
  { value: '', label: 'All Stock' },
  { value: 'in_stock', label: 'In Stock' },
  { value: 'low_stock', label: 'Low Stock' },
  { value: 'out_of_stock', label: 'Out of Stock' },
];

export default function AdminProductsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string; title: string }>({
    isOpen: false,
    id: '',
    title: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', page, search, stockFilter],
    queryFn: () => {
      const params: any = { page, limit: 20, search };
      // Map stock filter to backend parameters
      if (stockFilter === 'in_stock') {
        params.inStock = true;
      } else if (stockFilter === 'out_of_stock') {
        params.inStock = false;
      }
      // low_stock will be filtered client-side after fetching
      return productsApi.getAll(params);
    },
  });

  // Filter for low stock on client side if needed
  const filteredProducts = stockFilter === 'low_stock'
    ? (data?.products || []).filter((p: any) => (p.stockQuantity || p.stock || 0) > 0 && (p.stockQuantity || p.stock || 0) <= 10)
    : (data?.products || []);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-inventory-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-inventory-dashboard'] });
      toast.success('Product deleted');
      setDeleteModal({ isOpen: false, id: '', title: '' });
    },
    onError: (error: any) => {
      toast.error(getApiErrorMessage(error, 'Failed to delete product'));
    },
  });

  const products = filteredProducts;
  const pagination = data?.pagination;

  const handleDelete = (id: string, title: string) => {
    setDeleteModal({ isOpen: true, id, title });
  };

  const confirmDelete = () => {
    deleteMutation.mutate(deleteModal.id);
  };

  const handleExport = () => {
    if (products.length === 0) {
      toast.error('No products to export');
      return;
    }
    exportToCSV(products, productColumns, `products-${new Date().toISOString().split('T')[0]}`);
    toast.success('Products exported successfully');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-dark-900">Products</h1>
          <p className="text-dark-500 mt-1">Manage your product catalog</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            leftIcon={<HiOutlineDownload size={18} />}
            onClick={handleExport}
            disabled={isLoading || products.length === 0}
          >
            Export
          </Button>
          <Link href="/admin/products/new">
            <Button leftIcon={<HiOutlinePlus size={18} />}>Add Product</Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card padding="md">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<HiOutlineSearch size={18} />}
            />
          </div>
          <Select
            options={stockOptions}
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            fullWidth={false}
            className="w-full sm:w-48"
          />
        </div>
      </Card>

      {/* Products Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-beige-50 border-b border-beige-200">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                  Actions
                </th>
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
                products.map((product: any) => (
                  <motion.tr
                    key={product._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-beige-50"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-beige-100 rounded-lg overflow-hidden flex-shrink-0">
                          {product.images?.[0]?.url ? (
                            <img
                              src={product.images[0].url}
                              alt={product.images[0].alt || product.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-beige-400 text-xs">
                              No Img
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-dark-900 line-clamp-1">
                            {product.title}
                          </p>
                          <p className="text-xs text-dark-500">{product.brand}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-dark-600">{product.sku}</td>
                    <td className="px-6 py-4">
                      {product.discount && product.discount > 0 ? (
                        <div>
                          <span className="font-medium text-green-700">
                            SAR {(product.finalPrice ?? (product.price * (1 - product.discount / 100))).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </span>
                          <span className="text-xs text-dark-400 line-through ml-1">
                            SAR {product.price.toLocaleString()}
                          </span>
                          <span className="ml-1 text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded font-medium">
                            -{product.discount}%
                          </span>
                        </div>
                      ) : (
                        <span className="font-medium text-dark-900">
                          SAR {product.price.toLocaleString()}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {(() => {
                        const stock = product.stockQuantity ?? product.stock ?? 0;
                        return (
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              stock === 0
                                ? 'bg-red-100 text-red-800'
                                : stock <= 10
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {stock === 0
                              ? 'Out of Stock'
                              : stock <= 10
                              ? `Low (${stock})`
                              : stock}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          product.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {product.isActive ? 'Active' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/products/${product.slug}`} target="_blank">
                          <Button variant="ghost" size="sm">
                            <HiOutlineEye size={18} />
                          </Button>
                        </Link>
                        <Link href={`/admin/products/${product._id}`}>
                          <Button variant="ghost" size="sm">
                            <HiOutlinePencil size={18} />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(product._id, product.title)}
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

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-beige-200">
            <p className="text-sm text-dark-500">
              Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, pagination.total)} of{' '}
              {pagination.total} products
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
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteModal.title}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

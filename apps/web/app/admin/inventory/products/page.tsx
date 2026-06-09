'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  HiOutlineSearch,
  HiOutlinePlus,
  HiOutlineMinus,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlinePencil,
  HiOutlineArrowLeft,
} from 'react-icons/hi';
import { Card, Button, Badge, Select, Skeleton, Input } from '@/components/ui';
import { adminApi, categoriesApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatCurrency, cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const stockStatusOptions = [
  { value: '', label: 'All Stock Status' },
  { value: 'in', label: 'In Stock' },
  { value: 'low', label: 'Low Stock' },
  { value: 'out', label: 'Out of Stock' },
];

export default function InventoryProductsPage() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Read initial filter from URL params
  const initialStatus = searchParams.get('stockStatus') || '';

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [stockStatus, setStockStatus] = useState(initialStatus);
  const [category, setCategory] = useState('');
  const [editingStock, setEditingStock] = useState<string | null>(null);
  const [stockValue, setStockValue] = useState(0);

  // Sync URL params when stockStatus changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (stockStatus) {
      params.set('stockStatus', stockStatus);
    } else {
      params.delete('stockStatus');
    }
    const newUrl = params.toString() ? `?${params.toString()}` : '/admin/inventory/products';
    router.replace(newUrl, { scroll: false });
  }, [stockStatus]);

  // Fetch categories for the filter
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll(),
  });

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    ...(categoriesData?.map((cat: any) => ({
      value: cat._id,
      label: cat.name,
    })) || []),
  ];

  const params = { page, limit: 20, search, stockStatus, category };

  const { data, isLoading } = useQuery({
    queryKey: ['admin-inventory-products', params],
    queryFn: () => adminApi.getInventoryProducts(params),
  });

  const updateStockMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { quantity: number; type: 'set' | 'add' | 'subtract'; reason?: string } }) =>
      adminApi.updateProductStock(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-inventory-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-inventory-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-inventory-movements'] });
      queryClient.invalidateQueries({ queryKey: ['admin-inventory-alerts'] });
      toast.success('Stock updated successfully');
      setEditingStock(null);
    },
    onError: (error: any) => {
      toast.error(getApiErrorMessage(error, 'Failed to update stock'));
    },
  });

  const products = data?.products || [];
  const pagination = data?.pagination;

  const handleStartEdit = (productId: string, currentStock: number) => {
    setEditingStock(productId);
    setStockValue(currentStock);
  };

  const handleCancelEdit = () => {
    setEditingStock(null);
    setStockValue(0);
  };

  const handleUpdateStock = (productId: string) => {
    updateStockMutation.mutate({
      id: productId,
      data: {
        quantity: stockValue,
        type: 'set',
        reason: 'Manual stock update from inventory management',
      },
    });
  };

  const handleIncrement = () => {
    setStockValue((prev) => prev + 1);
  };

  const handleDecrement = () => {
    setStockValue((prev) => Math.max(0, prev - 1));
  };

  // Page title based on filter
  const pageTitle = stockStatus === 'out'
    ? 'Out of Stock Products'
    : stockStatus === 'low'
    ? 'Low Stock Products'
    : stockStatus === 'in'
    ? 'In Stock Products'
    : 'Stock Management';

  const pageDescription = stockStatus === 'out'
    ? 'Products that are currently out of stock and need restocking'
    : stockStatus === 'low'
    ? 'Products with stock levels below their threshold'
    : 'Manage product stock levels and thresholds';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/inventory">
            <Button variant="ghost" size="sm">
              <HiOutlineArrowLeft size={20} />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-dark-900">{pageTitle}</h1>
            <p className="text-dark-500 mt-1">{pageDescription}</p>
          </div>
        </div>
        <Link href="/admin/inventory/movements/new">
          <Button leftIcon={<HiOutlinePlus size={18} />}>Record Movement</Button>
        </Link>
      </div>

      {/* Filters */}
      <Card padding="md">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search products by name or SKU..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              leftIcon={<HiOutlineSearch size={18} />}
            />
          </div>
          <Select
            options={stockStatusOptions}
            value={stockStatus}
            onChange={(e) => {
              setStockStatus(e.target.value);
              setPage(1);
            }}
            fullWidth={false}
            className="w-full sm:w-48"
          />
          <Select
            options={categoryOptions}
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
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
                  Current Stock
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                  Threshold
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                  Stock Value
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
                      <Skeleton className="h-12 w-full" />
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
                  const stock = product.stockQuantity ?? product.stock ?? 0;
                  const threshold = product.lowStockThreshold ?? 10;
                  const price = product.salePrice || product.price || 0;
                  const stockVal = stock * price;
                  const isEditing = editingStock === product._id;

                  return (
                    <motion.tr
                      key={product._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-beige-50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-beige-100 rounded-lg overflow-hidden flex-shrink-0">
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
                          <div className="min-w-0">
                            <p className="font-medium text-dark-900 truncate max-w-[200px]">
                              {product.title}
                            </p>
                            <p className="text-xs text-dark-500">
                              {product.categoryId?.name || product.brand || ''}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-dark-600 font-mono">
                        {product.sku || '---'}
                      </td>
                      <td className="px-6 py-4">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={handleDecrement}
                              className="w-7 h-7 flex items-center justify-center rounded bg-beige-100 hover:bg-beige-200 text-dark-600 transition-colors"
                            >
                              <HiOutlineMinus size={14} />
                            </button>
                            <input
                              type="number"
                              min={0}
                              value={stockValue}
                              onChange={(e) => setStockValue(Math.max(0, parseInt(e.target.value) || 0))}
                              className="w-16 h-7 text-center text-sm border border-beige-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                            <button
                              onClick={handleIncrement}
                              className="w-7 h-7 flex items-center justify-center rounded bg-beige-100 hover:bg-beige-200 text-dark-600 transition-colors"
                            >
                              <HiOutlinePlus size={14} />
                            </button>
                            <button
                              onClick={() => handleUpdateStock(product._id)}
                              disabled={updateStockMutation.isPending}
                              className="ml-1 w-7 h-7 flex items-center justify-center rounded bg-green-100 hover:bg-green-200 text-green-700 transition-colors"
                            >
                              <HiOutlineCheck size={14} />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="w-7 h-7 flex items-center justify-center rounded bg-red-100 hover:bg-red-200 text-red-700 transition-colors"
                            >
                              <HiOutlineX size={14} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartEdit(product._id, stock)}
                            className="group flex items-center gap-1"
                          >
                            <span
                              className={cn(
                                'px-2 py-1 rounded-full text-xs font-medium',
                                stock === 0
                                  ? 'bg-red-100 text-red-800'
                                  : stock <= threshold
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-green-100 text-green-800'
                              )}
                            >
                              {stock === 0
                                ? 'Out of Stock'
                                : stock <= threshold
                                ? `Low (${stock})`
                                : stock}
                            </span>
                            <HiOutlinePencil
                              size={14}
                              className="text-dark-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            />
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-dark-600">
                        {threshold}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-dark-900">
                        {formatCurrency(stockVal)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/admin/products/${product._id}`}>
                            <Button variant="ghost" size="sm">
                              <HiOutlinePencil size={16} />
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
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
    </div>
  );
}

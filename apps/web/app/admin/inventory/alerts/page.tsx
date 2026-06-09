'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  HiOutlineExclamation,
  HiOutlineXCircle,
  HiOutlinePlus,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineCube,
  HiOutlineArrowLeft,
} from 'react-icons/hi';
import { Card, Button, Badge, Skeleton } from '@/components/ui';
import { adminApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function InventoryAlertsPage() {
  const queryClient = useQueryClient();
  const [restockingProduct, setRestockingProduct] = useState<string | null>(null);
  const [restockQuantity, setRestockQuantity] = useState<number>(0);

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['admin-inventory-alerts'],
    queryFn: () => adminApi.getStockAlerts(),
  });

  const restockMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { quantity: number; type: 'add'; reason?: string } }) =>
      adminApi.updateProductStock(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-inventory-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-inventory-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-inventory-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-inventory-movements'] });
      toast.success('Product restocked successfully');
      setRestockingProduct(null);
      setRestockQuantity(0);
    },
    onError: (error: any) => {
      toast.error(getApiErrorMessage(error, 'Failed to restock product'));
    },
  });

  const handleStartRestock = (productId: string) => {
    setRestockingProduct(productId);
    setRestockQuantity(0);
  };

  const handleCancelRestock = () => {
    setRestockingProduct(null);
    setRestockQuantity(0);
  };

  const handleConfirmRestock = (productId: string) => {
    if (restockQuantity <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    restockMutation.mutate({
      id: productId,
      data: {
        quantity: restockQuantity,
        type: 'add',
        reason: 'Quick restock from alerts page',
      },
    });
  };

  const products = alerts || [];

  // Separate out-of-stock and low-stock for ordering
  const outOfStockProducts = products.filter((p: any) => (p.stockQuantity ?? p.stock ?? 0) === 0);
  const lowStockProducts = products.filter((p: any) => (p.stockQuantity ?? p.stock ?? 0) > 0);
  const sortedProducts = [...outOfStockProducts, ...lowStockProducts];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-dark-900">Low Stock Alerts</h1>
          <p className="text-dark-500 mt-1">
            Products below their stock threshold that need attention
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/inventory">
            <Button variant="outline" leftIcon={<HiOutlineArrowLeft size={18} />}>
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <Card padding="md" className="border-l-4 border-l-red-500">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 text-red-600">
                <HiOutlineXCircle size={20} />
              </div>
              <div>
                <p className="text-2xl font-semibold text-dark-900">
                  {isLoading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    outOfStockProducts.length
                  )}
                </p>
                <p className="text-sm text-dark-500">Out of Stock</p>
              </div>
            </div>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card padding="md" className="border-l-4 border-l-orange-500">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
                <HiOutlineExclamation size={20} />
              </div>
              <div>
                <p className="text-2xl font-semibold text-dark-900">
                  {isLoading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    lowStockProducts.length
                  )}
                </p>
                <p className="text-sm text-dark-500">Low Stock</p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Alerts List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} padding="md">
              <Skeleton className="h-32 w-full" />
            </Card>
          ))}
        </div>
      ) : sortedProducts.length === 0 ? (
        <Card padding="lg">
          <div className="text-center py-12">
            <HiOutlineCube className="mx-auto mb-3 text-dark-300" size={48} />
            <h3 className="text-lg font-medium text-dark-900 mb-1">All stocked up!</h3>
            <p className="text-dark-500">
              No products are currently below their stock threshold.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedProducts.map((product: any, index: number) => {
            const stock = product.stockQuantity ?? product.stock ?? 0;
            const threshold = product.lowStockThreshold ?? 10;
            const deficit = threshold - stock;
            const isOutOfStock = stock === 0;
            const isRestocking = restockingProduct === product._id;

            return (
              <motion.div
                key={product._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  padding="md"
                  className={cn(
                    'border-l-4 transition-colors',
                    isOutOfStock
                      ? 'border-l-red-500'
                      : 'border-l-orange-500'
                  )}
                >
                  <div className="space-y-3">
                    {/* Product Info */}
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-beige-100 rounded-lg overflow-hidden flex-shrink-0">
                        {product.images?.[0]?.url ? (
                          <img
                            src={product.images[0].url}
                            alt={product.images[0].alt || product.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-beige-400">
                            <HiOutlineCube size={20} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-dark-900 truncate">
                          {product.title}
                        </p>
                        <p className="text-xs text-dark-500 mt-0.5">
                          {product.category?.name || product.categoryName || 'Uncategorized'}
                        </p>
                      </div>
                    </div>

                    {/* Stock Info */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-dark-500">Current:</span>
                          <span
                            className={cn(
                              'text-sm font-semibold',
                              isOutOfStock ? 'text-red-600' : 'text-orange-600'
                            )}
                          >
                            {stock}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-dark-500">Threshold:</span>
                          <span className="text-sm font-medium text-dark-700">{threshold}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={isOutOfStock ? 'error' : 'warning'}
                          size="sm"
                        >
                          {isOutOfStock ? 'Out of Stock' : 'Low Stock'}
                        </Badge>
                        <p className="text-xs text-dark-500 mt-1">
                          Need {deficit} more
                        </p>
                      </div>
                    </div>

                    {/* Stock Level Bar */}
                    <div className="w-full h-2 bg-beige-200 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          isOutOfStock
                            ? 'bg-red-500'
                            : 'bg-orange-500'
                        )}
                        style={{
                          width: `${Math.min((stock / threshold) * 100, 100)}%`,
                        }}
                      />
                    </div>

                    {/* Restock Action */}
                    {isRestocking ? (
                      <div className="flex items-center gap-2 pt-2 border-t border-beige-200">
                        <input
                          type="number"
                          min={1}
                          value={restockQuantity || ''}
                          onChange={(e) =>
                            setRestockQuantity(Math.max(0, parseInt(e.target.value) || 0))
                          }
                          placeholder="Qty"
                          className="w-20 h-8 text-sm text-center border border-beige-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          autoFocus
                        />
                        <Button
                          size="sm"
                          onClick={() => handleConfirmRestock(product._id)}
                          disabled={restockMutation.isPending || restockQuantity <= 0}
                          className="flex-1"
                        >
                          {restockMutation.isPending ? (
                            'Adding...'
                          ) : (
                            <>
                              <HiOutlineCheck size={14} className="mr-1" />
                              Add Stock
                            </>
                          )}
                        </Button>
                        <button
                          onClick={handleCancelRestock}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-beige-100 hover:bg-beige-200 text-dark-500 transition-colors"
                        >
                          <HiOutlineX size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="pt-2 border-t border-beige-200">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStartRestock(product._id)}
                          className="w-full"
                          leftIcon={<HiOutlinePlus size={14} />}
                        >
                          Quick Restock
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

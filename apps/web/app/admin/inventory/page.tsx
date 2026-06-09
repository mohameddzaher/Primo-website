'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  HiOutlineCube,
  HiOutlineCurrencyDollar,
  HiOutlineExclamation,
  HiOutlineXCircle,
  HiOutlineArrowRight,
  HiOutlineRefresh,
  HiOutlinePencil,
} from 'react-icons/hi';
import { Card, Badge, Button, Skeleton } from '@/components/ui';
import { adminApi } from '@/lib/api';
import { formatCurrency, formatDate, cn } from '@/lib/utils';

const movementTypeColors: Record<string, { bg: string; text: string }> = {
  purchase: { bg: 'bg-green-100', text: 'text-green-800' },
  sale: { bg: 'bg-blue-100', text: 'text-blue-800' },
  adjustment: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  return: { bg: 'bg-purple-100', text: 'text-purple-800' },
  damaged: { bg: 'bg-red-100', text: 'text-red-800' },
};

export default function InventoryDashboardPage() {
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['admin-inventory-dashboard'],
    queryFn: () => adminApi.getInventoryDashboard(),
  });

  const stats = [
    {
      label: 'Total Products',
      value: dashboard?.totalProducts || 0,
      icon: HiOutlineCube,
      color: 'bg-blue-100 text-blue-600',
      badge: null,
      href: '/admin/inventory/products',
    },
    {
      label: 'Total Stock Value',
      value: formatCurrency(dashboard?.totalStockValue || 0),
      icon: HiOutlineCurrencyDollar,
      color: 'bg-green-100 text-green-600',
      badge: null,
      href: '/admin/inventory/products',
    },
    {
      label: 'Low Stock Items',
      value: dashboard?.lowStockCount || 0,
      icon: HiOutlineExclamation,
      color: 'bg-yellow-100 text-yellow-600',
      badge: dashboard?.lowStockCount > 0 ? 'warning' as const : null,
      href: '/admin/inventory/products?stockStatus=low',
    },
    {
      label: 'Out of Stock',
      value: dashboard?.outOfStockCount || 0,
      icon: HiOutlineXCircle,
      color: 'bg-red-100 text-red-600',
      badge: dashboard?.outOfStockCount > 0 ? 'error' as const : null,
      href: '/admin/inventory/products?stockStatus=out',
    },
  ];

  const recentMovements = dashboard?.recentMovements || [];
  const lowStockAlerts = dashboard?.lowStockAlerts || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-dark-900">Inventory Dashboard</h1>
          <p className="text-dark-500 mt-1">Overview of your stock and inventory status</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/inventory/products">
            <Button variant="outline" leftIcon={<HiOutlinePencil size={18} />}>
              Manage Stock
            </Button>
          </Link>
          <Link href="/admin/inventory/movements/new">
            <Button leftIcon={<HiOutlineRefresh size={18} />}>Record Movement</Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid - All clickable */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link href={stat.href}>
              <Card padding="lg" className="cursor-pointer hover:shadow-soft-lg hover:border-beige-300 hover:-translate-y-0.5 transition-all duration-300">
                <div className="flex items-start justify-between">
                  <div className={cn('p-3 rounded-xl', stat.color)}>
                    <stat.icon size={24} />
                  </div>
                  {stat.badge && (
                    <Badge variant={stat.badge} size="sm">
                      {stat.badge === 'warning' ? 'Needs Attention' : 'Critical'}
                    </Badge>
                  )}
                </div>
                <div className="mt-4">
                  <h3 className="text-2xl font-semibold text-dark-900">
                    {isLoading ? (
                      <Skeleton className="h-8 w-24" />
                    ) : (
                      stat.value
                    )}
                  </h3>
                  <p className="text-dark-500 text-sm mt-1">{stat.label}</p>
                </div>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Movements Table */}
        <div className="lg:col-span-2">
          <Card padding="none">
            <div className="flex items-center justify-between px-6 py-4 border-b border-beige-200">
              <h3 className="text-lg font-semibold text-dark-900">Recent Movements</h3>
              <Link href="/admin/inventory/movements">
                <Button variant="ghost" size="sm" rightIcon={<HiOutlineArrowRight size={16} />}>
                  View All
                </Button>
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-beige-50 border-b border-beige-200">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                      User
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-beige-200">
                  {isLoading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i}>
                        <td colSpan={5} className="px-6 py-4">
                          <Skeleton className="h-4 w-full" />
                        </td>
                      </tr>
                    ))
                  ) : recentMovements.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-dark-500">
                        No recent movements
                      </td>
                    </tr>
                  ) : (
                    recentMovements.slice(0, 10).map((movement: any) => {
                      const typeColor = movementTypeColors[movement.type] || {
                        bg: 'bg-gray-100',
                        text: 'text-gray-800',
                      };
                      const isPositive = ['purchase', 'return'].includes(movement.type);

                      return (
                        <motion.tr
                          key={movement._id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="hover:bg-beige-50"
                        >
                          <td className="px-6 py-3 text-sm text-dark-600">
                            {formatDate(movement.createdAt)}
                          </td>
                          <td className="px-6 py-3 text-sm font-medium text-dark-900">
                            {movement.productId?.title || movement.product?.title || movement.productName || 'N/A'}
                          </td>
                          <td className="px-6 py-3">
                            <span
                              className={cn(
                                'px-2 py-1 rounded-full text-xs font-medium capitalize',
                                typeColor.bg,
                                typeColor.text
                              )}
                            >
                              {movement.type}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-sm">
                            <span
                              className={cn(
                                'font-medium',
                                isPositive ? 'text-green-600' : 'text-red-600'
                              )}
                            >
                              {isPositive ? '+' : '-'}{Math.abs(movement.quantity)}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-sm text-dark-600">
                            {movement.userId ? `${movement.userId.firstName || ''} ${movement.userId.lastName || ''}`.trim() : movement.user?.name || movement.userName || 'System'}
                          </td>
                        </motion.tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Low Stock Alerts */}
        <div>
          <Card padding="none">
            <div className="flex items-center justify-between px-6 py-4 border-b border-beige-200">
              <h3 className="text-lg font-semibold text-dark-900">Low Stock Alerts</h3>
              <Link href="/admin/inventory/products?stockStatus=low">
                <Button variant="ghost" size="sm" rightIcon={<HiOutlineArrowRight size={16} />}>
                  View All
                </Button>
              </Link>
            </div>
            <div className="divide-y divide-beige-200">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <div key={i} className="px-6 py-4">
                    <Skeleton className="h-12 w-full" />
                  </div>
                ))
              ) : lowStockAlerts.length === 0 ? (
                <div className="px-6 py-12 text-center text-dark-500">
                  <HiOutlineCube className="mx-auto mb-2 text-dark-300" size={32} />
                  <p>No low stock alerts</p>
                </div>
              ) : (
                lowStockAlerts.slice(0, 8).map((product: any) => {
                  const stock = product.stockQuantity ?? product.stock ?? 0;
                  const threshold = product.lowStockThreshold ?? 10;
                  const isOutOfStock = stock === 0;

                  return (
                    <Link
                      key={product._id}
                      href={`/admin/inventory/products?stockStatus=${isOutOfStock ? 'out' : 'low'}`}
                      className="block"
                    >
                      <div className="px-6 py-3 hover:bg-beige-50 transition-colors cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-dark-900 truncate">
                              {product.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge
                                variant={isOutOfStock ? 'error' : 'warning'}
                                size="sm"
                              >
                                {isOutOfStock
                                  ? 'Out of Stock'
                                  : `${stock} / ${threshold}`}
                              </Badge>
                            </div>
                          </div>
                          <HiOutlineArrowRight size={16} className="text-dark-400" />
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

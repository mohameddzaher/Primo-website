'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  HiOutlineSearch,
  HiOutlinePlus,
  HiOutlineCalendar,
  HiOutlineDownload,
} from 'react-icons/hi';
import { Card, Button, Badge, Select, Skeleton, Input } from '@/components/ui';
import { adminApi } from '@/lib/api';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const typeOptions = [
  { value: '', label: 'All Types' },
  { value: 'purchase', label: 'Purchase' },
  { value: 'sale', label: 'Sale' },
  { value: 'adjustment', label: 'Adjustment' },
  { value: 'return', label: 'Return' },
  { value: 'damaged', label: 'Damaged' },
];

const movementTypeColors: Record<string, { bg: string; text: string; label: string }> = {
  purchase: { bg: 'bg-green-100', text: 'text-green-800', label: 'Purchase' },
  sale: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Sale' },
  adjustment: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Adjustment' },
  return: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Return' },
  damaged: { bg: 'bg-red-100', text: 'text-red-800', label: 'Damaged' },
};

export default function InventoryMovementsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const params = {
    page,
    limit: 20,
    search,
    type: type || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  };

  const { data, isLoading } = useQuery({
    queryKey: ['admin-inventory-movements', params],
    queryFn: () => adminApi.getStockMovements(params),
  });

  const movements = data?.movements || [];
  const pagination = data?.pagination;

  const handleClearFilters = () => {
    setSearch('');
    setType('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const hasActiveFilters = search || type || dateFrom || dateTo;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-dark-900">Movement History</h1>
          <p className="text-dark-500 mt-1">Track all stock movements and changes</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/inventory">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
          <Link href="/admin/inventory/movements/new">
            <Button leftIcon={<HiOutlinePlus size={18} />}>New Movement</Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card padding="md">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by product name..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                leftIcon={<HiOutlineSearch size={18} />}
              />
            </div>
            <Select
              options={typeOptions}
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setPage(1);
              }}
              fullWidth={false}
              className="w-full sm:w-48"
            />
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <HiOutlineCalendar className="text-dark-400" size={18} />
              <span className="text-sm text-dark-500">From:</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-1.5 text-sm border border-beige-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-dark-500">To:</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-1.5 text-sm border border-beige-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Movements Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-beige-50 border-b border-beige-200">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                  Previous Stock
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                  New Stock
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                  Reason
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                  User
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-beige-200">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8} className="px-6 py-4">
                      <Skeleton className="h-4 w-full" />
                    </td>
                  </tr>
                ))
              ) : movements.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-dark-500">
                    No movements found
                  </td>
                </tr>
              ) : (
                movements.map((movement: any) => {
                  const typeConfig = movementTypeColors[movement.type] || {
                    bg: 'bg-gray-100',
                    text: 'text-gray-800',
                    label: movement.type,
                  };
                  const isPositive = ['purchase', 'return'].includes(movement.type);

                  return (
                    <motion.tr
                      key={movement._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-beige-50"
                    >
                      <td className="px-6 py-4 text-sm text-dark-600 whitespace-nowrap">
                        {formatDate(movement.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-dark-900 truncate max-w-[180px]">
                          {movement.productId?.title || movement.product?.title || movement.productName || 'N/A'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            'px-2 py-1 rounded-full text-xs font-medium',
                            typeConfig.bg,
                            typeConfig.text
                          )}
                        >
                          {typeConfig.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={cn(
                            'font-medium',
                            isPositive ? 'text-green-600' : 'text-red-600'
                          )}
                        >
                          {isPositive ? '+' : '-'}{Math.abs(movement.quantity)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-dark-600">
                        {movement.previousStock ?? '---'}
                      </td>
                      <td className="px-6 py-4 text-sm text-dark-600">
                        {movement.newStock ?? '---'}
                      </td>
                      <td className="px-6 py-4 text-sm text-dark-500 truncate max-w-[150px]">
                        {movement.reason || '---'}
                      </td>
                      <td className="px-6 py-4 text-sm text-dark-600 whitespace-nowrap">
                        {movement.userId ? `${movement.userId.firstName || ''} ${movement.userId.lastName || ''}`.trim() : movement.user?.name || movement.userName || 'System'}
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
              {pagination.total} movements
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

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  HiOutlineEye,
  HiOutlineSearch,
  HiOutlineFilter,
  HiOutlineDownload,
} from 'react-icons/hi';
import { Button, Input, Select, Card } from '@/components/ui';
import { adminApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-error';
import { exportToCSV, orderColumns } from '@/lib/export';
import toast from 'react-hot-toast';

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'new', label: 'New' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'failed', label: 'Failed' },
];

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  accepted: 'bg-cyan-100 text-cyan-800',
  in_progress: 'bg-indigo-100 text-indigo-800',
  out_for_delivery: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  failed: 'bg-red-100 text-red-800',
};

export default function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', page, search, status],
    queryFn: () => adminApi.getOrders({ page, limit: 20, search, status }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminApi.updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-inventory-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-inventory-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['admin-inventory-movements'] });
      toast.success('Order status updated');
    },
    onError: (error: any) => {
      toast.error(getApiErrorMessage(error, 'Failed to update order status'));
    },
  });

  const orders = data?.orders || [];
  const pagination = data?.pagination;

  const handleExport = () => {
    if (orders.length === 0) {
      toast.error('No orders to export');
      return;
    }
    exportToCSV(orders, orderColumns, `orders-${new Date().toISOString().split('T')[0]}`);
    toast.success('Orders exported successfully');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-dark-900">Orders</h1>
          <p className="text-dark-500 mt-1">Manage and track customer orders</p>
        </div>
        <Button variant="outline" leftIcon={<HiOutlineDownload size={18} />} onClick={handleExport}>
          Export
        </Button>
      </div>

      {/* Filters */}
      <Card padding="md">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by order number, customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<HiOutlineSearch size={18} />}
            />
          </div>
          <Select
            options={statusOptions}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            fullWidth={false}
            className="w-full sm:w-48"
          />
        </div>
      </Card>

      {/* Orders Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-beige-50 border-b border-beige-200">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                  Total
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
                      <div className="h-4 bg-beige-200 rounded animate-pulse"></div>
                    </td>
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-dark-500">
                    No orders found
                  </td>
                </tr>
              ) : (
                orders.map((order: any) => (
                  <motion.tr
                    key={order._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-beige-50"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/orders/${order._id}`}
                        className="font-medium text-dark-900 hover:text-primary-600"
                      >
                        #{order.orderNumber}
                      </Link>
                      <p className="text-xs text-dark-500 mt-1">
                        {order.items?.length || 0} items
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-dark-900">{order.userId?.firstName ? `${order.userId.firstName} ${order.userId.lastName}` : order.shippingAddress?.fullName || 'Customer'}</p>
                      <p className="text-xs text-dark-500">{order.userId?.email}</p>
                    </td>
                    <td className="px-6 py-4 text-dark-600">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={order.status}
                        onChange={(e) =>
                          updateStatusMutation.mutate({
                            id: order._id,
                            status: e.target.value,
                          })
                        }
                        className={`px-2 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${
                          statusColors[order.status] || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {statusOptions.slice(1).map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 font-medium text-dark-900">
                      EGP {order.total?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/admin/orders/${order._id}`}>
                        <Button variant="ghost" size="sm">
                          <HiOutlineEye size={18} />
                        </Button>
                      </Link>
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
              {pagination.total} orders
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

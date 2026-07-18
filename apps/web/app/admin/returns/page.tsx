'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { HiOutlineSearch } from 'react-icons/hi';
import { Button, Input, Select, Card } from '@/components/ui';
import { returnsApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-error';
import toast from 'react-hot-toast';

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'requested', label: 'Requested' },
  { value: 'approved', label: 'Approved' },
  { value: 'received', label: 'Received' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'rejected', label: 'Rejected' },
];

const statusColors: Record<string, string> = {
  requested: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  received: 'bg-indigo-100 text-indigo-800',
  refunded: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

const reasonLabels: Record<string, string> = {
  damaged: 'Damaged',
  defective: 'Defective',
  wrong_item: 'Wrong item',
  not_as_described: 'Not as described',
  changed_mind: 'Changed mind',
  other: 'Other',
};

// Which actions are offered for each status — mirrors the API's transition map.
const nextActions: Record<string, { status: string; label: string; variant: 'primary' | 'outline' }[]> = {
  requested: [
    { status: 'approved', label: 'Approve', variant: 'primary' },
    { status: 'rejected', label: 'Reject', variant: 'outline' },
  ],
  approved: [
    { status: 'received', label: 'Mark Received', variant: 'primary' },
    { status: 'rejected', label: 'Reject', variant: 'outline' },
  ],
  received: [
    { status: 'refunded', label: 'Refund', variant: 'primary' },
    { status: 'rejected', label: 'Reject', variant: 'outline' },
  ],
  refunded: [],
  rejected: [],
};

export default function AdminReturnsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-returns', page, search, status],
    queryFn: () => returnsApi.getAll({ page, limit: 20, search, status }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      returnsApi.updateStatus(id, { status }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-returns'] });
      // A refund restocks products and writes the ledger
      if (variables.status === 'refunded') {
        queryClient.invalidateQueries({ queryKey: ['admin-products'] });
        queryClient.invalidateQueries({ queryKey: ['admin-inventory-products'] });
        queryClient.invalidateQueries({ queryKey: ['admin-inventory-dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['admin-inventory-movements'] });
        queryClient.invalidateQueries({ queryKey: ['admin-accounting'] });
      }
      toast.success('Return updated');
    },
    onError: (error: any) => {
      toast.error(getApiErrorMessage(error, 'Failed to update return'));
    },
  });

  const returns = data?.returns || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-dark-900">Returns</h1>
          <p className="text-dark-500 mt-1">Review and resolve customer return requests</p>
        </div>
      </div>

      {/* Filters */}
      <Card padding="md">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by order number..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              leftIcon={<HiOutlineSearch size={18} />}
            />
          </div>
          <Select
            options={statusOptions}
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            fullWidth={false}
            className="w-full sm:w-48"
          />
        </div>
      </Card>

      {/* Returns Table */}
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
                  Reason
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                  Requested
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                  Refund
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
                    <td colSpan={7} className="px-6 py-4">
                      <div className="h-4 bg-beige-200 rounded animate-pulse"></div>
                    </td>
                  </tr>
                ))
              ) : returns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-dark-500">
                    No returns found
                  </td>
                </tr>
              ) : (
                returns.map((ret: any) => (
                  <motion.tr
                    key={ret._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-beige-50"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/orders/${ret.orderId?._id || ret.orderId}`}
                        className="font-medium text-dark-900 hover:text-primary-600"
                      >
                        #{ret.orderNumber}
                      </Link>
                      <p className="text-xs text-dark-500 mt-1">
                        {ret.items?.length || 0} items
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-dark-900">
                        {ret.userId?.firstName
                          ? `${ret.userId.firstName} ${ret.userId.lastName}`
                          : 'Customer'}
                      </p>
                      <p className="text-xs text-dark-500">{ret.userId?.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-dark-900">{reasonLabels[ret.reason] || ret.reason}</p>
                      {ret.description && (
                        <p className="text-xs text-dark-500 max-w-xs truncate">
                          {ret.description}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-dark-600">
                      {new Date(ret.requestedAt || ret.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          statusColors[ret.status] || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {ret.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-dark-900">
                      SAR {ret.refundAmount?.toLocaleString() || 0}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {(nextActions[ret.status] || []).map((action) => (
                          <Button
                            key={action.status}
                            variant={action.variant}
                            size="sm"
                            disabled={updateStatusMutation.isPending}
                            onClick={() =>
                              updateStatusMutation.mutate({
                                id: ret._id,
                                status: action.status,
                              })
                            }
                          >
                            {action.label}
                          </Button>
                        ))}
                        {(nextActions[ret.status] || []).length === 0 && (
                          <span className="text-xs text-dark-500">—</span>
                        )}
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
              {pagination.total} returns
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

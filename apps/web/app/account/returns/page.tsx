'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  HiOutlineReceiptRefund,
  HiOutlinePlus,
  HiOutlineX,
} from 'react-icons/hi';
import { Button, Card, Select, Textarea } from '@/components/ui';
import { ordersApi, returnsApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-error';
import toast from 'react-hot-toast';

const statusColors: Record<string, string> = {
  requested: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  received: 'bg-indigo-100 text-indigo-800',
  refunded: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  requested: 'Requested',
  approved: 'Approved',
  received: 'Received',
  refunded: 'Refunded',
  rejected: 'Rejected',
};

const reasonOptions = [
  { value: 'damaged', label: 'Arrived damaged' },
  { value: 'defective', label: 'Defective / not working' },
  { value: 'wrong_item', label: 'Wrong item sent' },
  { value: 'not_as_described', label: 'Not as described' },
  { value: 'changed_mind', label: 'Changed my mind' },
  { value: 'other', label: 'Other' },
];

// Mirrors the API's default return window (Settings can override it server-side).
const RETURN_WINDOW_DAYS = 30;

function isEligible(order: any): boolean {
  if (order?.status !== 'delivered') return false;
  const from = order.deliveredAt || order.createdAt;
  if (!from) return false;
  const closesAt = new Date(from).getTime() + RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  return Date.now() <= closesAt;
}

export default function ReturnsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [reason, setReason] = useState('damaged');
  const [description, setDescription] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const { data: returnsData, isLoading } = useQuery({
    queryKey: ['my-returns'],
    queryFn: () => returnsApi.getMy({ page: 1, limit: 50 }),
  });

  const { data: ordersData } = useQuery({
    queryKey: ['orders', 'returnable'],
    queryFn: () => ordersApi.getAll({ page: 1, limit: 50 }),
  });

  const returns = returnsData?.returns || [];

  // Orders that are delivered, inside the window, and don't already have a
  // live return request.
  const returnedOrderIds = useMemo(
    () =>
      new Set(
        returns
          .filter((r: any) => r.status !== 'rejected')
          .map((r: any) => String(r.orderId?._id || r.orderId))
      ),
    [returns]
  );

  const eligibleOrders = useMemo(
    () =>
      (ordersData?.orders || []).filter(
        (o: any) => isEligible(o) && !returnedOrderIds.has(String(o._id))
      ),
    [ordersData, returnedOrderIds]
  );

  const selectedOrder = eligibleOrders.find((o: any) => o._id === orderId);

  const resetForm = () => {
    setShowForm(false);
    setOrderId('');
    setReason('damaged');
    setDescription('');
    setQuantities({});
  };

  const createMutation = useMutation({
    mutationFn: (payload: any) => returnsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-returns'] });
      toast.success('Return request submitted');
      resetForm();
    },
    onError: (error: any) => {
      toast.error(getApiErrorMessage(error, 'Failed to submit return request'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedOrder) {
      toast.error('Please select an order');
      return;
    }

    const items = Object.entries(quantities)
      .filter(([, qty]) => qty > 0)
      .map(([productId, quantity]) => ({ productId, quantity }));

    if (items.length === 0) {
      toast.error('Select at least one item to return');
      return;
    }

    createMutation.mutate({
      orderId: selectedOrder._id,
      reason,
      description: description || undefined,
      items,
    });
  };

  const estimatedRefund = useMemo(() => {
    if (!selectedOrder) return 0;
    return (selectedOrder.items || []).reduce(
      (sum: number, item: any) =>
        sum + (quantities[String(item.productId)] || 0) * (item.price || 0),
      0
    );
  }, [selectedOrder, quantities]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-dark-900">My Returns</h1>
          <p className="text-dark-500 mt-1">
            Request a return within {RETURN_WINDOW_DAYS} days of delivery
          </p>
        </div>
        {showForm ? (
          <Button variant="outline" leftIcon={<HiOutlineX size={18} />} onClick={resetForm}>
            Cancel
          </Button>
        ) : (
          <Button
            leftIcon={<HiOutlinePlus size={18} />}
            onClick={() => setShowForm(true)}
            disabled={eligibleOrders.length === 0}
          >
            Request a Return
          </Button>
        )}
      </div>

      {/* Request form */}
      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Card padding="lg">
            <form onSubmit={handleSubmit} className="space-y-5">
              <Select
                label="Order"
                options={[
                  { value: '', label: 'Select a delivered order...' },
                  ...eligibleOrders.map((o: any) => ({
                    value: o._id,
                    label: `#${o.orderNumber} — SAR ${o.total?.toLocaleString()}`,
                  })),
                ]}
                value={orderId}
                onChange={(e) => {
                  setOrderId(e.target.value);
                  setQuantities({});
                }}
              />

              {selectedOrder && (
                <div className="border border-beige-200 rounded-xl divide-y divide-beige-200">
                  {(selectedOrder.items || []).map((item: any) => {
                    const key = String(item.productId);
                    return (
                      <div
                        key={key}
                        className="flex items-center justify-between gap-4 px-4 py-3"
                      >
                        <div className="min-w-0">
                          <p className="text-dark-900 font-medium truncate">{item.title}</p>
                          <p className="text-xs text-dark-500">
                            {item.sku} · SAR {item.price?.toLocaleString()} · ordered{' '}
                            {item.quantity}
                          </p>
                        </div>
                        <select
                          value={quantities[key] || 0}
                          onChange={(e) =>
                            setQuantities((prev) => ({
                              ...prev,
                              [key]: Number(e.target.value),
                            }))
                          }
                          className="rounded-lg border border-beige-300 bg-white px-3 py-1.5 text-sm text-dark-900"
                        >
                          {Array.from({ length: item.quantity + 1 }, (_, n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              )}

              <Select
                label="Reason"
                options={reasonOptions}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />

              <Textarea
                label="Additional details (optional)"
                rows={3}
                placeholder="Tell us more about the issue..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              <div className="flex items-center justify-between pt-2 border-t border-beige-200">
                <p className="text-sm text-dark-500">
                  Estimated refund{' '}
                  <span className="font-semibold text-dark-900">
                    SAR {estimatedRefund.toLocaleString()}
                  </span>
                </p>
                <Button type="submit" isLoading={createMutation.isPending}>
                  Submit Request
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>
      )}

      {/* Returns list */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
              <div className="h-4 bg-beige-200 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-beige-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : returns.length === 0 ? (
        <Card padding="lg" className="text-center py-12">
          <HiOutlineReceiptRefund className="mx-auto h-16 w-16 text-beige-400 mb-4" />
          <h3 className="text-lg font-medium text-dark-900 mb-2">No returns yet</h3>
          <p className="text-dark-500 mb-6">
            {eligibleOrders.length === 0
              ? 'You have no delivered orders eligible for return right now.'
              : 'Request a return for a delivered order to get started.'}
          </p>
          <Link href="/account/orders">
            <Button variant="outline">View My Orders</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {returns.map((ret: any, index: number) => (
            <motion.div
              key={ret._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card padding="md" className="hover:shadow-soft-lg transition-shadow">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-semibold text-dark-900">
                        Order #{ret.orderNumber}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          statusColors[ret.status] || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {statusLabels[ret.status] || ret.status}
                      </span>
                    </div>
                    <div className="text-sm text-dark-500 space-y-1">
                      <p>
                        Requested on{' '}
                        {new Date(ret.requestedAt || ret.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                      <p>
                        {ret.items?.length || 0} items ·{' '}
                        {reasonOptions.find((r) => r.value === ret.reason)?.label || ret.reason}
                      </p>
                      {ret.adminNote && (
                        <p className="text-dark-600">Note: {ret.adminNote}</p>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-semibold text-dark-900">
                      SAR {ret.refundAmount?.toLocaleString() || 0}
                    </p>
                    <p className="text-xs text-dark-500">
                      {ret.status === 'refunded' ? 'Refunded' : 'Estimated refund'}
                    </p>
                  </div>
                </div>

                {ret.items && ret.items.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-beige-200 space-y-1">
                    {ret.items.map((item: any, i: number) => (
                      <p key={i} className="text-sm text-dark-600">
                        {item.quantity} × {item.title}
                      </p>
                    ))}
                  </div>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

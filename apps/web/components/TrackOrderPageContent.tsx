'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { HiOutlineSearch, HiOutlineTruck, HiOutlineCheckCircle, HiOutlineClock, HiOutlineXCircle, HiOutlineShoppingBag } from 'react-icons/hi';
import { Button, Input, Card, Skeleton } from '@/components/ui';
import { useAuthStore } from '@/lib/store';
import { ordersApi } from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';

const statusConfig: Record<string, { label: string; color: string; icon: any; step: number }> = {
  new: { label: 'Order Placed', color: 'bg-blue-100 text-blue-700', icon: HiOutlineShoppingBag, step: 1 },
  accepted: { label: 'Accepted', color: 'bg-indigo-100 text-indigo-700', icon: HiOutlineCheckCircle, step: 2 },
  in_progress: { label: 'Processing', color: 'bg-yellow-100 text-yellow-700', icon: HiOutlineClock, step: 3 },
  out_for_delivery: { label: 'Out for Delivery', color: 'bg-orange-100 text-orange-700', icon: HiOutlineTruck, step: 4 },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-700', icon: HiOutlineCheckCircle, step: 5 },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: HiOutlineXCircle, step: -1 },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-700', icon: HiOutlineXCircle, step: -1 },
};

const progressSteps = ['Order Placed', 'Accepted', 'Processing', 'Out for Delivery', 'Delivered'];

export default function TrackOrderPageContent() {
  const [orderNumber, setOrderNumber] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const { isAuthenticated } = useAuthStore();

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ['track-order', searchQuery],
    queryFn: () => ordersApi.getById(searchQuery),
    enabled: !!searchQuery && isAuthenticated,
    retry: false,
    refetchInterval: 10_000, // Poll every 10 seconds for real-time status updates
    staleTime: 0, // Always treat as stale so refetch fires immediately
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = orderNumber.trim().replace(/^#/, '');
    if (cleaned) {
      setSearchQuery(cleaned);
    }
  };

  const status = order?.status || 'new';
  const config = statusConfig[status] || statusConfig.new;
  const currentStep = config.step;

  return (
    <div className="min-h-screen bg-beige-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-8">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-display font-semibold text-dark-900 mb-3"
          >
            Track Your Order
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-dark-500"
          >
            Enter your order number to check the status of your delivery.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card padding="lg">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Order Number"
                placeholder="Enter your order number (e.g. ORD-12345)"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
              />
              <Button type="submit" className="w-full" rightIcon={<HiOutlineSearch size={18} />}>
                Track Order
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-beige-200 text-center">
              {isAuthenticated ? (
                <Link href="/account/orders" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                  View all your orders →
                </Link>
              ) : (
                <p className="text-sm text-dark-500">
                  <Link href="/auth/login?redirect=/track-order" className="text-primary-600 hover:text-primary-700 font-medium">
                    Sign in
                  </Link>{' '}
                  to view your order history.
                </p>
              )}
            </div>
          </Card>
        </motion.div>

        {searchQuery && !isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <Card padding="lg" className="text-center">
              <HiOutlineShoppingBag size={40} className="mx-auto text-dark-300 mb-3" />
              <h3 className="text-lg font-semibold text-dark-900 mb-2">Sign in Required</h3>
              <p className="text-sm text-dark-500 mb-4">
                Please sign in to track your order.
              </p>
              <Link href={`/auth/login?redirect=/track-order`}>
                <Button size="sm">Sign In</Button>
              </Link>
            </Card>
          </motion.div>
        )}

        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 space-y-4"
          >
            <Skeleton variant="rounded" className="h-32" />
            <Skeleton variant="rounded" className="h-48" />
          </motion.div>
        )}

        {isError && searchQuery && isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <Card padding="lg" className="text-center">
              <HiOutlineXCircle size={48} className="mx-auto text-red-400 mb-3" />
              <h3 className="text-lg font-semibold text-dark-900 mb-2">Order Not Found</h3>
              <p className="text-sm text-dark-500 mb-1">
                No order found with number <span className="font-semibold text-dark-700">&quot;{searchQuery}&quot;</span>
              </p>
              <p className="text-sm text-dark-400">
                Please check the order number and try again, or{' '}
                <Link href="/account/orders" className="text-primary-600 hover:text-primary-700 font-medium">
                  view all your orders
                </Link>.
              </p>
            </Card>
          </motion.div>
        )}

        {order && !isLoading && !isError && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 space-y-4"
          >
            <Card padding="lg">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-dark-900">Order #{order.orderNumber}</h3>
                  <p className="text-sm text-dark-500">
                    Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'long', day: 'numeric',
                    })}
                  </p>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${config.color} w-fit`}>
                  <config.icon size={16} />
                  {config.label}
                </span>
              </div>

              {currentStep > 0 && (
                <div className="mb-2">
                  <div className="flex items-center justify-between mb-2">
                    {progressSteps.map((step, i) => {
                      const stepNum = i + 1;
                      const isCompleted = currentStep >= stepNum;
                      const isCurrent = currentStep === stepNum;
                      return (
                        <div key={step} className="flex flex-col items-center flex-1">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                              isCompleted
                                ? 'bg-primary-600 border-primary-600 text-white'
                                : isCurrent
                                ? 'border-primary-600 text-primary-600 bg-white'
                                : 'border-dark-200 text-dark-300 bg-white'
                            }`}
                          >
                            {isCompleted ? '\u2713' : stepNum}
                          </div>
                          <span className={`text-[10px] mt-1 text-center leading-tight ${
                            isCompleted || isCurrent ? 'text-dark-700 font-medium' : 'text-dark-400'
                          }`}>
                            {step}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center mt-1 px-4">
                    {progressSteps.slice(0, -1).map((_, i) => (
                      <div
                        key={i}
                        className={`flex-1 h-1 rounded-full mx-1 ${
                          currentStep > i + 1 ? 'bg-primary-600' : 'bg-dark-100'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {order.estimatedDelivery && currentStep > 0 && currentStep < 5 && (
                <div className="mt-4 p-3 bg-beige-50 rounded-lg text-sm">
                  <span className="text-dark-500">Estimated Delivery: </span>
                  <span className="font-medium text-dark-900">
                    {new Date(order.estimatedDelivery).toLocaleDateString('en-US', {
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                    })}
                  </span>
                </div>
              )}

              {order.deliveredAt && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg text-sm">
                  <span className="text-green-700">Delivered on: </span>
                  <span className="font-medium text-green-900">
                    {new Date(order.deliveredAt).toLocaleDateString('en-US', {
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                    })}
                  </span>
                </div>
              )}

              {order.cancelReason && (
                <div className="mt-4 p-3 bg-red-50 rounded-lg text-sm">
                  <span className="text-red-700">Cancel Reason: </span>
                  <span className="font-medium text-red-900">{order.cancelReason}</span>
                </div>
              )}

              {order.notes && (
                <div className="mt-4 p-3 bg-beige-50 rounded-lg text-sm">
                  <span className="text-dark-500 font-medium">Your Notes: </span>
                  <span className="text-dark-700">{order.notes}</span>
                </div>
              )}

              {/* Status History */}
              {order.statusHistory && order.statusHistory.length > 0 && (
                <div className="mt-4 pt-4 border-t border-beige-200">
                  <h4 className="text-sm font-semibold text-dark-700 mb-3">Status History</h4>
                  <div className="space-y-3">
                    {order.statusHistory.map((history: any, index: number) => {
                      const historyConfig = statusConfig[history.status] || statusConfig.new;
                      return (
                        <div key={index} className="flex items-start gap-3 text-sm">
                          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                            history.status === 'delivered' ? 'bg-green-500' :
                            history.status === 'cancelled' || history.status === 'failed' ? 'bg-red-500' :
                            'bg-primary-500'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-dark-700">
                              <span className="font-medium">{historyConfig.label}</span>
                            </p>
                            {history.note && (
                              <p className="text-dark-500 text-xs mt-0.5">{history.note}</p>
                            )}
                            <p className="text-dark-400 text-xs mt-0.5">
                              {new Date(history.timestamp).toLocaleDateString('en-US', {
                                year: 'numeric', month: 'short', day: 'numeric',
                                hour: '2-digit', minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>

            <Card padding="lg">
              <h4 className="font-semibold text-dark-900 mb-4">Order Items</h4>
              <div className="space-y-3">
                {order.items?.map((item: any, index: number) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-beige-50 rounded-lg">
                    {item.image && (
                      <div className="w-16 h-16 relative flex-shrink-0 rounded-lg overflow-hidden bg-white">
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          className="object-contain p-1"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-dark-900 truncate">{item.title}</p>
                      <p className="text-xs text-dark-500">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-dark-900">
                        {((item.price || 0) * (item.quantity || 1)).toFixed(2)} SAR
                      </p>
                      {item.originalPrice && item.originalPrice > item.price && (
                        <p className="text-xs text-dark-400 line-through">
                          {(item.originalPrice * (item.quantity || 1)).toFixed(2)} SAR
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-beige-200 space-y-2 text-sm">
                <div className="flex justify-between text-dark-500">
                  <span>Subtotal</span>
                  <span>{(order.subtotal || 0).toFixed(2)} SAR</span>
                </div>
                <div className="flex justify-between text-dark-500">
                  <span>Shipping</span>
                  <span>{order.shippingCost === 0 ? 'Free' : `${(order.shippingCost || 0).toFixed(2)} SAR`}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{(order.discount || 0).toFixed(2)} SAR</span>
                  </div>
                )}
                {(order.tax > 0 || order.taxAmount > 0) && (
                  <div className="flex justify-between text-dark-500">
                    <span>Tax {order.taxRate ? `(${order.taxRate}%)` : ''}</span>
                    <span>{(order.tax || order.taxAmount || 0).toFixed(2)} SAR</span>
                  </div>
                )}
                <div className="flex justify-between text-dark-900 font-semibold text-base pt-2 border-t border-beige-100">
                  <span>Total</span>
                  <span>{(order.total || 0).toFixed(2)} SAR</span>
                </div>
              </div>
            </Card>

            {order.shippingAddress && (
              <Card padding="lg">
                <h4 className="font-semibold text-dark-900 mb-3">Shipping Address</h4>
                <div className="text-sm text-dark-600 space-y-1">
                  <p className="font-medium text-dark-900">{order.shippingAddress.fullName}</p>
                  <p>{order.shippingAddress.fullAddress}</p>
                  <p>{order.shippingAddress.area}, {order.shippingAddress.city}</p>
                  {order.shippingAddress.building && (
                    <p>Building: {order.shippingAddress.building}{order.shippingAddress.floor ? `, Floor: ${order.shippingAddress.floor}` : ''}{order.shippingAddress.apartment ? `, Apt: ${order.shippingAddress.apartment}` : ''}</p>
                  )}
                  {order.shippingAddress.landmark && <p>Landmark: {order.shippingAddress.landmark}</p>}
                  <p className="pt-1">{order.shippingAddress.phone}</p>
                </div>
              </Card>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

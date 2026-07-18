'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  HiOutlineEye,
  HiOutlineShoppingBag,
  HiOutlineClipboardList,
} from 'react-icons/hi';
import { Button, Card } from '@/components/ui';
import { ordersApi } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import type { TranslationKey } from '@/lib/i18n';

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  pending: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-cyan-100 text-cyan-800',
  confirmed: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-indigo-100 text-indigo-800',
  processing: 'bg-indigo-100 text-indigo-800',
  out_for_delivery: 'bg-purple-100 text-purple-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  failed: 'bg-red-100 text-red-800',
};

// Status → translation key. Falls back to the raw status when the backend
// introduces a state the storefront doesn't know about yet.
const statusKeys: Record<string, TranslationKey> = {
  new: 'order.status.new',
  pending: 'shop.order.status.pending',
  accepted: 'order.status.accepted',
  confirmed: 'shop.order.status.confirmed',
  in_progress: 'order.status.in_progress',
  processing: 'shop.order.status.processing',
  out_for_delivery: 'order.status.out_for_delivery',
  shipped: 'shop.order.status.shipped',
  delivered: 'order.status.delivered',
  cancelled: 'order.status.cancelled',
  failed: 'order.status.failed',
};

export default function OrdersPage() {
  const { t, intlLocale } = useI18n();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['orders', page],
    queryFn: () => ordersApi.getAll({ page, limit: 10 }),
    refetchInterval: 15_000, // Poll every 15 seconds for real-time status updates
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-dark-900">{t('account.myOrders')}</h1>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
            <div className="h-4 bg-beige-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-beige-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  const orders = data?.orders || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-dark-900">{t('account.myOrders')}</h1>

      {orders.length === 0 ? (
        <Card padding="lg" className="text-center py-12">
          <HiOutlineShoppingBag className="mx-auto h-16 w-16 text-beige-400 mb-4" />
          <h3 className="text-lg font-medium text-dark-900 mb-2">{t('account.noOrders')}</h3>
          <p className="text-dark-500 mb-6">
            {t('shop.orders.emptyHint')}
          </p>
          <Link href="/products">
            <Button>{t('shop.browseProducts')}</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order: any, index: number) => (
            <motion.div
              key={order._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card padding="md" className="hover:shadow-soft-lg transition-shadow">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-semibold text-dark-900">
                        {t('shop.orders.orderNo', { number: order.orderNumber })}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          statusColors[order.status] || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {statusKeys[order.status]
                          ? t(statusKeys[order.status])
                          : order.status}
                      </span>
                    </div>
                    <div className="text-sm text-dark-500 space-y-1">
                      <p>
                        {t('shop.orders.placedOn', {
                          date: new Date(order.createdAt).toLocaleDateString(intlLocale, {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          }),
                        })}
                      </p>
                      <p>{t('home.items', { count: order.items?.length || 0 })}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-end">
                      <p className="text-lg font-semibold text-dark-900 ltr-nums">
                        SAR {order.total?.toLocaleString()}
                      </p>
                      <p className="text-xs text-dark-500">
                        {order.paymentMethod === 'cash_on_delivery' ? t('checkout.cashOnDelivery') :
                         order.paymentMethod === 'apple_pay' ? t('checkout.applePay') : t('checkout.card')}
                      </p>
                    </div>
                    <Link href={`/account/orders/${order.orderNumber}`}>
                      <Button variant="outline" size="sm" leftIcon={<HiOutlineEye size={16} />}>
                        {t('shop.view')}
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Order Items Preview */}
                {order.items && order.items.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-beige-200">
                    <div className="flex gap-2 overflow-x-auto">
                      {order.items.slice(0, 4).map((item: any) => (
                        <div
                          key={item._id}
                          className="flex-shrink-0 w-16 h-16 bg-beige-100 rounded-lg overflow-hidden"
                        >
                          {(item.image || item.product?.images?.[0]?.url) ? (
                            <img
                              src={item.image || item.product?.images?.[0]?.url}
                              alt={item.product?.title || item.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <HiOutlineClipboardList className="text-beige-400" />
                            </div>
                          )}
                        </div>
                      ))}
                      {order.items.length > 4 && (
                        <div className="flex-shrink-0 w-16 h-16 bg-beige-100 rounded-lg flex items-center justify-center text-sm text-dark-500">
                          +{order.items.length - 4}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>
          ))}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                {t('common.previous')}
              </Button>
              <span className="text-sm text-dark-500">
                {t('shop.products.pageOf', { page, total: pagination.totalPages })}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page === pagination.totalPages}
                onClick={() => setPage(page + 1)}
              >
                {t('common.next')}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

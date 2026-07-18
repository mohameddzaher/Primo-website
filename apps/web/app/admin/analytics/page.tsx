'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  HiOutlineCurrencyDollar,
  HiOutlineShoppingCart,
  HiOutlineUsers,
  HiOutlineEye,
  HiOutlineTrendingUp,
  HiOutlineTrendingDown,
  HiOutlineCalendar,
} from 'react-icons/hi';
import { Card, Button } from '@/components/ui';
import { adminApi } from '@/lib/api';

export default function AdminAnalyticsPage() {
  const [period, setPeriod] = useState('30');

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['admin-analytics', period],
    queryFn: () => adminApi.getAnalytics({ period }),
  });

  const stats = [
    {
      label: 'Total Revenue',
      value: `SAR ${(analytics?.totalRevenue || 0).toLocaleString()}`,
      change: analytics?.revenueChange || 0,
      icon: HiOutlineCurrencyDollar,
      color: 'bg-green-100 text-green-600',
    },
    {
      label: 'Total Orders',
      value: analytics?.totalOrders || 0,
      change: analytics?.ordersChange || 0,
      icon: HiOutlineShoppingCart,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      label: 'New Customers',
      value: analytics?.newCustomers || 0,
      change: analytics?.customersChange || 0,
      icon: HiOutlineUsers,
      color: 'bg-purple-100 text-purple-600',
    },
    {
      label: 'Page Views',
      value: (analytics?.pageViews || 0).toLocaleString(),
      change: analytics?.viewsChange || 0,
      icon: HiOutlineEye,
      color: 'bg-yellow-100 text-yellow-600',
    },
  ];

  const topProducts = analytics?.topProducts || [];
  const topCategories = analytics?.topCategories || [];
  const recentOrders = analytics?.recentOrders || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-dark-900">Analytics</h1>
          <p className="text-dark-500 mt-1">Track your store performance</p>
        </div>
        <div className="flex items-center gap-2">
          <HiOutlineCalendar className="text-dark-400" size={20} />
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border border-beige-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card padding="lg">
              <div className="flex items-start justify-between">
                <div className={`p-3 rounded-xl ${stat.color}`}>
                  <stat.icon size={24} />
                </div>
                <div className={`flex items-center gap-1 text-sm ${
                  stat.change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change >= 0 ? (
                    <HiOutlineTrendingUp size={16} />
                  ) : (
                    <HiOutlineTrendingDown size={16} />
                  )}
                  {Math.abs(stat.change)}%
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-semibold text-dark-900">
                  {isLoading ? (
                    <div className="h-8 w-24 bg-beige-200 rounded animate-pulse"></div>
                  ) : (
                    stat.value
                  )}
                </h3>
                <p className="text-dark-500 text-sm mt-1">{stat.label}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card padding="lg">
          <h3 className="text-lg font-semibold text-dark-900 mb-4">Top Selling Products</h3>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-beige-200 rounded animate-pulse"></div>
              ))}
            </div>
          ) : topProducts.length === 0 ? (
            <p className="text-dark-500 text-center py-8">No data available</p>
          ) : (
            <div className="space-y-4">
              {topProducts.map((product: any, index: number) => (
                <div key={product._id} className="flex items-center gap-4">
                  <span className="w-6 h-6 bg-beige-100 rounded-full flex items-center justify-center text-sm font-medium text-dark-600">
                    {index + 1}
                  </span>
                  <div className="w-12 h-12 bg-beige-100 rounded-lg overflow-hidden flex-shrink-0">
                    {product.image ? (
                      <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-beige-400">-</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-dark-900 truncate">{product.title}</p>
                    <p className="text-sm text-dark-500">{product.sold} sold</p>
                  </div>
                  <p className="font-semibold text-dark-900">
                    SAR {product.revenue?.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Top Categories */}
        <Card padding="lg">
          <h3 className="text-lg font-semibold text-dark-900 mb-4">Top Categories</h3>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-beige-200 rounded animate-pulse"></div>
              ))}
            </div>
          ) : topCategories.length === 0 ? (
            <p className="text-dark-500 text-center py-8">No data available</p>
          ) : (
            <div className="space-y-4">
              {topCategories.map((category: any) => (
                <div key={category._id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-dark-900">{category.name}</p>
                    <p className="text-sm text-dark-500">{category.percentage}%</p>
                  </div>
                  <div className="h-2 bg-beige-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full"
                      style={{ width: `${category.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Recent Orders */}
      <Card padding="lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-dark-900">Recent Orders</h3>
          <Button variant="outline" size="sm" onClick={() => window.location.href = '/admin/orders'}>
            View All
          </Button>
        </div>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-beige-200 rounded animate-pulse"></div>
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <p className="text-dark-500 text-center py-8">No recent orders</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-beige-200">
                <tr>
                  <th className="text-left py-3 text-sm font-medium text-dark-500">Order ID</th>
                  <th className="text-left py-3 text-sm font-medium text-dark-500">Customer</th>
                  <th className="text-left py-3 text-sm font-medium text-dark-500">Total</th>
                  <th className="text-left py-3 text-sm font-medium text-dark-500">Status</th>
                  <th className="text-left py-3 text-sm font-medium text-dark-500">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-beige-100">
                {recentOrders.map((order: any) => (
                  <tr key={order._id} className="hover:bg-beige-50">
                    <td className="py-3 text-sm font-medium text-dark-900">
                      #{order.orderNumber}
                    </td>
                    <td className="py-3 text-sm text-dark-600">{order.customer?.name}</td>
                    <td className="py-3 text-sm font-medium text-dark-900">
                      SAR {order.total?.toLocaleString()}
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.status === 'delivered'
                            ? 'bg-green-100 text-green-800'
                            : order.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : order.status === 'cancelled'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 text-sm text-dark-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

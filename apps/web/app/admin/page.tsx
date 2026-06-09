'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  HiOutlineShoppingBag,
  HiOutlineUsers,
  HiOutlineCurrencyDollar,
  HiOutlineClock,
  HiOutlineTrendingUp,
  HiOutlineTrendingDown,
  HiOutlineExclamation,
  HiOutlineChartBar,
  HiOutlineStar,
  HiOutlineShoppingCart,
  HiOutlineTag,
  HiArrowRight,
  HiOutlineRefresh,
  HiOutlineCalendar,
} from 'react-icons/hi';
import { adminApi } from '@/lib/api';
import { queryKeys } from '@/lib/query-client';
import { useAuthStore } from '@/lib/store';
import {
  Card,
  StatCard,
  OrderStatusBadge,
  Skeleton,
} from '@/components/ui';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import Link from 'next/link';
import React, { useState } from 'react';

const REFETCH_INTERVAL = 30_000; // 30 seconds auto-refresh

// ========== CHART COMPONENTS ==========

function MiniBarChart({ data, height = 60 }: { data: { label: string; value: number }[]; height?: number }) {
  if (!data || data.length === 0) return <div className="text-xs text-dark-400 text-center py-8">No data yet</div>;
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full bg-primary-500 rounded-t-sm hover:bg-primary-600 transition-colors min-h-[2px]"
            style={{ height: `${(d.value / max) * 100}%` }}
            title={`${d.label}: ${d.value}`}
          />
          <span className="text-[8px] text-dark-400 leading-none truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function StatusBar({ items }: { items: { status: string; count: number; percentage: number }[] }) {
  if (!items || items.length === 0) return <div className="text-xs text-dark-400 text-center py-8">No data yet</div>;
  const total = items.reduce((s, i) => s + i.count, 0);
  if (total === 0) return <div className="text-xs text-dark-400 text-center py-8">No orders yet</div>;

  const colorMap: Record<string, string> = {
    new: 'bg-blue-500', pending: 'bg-yellow-500', accepted: 'bg-cyan-500',
    processing: 'bg-indigo-500', in_progress: 'bg-indigo-500', out_for_delivery: 'bg-purple-500',
    delivered: 'bg-green-500', cancelled: 'bg-red-500', failed: 'bg-red-400',
    returned: 'bg-orange-500', refunded: 'bg-gray-500',
  };
  const labelMap: Record<string, string> = {
    new: 'New', pending: 'Pending', accepted: 'Accepted', processing: 'Processing',
    in_progress: 'In Progress', out_for_delivery: 'Out for Delivery', delivered: 'Delivered',
    cancelled: 'Cancelled', failed: 'Failed', returned: 'Returned', refunded: 'Refunded',
  };

  const filtered = items.filter(i => i.count > 0).sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-4">
      <div className="flex h-3 rounded-full overflow-hidden bg-beige-200">
        {filtered.map((item) => (
          <div
            key={item.status}
            className={`${colorMap[item.status] || 'bg-gray-400'} transition-all`}
            style={{ width: `${(item.count / total) * 100}%` }}
            title={`${labelMap[item.status] || item.status}: ${item.count}`}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {filtered.map((item) => (
          <div key={item.status} className="flex items-center gap-2 text-xs">
            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${colorMap[item.status] || 'bg-gray-400'}`} />
            <span className="text-dark-600 flex-1 truncate">{labelMap[item.status] || item.status}</span>
            <span className="font-semibold text-dark-900">{item.count}</span>
            <span className="text-dark-400 w-10 text-right">({Math.round(item.percentage)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CategoryBars({ items }: { items: { name: string; revenue: number }[] }) {
  if (!items || items.length === 0) return <div className="text-xs text-dark-400 text-center py-8">No data yet</div>;
  const totalRevenue = items.reduce((s, c) => s + (c.revenue || 0), 0);

  return (
    <div className="space-y-4">
      {items.map((cat, i) => {
        const pct = totalRevenue > 0 ? (cat.revenue / totalRevenue) * 100 : 0;
        return (
          <div key={i}>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-dark-700 font-medium truncate max-w-[55%]">{cat.name || 'Uncategorized'}</span>
              <span className="text-dark-500">{formatCurrency(cat.revenue)} ({Math.round(pct)}%)</span>
            </div>
            <div className="h-2 bg-beige-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full transition-all"
                style={{ width: `${Math.max(pct, 2)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ========== MAIN DASHBOARD ==========

export default function AdminDashboardPage() {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'super_admin';
  const [salesPeriod, setSalesPeriod] = useState<number>(7);

  // All queries auto-refresh every 30 seconds
  const { data: dashboard, isLoading } = useQuery({
    queryKey: queryKeys.admin.dashboard(),
    queryFn: adminApi.getDashboard,
    refetchInterval: REFETCH_INTERVAL,
  });

  const { data: salesData } = useQuery({
    queryKey: ['admin-sales', salesPeriod],
    queryFn: () => adminApi.getSalesAnalytics({ period: 'day', days: salesPeriod }),
    refetchInterval: REFETCH_INTERVAL,
  });

  const { data: orderStatuses } = useQuery({
    queryKey: ['admin-order-status'],
    queryFn: adminApi.getOrderStatusDistribution,
    refetchInterval: REFETCH_INTERVAL,
  });

  const { data: revenueComparison } = useQuery({
    queryKey: ['admin-revenue-comparison'],
    queryFn: adminApi.getRevenueComparison,
    enabled: isSuperAdmin,
    refetchInterval: REFETCH_INTERVAL,
  });

  const { data: topCategories } = useQuery({
    queryKey: ['admin-top-categories'],
    queryFn: () => adminApi.getTopCategories({ limit: 5 }),
    refetchInterval: REFETCH_INTERVAL,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-14 bg-beige-100 rounded-xl animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="rounded" className="h-[120px]" />
          ))}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="rounded" className="h-[76px]" />
          ))}
        </div>
        <Skeleton variant="rounded" className="h-[100px]" />
        <div className="grid lg:grid-cols-2 gap-6">
          <Skeleton variant="rounded" className="h-[300px]" />
          <Skeleton variant="rounded" className="h-[300px]" />
        </div>
      </div>
    );
  }

  const stats = dashboard?.stats || {};
  const recentOrders = dashboard?.recentOrders || [];
  const topProducts = dashboard?.topProducts || [];

  const chartData = (salesData || []).map((d: any) => ({
    label: new Date(d.period || d.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    value: d.orders || 0,
  }));

  const revenueChartData = (salesData || []).map((d: any) => ({
    label: new Date(d.period || d.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    value: d.revenue || 0,
  }));

  // Build top stats cards dynamically to always fill 4 columns
  const changeType = (val: number): 'increase' | 'decrease' => val >= 0 ? 'increase' : 'decrease';

  const topStats: { title: string; value: string; change?: { value: number; type: 'increase' | 'decrease' }; icon: React.ReactNode }[] = [
    {
      title: 'Total Orders',
      value: stats.totalOrders?.toLocaleString() || '0',
      change: stats.ordersChange ? { value: stats.ordersChange, type: changeType(stats.ordersChange) } : undefined,
      icon: <HiOutlineShoppingBag size={24} />,
    },
    ...(isSuperAdmin ? [{
      title: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue || 0),
      change: stats.revenueChange ? { value: stats.revenueChange, type: changeType(stats.revenueChange) } : undefined,
      icon: <HiOutlineCurrencyDollar size={24} />,
    }] : [{
      title: "Today's Orders",
      value: String(stats.todayOrders || 0),
      icon: <HiOutlineShoppingCart size={24} />,
    }]),
    {
      title: 'Total Customers',
      value: stats.totalCustomers?.toLocaleString() || '0',
      icon: <HiOutlineUsers size={24} />,
    },
    {
      title: 'Pending Orders',
      value: stats.pendingOrders?.toLocaleString() || '0',
      icon: <HiOutlineClock size={24} />,
    },
  ];

  // Build quick stats cards dynamically to always fill 4 columns
  const quickStats = [
    ...(isSuperAdmin ? [
      { label: "Today's Orders", value: String(stats.todayOrders || 0), color: 'bg-blue-50 text-blue-600', icon: <HiOutlineShoppingCart size={18} /> },
      { label: "Today's Revenue", value: formatCurrency(stats.todayRevenue || 0), color: 'bg-green-50 text-green-600', icon: <HiOutlineCurrencyDollar size={18} /> },
      { label: 'Avg. Order Value', value: formatCurrency(stats.averageOrderValue || 0), color: 'bg-purple-50 text-purple-600', icon: <HiOutlineChartBar size={18} /> },
      { label: 'Total Products', value: stats.totalProducts?.toLocaleString() || '0', color: 'bg-cyan-50 text-cyan-600', icon: <HiOutlineTag size={18} /> },
    ] : [
      { label: 'New Orders', value: String(stats.newOrders || 0), color: 'bg-blue-50 text-blue-600', icon: <HiOutlineShoppingCart size={18} /> },
      { label: 'Total Products', value: stats.totalProducts?.toLocaleString() || '0', color: 'bg-cyan-50 text-cyan-600', icon: <HiOutlineTag size={18} /> },
      { label: 'Pending Reviews', value: String(stats.pendingReviews || 0), color: 'bg-orange-50 text-orange-600', icon: <HiOutlineStar size={18} /> },
      { label: 'Low Stock Items', value: String(stats.lowStockProducts || 0), color: 'bg-red-50 text-red-600', icon: <HiOutlineExclamation size={18} /> },
    ]),
  ];

  return (
    <div className="space-y-6">
      {/* ===== Header ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-semibold text-dark-900">Dashboard</h1>
          <p className="mt-1 text-dark-500 text-sm">
            Welcome back, {user?.name || user?.firstName || 'Admin'}! Here&apos;s what&apos;s happening today.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-dark-400 bg-beige-50 px-3 py-1.5 rounded-lg">
          <HiOutlineCalendar size={14} />
          <span>{new Date().toLocaleDateString('en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse ml-1" title="Live — auto-refreshing" />
        </div>
      </div>

      {/* ===== Main Stats — always 4 cards ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {topStats.map((stat, i) => (
          <motion.div key={stat.title} className="h-full" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <div className="h-full">
              <StatCard
                title={stat.title}
                value={stat.value}
                change={stat.change}
                icon={stat.icon}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* ===== Quick Stats — always 4 cards ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((qs, i) => (
          <motion.div key={qs.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}>
            <Card padding="sm" variant="hover" className="h-full">
              <div className="flex items-center gap-3">
                <div className={cn('p-2.5 rounded-lg flex-shrink-0', qs.color)}>
                  {qs.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-dark-500 truncate">{qs.label}</p>
                  <p className="text-lg font-bold text-dark-900 truncate">{qs.value}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ===== Order Pipeline ===== */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <h2 className="font-semibold text-dark-900 mb-3">Order Pipeline</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'New', value: stats.newOrders || 0, href: '/admin/orders?status=new', bg: 'bg-blue-50 hover:bg-blue-100', accent: 'bg-blue-100', text: 'text-blue-600', bold: 'text-blue-700', icon: <HiOutlineShoppingBag size={16} /> },
              { label: 'In Progress', value: stats.inProgressOrders || 0, href: '/admin/orders?status=processing', bg: 'bg-yellow-50 hover:bg-yellow-100', accent: 'bg-yellow-100', text: 'text-yellow-600', bold: 'text-yellow-700', icon: <HiOutlineRefresh size={16} /> },
              { label: 'Shipping', value: stats.outForDelivery || 0, href: '/admin/orders?status=out_for_delivery', bg: 'bg-purple-50 hover:bg-purple-100', accent: 'bg-purple-100', text: 'text-purple-600', bold: 'text-purple-700', icon: <HiOutlineTrendingUp size={16} /> },
              { label: 'Low Stock', value: stats.lowStockProducts || 0, href: '/admin/inventory/alerts', bg: 'bg-red-50 hover:bg-red-100', accent: 'bg-red-100', text: 'text-red-600', bold: 'text-red-700', icon: <HiOutlineExclamation size={16} /> },
            ].map((item) => (
              <Link key={item.label} href={item.href} className={cn('flex items-center justify-between p-3.5 rounded-xl transition-colors', item.bg)}>
                <div>
                  <p className={cn('text-xs font-medium', item.text)}>{item.label}</p>
                  <p className={cn('text-2xl font-bold', item.bold)}>{item.value}</p>
                </div>
                <div className={cn('p-2 rounded-full', item.accent, item.text)}>
                  {item.icon}
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* ===== Charts Row — Orders Overview + Order Status ===== */}
      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-dark-900">Orders Overview</h2>
              <div className="flex gap-0.5 bg-beige-100 rounded-lg p-0.5">
                {[7, 14, 30].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setSalesPeriod(d)}
                    className={cn(
                      'px-2.5 py-1 text-xs font-medium rounded-md transition-colors',
                      salesPeriod === d ? 'bg-white text-dark-900 shadow-sm' : 'text-dark-500 hover:text-dark-700'
                    )}
                  >
                    {d}d
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 min-h-0">
              <MiniBarChart data={chartData} height={130} />
            </div>
            {isSuperAdmin && revenueChartData.length > 0 && (
              <div className="mt-4 pt-4 border-t border-beige-200">
                <p className="text-xs text-dark-500 mb-2 font-medium">Revenue</p>
                <MiniBarChart data={revenueChartData} height={80} />
              </div>
            )}
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-dark-900">Order Status Distribution</h2>
              <Link href="/admin/orders" className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                View All
              </Link>
            </div>
            <div className="flex-1">
              <StatusBar items={orderStatuses || []} />
            </div>
          </Card>
        </motion.div>
      </div>

      {/* ===== Revenue Comparison + Top Categories — always 2 cols ===== */}
      <div className="grid lg:grid-cols-2 gap-6">
        {isSuperAdmin && revenueComparison ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <Card className="h-full">
              <h2 className="font-semibold text-dark-900 mb-4">Monthly Revenue</h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-4 bg-beige-50 rounded-xl text-center">
                  <p className="text-xs text-dark-500 mb-1">This Month</p>
                  <p className="text-xl font-bold text-dark-900">{formatCurrency(revenueComparison.thisMonth || 0)}</p>
                </div>
                <div className="p-4 bg-beige-50 rounded-xl text-center">
                  <p className="text-xs text-dark-500 mb-1">Last Month</p>
                  <p className="text-xl font-bold text-dark-900">{formatCurrency(revenueComparison.lastMonth || 0)}</p>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-beige-50">
                {revenueComparison.percentageChange >= 0 ? (
                  <HiOutlineTrendingUp className="text-green-600" size={20} />
                ) : (
                  <HiOutlineTrendingDown className="text-red-600" size={20} />
                )}
                <span className={cn('text-sm font-semibold', revenueComparison.percentageChange >= 0 ? 'text-green-600' : 'text-red-600')}>
                  {revenueComparison.percentageChange >= 0 ? '+' : ''}{Math.round(revenueComparison.percentageChange)}%
                </span>
                <span className="text-xs text-dark-500">vs last month</span>
              </div>
            </Card>
          </motion.div>
        ) : (
          /* Non-super-admin: show Pending Reviews + Low Stock in left column */
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <Card className="h-full">
              <h2 className="font-semibold text-dark-900 mb-4">Alerts & Notifications</h2>
              <div className="space-y-3">
                <Link href="/admin/reviews" className="flex items-center gap-3 p-3 rounded-xl bg-warning-50 hover:bg-warning-100 transition-colors">
                  <div className="p-2 bg-warning-100 rounded-lg flex-shrink-0">
                    <HiOutlineStar className="text-warning-600" size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-warning-800">Pending Reviews</p>
                    <p className="text-xs text-warning-600">{stats.pendingReviews || 0} awaiting moderation</p>
                  </div>
                  <HiArrowRight className="text-warning-400" size={16} />
                </Link>
                <Link href="/admin/inventory/alerts" className="flex items-center gap-3 p-3 rounded-xl bg-red-50 hover:bg-red-100 transition-colors">
                  <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
                    <HiOutlineExclamation className="text-red-600" size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-red-800">Low Stock</p>
                    <p className="text-xs text-red-600">{stats.lowStockProducts || 0} products running low</p>
                  </div>
                  <HiArrowRight className="text-red-400" size={16} />
                </Link>
                <Link href="/admin/orders?status=new" className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors">
                  <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                    <HiOutlineShoppingBag className="text-blue-600" size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-blue-800">New Orders</p>
                    <p className="text-xs text-blue-600">{stats.newOrders || 0} orders need attention</p>
                  </div>
                  <HiArrowRight className="text-blue-400" size={16} />
                </Link>
              </div>
            </Card>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-dark-900">Top Categories</h2>
              <Link href="/admin/categories" className="text-xs text-primary-600 hover:text-primary-700 font-medium">View All</Link>
            </div>
            <CategoryBars items={topCategories || []} />
          </Card>
        </motion.div>
      </div>

      {/* ===== Recent Orders + Top Products ===== */}
      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <Card className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-dark-900">Recent Orders</h2>
              <Link href="/admin/orders" className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                View All <HiArrowRight size={12} />
              </Link>
            </div>
            <div className="space-y-2 flex-1">
              {recentOrders.length > 0 ? (
                recentOrders.slice(0, 5).map((order: any) => (
                  <Link
                    key={order._id}
                    href={`/admin/orders/${order._id}`}
                    className="flex items-center justify-between p-3 bg-beige-50 rounded-xl hover:bg-beige-100 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-dark-900 text-sm">#{order.orderNumber}</p>
                        <OrderStatusBadge status={order.status} />
                      </div>
                      <p className="text-xs text-dark-500 mt-0.5 truncate">
                        {order.userId?.firstName} {order.userId?.lastName} &middot; {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <p className="font-semibold text-dark-900 text-sm ml-3 flex-shrink-0">
                      {formatCurrency(order.total)}
                    </p>
                  </Link>
                ))
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-dark-400 text-sm">No recent orders</p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-dark-900">Top Selling Products</h2>
              <Link href="/admin/products" className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                View All <HiArrowRight size={12} />
              </Link>
            </div>
            <div className="space-y-2 flex-1">
              {topProducts.length > 0 ? (
                topProducts.slice(0, 5).map((product: any, index: number) => (
                  <div key={product._id} className="flex items-center gap-3 p-3 bg-beige-50 rounded-xl">
                    <span className={cn(
                      'w-7 h-7 flex items-center justify-center text-xs font-bold rounded-full flex-shrink-0',
                      index === 0 ? 'bg-yellow-100 text-yellow-700' :
                      index === 1 ? 'bg-gray-200 text-gray-700' :
                      index === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-white text-dark-500'
                    )}>
                      {index + 1}
                    </span>
                    {product.images?.[0] && (
                      <img
                        src={product.images[0].url || product.images[0]}
                        alt=""
                        className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-dark-900 text-sm truncate">{product.title}</p>
                      <p className="text-xs text-dark-500">
                        {product.soldCount} sold &middot; {product.stockQuantity ?? '?'} in stock
                      </p>
                    </div>
                    <p className="font-semibold text-dark-900 text-sm flex-shrink-0">
                      {formatCurrency(product.revenue || product.price * product.soldCount)}
                    </p>
                  </div>
                ))
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-dark-400 text-sm">No data available</p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* ===== Alert Cards (Super Admin) ===== */}
      {isSuperAdmin && (stats.pendingReviews > 0 || stats.lowStockProducts > 0) && (
        <div className="grid lg:grid-cols-2 gap-4">
          {stats.pendingReviews > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="bg-warning-50 border-warning-200 h-full">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-warning-100 rounded-lg">
                      <HiOutlineStar className="text-warning-600" size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-warning-800 text-sm">Reviews Pending Moderation</h3>
                      <p className="text-xs text-warning-700">{stats.pendingReviews} {stats.pendingReviews === 1 ? 'review' : 'reviews'} waiting for approval</p>
                    </div>
                  </div>
                  <Link href="/admin/reviews">
                    <button type="button" className="px-3 py-1.5 bg-warning-600 text-white text-xs font-medium rounded-lg hover:bg-warning-700 transition-colors">
                      Review Now
                    </button>
                  </Link>
                </div>
              </Card>
            </motion.div>
          )}
          {stats.lowStockProducts > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="bg-red-50 border-red-200 h-full">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-red-100 rounded-lg">
                      <HiOutlineExclamation className="text-red-600" size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-red-800 text-sm">Low Stock Alert</h3>
                      <p className="text-xs text-red-700">{stats.lowStockProducts} {stats.lowStockProducts === 1 ? 'product' : 'products'} running low</p>
                    </div>
                  </div>
                  <Link href="/admin/inventory/alerts">
                    <button type="button" className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors">
                      View Alerts
                    </button>
                  </Link>
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      )}

      {/* ===== Quick Actions ===== */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Card>
          <h2 className="font-semibold text-dark-900 mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Add Product', href: '/admin/products/new', icon: <HiOutlineTag size={18} /> },
              { label: 'Manage Orders', href: '/admin/orders', icon: <HiOutlineShoppingBag size={18} /> },
              { label: 'Create Offer', href: '/admin/offers/new', icon: <HiOutlineCurrencyDollar size={18} /> },
              { label: 'View Customers', href: '/admin/customers', icon: <HiOutlineUsers size={18} /> },
            ].map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="flex items-center gap-2.5 p-3.5 rounded-xl bg-beige-50 hover:bg-beige-100 border border-beige-200 hover:border-primary-200 transition-all text-sm text-dark-700 font-medium group"
              >
                <span className="text-primary-600 group-hover:text-primary-700 transition-colors">{action.icon}</span>
                <span>{action.label}</span>
              </Link>
            ))}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

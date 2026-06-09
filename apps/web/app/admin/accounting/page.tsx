'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  HiOutlineCurrencyDollar,
  HiOutlineTrendingUp,
  HiOutlineTrendingDown,
  HiOutlineCalendar,
  HiOutlineDocumentReport,
  HiOutlineReceiptTax,
  HiOutlineCash,
  HiOutlineRefresh,
} from 'react-icons/hi';
import { Card, Button, Badge } from '@/components/ui';
import { adminApi } from '@/lib/api';
import { formatCurrency, formatDate, cn } from '@/lib/utils';

export default function AccountingDashboardPage() {
  const [period, setPeriod] = useState(30);
  const [backfillResult, setBackfillResult] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-accounting-dashboard', period],
    queryFn: () => adminApi.getAccountingDashboard({ period }),
  });

  const backfillMutation = useMutation({
    mutationFn: adminApi.backfillAccounting,
    onSuccess: (data) => {
      setBackfillResult(data);
      queryClient.invalidateQueries({ queryKey: ['admin-accounting-dashboard'] });
    },
  });

  const stats = [
    {
      label: 'Total Revenue',
      value: formatCurrency(data?.totalRevenue || 0),
      change: data?.revenueChange || 0,
      icon: HiOutlineCurrencyDollar,
      color: 'bg-green-100 text-green-600',
      valueColor: 'text-green-700',
    },
    {
      label: 'Total Expenses',
      value: formatCurrency(data?.totalExpenses || 0),
      change: data?.expensesChange || 0,
      icon: HiOutlineReceiptTax,
      color: 'bg-red-100 text-red-600',
      valueColor: 'text-red-700',
    },
    {
      label: 'Net Profit',
      value: formatCurrency(data?.netProfit || 0),
      change: data?.profitChange || 0,
      icon: HiOutlineTrendingUp,
      color: 'bg-blue-100 text-blue-600',
      valueColor: 'text-blue-700',
    },
    {
      label: 'Average Order Value',
      value: formatCurrency(data?.averageOrderValue || 0),
      change: data?.aovChange || 0,
      icon: HiOutlineCash,
      color: 'bg-purple-100 text-purple-600',
      valueColor: 'text-dark-900',
    },
  ];

  const monthlyBreakdown = data?.monthlyBreakdown || [];
  const expensesByCategory = data?.expensesByCategory || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-dark-900">Financial Dashboard</h1>
          <p className="text-dark-500 mt-1">Overview of your financial performance</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <HiOutlineCalendar className="text-dark-400" size={20} />
            <select
              value={period}
              onChange={(e) => setPeriod(Number(e.target.value))}
              className="px-4 py-2 border border-beige-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-dark-900"
            >
              <option value={30}>Last 30 days</option>
              <option value={60}>Last 60 days</option>
              <option value={90}>Last 90 days</option>
              <option value={365}>Last 365 days</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/accounting/expenses">
              <Button variant="outline" size="sm" leftIcon={<HiOutlineReceiptTax size={16} />}>
                Expenses
              </Button>
            </Link>
            <Link href="/admin/accounting/reports">
              <Button variant="outline" size="sm" leftIcon={<HiOutlineDocumentReport size={16} />}>
                Reports
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
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
                <div className={cn('p-3 rounded-xl', stat.color)}>
                  <stat.icon size={24} />
                </div>
                {stat.change !== undefined && (
                  <div
                    className={cn(
                      'flex items-center gap-1 text-sm',
                      stat.change >= 0 ? 'text-green-600' : 'text-red-600'
                    )}
                  >
                    {stat.change >= 0 ? (
                      <HiOutlineTrendingUp size={16} />
                    ) : (
                      <HiOutlineTrendingDown size={16} />
                    )}
                    {Math.abs(stat.change)}%
                  </div>
                )}
              </div>
              <div className="mt-4">
                <h3 className={cn('text-2xl font-semibold', stat.valueColor)}>
                  {isLoading ? (
                    <div className="h-8 w-28 bg-beige-200 rounded animate-pulse" />
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Breakdown */}
        <div className="lg:col-span-2">
          <Card padding="none">
            <div className="px-6 py-4 border-b border-beige-200">
              <h3 className="text-lg font-semibold text-dark-900">Monthly Breakdown</h3>
              <p className="text-sm text-dark-500 mt-1">Revenue, expenses, and profit for the last 6 months</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-beige-50 border-b border-beige-200">
                  <tr>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                      Month
                    </th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                      Revenue
                    </th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                      Expenses
                    </th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                      Profit
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-beige-200">
                  {isLoading ? (
                    [...Array(6)].map((_, i) => (
                      <tr key={i}>
                        <td colSpan={4} className="px-6 py-4">
                          <div className="h-4 bg-beige-200 rounded animate-pulse" />
                        </td>
                      </tr>
                    ))
                  ) : monthlyBreakdown.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-dark-500">
                        No data available for this period
                      </td>
                    </tr>
                  ) : (
                    monthlyBreakdown.map((month: any) => {
                      const profit = (month.revenue || 0) - (month.expenses || 0);
                      return (
                        <motion.tr
                          key={month.month || month._id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="hover:bg-beige-50"
                        >
                          <td className="px-6 py-4 font-medium text-dark-900">
                            {month.month || month.label}
                          </td>
                          <td className="px-6 py-4 text-right text-green-700 font-medium">
                            {formatCurrency(month.revenue || 0)}
                          </td>
                          <td className="px-6 py-4 text-right text-red-600 font-medium">
                            {formatCurrency(month.expenses || 0)}
                          </td>
                          <td className={cn(
                            'px-6 py-4 text-right font-semibold',
                            profit >= 0 ? 'text-blue-700' : 'text-red-700'
                          )}>
                            {formatCurrency(profit)}
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

        {/* Expense by Category */}
        <Card padding="lg">
          <h3 className="text-lg font-semibold text-dark-900 mb-1">Expenses by Category</h3>
          <p className="text-sm text-dark-500 mb-4">Breakdown of spending</p>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-beige-200 rounded animate-pulse w-3/4" />
                  <div className="h-2 bg-beige-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : expensesByCategory.length === 0 ? (
            <p className="text-dark-500 text-center py-8">No expense data available</p>
          ) : (
            <div className="space-y-4">
              {expensesByCategory.map((category: any) => (
                <div key={category.name || category._id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-dark-900 capitalize">
                      {category.name || category.category}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-dark-900">
                        {formatCurrency(category.amount || category.total || 0)}
                      </span>
                      <span className="text-xs text-dark-500">
                        {category.percentage || 0}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-beige-200 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-primary-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${category.percentage || 0}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-beige-200">
            <Link href="/admin/accounting/expenses">
              <Button variant="outline" size="sm" fullWidth>
                View All Expenses
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* Sync Data */}
      <Card className="border-blue-200 bg-blue-50/30">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-semibold text-dark-900 flex items-center gap-2">
              <HiOutlineRefresh size={20} className="text-blue-600" />
              Sync Order Transactions
            </h2>
            <p className="mt-1 text-sm text-dark-500">
              Create transaction records from existing orders that were placed before the accounting system was activated. Safe to run multiple times.
            </p>
          </div>
          <Button
            onClick={() => backfillMutation.mutate()}
            isLoading={backfillMutation.isPending}
            size="sm"
            variant="primary"
          >
            {backfillMutation.isPending ? 'Syncing...' : 'Sync Now'}
          </Button>
        </div>
        {backfillResult && (
          <div className="mt-4 p-3 bg-white rounded-lg border border-blue-200">
            <p className="text-sm font-medium text-green-700 mb-2">Sync completed!</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-dark-600">
              <div><span className="font-semibold">{backfillResult.transactionsCreated}</span> revenue transactions created</div>
              <div><span className="font-semibold">{backfillResult.refundsCreated}</span> refund transactions created</div>
              <div><span className="font-semibold">{backfillResult.skipped}</span> skipped (existing)</div>
              <div><span className="font-semibold">{backfillResult.totalOrdersProcessed}</span> orders processed</div>
            </div>
          </div>
        )}
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/admin/accounting/expenses/new">
          <Card variant="hover" padding="md" className="cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 text-red-600">
                <HiOutlineReceiptTax size={20} />
              </div>
              <div>
                <p className="font-medium text-dark-900">Record Expense</p>
                <p className="text-sm text-dark-500">Add a new expense entry</p>
              </div>
            </div>
          </Card>
        </Link>
        <Link href="/admin/accounting/transactions">
          <Card variant="hover" padding="md" className="cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                <HiOutlineCash size={20} />
              </div>
              <div>
                <p className="font-medium text-dark-900">Transactions</p>
                <p className="text-sm text-dark-500">View account ledger</p>
              </div>
            </div>
          </Card>
        </Link>
        <Link href="/admin/accounting/reports">
          <Card variant="hover" padding="md" className="cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 text-green-600">
                <HiOutlineDocumentReport size={20} />
              </div>
              <div>
                <p className="font-medium text-dark-900">Financial Reports</p>
                <p className="text-sm text-dark-500">P&L and category analysis</p>
              </div>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
}

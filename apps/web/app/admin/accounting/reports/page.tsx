'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  HiOutlineArrowLeft,
  HiOutlineCurrencyDollar,
  HiOutlineReceiptTax,
  HiOutlineTrendingUp,
  HiOutlineChartBar,
} from 'react-icons/hi';
import { Card, Button, Badge } from '@/components/ui';
import { adminApi } from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';

const periodOptions = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 5 }, (_, i) => ({
  value: String(currentYear - i),
  label: String(currentYear - i),
}));

export default function FinancialReportsPage() {
  const [period, setPeriod] = useState('monthly');
  const [year, setYear] = useState(String(currentYear));

  const { data, isLoading } = useQuery({
    queryKey: ['admin-financial-reports', period, year],
    queryFn: () => adminApi.getFinancialReports({ period, year: Number(year) }),
  });

  const reportPeriods = data?.periods || [];
  const expenseBreakdown = data?.expenseBreakdown || [];
  const summary = data?.summary || {};

  const summaryCards = [
    {
      label: 'Total Revenue',
      value: formatCurrency(summary.totalRevenue || 0),
      icon: HiOutlineCurrencyDollar,
      color: 'bg-green-100 text-green-600',
      valueColor: 'text-green-700',
    },
    {
      label: 'Total Expenses',
      value: formatCurrency(summary.totalExpenses || 0),
      icon: HiOutlineReceiptTax,
      color: 'bg-red-100 text-red-600',
      valueColor: 'text-red-700',
    },
    {
      label: 'Net Profit',
      value: formatCurrency(summary.netProfit || 0),
      icon: HiOutlineTrendingUp,
      color: 'bg-blue-100 text-blue-600',
      valueColor: (summary.netProfit || 0) >= 0 ? 'text-blue-700' : 'text-red-700',
    },
    {
      label: 'Profit Margin',
      value: `${(summary.profitMargin || 0).toFixed(1)}%`,
      icon: HiOutlineChartBar,
      color: 'bg-purple-100 text-purple-600',
      valueColor: (summary.profitMargin || 0) >= 0 ? 'text-purple-700' : 'text-red-700',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/accounting">
            <Button variant="ghost" size="sm">
              <HiOutlineArrowLeft size={20} />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-dark-900">Financial Reports</h1>
            <p className="text-dark-500 mt-1">Profit & Loss analysis and expense breakdown</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border border-beige-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-dark-900"
          >
            {periodOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="px-4 py-2 border border-beige-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-dark-900"
          >
            {yearOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryCards.map((stat, index) => (
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

      {/* P&L Table */}
      <Card padding="none">
        <div className="px-6 py-4 border-b border-beige-200">
          <h3 className="text-lg font-semibold text-dark-900">Profit & Loss Statement</h3>
          <p className="text-sm text-dark-500 mt-1">
            {period === 'monthly' ? 'Monthly' : period === 'quarterly' ? 'Quarterly' : 'Yearly'} breakdown for {year}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-beige-50 border-b border-beige-200">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase tracking-wider sticky left-0 bg-beige-50">
                  Metric
                </th>
                {isLoading ? (
                  [...Array(period === 'monthly' ? 6 : period === 'quarterly' ? 4 : 1)].map((_, i) => (
                    <th key={i} className="text-right px-6 py-4">
                      <div className="h-4 w-16 bg-beige-200 rounded animate-pulse ml-auto" />
                    </th>
                  ))
                ) : (
                  reportPeriods.map((p: any) => (
                    <th
                      key={p.label || p.period}
                      className="text-right px-6 py-4 text-xs font-semibold text-dark-500 uppercase tracking-wider whitespace-nowrap"
                    >
                      {p.label || p.period}
                    </th>
                  ))
                )}
                <th className="text-right px-6 py-4 text-xs font-semibold text-dark-900 uppercase tracking-wider bg-beige-100">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-beige-200">
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8} className="px-6 py-4">
                      <div className="h-4 bg-beige-200 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : (
                <>
                  {/* Revenue Row */}
                  <tr className="hover:bg-beige-50">
                    <td className="px-6 py-4 font-medium text-dark-900 sticky left-0 bg-white">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        Revenue
                      </div>
                    </td>
                    {reportPeriods.map((p: any) => (
                      <td key={p.label || p.period} className="px-6 py-4 text-right text-green-700 font-medium whitespace-nowrap">
                        {formatCurrency(p.revenue || 0)}
                      </td>
                    ))}
                    <td className="px-6 py-4 text-right font-bold text-green-700 bg-beige-50 whitespace-nowrap">
                      {formatCurrency(summary.totalRevenue || 0)}
                    </td>
                  </tr>

                  {/* Expenses Row */}
                  <tr className="hover:bg-beige-50">
                    <td className="px-6 py-4 font-medium text-dark-900 sticky left-0 bg-white">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        Expenses
                      </div>
                    </td>
                    {reportPeriods.map((p: any) => (
                      <td key={p.label || p.period} className="px-6 py-4 text-right text-red-600 font-medium whitespace-nowrap">
                        {formatCurrency(p.expenses || 0)}
                      </td>
                    ))}
                    <td className="px-6 py-4 text-right font-bold text-red-700 bg-beige-50 whitespace-nowrap">
                      {formatCurrency(summary.totalExpenses || 0)}
                    </td>
                  </tr>

                  {/* Net Profit Row */}
                  <tr className="bg-beige-50/50 font-semibold">
                    <td className="px-6 py-4 text-dark-900 sticky left-0 bg-beige-50/50">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        Net Profit
                      </div>
                    </td>
                    {reportPeriods.map((p: any) => {
                      const profit = (p.revenue || 0) - (p.expenses || 0);
                      return (
                        <td
                          key={p.label || p.period}
                          className={cn(
                            'px-6 py-4 text-right font-semibold whitespace-nowrap',
                            profit >= 0 ? 'text-blue-700' : 'text-red-700'
                          )}
                        >
                          {formatCurrency(profit)}
                        </td>
                      );
                    })}
                    <td className={cn(
                      'px-6 py-4 text-right font-bold bg-beige-100 whitespace-nowrap',
                      (summary.netProfit || 0) >= 0 ? 'text-blue-700' : 'text-red-700'
                    )}>
                      {formatCurrency(summary.netProfit || 0)}
                    </td>
                  </tr>

                  {/* Profit Margin Row */}
                  <tr className="hover:bg-beige-50">
                    <td className="px-6 py-4 font-medium text-dark-900 sticky left-0 bg-white">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-purple-500" />
                        Margin %
                      </div>
                    </td>
                    {reportPeriods.map((p: any) => {
                      const profit = (p.revenue || 0) - (p.expenses || 0);
                      const margin = p.revenue ? ((profit / p.revenue) * 100) : 0;
                      return (
                        <td
                          key={p.label || p.period}
                          className={cn(
                            'px-6 py-4 text-right font-medium whitespace-nowrap',
                            margin >= 0 ? 'text-purple-700' : 'text-red-700'
                          )}
                        >
                          {margin.toFixed(1)}%
                        </td>
                      );
                    })}
                    <td className={cn(
                      'px-6 py-4 text-right font-bold bg-beige-50 whitespace-nowrap',
                      (summary.profitMargin || 0) >= 0 ? 'text-purple-700' : 'text-red-700'
                    )}>
                      {(summary.profitMargin || 0).toFixed(1)}%
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Expense Breakdown by Category */}
      <Card padding="none">
        <div className="px-6 py-4 border-b border-beige-200">
          <h3 className="text-lg font-semibold text-dark-900">Expense Breakdown by Category</h3>
          <p className="text-sm text-dark-500 mt-1">How expenses are distributed across categories</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-beige-50 border-b border-beige-200">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                  % of Total
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase tracking-wider w-1/3">
                  Distribution
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-beige-200">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={4} className="px-6 py-4">
                      <div className="h-4 bg-beige-200 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : expenseBreakdown.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-dark-500">
                    No expense data available for this period
                  </td>
                </tr>
              ) : (
                expenseBreakdown.map((item: any, index: number) => (
                  <motion.tr
                    key={item.category || item.name}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-beige-50"
                  >
                    <td className="px-6 py-4">
                      <span className="font-medium text-dark-900 capitalize">
                        {item.category || item.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-dark-900">
                      {formatCurrency(item.amount || item.total || 0)}
                    </td>
                    <td className="px-6 py-4 text-right text-dark-600">
                      {(item.percentage || 0).toFixed(1)}%
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-beige-200 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-primary-500 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${item.percentage || 0}%` }}
                            transition={{ duration: 0.8, delay: index * 0.1 }}
                          />
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
            {!isLoading && expenseBreakdown.length > 0 && (
              <tfoot className="border-t-2 border-beige-300">
                <tr className="bg-beige-50">
                  <td className="px-6 py-4 font-bold text-dark-900">Total</td>
                  <td className="px-6 py-4 text-right font-bold text-dark-900">
                    {formatCurrency(summary.totalExpenses || 0)}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-dark-900">100%</td>
                  <td className="px-6 py-4" />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Card>
    </div>
  );
}

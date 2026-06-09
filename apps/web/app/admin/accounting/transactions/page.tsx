'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  HiOutlineArrowLeft,
  HiOutlineSearch,
  HiOutlineArrowUp,
  HiOutlineArrowDown,
  HiOutlineExternalLink,
} from 'react-icons/hi';
import { Card, Button, Badge, Input, Select } from '@/components/ui';
import { adminApi } from '@/lib/api';
import { formatCurrency, formatDate, cn } from '@/lib/utils';

const typeOptions = [
  { value: '', label: 'All Types' },
  { value: 'credit', label: 'Credit' },
  { value: 'debit', label: 'Debit' },
];

const categoryOptions = [
  { value: '', label: 'All Categories' },
  { value: 'order_revenue', label: 'Order Revenue' },
  { value: 'order_refund', label: 'Order Refund' },
  { value: 'expense', label: 'Expense' },
  { value: 'adjustment', label: 'Adjustment' },
];

const categoryBadgeVariant: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'> = {
  order_revenue: 'primary',
  order_refund: 'warning',
  expense: 'error',
  adjustment: 'info',
};

export default function TransactionsPage() {
  const [page, setPage] = useState(1);
  const [type, setType] = useState('');
  const [category, setCategory] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-transactions', page, type, category, dateFrom, dateTo, search],
    queryFn: () =>
      adminApi.getTransactions({
        page,
        limit: 25,
        type: type || undefined,
        category: category || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        search: search || undefined,
      }),
  });

  const transactions = data?.transactions || [];
  const pagination = data?.pagination;

  // Calculate running balance from the data
  const runningBalances: number[] = [];
  let balance = (data as any)?.openingBalance || 0;
  transactions.forEach((txn: any, idx: number) => {
    if (txn.type === 'credit') {
      balance += txn.amount || 0;
    } else {
      balance -= txn.amount || 0;
    }
    runningBalances[idx] = balance;
  });

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
            <h1 className="text-2xl font-semibold text-dark-900">Account Ledger</h1>
            <p className="text-dark-500 mt-1">View all financial transactions</p>
          </div>
        </div>
        {balance !== 0 && (
          <div className="text-right">
            <p className="text-sm text-dark-500">Running Balance</p>
            <p className={cn(
              'text-2xl font-bold',
              balance >= 0 ? 'text-green-700' : 'text-red-700'
            )}>
              {formatCurrency(balance)}
            </p>
          </div>
        )}
      </div>

      {/* Filters */}
      <Card padding="md">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search transactions..."
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
              className="w-full sm:w-40"
            />
            <Select
              options={categoryOptions}
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              fullWidth={false}
              className="w-full sm:w-44"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
            <span className="text-sm text-dark-500">Date range:</span>
            <div className="flex gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2.5 border border-beige-300 rounded-lg text-sm text-dark-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
              />
              <span className="self-center text-dark-400">to</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2.5 border border-beige-300 rounded-lg text-sm text-dark-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
              />
            </div>
            {(type || category || dateFrom || dateTo || search) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setType('');
                  setCategory('');
                  setDateFrom('');
                  setDateTo('');
                  setSearch('');
                  setPage(1);
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Transactions Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-beige-50 border-b border-beige-200">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="text-center px-6 py-4 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                  Reference
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                  Related
                </th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                  Balance
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-beige-200">
              {isLoading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8} className="px-6 py-4">
                      <div className="h-4 bg-beige-200 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-dark-500">
                    No transactions found
                  </td>
                </tr>
              ) : (
                transactions.map((txn: any, index: number) => (
                  <motion.tr
                    key={txn._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-beige-50"
                  >
                    <td className="px-6 py-4 text-sm text-dark-600 whitespace-nowrap">
                      {formatDate(txn.date || txn.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-dark-900 max-w-xs truncate">
                        {txn.description}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {txn.type === 'credit' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          <HiOutlineArrowUp size={12} />
                          Credit
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          <HiOutlineArrowDown size={12} />
                          Debit
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={categoryBadgeVariant[txn.category] || 'default'}
                        size="sm"
                      >
                        {txn.category}
                      </Badge>
                    </td>
                    <td className={cn(
                      'px-6 py-4 text-right font-semibold whitespace-nowrap',
                      txn.type === 'credit' ? 'text-green-700' : 'text-red-700'
                    )}>
                      {txn.type === 'credit' ? '+' : '-'}{formatCurrency(txn.amount || 0)}
                    </td>
                    <td className="px-6 py-4 text-sm text-dark-600">
                      {txn.reference || '-'}
                    </td>
                    <td className="px-6 py-4">
                      {txn.orderId ? (
                        <Link
                          href={`/admin/orders/${txn.orderId}`}
                          className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
                        >
                          Order <HiOutlineExternalLink size={12} />
                        </Link>
                      ) : txn.expenseId ? (
                        <Link
                          href={`/admin/accounting/expenses/${txn.expenseId}`}
                          className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
                        >
                          Expense <HiOutlineExternalLink size={12} />
                        </Link>
                      ) : (
                        <span className="text-sm text-dark-400">-</span>
                      )}
                    </td>
                    <td className={cn(
                      'px-6 py-4 text-right text-sm font-medium whitespace-nowrap',
                      runningBalances[index] >= 0 ? 'text-dark-900' : 'text-red-700'
                    )}>
                      {formatCurrency(runningBalances[index] || 0)}
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
              Showing {(page - 1) * 25 + 1} to {Math.min(page * 25, pagination.total)} of{' '}
              {pagination.total} transactions
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

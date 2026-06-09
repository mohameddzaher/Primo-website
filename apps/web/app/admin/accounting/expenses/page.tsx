'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  HiOutlinePlus,
  HiOutlineSearch,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineArrowLeft,
} from 'react-icons/hi';
import { Card, Button, Badge, Input, Select } from '@/components/ui';
import { adminApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const categoryOptions = [
  { value: '', label: 'All Categories' },
  { value: 'inventory', label: 'Inventory' },
  { value: 'shipping', label: 'Shipping' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'salaries', label: 'Salaries' },
  { value: 'rent', label: 'Rent' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'software', label: 'Software' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'taxes', label: 'Taxes' },
  { value: 'other', label: 'Other' },
];

const categoryColors: Record<string, string> = {
  inventory: 'bg-blue-100 text-blue-700',
  shipping: 'bg-purple-100 text-purple-700',
  marketing: 'bg-orange-100 text-orange-700',
  salaries: 'bg-green-100 text-green-700',
  rent: 'bg-yellow-100 text-yellow-700',
  utilities: 'bg-cyan-100 text-cyan-700',
  software: 'bg-indigo-100 text-indigo-700',
  equipment: 'bg-pink-100 text-pink-700',
  taxes: 'bg-red-100 text-red-700',
  other: 'bg-gray-100 text-gray-700',
};

export default function ExpensesListPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-expenses', page, search, category, dateFrom, dateTo],
    queryFn: () =>
      adminApi.getExpenses({
        page,
        limit: 20,
        search,
        category: category || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-expenses'] });
      toast.success('Expense deleted successfully');
    },
    onError: (error: any) => {
      toast.error(getApiErrorMessage(error, 'Failed to delete expense'));
    },
  });

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      deleteMutation.mutate(id);
    }
  };

  const expenses = data?.expenses || [];
  const pagination = data?.pagination;

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
            <h1 className="text-2xl font-semibold text-dark-900">Expenses</h1>
            <p className="text-dark-500 mt-1">Track and manage business expenses</p>
          </div>
        </div>
        <Link href="/admin/accounting/expenses/new">
          <Button leftIcon={<HiOutlinePlus size={18} />}>
            Add Expense
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card padding="md">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search expenses..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              leftIcon={<HiOutlineSearch size={18} />}
            />
          </div>
          <Select
            options={categoryOptions}
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            fullWidth={false}
            className="w-full sm:w-48"
          />
          <div className="flex gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2.5 border border-beige-300 rounded-lg text-sm text-dark-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
              placeholder="From"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2.5 border border-beige-300 rounded-lg text-sm text-dark-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
              placeholder="To"
            />
          </div>
        </div>
      </Card>

      {/* Expenses Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-beige-50 border-b border-beige-200">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="text-center px-6 py-4 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                  Recurring
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                  Created By
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
                      <div className="h-4 bg-beige-200 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-dark-500">
                    No expenses found
                  </td>
                </tr>
              ) : (
                expenses.map((expense: any) => (
                  <motion.tr
                    key={expense._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-beige-50"
                  >
                    <td className="px-6 py-4 text-dark-600 text-sm">
                      {formatDate(expense.date || expense.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-dark-900">{expense.title}</p>
                      {expense.description && (
                        <p className="text-xs text-dark-500 mt-0.5 truncate max-w-xs">
                          {expense.description}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          'inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize',
                          categoryColors[expense.category] || 'bg-gray-100 text-gray-700'
                        )}
                      >
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-dark-900">
                      {formatCurrency(expense.amount)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {expense.isRecurring ? (
                        <Badge variant="success" size="sm">
                          Yes - {expense.recurringFrequency}
                        </Badge>
                      ) : (
                        <Badge variant="default" size="sm">No</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-dark-600">
                      {expense.createdBy?.fullName || (expense.createdBy?.firstName ? `${expense.createdBy.firstName} ${expense.createdBy.lastName}` : expense.createdBy?.email) || '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/accounting/expenses/${expense._id}`}>
                          <Button variant="ghost" size="sm">
                            <HiOutlinePencil size={16} />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(expense._id, expense.title)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <HiOutlineTrash size={16} />
                        </Button>
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
              {pagination.total} expenses
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

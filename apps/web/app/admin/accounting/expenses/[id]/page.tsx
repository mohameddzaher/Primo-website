'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { HiOutlineArrowLeft, HiOutlineTrash } from 'react-icons/hi';
import { Card, Button, Input, Select } from '@/components/ui';
import { Textarea } from '@/components/ui/Input';
import { adminApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-error';
import toast from 'react-hot-toast';

const categoryOptions = [
  { value: '', label: 'Select Category' },
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

const frequencyOptions = [
  { value: '', label: 'Select Frequency' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];

export default function EditExpensePage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const expenseId = params.id as string;

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [receipt, setReceiptUrl] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState('');

  const { data: expense, isLoading: expenseLoading } = useQuery({
    queryKey: ['admin-expense', expenseId],
    queryFn: () => adminApi.getExpense(expenseId),
    enabled: !!expenseId,
  });

  useEffect(() => {
    if (expense) {
      setTitle(expense.title || '');
      setAmount(String(expense.amount || ''));
      setCategory(expense.category || '');
      setDate(
        expense.date
          ? new Date(expense.date).toISOString().split('T')[0]
          : expense.createdAt
          ? new Date(expense.createdAt).toISOString().split('T')[0]
          : ''
      );
      setDescription(expense.description || '');
      setReceiptUrl(expense.receipt || '');
      setIsRecurring(expense.isRecurring || false);
      setRecurringFrequency(expense.recurringFrequency || '');
    }
  }, [expense]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => adminApi.updateExpense(expenseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-expense', expenseId] });
      queryClient.invalidateQueries({ queryKey: ['admin-expenses'] });
      toast.success('Expense updated successfully');
      router.push('/admin/accounting/expenses');
    },
    onError: (error: any) => {
      toast.error(getApiErrorMessage(error, 'Failed to update expense'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => adminApi.deleteExpense(expenseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-expenses'] });
      toast.success('Expense deleted successfully');
      router.push('/admin/accounting/expenses');
    },
    onError: (error: any) => {
      toast.error(getApiErrorMessage(error, 'Failed to delete expense'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }
    if (!category) {
      toast.error('Category is required');
      return;
    }
    if (!date) {
      toast.error('Date is required');
      return;
    }
    if (isRecurring && !recurringFrequency) {
      toast.error('Please select a recurring frequency');
      return;
    }

    updateMutation.mutate({
      title: title.trim(),
      amount: Number(amount),
      category,
      date,
      description: description.trim() || undefined,
      receipt: receipt.trim() || undefined,
      isRecurring,
      recurringFrequency: isRecurring ? recurringFrequency : undefined,
    });
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      deleteMutation.mutate();
    }
  };

  if (expenseLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-beige-200 rounded w-1/4 animate-pulse" />
        <Card padding="lg" className="animate-pulse">
          <div className="h-64 bg-beige-200 rounded" />
        </Card>
      </div>
    );
  }

  if (!expense) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-dark-900 mb-4">Expense Not Found</h2>
        <Link href="/admin/accounting/expenses">
          <Button>Back to Expenses</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/accounting/expenses">
            <Button variant="ghost" size="sm">
              <HiOutlineArrowLeft size={20} />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-dark-900">Edit Expense</h1>
            <p className="text-dark-500 mt-1">{expense.title}</p>
          </div>
        </div>
        <Button
          variant="danger"
          size="sm"
          leftIcon={<HiOutlineTrash size={16} />}
          onClick={handleDelete}
          isLoading={deleteMutation.isPending}
        >
          Delete
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card padding="lg">
              <h2 className="text-lg font-semibold text-dark-900 mb-4">Expense Details</h2>
              <div className="space-y-4">
                <Input
                  label="Title"
                  placeholder="Enter expense title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Amount (EGP)"
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="0"
                    step="0.01"
                    required
                  />
                  <Select
                    label="Category"
                    options={categoryOptions}
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-dark-700">Date</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full rounded-lg border border-beige-300 bg-white px-4 py-2.5 text-dark-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                      required
                    />
                  </div>
                  <Input
                    label="Receipt URL"
                    placeholder="https://..."
                    value={receipt}
                    onChange={(e) => setReceiptUrl(e.target.value)}
                  />
                </div>
                <Textarea
                  label="Description"
                  placeholder="Enter expense description (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>
            </Card>

            {/* Recurring */}
            <Card padding="lg">
              <h2 className="text-lg font-semibold text-dark-900 mb-4">Recurring Settings</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRecurring(!isRecurring);
                      if (isRecurring) setRecurringFrequency('');
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      isRecurring ? 'bg-primary-600' : 'bg-beige-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isRecurring ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <div>
                    <p className="text-sm font-medium text-dark-900">Recurring Expense</p>
                    <p className="text-sm text-dark-500">This expense repeats on a schedule</p>
                  </div>
                </div>
                {isRecurring && (
                  <Select
                    label="Frequency"
                    options={frequencyOptions}
                    value={recurringFrequency}
                    onChange={(e) => setRecurringFrequency(e.target.value)}
                  />
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card padding="lg">
              <div className="space-y-3">
                <Button type="submit" fullWidth isLoading={updateMutation.isPending}>
                  Update Expense
                </Button>
                <Link href="/admin/accounting/expenses">
                  <Button type="button" variant="outline" fullWidth>
                    Cancel
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Metadata */}
            {expense.createdAt && (
              <Card padding="lg">
                <h2 className="text-lg font-semibold text-dark-900 mb-3">Info</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-dark-500">Created</span>
                    <span className="text-dark-900">
                      {new Date(expense.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {expense.updatedAt && (
                    <div className="flex justify-between">
                      <span className="text-dark-500">Last Updated</span>
                      <span className="text-dark-900">
                        {new Date(expense.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {expense.createdBy && (
                    <div className="flex justify-between">
                      <span className="text-dark-500">Created By</span>
                      <span className="text-dark-900">
                        {expense.createdBy.fullName || `${expense.createdBy.firstName || ''} ${expense.createdBy.lastName || ''}`.trim() || expense.createdBy.email}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { HiOutlineArrowLeft } from 'react-icons/hi';
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

export default function CreateExpensePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [receipt, setReceiptUrl] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState('');

  const createMutation = useMutation({
    mutationFn: (data: any) => adminApi.createExpense(data),
    onSuccess: () => {
      toast.success('Expense created successfully');
      router.push('/admin/accounting/expenses');
    },
    onError: (error: any) => {
      toast.error(getApiErrorMessage(error, 'Failed to create expense'));
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

    createMutation.mutate({
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/accounting/expenses">
          <Button variant="ghost" size="sm">
            <HiOutlineArrowLeft size={20} />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-dark-900">New Expense</h1>
          <p className="text-dark-500 mt-1">Record a new business expense</p>
        </div>
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
                <Button type="submit" fullWidth isLoading={createMutation.isPending}>
                  Create Expense
                </Button>
                <Link href="/admin/accounting/expenses">
                  <Button type="button" variant="outline" fullWidth>
                    Cancel
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}

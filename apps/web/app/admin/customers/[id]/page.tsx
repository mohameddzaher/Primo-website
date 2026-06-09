'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { HiOutlineArrowLeft, HiOutlineStar } from 'react-icons/hi';
import { Button, Input, Card, Checkbox } from '@/components/ui';
import { adminApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

const customerSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().optional(),
  password: z.string().optional(),
  isActive: z.boolean(),
});

type CustomerForm = z.infer<typeof customerSchema>;

export default function EditCustomerPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const customerId = params.id as string;

  const [adjustPoints, setAdjustPoints] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => adminApi.getUser(customerId),
    enabled: !!customerId,
  });

  const adjustPointsMutation = useMutation({
    mutationFn: (data: { adjustPoints: number; reason: string }) =>
      adminApi.adjustUserPoints(customerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', customerId] });
      toast.success('Points updated successfully');
      setAdjustPoints('');
      setAdjustReason('');
    },
    onError: (error: any) => {
      toast.error(getApiErrorMessage(error, 'Failed to update points'));
    },
  });

  const freezePointsMutation = useMutation({
    mutationFn: (freeze: boolean) =>
      adminApi.adjustUserPoints(customerId, { freeze, reason: freeze ? 'Points frozen by admin' : 'Points unfrozen by admin' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', customerId] });
      toast.success('Points freeze status updated');
    },
    onError: (error: any) => toast.error(getApiErrorMessage(error, 'Failed to update freeze status')),
  });

  const updateMutation = useMutation({
    mutationFn: (data: CustomerForm) => {
      const { password, ...rest } = data;
      const payload: Record<string, any> = { ...rest };
      if (password) payload.password = password;
      return adminApi.updateCustomer(customerId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', customerId] });
      queryClient.invalidateQueries({ queryKey: ['admin-customers'] });
      toast.success('Customer updated successfully');
      router.push('/admin/customers');
    },
    onError: (error: any) => {
      toast.error(getApiErrorMessage(error, 'Failed to update customer'));
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CustomerForm>({
    resolver: zodResolver(customerSchema),
  });

  useEffect(() => {
    if (customer) {
      reset({
        firstName: customer.firstName || '',
        lastName: customer.lastName || '',
        email: customer.email || '',
        phone: customer.phone || '',
        isActive: customer.isActive ?? true,
      });
    }
  }, [customer, reset]);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-10 bg-beige-200 rounded w-48"></div>
        <div className="h-64 bg-beige-200 rounded-xl"></div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-dark-500">Customer not found</p>
        <Link href="/admin/customers">
          <Button variant="outline" className="mt-4">Back to Customers</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/customers">
          <Button variant="ghost" size="sm">
            <HiOutlineArrowLeft size={20} />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-dark-900">Edit Customer</h1>
          <p className="text-dark-500 mt-1">{customer.fullName || `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || customer.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form onSubmit={handleSubmit((data) => updateMutation.mutate(data))} className="lg:col-span-2">
          <Card padding="lg" className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                error={errors.firstName?.message}
                {...register('firstName')}
              />
              <Input
                label="Last Name"
                error={errors.lastName?.message}
                {...register('lastName')}
              />
            </div>

            <Input
              label="Email Address"
              type="email"
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Phone Number"
              type="tel"
              {...register('phone')}
            />

            <Input
              label="New Password"
              type="password"
              placeholder="Leave empty to keep current password"
              {...register('password')}
            />

            <Checkbox
              label="Active"
              description="Customer can access their account and place orders"
              {...register('isActive')}
            />

            <div className="flex gap-3 pt-4">
              <Button type="submit" isLoading={updateMutation.isPending}>
                Update Customer
              </Button>
              <Link href="/admin/customers">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </Card>
        </form>

        <div className="space-y-6">
          {customer.orderStats && (
            <Card padding="lg">
              <h3 className="font-semibold text-dark-900 mb-4">Order Statistics</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-dark-500 text-sm">Total Orders</span>
                  <span className="font-semibold text-dark-900">{customer.orderStats.totalOrders}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-dark-500 text-sm">Total Spent</span>
                  <span className="font-semibold text-dark-900">{formatCurrency(customer.orderStats.totalSpent)}</span>
                </div>
              </div>
            </Card>
          )}

          <Card padding="lg">
            <h3 className="font-semibold text-dark-900 mb-4">Account Info</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-dark-500">Last Login</span>
                <span className="text-dark-700">{customer.lastLogin ? new Date(customer.lastLogin).toLocaleString() : 'Never'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-dark-500">Joined</span>
                <span className="text-dark-700">{customer.createdAt ? new Date(customer.createdAt).toLocaleString() : '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-dark-500">Email Verified</span>
                <span className={customer.isEmailVerified ? 'text-green-600' : 'text-red-600'}>
                  {customer.isEmailVerified ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </Card>

          {/* Loyalty Points Management */}
          <Card padding="lg">
            <div className="flex items-center gap-2 mb-4">
              <HiOutlineStar className="text-primary-600" size={20} />
              <h3 className="font-semibold text-dark-900">Loyalty Points</h3>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-dark-500">Current Balance</span>
                <span className="font-bold text-primary-700 text-lg">
                  {(customer.loyaltyPoints || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-dark-500">Total Earned</span>
                <span className="font-semibold text-green-600">{(customer.totalPointsEarned || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-dark-500">Total Redeemed</span>
                <span className="font-semibold text-red-600">{(customer.totalPointsRedeemed || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-dark-500">Status</span>
                <span className={`font-medium ${customer.pointsFrozen ? 'text-red-600' : 'text-green-600'}`}>
                  {customer.pointsFrozen ? 'Frozen' : 'Active'}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-beige-200">
              <Button
                type="button"
                variant={customer.pointsFrozen ? 'primary' : 'outline'}
                size="sm"
                fullWidth
                onClick={() => freezePointsMutation.mutate(!customer.pointsFrozen)}
                isLoading={freezePointsMutation.isPending}
              >
                {customer.pointsFrozen ? 'Unfreeze Points' : 'Freeze Points'}
              </Button>
            </div>

            <div className="mt-4 pt-4 border-t border-beige-200 space-y-3">
              <p className="text-sm font-medium text-dark-700">Adjust Points</p>
              <Input
                type="number"
                placeholder="e.g. 50 or -50"
                value={adjustPoints}
                onChange={(e) => setAdjustPoints(e.target.value)}
              />
              <Input
                placeholder="Reason for adjustment"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
              />
              <Button
                type="button"
                size="sm"
                fullWidth
                disabled={!adjustPoints || !adjustReason.trim()}
                isLoading={adjustPointsMutation.isPending}
                onClick={() => {
                  const pts = parseInt(adjustPoints, 10);
                  if (isNaN(pts) || pts === 0) {
                    toast.error('Please enter a valid non-zero points value');
                    return;
                  }
                  adjustPointsMutation.mutate({ adjustPoints: pts, reason: adjustReason.trim() });
                }}
              >
                {parseInt(adjustPoints, 10) > 0 ? 'Add Points' : parseInt(adjustPoints, 10) < 0 ? 'Deduct Points' : 'Adjust Points'}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { HiOutlineArrowLeft } from 'react-icons/hi';
import { Button, Input, Card, Checkbox } from '@/components/ui';
import { adminApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-error';
import toast from 'react-hot-toast';

const staffSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['admin', 'super_admin']),
  isActive: z.boolean(),
});

type StaffForm = z.infer<typeof staffSchema>;

export default function NewStaffPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StaffForm>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      isActive: true,
      role: 'admin',
    },
  });

  const onSubmit = async (data: StaffForm) => {
    setIsLoading(true);
    try {
      // Backend createStaffSchema requires permissions object
      const payload: Record<string, any> = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        role: data.role,
        permissions: {
          orders: { read: true, write: true },
          products: { read: true, write: true },
          offers: { read: true, write: true },
          reviews: { moderate: true },
          analytics: { limited: true, full: false },
          staff: { read: false, write: false },
          cms: { read: true, write: true },
        },
      };
      await adminApi.createStaff(payload);
      queryClient.invalidateQueries({ queryKey: ['admin-staff'] });
      toast.success('Staff member created successfully');
      router.push('/admin/staff');
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, 'Failed to create staff member'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/staff">
          <Button variant="ghost" size="sm">
            <HiOutlineArrowLeft size={20} />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-dark-900">Add Staff Member</h1>
          <p className="text-dark-500 mt-1">Create a new admin user</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl">
        <Card padding="lg" className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              placeholder="Enter first name"
              error={errors.firstName?.message}
              {...register('firstName')}
            />
            <Input
              label="Last Name"
              placeholder="Enter last name"
              error={errors.lastName?.message}
              {...register('lastName')}
            />
          </div>

          <Input
            label="Email Address"
            type="email"
            placeholder="admin@example.com"
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label="Password"
            type="password"
            placeholder="Enter password"
            error={errors.password?.message}
            {...register('password')}
          />

          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1">
              Role
            </label>
            <select
              className="w-full px-4 py-2 border border-beige-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              {...register('role')}
            >
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
            <p className="mt-1 text-sm text-dark-500">
              Staff: operational access (orders, products, inventory). Admin: department management. Super Admin: full access.
            </p>
          </div>

          <Checkbox
            label="Active"
            description="Staff member can access the admin panel"
            {...register('isActive')}
          />

          <div className="flex gap-3 pt-4">
            <Button type="submit" isLoading={isLoading}>
              Create Staff Member
            </Button>
            <Link href="/admin/staff">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
          </div>
        </Card>
      </form>
    </div>
  );
}

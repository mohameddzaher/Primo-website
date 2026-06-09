'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { HiOutlineArrowLeft } from 'react-icons/hi';
import { Button, Input, Card, Checkbox } from '@/components/ui';
import { adminApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-error';
import toast from 'react-hot-toast';

const staffSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().optional(),
  role: z.enum(['admin', 'super_admin']),
  isActive: z.boolean(),
});

type StaffForm = z.infer<typeof staffSchema>;

export default function EditStaffPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const staffId = params.id as string;

  const { data: staff, isLoading: staffLoading } = useQuery({
    queryKey: ['staff', staffId],
    queryFn: () => adminApi.getStaffMember(staffId),
    enabled: !!staffId,
  });

  const updateMutation = useMutation({
    mutationFn: (data: StaffForm) => {
      const { isActive, password, ...rest } = data;
      const payload: Record<string, any> = { ...rest };
      if (password) payload.password = password;
      return adminApi.updateStaff(staffId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff', staffId] });
      queryClient.invalidateQueries({ queryKey: ['admin-staff'] });
      toast.success('Staff member updated');
      router.push('/admin/staff');
    },
    onError: (error: any) => toast.error(getApiErrorMessage(error, 'Failed to update staff member')),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<StaffForm>({
    resolver: zodResolver(staffSchema),
  });

  useEffect(() => {
    if (staff) {
      reset({
        firstName: staff.firstName || '',
        lastName: staff.lastName || '',
        email: staff.email,
        role: staff.role,
        isActive: staff.isActive,
      });
    }
  }, [staff, reset]);

  if (staffLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-64 bg-beige-200 rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/staff">
          <Button variant="ghost" size="sm">
            <HiOutlineArrowLeft size={20} />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-dark-900">Edit Staff Member</h1>
          <p className="text-dark-500 mt-1">{staff?.fullName || `${staff?.firstName || ''} ${staff?.lastName || ''}`.trim()}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit((data) => updateMutation.mutate(data))} className="max-w-2xl">
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
            label="New Password"
            type="password"
            placeholder="Leave empty to keep current password"
            {...register('password')}
          />

          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1">
              Role
            </label>
            <select
              className="w-full px-4 py-2 border border-beige-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              {...register('role')}
              disabled={staff?.role === 'super_admin'}
            >
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>

          <Checkbox
            label="Active"
            description="Staff member can access the admin panel"
            {...register('isActive')}
          />

          <div className="p-4 bg-beige-50 rounded-lg text-sm text-dark-600">
            <p><strong>Last Login:</strong> {staff?.lastLogin ? new Date(staff.lastLogin).toLocaleString() : 'Never'}</p>
            <p><strong>Created:</strong> {staff?.createdAt ? new Date(staff.createdAt).toLocaleString() : '-'}</p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" isLoading={updateMutation.isPending}>
              Update Staff Member
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

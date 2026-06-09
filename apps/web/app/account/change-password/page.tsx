'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { HiOutlineLockClosed } from 'react-icons/hi';
import { Button, Input, Card } from '@/components/ui';
import { authApi } from '@/lib/api';
import toast from 'react-hot-toast';

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Must contain uppercase, lowercase, and a number'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

export default function ChangePasswordPage() {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (data: ChangePasswordForm) => {
    setIsLoading(true);
    try {
      await authApi.changePassword(data.currentPassword, data.newPassword);
      toast.success('Password changed successfully');
      reset();
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to change password';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h1 className="text-2xl font-semibold text-dark-900 mb-6">
        Change Password
      </h1>

      <Card padding="lg" className="max-w-lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Current Password"
            type="password"
            placeholder="Enter current password"
            leftIcon={<HiOutlineLockClosed size={18} />}
            error={errors.currentPassword?.message}
            {...register('currentPassword')}
          />

          <Input
            label="New Password"
            type="password"
            placeholder="Enter new password"
            leftIcon={<HiOutlineLockClosed size={18} />}
            error={errors.newPassword?.message}
            {...register('newPassword')}
          />

          <Input
            label="Confirm New Password"
            type="password"
            placeholder="Confirm new password"
            leftIcon={<HiOutlineLockClosed size={18} />}
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

          <p className="text-xs text-dark-400">
            Password must be at least 8 characters with uppercase, lowercase, and a number.
          </p>

          <Button type="submit" isLoading={isLoading} className="mt-4">
            Update Password
          </Button>
        </form>
      </Card>
    </motion.div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { HiOutlineLockClosed, HiOutlineCheck } from 'react-icons/hi';
import { Button, Input, Card } from '@/components/ui';
import { authApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-error';
import toast from 'react-hot-toast';

const resetSchema = z
  .object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetForm = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      toast.error('Invalid reset link');
      router.push('/auth/forgot-password');
    }
  }, [token, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
  });

  const onSubmit = async (data: ResetForm) => {
    if (!token) return;

    setIsLoading(true);
    try {
      await authApi.resetPassword(token, data.password);
      setIsSuccess(true);
      toast.success('Password reset successfully!');
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, 'Failed to reset password. The link may have expired.'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return null;
  }

  if (isSuccess) {
    return (
      <div className="min-h-[calc(100vh-180px)] flex items-center justify-center py-12 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card padding="lg" className="text-center">
            <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <HiOutlineCheck className="text-success-600" size={32} />
            </div>
            <h1 className="text-2xl font-semibold text-dark-900 mb-2">
              Password Reset Complete
            </h1>
            <p className="text-dark-500 mb-6">
              Your password has been successfully reset. You can now log in with
              your new password.
            </p>
            <Link href="/auth/login">
              <Button fullWidth size="lg">
                Go to Login
              </Button>
            </Link>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-180px)] flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card padding="lg" className="shadow-soft-lg">
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-block">
              <span className="text-2xl font-display font-bold text-primary-600">
                PRIMO
              </span>
            </Link>
            <h1 className="mt-4 text-2xl font-semibold text-dark-900">
              Set New Password
            </h1>
            <p className="mt-2 text-sm text-dark-500">
              Enter your new password below
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="New Password"
              type="password"
              placeholder="Enter new password"
              leftIcon={<HiOutlineLockClosed size={18} />}
              error={errors.password?.message}
              {...register('password')}
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="Confirm new password"
              leftIcon={<HiOutlineLockClosed size={18} />}
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            <Button
              type="submit"
              fullWidth
              size="lg"
              isLoading={isLoading}
              className="mt-6"
            >
              Reset Password
            </Button>
          </form>

          {/* Footer */}
          <p className="mt-6 text-center text-sm text-dark-500">
            Remember your password?{' '}
            <Link
              href="/auth/login"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Back to Login
            </Link>
          </p>
        </Card>
      </motion.div>
    </div>
  );
}

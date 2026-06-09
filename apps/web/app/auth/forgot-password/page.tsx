'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { HiOutlineMail, HiArrowLeft, HiCheck } from 'react-icons/hi';
import { Button, Input, Card } from '@/components/ui';
import { authApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-error';
import toast from 'react-hot-toast';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email'),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsLoading(true);
    try {
      await authApi.forgotPassword(data.email);
      setSubmittedEmail(data.email);
      setIsSubmitted(true);
      toast.success('Reset email sent!');
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, 'Failed to send reset email'));
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-[calc(100vh-180px)] flex items-center justify-center py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card padding="lg" className="shadow-soft-lg text-center">
            <div className="w-16 h-16 mx-auto bg-success-50 rounded-full flex items-center justify-center">
              <HiCheck className="w-8 h-8 text-success-500" />
            </div>
            <h1 className="mt-6 text-2xl font-semibold text-dark-900">
              Check your email
            </h1>
            <p className="mt-3 text-dark-500">
              We&apos;ve sent a password reset link to{' '}
              <span className="font-medium text-dark-700">{submittedEmail}</span>
            </p>
            <p className="mt-4 text-sm text-dark-400">
              Didn&apos;t receive the email? Check your spam folder or{' '}
              <button
                onClick={() => setIsSubmitted(false)}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                try again
              </button>
            </p>
            <Link href="/auth/login" className="block mt-8">
              <Button variant="secondary" fullWidth leftIcon={<HiArrowLeft size={16} />}>
                Back to Sign In
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
          {/* Back link */}
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 text-sm text-dark-500 hover:text-dark-700 mb-6"
          >
            <HiArrowLeft size={16} />
            Back to sign in
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-dark-900">
              Forgot password?
            </h1>
            <p className="mt-2 text-sm text-dark-500">
              No worries, we&apos;ll send you reset instructions.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="Enter your email"
              leftIcon={<HiOutlineMail size={18} />}
              error={errors.email?.message}
              {...register('email')}
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
        </Card>
      </motion.div>
    </div>
  );
}

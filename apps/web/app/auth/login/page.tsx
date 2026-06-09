'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { HiOutlineMail, HiOutlineLockClosed } from 'react-icons/hi';
import { FcGoogle } from 'react-icons/fc';
import { Button, Input, Card } from '@/components/ui';
import { authApi, setAccessToken } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { getApiErrorMessage } from '@/lib/api-error';
import toast from 'react-hot-toast';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const response = await authApi.login(data);
      setAccessToken(response.accessToken);
      setUser(response.user);
      toast.success('Welcome back!');

      // Redirect based on role
      if (response.user.role === 'super_admin' || response.user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/');
      }
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, 'Failed to login'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // In a real app, this would redirect to Google OAuth
    toast.error('Google login coming soon');
  };

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
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-dark-500">
              Sign in to continue shopping
            </p>
          </div>

          {/* Google Login */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-beige-300 rounded-lg text-dark-700 font-medium hover:bg-beige-50 transition-colors"
          >
            <FcGoogle size={20} />
            Continue with Google
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-beige-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="px-2 bg-white text-dark-400">
                or continue with email
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              leftIcon={<HiOutlineMail size={18} />}
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              leftIcon={<HiOutlineLockClosed size={18} />}
              error={errors.password?.message}
              {...register('password')}
            />

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-beige-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-dark-600">Remember me</span>
              </label>
              <Link
                href="/auth/forgot-password"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              fullWidth
              size="lg"
              isLoading={isLoading}
              className="mt-6"
            >
              Sign In
            </Button>
          </form>

          {/* Footer */}
          <p className="mt-6 text-center text-sm text-dark-500">
            Don&apos;t have an account?{' '}
            <Link
              href="/auth/register"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Sign up
            </Link>
          </p>
        </Card>

        {/* Demo credentials */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 p-4 bg-beige-100 rounded-xl text-center"
        >
          <p className="text-xs text-dark-500 font-medium mb-2">Demo Accounts:</p>
          <div className="space-y-1 text-xs text-dark-600">
            <p>Super Admin: admin@primo.com / admin123</p>
            <p>Staff: staff@primo.com / staff123</p>
            <p>User: user@primo.com / user123</p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

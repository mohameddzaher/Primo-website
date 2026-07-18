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
import { useAuthStore, syncWishlistWithServer } from '@/lib/store';
import { getApiErrorMessage } from '@/lib/api-error';
import { useT } from '@/lib/i18n';
import type { TranslationKey } from '@/lib/i18n';
import toast from 'react-hot-toast';

type Translate = (key: TranslationKey, vars?: Record<string, string | number>) => string;

// Built per-render so validation messages follow the active locale.
const buildLoginSchema = (t: Translate) =>
  z.object({
    email: z.string().email(t('shop.validation.emailInvalid')),
    password: z.string().min(1, t('shop.validation.passwordRequired')),
  });

type LoginForm = z.infer<ReturnType<typeof buildLoginSchema>>;

export default function LoginPage() {
  const router = useRouter();
  const t = useT();
  const { setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(buildLoginSchema(t)),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const response = await authApi.login(data);
      setAccessToken(response.accessToken);
      setUser(response.user);
      // Merge any guest wishlist into the account, then reload from server
      await syncWishlistWithServer();
      toast.success(t('auth.welcomeBack'));

      // Redirect based on role
      if (response.user.role === 'super_admin' || response.user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/');
      }
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, t('shop.toast.loginFailed')));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // In a real app, this would redirect to Google OAuth
    toast.error(t('shop.toast.googleSoon'));
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
              {t('auth.welcomeBack')}
            </h1>
            <p className="mt-2 text-sm text-dark-500">
              {t('shop.auth.loginSubtitle')}
            </p>
          </div>

          {/* Google Login */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-beige-300 rounded-lg text-dark-700 font-medium hover:bg-beige-50 transition-colors"
          >
            <FcGoogle size={20} />
            {t('shop.auth.continueGoogle')}
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-beige-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="px-2 bg-white text-dark-400">
                {t('shop.auth.orContinueEmail')}
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label={t('auth.email')}
              type="email"
              placeholder="you@example.com"
              leftIcon={<HiOutlineMail size={18} />}
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label={t('auth.password')}
              type="password"
              placeholder={t('shop.auth.passwordPlaceholder')}
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
                <span className="text-dark-600">{t('shop.auth.rememberMe')}</span>
              </label>
              <Link
                href="/auth/forgot-password"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                {t('auth.forgotPassword')}
              </Link>
            </div>

            <Button
              type="submit"
              fullWidth
              size="lg"
              isLoading={isLoading}
              className="mt-6"
            >
              {t('auth.signIn')}
            </Button>
          </form>

          {/* Footer */}
          <p className="mt-6 text-center text-sm text-dark-500">
            {t('auth.noAccount')}{' '}
            <Link
              href="/auth/register"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              {t('auth.signUp')}
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
          <p className="text-xs text-dark-500 font-medium mb-2">{t('shop.auth.demoAccounts')}</p>
          <div className="space-y-1 text-xs text-dark-600 ltr-nums">
            <p>Super Admin: admin@primo.com / admin123</p>
            <p>Staff: staff@primo.com / staff123</p>
            <p>User: user@primo.com / user123</p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

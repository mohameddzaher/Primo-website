'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import {
  HiOutlineMail,
  HiOutlineLockClosed,
  HiOutlineUser,
  HiOutlinePhone,
  HiOutlineTag,
  HiOutlineGift,
  HiOutlineCheck,
} from 'react-icons/hi';
import { FcGoogle } from 'react-icons/fc';
import { Button, Input, Card, Checkbox } from '@/components/ui';
import { authApi, setAccessToken, referralsApi } from '@/lib/api';
import { useAuthStore, syncWishlistWithServer } from '@/lib/store';
import { getApiErrorMessage } from '@/lib/api-error';
import { useT } from '@/lib/i18n';
import type { TranslationKey } from '@/lib/i18n';
import toast from 'react-hot-toast';

type Translate = (key: TranslationKey, vars?: Record<string, string | number>) => string;

// Built per-render so validation messages follow the active locale.
const buildRegisterSchema = (t: Translate) =>
  z
    .object({
      name: z.string().min(2, t('shop.validation.nameMin')),
      email: z.string().email(t('shop.validation.emailInvalid')),
      phone: z.string().optional(),
      password: z
        .string()
        .min(8, t('shop.validation.passwordMin'))
        .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
          t('shop.validation.passwordComplexity')
        ),
      confirmPassword: z.string(),
      referralCode: z.string().optional(),
      acceptTerms: z.boolean().refine((val) => val, {
        message: t('shop.validation.acceptTerms'),
      }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('shop.validation.passwordsMismatch'),
      path: ['confirmPassword'],
    });

type RegisterForm = z.infer<ReturnType<typeof buildRegisterSchema>>;

export default function RegisterPage() {
  const router = useRouter();
  const t = useT();
  const searchParams = useSearchParams();
  const { setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showReferralInput, setShowReferralInput] = useState(false);
  const [referralApplied, setReferralApplied] = useState(false);
  const [referralDiscount, setReferralDiscount] = useState<string | null>(null);

  // Get referral code from URL
  const refCode = searchParams.get('ref');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(buildRegisterSchema(t)),
    defaultValues: {
      acceptTerms: false,
      referralCode: refCode || '',
    },
  });

  const referralCode = watch('referralCode');

  // Apply referral code from URL on mount
  useEffect(() => {
    if (refCode) {
      setShowReferralInput(true);
      setReferralApplied(true);
      setReferralDiscount('SAR 100');
    }
  }, [refCode]);

  const handleApplyReferral = async () => {
    if (!referralCode) return;

    try {
      const result = await referralsApi.getReferralByCode(referralCode);
      if (result.valid) {
        setReferralApplied(true);
        setReferralDiscount('SAR 100');
        toast.success(t('shop.toast.referralApplied', { amount: 'SAR 100' }));
      } else {
        toast.error(t('shop.toast.invalidReferral'));
        setReferralApplied(false);
        setReferralDiscount(null);
      }
    } catch (error) {
      toast.error(t('shop.toast.invalidReferral'));
      setReferralApplied(false);
      setReferralDiscount(null);
    }
  };

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      const response = await authApi.register({
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone,
        referralCode: referralApplied ? data.referralCode : undefined,
      });
      setAccessToken(response.accessToken);
      setUser(response.user);
      // Merge any guest wishlist into the new account, then reload from server
      await syncWishlistWithServer();

      // If referral code was applied, show special message
      if (referralApplied) {
        toast.success(t('shop.toast.accountCreatedReferral', { amount: 'SAR 100' }));
      } else {
        toast.success(t('shop.toast.accountCreated'));
      }
      router.push('/');
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, t('shop.toast.registerFailed')));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleRegister = () => {
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
              {t('auth.signUp')}
            </h1>
            <p className="mt-2 text-sm text-dark-500">
              {t('shop.auth.registerSubtitle')}
            </p>
          </div>

          {/* Google Register */}
          <button
            type="button"
            onClick={handleGoogleRegister}
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
                {t('shop.auth.orRegisterEmail')}
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label={t('checkout.fullName')}
              placeholder={t('shop.placeholder.fullName')}
              leftIcon={<HiOutlineUser size={18} />}
              error={errors.name?.message}
              {...register('name')}
            />

            <Input
              label={t('auth.email')}
              type="email"
              placeholder="you@example.com"
              leftIcon={<HiOutlineMail size={18} />}
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label={t('shop.auth.phoneOptional')}
              type="tel"
              placeholder="+966 5X XXX XXXX"
              leftIcon={<HiOutlinePhone size={18} />}
              error={errors.phone?.message}
              {...register('phone')}
            />

            <Input
              label={t('auth.password')}
              type="password"
              placeholder={t('shop.auth.createPasswordPlaceholder')}
              leftIcon={<HiOutlineLockClosed size={18} />}
              error={errors.password?.message}
              {...register('password')}
            />

            <Input
              label={t('auth.confirmPassword')}
              type="password"
              placeholder={t('shop.auth.confirmPasswordPlaceholder')}
              leftIcon={<HiOutlineLockClosed size={18} />}
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            {/* Referral Code Section */}
            {referralApplied ? (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-green-50 border border-green-200 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <HiOutlineCheck className="text-green-600" size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-green-800">{t('shop.auth.referralApplied')}</p>
                    <p className="text-sm text-green-600">
                      {t('shop.auth.referralOff', { amount: referralDiscount || '' })}
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : showReferralInput ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder={t('shop.auth.referralPlaceholder')}
                    leftIcon={<HiOutlineTag size={18} />}
                    {...register('referralCode')}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleApplyReferral}
                    disabled={!referralCode}
                  >
                    {t('common.apply')}
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowReferralInput(true)}
                className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
              >
                <HiOutlineGift size={16} />
                {t('shop.auth.haveReferral')}
              </button>
            )}

            <div className="pt-2">
              <Checkbox
                label={
                  <span>
                    {t('shop.auth.agreePrefix')}{' '}
                    <Link
                      href="/terms"
                      className="text-primary-600 hover:text-primary-700"
                    >
                      {t('footer.terms')}
                    </Link>{' '}
                    {t('shop.auth.and')}{' '}
                    <Link
                      href="/privacy"
                      className="text-primary-600 hover:text-primary-700"
                    >
                      {t('footer.privacyPolicy')}
                    </Link>
                  </span>
                }
                {...register('acceptTerms')}
              />
              {errors.acceptTerms && (
                <p className="mt-1 text-sm text-error-500">
                  {errors.acceptTerms.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              fullWidth
              size="lg"
              isLoading={isLoading}
              className="mt-6"
            >
              {t('auth.signUp')}
            </Button>
          </form>

          {/* Footer */}
          <p className="mt-6 text-center text-sm text-dark-500">
            {t('auth.haveAccount')}{' '}
            <Link
              href="/auth/login"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              {t('auth.signIn')}
            </Link>
          </p>
        </Card>
      </motion.div>
    </div>
  );
}

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
import { useAuthStore } from '@/lib/store';
import { getApiErrorMessage } from '@/lib/api-error';
import toast from 'react-hot-toast';

const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email'),
    phone: z.string().optional(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain uppercase, lowercase, and a number'
      ),
    confirmPassword: z.string(),
    referralCode: z.string().optional(),
    acceptTerms: z.boolean().refine((val) => val, {
      message: 'You must accept the terms and conditions',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
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
    resolver: zodResolver(registerSchema),
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
      setReferralDiscount('EGP 100');
    }
  }, [refCode]);

  const handleApplyReferral = async () => {
    if (!referralCode) return;

    try {
      const result = await referralsApi.getReferralByCode(referralCode);
      if (result.valid) {
        setReferralApplied(true);
        setReferralDiscount('EGP 100');
        toast.success(`Referral code applied! You will get EGP 100 off your first order.`);
      } else {
        toast.error('Invalid referral code');
        setReferralApplied(false);
        setReferralDiscount(null);
      }
    } catch (error) {
      toast.error('Invalid referral code');
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

      // If referral code was applied, show special message
      if (referralApplied) {
        toast.success('Account created! EGP 100 discount has been added to your account.');
      } else {
        toast.success('Account created successfully!');
      }
      router.push('/');
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, 'Failed to create account'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleRegister = () => {
    toast.error('Google signup coming soon');
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
              Create an account
            </h1>
            <p className="mt-2 text-sm text-dark-500">
              Join PRIMO and start shopping
            </p>
          </div>

          {/* Google Register */}
          <button
            type="button"
            onClick={handleGoogleRegister}
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
                or register with email
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Full Name"
              placeholder="John Doe"
              leftIcon={<HiOutlineUser size={18} />}
              error={errors.name?.message}
              {...register('name')}
            />

            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              leftIcon={<HiOutlineMail size={18} />}
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Phone (Optional)"
              type="tel"
              placeholder="+20 123 456 7890"
              leftIcon={<HiOutlinePhone size={18} />}
              error={errors.phone?.message}
              {...register('phone')}
            />

            <Input
              label="Password"
              type="password"
              placeholder="Create a password"
              leftIcon={<HiOutlineLockClosed size={18} />}
              error={errors.password?.message}
              {...register('password')}
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="Confirm your password"
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
                    <p className="font-medium text-green-800">Referral Code Applied!</p>
                    <p className="text-sm text-green-600">
                      You will get {referralDiscount} off your first order
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : showReferralInput ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter referral code"
                    leftIcon={<HiOutlineTag size={18} />}
                    {...register('referralCode')}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleApplyReferral}
                    disabled={!referralCode}
                  >
                    Apply
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
                Have a referral code?
              </button>
            )}

            <div className="pt-2">
              <Checkbox
                label={
                  <span>
                    I agree to the{' '}
                    <Link
                      href="/terms"
                      className="text-primary-600 hover:text-primary-700"
                    >
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link
                      href="/privacy"
                      className="text-primary-600 hover:text-primary-700"
                    >
                      Privacy Policy
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
              Create Account
            </Button>
          </form>

          {/* Footer */}
          <p className="mt-6 text-center text-sm text-dark-500">
            Already have an account?{' '}
            <Link
              href="/auth/login"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Sign in
            </Link>
          </p>
        </Card>
      </motion.div>
    </div>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import {
  HiOutlineLocationMarker,
  HiOutlineCreditCard,
  HiOutlineCash,
  HiArrowLeft,
  HiCheck,
  HiOutlineTag,
  HiOutlineX,
  HiOutlineStar,
} from 'react-icons/hi';
import { FaApple } from 'react-icons/fa';
import { useCartStore, useAuthStore } from '@/lib/store';
import { ordersApi, userApi, cartApi } from '@/lib/api';
import {
  Button,
  Input,
  Textarea,
  Card,
  Badge,
} from '@/components/ui';
import { formatCurrency, getDiscountedPrice } from '@/lib/utils';
import { useSettings } from '@/lib/settings-context';
import { PaymentMethods } from '@/components/PaymentMethods';
import { getApiErrorMessage } from '@/lib/api-error';
import { useI18n } from '@/lib/i18n';
import type { TranslationKey } from '@/lib/i18n';
import toast from 'react-hot-toast';

type Translate = (key: TranslationKey, vars?: Record<string, string | number>) => string;

// Built per-render so validation messages follow the active locale.
const buildCheckoutSchema = (t: Translate) =>
  z.object({
    fullName: z.string().min(2, t('shop.validation.fullNameRequired')),
    email: z.string().email(t('shop.validation.emailInvalid')),
    phone: z.string().min(10, t('shop.validation.phoneInvalid')),
    fullAddress: z.string().min(10, t('shop.validation.addressIncomplete')),
    city: z.string().min(2, t('shop.validation.cityRequired')),
    area: z.string().min(2, t('shop.validation.areaRequired')),
    building: z.string().optional(),
    floor: z.string().optional(),
    apartment: z.string().optional(),
    landmark: z.string().optional(),
    notes: z.string().optional(),
    paymentMethod: z.enum(['cash_on_delivery', 'card', 'apple_pay']),
  });

type CheckoutForm = z.infer<ReturnType<typeof buildCheckoutSchema>>;

const paymentMethods = [
  {
    id: 'cash_on_delivery' as const,
    nameKey: 'checkout.cashOnDelivery' as TranslationKey,
    icon: HiOutlineCash,
    descriptionKey: 'shop.checkout.codDesc' as TranslationKey,
  },
  {
    id: 'card' as const,
    nameKey: 'checkout.card' as TranslationKey,
    icon: HiOutlineCreditCard,
    descriptionKey: 'shop.checkout.cardDesc' as TranslationKey,
  },
  {
    id: 'apple_pay' as const,
    nameKey: 'checkout.applePay' as TranslationKey,
    icon: FaApple,
    descriptionKey: 'shop.checkout.applePayDesc' as TranslationKey,
  },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { user, isAuthenticated } = useAuthStore();
  const { items, getSubtotal, discountCode, clearCart, setDiscount, clearDiscount, getDiscountAmount } = useCartStore();
  const discountAmount = getDiscountAmount();
  const { settings } = useSettings();
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [orderComplete, setOrderComplete] = useState<any>(null);
  const [promoCode, setPromoCode] = useState('');
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const hasSyncedCart = useRef(false);
  const [referralDiscount, setReferralDiscount] = useState(0);
  const [hasReferralDiscount, setHasReferralDiscount] = useState(false);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [loyaltyProgramEnabled, setLoyaltyProgramEnabled] = useState(false);
  const [pointsRedemptionRate, setPointsRedemptionRate] = useState(100);
  const [minPointsToRedeem, setMinPointsToRedeem] = useState(100);
  const [maxPointsPerOrder, setMaxPointsPerOrder] = useState(0);
  const [redeemPoints, setRedeemPoints] = useState(0);

  // Sync localStorage cart items to backend and fetch referral discount
  useEffect(() => {
    const syncCartToBackend = async () => {
      if (hasSyncedCart.current || items.length === 0) return;
      hasSyncedCart.current = true;

      try {
        for (const item of items) {
          try {
            await cartApi.addItem(item.productId, item.quantity);
          } catch (error) {
            // Item might already exist or product unavailable
          }
        }

        // Fetch cart from backend to get referral discount and loyalty info
        const cartData = await cartApi.get();
        if (cartData.hasReferralDiscount) {
          setHasReferralDiscount(true);
          setReferralDiscount(cartData.referralDiscount || 0);
        }
        if (cartData.loyaltyProgramEnabled) {
          setLoyaltyProgramEnabled(true);
          setLoyaltyPoints(cartData.loyaltyPoints || 0);
          setPointsRedemptionRate(cartData.pointsRedemptionRate || 100);
          setMinPointsToRedeem(cartData.minPointsToRedeem || 100);
          setMaxPointsPerOrder(cartData.maxPointsPerOrder || 0);
        }
      } catch (error) {
        console.error('Failed to sync cart:', error);
      }
    };

    syncCartToBackend();
  }, [items]);

  // Also check referral discount and loyalty on mount if cart already synced
  useEffect(() => {
    const checkCartExtras = async () => {
      if (!isAuthenticated) return;
      try {
        const cartData = await cartApi.get();
        if (cartData.hasReferralDiscount) {
          setHasReferralDiscount(true);
          setReferralDiscount(cartData.referralDiscount || 0);
        }
        if (cartData.loyaltyProgramEnabled) {
          setLoyaltyProgramEnabled(true);
          setLoyaltyPoints(cartData.loyaltyPoints || 0);
          setPointsRedemptionRate(cartData.pointsRedemptionRate || 100);
          setMinPointsToRedeem(cartData.minPointsToRedeem || 100);
          setMaxPointsPerOrder(cartData.maxPointsPerOrder || 0);
        }
      } catch (error) {
        // Ignore errors
      }
    };

    checkCartExtras();
  }, [isAuthenticated]);

  const subtotal = getSubtotal();
  const freeShippingThreshold = settings.freeShippingThreshold || 500;
  const shippingFee = settings.enableFreeShipping && subtotal >= freeShippingThreshold ? 0 : (settings.shippingFee || 50);
  const pointsDiscount = pointsRedemptionRate > 0 ? Math.floor(redeemPoints / pointsRedemptionRate) : 0;
  const totalDiscount = discountAmount + referralDiscount + pointsDiscount;
  const taxableAmount = Math.max(0, subtotal - totalDiscount);
  const taxRate = settings.enableTax ? (settings.taxRate || 0) : 0;
  const taxAmount = taxRate > 0 ? Math.round((taxableAmount * taxRate) / 100 * 100) / 100 : 0;
  const finalTotal = Math.max(0, subtotal - totalDiscount + shippingFee + taxAmount);

  // BNPL (tabby / tamara) messaging — DISPLAY ONLY, pending gateway integration.
  // No BNPL provider is wired up yet, so this is informational copy and is
  // deliberately not offered as a selectable payment method. Does not affect
  // any pricing math.
  const bnplInstallment = Math.round((finalTotal / 4) * 100) / 100;

  // Calculate max redeemable points
  const maxRedeemableByBalance = loyaltyPoints;
  const maxRedeemableByOrder = maxPointsPerOrder > 0 ? maxPointsPerOrder : Infinity;
  const maxRedeemableBySubtotal = Math.floor(subtotal * pointsRedemptionRate); // Can't discount more than subtotal
  const maxRedeemable = Math.min(maxRedeemableByBalance, maxRedeemableByOrder, maxRedeemableBySubtotal);
  const canRedeemPoints = loyaltyProgramEnabled && isAuthenticated && loyaltyPoints >= minPointsToRedeem;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CheckoutForm>({
    resolver: zodResolver(buildCheckoutSchema(t)),
    defaultValues: {
      paymentMethod: 'cash_on_delivery',
    },
  });

  // Load user profile and addresses
  useEffect(() => {
    const loadUserData = async () => {
      if (isAuthenticated && user) {
        // Pre-fill from user data
        if (user.name) setValue('fullName', user.name);
        if (user.email) setValue('email', user.email);
        if (user.phone) setValue('phone', user.phone);

        // Try to get user's saved addresses
        try {
          const addresses = await userApi.getAddresses();
          setSavedAddresses(addresses || []);

          // If there's a default address, pre-fill it
          const defaultAddress = addresses?.find((a: any) => a.isDefault);
          if (defaultAddress) {
            fillAddressForm(defaultAddress);
            setSelectedAddressId(defaultAddress._id);
          }
        } catch {
          // Addresses might not be set up yet
        }
      }
    };

    loadUserData();
  }, [isAuthenticated, user, setValue]);

  const fillAddressForm = (address: any) => {
    setValue('fullAddress', address.fullAddress || '');
    setValue('city', address.city || '');
    setValue('area', address.area || '');
    setValue('building', address.building || '');
    setValue('floor', address.floor || '');
    setValue('apartment', address.apartment || '');
    setValue('landmark', address.landmark || '');
  };

  const selectedPayment = watch('paymentMethod');

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error(t('shop.toast.geoUnsupported'));
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const mockAddress = `Location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          setValue('fullAddress', mockAddress);
          setValue('city', 'Riyadh');
          setValue('area', 'Al Olaya');
          toast.success(t('shop.toast.locationDetected'));
        } catch (error) {
          toast.error(getApiErrorMessage(error, t('shop.toast.addressFailed')));
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        setIsLocating(false);
        toast.error(getApiErrorMessage(error, t('shop.toast.locationFailed')));
      }
    );
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setIsApplyingPromo(true);
    try {
      const result = await cartApi.applyDiscount(promoCode);
      const discountVal = result.discountAmount || 0;
      setDiscount(promoCode.toUpperCase(), discountVal, result.discountType, result.discountValue, result.maxDiscount);
      toast.success(t('shop.toast.promoApplied'));
      setPromoCode('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('shop.toast.invalidPromo'));
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const handleRemovePromo = async () => {
    try {
      await cartApi.removeDiscount();
      clearDiscount();
      toast.success(t('shop.toast.promoRemoved'));
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('shop.toast.promoRemoveFailed')));
    }
  };

  const onSubmit = async (data: CheckoutForm) => {
    if (items.length === 0) {
      toast.error(t('cart.empty'));
      return;
    }

    setIsLoading(true);
    try {
      const orderData = {
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          // Forward the chosen option so the server prices and reserves stock
          // against that exact variant rather than the product default.
          ...(item.variantId ? { variantId: item.variantId } : {}),
        })),
        shippingAddress: {
          fullName: data.fullName,
          phone: data.phone,
          email: data.email,
          fullAddress: data.fullAddress,
          city: data.city,
          area: data.area,
          building: data.building,
          floor: data.floor,
          apartment: data.apartment,
          landmark: data.landmark,
        },
        paymentMethod: data.paymentMethod,
        discountCode: discountCode || undefined,
        redeemPoints: redeemPoints > 0 ? redeemPoints : undefined,
        notes: data.notes,
      };

      const order = await ordersApi.create(orderData);
      setOrderComplete(order);

      // Clear both backend and local cart
      try {
        await cartApi.clear();
      } catch (error) {
        // Backend cart might already be cleared by order creation
      }
      clearCart();
      toast.success(t('checkout.orderPlaced'));
    } catch (error: any) {
      console.error('Order error:', error.response?.data);
      toast.error(getApiErrorMessage(error, t('shop.toast.orderFailed')));
    } finally {
      setIsLoading(false);
    }
  };

  // Order Complete Screen
  if (orderComplete) {
    return (
      <div className="min-h-screen bg-beige-50 flex items-center justify-center py-12 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg w-full"
        >
          <Card padding="lg" className="text-center">
            <div className="w-20 h-20 mx-auto bg-success-50 rounded-full flex items-center justify-center">
              <HiCheck className="w-10 h-10 text-success-500" />
            </div>
            <h1 className="mt-6 text-2xl font-semibold text-dark-900">
              {t('shop.checkout.orderConfirmed')}
            </h1>
            <p className="mt-2 text-dark-500">
              {t('shop.checkout.orderThanks')}
            </p>

            <div className="mt-6 p-4 bg-beige-50 rounded-lg text-start">
              <div className="flex justify-between text-sm">
                <span className="text-dark-500">{t('order.orderNumber')}</span>
                <span className="font-mono font-medium ltr-nums">{orderComplete.orderNumber}</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-dark-500">{t('cart.total')}</span>
                <span className="font-semibold ltr-nums">{formatCurrency(orderComplete.total)}</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-dark-500">{t('shop.checkout.payment')}</span>
                <Badge variant={orderComplete.paymentMethod === 'cash_on_delivery' ? 'warning' : 'success'}>
                  {orderComplete.paymentMethod === 'cash_on_delivery'
                    ? t('checkout.cashOnDelivery')
                    : t('shop.checkout.paid')}
                </Badge>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <Link href={`/account/orders/${orderComplete.orderNumber}`}>
                <Button fullWidth>{t('shop.checkout.viewOrderDetails')}</Button>
              </Link>
              <Link href="/products">
                <Button variant="secondary" fullWidth>
                  {t('common.continueShopping')}
                </Button>
              </Link>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Empty Cart
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-beige-50 flex items-center justify-center py-12 px-4">
        <Card padding="lg" className="text-center max-w-md">
          <h1 className="text-xl font-semibold text-dark-900">{t('cart.empty')}</h1>
          <p className="mt-2 text-dark-500">{t('shop.checkout.emptyHint')}</p>
          <Link href="/products">
            <Button className="mt-4">{t('shop.browseProducts')}</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-beige-50">
      <div className="container-custom py-8">
        <Link
          href="/cart"
          className="inline-flex items-center gap-2 text-sm text-dark-500 hover:text-dark-700 mb-6"
        >
          <HiArrowLeft className="rtl-flip" size={16} />
          {t('shop.checkout.backToCart')}
        </Link>

        <h1 className="text-2xl font-display font-semibold text-dark-900 mb-8">
          {t('checkout.title')}
        </h1>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Contact Info */}
              <Card padding="md">
                <h2 className="font-semibold text-dark-900 mb-4">
                  {t('shop.checkout.contactInfo')}
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    label={t('checkout.fullName')}
                    placeholder={t('shop.placeholder.fullName')}
                    error={errors.fullName?.message}
                    {...register('fullName')}
                  />
                  <Input
                    label={t('checkout.phone')}
                    type="tel"
                    placeholder="+966 5X XXX XXXX"
                    error={errors.phone?.message}
                    {...register('phone')}
                  />
                  <Input
                    label={t('checkout.email')}
                    type="email"
                    placeholder="you@example.com"
                    className="md:col-span-2"
                    error={errors.email?.message}
                    {...register('email')}
                  />
                </div>
              </Card>

              {/* Saved Addresses */}
              {savedAddresses.length > 0 && (
                <Card padding="md">
                  <h2 className="font-semibold text-dark-900 mb-4">
                    {t('shop.checkout.savedAddresses')}
                  </h2>
                  <div className="grid md:grid-cols-2 gap-3">
                    {savedAddresses.map((address: any) => (
                      <button
                        key={address._id}
                        type="button"
                        onClick={() => {
                          fillAddressForm(address);
                          setSelectedAddressId(address._id);
                        }}
                        className={`p-4 text-start rounded-lg border-2 transition-all ${
                          selectedAddressId === address._id
                            ? 'border-primary-600 bg-primary-50'
                            : 'border-beige-200 hover:border-beige-300'
                        }`}
                      >
                        <p className="font-medium text-dark-900">{address.label}</p>
                        <p className="text-sm text-dark-500 mt-1 line-clamp-2">
                          {address.fullAddress}
                        </p>
                        <p className="text-sm text-dark-400">
                          {address.area}, {address.city}
                        </p>
                      </button>
                    ))}
                  </div>
                </Card>
              )}

              {/* Shipping Address */}
              <Card padding="md">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-dark-900">{t('checkout.shippingAddress')}</h2>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    leftIcon={<HiOutlineLocationMarker size={16} />}
                    onClick={handleGetLocation}
                    isLoading={isLocating}
                  >
                    {t('shop.checkout.useMyLocation')}
                  </Button>
                </div>
                <div className="space-y-4">
                  <Textarea
                    label={t('shop.checkout.fullAddress')}
                    placeholder={t('shop.placeholder.address')}
                    rows={2}
                    error={errors.fullAddress?.message}
                    {...register('fullAddress')}
                  />
                  <div className="grid md:grid-cols-2 gap-4">
                    <Input
                      label={t('checkout.city')}
                      placeholder={t('shop.placeholder.city')}
                      error={errors.city?.message}
                      {...register('city')}
                    />
                    <Input
                      label={t('checkout.area')}
                      placeholder={t('shop.placeholder.area')}
                      error={errors.area?.message}
                      {...register('area')}
                    />
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <Input
                      label={t('shop.checkout.building')}
                      placeholder="12A"
                      {...register('building')}
                    />
                    <Input
                      label={t('shop.checkout.floor')}
                      placeholder="3"
                      {...register('floor')}
                    />
                    <Input
                      label={t('shop.checkout.apartment')}
                      placeholder="15"
                      {...register('apartment')}
                    />
                  </div>
                  <Input
                    label={t('shop.checkout.landmark')}
                    placeholder={t('shop.placeholder.landmark')}
                    {...register('landmark')}
                  />
                </div>
              </Card>

              {/* Payment Method */}
              <Card padding="md">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <h2 className="font-semibold text-dark-900">{t('checkout.paymentMethod')}</h2>
                  <PaymentMethods
                    includeCOD={settings.enableCOD}
                    label={t('checkout.acceptedPayments')}
                    labelClassName="text-dark-400"
                  />
                </div>
                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <label
                      key={method.id}
                      className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedPayment === method.id
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-beige-200 hover:border-beige-300'
                      }`}
                    >
                      <input
                        type="radio"
                        value={method.id}
                        {...register('paymentMethod')}
                        className="sr-only"
                      />
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          selectedPayment === method.id
                            ? 'bg-primary-600 text-white'
                            : 'bg-beige-100 text-dark-500'
                        }`}
                      >
                        <method.icon size={20} />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-dark-900">{t(method.nameKey)}</p>
                        <p className="text-sm text-dark-500">{t(method.descriptionKey)}</p>
                      </div>
                      {selectedPayment === method.id && (
                        <HiCheck className="text-primary-600" size={20} />
                      )}
                    </label>
                  ))}
                </div>
                {(selectedPayment === 'card' || selectedPayment === 'apple_pay') && (
                  <p className="mt-4 p-3 bg-warning-50 rounded-lg text-sm text-warning-700">
                    {t('shop.checkout.onlinePaymentNote')}
                  </p>
                )}
              </Card>

              {/* Notes */}
              <Card padding="md">
                <h2 className="font-semibold text-dark-900 mb-4">
                  {t('shop.checkout.orderNotesOptional')}
                </h2>
                <Textarea
                  placeholder={t('shop.placeholder.orderNotes')}
                  rows={3}
                  {...register('notes')}
                />
              </Card>
            </div>

            {/* Order Summary */}
            <div>
              <Card padding="md" className="sticky top-24">
                <h2 className="font-semibold text-dark-900 mb-4">{t('cart.orderSummary')}</h2>

                {/* Items */}
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {items.map((item) => {
                    const price = item.product.discount
                      ? getDiscountedPrice(item.product.price, item.product.discount)
                      : item.product.price;

                    return (
                      <div key={item.productId} className="flex gap-3">
                        <div className="relative w-16 h-16 bg-beige-100 rounded-lg overflow-hidden flex-shrink-0">
                          {item.product.images?.[0]?.url && (
                            <Image
                              src={item.product.images[0].url}
                              alt={item.product.title}
                              fill
                              className="object-cover"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-dark-900 line-clamp-1">
                            {item.product.title}
                          </p>
                          <p className="text-sm text-dark-500">
                            {t('shop.checkout.qty', { count: item.quantity })}
                          </p>
                          <p className="text-sm font-semibold ltr-nums">
                            {formatCurrency(price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Promo Code */}
                <div className="mt-4 pt-4 border-t border-beige-200">
                  {discountCode ? (
                    <div className="flex items-center justify-between p-3 bg-success-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <HiOutlineTag className="text-success-600" />
                        <span className="text-success-700 font-medium">
                          {discountCode}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemovePromo}
                        className="text-dark-400 hover:text-dark-600"
                        title={t('shop.a11y.removePromo')}
                        aria-label={t('shop.a11y.removePromo')}
                      >
                        <HiOutlineX size={18} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        placeholder={t('cart.discountCode')}
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleApplyPromo}
                        isLoading={isApplyingPromo}
                      >
                        {t('common.apply')}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Loyalty Points Redemption */}
                {canRedeemPoints && (
                  <div className="mt-4 pt-4 border-t border-beige-200">
                    <div className="flex items-center gap-2 mb-3">
                      <HiOutlineStar className="text-primary-600" size={18} />
                      <span className="text-sm font-medium text-dark-900">{t('shop.checkout.useLoyaltyPoints')}</span>
                    </div>
                    <div className="p-3 bg-primary-50 rounded-lg space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-primary-700">{t('shop.checkout.availablePoints')}</span>
                        <span className="font-semibold text-primary-900 ltr-nums">{loyaltyPoints.toLocaleString()}</span>
                      </div>
                      <div>
                        <input
                          type="range"
                          min={0}
                          max={maxRedeemable}
                          step={pointsRedemptionRate}
                          value={redeemPoints}
                          onChange={(e) => setRedeemPoints(Number(e.target.value))}
                          className="w-full accent-primary-600"
                          aria-label={t('shop.a11y.pointsToRedeem')}
                        />
                        <div className="flex justify-between text-xs text-primary-600 mt-1 ltr-nums">
                          <span>0</span>
                          <span>{maxRedeemable.toLocaleString()} {t('shop.checkout.pts')}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          max={maxRedeemable}
                          step={pointsRedemptionRate}
                          value={redeemPoints}
                          onChange={(e) => {
                            const val = Math.min(Number(e.target.value) || 0, maxRedeemable);
                            setRedeemPoints(Math.max(0, val));
                          }}
                          className="w-24 px-2 py-1 text-sm border border-primary-200 rounded bg-white text-center"
                          aria-label={t('shop.a11y.pointsNumber')}
                        />
                        <span className="text-sm text-primary-700">{t('shop.checkout.points')}</span>
                        <span className="text-sm text-primary-600 ms-auto font-medium">
                          {t('shop.checkout.pointsOff', { amount: formatCurrency(pointsDiscount) })}
                        </span>
                      </div>
                      {redeemPoints > 0 && (
                        <button
                          type="button"
                          onClick={() => setRedeemPoints(0)}
                          className="text-xs text-primary-600 hover:text-primary-700 underline"
                        >
                          {t('shop.checkout.removePoints')}
                        </button>
                      )}
                      <p className="text-xs text-primary-500">
                        {t('shop.checkout.pointsRate', {
                          rate: pointsRedemptionRate,
                          amount: formatCurrency(1),
                        })}
                      </p>
                    </div>
                  </div>
                )}

                {/* Show points info for users who don't have enough */}
                {loyaltyProgramEnabled && isAuthenticated && loyaltyPoints > 0 && loyaltyPoints < minPointsToRedeem && (
                  <div className="mt-4 pt-4 border-t border-beige-200">
                    <div className="p-3 bg-beige-50 rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-dark-500">
                        <HiOutlineStar size={16} />
                        <span>
                          {t('shop.checkout.pointsMinNotice', {
                            points: loyaltyPoints,
                            min: minPointsToRedeem,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Price Breakdown */}
                <div className="mt-4 pt-4 border-t border-beige-200 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-dark-500">{t('cart.subtotal')}</span>
                    <span className="ltr-nums">{formatCurrency(subtotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-success-600">
                      <span>{t('shop.checkout.promoDiscount')}</span>
                      <span className="ltr-nums">-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                  {hasReferralDiscount && referralDiscount > 0 && (
                    <div className="flex justify-between text-sm text-success-600">
                      <span className="flex items-center gap-1">
                        {t('shop.checkout.referralBonus')}
                        <span className="text-xs bg-success-100 px-1.5 py-0.5 rounded text-success-700">
                          {t('shop.checkout.firstOrder')}
                        </span>
                      </span>
                      <span className="ltr-nums">-{formatCurrency(referralDiscount)}</span>
                    </div>
                  )}
                  {pointsDiscount > 0 && (
                    <div className="flex justify-between text-sm text-success-600">
                      <span className="flex items-center gap-1">
                        <HiOutlineStar size={14} />
                        {t('shop.checkout.pointsDiscount', { count: redeemPoints.toLocaleString() })}
                      </span>
                      <span className="ltr-nums">-{formatCurrency(pointsDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-dark-500">{t('cart.shipping')}</span>
                    <span className="ltr-nums">
                      {shippingFee === 0 ? (
                        <span className="text-success-600">{t('common.free')}</span>
                      ) : (
                        formatCurrency(shippingFee)
                      )}
                    </span>
                  </div>
                  {shippingFee > 0 && settings.enableFreeShipping && (
                    <p className="text-xs text-dark-400">
                      {t('cart.freeShippingOver', {
                        amount: `${settings.currency} ${freeShippingThreshold.toLocaleString()}`,
                      })}
                    </p>
                  )}
                  {taxAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-dark-500">
                        {settings.taxLabel || 'VAT'} <span className="ltr-nums">({taxRate}%)</span>
                      </span>
                      <span className="ltr-nums">{formatCurrency(taxAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-beige-200">
                    <span className="font-semibold">{t('cart.total')}</span>
                    <span className="text-lg font-bold ltr-nums">{formatCurrency(finalTotal)}</span>
                  </div>
                  {taxAmount > 0 && (
                    <p className="text-xs text-dark-400">
                      {t('cart.inclusiveOfVat', {
                        label: settings.taxLabel || 'VAT',
                        rate: taxRate,
                        amount: formatCurrency(taxAmount),
                      })}
                    </p>
                  )}

                  {/* BNPL messaging — informational only, no gateway integrated */}
                  {finalTotal > 0 && (
                    <div className="mt-3 rounded-lg border border-beige-200 bg-beige-50 px-3 py-2">
                      <p className="text-xs text-dark-600 leading-relaxed">
                        {t('shop.checkout.bnplPrefix')}{' '}
                        <span className="font-semibold text-dark-900 ltr-nums">
                          {settings.currency} {bnplInstallment.toFixed(2)}
                        </span>{' '}
                        {t('shop.checkout.bnplWith')}{' '}
                        <span className="font-semibold text-dark-900">tabby</span>
                        {' / '}
                        <span className="font-semibold text-dark-900">tamara</span>
                      </p>
                      <p className="mt-1 text-[10px] text-dark-400">
                        {t('shop.checkout.bnplSoon')}
                      </p>
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  fullWidth
                  size="lg"
                  isLoading={isLoading}
                  className="mt-6"
                >
                  {t('checkout.placeOrder')}
                </Button>

                <p className="mt-4 text-xs text-center text-dark-500">
                  {t('shop.checkout.termsNotice')}
                </p>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

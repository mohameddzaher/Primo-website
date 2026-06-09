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
import { getApiErrorMessage } from '@/lib/api-error';
import toast from 'react-hot-toast';

const checkoutSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  fullAddress: z.string().min(10, 'Please enter a complete address'),
  city: z.string().min(2, 'City is required'),
  area: z.string().min(2, 'Area is required'),
  building: z.string().optional(),
  floor: z.string().optional(),
  apartment: z.string().optional(),
  landmark: z.string().optional(),
  notes: z.string().optional(),
  paymentMethod: z.enum(['cash_on_delivery', 'card', 'apple_pay']),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

const paymentMethods = [
  {
    id: 'cash_on_delivery' as const,
    name: 'Cash on Delivery',
    icon: HiOutlineCash,
    description: 'Pay when you receive your order',
  },
  {
    id: 'card' as const,
    name: 'Credit/Debit Card',
    icon: HiOutlineCreditCard,
    description: 'Secure payment via Paymob',
  },
  {
    id: 'apple_pay' as const,
    name: 'Apple Pay',
    icon: FaApple,
    description: 'Quick payment with Apple Pay',
  },
];

export default function CheckoutPage() {
  const router = useRouter();
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
    resolver: zodResolver(checkoutSchema),
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
      toast.error('Geolocation is not supported');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const mockAddress = `Location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          setValue('fullAddress', mockAddress);
          setValue('city', 'Cairo');
          setValue('area', 'New Cairo');
          toast.success('Location detected!');
        } catch (error) {
          toast.error(getApiErrorMessage(error, 'Failed to get address'));
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        setIsLocating(false);
        toast.error(getApiErrorMessage(error, 'Failed to get location'));
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
      toast.success('Promo code applied!');
      setPromoCode('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Invalid promo code');
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const handleRemovePromo = async () => {
    try {
      await cartApi.removeDiscount();
      clearDiscount();
      toast.success('Promo code removed');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to remove promo code'));
    }
  };

  const onSubmit = async (data: CheckoutForm) => {
    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setIsLoading(true);
    try {
      const orderData = {
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
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
      toast.success('Order placed successfully!');
    } catch (error: any) {
      console.error('Order error:', error.response?.data);
      toast.error(getApiErrorMessage(error, 'Failed to place order'));
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
              Order Confirmed!
            </h1>
            <p className="mt-2 text-dark-500">
              Thank you for your order. We&apos;ll send you a confirmation email shortly.
            </p>

            <div className="mt-6 p-4 bg-beige-50 rounded-lg text-left">
              <div className="flex justify-between text-sm">
                <span className="text-dark-500">Order ID</span>
                <span className="font-mono font-medium">{orderComplete.orderNumber}</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-dark-500">Total</span>
                <span className="font-semibold">{formatCurrency(orderComplete.total)}</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-dark-500">Payment</span>
                <Badge variant={orderComplete.paymentMethod === 'cash_on_delivery' ? 'warning' : 'success'}>
                  {orderComplete.paymentMethod === 'cash_on_delivery' ? 'Pay on Delivery' : 'Paid'}
                </Badge>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <Link href={`/account/orders/${orderComplete.orderNumber}`}>
                <Button fullWidth>View Order Details</Button>
              </Link>
              <Link href="/products">
                <Button variant="secondary" fullWidth>
                  Continue Shopping
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
          <h1 className="text-xl font-semibold text-dark-900">Your cart is empty</h1>
          <p className="mt-2 text-dark-500">Add some products before checkout</p>
          <Link href="/products">
            <Button className="mt-4">Browse Products</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-beige-50">
      <div className="container-custom py-8">
        <Link
          href="/account/cart"
          className="inline-flex items-center gap-2 text-sm text-dark-500 hover:text-dark-700 mb-6"
        >
          <HiArrowLeft size={16} />
          Back to Cart
        </Link>

        <h1 className="text-2xl font-display font-semibold text-dark-900 mb-8">
          Checkout
        </h1>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Contact Info */}
              <Card padding="md">
                <h2 className="font-semibold text-dark-900 mb-4">
                  Contact Information
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    placeholder="John Doe"
                    error={errors.fullName?.message}
                    {...register('fullName')}
                  />
                  <Input
                    label="Phone Number"
                    type="tel"
                    placeholder="+20 123 456 7890"
                    error={errors.phone?.message}
                    {...register('phone')}
                  />
                  <Input
                    label="Email"
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
                    Saved Addresses
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
                        className={`p-4 text-left rounded-lg border-2 transition-all ${
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
                  <h2 className="font-semibold text-dark-900">Shipping Address</h2>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    leftIcon={<HiOutlineLocationMarker size={16} />}
                    onClick={handleGetLocation}
                    isLoading={isLocating}
                  >
                    Use My Location
                  </Button>
                </div>
                <div className="space-y-4">
                  <Textarea
                    label="Full Address"
                    placeholder="Street address, building number..."
                    rows={2}
                    error={errors.fullAddress?.message}
                    {...register('fullAddress')}
                  />
                  <div className="grid md:grid-cols-2 gap-4">
                    <Input
                      label="City"
                      placeholder="Cairo"
                      error={errors.city?.message}
                      {...register('city')}
                    />
                    <Input
                      label="Area"
                      placeholder="Nasr City"
                      error={errors.area?.message}
                      {...register('area')}
                    />
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <Input
                      label="Building (Optional)"
                      placeholder="12A"
                      {...register('building')}
                    />
                    <Input
                      label="Floor (Optional)"
                      placeholder="3"
                      {...register('floor')}
                    />
                    <Input
                      label="Apartment (Optional)"
                      placeholder="15"
                      {...register('apartment')}
                    />
                  </div>
                  <Input
                    label="Landmark (Optional)"
                    placeholder="Near the mall..."
                    {...register('landmark')}
                  />
                </div>
              </Card>

              {/* Payment Method */}
              <Card padding="md">
                <h2 className="font-semibold text-dark-900 mb-4">Payment Method</h2>
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
                        <p className="font-medium text-dark-900">{method.name}</p>
                        <p className="text-sm text-dark-500">{method.description}</p>
                      </div>
                      {selectedPayment === method.id && (
                        <HiCheck className="text-primary-600" size={20} />
                      )}
                    </label>
                  ))}
                </div>
                {(selectedPayment === 'card' || selectedPayment === 'apple_pay') && (
                  <p className="mt-4 p-3 bg-warning-50 rounded-lg text-sm text-warning-700">
                    Note: Online payment will be processed after order confirmation.
                  </p>
                )}
              </Card>

              {/* Notes */}
              <Card padding="md">
                <h2 className="font-semibold text-dark-900 mb-4">
                  Order Notes (Optional)
                </h2>
                <Textarea
                  placeholder="Any special instructions for delivery..."
                  rows={3}
                  {...register('notes')}
                />
              </Card>
            </div>

            {/* Order Summary */}
            <div>
              <Card padding="md" className="sticky top-24">
                <h2 className="font-semibold text-dark-900 mb-4">Order Summary</h2>

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
                            Qty: {item.quantity}
                          </p>
                          <p className="text-sm font-semibold">
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
                        title="Remove promo code"
                        aria-label="Remove promo code"
                      >
                        <HiOutlineX size={18} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Promo code"
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
                        Apply
                      </Button>
                    </div>
                  )}
                </div>

                {/* Loyalty Points Redemption */}
                {canRedeemPoints && (
                  <div className="mt-4 pt-4 border-t border-beige-200">
                    <div className="flex items-center gap-2 mb-3">
                      <HiOutlineStar className="text-primary-600" size={18} />
                      <span className="text-sm font-medium text-dark-900">Use Loyalty Points</span>
                    </div>
                    <div className="p-3 bg-primary-50 rounded-lg space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-primary-700">Available Points</span>
                        <span className="font-semibold text-primary-900">{loyaltyPoints.toLocaleString()}</span>
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
                          aria-label="Points to redeem"
                        />
                        <div className="flex justify-between text-xs text-primary-600 mt-1">
                          <span>0</span>
                          <span>{maxRedeemable.toLocaleString()} pts</span>
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
                          aria-label="Number of points to redeem"
                        />
                        <span className="text-sm text-primary-700">points</span>
                        <span className="text-sm text-primary-600 ml-auto font-medium">
                          = {formatCurrency(pointsDiscount)} off
                        </span>
                      </div>
                      {redeemPoints > 0 && (
                        <button
                          type="button"
                          onClick={() => setRedeemPoints(0)}
                          className="text-xs text-primary-600 hover:text-primary-700 underline"
                        >
                          Remove points
                        </button>
                      )}
                      <p className="text-xs text-primary-500">
                        {pointsRedemptionRate} points = {formatCurrency(1)} discount
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
                        <span>You have <strong>{loyaltyPoints}</strong> points. Minimum {minPointsToRedeem} needed to redeem.</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Price Breakdown */}
                <div className="mt-4 pt-4 border-t border-beige-200 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-dark-500">Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-success-600">
                      <span>Promo Discount</span>
                      <span>-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                  {hasReferralDiscount && referralDiscount > 0 && (
                    <div className="flex justify-between text-sm text-success-600">
                      <span className="flex items-center gap-1">
                        Referral Bonus
                        <span className="text-xs bg-success-100 px-1.5 py-0.5 rounded text-success-700">
                          First Order
                        </span>
                      </span>
                      <span>-{formatCurrency(referralDiscount)}</span>
                    </div>
                  )}
                  {pointsDiscount > 0 && (
                    <div className="flex justify-between text-sm text-success-600">
                      <span className="flex items-center gap-1">
                        <HiOutlineStar size={14} />
                        Points Discount ({redeemPoints.toLocaleString()} pts)
                      </span>
                      <span>-{formatCurrency(pointsDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-dark-500">Shipping</span>
                    <span>
                      {shippingFee === 0 ? (
                        <span className="text-success-600">Free</span>
                      ) : (
                        formatCurrency(shippingFee)
                      )}
                    </span>
                  </div>
                  {shippingFee > 0 && settings.enableFreeShipping && (
                    <p className="text-xs text-dark-400">
                      Free shipping on orders over {settings.currency} {freeShippingThreshold.toLocaleString()}
                    </p>
                  )}
                  {taxAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-dark-500">
                        {settings.taxLabel || 'VAT'} ({taxRate}%)
                      </span>
                      <span>{formatCurrency(taxAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-beige-200">
                    <span className="font-semibold">Total</span>
                    <span className="text-lg font-bold">{formatCurrency(finalTotal)}</span>
                  </div>
                  {taxAmount > 0 && (
                    <p className="text-xs text-dark-400">
                      Inclusive of {settings.taxLabel || 'VAT'} ({taxRate}%): {formatCurrency(taxAmount)}
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
                  Place Order
                </Button>

                <p className="mt-4 text-xs text-center text-dark-500">
                  By placing your order, you agree to our Terms of Service
                </p>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

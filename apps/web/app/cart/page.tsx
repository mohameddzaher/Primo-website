'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  HiOutlineShoppingCart,
  HiOutlineTrash,
  HiPlus,
  HiMinus,
  HiOutlineTag,
} from 'react-icons/hi';
import { Button, Input, Card, Spinner } from '@/components/ui';
import { useCartStore } from '@/lib/store';
import { cartApi } from '@/lib/api';
import { useSettings } from '@/lib/settings-context';
import { formatCurrency } from '@/lib/utils';
import { useT } from '@/lib/i18n';
import toast from 'react-hot-toast';

export default function CartPage() {
  const router = useRouter();
  const t = useT();
  const { settings } = useSettings();
  const { items, updateQuantity, removeItem, clearCart, discountCode: appliedCode, setDiscount, clearDiscount, getDiscountAmount } =
    useCartStore();
  const discountAmount = getDiscountAmount();
  const [discountCodeInput, setDiscountCodeInput] = useState('');
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const hasSynced = useRef(false);

  useEffect(() => {
    const syncCartToBackend = async () => {
      if (hasSynced.current || items.length === 0) return;
      hasSynced.current = true;
      setIsSyncing(true);
      try {
        const validItems = items
          .filter(item => item.productId && typeof item.productId === 'string' && item.productId.length >= 10 && item.quantity >= 1)
          .map(item => ({ productId: item.productId, quantity: item.quantity }));
        if (validItems.length > 0) {
          await cartApi.sync(validItems);
        }
      } catch (error) {
        console.error('Failed to sync cart:', error);
      } finally {
        setIsSyncing(false);
      }
    };
    syncCartToBackend();
  }, [items]);

  const subtotal = items.reduce((sum, item) => {
    const basePrice = item.product?.price || 0;
    const discount = item.product?.discount || 0;
    const price = discount > 0 ? basePrice * (1 - discount / 100) : basePrice;
    return sum + (price * (item.quantity || 0));
  }, 0);
  // Mirror the checkout totals exactly so the figures never diverge between the
  // cart and checkout. All shipping/tax behaviour is driven by admin settings.
  const freeShippingThreshold = settings.freeShippingThreshold || 500;
  const shipping =
    settings.enableFreeShipping && subtotal >= freeShippingThreshold
      ? 0
      : settings.shippingFee || 50;
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxRate = settings.enableTax ? settings.taxRate || 0 : 0;
  const taxAmount = taxRate > 0 ? Math.round((taxableAmount * taxRate) / 100 * 100) / 100 : 0;
  const total = Math.max(0, subtotal - discountAmount + shipping + taxAmount);

  const handleUpdateQuantity = async (productId: string, newQuantity: number, variantId?: string) => {
    if (newQuantity < 1) return;
    setIsUpdating(productId);
    try {
      await cartApi.updateQuantity(productId, newQuantity, variantId);
      updateQuantity(productId, newQuantity, variantId);
    } catch (error: any) {
      if (error.response?.status === 404) {
        try {
          await cartApi.addItem(productId, newQuantity);
          updateQuantity(productId, newQuantity, variantId);
          toast.success(t('shop.toast.cartSynced'));
        } catch {
          toast.error(t('shop.toast.qtyUpdateFailed'));
        }
      } else {
        toast.error(t('shop.toast.qtyUpdateFailed'));
      }
    } finally {
      setIsUpdating(null);
    }
  };

  const handleRemoveItem = async (productId: string, variantId?: string) => {
    try {
      await cartApi.removeItem(productId, variantId);
      removeItem(productId, variantId);
      toast.success(t('cart.itemRemoved'));
    } catch {
      toast.error(t('shop.toast.removeFailed'));
    }
  };

  const handleApplyDiscount = async () => {
    if (!discountCodeInput.trim()) return;
    setIsApplyingDiscount(true);
    try {
      if (!hasSynced.current && items.length > 0) {
        const validItems = items
          .filter(item => item.productId && item.quantity >= 1)
          .map(item => ({ productId: item.productId, quantity: item.quantity }));
        if (validItems.length > 0) {
          await cartApi.sync(validItems);
        }
        hasSynced.current = true;
      }
      const result = await cartApi.applyDiscount(discountCodeInput);
      const discountData = result.discountAmount || 0;
      setDiscount(discountCodeInput.toUpperCase(), discountData, result.discountType, result.discountValue, result.maxDiscount);
      toast.success(t('shop.toast.discountApplied'));
      setDiscountCodeInput('');
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.response?.data?.message || t('shop.toast.invalidDiscount'));
    } finally {
      setIsApplyingDiscount(false);
    }
  };

  const handleRemoveDiscount = async () => {
    try {
      await cartApi.removeDiscount();
      clearDiscount();
      toast.success(t('shop.toast.discountRemoved'));
    } catch {
      toast.error(t('shop.toast.removeDiscountFailed'));
    }
  };

  if (isSyncing) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-dark-600">{t('shop.cart.syncing')}</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <HiOutlineShoppingCart className="mx-auto h-20 w-20 text-beige-300 mb-4" />
          <h2 className="text-xl font-semibold text-dark-900 mb-2">{t('cart.empty')}</h2>
          <p className="text-dark-500 mb-6">{t('cart.emptyHint')}</p>
          <Link href="/products">
            <Button>{t('shop.browseProducts')}</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-dark-900 mb-6">
        {t('shop.cart.titleWithCount', { count: items.length })}
      </h2>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="xl:col-span-2 space-y-3">
          {items.map((item, index) => (
            <motion.div
              key={item.productId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card padding="md">
                <div className="flex gap-3">
                  <Link
                    href={`/products/${item.product.slug || item.productId}`}
                    className="flex-shrink-0 w-20 h-20 bg-beige-100 rounded-lg overflow-hidden"
                  >
                    {item.product.images?.[0]?.url ? (
                      <img
                        src={item.product.images[0].url}
                        alt={item.product.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-beige-400 text-xs">
                        {t('shop.cart.noImage')}
                      </div>
                    )}
                  </Link>

                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${item.product.slug || item.productId}`}
                      className="font-medium text-dark-900 hover:text-primary-600 text-sm line-clamp-2"
                    >
                      {item.product.title}
                    </Link>
                    {item.variantValue && (
                      <p className="mt-0.5 text-xs text-dark-500">
                        {item.variantName ? `${item.variantName}: ` : ''}{item.variantValue}
                      </p>
                    )}
                    <div className="mt-1">
                      {item.product?.discount && item.product.discount > 0 ? (
                        <div className="flex items-center gap-2">
                          <span className="text-primary-600 font-semibold text-sm ltr-nums">
                            SAR {((item.product?.price || 0) * (1 - (item.product?.discount || 0) / 100)).toLocaleString()}
                          </span>
                          <span className="text-dark-400 text-xs line-through ltr-nums">
                            SAR {(item.product?.price || 0).toLocaleString()}
                          </span>
                        </div>
                      ) : (
                        <span className="text-primary-600 font-semibold text-sm ltr-nums">
                          SAR {(item.product?.price || 0).toLocaleString()}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center border border-beige-300 rounded-lg">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1, item.variantId)}
                          disabled={item.quantity <= 1 || isUpdating === item.productId}
                          aria-label={t('shop.a11y.decreaseQty')}
                          className="p-1.5 hover:bg-beige-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <HiMinus size={14} />
                        </button>
                        <span className="px-3 py-1.5 min-w-[32px] text-center text-sm">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1, item.variantId)}
                          disabled={isUpdating === item.productId || item.quantity >= (item.product.stock || 999)}
                          aria-label={t('shop.a11y.increaseQty')}
                          className="p-1.5 hover:bg-beige-100 disabled:opacity-50"
                        >
                          <HiPlus size={14} />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.productId, item.variantId)}
                        aria-label={t('shop.a11y.removeItem')}
                        className="text-error-600 hover:bg-error-50 p-1.5 rounded-lg transition-colors"
                      >
                        <HiOutlineTrash size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="text-end flex-shrink-0">
                    <p className="font-semibold text-dark-900 text-sm ltr-nums">
                      {(() => {
                        const basePrice = item.product?.price || 0;
                        const discount = item.product?.discount || 0;
                        const unitPrice = discount > 0 ? basePrice * (1 - discount / 100) : basePrice;
                        return `SAR ${(unitPrice * (item.quantity || 0)).toLocaleString()}`;
                      })()}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}

          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                try {
                  await cartApi.clear();
                  clearCart();
                  toast.success(t('shop.toast.cartCleared'));
                } catch {
                  toast.error(t('shop.toast.clearCartFailed'));
                }
              }}
              className="text-error-600 hover:bg-error-50"
            >
              {t('shop.cart.clear')}
            </Button>
          </div>
        </div>

        {/* Order Summary */}
        <div className="xl:col-span-1">
          <Card padding="lg" className="sticky top-4">
            <h3 className="text-lg font-semibold text-dark-900 mb-4">{t('cart.orderSummary')}</h3>

            <div className="mb-4">
              {appliedCode ? (
                <div className="flex items-center justify-between p-2.5 bg-success-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <HiOutlineTag className="text-success-600" size={16} />
                    <span className="text-success-700 font-medium text-sm ltr-nums">
                      {appliedCode} (-SAR {discountAmount.toLocaleString()})
                    </span>
                  </div>
                  <button onClick={handleRemoveDiscount} className="text-error-600 hover:text-error-700 text-xs">
                    {t('common.remove')}
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder={t('cart.discountCode')}
                    value={discountCodeInput}
                    onChange={(e) => setDiscountCodeInput(e.target.value)}
                    className="flex-1"
                  />
                  <Button variant="outline" size="sm" onClick={handleApplyDiscount} isLoading={isApplyingDiscount}>
                    {t('common.apply')}
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2.5 mb-4 text-sm">
              <div className="flex justify-between text-dark-600">
                <span>{t('cart.subtotal')}</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {appliedCode && discountAmount > 0 && (
                <div className="flex justify-between text-success-600">
                  <span>{t('cart.discount')}</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-dark-600">
                <span>{t('cart.shipping')}</span>
                <span className="ltr-nums">{shipping === 0 ? <span className="text-success-600">{t('common.free')}</span> : formatCurrency(shipping)}</span>
              </div>
              {shipping > 0 && settings.enableFreeShipping && (
                <p className="text-xs text-dark-500">
                  {t('cart.freeShippingOver', {
                    amount: `${settings.currency} ${freeShippingThreshold.toLocaleString()}`,
                  })}
                </p>
              )}
              {taxAmount > 0 && (
                <div className="flex justify-between text-dark-600">
                  <span>{settings.taxLabel || 'VAT'} <span className="ltr-nums">({taxRate}%)</span></span>
                  <span>{formatCurrency(taxAmount)}</span>
                </div>
              )}
              <div className="border-t border-beige-200 pt-2.5">
                <div className="flex justify-between font-semibold text-dark-900">
                  <span>{t('cart.total')}</span>
                  <span>{formatCurrency(total)}</span>
                </div>
                {taxAmount > 0 && (
                  <p className="text-xs text-dark-500 mt-1 text-end">
                    {t('cart.inclusiveOfVat', {
                      label: settings.taxLabel || 'VAT',
                      rate: taxRate,
                      amount: formatCurrency(taxAmount),
                    })}
                  </p>
                )}
              </div>
            </div>

            <Button fullWidth onClick={() => router.push('/checkout')}>
              {t('cart.proceedToCheckout')}
            </Button>

            <Link href="/products" className="block text-center text-primary-600 hover:text-primary-700 mt-3 text-sm">
              {t('common.continueShopping')}
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}

'use client';

import { Fragment, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Dialog, Transition } from '@headlessui/react';
import { HiOutlineShoppingBag, HiOutlineTruck, HiOutlineLockClosed, HiOutlineX, HiOutlineTrash, HiPlus, HiMinus } from 'react-icons/hi';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '@/lib/store';
import { cartApi } from '@/lib/api';
import { formatCurrency, getDiscountedPrice } from '@/lib/utils';
import { useSettings } from '@/lib/settings-context';
import { Button } from '@/components/ui';
import { PaymentMethods } from '@/components/PaymentMethods';
import { useT } from '@/lib/i18n';
import toast from 'react-hot-toast';

export function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    updateQuantity,
    removeItem,
    getSubtotal,
    getTotal,
    discountCode,
    discountAmount,
  } = useCartStore();

  const { settings } = useSettings();
  const t = useT();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const subtotal = getSubtotal();
  const itemCount = items.reduce((n, i) => n + (i.quantity || 0), 0);

  // Free-delivery meter. Threshold is admin-configurable, so never hardcode it.
  const freeShippingThreshold = settings.freeShippingThreshold || 500;
  const qualifiesForFreeShipping = subtotal >= freeShippingThreshold;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const freeShippingProgress = Math.min(100, (subtotal / freeShippingThreshold) * 100);

  // What the customer saves versus the pre-discount price of each line.
  const savings = items.reduce((sum, item) => {
    const base = item.product?.price || 0;
    const pct = item.product?.discount || 0;
    return pct > 0 ? sum + base * (pct / 100) * (item.quantity || 0) : sum;
  }, 0);
  const total = getTotal();

  const handleUpdateQuantity = async (productId: string, newQuantity: number, variantId?: string) => {
    if (newQuantity < 1) return;
    setUpdatingId(productId);
    try {
      await cartApi.updateQuantity(productId, newQuantity, variantId);
      updateQuantity(productId, newQuantity, variantId);
    } catch (error: any) {
      // If 404 (item not in backend), try to add it first
      if (error.response?.status === 404) {
        try {
          await cartApi.addItem(productId, newQuantity);
          updateQuantity(productId, newQuantity, variantId);
        } catch (addError) {
          toast.error(t('shop.toast.qtyUpdateFailed'));
        }
      } else {
        toast.error(t('shop.toast.qtyUpdateFailed'));
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemoveItem = async (productId: string, variantId?: string) => {
    setUpdatingId(productId);
    try {
      await cartApi.removeItem(productId, variantId);
      removeItem(productId, variantId);
    } catch (error) {
      toast.error(t('shop.toast.removeFailed'));
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={closeCart} className="relative z-50">
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-dark-950/60 backdrop-blur-sm" />
        </Transition.Child>

        {/* Drawer */}
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 end-0 flex max-w-full ps-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-out duration-300"
                enterFrom="translate-x-full rtl:-translate-x-full"
                enterTo="translate-x-0 rtl:translate-x-0"
                leave="transform transition ease-in duration-200"
                leaveFrom="translate-x-0 rtl:translate-x-0"
                leaveTo="translate-x-full rtl:-translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col bg-beige-50 shadow-soft-xl">
                    {/* Header — dark band so the drawer reads as its own surface
                        rather than a white sheet floating on a white page. */}
                    <div className="relative bg-dark-900 px-6 pt-5 pb-4">
                      <div className="flex items-center justify-between">
                        <Dialog.Title className="flex items-center gap-2.5 text-lg font-display font-bold text-white">
                          <HiOutlineShoppingBag size={20} className="text-primary-400" />
                          {t('cart.title')}
                          <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-primary-500 text-[11px] font-bold text-white ltr-nums">
                            {itemCount}
                          </span>
                        </Dialog.Title>
                        <button
                          onClick={closeCart}
                          aria-label={t('common.close')}
                          className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <HiOutlineX size={20} />
                        </button>
                      </div>

                      {/* Free-delivery meter — turns "spend more" into a visible,
                          achievable goal. Threshold comes from admin settings. */}
                      {items.length > 0 && settings.enableFreeShipping && (
                        <div className="mt-4">
                          <div className="flex items-center gap-2 text-xs">
                            <HiOutlineTruck
                              size={15}
                              className={qualifiesForFreeShipping ? 'text-success-400' : 'text-primary-400'}
                            />
                            <span className={qualifiesForFreeShipping ? 'text-success-400 font-medium' : 'text-white/80'}>
                              {qualifiesForFreeShipping
                                ? t('shop.cart.freeShippingUnlocked')
                                : t('shop.cart.freeShippingProgress', {
                                    amount: formatCurrency(remainingForFreeShipping),
                                  })}
                            </span>
                          </div>
                          <div className="mt-2 h-1.5 w-full rounded-full bg-white/15 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                qualifiesForFreeShipping ? 'bg-success-500' : 'bg-primary-500'
                              }`}
                              style={{ width: `${freeShippingProgress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Cart Items */}
                    <div className="flex-1 overflow-y-auto px-6 py-4">
                      {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-12">
                          <div className="w-24 h-24 bg-beige-100 rounded-full flex items-center justify-center mb-4">
                            <svg
                              className="w-12 h-12 text-beige-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                              />
                            </svg>
                          </div>
                          <h3 className="text-lg font-medium text-dark-900">
                            {t('cart.empty')}
                          </h3>
                          <p className="mt-1 text-sm text-dark-500">
                            {t('shop.cart.emptyDrawerHint')}
                          </p>
                          <Button
                            onClick={closeCart}
                            variant="primary"
                            className="mt-6"
                          >
                            {t('common.continueShopping')}
                          </Button>
                        </div>
                      ) : (
                        <AnimatePresence mode="popLayout">
                          <ul className="space-y-4">
                            {items.map((item) => {
                              const basePrice = item.product?.price || 0;
                              const discount = item.product?.discount || 0;
                              const price = discount > 0
                                ? getDiscountedPrice(basePrice, discount)
                                : basePrice;

                              return (
                                <motion.li
                                  key={item.productId}
                                  layout
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, x: -100 }}
                                  className="flex gap-4 p-3 bg-beige-50 rounded-xl"
                                >
                                  {/* Image */}
                                  <Link
                                    href={`/products/${item.product.slug}`}
                                    onClick={closeCart}
                                    className="relative w-20 h-20 flex-shrink-0 bg-white rounded-lg overflow-hidden"
                                  >
                                    {item.product.images?.[0]?.url ? (
                                      <Image
                                        src={item.product.images[0].url}
                                        alt={item.product.images[0].alt || item.product.title}
                                        fill
                                        className="object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-beige-400">
                                        <svg
                                          className="w-8 h-8"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={1.5}
                                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                          />
                                        </svg>
                                      </div>
                                    )}
                                  </Link>

                                  {/* Details */}
                                  <div className="flex-1 min-w-0">
                                    <Link
                                      href={`/products/${item.product.slug}`}
                                      onClick={closeCart}
                                      className="text-sm font-medium text-dark-900 hover:text-primary-600 line-clamp-2"
                                    >
                                      {item.product.title}
                                    </Link>
                                    {item.variantValue && (
                                      <p className="mt-0.5 text-xs text-dark-500">
                                        {item.variantName ? `${item.variantName}: ` : ''}{item.variantValue}
                                      </p>
                                    )}
                                    <div className="mt-1 flex items-center gap-2">
                                      <span className="text-sm font-semibold text-dark-900 ltr-nums">
                                        {formatCurrency(price)}
                                      </span>
                                      {item.product?.discount && item.product.discount > 0 && (
                                        <span className="text-xs text-dark-400 line-through ltr-nums">
                                          {formatCurrency(item.product?.price || 0)}
                                        </span>
                                      )}
                                    </div>

                                    {/* Quantity controls */}
                                    <div className="mt-2 flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={() =>
                                            handleUpdateQuantity(
                                              item.productId,
                                              item.quantity - 1,
                                              item.variantId
                                            )
                                          }
                                          disabled={item.quantity <= 1 || updatingId === item.productId}
                                          aria-label={t('shop.a11y.decreaseQty')}
                                          className="p-1 text-dark-500 hover:text-dark-700 hover:bg-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                          <HiMinus size={14} />
                                        </button>
                                        <span className="w-8 text-center text-sm font-medium">
                                          {item.quantity}
                                        </span>
                                        <button
                                          onClick={() =>
                                            handleUpdateQuantity(
                                              item.productId,
                                              item.quantity + 1,
                                              item.variantId
                                            )
                                          }
                                          disabled={item.quantity >= (item.product?.stock || 999) || updatingId === item.productId}
                                          aria-label={t('shop.a11y.increaseQty')}
                                          className="p-1 text-dark-500 hover:text-dark-700 hover:bg-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                          <HiPlus size={14} />
                                        </button>
                                      </div>
                                      <button
                                        onClick={() => handleRemoveItem(item.productId, item.variantId)}
                                        disabled={updatingId === item.productId}
                                        aria-label={t('shop.a11y.removeItem')}
                                        className="p-1.5 text-error-500 hover:text-error-600 hover:bg-error-50 rounded transition-colors disabled:opacity-50"
                                      >
                                        <HiOutlineTrash size={16} />
                                      </button>
                                    </div>
                                  </div>
                                </motion.li>
                              );
                            })}
                          </ul>
                        </AnimatePresence>
                      )}
                    </div>

                    {/* Footer */}
                    {items.length > 0 && (
                      <div className="border-t border-beige-200 px-6 py-4 space-y-4">
                        {/* Summary */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-dark-600">{t('cart.subtotal')}</span>
                            <span className="font-medium text-dark-900 ltr-nums">
                              {formatCurrency(subtotal)}
                            </span>
                          </div>
                          {discountCode && discountAmount > 0 && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-success-600">
                                {t('shop.cart.discountWithCode', { code: discountCode })}
                              </span>
                              <span className="font-medium text-success-600 ltr-nums">
                                -{formatCurrency(discountAmount)}
                              </span>
                            </div>
                          )}
                          {savings > 0 && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-success-600 font-medium">
                                {t('shop.cart.youSave')}
                              </span>
                              <span className="font-semibold text-success-600 ltr-nums">
                                {formatCurrency(savings)}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center justify-between pt-2 border-t border-beige-200">
                            <span className="text-base font-semibold text-dark-900">
                              {t('cart.total')}
                            </span>
                            <span className="text-xl font-bold text-dark-900 ltr-nums">
                              {formatCurrency(total)}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-2">
                          <Link href="/checkout" onClick={closeCart} className="block">
                            <Button variant="primary" fullWidth size="lg">
                              {t('checkout.title')}
                            </Button>
                          </Link>
                          <Link href="/cart" onClick={closeCart} className="block">
                            <Button variant="secondary" fullWidth>
                              {t('shop.cart.viewCart')}
                            </Button>
                          </Link>
                        </div>

                        {/* Reassurance right where the decision happens */}
                        <div className="flex items-center justify-center gap-1.5 text-xs text-dark-500">
                          <HiOutlineLockClosed size={13} />
                          {t('shop.cart.secureCheckout')}
                        </div>
                        <PaymentMethods
                          includeCOD={settings.enableCOD}
                          label={null}
                          size="sm"
                          className="justify-center"
                        />

                        <p className="text-xs text-center text-dark-500">
                          {settings.enableTax && settings.taxRate > 0
                            ? t('shop.cart.taxShippingAtCheckout', {
                                label: settings.taxLabel || 'VAT',
                                rate: settings.taxRate,
                              })
                            : t('shop.cart.shippingAtCheckout')}
                        </p>
                      </div>
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

export default CartDrawer;

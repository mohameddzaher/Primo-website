'use client';

import { Fragment, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Dialog, Transition } from '@headlessui/react';
import { HiOutlineX, HiOutlineTrash, HiPlus, HiMinus } from 'react-icons/hi';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '@/lib/store';
import { cartApi } from '@/lib/api';
import { formatCurrency, getDiscountedPrice } from '@/lib/utils';
import { useSettings } from '@/lib/settings-context';
import { Button } from '@/components/ui';
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
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const subtotal = getSubtotal();
  const total = getTotal();

  const handleUpdateQuantity = async (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setUpdatingId(productId);
    try {
      await cartApi.updateQuantity(productId, newQuantity);
      updateQuantity(productId, newQuantity);
    } catch (error: any) {
      // If 404 (item not in backend), try to add it first
      if (error.response?.status === 404) {
        try {
          await cartApi.addItem(productId, newQuantity);
          updateQuantity(productId, newQuantity);
        } catch (addError) {
          toast.error('Failed to update quantity');
        }
      } else {
        toast.error('Failed to update quantity');
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemoveItem = async (productId: string) => {
    setUpdatingId(productId);
    try {
      await cartApi.removeItem(productId);
      removeItem(productId);
    } catch (error) {
      toast.error('Failed to remove item');
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
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in duration-200"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col bg-white shadow-soft-xl">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-beige-200">
                      <Dialog.Title className="text-lg font-semibold text-dark-900">
                        Shopping Cart
                        <span className="ml-2 text-sm font-normal text-dark-500">
                          ({items.length} {items.length === 1 ? 'item' : 'items'})
                        </span>
                      </Dialog.Title>
                      <button
                        onClick={closeCart}
                        className="p-2 text-dark-400 hover:text-dark-600 hover:bg-beige-100 rounded-lg transition-colors"
                      >
                        <HiOutlineX size={20} />
                      </button>
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
                            Your cart is empty
                          </h3>
                          <p className="mt-1 text-sm text-dark-500">
                            Start shopping to add items to your cart
                          </p>
                          <Button
                            onClick={closeCart}
                            variant="primary"
                            className="mt-6"
                          >
                            Continue Shopping
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
                                    <div className="mt-1 flex items-center gap-2">
                                      <span className="text-sm font-semibold text-dark-900">
                                        {formatCurrency(price)}
                                      </span>
                                      {item.product?.discount && item.product.discount > 0 && (
                                        <span className="text-xs text-dark-400 line-through">
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
                                              item.quantity - 1
                                            )
                                          }
                                          disabled={item.quantity <= 1 || updatingId === item.productId}
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
                                              item.quantity + 1
                                            )
                                          }
                                          disabled={item.quantity >= (item.product?.stock || 999) || updatingId === item.productId}
                                          className="p-1 text-dark-500 hover:text-dark-700 hover:bg-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                          <HiPlus size={14} />
                                        </button>
                                      </div>
                                      <button
                                        onClick={() => handleRemoveItem(item.productId)}
                                        disabled={updatingId === item.productId}
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
                            <span className="text-dark-600">Subtotal</span>
                            <span className="font-medium text-dark-900">
                              {formatCurrency(subtotal)}
                            </span>
                          </div>
                          {discountCode && discountAmount > 0 && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-success-600">
                                Discount ({discountCode})
                              </span>
                              <span className="font-medium text-success-600">
                                -{formatCurrency(discountAmount)}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center justify-between pt-2 border-t border-beige-200">
                            <span className="text-base font-semibold text-dark-900">
                              Total
                            </span>
                            <span className="text-lg font-bold text-dark-900">
                              {formatCurrency(total)}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-2">
                          <Link href="/checkout" onClick={closeCart}>
                            <Button variant="primary" fullWidth size="lg">
                              Checkout
                            </Button>
                          </Link>
                          <Link href="/account/cart" onClick={closeCart}>
                            <Button variant="secondary" fullWidth>
                              View Cart
                            </Button>
                          </Link>
                        </div>

                        <p className="text-xs text-center text-dark-500">
                          {settings.enableTax && settings.taxRate > 0
                            ? `${settings.taxLabel || 'VAT'} (${settings.taxRate}%) and shipping calculated at checkout`
                            : 'Shipping calculated at checkout'}
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

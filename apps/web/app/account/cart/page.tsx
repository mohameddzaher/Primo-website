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
import toast from 'react-hot-toast';

export default function AccountCartPage() {
  const router = useRouter();
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
  const shipping = subtotal >= 2000 ? 0 : 50;
  const total = subtotal - discountAmount + shipping;

  const handleUpdateQuantity = async (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setIsUpdating(productId);
    try {
      await cartApi.updateQuantity(productId, newQuantity);
      updateQuantity(productId, newQuantity);
    } catch (error: any) {
      if (error.response?.status === 404) {
        try {
          await cartApi.addItem(productId, newQuantity);
          updateQuantity(productId, newQuantity);
          toast.success('Cart synced');
        } catch {
          toast.error('Failed to update quantity');
        }
      } else {
        toast.error('Failed to update quantity');
      }
    } finally {
      setIsUpdating(null);
    }
  };

  const handleRemoveItem = async (productId: string) => {
    try {
      await cartApi.removeItem(productId);
      removeItem(productId);
      toast.success('Item removed from cart');
    } catch {
      toast.error('Failed to remove item');
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
      toast.success('Discount applied!');
      setDiscountCodeInput('');
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Invalid discount code');
    } finally {
      setIsApplyingDiscount(false);
    }
  };

  const handleRemoveDiscount = async () => {
    try {
      await cartApi.removeDiscount();
      clearDiscount();
      toast.success('Discount removed');
    } catch {
      toast.error('Failed to remove discount');
    }
  };

  if (isSyncing) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-dark-600">Syncing your cart...</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <HiOutlineShoppingCart className="mx-auto h-20 w-20 text-beige-300 mb-4" />
          <h2 className="text-xl font-semibold text-dark-900 mb-2">Your cart is empty</h2>
          <p className="text-dark-500 mb-6">Add some products to your cart to continue shopping</p>
          <Link href="/products">
            <Button>Browse Products</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-dark-900 mb-6">
        Shopping Cart ({items.length} items)
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
                        No Image
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
                    <div className="mt-1">
                      {item.product?.discount && item.product.discount > 0 ? (
                        <div className="flex items-center gap-2">
                          <span className="text-primary-600 font-semibold text-sm">
                            EGP {((item.product?.price || 0) * (1 - (item.product?.discount || 0) / 100)).toLocaleString()}
                          </span>
                          <span className="text-dark-400 text-xs line-through">
                            EGP {(item.product?.price || 0).toLocaleString()}
                          </span>
                        </div>
                      ) : (
                        <span className="text-primary-600 font-semibold text-sm">
                          EGP {(item.product?.price || 0).toLocaleString()}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center border border-beige-300 rounded-lg">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                          disabled={item.quantity <= 1 || isUpdating === item.productId}
                          className="p-1.5 hover:bg-beige-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <HiMinus size={14} />
                        </button>
                        <span className="px-3 py-1.5 min-w-[32px] text-center text-sm">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                          disabled={isUpdating === item.productId || item.quantity >= (item.product.stock || 999)}
                          className="p-1.5 hover:bg-beige-100 disabled:opacity-50"
                        >
                          <HiPlus size={14} />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.productId)}
                        className="text-error-600 hover:bg-error-50 p-1.5 rounded-lg transition-colors"
                      >
                        <HiOutlineTrash size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-dark-900 text-sm">
                      {(() => {
                        const basePrice = item.product?.price || 0;
                        const discount = item.product?.discount || 0;
                        const unitPrice = discount > 0 ? basePrice * (1 - discount / 100) : basePrice;
                        return `EGP ${(unitPrice * (item.quantity || 0)).toLocaleString()}`;
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
                  toast.success('Cart cleared');
                } catch {
                  toast.error('Failed to clear cart');
                }
              }}
              className="text-error-600 hover:bg-error-50"
            >
              Clear Cart
            </Button>
          </div>
        </div>

        {/* Order Summary */}
        <div className="xl:col-span-1">
          <Card padding="lg" className="sticky top-4">
            <h3 className="text-lg font-semibold text-dark-900 mb-4">Order Summary</h3>

            <div className="mb-4">
              {appliedCode ? (
                <div className="flex items-center justify-between p-2.5 bg-success-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <HiOutlineTag className="text-success-600" size={16} />
                    <span className="text-success-700 font-medium text-sm">
                      {appliedCode} (-EGP {discountAmount.toLocaleString()})
                    </span>
                  </div>
                  <button onClick={handleRemoveDiscount} className="text-error-600 hover:text-error-700 text-xs">
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="Discount code"
                    value={discountCodeInput}
                    onChange={(e) => setDiscountCodeInput(e.target.value)}
                    className="flex-1"
                  />
                  <Button variant="outline" size="sm" onClick={handleApplyDiscount} isLoading={isApplyingDiscount}>
                    Apply
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2.5 mb-4 text-sm">
              <div className="flex justify-between text-dark-600">
                <span>Subtotal</span>
                <span>EGP {subtotal.toLocaleString()}</span>
              </div>
              {appliedCode && discountAmount > 0 && (
                <div className="flex justify-between text-success-600">
                  <span>Discount</span>
                  <span>-EGP {discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-dark-600">
                <span>Shipping</span>
                <span>{shipping === 0 ? <span className="text-success-600">Free</span> : `EGP ${shipping}`}</span>
              </div>
              {shipping > 0 && (
                <p className="text-xs text-dark-500">Free shipping on orders over EGP 2,000</p>
              )}
              <div className="border-t border-beige-200 pt-2.5">
                <div className="flex justify-between font-semibold text-dark-900">
                  <span>Total</span>
                  <span>EGP {total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <Button fullWidth onClick={() => router.push('/checkout')}>
              Proceed to Checkout
            </Button>

            <Link href="/products" className="block text-center text-primary-600 hover:text-primary-700 mt-3 text-sm">
              Continue Shopping
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}

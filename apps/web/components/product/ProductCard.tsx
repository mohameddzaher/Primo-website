'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import {
  HiOutlineHeart,
  HiHeart,
  HiOutlineShoppingBag,
  HiOutlineEye,
  HiStar,
} from 'react-icons/hi';
import { cn, formatCurrency, getDiscountedPrice, getStockStatus } from '@/lib/utils';
import { useSettings } from '@/lib/settings-context';
import { useCartStore, useWishlistStore, useCompareStore, useAuthStore } from '@/lib/store';
import { cartApi, userApi } from '@/lib/api';
import {
  Badge,
  DiscountBadge,
  NewBadge,
  Rating,
} from '@/components/ui';
import { useT } from '@/lib/i18n';
import toast from 'react-hot-toast';

/** Stock at or below this count shows the "Only N left" urgency line. */
const LOW_STOCK_THRESHOLD = 5;

export interface ProductCardProps {
  product: {
    _id: string;
    title: string;
    slug?: string;
    brand?: string;
    price: number;
    compareAtPrice?: number;
    discount?: number;
    images: { url: string; alt?: string }[];
    stock?: number;
    stockQuantity?: number;
    averageRating?: number;
    reviewCount?: number;
    isNew?: boolean;
    isFeatured?: boolean;
    soldCount?: number;
    /** Optional purchasable options (colour, capacity, …). */
    variants?: { id: string; name: string; value: string; stockQuantity: number }[];
  };
  variant?: 'default' | 'compact' | 'horizontal';
  showQuickActions?: boolean;
}

export function ProductCard({
  product,
  variant = 'default',
  showQuickActions = true,
}: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const queryClient = useQueryClient();
  const { addItem, openCart } = useCartStore();
  const { isInWishlist, toggleItem: toggleWishlist } = useWishlistStore();
  const { addItem: addToCompare, isInCompare } = useCompareStore();
  const { isAuthenticated } = useAuthStore();
  const { settings } = useSettings();
  const t = useT();

  const isWishlisted = isInWishlist(product._id);
  const inCompare = isInCompare(product._id);

  // Normalize stock: backend returns stockQuantity, frontend uses stock
  const productStock = product.stockQuantity ?? product.stock ?? 0;

  const finalPrice = product.discount
    ? getDiscountedPrice(product.price, product.discount)
    : product.price;

  const stockStatus = getStockStatus(productStock);

  // Delivery promise — threshold and flat fee come from store settings
  const qualifiesForFreeShipping =
    settings.enableFreeShipping && finalPrice >= settings.freeShippingThreshold;
  const deliveryPromise = qualifiesForFreeShipping
    ? t('product.freeDelivery')
    : t('product.deliveryFrom', {
        amount: formatCurrency(settings.shippingFee, settings.currency),
      });

  // Low-stock urgency (genuine — driven by real stock)
  const isLowStock = productStock > 0 && productStock <= LOW_STOCK_THRESHOLD;

  // Products with options can't be one-click added from a card — the customer
  // has to pick a variant on the detail page first.
  const variantCount = product.variants?.length ?? 0;
  const hasVariants = variantCount > 0;

  // Safe link: use slug if available, otherwise fall back to ID
  const productHref = `/products/${product.slug || product._id}`;

  const handleAddToCart = async (e: React.MouseEvent) => {
    // The server rejects a variant product added without a selected option, so
    // let the click fall through to the wrapping Link — the customer picks an
    // option on the detail page instead of getting an error toast.
    if (hasVariants) return;

    e.preventDefault();
    e.stopPropagation();

    if (productStock === 0) {
      toast.error(t('shop.toast.outOfStock'));
      return;
    }

    try {
      // Sync with backend first
      await cartApi.addItem(product._id, 1);

      // Then update local state
      addItem({
        productId: product._id,
        product: {
          id: product._id,
          title: product.title,
          slug: product.slug || product._id,
          price: product.price,
          discount: product.discount,
          images: product.images,
          stock: productStock,
        },
        quantity: 1,
      });

      toast.success(t('shop.toast.addedToCart'));
      openCart();
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('shop.toast.addToCartFailed'));
    }
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Update local state first for instant feedback
    toggleWishlist(product._id);

    // Sync with backend if authenticated
    if (isAuthenticated) {
      try {
        if (isWishlisted) {
          await userApi.removeFromWishlist(product._id);
        } else {
          await userApi.addToWishlist(product._id);
        }
      } catch (error) {
        // Revert local state on error
        toggleWishlist(product._id);
        toast.error(t('shop.toast.wishlistFailed'));
        return;
      }
      // Keep the wishlist page (server-backed query) fresh
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    }

    toast.success(
      isWishlisted ? t('shop.toast.removedFromWishlist') : t('shop.toast.addedToWishlist')
    );
  };

  const handleAddToCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const added = addToCompare(product._id);
    if (added) {
      toast.success(
        inCompare ? t('shop.toast.alreadyInCompare') : t('shop.toast.addedToCompare')
      );
    } else {
      toast.error(t('shop.toast.compareFull'));
    }
  };

  // Compact variant for homepage sections
  if (variant === 'compact') {
    return (
      <Link href={productHref} className="block h-full">
        <motion.div
          className="group h-full flex flex-col overflow-hidden rounded-xl bg-white border border-beige-200 hover:border-primary-300 hover:shadow-soft-lg transition-all duration-200"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          whileHover={{ y: -3 }}
          transition={{ duration: 0.2 }}
        >
          {/* Product shots are white-background studio images, so `contain`
              shows the whole appliance instead of cropping into it. */}
          <div className="relative aspect-square overflow-hidden bg-white">
            {/* Badges */}
            <div className="absolute top-2 start-2 z-10 flex flex-col gap-1">
              {product.discount && product.discount > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-error-500 text-white shadow-sm">
                  -{product.discount}%
                </span>
              )}
              {product.isNew && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-primary-500 text-white shadow-sm">
                  {t('shop.product.newBadge')}
                </span>
              )}
            </div>

            {/* Wishlist button */}
            <button
              type="button"
              onClick={handleToggleWishlist}
              aria-label={isWishlisted ? t('product.removeFromWishlist') : t('product.addToWishlist')}
              className={cn(
                'absolute top-2 end-2 z-10 p-2 rounded-full bg-white/95 backdrop-blur-sm shadow-soft ring-1 ring-black/5 transition-all',
                isWishlisted
                  ? 'text-error-500'
                  : 'text-dark-400 hover:text-error-500'
              )}
            >
              {isWishlisted ? <HiHeart size={15} /> : <HiOutlineHeart size={15} />}
            </button>

            {/* Image */}
            {product.images?.[0]?.url && !imgError ? (
              <Image
                src={product.images[0].url}
                alt={product.images[0].alt || product.title}
                fill
                className={cn(
                  'object-contain p-3 transition-all duration-500 group-hover:scale-105',
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                )}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImgError(true)}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 220px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-beige-400 bg-beige-100">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}

            {/* Quick add to cart on hover */}
            {showQuickActions && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
                className="absolute bottom-2 start-2 end-2 z-10"
              >
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={productStock === 0}
                  className="w-full flex items-center justify-center gap-1.5 py-2 bg-dark-900 text-white text-[12px] font-semibold rounded-lg shadow-soft hover:bg-dark-800 disabled:bg-dark-400 disabled:cursor-not-allowed transition-colors"
                >
                  <HiOutlineShoppingBag size={14} />
                  {productStock === 0 ? t('product.outOfStock') : t('shop.product.add')}
                </button>
              </motion.div>
            )}
          </div>

          {/* Content */}
          <div className="p-3 flex-1 flex flex-col">
            {/* Brand */}
            {product.brand && (
              <p className="text-[10px] font-medium text-dark-400 uppercase tracking-wide truncate">
                {product.brand}
              </p>
            )}

            {/* Title */}
            <h3 className="mt-1 text-[13px] font-medium text-dark-900 line-clamp-2 group-hover:text-primary-600 transition-colors leading-snug min-h-[2.6em]">
              {product.title}
            </h3>

            {/* Rating */}
            {product.averageRating !== undefined && product.averageRating > 0 && (
              <div className="mt-1.5 flex items-center gap-1">
                <HiStar size={13} className="text-yellow-400" />
                <span className="text-[11px] font-medium text-dark-700 ltr-nums">
                  {product.averageRating.toFixed(1)}
                </span>
                {product.reviewCount ? (
                  <span className="text-[11px] text-dark-400 ltr-nums">({product.reviewCount})</span>
                ) : null}
              </div>
            )}

            {/* Price */}
            <div className="mt-auto pt-2">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-[15px] font-bold text-dark-900 ltr-nums">
                  {formatCurrency(finalPrice)}
                </span>
                {product.discount && product.discount > 0 && (
                  <span className="text-[11px] text-dark-400 line-through ltr-nums">
                    {formatCurrency(product.price)}
                  </span>
                )}
              </div>

              {/* ONE supporting line, not three stacked micro-lines. Scarcity
                  outranks the delivery promise when stock is genuinely low. */}
              <p
                className={cn(
                  'mt-1 text-[11px] leading-tight truncate',
                  isLowStock
                    ? 'text-orange-600 font-medium'
                    : qualifiesForFreeShipping
                    ? 'text-success-600'
                    : 'text-dark-500'
                )}
              >
                {isLowStock
                  ? t('product.lowStock', { count: productStock })
                  : deliveryPromise}
              </p>

              {hasVariants && (
                <p className="mt-0.5 text-[11px] leading-tight text-primary-600">
                  {t('shop.product.optionsAvailable', { count: variantCount })}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </Link>
    );
  }

  if (variant === 'horizontal') {
    return (
      <Link href={productHref}>
        <motion.div
          className="group flex gap-4 p-4 bg-white rounded-xl border border-beige-200 hover:shadow-soft-lg hover:border-beige-300 transition-all"
          whileHover={{ y: -2 }}
        >
          {/* Image */}
          <div className="relative w-24 h-24 flex-shrink-0 bg-beige-100 rounded-lg overflow-hidden">
            {product.images?.[0]?.url && !imgError ? (
              <Image
                src={product.images[0].url}
                alt={product.images[0].alt || product.title}
                fill
                className="object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-beige-400">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            {product.brand && (
              <p className="text-xs text-dark-500 uppercase tracking-wide">
                {product.brand}
              </p>
            )}
            <h3 className="mt-1 text-sm font-medium text-dark-900 line-clamp-2 group-hover:text-primary-600 transition-colors">
              {product.title}
            </h3>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-base font-bold text-dark-900 ltr-nums">
                {formatCurrency(finalPrice)}
              </span>
              {product.discount && (
                <span className="text-sm text-dark-400 line-through ltr-nums">
                  {formatCurrency(product.price)}
                </span>
              )}
            </div>
            {hasVariants && (
              <p className="mt-1 text-xs text-dark-500">
                {t('shop.product.optionsAvailable', { count: variantCount })}
              </p>
            )}
          </div>
        </motion.div>
      </Link>
    );
  }

  return (
    <Link href={productHref} className="block h-full">
      <motion.div
        className="group product-card"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
      >
        {/* Image container */}
        <div className="relative product-card-image">
          {/* Badges */}
          <div className="absolute top-3 start-3 z-10 flex flex-col gap-2">
            {product.discount && product.discount > 0 && (
              <DiscountBadge percentage={product.discount} />
            )}
            {product.isNew && <NewBadge />}
          </div>

          {/* Wishlist button */}
          <button
            onClick={handleToggleWishlist}
            aria-label={isWishlisted ? t('product.removeFromWishlist') : t('product.addToWishlist')}
            className={cn(
              'absolute top-3 end-3 z-10 p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-soft transition-all',
              isWishlisted
                ? 'text-error-500'
                : 'text-dark-400 hover:text-error-500'
            )}
          >
            {isWishlisted ? <HiHeart size={18} /> : <HiOutlineHeart size={18} />}
          </button>

          {/* Image */}
          {product.images?.[0]?.url && !imgError ? (
            <Image
              src={product.images[0].url}
              alt={product.images[0].alt || product.title}
              fill
              className={cn(
                'object-cover transition-all duration-500',
                imageLoaded ? 'opacity-100' : 'opacity-0'
              )}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImgError(true)}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-beige-400 bg-beige-100">
              <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}

          {/* Quick actions */}
          {showQuickActions && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
              className="absolute bottom-3 start-3 end-3 z-10 flex gap-2"
            >
              <button
                onClick={handleAddToCart}
                disabled={productStock === 0}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-dark-900 text-white text-sm font-medium rounded-lg hover:bg-dark-800 disabled:bg-dark-400 disabled:cursor-not-allowed transition-colors"
              >
                <HiOutlineShoppingBag size={16} />
                {productStock === 0 ? t('product.outOfStock') : t('common.addToCart')}
              </button>
              <button
                onClick={handleAddToCompare}
                className={cn(
                  'p-2.5 rounded-lg transition-colors',
                  inCompare
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-dark-700 hover:bg-beige-100'
                )}
                title={t('product.compare')}
                aria-label={t('product.compare')}
              >
                <HiOutlineEye size={16} />
              </button>
            </motion.div>
          )}
        </div>

        {/* Content */}
        <div className="p-3 flex-1 flex flex-col">
          {/* Brand */}
          {product.brand && (
            <p className="text-[10px] text-dark-500 uppercase tracking-wide">
              {product.brand}
            </p>
          )}

          {/* Title */}
          <h3 className="mt-0.5 text-xs sm:text-sm font-medium text-dark-900 line-clamp-2 group-hover:text-primary-600 transition-colors min-h-[2.5em]">
            {product.title}
          </h3>

          {/* Rating */}
          {product.averageRating !== undefined && product.averageRating > 0 && (
            <div className="mt-1.5">
              <Rating
                value={product.averageRating}
                size="sm"
                showValue
                showCount
                count={product.reviewCount}
              />
            </div>
          )}

          {/* Price - pushed to bottom */}
          <div className="mt-auto pt-2 flex items-center gap-1.5 flex-wrap">
            <span className="text-sm sm:text-base font-bold text-dark-900 ltr-nums">
              {formatCurrency(finalPrice)}
            </span>
            {product.discount && product.discount > 0 && (
              <span className="text-xs text-dark-400 line-through ltr-nums">
                {formatCurrency(product.price)}
              </span>
            )}
          </div>

          {/* Options hint */}
          {hasVariants && (
            <p className="mt-1 text-[10px] text-dark-500">
              {t('shop.product.optionsAvailable', { count: variantCount })}
            </p>
          )}

          {/* Delivery promise */}
          <p
            className={cn(
              'mt-1 text-[10px]',
              qualifiesForFreeShipping ? 'text-success-600 font-medium' : 'text-dark-500'
            )}
          >
            {deliveryPromise}
          </p>

          {/* Stock status */}
          {isLowStock && (
            <p className="mt-0.5 text-[10px] text-orange-600 font-medium">
              {t('product.lowStock', { count: productStock })}
            </p>
          )}
          {productStock === 0 && (
            <p className="mt-0.5 text-[10px] text-error-600">{t('product.outOfStock')}</p>
          )}
        </div>
      </motion.div>
    </Link>
  );
}

export default ProductCard;

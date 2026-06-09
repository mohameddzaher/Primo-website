'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  HiOutlineHeart,
  HiHeart,
  HiOutlineShoppingBag,
  HiOutlineEye,
} from 'react-icons/hi';
import { cn, formatCurrency, getDiscountedPrice, getStockStatus } from '@/lib/utils';
import { useCartStore, useWishlistStore, useCompareStore, useAuthStore } from '@/lib/store';
import { cartApi, userApi } from '@/lib/api';
import {
  Badge,
  DiscountBadge,
  NewBadge,
  Rating,
} from '@/components/ui';
import toast from 'react-hot-toast';

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

  const { addItem, openCart } = useCartStore();
  const { isInWishlist, toggleItem: toggleWishlist } = useWishlistStore();
  const { addItem: addToCompare, isInCompare } = useCompareStore();
  const { isAuthenticated } = useAuthStore();

  const isWishlisted = isInWishlist(product._id);
  const inCompare = isInCompare(product._id);

  // Normalize stock: backend returns stockQuantity, frontend uses stock
  const productStock = product.stockQuantity ?? product.stock ?? 0;

  const finalPrice = product.discount
    ? getDiscountedPrice(product.price, product.discount)
    : product.price;

  const stockStatus = getStockStatus(productStock);

  // Safe link: use slug if available, otherwise fall back to ID
  const productHref = `/products/${product.slug || product._id}`;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (productStock === 0) {
      toast.error('This product is out of stock');
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

      toast.success('Added to cart');
      openCart();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add to cart');
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
        toast.error('Failed to update wishlist');
        return;
      }
    }

    toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist');
  };

  const handleAddToCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const added = addToCompare(product._id);
    if (added) {
      toast.success(inCompare ? 'Already in compare' : 'Added to compare');
    } else {
      toast.error('Compare list is full (max 4 items)');
    }
  };

  // Compact variant for homepage sections
  if (variant === 'compact') {
    return (
      <Link href={productHref} className="block h-full">
        <motion.div
          className="group product-card product-card-compact h-full"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
        >
          {/* Image container - smaller aspect ratio */}
          <div className="relative aspect-square overflow-hidden bg-beige-100">
            {/* Badges */}
            <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
              {product.discount && product.discount > 0 && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-error-500 text-white">
                  -{product.discount}%
                </span>
              )}
              {product.isNew && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary-500 text-white">
                  NEW
                </span>
              )}
            </div>

            {/* Wishlist button */}
            <button
              type="button"
              onClick={handleToggleWishlist}
              className={cn(
                'absolute top-2 right-2 z-10 p-1.5 rounded-full bg-white/90 backdrop-blur-sm shadow-soft transition-all',
                isWishlisted
                  ? 'text-error-500'
                  : 'text-dark-400 hover:text-error-500'
              )}
            >
              {isWishlisted ? <HiHeart size={14} /> : <HiOutlineHeart size={14} />}
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
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
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
                className="absolute bottom-2 left-2 right-2 z-10"
              >
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={productStock === 0}
                  className="w-full flex items-center justify-center gap-1 py-1.5 bg-dark-900 text-white text-xs font-medium rounded hover:bg-dark-800 disabled:bg-dark-400 disabled:cursor-not-allowed transition-colors"
                >
                  <HiOutlineShoppingBag size={12} />
                  {productStock === 0 ? 'Out of Stock' : 'Add'}
                </button>
              </motion.div>
            )}
          </div>

          {/* Content - compact */}
          <div className="p-2 flex-1 flex flex-col">
            {/* Brand */}
            {product.brand && (
              <p className="text-[9px] text-dark-500 uppercase tracking-wide truncate">
                {product.brand}
              </p>
            )}

            {/* Title */}
            <h3 className="mt-0.5 text-[11px] sm:text-xs font-medium text-dark-900 line-clamp-2 group-hover:text-primary-600 transition-colors leading-tight min-h-[2.5em]">
              {product.title}
            </h3>

            {/* Rating - compact */}
            {product.averageRating !== undefined && product.averageRating > 0 && (
              <div className="mt-1 flex items-center gap-1">
                <span className="text-yellow-400 text-[10px]">★</span>
                <span className="text-[10px] text-dark-600">{product.averageRating.toFixed(1)}</span>
                {product.reviewCount && (
                  <span className="text-[9px] text-dark-400">({product.reviewCount})</span>
                )}
              </div>
            )}

            {/* Price - pushed to bottom */}
            <div className="mt-auto pt-1.5 flex items-center gap-1 flex-wrap">
              <span className="text-xs sm:text-sm font-bold text-dark-900">
                {formatCurrency(finalPrice)}
              </span>
              {product.discount && product.discount > 0 && (
                <span className="text-[10px] text-dark-400 line-through">
                  {formatCurrency(product.price)}
                </span>
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
              <span className="text-base font-bold text-dark-900">
                {formatCurrency(finalPrice)}
              </span>
              {product.discount && (
                <span className="text-sm text-dark-400 line-through">
                  {formatCurrency(product.price)}
                </span>
              )}
            </div>
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
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
            {product.discount && product.discount > 0 && (
              <DiscountBadge percentage={product.discount} />
            )}
            {product.isNew && <NewBadge />}
          </div>

          {/* Wishlist button */}
          <button
            onClick={handleToggleWishlist}
            className={cn(
              'absolute top-3 right-3 z-10 p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-soft transition-all',
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
              className="absolute bottom-3 left-3 right-3 z-10 flex gap-2"
            >
              <button
                onClick={handleAddToCart}
                disabled={productStock === 0}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-dark-900 text-white text-sm font-medium rounded-lg hover:bg-dark-800 disabled:bg-dark-400 disabled:cursor-not-allowed transition-colors"
              >
                <HiOutlineShoppingBag size={16} />
                {productStock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
              <button
                onClick={handleAddToCompare}
                className={cn(
                  'p-2.5 rounded-lg transition-colors',
                  inCompare
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-dark-700 hover:bg-beige-100'
                )}
                title="Compare"
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
            <span className="text-sm sm:text-base font-bold text-dark-900">
              {formatCurrency(finalPrice)}
            </span>
            {product.discount && product.discount > 0 && (
              <span className="text-xs text-dark-400 line-through">
                {formatCurrency(product.price)}
              </span>
            )}
          </div>

          {/* Stock status */}
          {productStock <= 5 && productStock > 0 && (
            <p className="mt-1.5 text-[10px] text-orange-600">
              Only {productStock} left
            </p>
          )}
          {productStock === 0 && (
            <p className="mt-1.5 text-[10px] text-error-600">Out of stock</p>
          )}
        </div>
      </motion.div>
    </Link>
  );
}

export default ProductCard;

'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineHeart,
  HiHeart,
  HiOutlineShoppingBag,
  HiOutlineShare,
  HiMinus,
  HiPlus,
  HiCheck,
  HiOutlineTruck,
  HiOutlineShieldCheck,
  HiOutlineRefresh,
  HiChevronRight,
} from 'react-icons/hi';
import { productsApi, userApi, cartApi } from '@/lib/api';
import { queryKeys } from '@/lib/query-client';
import {
  cn,
  formatCurrency,
  getDiscountedPrice,
  getStockStatus,
} from '@/lib/utils';
import { useCartStore, useWishlistStore, useAuthStore, useRecentlyViewedStore } from '@/lib/store';
import { useSettings } from '@/lib/settings-context';
import {
  Button,
  Badge,
  DiscountBadge,
  Rating,
  RatingSummary,
  Card,
  Skeleton,
} from '@/components/ui';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductReviews } from '@/components/product/ProductReviews';
import { useT } from '@/lib/i18n';
import toast from 'react-hot-toast';

export default function ProductDetailClient() {
  const params = useParams();
  const slug = params.slug as string;

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'description' | 'specs' | 'reviews' | 'faq'>('description');
  const [selectedBundleItems, setSelectedBundleItems] = useState<Record<string, boolean>>({});

  // Sticky mobile add-to-cart bar: shown once the primary CTA scrolls away
  const addToCartRef = useRef<HTMLDivElement>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);

  const t = useT();
  const { settings } = useSettings();
  const { isAuthenticated } = useAuthStore();
  const { addItem, openCart } = useCartStore();
  const { isInWishlist, toggleItem: toggleWishlist } = useWishlistStore();
  const queryClient = useQueryClient();
  const { addItem: addToRecentlyViewed } = useRecentlyViewedStore();

  // Fetch product by slug (or ID as fallback)
  // Uses native fetch as primary method to avoid axios interceptor issues
  const { data: productData, isLoading, error: queryError, refetch } = useQuery({
    queryKey: queryKeys.products.detail(slug),
    queryFn: async () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api/v1';

      // Try slug endpoint first
      try {
        const res = await fetch(`${apiUrl}/products/slug/${encodeURIComponent(slug)}`, {
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        if (res.ok) {
          const json = await res.json();
          return json.data;
        }
      } catch (e) {
        console.error('[ProductDetail] fetch by slug failed:', e);
      }

      // If slug looks like a MongoDB ObjectId, try by ID
      if (/^[a-f0-9]{24}$/i.test(slug)) {
        try {
          const res = await fetch(`${apiUrl}/products/${slug}`, {
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
          });
          if (res.ok) {
            const json = await res.json();
            return json.data;
          }
        } catch (e) {
          console.error('[ProductDetail] fetch by ID failed:', e);
        }
      }

      // Final fallback: try via axios (productsApi)
      try {
        return await productsApi.getBySlug(slug);
      } catch (err: any) {
        if (/^[a-f0-9]{24}$/i.test(slug)) {
          return await productsApi.getById(slug);
        }
        throw err;
      }
    },
    enabled: !!slug,
    retry: 2,
  });

  // Extract product and related products from response
  const product = productData;
  const relatedProducts = productData?.relatedProducts || [];
  const frequentlyBoughtTogether = productData?.frequentlyBoughtTogether || [];

  // Add to recently viewed
  useEffect(() => {
    if (product?._id) {
      addToRecentlyViewed(product._id);
      if (isAuthenticated) {
        userApi.addToRecentlyViewed(product._id).catch(() => {});
      }
    }
  }, [product?._id, isAuthenticated, addToRecentlyViewed]);

  // Initialize bundle selection when frequently bought together data loads
  useEffect(() => {
    if (frequentlyBoughtTogether.length > 0) {
      const initial: Record<string, boolean> = {};
      frequentlyBoughtTogether.forEach((p: any) => { initial[p._id] = true; });
      setSelectedBundleItems(initial);
    }
  }, [frequentlyBoughtTogether]);

  const isWishlisted = product ? isInWishlist(product._id) : false;

  // ── Variants ───────────────────────────────────────────────────────────────
  // Optional. With no variants everything below collapses to the previous
  // behaviour (base price, product-level stock). The server re-derives price and
  // stock from the variantId on every add-to-cart and at order creation — what's
  // rendered here is a preview of the server's answer, never the source of truth.
  const variants: any[] = product?.variants || [];
  const hasVariants = variants.length > 0;
  const selectedVariant = hasVariants
    ? variants.find((v: any) => v.id === selectedVariantId)
    : undefined;

  // Variants sharing a `name` form one selector row (e.g. all the "Colour" pills),
  // in first-seen order. Derived rather than stored so it can never drift.
  const variantGroups: { name: string; options: any[] }[] = [];
  for (const v of variants) {
    const group = variantGroups.find((g) => g.name === v.name);
    if (group) group.options.push(v);
    else variantGroups.push({ name: v.name, options: [v] });
  }

  // Pre-select the flagged default, else the first option that's actually buyable.
  useEffect(() => {
    if (!hasVariants) {
      setSelectedVariantId(null);
      return;
    }
    const preferred =
      variants.find((v: any) => v.isDefault && v.stockQuantity > 0) ||
      variants.find((v: any) => v.stockQuantity > 0) ||
      variants[0];
    setSelectedVariantId(preferred?.id ?? null);
    setQuantity(1);
    // Re-run only when the product itself changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?._id, hasVariants]);

  // Jump the gallery to the selected variant's image when it's part of the gallery.
  useEffect(() => {
    if (!selectedVariant?.image) return;
    const index = (product?.images || []).findIndex((img: any) => img.url === selectedVariant.image);
    if (index >= 0) setSelectedImage(index);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVariantId]);

  const basePrice = product?.discount
    ? getDiscountedPrice(product.price, product.discount)
    : product?.price || 0;
  // Effective price = discounted base price + the variant's modifier. Mirrors
  // `resolveLinePricing` on the server exactly. VAT/shipping math is untouched.
  const finalPrice = basePrice + (selectedVariant?.priceModifier || 0);

  // A selected variant's own stock is authoritative for this page.
  const productStock = hasVariants
    ? selectedVariant?.stockQuantity ?? 0
    : product?.stockQuantity ?? product?.stock ?? 0;
  const stockStatus = product ? getStockStatus(productStock) : null;

  // Variant image wins the hero slot even when it isn't in the gallery.
  const variantOnlyImage =
    selectedVariant?.image &&
    !(product?.images || []).some((img: any) => img.url === selectedVariant.image)
      ? selectedVariant.image
      : null;
  const heroImage = variantOnlyImage
    ? { url: variantOnlyImage, alt: `${product?.title} — ${selectedVariant?.value}` }
    : product?.images?.[selectedImage];
  // Same thresholds as getStockStatus/getSocialProof — only the wording is localised.
  const stockLabel = !stockStatus
    ? null
    : stockStatus.status === 'out_of_stock'
      ? t('product.outOfStock')
      : stockStatus.status === 'low_stock'
        ? t('product.lowStock', { count: productStock })
        : t('product.inStock');
  const soldCount = product?.soldCount || 0;
  const socialProof = !product
    ? null
    : soldCount >= 20
      ? t('shop.product.boughtToday', { count: soldCount })
      : soldCount >= 10
        ? t('shop.product.popularSold', { count: soldCount })
        : soldCount >= 5
          ? t('shop.product.trendingSold', { count: soldCount })
          : productStock > 0 && productStock <= 5
            ? t('shop.product.onlyLeftInStock', { count: productStock })
            : null;

  // Delivery promise + estimate — all values sourced from store settings
  const minDeliveryDays = Math.max(1, settings.estimatedDeliveryDays || 3);
  const maxDeliveryDays = minDeliveryDays + 2;
  const qualifiesForFreeShipping =
    settings.enableFreeShipping && finalPrice >= settings.freeShippingThreshold;

  // Reveal the sticky mobile bar once the main add-to-cart block leaves the viewport
  useEffect(() => {
    const el = addToCartRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [product?._id]);

  const handleAddToCart = async () => {
    // Variant stock when an option is selected, product stock otherwise.
    const stock = productStock;
    if (!product || stock === 0) {
      toast.error(t('shop.toast.outOfStock'));
      return;
    }

    try {
      // Sync with backend first — the server re-validates the variant's stock
      // and price from the DB before accepting the line.
      await cartApi.addItem(product._id, quantity, selectedVariant?.id);

      // Then update local state
      addItem({
        productId: product._id,
        product: {
          id: product._id,
          title: product.title,
          slug: product.slug,
          price: product.price,
          discount: product.discount,
          images: product.images,
          stock: stock,
        },
        quantity,
        // Carry the chosen option through to the cart, drawer and checkout so
        // the order records the exact variant the customer picked.
        ...(selectedVariant && {
          variantId: selectedVariant.id,
          variantName: selectedVariant.name,
          variantValue: selectedVariant.value,
        }),
      });

      toast.success(t('shop.toast.addedToCart'));
      openCart();
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.response?.data?.message || t('shop.toast.addToCartFailed'));
    }
  };

  const handleToggleWishlist = async () => {
    if (!product) return;

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

  const handleShare = async () => {
    try {
      await navigator.share({
        title: product?.title,
        url: window.location.href,
      });
    } catch {
      navigator.clipboard.writeText(window.location.href);
      toast.success(t('shop.toast.linkCopied'));
    }
  };

  if (isLoading) {
    return (
      <div className="container-custom py-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          <Skeleton variant="rounded" className="aspect-square" />
          <div className="space-y-4">
            <Skeleton variant="text" width="30%" height={16} />
            <Skeleton variant="text" height={32} />
            <Skeleton variant="text" lines={3} />
            <Skeleton variant="text" width="50%" height={24} />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container-custom py-16 text-center">
        <h1 className="text-2xl font-semibold text-dark-900">{t('shop.product.notFound')}</h1>
        <p className="mt-2 text-dark-500">{t('shop.product.notFoundHint')}</p>
        {queryError && (
          <p className="mt-2 text-sm text-error-500">
            {t('common.error')}: {(queryError as any)?.response?.data?.error || (queryError as any)?.message || ''}
          </p>
        )}
        <div className="mt-4 flex items-center justify-center gap-3">
          <Button variant="outline" onClick={() => refetch()}>
            {t('common.retry')}
          </Button>
          <Link href="/products">
            <Button variant="primary">
              {t('shop.browseProducts')}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-beige-50 min-h-screen">
      {/* Sticky mobile add-to-cart — appears when the main CTA is out of view.
          Offset above the mobile bottom nav (4rem). */}
      <AnimatePresence>
        {showStickyBar && (
          <motion.div
            initial={{ y: 80 }}
            animate={{ y: 0 }}
            exit={{ y: 80 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden fixed bottom-16 start-0 end-0 z-40 bg-white border-t border-beige-200 shadow-soft-lg px-4 py-3 flex items-center gap-3"
          >
            <div className="min-w-0 flex-1">
              <p className="text-xs text-dark-500 truncate">{product.title}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-base font-bold text-dark-900 ltr-nums">
                  {formatCurrency(finalPrice)}
                </span>
                {product.discount && product.discount > 0 && (
                  <span className="text-xs text-dark-400 line-through ltr-nums">
                    {formatCurrency(product.price + (selectedVariant?.priceModifier || 0))}
                  </span>
                )}
              </div>
            </div>
            <Button
              size="md"
              leftIcon={<HiOutlineShoppingBag size={18} />}
              onClick={handleAddToCart}
              disabled={productStock === 0}
              className="flex-shrink-0"
            >
              {productStock === 0 ? t('product.outOfStock') : t('common.addToCart')}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Breadcrumb */}
      <div className="bg-white border-b border-beige-200">
        <div className="container-custom py-4">
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-dark-500 hover:text-dark-700">
              {t('nav.home')}
            </Link>
            <HiChevronRight className="rtl-flip text-dark-400" size={14} />
            <Link href="/products" className="text-dark-500 hover:text-dark-700">
              {t('nav.products')}
            </Link>
            {product.categoryId && (
              <>
                <HiChevronRight className="rtl-flip text-dark-400" size={14} />
                <Link
                  href={`/categories/${product.categoryId.slug || product.categoryId}`}
                  className="text-dark-500 hover:text-dark-700"
                >
                  {product.categoryId.name || t('shop.breadcrumb.category')}
                </Link>
              </>
            )}
            <HiChevronRight className="rtl-flip text-dark-400" size={14} />
            <span className="text-dark-900 font-medium truncate max-w-[200px]">
              {product.title}
            </span>
          </nav>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <motion.div
              key={heroImage?.url || selectedImage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative aspect-square bg-white rounded-2xl overflow-hidden"
            >
              {product.discount && product.discount > 0 && (
                <div className="absolute top-4 start-4 z-10">
                  <DiscountBadge percentage={product.discount} />
                </div>
              )}
              {heroImage?.url ? (
                <Image
                  src={heroImage.url}
                  alt={heroImage.alt || product.title}
                  fill
                  className="object-contain p-8"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-beige-400">
                  <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </motion.div>

            {/* Thumbnails */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {product.images.map((image: any, index: number) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={cn(
                      'relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all',
                      selectedImage === index
                        ? 'border-primary-600'
                        : 'border-transparent hover:border-beige-300'
                    )}
                  >
                    <Image
                      src={image.url}
                      alt={image.alt || `${product.title} - ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            {/* Brand */}
            {product.brand && (
              <p className="text-sm text-primary-600 font-medium uppercase tracking-wider">
                {product.brand}
              </p>
            )}

            {/* Title */}
            <h1 className="mt-2 text-2xl lg:text-3xl font-display font-semibold text-dark-900">
              {product.title}
            </h1>

            {/* Rating */}
            {product.averageRating > 0 && (
              <div className="mt-3 flex items-center gap-3">
                <Rating
                  value={product.averageRating}
                  showValue
                  showCount
                  count={product.reviewCount}
                />
              </div>
            )}

            {/* Social Proof */}
            {socialProof && (
              <p className="mt-3 text-sm text-orange-600 font-medium">
                {socialProof}
              </p>
            )}

            {/* Price */}
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-3xl font-bold text-dark-900 ltr-nums">
                {formatCurrency(finalPrice)}
              </span>
              {product.discount && product.discount > 0 && (
                <>
                  <span className="text-lg text-dark-400 line-through ltr-nums">
                    {/* Pre-discount price of the *selected* variant */}
                    {formatCurrency(product.price + (selectedVariant?.priceModifier || 0))}
                  </span>
                  <Badge variant="error">{t('shop.product.savePercent', { percent: product.discount })}</Badge>
                </>
              )}
            </div>

            {/* Stock Status */}
            {stockStatus && (
              <p className={cn('mt-3 text-sm font-medium', stockStatus.color)}>
                {stockLabel}
              </p>
            )}

            {/* Short Description */}
            {product.shortDescription && (
              <p className="mt-4 text-dark-600">{product.shortDescription}</p>
            )}

            {/* Variant selector — one pill row per option name. Out-of-stock
                options stay visible but are disabled and struck through, so the
                customer can see the colour exists and just isn't available. */}
            {hasVariants && (
              <div className="mt-5 space-y-4">
                {variantGroups.map((group) => (
                  <div key={group.name}>
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-medium text-dark-900">
                        {t('shop.product.chooseOption', { name: group.name })}
                      </span>
                      {selectedVariant && selectedVariant.name === group.name && (
                        <span className="text-sm text-dark-500">{selectedVariant.value}</span>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {group.options.map((option: any) => {
                        const isSoldOut = (option.stockQuantity ?? 0) <= 0;
                        const isSelected = option.id === selectedVariantId;
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => {
                              setSelectedVariantId(option.id);
                              setQuantity(1);
                            }}
                            disabled={isSoldOut}
                            aria-pressed={isSelected}
                            title={
                              isSoldOut
                                ? `${option.value} — ${t('shop.product.optionSoldOut')}`
                                : t('shop.product.selectedOption', {
                                    name: option.name,
                                    value: option.value,
                                  })
                            }
                            className={cn(
                              'px-4 py-2 rounded-lg border text-sm font-medium transition-all',
                              isSelected
                                ? 'border-primary-600 bg-primary-50 text-primary-700 ring-1 ring-primary-600'
                                : 'border-beige-300 bg-white text-dark-700 hover:border-beige-400',
                              isSoldOut &&
                                'opacity-50 cursor-not-allowed line-through hover:border-beige-300'
                            )}
                          >
                            {option.value}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Delivery estimate */}
            <div className="mt-5 flex items-start gap-3 p-3 rounded-lg bg-white border border-beige-200">
              <HiOutlineTruck className="text-primary-600 flex-shrink-0 mt-0.5" size={20} />
              <div className="text-sm">
                <p className="font-medium text-dark-900">
                  {t('product.arrivesIn', { min: minDeliveryDays, max: maxDeliveryDays })}
                </p>
                <p className="mt-0.5 text-dark-500">
                  {qualifiesForFreeShipping
                    ? t('shop.product.freeDeliveryOnOrder')
                    : settings.enableFreeShipping
                      ? t('shop.product.deliveryFeeFreeOver', {
                          fee: formatCurrency(settings.shippingFee, settings.currency),
                          threshold: formatCurrency(settings.freeShippingThreshold, settings.currency),
                        })
                      : t('shop.product.deliveryFee', {
                          fee: formatCurrency(settings.shippingFee, settings.currency),
                        })}
                </p>
              </div>
            </div>

            {/* Quantity & Actions */}
            <div ref={addToCartRef} className="mt-6 space-y-4">
              {/* Quantity Selector */}
              <div className="flex items-center gap-4">
                <span className="text-sm text-dark-600">{t('common.quantity')}</span>
                <div className="flex items-center gap-3 p-1 bg-beige-100 rounded-lg">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    aria-label={t('shop.a11y.decreaseQty')}
                    className="p-2 text-dark-600 hover:text-dark-900 disabled:opacity-50"
                  >
                    <HiMinus size={16} />
                  </button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(productStock, q + 1))}
                    disabled={quantity >= productStock}
                    aria-label={t('shop.a11y.increaseQty')}
                    className="p-2 text-dark-600 hover:text-dark-900 disabled:opacity-50"
                  >
                    <HiPlus size={16} />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  size="lg"
                  fullWidth
                  leftIcon={<HiOutlineShoppingBag size={20} />}
                  onClick={handleAddToCart}
                  disabled={productStock === 0}
                >
                  {productStock === 0 ? t('product.outOfStock') : t('common.addToCart')}
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={handleToggleWishlist}
                  aria-label={isWishlisted ? t('product.removeFromWishlist') : t('product.addToWishlist')}
                  className={isWishlisted ? 'text-error-500' : ''}
                >
                  {isWishlisted ? <HiHeart size={20} /> : <HiOutlineHeart size={20} />}
                </Button>
                <Button variant="secondary" size="lg" onClick={handleShare} aria-label={t('shop.share')}>
                  <HiOutlineShare size={20} />
                </Button>
              </div>
            </div>

            {/* Trust row */}
            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="flex flex-col items-center text-center p-3 bg-beige-50 rounded-lg">
                <HiOutlineShieldCheck className="text-primary-600" size={24} />
                <span className="mt-2 text-xs font-medium text-dark-800">
                  {t('shop.product.warrantyLabel', {
                    value: product.warranty || t('shop.product.defaultWarranty'),
                  })}
                </span>
                <span className="text-[10px] text-dark-500">{t('shop.product.officialCoverage')}</span>
              </div>
              <div className="flex flex-col items-center text-center p-3 bg-beige-50 rounded-lg">
                <HiCheck className="text-primary-600" size={24} />
                <span className="mt-2 text-xs font-medium text-dark-800">{t('product.authorizedDealer')}</span>
                <span className="text-[10px] text-dark-500">{t('shop.product.genuine')}</span>
              </div>
              <div className="flex flex-col items-center text-center p-3 bg-beige-50 rounded-lg">
                <HiOutlineRefresh className="text-primary-600" size={24} />
                <span className="mt-2 text-xs font-medium text-dark-800">{t('product.easyReturns')}</span>
                <span className="text-[10px] text-dark-500">{t('shop.product.returnWindow')}</span>
              </div>
            </div>

            {/* Tax note — rate and label come from store settings */}
            {settings.enableTax && (
              <p className="mt-3 text-xs text-dark-500 text-center">
                {t('product.vatIncluded', { rate: settings.taxRate, label: settings.taxLabel })}
              </p>
            )}

            {/* SKU */}
            {/* The selected variant's SKU is the one that ships */}
            {(selectedVariant?.sku || product.sku) && (
              <p className="mt-6 text-sm text-dark-400">
                {t('product.sku')}:{' '}
                <span className="ltr-nums">{selectedVariant?.sku || product.sku}</span>
              </p>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-12">
          <div className="border-b border-beige-200">
            <nav className="flex gap-8 overflow-x-auto">
              {[
                { id: 'description', label: t('product.description') },
                { id: 'specs', label: t('product.specifications') },
                { id: 'reviews', label: t('shop.product.reviewsCount', { count: product.reviewCount || 0 }) },
                { id: 'faq', label: t('product.faq') },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    'pb-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                    activeTab === tab.id
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-dark-500 hover:text-dark-700'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="py-8">
            <AnimatePresence mode="wait">
              {activeTab === 'description' && (
                <motion.div
                  key="description"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="prose prose-sm max-w-none"
                >
                  <div
                    dangerouslySetInnerHTML={{
                      __html: product.description || t('shop.product.noDescription'),
                    }}
                  />
                  {product.deliveryNotes && (
                    <div className="mt-6 p-4 bg-beige-50 rounded-lg">
                      <h3 className="text-sm font-semibold text-dark-900">
                        {t('shop.product.deliveryInstallation')}
                      </h3>
                      <p className="mt-2 text-sm text-dark-600">
                        {product.deliveryNotes}
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'specs' && (
                <motion.div
                  key="specs"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {product.specs && product.specs.length > 0 ? (() => {
                    // Group specs by their group field
                    const grouped: Record<string, any[]> = {};
                    product.specs.forEach((spec: any) => {
                      const group = spec.group || t('shop.product.generalSpecs');
                      if (!grouped[group]) grouped[group] = [];
                      grouped[group].push(spec);
                    });
                    const groupNames = Object.keys(grouped);

                    return (
                      <div className="space-y-8">
                        {groupNames.map((groupName) => (
                          <div key={groupName}>
                            <h3 className="text-lg font-semibold text-dark-900 mb-3 pb-2 border-b border-beige-200">
                              {groupName}
                            </h3>
                            <div className="rounded-lg overflow-hidden border border-beige-200">
                              {grouped[groupName].map((spec: any, index: number) => (
                                <div
                                  key={index}
                                  className={`flex justify-between items-center px-4 py-3 ${
                                    index % 2 === 0 ? 'bg-beige-50' : 'bg-white'
                                  }`}
                                >
                                  <span className="text-sm text-dark-500 font-medium">{spec.name}</span>
                                  <span className="text-sm text-dark-900 text-end max-w-[60%]">
                                    {spec.value}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })() : (
                    <p className="text-dark-500">{t('shop.product.noSpecs')}</p>
                  )}
                </motion.div>
              )}

              {activeTab === 'reviews' && (
                <motion.div
                  key="reviews"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <ProductReviews
                    productId={product._id}
                    productTitle={product.title}
                    averageRating={product.averageRating}
                    reviewCount={product.reviewCount}
                    ratingDistribution={product.ratingDistribution}
                  />
                </motion.div>
              )}

              {activeTab === 'faq' && (
                <motion.div
                  key="faq"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {product.faqs && product.faqs.length > 0 ? (
                    <div className="space-y-4">
                      {product.faqs.map((faq: any, index: number) => (
                        <Card key={index} padding="md">
                          <h4 className="font-medium text-dark-900">{faq.question}</h4>
                          <p className="mt-2 text-sm text-dark-600">{faq.answer}</p>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-dark-500">{t('shop.product.noFaqs')}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Frequently Bought Together */}
        {frequentlyBoughtTogether.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-display font-semibold text-dark-900 mb-6">
              {t('shop.product.frequentlyBought')}
            </h2>
            <div className="bg-white rounded-xl p-6 border border-beige-200">
              <div className="flex flex-wrap items-center gap-4">
                {/* Current product */}
                <div className="flex flex-col items-center w-32 shrink-0">
                  <div className="w-24 h-24 bg-beige-50 rounded-lg overflow-hidden mb-2">
                    {product.images?.[0]?.url && (
                      <img src={product.images[0].url} alt={product.title} className="w-full h-full object-contain p-2" />
                    )}
                  </div>
                  <p className="text-xs text-dark-600 text-center line-clamp-2">{product.title}</p>
                  <p className="text-sm font-semibold text-dark-900 mt-1 ltr-nums">{formatCurrency(finalPrice)}</p>
                </div>

                {frequentlyBoughtTogether.map((bp: any) => {
                  const bpPrice = bp.discount ? getDiscountedPrice(bp.price, bp.discount) : bp.price;
                  return (
                    <div key={bp._id} className="flex items-center gap-4">
                      <span className="text-2xl text-dark-300 font-light">+</span>
                      <div className="flex flex-col items-center w-32 shrink-0">
                        <label className="cursor-pointer w-full flex flex-col items-center">
                          <input
                            type="checkbox"
                            checked={selectedBundleItems[bp._id] || false}
                            onChange={(e) => setSelectedBundleItems(prev => ({ ...prev, [bp._id]: e.target.checked }))}
                            className="mb-1 accent-primary-600"
                          />
                          <Link href={`/products/${bp.slug}`} className="block">
                            <div className="w-24 h-24 bg-beige-50 rounded-lg overflow-hidden mb-2">
                              {bp.images?.[0]?.url && (
                                <img src={bp.images[0].url} alt={bp.title} className="w-full h-full object-contain p-2" />
                              )}
                            </div>
                          </Link>
                          <p className="text-xs text-dark-600 text-center line-clamp-2">{bp.title}</p>
                          <p className="text-sm font-semibold text-dark-900 mt-1 ltr-nums">{formatCurrency(bpPrice)}</p>
                        </label>
                      </div>
                    </div>
                  );
                })}

                {/* Total and Add All button */}
                <div className="ms-auto flex flex-col items-center gap-2 min-w-[160px]">
                  <p className="text-sm text-dark-500">{t('shop.product.bundlePrice')}</p>
                  <p className="text-2xl font-bold text-dark-900 ltr-nums">
                    {formatCurrency(
                      finalPrice +
                      frequentlyBoughtTogether
                        .filter((bp: any) => selectedBundleItems[bp._id])
                        .reduce((sum: number, bp: any) => sum + (bp.discount ? getDiscountedPrice(bp.price, bp.discount) : bp.price), 0)
                    )}
                  </p>
                  <Button
                    size="sm"
                    onClick={async () => {
                      try {
                        // Add current product with whichever option is selected
                        await cartApi.addItem(product._id, 1, selectedVariant?.id);
                        addItem({
                          productId: product._id,
                          product: { id: product._id, title: product.title, slug: product.slug, price: product.price, discount: product.discount, images: product.images, stock: productStock },
                          quantity: 1,
                        });
                        // Add selected bundle items
                        for (const bp of frequentlyBoughtTogether) {
                          if (selectedBundleItems[bp._id]) {
                            await cartApi.addItem(bp._id, 1);
                            addItem({
                              productId: bp._id,
                              product: { id: bp._id, title: bp.title, slug: bp.slug, price: bp.price, discount: bp.discount, images: bp.images, stock: bp.stockQuantity || bp.stock || 0 },
                              quantity: 1,
                            });
                          }
                        }
                        toast.success(t('shop.toast.bundleAdded'));
                        openCart();
                      } catch (error: any) {
                        toast.error(error.response?.data?.message || t('shop.toast.addItemsFailed'));
                      }
                    }}
                    leftIcon={<HiOutlineShoppingBag size={16} />}
                  >
                    {t('shop.product.addAllToCart')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Related Products */}
        {relatedProducts && relatedProducts.length > 0 && (
          <div className="mt-16">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-display font-semibold text-dark-900">
                  {t('shop.product.alsoViewed')}
                </h2>
                <p className="mt-1 text-sm text-dark-500">
                  {t('shop.product.similarHint')}
                </p>
              </div>
              <Link
                href={`/products${product.categoryId?.slug ? `?category=${(product.categoryId as any)._id || ''}` : ''}`}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium hidden sm:flex items-center gap-1"
              >
                {t('shop.product.viewMore')}
                <HiChevronRight className="rtl-flip" size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {relatedProducts.slice(0, 8).map((rp: any) => (
                <ProductCard key={rp._id} product={rp} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

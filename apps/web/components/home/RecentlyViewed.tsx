'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { HiArrowRight, HiChevronLeft, HiChevronRight } from 'react-icons/hi';
import { productsApi } from '@/lib/api';
import { ProductCard } from '@/components/product/ProductCard';
import { useRecentlyViewedStore } from '@/lib/store';
import { useSettings } from '@/lib/settings-context';
import { useI18n } from '@/lib/i18n';

/**
 * Horizontal rail of products the visitor recently opened.
 * IDs come from the persisted `useRecentlyViewedStore` (written on every
 * product-detail view). Renders nothing until hydrated / when empty.
 */
export function RecentlyViewed() {
  const { t, isRtl } = useI18n();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const { settings } = useSettings();
  const items = useRecentlyViewedStore((state) => state.items);

  // zustand/persist rehydrates on the client only — avoid an SSR/client mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const limit = settings.recentlyViewedLimit || 10;
  const ids = items.slice(0, limit);
  const enabled = mounted && settings.enableRecentlyViewed !== false && ids.length > 0;

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['recently-viewed-products', ids],
    queryFn: async () => {
      const results = await Promise.all(
        ids.map((id) => productsApi.getById(id).catch(() => null))
      );
      // Preserve store order (most recent first) and drop deleted products
      return results.filter(Boolean) as any[];
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  if (!enabled) return null;
  if (!isLoading && products.length === 0) return null;

  // 'prev'/'next' follow reading order. In an RTL scroller scrollLeft runs
  // negative, so the delta is inverted to keep the buttons meaning the same.
  const scroll = (dir: 'prev' | 'next') => {
    if (!scrollRef.current) return;
    const delta = (dir === 'prev' ? -300 : 300) * (isRtl ? -1 : 1);
    scrollRef.current.scrollBy({ left: delta, behavior: 'smooth' });
  };

  return (
    <section className="bg-beige-50 border-b border-beige-100">
      <div className="container-custom py-10 sm:py-12">
        {/* Header */}
        <div className="flex items-end justify-between mb-6">
          <div>
            <span className="text-xs font-semibold text-primary-600 uppercase tracking-wider">
              {t('home.pickUpWhereYouLeftOff')}
            </span>
            <h2 className="mt-1 text-xl sm:text-2xl font-display font-bold text-dark-900">
              {t('home.recentlyViewed')}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scroll('prev')}
              className="hidden sm:flex w-8 h-8 items-center justify-center rounded-full border border-beige-200 text-dark-600 hover:border-dark-300 hover:text-dark-900 transition-colors"
              aria-label={t('common.previous')}
            >
              <HiChevronLeft size={18} className="rtl-flip" />
            </button>
            <button
              type="button"
              onClick={() => scroll('next')}
              className="hidden sm:flex w-8 h-8 items-center justify-center rounded-full border border-beige-200 text-dark-600 hover:border-dark-300 hover:text-dark-900 transition-colors"
              aria-label={t('common.next')}
            >
              <HiChevronRight size={18} className="rtl-flip" />
            </button>
            <Link
              href="/products"
              className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
            >
              {t('home.browseAll')} <HiArrowRight size={14} className="rtl-flip" />
            </Link>
          </div>
        </div>

        {/* Horizontal scroll carousel */}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 sm:mx-0 sm:px-0"
        >
          {isLoading
            ? Array.from({ length: Math.min(ids.length, 6) }).map((_, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-[140px] sm:w-[160px] md:w-[180px] h-[260px] bg-beige-100 rounded-xl animate-pulse"
                />
              ))
            : products.map((product: any) => (
                <div
                  key={product._id}
                  className="flex-shrink-0 w-[140px] sm:w-[160px] md:w-[180px]"
                >
                  <ProductCard product={product} variant="compact" />
                </div>
              ))}
        </div>
      </div>
    </section>
  );
}

export default RecentlyViewed;

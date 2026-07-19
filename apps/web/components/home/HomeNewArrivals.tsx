'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { HiArrowRight, HiChevronLeft, HiChevronRight } from 'react-icons/hi';
import { productsApi } from '@/lib/api';
import { ProductCard } from '@/components/product/ProductCard';
import { RAIL_CARD_WIDTH } from './ProductRail';
import { useCmsContent } from '@/lib/use-cms-content';
import { useSectionHeading } from '@/lib/use-section-heading';
import { useI18n } from '@/lib/i18n';

function parseCmsJson(data: any, fallback: any) {
  try {
    if (data?.value) {
      return typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
    }
  } catch {}
  return fallback;
}

const defaultSettings = {
  enabled: true,
  title: 'New Arrivals',
  subtitle: 'Fresh picks just landed',
  count: 10,
};

export function HomeNewArrivals() {
  const { t, isRtl } = useI18n();
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: cms } = useCmsContent('homepage_new_arrivals');

  const settings = parseCmsJson(cms, defaultSettings);

  // This section has its own editor (New Arrivals) AND appears in the unified
  // Section Headings editor. Its own settings are the more specific of the two,
  // so they win; the shared editor fills in whatever they leave blank. Without
  // this the shared editor would silently do nothing for this one section.
  const heading = useSectionHeading('new_arrivals', {
    title: settings.title || defaultSettings.title,
    subtitle: settings.subtitle || defaultSettings.subtitle,
  });

  const { data: result, isLoading } = useQuery({
    queryKey: ['products-new-arrivals', settings.count],
    queryFn: () => productsApi.getAll({ sort: 'newest', limit: settings.count || 10 }),
    staleTime: 2 * 60 * 1000,
    enabled: settings.enabled !== false,
  });

  const products = result?.products || [];

  if (settings.enabled === false) return null;
  // Hidden from the shared Section Headings editor.
  if (!heading.enabled) return null;
  if (!isLoading && products.length === 0) return null;

  // 'prev'/'next' follow reading order. In an RTL scroller scrollLeft runs
  // negative, so the delta is inverted to keep the buttons meaning the same.
  const scroll = (dir: 'prev' | 'next') => {
    if (!scrollRef.current) return;
    const delta = (dir === 'prev' ? -300 : 300) * (isRtl ? -1 : 1);
    scrollRef.current.scrollBy({ left: delta, behavior: 'smooth' });
  };

  return (
    <section className="bg-white border-b border-beige-100">
      <div className="container-custom py-10 sm:py-12">
        {/* Header */}
        <div className="flex items-end justify-between mb-6">
          <div>
            <span className="text-xs font-semibold text-primary-600 uppercase tracking-wider">
              {heading.subtitle}
            </span>
            <h2 className="mt-1 text-xl sm:text-2xl font-display font-bold text-dark-900">
              {heading.title}
            </h2>
            {/* Short accent rule — matches the other section headers */}
            <span
              aria-hidden
              className="mt-2.5 block h-0.5 w-10 rounded-full bg-primary-600"
            />
          </div>
          <div className="flex items-center gap-2">
            {/* Scroll arrows */}
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
              href="/products?sort=-createdAt"
              className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
            >
              {t('common.viewAll')} <HiArrowRight size={14} className="rtl-flip" />
            </Link>
          </div>
        </div>

        {/* Horizontal scroll carousel */}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 sm:mx-0 sm:px-0"
        >
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-shrink-0  h-[260px] bg-beige-100 rounded-xl animate-pulse"
                />
              ))
            : products.map((product: any) => (
                <div
                  key={product._id}
                  className={`flex-shrink-0 ${RAIL_CARD_WIDTH}`}
                >
                  <ProductCard product={product} variant="compact" />
                </div>
              ))}
        </div>
      </div>
    </section>
  );
}

export default HomeNewArrivals;

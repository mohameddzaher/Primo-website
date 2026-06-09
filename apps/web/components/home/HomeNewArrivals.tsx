'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { HiArrowRight, HiChevronLeft, HiChevronRight } from 'react-icons/hi';
import { productsApi, cmsApi } from '@/lib/api';
import { ProductCard } from '@/components/product/ProductCard';

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
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: cms } = useQuery({
    queryKey: ['cms-homepage_new_arrivals'],
    queryFn: () => cmsApi.getContent('homepage_new_arrivals'),
    staleTime: 5 * 60 * 1000,
  });

  const settings = parseCmsJson(cms, defaultSettings);

  const { data: result, isLoading } = useQuery({
    queryKey: ['products-new-arrivals', settings.count],
    queryFn: () => productsApi.getAll({ sort: '-createdAt', limit: settings.count || 10 }),
    staleTime: 2 * 60 * 1000,
    enabled: settings.enabled !== false,
  });

  const products = result?.products || [];

  if (settings.enabled === false) return null;
  if (!isLoading && products.length === 0) return null;

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -300 : 300, behavior: 'smooth' });
  };

  return (
    <section className="bg-white border-b border-beige-100">
      <div className="container-custom py-10 sm:py-12">
        {/* Header */}
        <div className="flex items-end justify-between mb-6">
          <div>
            <span className="text-xs font-semibold text-primary-600 uppercase tracking-wider">
              {settings.subtitle || defaultSettings.subtitle}
            </span>
            <h2 className="mt-1 text-xl sm:text-2xl font-display font-bold text-dark-900">
              {settings.title || defaultSettings.title}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {/* Scroll arrows */}
            <button
              type="button"
              onClick={() => scroll('left')}
              className="hidden sm:flex w-8 h-8 items-center justify-center rounded-full border border-beige-200 text-dark-600 hover:border-dark-300 hover:text-dark-900 transition-colors"
              aria-label="Scroll left"
            >
              <HiChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              className="hidden sm:flex w-8 h-8 items-center justify-center rounded-full border border-beige-200 text-dark-600 hover:border-dark-300 hover:text-dark-900 transition-colors"
              aria-label="Scroll right"
            >
              <HiChevronRight size={18} />
            </button>
            <Link
              href="/products?sort=newest"
              className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
            >
              View All <HiArrowRight size={14} />
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

export default HomeNewArrivals;

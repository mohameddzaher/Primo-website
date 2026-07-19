'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useQueries, useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { HiArrowRight } from 'react-icons/hi';
import { categoriesApi, productsApi } from '@/lib/api';
import { queryKeys } from '@/lib/query-client';
import { ProductRail } from './ProductRail';
import { getImageUrl, cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';
import { useSectionHeading } from '@/lib/use-section-heading';

/** How many categories get a spotlight row. */
const SPOTLIGHT_COUNT = 3;
/** Products shown beside each spotlight panel. */
// Four are visible beside the panel; the rest are reachable by scrolling.
const PRODUCTS_PER_ROW = 10;

interface SpotlightRowProps {
  category: any;
  products: any[];
  /** Mirrors the layout so consecutive rows don't read as a repeated template. */
  reversed: boolean;
  index: number;
}

function SpotlightRow({ category, products, reversed, index }: SpotlightRowProps) {
  const t = useT();
  const heading = useSectionHeading('category_spotlight', { title: t('home.categorySpotlight') });
  const imageUrl = getImageUrl(category.image);
  const href = `/products?category=${category._id}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ delay: index * 0.05 }}
      className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6 items-stretch"
    >
      {/* Spotlight panel. `order` flips which side it sits on; because the whole
          grid mirrors under dir="rtl", this stays correct in Arabic — it
          alternates relative to the reading direction, not to a fixed "left". */}
      <Link
        href={href}
        className={cn(
          'group relative block h-full min-h-[220px] lg:col-span-1 rounded-2xl overflow-hidden bg-dark-900',
          reversed ? 'lg:order-2' : 'lg:order-1'
        )}
      >
        {imageUrl && (
          <Image
            src={imageUrl}
            alt={category.name}
            fill
            className="object-cover opacity-70 group-hover:opacity-80 group-hover:scale-105 transition-all duration-500"
            sizes="(max-width: 1024px) 100vw, 33vw"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-950/85 via-dark-950/40 to-transparent" />
        <div className="relative h-full flex flex-col justify-end p-5 sm:p-6 text-start">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary-400">
            {heading.title}
          </span>
          <h2 className="mt-1 text-xl sm:text-2xl font-display font-bold text-white">
            {t('home.shopTheCategory', { category: category.name })}
          </h2>
          {category.productCount !== undefined && (
            <p className="mt-1 text-xs text-white/70">
              {t('home.items', { count: category.productCount })}
            </p>
          )}
          <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-white">
            {t('home.spotlightCta')}
            <HiArrowRight size={14} className="rtl-flip" />
          </span>
        </div>
      </Link>

      {/* A live sample of what is actually on that shelf */}
      <div
        className={cn(
          'lg:col-span-3 min-w-0 flex items-center',
          reversed ? 'lg:order-1' : 'lg:order-2'
        )}
      >
        <ProductRail products={products.slice(0, PRODUCTS_PER_ROW)} fitCount={4} className="w-full" />
      </div>
    </motion.div>
  );
}

/**
 * Category spotlights — pairs a category with a live sample of its products.
 * A flat grid of category icons tells a shopper the aisle exists; this shows
 * them the shelf, which is what actually earns the click.
 *
 * Renders one row per category (largest first), alternating the panel from one
 * side to the other so a stack of rows doesn't read as a repeated template.
 * Fully data-driven — no editorial upkeep, and any row whose category has no
 * products simply doesn't render.
 */
export function HomeCategorySpotlight() {
  const spotlight = useSectionHeading('category_spotlight', { title: '' });
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: queryKeys.categories.list(),
    queryFn: categoriesApi.getAll,
    staleTime: 5 * 60 * 1000,
  });

  const parents = (categories as any[]).filter(
    (cat) => !cat.parentId && cat.isActive !== false
  );

  // Prefer categories that have artwork — the panel is image-led, so one
  // without a cover would look broken next to the others.
  const withImage = parents.filter((cat) => getImageUrl(cat.image));
  const pool = withImage.length > 0 ? withImage : parents;
  const leads = [...pool]
    .sort((a, b) => (b.productCount || 0) - (a.productCount || 0))
    .slice(0, SPOTLIGHT_COUNT);

  const productQueries = useQueries({
    queries: leads.map((cat) => ({
      queryKey: ['home-category-spotlight', cat._id],
      queryFn: () =>
        productsApi.getAll({ category: cat._id, sort: 'popularity', limit: PRODUCTS_PER_ROW }),
      staleTime: 5 * 60 * 1000,
    })),
  });

  // Hidden from the homepage editor.

  if (!spotlight.enabled) return null;


  if (categoriesLoading) return null;
  if (productQueries.some((q) => q.isLoading)) return null;

  // Pair each category with its products, dropping any that came back empty.
  const rows = leads
    .map((category, i) => ({
      category,
      products: productQueries[i]?.data?.products || [],
    }))
    .filter((row) => row.products.length > 0);

  if (rows.length === 0) return null;

  return (
    <section className="bg-beige-50 border-b border-beige-100">
      <div className="container-custom py-12 sm:py-16 space-y-4 md:space-y-6">
        {rows.map((row, i) => (
          <SpotlightRow
            key={row.category._id}
            category={row.category}
            products={row.products}
            reversed={i % 2 === 1}
            index={i}
          />
        ))}
      </div>
    </section>
  );
}

export default HomeCategorySpotlight;

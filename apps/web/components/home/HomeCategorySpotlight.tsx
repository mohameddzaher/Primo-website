'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { HiArrowRight } from 'react-icons/hi';
import { categoriesApi, productsApi } from '@/lib/api';
import { queryKeys } from '@/lib/query-client';
import { ProductCard } from '@/components/product/ProductCard';
import { getImageUrl } from '@/lib/utils';
import { useT } from '@/lib/i18n';

/**
 * Category spotlight — pairs one deep category with a live sample of what's in
 * it. A flat grid of category icons tells a shopper the aisle exists; this
 * shows them the shelf, which is what actually pulls a click. The lead category
 * is chosen from the data (largest active parent category that has artwork),
 * so no editorial upkeep is required.
 */
export function HomeCategorySpotlight() {
  const t = useT();

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: queryKeys.categories.list(),
    queryFn: categoriesApi.getAll,
    staleTime: 5 * 60 * 1000,
  });

  const parents = (categories as any[]).filter(
    (cat) => !cat.parentId && cat.isActive !== false
  );

  // Prefer a category with artwork; fall back to the biggest one regardless.
  const withImage = parents.filter((cat) => getImageUrl(cat.image));
  const pool = withImage.length > 0 ? withImage : parents;
  const lead = [...pool].sort(
    (a, b) => (b.productCount || 0) - (a.productCount || 0)
  )[0];

  const { data: productsResult, isLoading: productsLoading } = useQuery({
    queryKey: ['home-category-spotlight', lead?._id],
    queryFn: () =>
      productsApi.getAll({ category: lead._id, sort: 'popularity', limit: 4 }),
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(lead?._id),
  });

  const products = productsResult?.products || [];

  if (categoriesLoading || productsLoading) return null;
  if (!lead || products.length === 0) return null;

  const imageUrl = getImageUrl(lead.image);
  const href = `/products?category=${lead._id}`;

  return (
    <section className="bg-beige-50 border-b border-beige-100">
      <div className="container-custom py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 items-stretch">
          {/* Spotlight panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-1"
          >
            <Link
              href={href}
              className="group relative block h-full min-h-[220px] rounded-2xl overflow-hidden bg-dark-900"
            >
              {imageUrl && (
                <Image
                  src={imageUrl}
                  alt={lead.name}
                  fill
                  className="object-cover opacity-70 group-hover:opacity-80 group-hover:scale-105 transition-all duration-500"
                  sizes="(max-width: 1024px) 100vw, 33vw"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-dark-950/85 via-dark-950/40 to-transparent" />
              <div className="relative h-full flex flex-col justify-end p-5 sm:p-6 text-start">
                <span className="text-xs font-semibold uppercase tracking-wider text-primary-400">
                  {t('home.categorySpotlight')}
                </span>
                <h2 className="mt-1 text-xl sm:text-2xl font-display font-bold text-white">
                  {t('home.shopTheCategory', { category: lead.name })}
                </h2>
                {lead.productCount !== undefined && (
                  <p className="mt-1 text-xs text-white/70">
                    {t('home.items', { count: lead.productCount })}
                  </p>
                )}
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-white">
                  {t('home.spotlightCta')}
                  <HiArrowRight size={14} className="rtl-flip" />
                </span>
              </div>
            </Link>
          </motion.div>

          {/* Sample of what's inside */}
          <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-2 md:gap-3">
            {products.slice(0, 4).map((product: any) => (
              <ProductCard key={product._id} product={product} variant="compact" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default HomeCategorySpotlight;

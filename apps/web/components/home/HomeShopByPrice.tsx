'use client';

import Link from 'next/link';
import { useQueries } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { HiArrowRight } from 'react-icons/hi';
import { productsApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { useSettings } from '@/lib/settings-context';
import { useT } from '@/lib/i18n';

const BUCKETS: { id: string; min: number; max: number | '' }[] = [
  { id: 'entry', min: 0, max: 500 },
  { id: 'mid', min: 500, max: 1500 },
  { id: 'premium', min: 1500, max: '' },
];

/**
 * Budget-first entry points into the listing. Shoppers who don't know the
 * category they want almost always know the money they want to spend, so this
 * is often the highest-intent path off the homepage. Each tile is a real
 * filtered listing URL and carries a live product count; buckets with nothing
 * in them are dropped, and the whole section hides when the catalogue is empty.
 */
export function HomeShopByPrice() {
  const t = useT();
  const { settings } = useSettings();
  const currency = settings.currency;

  // One cheap count query per bucket — limit 1 so only the pagination total
  // is meaningfully transferred.
  const results = useQueries({
    queries: BUCKETS.map((bucket) => ({
      queryKey: ['home-price-bucket', bucket.id],
      queryFn: () =>
        productsApi.getAll({
          minPrice: bucket.min || undefined,
          maxPrice: bucket.max === '' ? undefined : bucket.max,
          limit: 1,
        }),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const isLoading = results.some((r: { isLoading: boolean }) => r.isLoading);

  const buckets = BUCKETS.map((bucket, i) => {
    const params = new URLSearchParams({ minPrice: String(bucket.min) });
    if (bucket.max !== '') params.set('maxPrice', String(bucket.max));
    return {
      ...bucket,
      href: `/products?${params.toString()}`,
      count: results[i].data?.pagination?.total ?? 0,
    };
  }).filter((bucket) => bucket.count > 0);

  // Nothing to merchandise (still loading, or an empty catalogue) — render
  // nothing rather than an empty shell.
  if (isLoading || buckets.length === 0) return null;

  // The "Under"/"Over" qualifier is the existing filter string with its number
  // slot emptied, so the caption stays translated without a new key while the
  // figure itself lives in its own .ltr-nums element.
  const bucketLabel = (bucket: { min: number; max: number | '' }) => {
    const minStr = formatCurrency(bucket.min, currency);
    const maxStr = bucket.max === '' ? '' : formatCurrency(bucket.max, currency);
    if (bucket.max === '') {
      return { text: t('shop.filter.priceOver', { min: '' }).trim(), value: minStr };
    }
    if (bucket.min === 0) {
      return { text: t('shop.filter.priceUnder', { max: '' }).trim(), value: maxStr };
    }
    return { text: '', value: `${minStr} – ${maxStr}` };
  };

  return (
    <section className="bg-beige-50 border-b border-beige-100">
      <div className="container-custom py-12 sm:py-16">
        <div className="text-center max-w-xl mx-auto mb-8">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary-600">
            {t('home.shopByPrice')}
          </span>
          <h2 className="mt-1 text-xl sm:text-2xl font-display font-bold text-dark-900">
            {t('home.shopByPriceHeading')}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          {buckets.map((bucket, index) => {
            const label = bucketLabel(bucket);
            return (
              <motion.div
                key={bucket.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
              >
                <Link
                  href={bucket.href}
                  className="group block h-full rounded-2xl bg-white border border-beige-200 p-5 sm:p-6 hover:border-primary-300 hover:shadow-md transition-all duration-200"
                >
                  {/* Non-breaking space keeps the tiles vertically aligned when
                      a bucket (the mid band) has no qualifier word. */}
                  <p className="text-xs text-dark-400">{label.text || ' '}</p>
                  <p className="mt-1 text-xl sm:text-2xl font-display font-bold text-dark-900">
                    <span className="ltr-nums">{label.value}</span>
                  </p>
                  <p className="mt-2 text-xs text-dark-500">
                    {t('home.items', { count: bucket.count })}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary-600 group-hover:text-primary-700 transition-colors">
                    {t('home.priceBucketCta')}
                    <HiArrowRight size={14} className="rtl-flip" />
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default HomeShopByPrice;

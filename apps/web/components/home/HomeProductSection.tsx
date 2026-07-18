'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { HiArrowRight } from 'react-icons/hi';
import { productsApi } from '@/lib/api';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductGridSkeleton } from '@/components/ui';
import { useCmsContent } from '@/lib/use-cms-content';
import { useT } from '@/lib/i18n';

function parseCmsJson(data: any, fallback: any) {
  try {
    if (data?.value) {
      return typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
    }
  } catch {}
  return fallback;
}

interface HomeProductSectionProps {
  /** Section title shown in heading */
  title: string;
  /** Small eyebrow label above heading */
  subtitle?: string;
  /** Link for "View All" button */
  viewAllHref: string;
  /** Query params forwarded to productsApi.getAll */
  queryParams: Parameters<typeof productsApi.getAll>[0];
  /** Unique query cache key (must be stable) */
  queryKey: string;
  /** Optional background class e.g. "bg-white" or "bg-beige-50" */
  bg?: string;
  /** Dark mode: inverts text colors for dark backgrounds */
  dark?: boolean;
  /** Max products to show */
  limit?: number;
  /** If true, hides the section when no products have a rating > 0 */
  requireRatings?: boolean;
  /** If true, hides the section when nothing has actually sold yet */
  requireSoldCount?: boolean;
  /** CMS tab id to check enabled state from homepage_tabbed_products config */
  tabId?: string;
}

export function HomeProductSection({
  title,
  subtitle,
  viewAllHref,
  queryParams,
  queryKey,
  bg = 'bg-white',
  dark = false,
  limit = 8,
  requireRatings = false,
  requireSoldCount = false,
  tabId,
}: HomeProductSectionProps) {
  const t = useT();

  // Read the tabbed products config to check if this section is enabled
  const { data: tabsCms } = useCmsContent('homepage_tabbed_products');

  const { data: result, isLoading } = useQuery({
    queryKey: [queryKey, limit],
    queryFn: () => productsApi.getAll({ ...queryParams, limit }),
    staleTime: 2 * 60 * 1000,
  });

  const tabsConfig = parseCmsJson(tabsCms, { enabled: true, tabs: [] });

  // Check if globally disabled
  if (tabsConfig.enabled === false) return null;

  // Check if this specific tab/section is disabled
  if (tabId && tabsConfig.tabs?.length > 0) {
    const tabCfg = tabsConfig.tabs.find((t: any) => t.id === tabId);
    if (tabCfg && tabCfg.enabled === false) return null;
  }

  const products = result?.products || [];

  // Auto-hide if requires ratings and no rated products
  if (!isLoading && requireRatings && !products.some((p: any) => p.averageRating && p.averageRating > 0)) {
    return null;
  }

  // A "best sellers" rail is meaningless before anything has sold — the sort
  // would otherwise fall back to an arbitrary ordering of zero-sale products.
  if (!isLoading && requireSoldCount && !products.some((p: any) => p.soldCount && p.soldCount > 0)) {
    return null;
  }

  if (!isLoading && products.length === 0) return null;

  const headingClass = dark ? 'text-white' : 'text-dark-900';
  const subtitleClass = dark ? 'text-primary-400' : 'text-primary-600';
  const viewAllClass = dark
    ? 'text-white/80 hover:text-white border-white/20 hover:border-white/40'
    : 'text-primary-600 hover:text-primary-700';

  return (
    <section className={`${bg} border-b border-beige-100`}>
      <div className="container-custom py-12 sm:py-16">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-7">
          <div>
            {subtitle && (
              <span className={`text-xs font-semibold uppercase tracking-wider ${subtitleClass}`}>
                {subtitle}
              </span>
            )}
            <h2 className={`mt-1 text-xl sm:text-2xl font-display font-bold ${headingClass}`}>
              {title}
            </h2>
          </div>
          <Link
            href={viewAllHref}
            className={`flex-shrink-0 flex items-center gap-1 text-sm font-medium transition-colors ${viewAllClass}`}
          >
            {t('common.viewAll')} <HiArrowRight size={14} className="rtl-flip" />
          </Link>
        </div>

        {/* Grid — centered */}
        {isLoading ? (
          <ProductGridSkeleton count={limit} />
        ) : (
          <div className="flex flex-wrap justify-center gap-2 md:gap-3">
            {products.slice(0, limit).map((product: any) => (
              <div
                key={product._id}
                className="w-[calc(50%-4px)] sm:w-[calc(33.333%-6px)] md:w-[calc(25%-7px)] lg:w-[calc(20%-8px)]"
              >
                <ProductCard product={product} variant="compact" />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default HomeProductSection;

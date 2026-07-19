'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { HiArrowRight } from 'react-icons/hi';
import { productsApi } from '@/lib/api';
import { ProductRail } from './ProductRail';
import { ProductGridSkeleton } from '@/components/ui';
import { getImageUrl } from '@/lib/utils';
import { useCmsContent } from '@/lib/use-cms-content';
import { useI18n } from '@/lib/i18n';
import { useSectionHeading } from '@/lib/use-section-heading';
import type { TranslationKey } from '@/lib/i18n';

function parseCmsJson(data: any, fallback: any) {
  try {
    if (data?.value) {
      return typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
    }
  } catch {}
  return fallback;
}

interface HomeProductSectionProps {
  /** Translation key for the section heading (e.g. 'home.featuredProducts'). */
  titleKey: TranslationKey;
  /** Translation key for the small eyebrow label above the heading. */
  subtitleKey?: TranslationKey;
  /**
   * Layout treatment:
   *  - 'grid'  — heading above a full-width product grid (the quiet default).
   *  - 'panel' — an accent panel carrying the heading and CTA, sitting beside
   *              the products. Related in structure to the category spotlight
   *              but colour/typography-led rather than photo-led, so the page
   *              reads as one system without repeating the same block.
   */
  layout?: 'grid' | 'panel';
  /** Which side the accent panel sits on. Alternate it between panel sections. */
  panelSide?: 'start' | 'end';
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
  /**
   * Identifies this section in the `homepage_product_sections` CMS entry, so an
   * admin can override its heading, eyebrow text and panel artwork.
   *
   * Without this the heading comes only from the translation dictionary and is
   * editable by a developer alone — which is not what "manage the homepage"
   * should mean. Overrides are per-field: anything left blank keeps the
   * translated default, so the section stays bilingual unless someone
   * deliberately replaces the text.
   */
  sectionId?: string;
}

export function HomeProductSection({
  titleKey,
  subtitleKey,
  layout = 'grid',
  panelSide = 'start',
  viewAllHref,
  queryParams,
  queryKey,
  bg = 'bg-white',
  dark = false,
  limit = 8,
  requireRatings = false,
  requireSoldCount = false,
  tabId,
  sectionId,
}: HomeProductSectionProps) {
  const { t } = useI18n();

  // Read the tabbed products config to check if this section is enabled
  const { data: tabsCms } = useCmsContent('homepage_tabbed_products');

  const heading = useSectionHeading(sectionId || '', {
    title: t(titleKey),
    subtitle: subtitleKey ? t(subtitleKey) : undefined,
  });
  const { title, subtitle } = heading;

  const { data: result, isLoading } = useQuery({
    queryKey: [queryKey, limit],
    queryFn: () => productsApi.getAll({ ...queryParams, limit }),
    staleTime: 2 * 60 * 1000,
  });

  const tabsConfig = parseCmsJson(tabsCms, { enabled: true, tabs: [] });

  // Check if globally disabled
  if (tabsConfig.enabled === false) return null;

  // An admin switched this section off in the homepage editor.
  if (!heading.enabled) return null;

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

  // ── Panel layout: image-led panel beside a rail of products ───────────────
  if (layout === 'panel') {
    const reversed = panelSide === 'end';
    // An admin-chosen image wins; otherwise the panel borrows the rail's own
    // best product, which stays on-topic and changes with the catalogue.
    const panelImage =
      heading.image || getImageUrl(products[0]?.images?.[0]);

    return (
      <section className={`${bg} border-b border-beige-100`}>
        <div className="container-custom py-12 sm:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6 items-stretch">
            {/* `order` (not left/right) so it mirrors correctly under dir="rtl"
                and keeps alternating by reading direction. */}
            <div className={`lg:col-span-1 ${reversed ? 'lg:order-2' : 'lg:order-1'}`}>
              <div className="relative h-full min-h-[240px] rounded-2xl overflow-hidden bg-dark-900">
                {panelImage && (
                  <Image
                    src={panelImage}
                    alt=""
                    aria-hidden
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 33vw"
                  />
                )}
                {/* The photo used to sit at opacity-60 UNDER this gradient as
                    well, which stacked two dimmers and left the artwork looking
                    broken rather than atmospheric. The image is now full
                    strength and only the gradient darkens it — enough contrast
                    for the white heading, while the picture stays legible. */}
                <div className="absolute inset-0 bg-gradient-to-t from-dark-950/95 via-dark-950/60 to-dark-950/10" />

                <div className="relative h-full flex flex-col justify-end p-6 sm:p-7 text-start">
                  {subtitle && (
                    <span className="text-xs font-semibold uppercase tracking-wider text-primary-400">
                      {subtitle}
                    </span>
                  )}
                  <h2 className="mt-1 text-2xl sm:text-3xl font-display font-bold text-white leading-tight">
                    {title}
                  </h2>
                  <Link
                    href={viewAllHref}
                    className="mt-5 inline-flex w-fit items-center gap-1.5 rounded-lg bg-white/95 px-4 py-2 text-sm font-semibold text-dark-900 hover:bg-white transition-colors"
                  >
                    {t('common.viewAll')}
                    <HiArrowRight size={14} className="rtl-flip" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Products — same rail, so cards match every other section */}
            <div
              className={`lg:col-span-3 min-w-0 flex items-center ${
                reversed ? 'lg:order-1' : 'lg:order-2'
              }`}
            >
              {isLoading ? (
                <ProductGridSkeleton count={4} />
              ) : (
                <ProductRail products={products.slice(0, limit)} fitCount={4} className="w-full" />
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ── Default layout: heading above a single scrollable rail ────────────────
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
            {/* Short accent rule — ties every section header to the same system */}
            <span
              aria-hidden
              className={`mt-2.5 block h-0.5 w-10 rounded-full ${dark ? 'bg-primary-400' : 'bg-primary-600'}`}
            />
          </div>
          <Link
            href={viewAllHref}
            className={`flex-shrink-0 flex items-center gap-1 text-sm font-medium transition-colors ${viewAllClass}`}
          >
            {t('common.viewAll')} <HiArrowRight size={14} className="rtl-flip" />
          </Link>
        </div>

        {/* One scrollable row — never wraps to a second line */}
        {isLoading ? (
          <ProductGridSkeleton count={limit} />
        ) : (
          <ProductRail products={products.slice(0, limit)} />
        )}
      </div>
    </section>
  );
}

export default HomeProductSection;

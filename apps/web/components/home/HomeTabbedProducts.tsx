'use client';

import { useState } from 'react';
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

type TabId = 'featured' | 'on_sale' | 'top_rated' | 'new_arrivals';

interface TabConfig {
  id: TabId;
  label: string;
  enabled: boolean;
}

const defaultSettings = {
  enabled: true,
  title: 'Shop Our Collection',
  itemsPerTab: 8,
  tabs: [
    { id: 'featured', label: 'Featured', enabled: true },
    { id: 'on_sale', label: 'On Sale', enabled: true },
    { id: 'top_rated', label: 'Top Rated', enabled: true },
    { id: 'new_arrivals', label: 'New Arrivals', enabled: true },
  ] as TabConfig[],
};

function useTabProducts(tab: TabId, limit: number, enabled: boolean) {
  const params: Record<string, any> = { limit };
  if (tab === 'featured') params.featured = true;
  if (tab === 'on_sale') { params.onSale = true; params.sort = '-discount'; }
  if (tab === 'top_rated') params.sort = '-averageRating';
  if (tab === 'new_arrivals') params.sort = '-createdAt';

  return useQuery({
    queryKey: ['tabbed-products', tab, limit],
    queryFn: () => productsApi.getAll(params),
    staleTime: 2 * 60 * 1000,
    enabled,
  });
}

const TAB_LINKS: Record<TabId, string> = {
  featured: '/products?sort=newest&featured=true',
  on_sale: '/products?onSale=true',
  top_rated: '/products?sort=rating',
  new_arrivals: '/products?sort=newest',
};

export function HomeTabbedProducts() {
  const t = useT();
  const { data: cms } = useCmsContent('homepage_tabbed_products');

  const settings = parseCmsJson(cms, defaultSettings);

  const enabledTabs: TabConfig[] = (settings.tabs || defaultSettings.tabs).filter(
    (t: TabConfig) => t.enabled !== false
  );

  const [activeTab, setActiveTab] = useState<TabId>(enabledTabs[0]?.id || 'featured');

  const limit = settings.itemsPerTab || 8;

  const { data: result, isLoading } = useTabProducts(activeTab, limit, settings.enabled !== false);
  const products = result?.products || [];

  if (settings.enabled === false) return null;
  if (enabledTabs.length === 0) return null;

  // Ensure activeTab is valid after settings load
  const validActiveTab = enabledTabs.find((t) => t.id === activeTab) ? activeTab : enabledTabs[0]?.id;

  return (
    <section className="bg-beige-50 border-y border-beige-100">
      <div className="container-custom py-12 sm:py-16">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-display font-bold text-dark-900">
              {settings.title || defaultSettings.title}
            </h2>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 bg-white border border-beige-200 rounded-xl p-1 overflow-x-auto scrollbar-hide">
            {enabledTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  validActiveTab === tab.id
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-dark-600 hover:text-dark-900 hover:bg-beige-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <ProductGridSkeleton count={limit} />
        ) : products.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-3 md:gap-4">
              {products.slice(0, limit).map((product: any) => (
                <ProductCard key={product._id} product={product} variant="compact" />
              ))}
            </div>

            <div className="mt-8 text-center">
              <Link
                href={TAB_LINKS[validActiveTab as TabId] || '/products'}
                className="inline-flex items-center gap-2 px-5 py-2.5 border border-dark-300 text-dark-700 text-sm font-medium rounded-xl hover:bg-dark-50 hover:border-dark-400 transition-colors"
              >
                {t('home.viewAllTab', {
                  label: enabledTabs.find((tab) => tab.id === validActiveTab)?.label ?? '',
                })}
                <HiArrowRight size={14} className="rtl-flip" />
              </Link>
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-dark-400 text-sm">{t('home.noProductsAvailable')}</div>
        )}
      </div>
    </section>
  );
}

export default HomeTabbedProducts;

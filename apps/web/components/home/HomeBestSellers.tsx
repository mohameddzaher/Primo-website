'use client';

import { HomeProductSection } from './HomeProductSection';
import { useT } from '@/lib/i18n';

/**
 * Best Sellers rail — driven by `soldCount`, so it surfaces what customers
 * actually buy rather than what the merchandiser hopes they buy. Thin client
 * wrapper around HomeProductSection purely so the copy can go through useT().
 * Hides itself entirely until at least one product has recorded a sale.
 */
export function HomeBestSellers() {
  const t = useT();

  return (
    <HomeProductSection
      queryKey="products-best-sellers-section"
      title={t('home.bestSellers')}
      subtitle={t('home.bestSellersSubtitle')}
      viewAllHref="/products?sort=popularity"
      queryParams={{ sort: 'popularity' }}
      tabId="best_sellers"
      bg="bg-white"
      limit={10}
      requireSoldCount
    />
  );
}

export default HomeBestSellers;

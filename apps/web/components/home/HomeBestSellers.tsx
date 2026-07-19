'use client';

import { HomeProductSection } from './HomeProductSection';

/**
 * Best Sellers rail — driven by `soldCount`, so it surfaces what customers
 * actually buy rather than what the merchandiser hopes they buy. Uses the panel
 * layout so it reads as a feature rather than another anonymous row.
 * Hides itself entirely until at least one product has recorded a sale.
 */
export function HomeBestSellers() {
  return (
    <HomeProductSection
      queryKey="products-best-sellers-section"
      titleKey="home.bestSellers"
      subtitleKey="home.bestSellersSubtitle"
      layout="panel"
      panelSide="start"
      viewAllHref="/products?sort=-soldCount"
      queryParams={{ sort: 'popularity' }}
      tabId="best_sellers"
      sectionId="best_sellers"
      bg="bg-beige-50"
      limit={8}
      requireSoldCount
    />
  );
}

export default HomeBestSellers;

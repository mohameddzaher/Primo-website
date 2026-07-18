'use client';

import { useQuery } from '@tanstack/react-query';
import { cmsApi } from '@/lib/api';

/**
 * Every CMS key the storefront shell + homepage needs.
 *
 * Previously each section fetched its own key, which meant ~13 separate HTTP
 * round trips to the API (and therefore to MongoDB Atlas) on a single page
 * load. They are now fetched together in ONE request; React Query dedupes by
 * query key, so no matter how many components call `useCmsContent`, only a
 * single network request is made and every section reads from the same cache.
 */
export const STOREFRONT_CMS_KEYS = [
  'homepage_announcement_bar',
  'homepage_topbar_settings',
  'homepage_promo_banners',
  'homepage_quick_strip',
  'homepage_hero_categories',
  'homepage_hero_promos',
  'homepage_tabbed_products',
  'homepage_new_arrivals',
  'homepage_wide_banner',
  'homepage_how_to_order',
  'homepage_why_choose_us',
  'homepage_features',
  'homepage_app_download',
  'homepage_newsletter',
] as const;

export type StorefrontCmsKey = (typeof STOREFRONT_CMS_KEYS)[number];

/** Shared bulk fetch — one request for the whole storefront shell. */
export function useCmsBundle() {
  return useQuery({
    queryKey: ['cms-storefront-bundle'],
    queryFn: () => cmsApi.getMultiple([...STOREFRONT_CMS_KEYS]),
    // CMS content only changes when an admin edits it, and the API busts its
    // own cache on write — so we can hold this for a while on the client.
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

/**
 * Read a single CMS entry out of the shared bundle.
 * Drop-in replacement for the old per-component `cmsApi.getContent(key)` query —
 * returns the same `{ key, value, ... }` document shape.
 */
export function useCmsContent(key: StorefrontCmsKey | string) {
  const { data, isLoading, isError } = useCmsBundle();
  return {
    data: (data as Record<string, any> | undefined)?.[key] ?? null,
    isLoading,
    isError,
  };
}

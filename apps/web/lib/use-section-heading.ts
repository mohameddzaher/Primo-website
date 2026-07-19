'use client';

import { useCmsContent } from './use-cms-content';
import { useI18n } from './i18n';

/**
 * Admin control over every homepage section's heading, eyebrow, artwork and
 * visibility — from a single CMS entry.
 *
 * Each section previously hardcoded its heading via the translation dictionary,
 * so renaming "On Sale" or hiding "Shop by Price" needed a developer. These are
 * the parts of the page a shop owner rewords for a campaign, so they belong in
 * the admin panel.
 *
 * Everything here is an OVERRIDE, never a value. A blank field falls through to
 * the built-in translated text, so an untouched section stays bilingual instead
 * of being frozen into whichever language happened to be typed first. Each
 * language also falls back to the other before the dictionary: an admin who
 * fills in only Arabic gets Arabic, not an English heading under an Arabic page.
 */

export interface SectionHeadingDefaults {
  /** Already-translated fallback heading. */
  title: string;
  /** Already-translated fallback eyebrow/subtitle. */
  subtitle?: string;
}

export interface SectionHeading {
  title: string;
  subtitle?: string;
  /** Admin-chosen artwork; undefined means the section picks its own. */
  image?: string;
  /** False only when an admin explicitly switched the section off. */
  enabled: boolean;
}

/**
 * Every section an admin can control, in the order they appear on the page.
 *
 * `hasImage` marks the sections that draw a single panel photo behind their
 * heading — the only ones where a section-level image field means anything.
 * Every other section's imagery belongs to the records it displays (category
 * artwork, brand logos, product photos, article covers), so it is edited where
 * those records live. `imageSource` says where, because offering a field here
 * that silently changed nothing would be worse than offering none.
 */
export const HOMEPAGE_SECTIONS: Array<{
  id: string;
  name: string;
  /** Renders one admin-selectable photo behind the section heading. */
  hasImage?: boolean;
  /** Where this section's imagery is actually edited, when not here. */
  imageSource?: string;
}> = [
  { id: 'featured', name: 'Featured Products', imageSource: 'Products' },
  { id: 'best_sellers', name: 'Best Sellers', hasImage: true },
  { id: 'on_sale', name: 'On Sale', hasImage: true },
  { id: 'recently_viewed', name: 'Recently Viewed', imageSource: 'Products' },
  { id: 'new_arrivals', name: 'New Arrivals', imageSource: 'Products' },
  { id: 'flash_deals', name: 'Flash Deals', imageSource: 'Products' },
  { id: 'top_rated', name: 'Top Rated', imageSource: 'Products' },
  { id: 'brands', name: 'Brands', imageSource: 'Brands' },
  { id: 'category_spotlight', name: 'Category Spotlight', imageSource: 'Categories' },
  { id: 'shop_by_price', name: 'Shop by Price', imageSource: 'Products' },
  { id: 'categories', name: 'Shop by Category', imageSource: 'Categories' },
  { id: 'buying_guides', name: 'Buying Guides', imageSource: 'Blog' },
  { id: 'testimonials', name: 'Testimonials' },
];

export const SECTION_HEADINGS_CMS_KEY = 'homepage_section_headings';

function parseOverrides(data: any): Record<string, any> {
  try {
    if (data?.value) {
      return typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
    }
  } catch {}
  return {};
}

export function useSectionHeading(
  sectionId: string,
  defaults: SectionHeadingDefaults
): SectionHeading {
  const { locale } = useI18n();
  const { data } = useCmsContent(SECTION_HEADINGS_CMS_KEY as any);

  const override = parseOverrides(data)[sectionId] || {};

  const pick = (en?: string, ar?: string) => {
    const primary = locale === 'ar' ? ar : en;
    const secondary = locale === 'ar' ? en : ar;
    return (primary || '').trim() || (secondary || '').trim() || undefined;
  };

  return {
    title: pick(override.title, override.titleAr) ?? defaults.title,
    subtitle: pick(override.subtitle, override.subtitleAr) ?? defaults.subtitle,
    image: (override.image || '').trim() || undefined,
    // Only an explicit `false` hides a section — an absent entry means
    // "untouched", not "disabled".
    enabled: override.enabled !== false,
  };
}

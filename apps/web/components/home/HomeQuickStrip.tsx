'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '@/lib/api';
import { queryKeys } from '@/lib/query-client';
import { getImageUrl } from '@/lib/utils';
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

interface QuickCard {
  id: string;
  label: string;
  href: string;
  emoji?: string;
  image?: string;
}

function QuickCardItem({ card }: { card: QuickCard }) {
  // Track load failures in state so a broken URL genuinely falls back to the
  // emoji instead of leaving an empty tile.
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = Boolean(card.image) && !imgFailed;

  return (
    <Link
      href={card.href}
      className="group flex-shrink-0 flex flex-col items-center gap-2 w-[72px] sm:w-20"
    >
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-beige-100 relative flex items-center justify-center ring-1 ring-beige-200 group-hover:ring-primary-400 group-hover:shadow-md transition-all duration-200">
        {showImage ? (
          <Image
            src={card.image as string}
            alt={card.label}
            fill
            className="object-cover"
            sizes="64px"
            onError={() => setImgFailed(true)}
          />
        ) : card.emoji ? (
          <span className="text-2xl select-none">{card.emoji}</span>
        ) : (
          <span className="text-2xl select-none">📦</span>
        )}
      </div>
      <span className="text-[10px] sm:text-xs font-medium text-dark-700 text-center leading-tight group-hover:text-primary-600 transition-colors line-clamp-2">
        {card.label}
      </span>
    </Link>
  );
}

export function HomeQuickStrip() {
  const t = useT();
  const { data: settingsCms } = useCmsContent('homepage_quick_strip');

  const settings = parseCmsJson(settingsCms, {
    enabled: true,
    showOnSale: true,
    showNewArrivals: true,
    customShortcuts: [],
  });

  const showOnSale = settings.enabled !== false && settings.showOnSale !== false;
  const showNewArrivals = settings.enabled !== false && settings.showNewArrivals !== false;

  // The two built-in shortcuts borrow artwork from a representative product so
  // the strip is all imagery rather than a mix of photos and emoji. Nothing is
  // hardcoded — the deepest-discounted product stands in for "On Sale" and the
  // freshest product for "New Arrivals".
  const { data: onSaleSample } = useQuery({
    queryKey: ['quick-strip-sample', 'on-sale'],
    queryFn: () => productsApi.getAll({ onSale: true, sort: 'discount', limit: 1 }),
    staleTime: 5 * 60 * 1000,
    enabled: showOnSale,
  });

  const { data: newArrivalSample } = useQuery({
    queryKey: ['quick-strip-sample', 'new-arrivals'],
    queryFn: () => productsApi.getAll({ sort: 'newest', limit: 1 }),
    staleTime: 5 * 60 * 1000,
    enabled: showNewArrivals,
  });

  const onSaleImage = getImageUrl(onSaleSample?.products?.[0]?.images?.[0]);
  const newArrivalImage = getImageUrl(newArrivalSample?.products?.[0]?.images?.[0]);

  if (settings.enabled === false) return null;

  // Build the cards list
  const cards: QuickCard[] = [];

  if (showOnSale) {
    cards.push({
      id: '__on_sale',
      label: t('home.onSale'),
      href: '/products?onSale=true',
      image: onSaleImage,
      emoji: '🏷️',
    });
  }

  if (showNewArrivals) {
    cards.push({
      id: '__new_arrivals',
      label: t('home.newArrivals'),
      href: '/products?newArrivals=true',
      image: newArrivalImage,
      emoji: '✨',
    });
  }

  // Add custom shortcuts
  const customShortcuts: QuickCard[] = Array.isArray(settings.customShortcuts)
    ? settings.customShortcuts
        .filter((s: any) => s.enabled !== false)
        .map((s: any, i: number) => ({ ...s, id: s.id || `__custom_${i}` }))
    : [];
  cards.push(...customShortcuts);

  // NOTE: category shortcuts are deliberately NOT listed here. Every parent
  // category already appears in the header's category bar and mega menu, so
  // repeating them directly beneath the hero was pure duplication and pushed
  // the actual merchandising further down the page. This strip is now only the
  // two campaign entry points (+ any custom shortcuts the admin adds).

  if (cards.length === 0) return null;

  return (
    <section className="bg-beige-50 border-b border-beige-100">
      <div className="container-custom py-4 sm:py-5">
        {/* overflow-x-auto for scroll on mobile; w-max mx-auto centers when items fit */}
        <div className="overflow-x-auto scrollbar-hide pb-1">
          <div className="flex items-center gap-3 sm:gap-4 w-max mx-auto">
            {cards.map((card) => (
              <QuickCardItem key={card.id} card={card} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default HomeQuickStrip;

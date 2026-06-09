'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { categoriesApi, cmsApi } from '@/lib/api';
import { queryKeys } from '@/lib/query-client';
import { getImageUrl } from '@/lib/utils';

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
  return (
    <Link
      href={card.href}
      className="group flex-shrink-0 flex flex-col items-center gap-2 w-[72px] sm:w-20"
    >
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-beige-100 relative flex items-center justify-center ring-1 ring-beige-200 group-hover:ring-primary-400 group-hover:shadow-md transition-all duration-200">
        {card.image ? (
          <Image
            src={card.image}
            alt={card.label}
            fill
            className="object-cover"
            sizes="64px"
            onError={(e) => {
              // Hide broken image and let parent show emoji fallback
              (e.target as HTMLImageElement).style.display = 'none';
            }}
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
  const { data: categories = [] } = useQuery({
    queryKey: queryKeys.categories.list(),
    queryFn: categoriesApi.getAll,
    staleTime: 5 * 60 * 1000,
  });

  const { data: settingsCms } = useQuery({
    queryKey: ['cms-homepage_quick_strip'],
    queryFn: () => cmsApi.getContent('homepage_quick_strip'),
    staleTime: 5 * 60 * 1000,
  });

  const settings = parseCmsJson(settingsCms, {
    enabled: true,
    showOnSale: true,
    showNewArrivals: true,
    customShortcuts: [],
  });

  if (settings.enabled === false) return null;

  // Build the cards list
  const cards: QuickCard[] = [];

  if (settings.showOnSale !== false) {
    cards.push({ id: '__on_sale', label: 'On Sale', href: '/products?onSale=true', emoji: '🏷️' });
  }

  if (settings.showNewArrivals !== false) {
    cards.push({ id: '__new_arrivals', label: 'New Arrivals', href: '/products?newArrivals=true', emoji: '✨' });
  }

  // Add custom shortcuts
  const customShortcuts: QuickCard[] = Array.isArray(settings.customShortcuts)
    ? settings.customShortcuts
        .filter((s: any) => s.enabled !== false)
        .map((s: any, i: number) => ({ ...s, id: s.id || `__custom_${i}` }))
    : [];
  cards.push(...customShortcuts);

  // Add category cards from DB — deduplicate by _id
  const seen = new Set<string>();
  const parentCategories = (categories as any[]).filter((c) => !c.parentId && c.isActive !== false);
  for (const cat of parentCategories) {
    const id = cat._id?.toString();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    cards.push({
      id,
      label: cat.name,
      href: `/products?category=${cat._id}`,
      image: getImageUrl(cat.image) || undefined,
      emoji: cat.icon || '📦',
    });
  }

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

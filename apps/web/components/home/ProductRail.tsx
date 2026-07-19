'use client';

import { useRef } from 'react';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi';
import { ProductCard } from '@/components/product/ProductCard';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/**
 * THE canonical product card width for the homepage.
 *
 * Every rail imports this rather than setting its own grid columns. Previously
 * each section chose its own layout (5-up here, 6-up there, a 4-up grid inside
 * the spotlight), so the same card rendered at noticeably different sizes as
 * you scrolled the page. One token = one card size everywhere.
 */
export const RAIL_CARD_WIDTH = 'w-[168px] sm:w-[184px] lg:w-[200px]';

/**
 * Widths that make exactly N cards fill the rail on large screens (gap-3 =
 * 0.75rem, so N cards leave (N-1) gaps). Written as literal strings because
 * Tailwind's JIT only sees class names it can find in the source.
 *
 * Used beside a panel, where a fixed card width would leave the last card
 * sliced in half by the container edge — which reads as a rendering bug rather
 * than as "scroll for more".
 */
const FIT_WIDTHS: Record<number, string> = {
  3: 'lg:w-[calc((100%-1.5rem)/3)]',
  4: 'lg:w-[calc((100%-2.25rem)/4)]',
  5: 'lg:w-[calc((100%-3rem)/5)]',
};

interface ProductRailProps {
  products: any[];
  /** Show desktop scroll arrows. Off for short rails that never overflow. */
  arrows?: boolean;
  /**
   * Make exactly this many cards fill the rail width on desktop, so none is
   * clipped at the edge. Omit for the standard fixed-width rail.
   */
  fitCount?: 3 | 4 | 5;
  className?: string;
}

/**
 * A single-row, horizontally scrollable product rail.
 *
 * A row that wraps onto a second line reads as a grid and buries the tail of
 * the list; one scrollable row keeps the section a fixed height and signals
 * "there is more this way".
 */
export function ProductRail({ products, arrows = true, fitCount, className }: ProductRailProps) {
  const { t, isRtl } = useI18n();
  const scrollRef = useRef<HTMLDivElement>(null);

  // 'prev'/'next' follow reading order. In an RTL scroller scrollLeft runs
  // negative, so the delta is flipped to keep the arrows meaning the same thing.
  const scroll = (dir: 'prev' | 'next') => {
    if (!scrollRef.current) return;
    const delta = (dir === 'prev' ? -320 : 320) * (isRtl ? -1 : 1);
    scrollRef.current.scrollBy({ left: delta, behavior: 'smooth' });
  };

  if (products.length === 0) return null;

  return (
    <div className={cn('relative group/rail', className)}>
      {arrows && (
        <>
          <button
            type="button"
            onClick={() => scroll('prev')}
            aria-label={t('common.previous')}
            className="hidden lg:flex absolute start-0 top-1/2 -translate-y-1/2 z-10 items-center justify-center w-9 h-9 rounded-full bg-white shadow-soft-lg ring-1 ring-beige-200 text-dark-600 hover:text-primary-600 opacity-0 group-hover/rail:opacity-100 transition-opacity"
          >
            <HiChevronLeft size={18} className="rtl-flip" />
          </button>
          <button
            type="button"
            onClick={() => scroll('next')}
            aria-label={t('common.next')}
            className="hidden lg:flex absolute end-0 top-1/2 -translate-y-1/2 z-10 items-center justify-center w-9 h-9 rounded-full bg-white shadow-soft-lg ring-1 ring-beige-200 text-dark-600 hover:text-primary-600 opacity-0 group-hover/rail:opacity-100 transition-opacity"
          >
            <HiChevronRight size={18} className="rtl-flip" />
          </button>
        </>
      )}

      <div
        ref={scrollRef}
        className="overflow-x-auto scrollbar-hide snap-x snap-mandatory"
      >
        <div className="flex gap-2 md:gap-3 pb-1">
          {products.map((product: any) => (
            <div
              key={product._id}
              className={cn(
                'flex-shrink-0 snap-start',
                RAIL_CARD_WIDTH,
                // Overrides the fixed width at lg so exactly `fitCount` cards
                // span the rail and none is cut off at the edge.
                fitCount ? FIT_WIDTHS[fitCount] : undefined
              )}
            >
              <ProductCard product={product} variant="compact" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ProductRail;

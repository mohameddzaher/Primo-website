'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { HiArrowRight, HiClock } from 'react-icons/hi';
import { offersApi, productsApi } from '@/lib/api';
import { queryKeys } from '@/lib/query-client';
import { ProductCard } from '@/components/product/ProductCard';
import { RAIL_CARD_WIDTH } from './ProductRail';
import { Button, ProductGridSkeleton } from '@/components/ui';
import { useT } from '@/lib/i18n';
import { useSectionHeading } from '@/lib/use-section-heading';

interface CountdownTimerProps {
  endDate: string | Date;
}

function CountdownTimer({ endDate }: CountdownTimerProps) {
  const t = useT();
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(endDate).getTime() - new Date().getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  const timeUnits = [
    { id: 'days', value: timeLeft.days, label: t('home.days') },
    { id: 'hours', value: timeLeft.hours, label: t('home.hours') },
    { id: 'minutes', value: timeLeft.minutes, label: t('home.minutes') },
    { id: 'seconds', value: timeLeft.seconds, label: t('home.seconds') },
  ];

  // Countdown reads left-to-right (days → seconds) in both locales, so the row
  // itself is not mirrored; only the digits are kept LTR.
  return (
    <div className="flex gap-2" dir="ltr">
      {timeUnits.map((unit) => (
        <div
          key={unit.id}
          className="flex flex-col items-center px-2 py-1.5 bg-primary-600 rounded-md"
        >
          <span className="text-base md:text-lg font-bold text-white ltr-nums">
            {unit.value.toString().padStart(2, '0')}
          </span>
          <span className="text-[10px] text-white/90">{unit.label}</span>
        </div>
      ))}
    </div>
  );
}

export function DealsSection() {
  const t = useT();
  const heading = useSectionHeading('flash_deals', { title: t('home.flashDeals'), subtitle: '' });
  // Was the section heading explicitly renamed in the homepage editor? If so it
  // must win over the running offer's own title — otherwise the field appears
  // to do nothing whenever a deal happens to be live, which is precisely when
  // someone is most likely to be editing it.
  const headingOverridden = heading.title !== t('home.flashDeals');

  // Try to fetch a real flash deal from the backend
  const { data: flashDeal, isLoading: isLoadingDeal } = useQuery({
    queryKey: ['flash-deal'],
    queryFn: offersApi.getFlashDeal,
    staleTime: 1000 * 60 * 5,
  });

  // Fallback: fetch products sorted by discount if no flash deal
  const hasFlashDeal = !!flashDeal?.offer;
  // A store-wide offer carries no productIds or categoryIds, so the flash-deal
  // endpoint legitimately returns zero products for it. Treating that as "no
  // deal to show" hid the entire section whenever the live offer happened to be
  // store-wide — the countdown, the heading and all. Fall back to the
  // deepest-discounted products in that case too, so the section still shows
  // the deal it is advertising.
  const flashDealProducts = flashDeal?.products || [];
  const needsFallback = !hasFlashDeal || flashDealProducts.length === 0;

  const { data: fallbackData, isLoading: isLoadingFallback } = useQuery({
    queryKey: queryKeys.products.list({ sort: 'discount', limit: 6 }),
    queryFn: () => productsApi.getAll({ sort: 'discount', limit: 6 }),
    enabled: !isLoadingDeal && needsFallback,
  });

  const products = needsFallback ? fallbackData?.products || [] : flashDealProducts;
  const isLoading = isLoadingDeal || (needsFallback && isLoadingFallback);

  // Only ever count down against a genuine offer end date that is still in the
  // future — never fabricate urgency when there is no real deadline.
  const rawEndsAt = hasFlashDeal ? flashDeal.offer.endsAt : null;
  const parsedEndsAt = rawEndsAt ? new Date(rawEndsAt) : null;
  const dealEndDate =
    parsedEndsAt && !Number.isNaN(parsedEndsAt.getTime()) && parsedEndsAt.getTime() > Date.now()
      ? parsedEndsAt
      : null;

  // Precedence: a live offer's own title (the most specific and timely), then
  // the homepage editor's override, then the translated default.
  const dealTitle = headingOverridden
    ? heading.title
    : hasFlashDeal
      ? flashDeal.offer.title
      : heading.title;

  // Hidden from the homepage editor.
  if (!heading.enabled) return null;

  if (!isLoading && products.length === 0) return null;

  return (
    <section className="py-10 md:py-14 bg-white">
      <div className="container-custom">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-center gap-2 text-primary-600"
            >
              <HiClock size={16} />
              <span className="text-xs font-medium uppercase tracking-wider">
                {dealEndDate ? t('home.limitedTimeOffer') : t('home.bestDiscounts')}
              </span>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="mt-1 text-2xl md:text-3xl font-display font-semibold text-dark-900"
            >
              {dealTitle}
            </motion.h2>
          </div>

          {dealEndDate && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-3"
            >
              <div className="text-xs text-dark-500 font-medium">{t('home.endsIn')}</div>
              <CountdownTimer endDate={dealEndDate} />
            </motion.div>
          )}
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <ProductGridSkeleton count={6} />
        ) : (
          <div className="flex flex-wrap justify-center gap-2 md:gap-3">
            {products.slice(0, 6).map((product: any, index: number) => (
              <motion.div
                key={product._id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className={`flex-shrink-0 ${RAIL_CARD_WIDTH}`}
              >
                <ProductCard product={product} variant="compact" />
              </motion.div>
            ))}
          </div>
        )}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-6 text-center"
        >
          <Link href="/products?onSale=true">
            <Button rightIcon={<HiArrowRight size={16} className="rtl-flip" />}>
              {t('home.viewAllDeals')}
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

export default DealsSection;

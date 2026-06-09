'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { HiArrowRight, HiClock } from 'react-icons/hi';
import { offersApi, productsApi } from '@/lib/api';
import { queryKeys } from '@/lib/query-client';
import { ProductCard } from '@/components/product/ProductCard';
import { Button, ProductGridSkeleton } from '@/components/ui';

interface CountdownTimerProps {
  endDate: string | Date;
}

function CountdownTimer({ endDate }: CountdownTimerProps) {
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
    { value: timeLeft.days, label: 'Days' },
    { value: timeLeft.hours, label: 'Hours' },
    { value: timeLeft.minutes, label: 'Mins' },
    { value: timeLeft.seconds, label: 'Secs' },
  ];

  return (
    <div className="flex gap-2">
      {timeUnits.map((unit) => (
        <div
          key={unit.label}
          className="flex flex-col items-center px-2 py-1.5 bg-primary-600 rounded-md"
        >
          <span className="text-base md:text-lg font-bold text-white">
            {unit.value.toString().padStart(2, '0')}
          </span>
          <span className="text-[10px] text-white/90">{unit.label}</span>
        </div>
      ))}
    </div>
  );
}

export function DealsSection() {
  // Try to fetch a real flash deal from the backend
  const { data: flashDeal, isLoading: isLoadingDeal } = useQuery({
    queryKey: ['flash-deal'],
    queryFn: offersApi.getFlashDeal,
    staleTime: 1000 * 60 * 5,
  });

  // Fallback: fetch products sorted by discount if no flash deal
  const { data: fallbackData, isLoading: isLoadingFallback } = useQuery({
    queryKey: queryKeys.products.list({ sort: 'discount', limit: 6 }),
    queryFn: () => productsApi.getAll({ sort: 'discount', limit: 6 }),
    enabled: !isLoadingDeal && !flashDeal?.offer,
  });

  const hasFlashDeal = !!flashDeal?.offer;
  const products = hasFlashDeal
    ? flashDeal.products || []
    : fallbackData?.products || [];
  const isLoading = isLoadingDeal || (!hasFlashDeal && isLoadingFallback);

  // Use real end date from offer, or fallback to 3 days from now
  const dealEndDate = hasFlashDeal
    ? new Date(flashDeal.offer.endsAt)
    : (() => { const d = new Date(); d.setDate(d.getDate() + 3); d.setHours(23, 59, 59, 999); return d; })();

  const dealTitle = hasFlashDeal ? flashDeal.offer.title : 'Flash Deals';

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
                Limited Time Offer
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

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3"
          >
            <div className="text-xs text-dark-500 font-medium">Ends in:</div>
            <CountdownTimer endDate={dealEndDate} />
          </motion.div>
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
                className="w-[calc(50%-4px)] sm:w-[calc(33.333%-6px)] md:w-[calc(25%-7px)] lg:w-[calc(20%-8px)] xl:w-[calc(16.666%-8px)]"
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
            <Button rightIcon={<HiArrowRight size={16} />}>
              View All Deals
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

export default DealsSection;

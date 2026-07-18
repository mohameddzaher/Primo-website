'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { HiArrowRight } from 'react-icons/hi';
import { productsApi } from '@/lib/api';
import { queryKeys } from '@/lib/query-client';
import { ProductCard } from '@/components/product/ProductCard';
import { Button, ProductGridSkeleton } from '@/components/ui';
import { useT } from '@/lib/i18n';

export function FeaturedProducts() {
  const t = useT();
  const { data: products, isLoading } = useQuery({
    queryKey: queryKeys.products.featured(),
    queryFn: productsApi.getFeatured,
  });

  return (
    <section className="section bg-dark-950">
      <div className="container-custom">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-sm text-primary-400 font-medium uppercase tracking-wider"
            >
              {t('home.featuredSubtitle')}
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="mt-2 text-3xl md:text-4xl font-display font-semibold text-white"
            >
              {t('home.featuredProducts')}
            </motion.h2>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Link href="/products?featured=true">
              <Button variant="ghost" rightIcon={<HiArrowRight size={16} className="rtl-flip" />} className="text-white hover:bg-white/10">
                {t('common.viewAll')}
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <ProductGridSkeleton count={6} />
        ) : (
          <div className="flex flex-wrap justify-center gap-2 md:gap-3">
            {products?.slice(0, 12).map((product: any, index: number) => (
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
      </div>
    </section>
  );
}

export default FeaturedProducts;

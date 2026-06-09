'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { categoriesApi } from '@/lib/api';
import { queryKeys } from '@/lib/query-client';
import { Skeleton } from '@/components/ui';
import { getImageUrl } from '@/lib/utils';

// Smart emoji fallback based on category name keywords
function getCategoryIcon(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('kitchen') || lower.includes('cook')) return '🍳';
  if (lower.includes('coffee') || lower.includes('espresso') || lower.includes('brew')) return '☕';
  if (lower.includes('clean') || lower.includes('vacuum') || lower.includes('sweep')) return '🧹';
  if (lower.includes('laundry') || lower.includes('wash') || lower.includes('dryer')) return '🧺';
  if (lower.includes('fridge') || lower.includes('refriger') || lower.includes('freez')) return '🧊';
  if (lower.includes('air') && (lower.includes('cond') || lower.includes('cool'))) return '❄️';
  if (lower.includes('tv') || lower.includes('screen') || lower.includes('display') || lower.includes('telev')) return '📺';
  if (lower.includes('audio') || lower.includes('sound') || lower.includes('speaker') || lower.includes('headphone')) return '🔊';
  if (lower.includes('phone') || lower.includes('mobile') || lower.includes('smartphone')) return '📱';
  if (lower.includes('laptop') || lower.includes('computer') || lower.includes('pc')) return '💻';
  if (lower.includes('camera') || lower.includes('photo')) return '📸';
  if (lower.includes('gaming') || lower.includes('game') || lower.includes('console')) return '🎮';
  if (lower.includes('iron') || lower.includes('steam')) return '👔';
  if (lower.includes('light') || lower.includes('lamp') || lower.includes('bulb')) return '💡';
  if (lower.includes('outdoor') || lower.includes('garden')) return '🌿';
  if (lower.includes('fan') || lower.includes('heat') || lower.includes('warm')) return '🌡️';
  if (lower.includes('blender') || lower.includes('juicer') || lower.includes('mixer')) return '🫙';
  if (lower.includes('electric')) return '⚡';
  if (lower.includes('small') || lower.includes('appliance')) return '🔌';
  return '📦';
}

export function Categories() {
  const { data: categories, isLoading } = useQuery({
    queryKey: queryKeys.categories.list(),
    queryFn: categoriesApi.getAll,
    staleTime: 5 * 60 * 1000,
  });

  // Deduplicate by _id, filter to active parent categories only — fully DB-driven
  const seen = new Set<string>();
  const parentCategories = (categories || []).filter((cat: any) => {
    if (cat.parentId || cat.isActive === false) return false;
    const id = cat._id?.toString();
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });

  if (!isLoading && parentCategories.length === 0) return null;

  return (
    <section className="py-10 md:py-14 bg-white">
      <div className="container-custom">
        {/* Header — centered */}
        <div className="text-center max-w-xl mx-auto mb-8">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs text-primary-600 font-medium uppercase tracking-wider"
          >
            Shop by Category
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-2 text-2xl md:text-3xl font-display font-semibold text-dark-900"
          >
            Browse Our Collections
          </motion.h2>
        </div>

        {/* Categories Grid */}
        {isLoading ? (
          <div className="flex flex-wrap justify-center gap-2 md:gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="w-[calc(33.333%-6px)] sm:w-[calc(25%-6px)] md:w-[calc(16.666%-8px)]">
                <Skeleton variant="rounded" className="aspect-square" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-2 md:gap-3">
            {parentCategories.slice(0, 12).map((category: any, index: number) => {
              const imageUrl = getImageUrl(category.image);
              const icon = category.icon || getCategoryIcon(category.name);
              return (
                <motion.div
                  key={category._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="w-[calc(33.333%-6px)] sm:w-[calc(25%-6px)] md:w-[calc(16.666%-8px)]"
                >
                  <Link href={`/products?category=${category._id}`} className="group block">
                    {imageUrl ? (
                      /* Photo card — image covers the square, name overlaid at bottom */
                      <div className="aspect-square rounded-xl overflow-hidden relative border-2 border-beige-200 group-hover:border-primary-300 group-hover:shadow-md transition-all duration-200">
                        <Image
                          src={imageUrl}
                          alt={category.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 16vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-dark-900/70 via-dark-900/10 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-2">
                          <h3 className="text-[10px] sm:text-xs font-semibold text-white text-center line-clamp-2 leading-tight drop-shadow">
                            {category.name}
                          </h3>
                          {category.productCount !== undefined && (
                            <p className="text-[9px] sm:text-[10px] text-white/80 text-center">
                              {category.productCount} items
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* Emoji/icon card — clean beige background */
                      <div className="aspect-square rounded-xl bg-beige-50 border-2 border-beige-200 hover:border-primary-200 hover:bg-white hover:shadow-md transition-all duration-200 flex flex-col items-center justify-center p-2 md:p-3 gap-1.5">
                        <span className="text-3xl sm:text-4xl md:text-5xl group-hover:scale-110 transition-transform duration-200 leading-none">
                          {icon}
                        </span>
                        <h3 className="text-[10px] sm:text-xs font-semibold text-dark-800 group-hover:text-primary-600 transition-colors text-center line-clamp-2 leading-tight">
                          {category.name}
                        </h3>
                        {category.productCount !== undefined && (
                          <p className="text-[9px] sm:text-[10px] text-dark-400">
                            {category.productCount} items
                          </p>
                        )}
                      </div>
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export default Categories;

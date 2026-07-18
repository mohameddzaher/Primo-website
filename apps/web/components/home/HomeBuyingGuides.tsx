'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { HiArrowRight } from 'react-icons/hi';
import { blogApi } from '@/lib/api';
import { queryKeys } from '@/lib/query-client';
import { getImageUrl } from '@/lib/utils';
import { useT } from '@/lib/i18n';

/**
 * Buying-guides teaser. Appliances are a considered purchase — a shopper
 * comparing capacities or energy ratings will leave to research elsewhere
 * unless the answer is on-site. Renders nothing at all when no posts are
 * published, so the homepage never shows an empty editorial shell.
 */
export function HomeBuyingGuides() {
  const t = useT();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.blog.posts({ limit: 3, surface: 'home' }),
    queryFn: () => blogApi.getPosts({ limit: 3 }),
    staleTime: 10 * 60 * 1000,
  });

  const posts = data?.posts || [];

  if (isLoading || posts.length === 0) return null;

  return (
    <section className="bg-beige-50 border-b border-beige-100">
      <div className="container-custom py-12 sm:py-16">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-7">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-primary-600">
              {t('home.buyingGuides')}
            </span>
            <h2 className="mt-1 text-xl sm:text-2xl font-display font-bold text-dark-900">
              {t('home.buyingGuidesHeading')}
            </h2>
          </div>
          <Link
            href="/blog"
            className="flex-shrink-0 flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
          >
            {t('home.allGuides')}
            <HiArrowRight size={14} className="rtl-flip" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          {posts.slice(0, 3).map((post: any, index: number) => {
            const cover = getImageUrl(post.featuredImage);
            return (
              <motion.article
                key={post._id || post.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
              >
                <Link
                  href={`/blog/${post.slug}`}
                  className="group block h-full rounded-2xl overflow-hidden bg-white border border-beige-200 hover:border-primary-300 hover:shadow-md transition-all duration-200"
                >
                  <div className="relative aspect-[16/9] bg-beige-100">
                    {cover ? (
                      <Image
                        src={cover}
                        alt={post.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 100vw, 33vw"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-3xl">
                        📖
                      </div>
                    )}
                  </div>
                  <div className="p-4 text-start">
                    {post.categoryId?.name && (
                      <span className="text-[11px] font-medium uppercase tracking-wider text-primary-600">
                        {post.categoryId.name}
                      </span>
                    )}
                    <h3 className="mt-1 text-sm sm:text-base font-semibold text-dark-900 line-clamp-2 group-hover:text-primary-700 transition-colors">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="mt-1.5 text-xs text-dark-500 line-clamp-2">{post.excerpt}</p>
                    )}
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary-600">
                      {t('home.readGuide')}
                      <HiArrowRight size={12} className="rtl-flip" />
                    </span>
                  </div>
                </Link>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default HomeBuyingGuides;

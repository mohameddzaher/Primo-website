'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { bannersApi } from '@/lib/api';

export function HomeSecondaryBanner() {
  const { data: banners = [] } = useQuery({
    queryKey: ['banners-home_secondary'],
    queryFn: () => bannersApi.getByPosition('home_secondary'),
    staleTime: 5 * 60 * 1000,
  });

  const banner = (banners as any[])[0];

  if (!banner) return null;

  const content = (
    <div className="relative w-full h-[140px] sm:h-[180px] overflow-hidden rounded-xl">
      <Image
        src={banner.image}
        alt={banner.title || 'Promotion'}
        fill
        className="object-cover"
        sizes="100vw"
      />
      {(banner.title || banner.subtitle || banner.linkText) && (
        <div className="absolute inset-0 flex items-center px-6 sm:px-10 bg-gradient-to-r from-dark-950/70 via-dark-950/30 to-transparent">
          <div>
            {banner.subtitle && (
              <p className="text-xs font-medium text-primary-300 uppercase tracking-wider mb-1">
                {banner.subtitle}
              </p>
            )}
            {banner.title && (
              <h2 className="text-lg sm:text-2xl font-bold text-white">
                {banner.title}
              </h2>
            )}
            {banner.linkText && banner.link && (
              <span className="inline-block mt-3 px-4 py-1.5 text-xs font-semibold bg-white text-dark-900 rounded-full hover:bg-primary-50 transition-colors">
                {banner.linkText}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <section className="bg-white py-4 sm:py-6">
      <div className="container-custom">
      {banner.link ? (
        <Link href={banner.link} className="block">
          {content}
        </Link>
      ) : (
        content
      )}
      </div>
    </section>
  );
}

export default HomeSecondaryBanner;

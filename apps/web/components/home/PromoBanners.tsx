'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCmsContent } from '@/lib/use-cms-content';
import { useT } from '@/lib/i18n';

interface CMSBanner {
  id: string;
  enabled: boolean;
  imageUrl: string;
  altText: string;
  title: string;
  subtitle: string;
  linkType: string;
  linkValue: string;
  order?: number;
}

interface CMSPromoBanners {
  enabled: boolean;
  banners: CMSBanner[];
}

interface Banner {
  _id: string;
  title: string;
  subtitle?: string;
  image: string;
  mobileImage?: string;
  link?: string;
  linkText?: string;
  isActive: boolean;
}

function BannerCard({ banner, isPrimary }: { banner: Banner; isPrimary: boolean }) {
  const t = useT();
  const href = banner.link || '/products';
  const hasOverlay = !!(banner.title?.trim() || banner.subtitle?.trim());
  const aspectClass = isPrimary ? 'aspect-[21/5]' : 'aspect-[21/3]';

  return (
    <Link
      href={href}
      className={`group relative block w-full overflow-hidden rounded-xl bg-beige-200 ${aspectClass}`}
    >
      {banner.image ? (
        <Image
          src={banner.image}
          alt={banner.title || t('home.promoBannerAlt')}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="100vw"
          priority={isPrimary}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-beige-100 to-beige-300">
          <div className="text-center text-dark-400">
            <div className="text-5xl mb-2">🖼️</div>
            <p className="text-sm font-medium">{t('home.addBannerFromAdmin')}</p>
          </div>
        </div>
      )}

      {hasOverlay && (
        <>
          <div className="absolute inset-0 bg-gradient-to-t from-dark-950/60 via-dark-950/10 to-transparent transition-opacity duration-300 group-hover:from-dark-950/70" />

          <div className="absolute inset-x-0 bottom-0 p-5 flex items-end justify-between gap-4">
            <div className="min-w-0">
              {banner.subtitle && (
                <p className="text-xs font-medium text-white/80 uppercase tracking-wider mb-1">
                  {banner.subtitle}
                </p>
              )}
              {banner.title && (
                <h3
                  className={`font-display font-bold text-white leading-tight ${
                    isPrimary ? 'text-xl sm:text-2xl' : 'text-base sm:text-lg'
                  }`}
                >
                  {banner.title}
                </h3>
              )}
            </div>

            <span className="flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg transition-colors duration-200 group-hover:bg-primary-500">
              {banner.linkText || t('home.shopNow')} <span className="rtl-flip">→</span>
            </span>
          </div>
        </>
      )}

      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-br from-white/5 via-transparent to-transparent" />
    </Link>
  );
}

export function PromoBanners() {
  const { data } = useCmsContent('homepage_promo_banners');

  const cmsData = data?.value ? (typeof data.value === 'string' ? JSON.parse(data.value) : data.value) as CMSPromoBanners : null;

  if (!cmsData?.enabled) return null;

  const activeBanners: Banner[] = cmsData.banners
    .filter((b: CMSBanner) => b.enabled && b.imageUrl)
    .sort((a: CMSBanner, b: CMSBanner) => (a.order ?? 0) - (b.order ?? 0))
    .map((b: CMSBanner) => ({
      _id: b.id,
      title: b.title || '',
      subtitle: b.subtitle || '',
      image: b.imageUrl,
      link: b.linkValue || '/products',
      // No per-banner CTA label in the CMS payload — BannerCard falls back to
      // the translated "Shop Now".
      isActive: true,
    }));

  if (activeBanners.length === 0) return null;

  return (
    <section className="bg-white py-4">
      <div className="container-custom">
        <div className="flex flex-col gap-3">
          {activeBanners.map((banner, index) => (
            <BannerCard key={banner._id} banner={banner} isPrimary={index === 0} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default PromoBanners;

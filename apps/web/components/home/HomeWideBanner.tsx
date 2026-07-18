'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCmsContent } from '@/lib/use-cms-content';
import { useT } from '@/lib/i18n';

interface WideBannerData {
  enabled: boolean;
  imageUrl: string;
  link: string;
  altText: string;
}

export function HomeWideBanner() {
  const t = useT();
  const { data } = useCmsContent('homepage_wide_banner');

  const banner = data?.value
    ? (typeof data.value === 'string' ? JSON.parse(data.value) : data.value) as WideBannerData
    : null;

  if (!banner?.enabled || !banner.imageUrl) return null;

  const content = (
    <div className="relative w-full overflow-hidden bg-beige-100 aspect-[5/1] min-h-[100px] max-h-[320px]">
      <Image
        src={banner.imageUrl}
        alt={banner.altText || t('home.promoBannerAlt')}
        fill
        className="object-cover w-full h-full"
        sizes="100vw"
        priority={false}
      />
    </div>
  );

  return (
    <section className="w-full">
      {banner.link ? (
        <Link href={banner.link} className="block hover:opacity-95 transition-opacity">
          {content}
        </Link>
      ) : (
        content
      )}
    </section>
  );
}

export default HomeWideBanner;

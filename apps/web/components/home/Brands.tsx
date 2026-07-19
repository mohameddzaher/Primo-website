'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { brandsApi } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { useSectionHeading } from '@/lib/use-section-heading';

// Local brand images mapping (name lowercase -> path)
const localBrandImages: Record<string, string> = {
  samsung: '/images/brands/samsung.svg',
  bosch: '/images/brands/bosch.svg',
  carrier: '/images/brands/carrier.svg',
  lg: '/images/brands/lg.png',
  philips: '/images/brands/philips.png',
  delonghi: '/images/brands/delonghi.png',
  "de'longhi": '/images/brands/delonghi.png',
  dyson: '/images/brands/dyson.webp',
  panasonic: '/images/brands/panasonic.png',
  braun: '/images/brands/braun.png',
  kenwood: '/images/brands/kenwood.svg',
  tefal: '/images/brands/tefal.png',
  bissell: '/images/brands/bissell.png',
  clikon: '/images/brands/clikon.png',
  ecovacs: '/images/brands/ecovacs.png',
  jano: '/images/brands/jano.png',
  karcher: '/images/brands/karcher.png',
  kärcher: '/images/brands/karcher.png',
  nutricook: '/images/brands/nutricook.jpg',
  tineco: '/images/brands/tineco.png',
  adison: '/images/brands/adison.webp',
  okka: '/images/brands/okka.webp',
  saif: '/images/brands/saif.webp',
  'black & decker': '/images/brands/blackanddecker.webp',
  'black and decker': '/images/brands/blackanddecker.webp',
  blackanddecker: '/images/brands/blackanddecker.webp',
  'black+decker': '/images/brands/blackanddecker.webp',
  mlay: '/images/brands/mlay.webp',
  ninja: '/images/brands/ninja.webp',
  hover: '/images/brands/hover.webp',
  hoover: '/images/brands/hover.webp',
};

// All brands with local images as fallback
const fallbackBrands = [
  { name: 'Samsung', logo: '/images/brands/samsung.svg' },
  { name: 'Bosch', logo: '/images/brands/bosch.svg' },
  { name: 'Carrier', logo: '/images/brands/carrier.svg' },
  { name: 'LG', logo: '/images/brands/lg.png' },
  { name: 'Philips', logo: '/images/brands/philips.png' },
  { name: 'DeLonghi', logo: '/images/brands/delonghi.png' },
  { name: 'Dyson', logo: '/images/brands/dyson.webp' },
  { name: 'Panasonic', logo: '/images/brands/panasonic.png' },
  { name: 'Braun', logo: '/images/brands/braun.png' },
  { name: 'Kenwood', logo: '/images/brands/kenwood.svg' },
  { name: 'Tefal', logo: '/images/brands/tefal.png' },
  { name: 'Bissell', logo: '/images/brands/bissell.png' },
  { name: 'Clikon', logo: '/images/brands/clikon.png' },
  { name: 'Ecovacs', logo: '/images/brands/ecovacs.png' },
  { name: 'Jano', logo: '/images/brands/jano.png' },
  { name: 'Karcher', logo: '/images/brands/karcher.png' },
  { name: 'Nutricook', logo: '/images/brands/nutricook.jpg' },
  { name: 'Tineco', logo: '/images/brands/tineco.png' },
  { name: 'Adison', logo: '/images/brands/adison.webp' },
  { name: 'Okka', logo: '/images/brands/okka.webp' },
  { name: 'Saif', logo: '/images/brands/saif.webp' },
  { name: 'Black & Decker', logo: '/images/brands/blackanddecker.webp' },
  { name: 'Mlay', logo: '/images/brands/mlay.webp' },
  { name: 'Ninja', logo: '/images/brands/ninja.webp' },
  { name: 'Hoover', logo: '/images/brands/hover.webp' },
];

// Resolve logo: use API logo if it's a valid URL/path, otherwise try local mapping
function resolveLogo(name: string, apiLogo?: string): string {
  if (apiLogo && (apiLogo.startsWith('http') || apiLogo.startsWith('/images/'))) {
    return apiLogo;
  }
  return localBrandImages[name.toLowerCase()] || '';
}

export function Brands() {
  const t = useT();
  const heading = useSectionHeading('brands', { title: t('home.brandsHeading'), subtitle: t('nav.brands') });
  const { data: apiBrands } = useQuery({
    queryKey: ['brands-homepage'],
    queryFn: () => brandsApi.getAll(),
    staleTime: 5 * 60 * 1000,
  });

  // Always start with all local brands, then merge any extra API brands
  const brands = (() => {
    const result = [...fallbackBrands];
    if (apiBrands && apiBrands.length > 0) {
      const existingNames = new Set(result.map(b => b.name.toLowerCase()));
      for (const b of apiBrands) {
        if (!existingNames.has(b.name.toLowerCase())) {
          const logo = resolveLogo(b.name, b.logo);
          if (logo) {
            result.push({ name: b.name, logo });
            existingNames.add(b.name.toLowerCase());
          }
        }
      }
    }
    return result;
  })();

  const duplicated = [...brands, ...brands];

  // Hidden from the homepage editor.

  if (!heading.enabled) return null;


  return (
    <section className="py-12 sm:py-16 bg-beige-50 border-y border-beige-200 overflow-hidden">
      <div className="container-custom">
        {/* Same eyebrow + heading + accent-rule treatment as every other
            homepage section — this was a plain caption, which made an important
            trust statement read like a footnote. */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <span className="text-xs font-semibold uppercase tracking-wider text-primary-600">
            {heading.subtitle}
          </span>
          <h2 className="mt-1 text-xl sm:text-2xl font-display font-bold text-dark-900">
            {heading.title}
          </h2>
          <span
            aria-hidden
            className="mt-2.5 mx-auto block h-0.5 w-10 rounded-full bg-primary-600"
          />
        </motion.div>
      </div>

      {/* Edge fades are symmetric, so the physical left/right offsets read the
          same in RTL. The marquee itself is a seamless loop of a duplicated
          list and stays continuous in either direction. */}
      <div className="relative" dir="ltr">
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-beige-50 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-beige-50 to-transparent z-10 pointer-events-none" />

        <div className="flex animate-marquee hover:pause-animation">
          {duplicated.map((brand, index) => (
            <a
              key={`${brand.name}-${index}`}
              href={`/products?brand=${encodeURIComponent(brand.name)}`}
              className="flex-shrink-0 flex items-center justify-center w-28 md:w-36 h-16 mx-4 opacity-100 hover:opacity-80 transition-all duration-300"
              title={t('home.shopBrand', { brand: brand.name })}
              aria-label={t('home.shopBrand', { brand: brand.name })}
            >
              <BrandImage src={brand.logo} alt={brand.name} />
            </a>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 40s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
}

function BrandImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <span className="text-sm font-semibold text-dark-400 tracking-wide whitespace-nowrap">
        {alt}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className="max-h-10 md:max-h-12 max-w-[100px] w-auto object-contain hover:grayscale-0 transition-all"
      onError={() => setFailed(true)}
    />
  );
}

export default Brands;

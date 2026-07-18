'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { HiArrowRight, HiOutlineSearch } from 'react-icons/hi';
import { useQuery } from '@tanstack/react-query';
import { bannersApi, cmsApi } from '@/lib/api';
import { Button } from '@/components/ui';
import { useT } from '@/lib/i18n';

const defaultQuickCategories = [
  { emoji: '🍳', label: 'Kitchen', href: '/categories/kitchen-appliances' },
  { emoji: '☕', label: 'Coffee', href: '/categories/coffee-machines' },
  { emoji: '🧹', label: 'Cleaning', href: '/categories/home-essentials' },
  { emoji: '🔌', label: 'Small Appliances', href: '/categories/small-appliances' },
];


const defaultPromos = [
  { emoji: '🔥', title: 'Flash Deals', subtitle: 'Up to 50% off', href: '/deals', color: 'from-primary-500 to-primary-600' },
  { emoji: '✨', title: 'New Arrivals', subtitle: 'Latest products', href: '/products?new=true', color: 'from-dark-800 to-dark-900' },
  { emoji: '📦', title: 'All Categories', subtitle: 'Browse collection', href: '/categories', color: '' },
  { emoji: '⭐', title: 'Best Sellers', subtitle: 'Top rated items', href: '/products?featured=true', color: '' },
];

// Fallback slides when no banners available
const defaultSlides = [
  {
    _id: '1',
    title: 'Premium Coffee Machines',
    subtitle: 'Start Your Day Right',
    description: 'Up to 30% off on selected espresso machines',
    image: { url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200' },
    buttonText: 'Shop Coffee',
    buttonLink: '/categories/coffee-machines',
    backgroundColor: '#1a1a2e',
  },
  {
    _id: '2',
    title: 'Kitchen Essentials',
    subtitle: 'Cook Like a Pro',
    description: 'Discover our range of premium kitchen appliances',
    image: { url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200' },
    buttonText: 'Shop Kitchen',
    buttonLink: '/categories/kitchen-appliances',
    backgroundColor: '#16213e',
  },
  {
    _id: '3',
    title: 'Smart Home Solutions',
    subtitle: 'Modern Living',
    description: 'Upgrade your home with smart appliances',
    image: { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200' },
    buttonText: 'Explore Now',
    buttonLink: '/products',
    backgroundColor: '#1a1a2e',
  },
];

function parseCmsJson(cmsData: any, defaultVal: any) {
  try {
    if (cmsData?.value) {
      const parsed = typeof cmsData.value === 'string' ? JSON.parse(cmsData.value) : cmsData.value;
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
    }
  } catch {
    // use default
  }
  return defaultVal;
}

export function Hero() {
  const t = useT();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: banners } = useQuery({
    queryKey: ['homepage-banners'],
    queryFn: () => bannersApi.getByPosition('hero_main'),
  });

  const { data: cmsMultiple } = useQuery({
    queryKey: ['cms-hero-content'],
    queryFn: () => cmsApi.getMultiple(['homepage_hero_categories', 'homepage_hero_promos']),
    staleTime: 5 * 60 * 1000,
  });

  const quickCategories = parseCmsJson(cmsMultiple?.homepage_hero_categories, defaultQuickCategories);
  const promos = parseCmsJson(cmsMultiple?.homepage_hero_promos, defaultPromos);

  // Map database banners to the expected format
  const mappedBanners = banners?.map((b: any) => ({
    _id: b._id,
    title: b.title,
    subtitle: b.subtitle,
    description: b.subtitle,
    image: { url: b.image },
    buttonText: b.linkText || t('home.shopNow'),
    buttonLink: b.link || '/products',
    backgroundColor: b.backgroundColor,
  })) || [];

  const slides = mappedBanners.length > 0 ? mappedBanners : defaultSlides;

  // Auto-advance slides
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/products?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  const currentBanner = slides[currentSlide];

  return (
    <section className="relative bg-dark-950">
      {/* Main Hero Area */}
      <div className="relative min-h-[400px] md:min-h-[480px] overflow-hidden">
        {/* Background Slides */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentBanner._id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            {/* Background Image */}
            <div className="absolute inset-0">
              <Image
                src={currentBanner.image?.url || '/images/hero-placeholder.jpg'}
                alt={currentBanner.title}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-r from-dark-950/95 via-dark-950/70 to-dark-950/40" />
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Content */}
        <div className="relative z-10 container-custom h-full flex items-center py-12 md:py-16">
          <div className="grid lg:grid-cols-2 gap-8 items-center w-full">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Promo Badge */}
              {currentBanner.subtitle && (
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500 text-white text-xs font-medium mb-4">
                  {currentBanner.subtitle}
                </span>
              )}

              {/* Title */}
              <AnimatePresence mode="wait">
                <motion.h1
                  key={currentBanner._id + '-title'}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white leading-tight"
                >
                  {currentBanner.title}
                </motion.h1>
              </AnimatePresence>

              {/* Description */}
              {currentBanner.description && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mt-3 text-base md:text-lg text-white/80 max-w-md"
                >
                  {currentBanner.description}
                </motion.p>
              )}

              {/* Search Bar */}
              <motion.form
                onSubmit={handleSearch}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-6 flex gap-2 max-w-md"
              >
                <div className="flex-1 relative">
                  <HiOutlineSearch className="absolute start-3 top-1/2 -translate-y-1/2 text-dark-400" size={20} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('home.heroSearchPlaceholder')}
                    aria-label={t('nav.search')}
                    className="w-full ps-10 pe-4 py-3 bg-white rounded-lg text-dark-900 placeholder:text-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  />
                </div>
                <Button type="submit">
                  {t('nav.search')}
                </Button>
              </motion.form>

              {/* Quick Categories */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-6 flex flex-wrap gap-2"
              >
                {quickCategories.map((cat: any) => (
                  <Link
                    key={cat.label}
                    href={cat.href}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white text-xs font-medium transition-colors"
                  >
                    <span>{cat.emoji}</span>
                    <span>{cat.label}</span>
                  </Link>
                ))}
              </motion.div>

              {/* CTA Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-6"
              >
                <Link href={currentBanner.buttonLink || '/products'}>
                  <Button
                    size="lg"
                    rightIcon={<HiArrowRight size={16} className="rtl-flip" />}
                  >
                    {currentBanner.buttonText || t('home.shopNow')}
                  </Button>
                </Link>
              </motion.div>
            </motion.div>

            {/* Right Side - Featured Promo Cards (desktop only) */}
            <div className="hidden lg:block">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="grid grid-cols-2 gap-3"
              >
                {promos.map((promo: any) => (
                  <Link
                    key={promo.title}
                    href={promo.href}
                    className={`group rounded-xl p-4 hover:shadow-lg transition-all ${
                      promo.color
                        ? `bg-gradient-to-br ${promo.color}`
                        : 'bg-white/10 backdrop-blur-sm hover:bg-white/20'
                    }`}
                  >
                    <span className="text-2xl">{promo.emoji}</span>
                    <h3 className="mt-2 font-semibold text-white">{promo.title}</h3>
                    <p className="text-xs text-white/80 mt-1">{promo.subtitle}</p>
                    <span className="inline-flex items-center gap-1 text-xs text-white/90 mt-2 group-hover:gap-2 transition-all">
                      {t('home.shopNow')} <HiArrowRight size={12} className="rtl-flip" />
                    </span>
                  </Link>
                ))}
              </motion.div>
            </div>
          </div>
        </div>

        {/* Slide Indicators */}
        {/* Centred horizontally — physical offsets are intentional here since
            centring is direction-agnostic. */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
          {slides.map((_: any, index: number) => (
            <button
              key={index}
              type="button"
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentSlide
                  ? 'bg-white w-6'
                  : 'bg-white/40 hover:bg-white/60'
              }`}
              aria-label={t('home.goToSlide', { index: index + 1 })}
            />
          ))}
        </div>
      </div>

    </section>
  );
}

export default Hero;

'use client';

import Link from 'next/link';
import { ContentIcon } from '@/components/ui';
import { useCmsContent } from '@/lib/use-cms-content';
import { useT } from '@/lib/i18n';

function parseCmsJson(data: any, fallback: any) {
  try {
    if (data?.value) {
      return typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
    }
  } catch {}
  return fallback;
}

interface OrderStep {
  icon: string;
  title: string;
  description: string;
  order: number;
  enabled: boolean;
}

const defaultSettings = {
  enabled: true,
  title: 'How to Order',
  subtitle: 'Get your favorite products delivered in just a few easy steps.',
  ctaText: 'Start Shopping',
  ctaLink: '/products',
  steps: [
    { icon: 'search', title: 'Browse Products', description: 'Explore our wide range of premium home appliances and electronics.', order: 1, enabled: true },
    { icon: 'cart', title: 'Add to Cart', description: 'Select your items and add them to your cart with a single click.', order: 2, enabled: true },
    { icon: 'clipboard', title: 'Place Your Order', description: 'Review your cart, choose a payment method, and confirm your order.', order: 3, enabled: true },
    { icon: 'truck', title: 'Fast Delivery', description: 'Sit back and relax — your order will arrive right at your door.', order: 4, enabled: true },
  ] as OrderStep[],
};

export function HomeHowToOrder() {
  const t = useT();
  const { data: cms } = useCmsContent('homepage_how_to_order');

  const settings = parseCmsJson(cms, defaultSettings);

  if (settings.enabled === false) return null;

  const steps: OrderStep[] = (settings.steps || defaultSettings.steps)
    .filter((s: OrderStep) => s.enabled !== false)
    .sort((a: OrderStep, b: OrderStep) => (a.order ?? 0) - (b.order ?? 0));

  if (steps.length === 0) return null;

  return (
    <section className="bg-white border-y border-beige-100">
      <div className="container-custom py-14 sm:py-20">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-block px-3 py-1 bg-primary-50 text-primary-700 text-xs font-semibold rounded-full uppercase tracking-wider mb-3">
            {t('home.simpleProcess')}
          </span>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-dark-900">
            {settings.title || defaultSettings.title}
          </h2>
          {settings.subtitle && (
            <p className="mt-3 text-dark-500 text-base max-w-xl mx-auto">
              {settings.subtitle}
            </p>
          )}
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connector line (desktop only) */}
          {steps.length > 1 && (
            <div className="hidden lg:block absolute top-9 left-[calc(12.5%+1.5rem)] right-[calc(12.5%+1.5rem)] h-px bg-beige-200 z-0" />
          )}

          <div className={`relative z-10 grid gap-8 ${
            steps.length <= 2
              ? 'grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto'
              : steps.length === 3
              ? 'grid-cols-1 sm:grid-cols-3 max-w-3xl mx-auto'
              : 'grid-cols-2 lg:grid-cols-4'
          }`}>
            {steps.map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center group">
                {/* Icon bubble */}
                <div className="relative mb-5">
                  <div className="w-[72px] h-[72px] rounded-2xl bg-beige-50 border-2 border-beige-200 shadow-sm flex items-center justify-center text-primary-600 group-hover:border-primary-300 group-hover:shadow-md transition-all duration-200">
                    <ContentIcon name={step.icon} size={30} />
                  </div>
                  {/* Step number badge */}
                  <span className="absolute -top-2 -end-2 w-6 h-6 rounded-full bg-primary-600 text-white text-[10px] font-bold flex items-center justify-center shadow">
                    {i + 1}
                  </span>
                </div>

                <h3 className="text-sm sm:text-base font-semibold text-dark-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-xs sm:text-sm text-dark-500 leading-relaxed max-w-[200px]">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        {settings.ctaText && settings.ctaLink && (
          <div className="mt-12 text-center">
            <Link
              href={settings.ctaLink}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors shadow-sm hover:shadow-md"
            >
              {settings.ctaText}
              <span className="rtl-flip">→</span>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

export default HomeHowToOrder;

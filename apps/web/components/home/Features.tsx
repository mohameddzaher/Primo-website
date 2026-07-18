'use client';

import { motion } from 'framer-motion';
import { useCmsContent } from '@/lib/use-cms-content';
import { useSettings } from '@/lib/settings-context';
import { formatCurrency } from '@/lib/utils';

export function Features() {
  const { data: cmsData } = useCmsContent('homepage_features');
  const { settings } = useSettings();

  // Threshold, VAT rate and label all come from store settings — never hardcoded.
  const defaultFeatures = [
    {
      icon: '🚚',
      title: 'Free Delivery',
      description: settings.enableFreeShipping
        ? `On orders over ${formatCurrency(settings.freeShippingThreshold, settings.currency)}`
        : 'Fast nationwide delivery',
    },
    {
      icon: '🧾',
      title: `${settings.taxRate}% ${settings.taxLabel} Included`,
      description: 'Prices shown are final — no surprises',
    },
    { icon: '🛡️', title: 'Authorized Dealer', description: 'Genuine products with official warranty' },
    { icon: '🔒', title: 'Secure Payment', description: 'Mada, Visa, Apple Pay & cash on delivery' },
    { icon: '↩️', title: 'Easy Returns', description: '30-day hassle-free returns' },
  ];

  let features = defaultFeatures;
  try {
    if (cmsData?.value) {
      const parsed = typeof cmsData.value === 'string' ? JSON.parse(cmsData.value) : cmsData.value;
      if (Array.isArray(parsed) && parsed.length > 0) features = parsed;
    }
  } catch {
    // use defaults
  }

  return (
    <section className="py-12 border-y border-beige-200 bg-white">
      <div className="container-custom">
        <div
          className={`grid grid-cols-2 gap-6 lg:gap-8 ${
            features.length % 5 === 0 ? 'lg:grid-cols-5' : 'lg:grid-cols-4'
          }`}
        >
          {features.map((feature: any, index: number) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="flex flex-col items-center text-center"
            >
              <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 mb-4">
                <span className="text-xl">{feature.icon}</span>
              </div>
              <h3 className="text-sm font-semibold text-dark-900">
                {feature.title}
              </h3>
              <p className="mt-1 text-xs text-dark-500">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Features;

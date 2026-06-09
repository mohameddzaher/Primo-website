'use client';

import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { cmsApi } from '@/lib/api';

const defaultFeatures = [
  { icon: '🚚', title: 'Free Shipping', description: 'On orders over EGP 2,000' },
  { icon: '🛡️', title: '2 Year Warranty', description: 'Full coverage guarantee' },
  { icon: '↩️', title: 'Easy Returns', description: '30-day return policy' },
  { icon: '💬', title: '24/7 Support', description: 'Expert assistance anytime' },
];

export function Features() {
  const { data: cmsData } = useQuery({
    queryKey: ['cms-homepage-features'],
    queryFn: () => cmsApi.getContent('homepage_features'),
    staleTime: 5 * 60 * 1000,
  });

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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
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

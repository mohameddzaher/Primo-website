'use client';

import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { cmsApi } from '@/lib/api';

const defaultData = {
  badge: 'Why Shop With Us',
  title: 'The PRIMO Difference',
  description: 'We are committed to providing you with the best shopping experience for premium home appliances.',
  reasons: [
    { icon: '✅', title: '100% Authentic Products', description: 'We are an authorized retailer for all brands. Every product comes with official warranty and original packaging.' },
    { icon: '💰', title: 'Best Price Guarantee', description: 'Find a lower price elsewhere? We will match it. Plus, enjoy exclusive discounts and member benefits.' },
    { icon: '🚀', title: 'Fast & Free Delivery', description: 'Free shipping on orders over EGP 2,000. Express delivery available for Cairo and Alexandria.' },
    { icon: '🛡️', title: 'Extended Warranty', description: 'Get up to 2 years warranty on all products. Our extended warranty covers parts and labor costs.' },
    { icon: '↩️', title: 'Easy Returns', description: '30-day hassle-free returns. Not satisfied? Return it for a full refund, no questions asked.' },
    { icon: '💬', title: '24/7 Expert Support', description: 'Our dedicated team of experts is available around the clock to help you with any questions.' },
  ],
  cta: {
    title: 'Still Have Questions?',
    description: 'Our customer support team is here to help. Contact us anytime via phone, email, or live chat.',
    phone: '+20 123 456 789',
    buttonText: 'Send a Message',
    buttonLink: '/contact',
  },
};

export function WhyChooseUs() {
  const { data: cmsData } = useQuery({
    queryKey: ['cms-homepage-why-choose-us'],
    queryFn: () => cmsApi.getContent('homepage_why_choose_us'),
    staleTime: 5 * 60 * 1000,
  });

  let content = defaultData;
  try {
    if (cmsData?.value) {
      const parsed = typeof cmsData.value === 'string' ? JSON.parse(cmsData.value) : cmsData.value;
      if (parsed && parsed.reasons) content = { ...defaultData, ...parsed };
    }
  } catch {
    // use defaults
  }

  return (
    <section className="section bg-beige-50">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-sm text-primary-600 font-medium uppercase tracking-wider"
          >
            {content.badge}
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-2 text-3xl md:text-4xl font-display font-semibold text-dark-900"
          >
            {content.title}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-dark-600"
          >
            {content.description}
          </motion.p>
        </div>

        {/* Reasons Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {content.reasons.map((reason: any, index: number) => (
            <motion.div
              key={reason.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group p-6 rounded-2xl border border-beige-200 hover:border-primary-200 hover:shadow-soft transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-xl bg-primary-50 group-hover:bg-primary-100 flex items-center justify-center text-primary-600 transition-colors mb-4">
                <span className="text-2xl">{reason.icon}</span>
              </div>
              <h3 className="text-lg font-semibold text-dark-900 group-hover:text-primary-600 transition-colors">
                {reason.title}
              </h3>
              <p className="mt-2 text-dark-500 text-sm leading-relaxed">
                {reason.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* CTA Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-12 p-8 md:p-12 rounded-2xl bg-gradient-to-r from-primary-600 to-primary-700 text-white text-center"
        >
          <h3 className="text-2xl md:text-3xl font-display font-semibold">
            {content.cta.title}
          </h3>
          <p className="mt-2 text-white/80 max-w-xl mx-auto">
            {content.cta.description}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <a
              href={`tel:${content.cta.phone.replace(/\s/g, '')}`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary-600 rounded-lg font-medium hover:bg-white/90 transition-colors"
            >
              Call Us: {content.cta.phone}
            </a>
            <a
              href={content.cta.buttonLink}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white rounded-lg font-medium hover:bg-white/20 transition-colors border border-white/20"
            >
              {content.cta.buttonText}
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default WhyChooseUs;

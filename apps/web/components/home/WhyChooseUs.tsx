'use client';

import { motion } from 'framer-motion';
import { HiOutlineChatAlt2, HiOutlinePhone } from 'react-icons/hi';
import { ContentIcon } from '@/components/ui';
import { useCmsContent } from '@/lib/use-cms-content';
import { useT } from '@/lib/i18n';

const defaultData = {
  badge: 'Why Shop With Us',
  title: 'The PRIMO Difference',
  description: 'We are committed to providing you with the best shopping experience for premium home appliances.',
  reasons: [
    { icon: 'badge-check', title: '100% Authentic Products', description: 'We are an authorized retailer for all brands. Every product comes with official warranty and original packaging.' },
    { icon: 'cash', title: 'Best Price Guarantee', description: 'Find a lower price elsewhere? We will match it. Plus, enjoy exclusive discounts and member benefits.' },
    { icon: 'truck', title: 'Fast & Free Delivery', description: 'Free shipping on orders over SAR 500. Express delivery available across Riyadh and Jeddah.' },
    { icon: 'shield', title: 'Extended Warranty', description: 'Get up to 2 years warranty on all products. Our extended warranty covers parts and labor costs.' },
    { icon: 'refresh', title: 'Easy Returns', description: '30-day hassle-free returns. Not satisfied? Return it for a full refund, no questions asked.' },
    { icon: 'chat', title: '24/7 Expert Support', description: 'Our dedicated team of experts is available around the clock to help you with any questions.' },
  ],
  cta: {
    title: 'Still Have Questions?',
    description: 'Our customer support team is here to help. Contact us anytime via phone, email, or live chat.',
    phone: '+966 11 234 5678',
    buttonText: 'Send a Message',
    buttonLink: '/contact',
  },
};

export function WhyChooseUs() {
  const t = useT();
  const { data: cmsData } = useCmsContent('homepage_why_choose_us');

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
                <ContentIcon name={reason.icon} size={26} />
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
          className="mt-12 rounded-2xl bg-white border border-beige-200 shadow-soft overflow-hidden"
        >
          {/* Thin accent edge instead of a full colour wash — the section sits
              between other light bands, and a solid block was overpowering them. */}
          <div className="h-1 w-full bg-gradient-to-r from-primary-500 to-primary-700" />

          <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-6">
            <span className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
              <HiOutlineChatAlt2 size={24} />
            </span>

            <div className="flex-1 min-w-0 text-start">
              <h3 className="text-xl md:text-2xl font-display font-bold text-dark-900">
                {content.cta.title}
              </h3>
              <p className="mt-1.5 text-sm text-dark-500 max-w-xl">
                {content.cta.description}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 md:flex-shrink-0">
              <a
                href={`tel:${content.cta.phone.replace(/\s/g, '')}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-dark-900 text-white text-sm font-semibold hover:bg-dark-800 transition-colors"
              >
                <HiOutlinePhone size={16} />
                <span className="ltr-nums">{content.cta.phone}</span>
              </a>
              <a
                href={content.cta.buttonLink}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-beige-300 text-dark-700 text-sm font-semibold hover:border-primary-400 hover:text-primary-600 transition-colors"
              >
                {content.cta.buttonText}
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default WhyChooseUs;

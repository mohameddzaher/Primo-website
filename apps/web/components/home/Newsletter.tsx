'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineMail } from 'react-icons/hi';
import { newsletterApi } from '@/lib/api';
import { Button } from '@/components/ui';
import toast from 'react-hot-toast';
import { useCmsContent } from '@/lib/use-cms-content';
import { useT } from '@/lib/i18n';

const defaultContent = {
  badge: 'Newsletter',
  title: 'Get 10% Off Your First Order',
  description: 'Subscribe to our newsletter and receive exclusive deals, new product alerts, and expert tips for your home appliances.',
  benefits: [
    { icon: '🎁', title: 'Exclusive Offers', description: 'Get special discounts' },
    { icon: '⚡', title: 'Early Access', description: 'New arrivals first' },
    { icon: '🔔', title: 'Flash Sales', description: 'Never miss a deal' },
  ],
  formTitle: 'Join Our Community',
  subscriberText: 'Over 10,000+ subscribers already',
  buttonText: 'Subscribe & Get 10% Off',
};

export function Newsletter() {
  const t = useT();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { data: cmsData } = useCmsContent('homepage_newsletter');

  let content = defaultContent;
  try {
    if (cmsData?.value) {
      const parsed = typeof cmsData.value === 'string' ? JSON.parse(cmsData.value) : cmsData.value;
      if (parsed && parsed.title) content = { ...defaultContent, ...parsed };
    }
  } catch {
    // use defaults
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    try {
      await newsletterApi.subscribe(email);
      toast.success(t('home.newsletterSuccess'));
      setEmail('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('home.newsletterError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="py-12 md:py-16 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-60 h-60 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-primary-400/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/4 w-4 h-4 bg-white/20 rounded-full" />
        <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-white/15 rounded-full" />
        <div className="absolute bottom-1/4 left-1/2 w-2 h-2 bg-white/25 rounded-full" />
      </div>

      <div className="container-custom relative">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1 mb-4">
              <HiOutlineMail className="text-white" size={16} />
              <span className="text-xs font-medium text-white">{content.badge}</span>
            </div>

            <h2 className="text-2xl md:text-3xl font-display font-bold text-white mb-3">
              {content.title}
            </h2>
            <p className="text-white/80 text-sm mb-6">
              {content.description}
            </p>

            {/* Benefits */}
            <div className="flex flex-wrap gap-4 mb-6">
              {content.benefits.map((benefit: any, index: number) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-2"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                    <span className="text-sm">{benefit.icon}</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">{benefit.title}</p>
                    <p className="text-[10px] text-white/60">{benefit.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <div className="bg-white rounded-xl p-5 md:p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-dark-900 mb-1">
                {content.formTitle}
              </h3>
              <p className="text-sm text-dark-500 mb-4">
                {content.subscriberText}
              </p>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label htmlFor="newsletter-email" className="sr-only">
                    {t('home.newsletterEmailLabel')}
                  </label>
                  <input
                    id="newsletter-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('home.newsletterEmailPlaceholder')}
                    required
                    className="w-full px-4 py-3 bg-beige-50 border border-beige-200 rounded-lg text-dark-900 placeholder:text-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm"
                  />
                </div>
                <Button type="submit" fullWidth isLoading={isLoading}>
                  {content.buttonText}
                </Button>
              </form>

              <p className="mt-3 text-[10px] text-dark-400 text-center">
                {t('home.newsletterConsentPrefix')}{' '}
                <a href="/privacy" className="underline hover:text-dark-600">
                  {t('footer.privacyPolicy')}
                </a>
                {t('home.newsletterConsentSuffix')}
              </p>

              {/* Trust Badges */}
              <div className="mt-4 pt-4 border-t border-beige-200 flex items-center justify-center gap-4 text-[10px] text-dark-400">
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {t('home.noSpam')}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {t('home.weeklyUpdates')}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {t('home.unsubscribeAnytime')}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default Newsletter;

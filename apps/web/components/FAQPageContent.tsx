'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { HiChevronDown } from 'react-icons/hi';
import { cmsApi } from '@/lib/api';
import { Skeleton } from '@/components/ui';

const fallbackFaqs = [
  {
    question: 'How do I place an order?',
    answer: 'Browse our products, add items to your cart, and proceed to checkout. You can pay using credit/debit cards, digital wallets, or cash on delivery.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept Visa, Mastercard, mada, Apple Pay, STC Pay, and Cash on Delivery (COD). All online payments are processed securely through our trusted payment providers.',
  },
  {
    question: 'How long does delivery take?',
    answer: 'Delivery times depend on your location: Major cities (1-2 business days), Other cities (3-5 business days), Remote areas (5-7 business days). Orders placed before 2:00 PM are processed the same business day.',
  },
  {
    question: 'What is your return policy?',
    answer: 'Items can be returned within 14 days of delivery. Products must be in their original packaging and unused condition with all accessories included. Visit our Returns & Exchanges page for full details.',
  },
  {
    question: 'How can I track my order?',
    answer: 'You can track your order using the Track Order page with your order number, checking your order status in My Orders section of your account, or clicking the tracking link in your shipping confirmation email.',
  },
  {
    question: 'Do your products come with a warranty?',
    answer: 'Yes! All products sold by PRIMO come with a manufacturer\'s warranty. Warranty periods vary by product category, ranging from 1 to 5 years. Visit our Warranty Policy page for details.',
  },
  {
    question: 'Can I cancel or modify my order?',
    answer: 'You can cancel or modify your order before it is shipped. Once the order has been dispatched, it cannot be modified. Please contact our customer support team as soon as possible.',
  },
  {
    question: 'Do you offer installation services?',
    answer: 'For large appliances like washing machines and refrigerators, we offer installation assistance. This service is available in select cities. Contact our support team for availability in your area.',
  },
  {
    question: 'How do I contact customer support?',
    answer: 'You can reach us through our Contact page, by email, or by calling our customer service hotline. Our team is available Saturday to Thursday, 9 AM to 9 PM.',
  },
  {
    question: 'Is it safe to shop on PRIMO?',
    answer: 'Absolutely! We use industry-standard SSL encryption to protect your data. All payment transactions are processed through secure, PCI-compliant payment gateways. Your personal information is never shared with third parties.',
  },
];

export default function FAQPageContent() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const { data: apiFaqs, isLoading } = useQuery({
    queryKey: ['faqs'],
    queryFn: async () => {
      try {
        const data = await cmsApi.getFaqs();
        return data;
      } catch {
        return null;
      }
    },
  });

  const faqs = (apiFaqs && apiFaqs.length > 0) ? apiFaqs : fallbackFaqs;

  return (
    <div className="min-h-screen bg-beige-50 py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-10">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-display font-semibold text-dark-900 mb-3"
          >
            Frequently Asked Questions
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-dark-500"
          >
            Find answers to common questions about our products and services.
          </motion.p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} variant="rounded" className="h-16" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {faqs.map((faq: any, index: number) => (
              <motion.div
                key={faq._id || index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-beige-50 transition-colors"
                >
                  <span className="font-medium text-dark-900 pr-4">{faq.question}</span>
                  <HiChevronDown
                    size={20}
                    className={`flex-shrink-0 text-dark-400 transition-transform duration-200 ${
                      openIndex === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 text-sm text-dark-600 leading-relaxed border-t border-beige-100 pt-4">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

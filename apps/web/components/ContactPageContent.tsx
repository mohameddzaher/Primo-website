'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import {
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineLocationMarker,
  HiOutlineClock,
  HiOutlineChatAlt2,
  HiOutlineExclamationCircle,
  HiOutlineCheckCircle,
} from 'react-icons/hi';
import {
  FaFacebookF,
  FaInstagram,
  FaTiktok,
  FaWhatsapp,
  FaYoutube,
  FaLinkedinIn,
} from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { Button, Input, Textarea, Select, Card } from '@/components/ui';
import { contactApi, type ComplaintCategory } from '@/lib/api';
import { useSettings } from '@/lib/settings-context';
import { useT } from '@/lib/i18n';
import toast from 'react-hot-toast';

type Tab = 'general' | 'complaint';

const COMPLAINT_CATEGORIES: ComplaintCategory[] = [
  'delivery',
  'product_quality',
  'damaged',
  'billing',
  'warranty',
  'staff',
  'other',
];

// Both schemas are built inside the component so every validation message can
// go through the translator and follow the active locale.
function buildSchemas(t: ReturnType<typeof useT>) {
  const general = z.object({
    name: z.string().min(2, t('shop.contact.error.name')),
    email: z.string().email(t('shop.contact.error.email')),
    phone: z.string().optional(),
    subject: z.string().min(3, t('shop.contact.error.subject')),
    message: z.string().min(10, t('shop.contact.error.message')),
  });

  const complaint = z.object({
    name: z.string().min(2, t('shop.contact.error.name')),
    email: z.string().email(t('shop.contact.error.email')),
    phone: z.string().min(6, t('shop.contact.error.phone')),
    orderNumber: z.string().optional(),
    category: z.enum(
      COMPLAINT_CATEGORIES as [ComplaintCategory, ...ComplaintCategory[]],
      { errorMap: () => ({ message: t('shop.contact.error.category') }) }
    ),
    message: z.string().min(10, t('shop.contact.error.message')),
  });

  return { general, complaint };
}

export default function ContactPageContent() {
  const { settings } = useSettings();
  const t = useT();
  const [tab, setTab] = useState<Tab>('general');
  // Which form was submitted, so the success panel can use the right copy.
  const [submitted, setSubmitted] = useState<{ tab: Tab; email: string } | null>(null);

  const schemas = buildSchemas(t);
  type GeneralForm = z.infer<typeof schemas.general>;
  type ComplaintForm = z.infer<typeof schemas.complaint>;

  const generalForm = useForm<GeneralForm>({ resolver: zodResolver(schemas.general) });
  const complaintForm = useForm<ComplaintForm>({ resolver: zodResolver(schemas.complaint) });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const switchTab = (next: Tab) => {
    setTab(next);
    setSubmitted(null);
  };

  const onSubmitGeneral = async (data: GeneralForm) => {
    setIsSubmitting(true);
    try {
      await contactApi.submit({ type: 'general', ...data });
      toast.success(t('shop.contact.toast.sent'));
      setSubmitted({ tab: 'general', email: data.email });
      generalForm.reset();
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('shop.contact.toast.failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmitComplaint = async (data: ComplaintForm) => {
    setIsSubmitting(true);
    try {
      await contactApi.submit({ type: 'complaint', ...data });
      toast.success(t('shop.contact.toast.sent'));
      setSubmitted({ tab: 'complaint', email: data.email });
      complaintForm.reset();
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('shop.contact.toast.failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoryOptions = COMPLAINT_CATEGORIES.map((value) => ({
    value,
    label: t(`shop.contact.category.${value}` as 'shop.contact.category.other'),
  }));

  // Build contact info dynamically from settings
  const contactInfo = [
    settings.siteEmail && {
      icon: HiOutlineMail,
      title: t('shop.contact.info.email'),
      value: settings.siteEmail,
      link: `mailto:${settings.siteEmail}`,
    },
    settings.sitePhone && {
      icon: HiOutlinePhone,
      title: t('shop.contact.info.phone'),
      value: settings.sitePhone,
      link: `tel:${settings.sitePhone.replace(/\s/g, '')}`,
    },
    settings.siteAddress && {
      icon: HiOutlineLocationMarker,
      title: t('shop.contact.info.address'),
      value: settings.siteAddress,
      link: null,
    },
    {
      icon: HiOutlineClock,
      title: t('shop.contact.info.hours'),
      value: t('shop.contact.info.hoursValue'),
      link: null,
    },
  ].filter(Boolean) as { icon: any; title: string; value: string; link: string | null }[];

  // Build social links dynamically from settings
  const socialLinks = [
    settings.socialFacebook && { name: 'Facebook', href: settings.socialFacebook, icon: FaFacebookF },
    settings.socialInstagram && { name: 'Instagram', href: settings.socialInstagram, icon: FaInstagram },
    settings.socialTwitter && { name: 'X', href: settings.socialTwitter, icon: FaXTwitter },
    settings.socialYoutube && { name: 'YouTube', href: settings.socialYoutube, icon: FaYoutube },
    settings.socialTiktok && { name: 'TikTok', href: settings.socialTiktok, icon: FaTiktok },
    settings.socialLinkedin && { name: 'LinkedIn', href: settings.socialLinkedin, icon: FaLinkedinIn },
    settings.socialWhatsapp && { name: 'WhatsApp', href: settings.socialWhatsapp.startsWith('http') ? settings.socialWhatsapp : `https://wa.me/${settings.socialWhatsapp.replace(/[^0-9]/g, '')}`, icon: FaWhatsapp },
  ].filter(Boolean) as { name: string; href: string; icon: any }[];

  const tabs: { key: Tab; label: string; icon: typeof HiOutlineChatAlt2 }[] = [
    { key: 'general', label: t('shop.contact.tab.general'), icon: HiOutlineChatAlt2 },
    { key: 'complaint', label: t('shop.contact.tab.complaint'), icon: HiOutlineExclamationCircle },
  ];

  const showSuccess = submitted?.tab === tab;

  return (
    <div className="min-h-screen bg-beige-50 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-display font-semibold text-dark-900 mb-4"
          >
            {t('shop.contact.title')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-dark-500 max-w-2xl mx-auto"
          >
            {t('shop.contact.subtitle')}
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1"
          >
            <Card padding="lg" className="h-full">
              <h2 className="text-xl font-semibold text-dark-900 mb-6">
                {t('shop.contact.getInTouch')}
              </h2>
              <div className="space-y-6">
                {contactInfo.map((info, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <info.icon className="text-primary-600" size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-dark-500">{info.title}</p>
                      {info.link ? (
                        <a
                          href={info.link}
                          target={info.link.startsWith('http') ? '_blank' : undefined}
                          rel={info.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                          className="text-dark-900 font-medium hover:text-primary-600 transition-colors"
                        >
                          {info.value}
                        </a>
                      ) : (
                        <p className="text-dark-900 font-medium">{info.value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Social Links - Dynamic */}
              {socialLinks.length > 0 && (
                <div className="mt-8 pt-6 border-t border-beige-200">
                  <p className="text-sm text-dark-500 mb-4">{t('shop.contact.followUs')}</p>
                  <div className="flex flex-wrap gap-2">
                    {socialLinks.map((social) => (
                      <a
                        key={social.name}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 bg-beige-100 rounded-lg flex items-center justify-center text-dark-500 hover:bg-primary-100 hover:text-primary-600 transition-colors"
                        aria-label={social.name}
                        title={social.name}
                      >
                        <social.icon size={18} />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </motion.div>

          {/* Forms */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <Card padding="none">
              {/* Tab switch */}
              <div
                role="tablist"
                aria-label={t('shop.contact.title')}
                className="grid grid-cols-2 border-b border-beige-200"
              >
                {tabs.map((item) => {
                  const active = tab === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => switchTab(item.key)}
                      className={`flex items-center justify-center gap-2 px-4 py-4 text-sm font-medium transition-colors border-b-2 -mb-px ${
                        active
                          ? 'border-primary-600 text-primary-700 bg-primary-50/60'
                          : 'border-transparent text-dark-500 hover:text-dark-900 hover:bg-beige-50'
                      }`}
                    >
                      <item.icon size={18} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="p-6 sm:p-8">
                {showSuccess ? (
                  <div className="py-10 text-center">
                    <div className="w-14 h-14 rounded-full bg-green-100 text-green-700 flex items-center justify-center mx-auto mb-4">
                      <HiOutlineCheckCircle size={30} />
                    </div>
                    <h2 className="text-xl font-semibold text-dark-900 mb-2">
                      {tab === 'complaint'
                        ? t('shop.contact.success.complaintTitle')
                        : t('shop.contact.success.title')}
                    </h2>
                    <p className="text-dark-500 max-w-md mx-auto mb-6">
                      {tab === 'complaint'
                        ? t('shop.contact.success.complaintMessage', { email: submitted.email })
                        : t('shop.contact.success.message', { email: submitted.email })}
                    </p>
                    <Button variant="outline" onClick={() => setSubmitted(null)}>
                      {t('shop.contact.success.again')}
                    </Button>
                  </div>
                ) : tab === 'general' ? (
                  <>
                    <h2 className="text-xl font-semibold text-dark-900 mb-1 text-start">
                      {t('shop.contact.general.heading')}
                    </h2>
                    <p className="text-sm text-dark-500 mb-6 text-start">
                      {t('shop.contact.general.hint')}
                    </p>
                    <form
                      onSubmit={generalForm.handleSubmit(onSubmitGeneral)}
                      className="space-y-6"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                          label={t('shop.contact.field.name')}
                          placeholder={t('shop.contact.field.namePlaceholder')}
                          error={generalForm.formState.errors.name?.message}
                          {...generalForm.register('name')}
                        />
                        <Input
                          label={t('shop.contact.field.email')}
                          type="email"
                          placeholder={t('shop.contact.field.emailPlaceholder')}
                          error={generalForm.formState.errors.email?.message}
                          {...generalForm.register('email')}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                          label={t('shop.contact.field.phoneOptional')}
                          placeholder={
                            settings.sitePhone || t('shop.contact.field.phonePlaceholder')
                          }
                          error={generalForm.formState.errors.phone?.message}
                          {...generalForm.register('phone')}
                        />
                        <Input
                          label={t('shop.contact.field.subject')}
                          placeholder={t('shop.contact.field.subjectPlaceholder')}
                          error={generalForm.formState.errors.subject?.message}
                          {...generalForm.register('subject')}
                        />
                      </div>
                      <Textarea
                        label={t('shop.contact.field.message')}
                        placeholder={t('shop.contact.field.messagePlaceholder')}
                        rows={6}
                        error={generalForm.formState.errors.message?.message}
                        {...generalForm.register('message')}
                      />
                      <Button type="submit" size="lg" isLoading={isSubmitting}>
                        {t('shop.contact.submit')}
                      </Button>
                    </form>
                  </>
                ) : (
                  <>
                    <h2 className="text-xl font-semibold text-dark-900 mb-1 text-start">
                      {t('shop.contact.complaint.heading')}
                    </h2>
                    <p className="text-sm text-dark-500 mb-6 text-start">
                      {t('shop.contact.complaint.hint')}
                    </p>
                    <form
                      onSubmit={complaintForm.handleSubmit(onSubmitComplaint)}
                      className="space-y-6"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                          label={t('shop.contact.field.name')}
                          placeholder={t('shop.contact.field.namePlaceholder')}
                          error={complaintForm.formState.errors.name?.message}
                          {...complaintForm.register('name')}
                        />
                        <Input
                          label={t('shop.contact.field.email')}
                          type="email"
                          placeholder={t('shop.contact.field.emailPlaceholder')}
                          error={complaintForm.formState.errors.email?.message}
                          {...complaintForm.register('email')}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                          label={t('shop.contact.field.phone')}
                          placeholder={t('shop.contact.field.phonePlaceholder')}
                          error={complaintForm.formState.errors.phone?.message}
                          {...complaintForm.register('phone')}
                        />
                        <Input
                          label={t('shop.contact.field.orderNumber')}
                          placeholder={t('shop.contact.field.orderNumberPlaceholder')}
                          error={complaintForm.formState.errors.orderNumber?.message}
                          {...complaintForm.register('orderNumber')}
                        />
                      </div>
                      <Select
                        label={t('shop.contact.field.category')}
                        placeholder={t('shop.contact.field.categoryPlaceholder')}
                        options={categoryOptions}
                        error={complaintForm.formState.errors.category?.message}
                        {...complaintForm.register('category')}
                      />
                      <Textarea
                        label={t('shop.contact.field.complaintMessage')}
                        placeholder={t('shop.contact.field.complaintMessagePlaceholder')}
                        rows={6}
                        error={complaintForm.formState.errors.message?.message}
                        {...complaintForm.register('message')}
                      />
                      <Button type="submit" size="lg" isLoading={isSubmitting}>
                        {t('shop.contact.submitComplaint')}
                      </Button>
                    </form>
                  </>
                )}
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

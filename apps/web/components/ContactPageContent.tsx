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
import { Button, Input, Textarea, Card } from '@/components/ui';
import { contactApi } from '@/lib/api';
import { useSettings } from '@/lib/settings-context';
import toast from 'react-hot-toast';

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().optional(),
  subject: z.string().min(3, 'Subject must be at least 3 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

type ContactForm = z.infer<typeof contactSchema>;

export default function ContactPageContent() {
  const { settings } = useSettings();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactForm) => {
    setIsSubmitting(true);
    try {
      await contactApi.submit(data);
      toast.success('Message sent successfully! We\'ll get back to you soon.');
      reset();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send message');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Build contact info dynamically from settings
  const contactInfo = [
    settings.siteEmail && {
      icon: HiOutlineMail,
      title: 'Email',
      value: settings.siteEmail,
      link: `mailto:${settings.siteEmail}`,
    },
    settings.sitePhone && {
      icon: HiOutlinePhone,
      title: 'Phone',
      value: settings.sitePhone,
      link: `tel:${settings.sitePhone.replace(/\s/g, '')}`,
    },
    settings.siteAddress && {
      icon: HiOutlineLocationMarker,
      title: 'Address',
      value: settings.siteAddress,
      link: null,
    },
    {
      icon: HiOutlineClock,
      title: 'Working Hours',
      value: 'Sun - Thu: 9AM - 6PM',
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
            Contact Us
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-dark-500 max-w-2xl mx-auto"
          >
            Have a question or need assistance? We&apos;re here to help. Reach out to
            us and we&apos;ll respond as soon as possible.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1"
          >
            <Card padding="lg" className="h-full">
              <h2 className="text-xl font-semibold text-dark-900 mb-6">
                Get in Touch
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
                  <p className="text-sm text-dark-500 mb-4">Follow us on social media</p>
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

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <Card padding="lg">
              <h2 className="text-xl font-semibold text-dark-900 mb-6">
                Send us a Message
              </h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Your Name"
                    placeholder="Enter your name"
                    error={errors.name?.message}
                    {...register('name')}
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="you@example.com"
                    error={errors.email?.message}
                    {...register('email')}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Phone Number (Optional)"
                    placeholder={settings.sitePhone || '+20 123 456 7890'}
                    error={errors.phone?.message}
                    {...register('phone')}
                  />
                  <Input
                    label="Subject"
                    placeholder="What's this about?"
                    error={errors.subject?.message}
                    {...register('subject')}
                  />
                </div>
                <Textarea
                  label="Message"
                  placeholder="Tell us more about your inquiry..."
                  rows={6}
                  error={errors.message?.message}
                  {...register('message')}
                />
                <Button type="submit" size="lg" isLoading={isSubmitting}>
                  Send Message
                </Button>
              </form>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

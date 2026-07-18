'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  HiOutlineCog,
  HiOutlineGlobe,
  HiOutlineMail,
  HiOutlineCreditCard,
  HiOutlineTruck,
  HiOutlineColorSwatch,
  HiOutlineBell,
  HiOutlineShieldCheck,
  HiOutlinePhotograph,
  HiOutlineSearch,
  HiOutlineUpload,
  HiOutlineStar,
} from 'react-icons/hi';
import { Button, Input, Textarea, Card, Checkbox } from '@/components/ui';
import { adminApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-error';
import toast from 'react-hot-toast';

const settingsSchema = z.object({
  // General
  siteName: z.string().min(2, 'Site name is required'),
  siteDescription: z.string().optional(),
  siteEmail: z.string().email('Please enter a valid email'),
  sitePhone: z.string().optional(),
  siteAddress: z.string().optional(),
  currency: z.string(),
  timezone: z.string().optional(),
  dateFormat: z.string().optional(),
  maintenanceMode: z.boolean(),
  maintenanceMessage: z.string().optional(),
  // Shipping
  shippingFee: z.number().min(0),
  freeShippingThreshold: z.number().min(0),
  enableFreeShipping: z.boolean(),
  estimatedDeliveryDays: z.number().min(1),
  // Payment
  taxRate: z.number().min(0).max(100),
  enableTax: z.boolean(),
  taxLabel: z.string().optional(),
  enableCOD: z.boolean(),
  codFee: z.number().min(0),
  enableOnlinePayment: z.boolean(),
  stripeEnabled: z.boolean(),
  stripePublishableKey: z.string().optional(),
  stripeSecretKey: z.string().optional(),
  paypalEnabled: z.boolean(),
  paypalClientId: z.string().optional(),
  paypalSecret: z.string().optional(),
  // Tax / Invoicing (ZATCA e-invoicing seller identity)
  sellerName: z.string().optional(),
  // ZATCA requires a 15-digit VAT registration number, but an empty value must
  // still be savable so the store can be configured before it is registered.
  sellerVatNumber: z
    .string()
    .regex(/^(\d{15})?$/, 'VAT number must be exactly 15 digits')
    .optional(),
  sellerCrNumber: z.string().optional(),
  sellerAddress: z.string().optional(),
  // Email
  smtpHost: z.string().optional(),
  smtpPort: z.number().optional(),
  smtpUser: z.string().optional(),
  smtpPassword: z.string().optional(),
  smtpSecure: z.boolean(),
  emailFromName: z.string().optional(),
  emailFromAddress: z.string().optional(),
  enableOrderConfirmationEmail: z.boolean(),
  enableShippingNotificationEmail: z.boolean(),
  enableAccountEmails: z.boolean(),
  enableMarketingEmails: z.boolean(),
  // Social
  socialFacebook: z.string().optional(),
  socialInstagram: z.string().optional(),
  socialTwitter: z.string().optional(),
  socialYoutube: z.string().optional(),
  socialTiktok: z.string().optional(),
  socialLinkedin: z.string().optional(),
  socialWhatsapp: z.string().optional(),
  // Appearance
  logo: z.string().optional(),
  favicon: z.string().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  accentColor: z.string().optional(),
  headerStyle: z.enum(['default', 'transparent', 'colored']).optional(),
  footerStyle: z.enum(['default', 'minimal', 'expanded']).optional(),
  productCardStyle: z.enum(['default', 'minimal', 'detailed']).optional(),
  // SEO
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  googleAnalyticsId: z.string().optional(),
  facebookPixelId: z.string().optional(),
  // Notifications
  enablePushNotifications: z.boolean(),
  enableEmailNotifications: z.boolean(),
  lowStockThreshold: z.number().min(0),
  notifyOnNewOrder: z.boolean(),
  notifyOnLowStock: z.boolean(),
  notifyOnNewReview: z.boolean(),
  // Advanced
  enableReviews: z.boolean(),
  reviewsRequireApproval: z.boolean(),
  enableWishlist: z.boolean(),
  enableCompare: z.boolean(),
  maxCompareProducts: z.number().min(2).max(10),
  enableRecentlyViewed: z.boolean(),
  recentlyViewedLimit: z.number().min(1).max(50),
  enableReferralProgram: z.boolean(),
  referralRewardAmount: z.number().min(0),
  referralRewardType: z.enum(['fixed', 'percentage']),
  // Loyalty Program
  enableLoyaltyProgram: z.boolean(),
  pointsPerCurrency: z.number().min(0),
  pointsRedemptionRate: z.number().min(1),
  referralBonusPoints: z.number().min(0),
  minPointsToRedeem: z.number().min(0),
  maxPointsPerOrder: z.number().min(0),
});

type SettingsForm = z.infer<typeof settingsSchema>;

const defaultSettings: SettingsForm = {
  siteName: 'PRIMO',
  siteDescription: '',
  siteEmail: 'support@primo.com',
  sitePhone: '',
  siteAddress: '',
  currency: 'SAR',
  timezone: 'Asia/Riyadh',
  dateFormat: 'DD/MM/YYYY',
  maintenanceMode: false,
  maintenanceMessage: 'We are currently undergoing maintenance. Please check back later.',
  shippingFee: 50,
  freeShippingThreshold: 500,
  enableFreeShipping: true,
  estimatedDeliveryDays: 3,
  taxRate: 15,
  enableTax: true,
  taxLabel: 'VAT',
  enableCOD: true,
  codFee: 0,
  enableOnlinePayment: true,
  stripeEnabled: false,
  stripePublishableKey: '',
  stripeSecretKey: '',
  paypalEnabled: false,
  paypalClientId: '',
  paypalSecret: '',
  sellerName: '',
  sellerVatNumber: '',
  sellerCrNumber: '',
  sellerAddress: '',
  smtpHost: '',
  smtpPort: 587,
  smtpUser: '',
  smtpPassword: '',
  smtpSecure: false,
  emailFromName: 'PRIMO',
  emailFromAddress: 'noreply@primo.com',
  enableOrderConfirmationEmail: true,
  enableShippingNotificationEmail: true,
  enableAccountEmails: true,
  enableMarketingEmails: false,
  socialFacebook: '',
  socialInstagram: '',
  socialTwitter: '',
  socialYoutube: '',
  socialTiktok: '',
  socialLinkedin: '',
  socialWhatsapp: '',
  logo: '',
  favicon: '',
  primaryColor: '#C9A96E',
  secondaryColor: '#1A1A1A',
  accentColor: '#F5F0E8',
  headerStyle: 'default',
  footerStyle: 'default',
  productCardStyle: 'default',
  metaTitle: 'PRIMO - Premium E-Commerce',
  metaDescription: '',
  googleAnalyticsId: '',
  facebookPixelId: '',
  enablePushNotifications: false,
  enableEmailNotifications: true,
  lowStockThreshold: 10,
  notifyOnNewOrder: true,
  notifyOnLowStock: true,
  notifyOnNewReview: true,
  enableReviews: true,
  reviewsRequireApproval: true,
  enableWishlist: true,
  enableCompare: true,
  maxCompareProducts: 4,
  enableRecentlyViewed: true,
  recentlyViewedLimit: 10,
  enableReferralProgram: false,
  referralRewardAmount: 50,
  referralRewardType: 'fixed',
  enableLoyaltyProgram: false,
  pointsPerCurrency: 1,
  pointsRedemptionRate: 100,
  referralBonusPoints: 50,
  minPointsToRedeem: 100,
  maxPointsPerOrder: 0,
};

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const queryClient = useQueryClient();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => adminApi.getSettings(),
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<SettingsForm>) => adminApi.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      toast.success('Settings updated successfully');
    },
    onError: (error: any) => toast.error(getApiErrorMessage(error, 'Failed to update settings')),
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    values: settings ? { ...defaultSettings, ...settings } : defaultSettings,
  });

  const tabs = [
    { id: 'general', label: 'General', icon: HiOutlineCog },
    { id: 'shipping', label: 'Shipping', icon: HiOutlineTruck },
    { id: 'payment', label: 'Payment', icon: HiOutlineCreditCard },
    { id: 'email', label: 'Email', icon: HiOutlineMail },
    { id: 'social', label: 'Social', icon: HiOutlineGlobe },
    { id: 'appearance', label: 'Appearance', icon: HiOutlineColorSwatch },
    { id: 'seo', label: 'SEO', icon: HiOutlineSearch },
    { id: 'notifications', label: 'Notifications', icon: HiOutlineBell },
    { id: 'advanced', label: 'Advanced', icon: HiOutlineShieldCheck },
  ];

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'favicon') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setValue(type, reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-10 bg-beige-200 rounded w-1/4"></div>
        <div className="h-64 bg-beige-200 rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-dark-900">Settings</h1>
        <p className="text-dark-500 mt-1">Configure your store settings</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64 flex-shrink-0">
          <Card padding="sm">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-dark-600 hover:bg-beige-50'
                  }`}
                >
                  <tab.icon size={20} />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </nav>
          </Card>
        </div>

        {/* Content */}
        <div className="flex-1">
          <form onSubmit={handleSubmit((data) => updateMutation.mutate(data))}>
            {/* General Settings */}
            {activeTab === 'general' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card padding="lg" className="space-y-6">
                  <h3 className="text-lg font-semibold text-dark-900">General Settings</h3>

                  <Input
                    label="Site Name"
                    error={errors.siteName?.message}
                    {...register('siteName')}
                  />

                  <Textarea
                    label="Site Description"
                    rows={3}
                    {...register('siteDescription')}
                  />

                  <Input
                    label="Contact Email"
                    type="email"
                    error={errors.siteEmail?.message}
                    {...register('siteEmail')}
                  />

                  <Input
                    label="Contact Phone"
                    {...register('sitePhone')}
                  />

                  <Textarea
                    label="Store Address"
                    rows={2}
                    {...register('siteAddress')}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-dark-700 mb-1">
                        Currency
                      </label>
                      <select
                        className="w-full px-4 py-2 border border-beige-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        {...register('currency')}
                      >
                        <option value="EGP">Egyptian Pound (EGP)</option>
                        <option value="USD">US Dollar (USD)</option>
                        <option value="EUR">Euro (EUR)</option>
                        <option value="SAR">Saudi Riyal (SAR)</option>
                        <option value="AED">UAE Dirham (AED)</option>
                        <option value="GBP">British Pound (GBP)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-dark-700 mb-1">
                        Timezone
                      </label>
                      <select
                        className="w-full px-4 py-2 border border-beige-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        {...register('timezone')}
                      >
                        <option value="Africa/Cairo">Cairo (GMT+2)</option>
                        <option value="Asia/Riyadh">Riyadh (GMT+3)</option>
                        <option value="Asia/Dubai">Dubai (GMT+4)</option>
                        <option value="Europe/London">London (GMT+0)</option>
                        <option value="America/New_York">New York (GMT-5)</option>
                      </select>
                    </div>
                  </div>

                  <div className="border-t border-beige-200 pt-6 space-y-4">
                    <h4 className="font-medium text-dark-900">Maintenance Mode</h4>
                    <Checkbox
                      label="Enable Maintenance Mode"
                      description="Show maintenance page to visitors"
                      {...register('maintenanceMode')}
                    />
                    <Textarea
                      label="Maintenance Message"
                      rows={2}
                      placeholder="We are currently undergoing maintenance..."
                      {...register('maintenanceMessage')}
                    />
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Shipping Settings */}
            {activeTab === 'shipping' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card padding="lg" className="space-y-6">
                  <h3 className="text-lg font-semibold text-dark-900">Shipping Settings</h3>

                  <Input
                    label="Standard Shipping Fee"
                    type="number"
                    {...register('shippingFee', { valueAsNumber: true })}
                  />

                  <Checkbox
                    label="Enable Free Shipping"
                    description="Allow free shipping for orders above threshold"
                    {...register('enableFreeShipping')}
                  />

                  <Input
                    label="Free Shipping Threshold"
                    type="number"
                    placeholder="Minimum order amount for free shipping"
                    {...register('freeShippingThreshold', { valueAsNumber: true })}
                  />

                  <Input
                    label="Estimated Delivery Days"
                    type="number"
                    {...register('estimatedDeliveryDays', { valueAsNumber: true })}
                  />

                  <div className="p-4 bg-beige-50 rounded-lg">
                    <p className="text-sm text-dark-600">
                      Orders above <strong>{watch('freeShippingThreshold') || 500} {watch('currency') || 'SAR'}</strong> will qualify for free shipping.
                      Estimated delivery: <strong>{watch('estimatedDeliveryDays') || 3} days</strong>
                    </p>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Payment Settings */}
            {activeTab === 'payment' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <Card padding="lg" className="space-y-6">
                  <h3 className="text-lg font-semibold text-dark-900">Tax Settings</h3>

                  <Checkbox
                    label="Enable Tax"
                    description="Apply tax to orders"
                    {...register('enableTax')}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Tax Rate (%)"
                      type="number"
                      {...register('taxRate', { valueAsNumber: true })}
                    />
                    <Input
                      label="Tax Label"
                      placeholder="VAT, GST, Sales Tax..."
                      {...register('taxLabel')}
                    />
                  </div>
                </Card>

                <Card padding="lg" className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-dark-900">Tax / Invoicing</h3>
                    <p className="text-sm text-dark-500 mt-1">
                      Your registered seller identity. These details are printed on every tax
                      invoice and encoded into the ZATCA QR code, so they must match your ZATCA
                      registration exactly.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Legal Registered Name"
                      placeholder="PRIMO Trading Est."
                      error={errors.sellerName?.message}
                      {...register('sellerName')}
                    />
                    <Input
                      label="VAT Registration Number"
                      placeholder="300000000000003"
                      error={errors.sellerVatNumber?.message}
                      {...register('sellerVatNumber')}
                    />
                    <Input
                      label="Commercial Registration (CR) Number"
                      placeholder="1010000000"
                      error={errors.sellerCrNumber?.message}
                      {...register('sellerCrNumber')}
                    />
                  </div>

                  <Textarea
                    label="Registered Address"
                    placeholder="Street, District, City, Postal Code, Saudi Arabia"
                    rows={3}
                    {...register('sellerAddress')}
                  />
                </Card>

                <Card padding="lg" className="space-y-6">
                  <h3 className="text-lg font-semibold text-dark-900">Payment Methods</h3>

                  <div className="space-y-4">
                    <div className="p-4 border border-beige-200 rounded-lg">
                      <Checkbox
                        label="Cash on Delivery (COD)"
                        description="Allow customers to pay when they receive their order"
                        {...register('enableCOD')}
                      />
                      <div className="mt-4 ml-6">
                        <Input
                          label="COD Extra Fee"
                          type="number"
                          placeholder="0"
                          {...register('codFee', { valueAsNumber: true })}
                        />
                      </div>
                    </div>

                    <div className="p-4 border border-beige-200 rounded-lg">
                      <Checkbox
                        label="Online Payment"
                        description="Accept credit/debit cards and online wallets"
                        {...register('enableOnlinePayment')}
                      />
                    </div>
                  </div>
                </Card>

                <Card padding="lg" className="space-y-6">
                  <h3 className="text-lg font-semibold text-dark-900">Payment Gateways</h3>

                  <div className="p-4 border border-beige-200 rounded-lg space-y-4">
                    <Checkbox
                      label="Stripe"
                      description="Accept payments via Stripe"
                      {...register('stripeEnabled')}
                    />
                    {watch('stripeEnabled') && (
                      <div className="ml-6 space-y-4">
                        <Input
                          label="Publishable Key"
                          placeholder="pk_..."
                          {...register('stripePublishableKey')}
                        />
                        <Input
                          label="Secret Key"
                          type="password"
                          placeholder="sk_..."
                          {...register('stripeSecretKey')}
                        />
                      </div>
                    )}
                  </div>

                  <div className="p-4 border border-beige-200 rounded-lg space-y-4">
                    <Checkbox
                      label="PayPal"
                      description="Accept payments via PayPal"
                      {...register('paypalEnabled')}
                    />
                    {watch('paypalEnabled') && (
                      <div className="ml-6 space-y-4">
                        <Input
                          label="Client ID"
                          {...register('paypalClientId')}
                        />
                        <Input
                          label="Secret"
                          type="password"
                          {...register('paypalSecret')}
                        />
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Email Settings */}
            {activeTab === 'email' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <Card padding="lg" className="space-y-6">
                  <h3 className="text-lg font-semibold text-dark-900">SMTP Configuration</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="SMTP Host"
                      placeholder="smtp.gmail.com"
                      {...register('smtpHost')}
                    />
                    <Input
                      label="SMTP Port"
                      type="number"
                      placeholder="587"
                      {...register('smtpPort', { valueAsNumber: true })}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="SMTP Username"
                      placeholder="your-email@gmail.com"
                      {...register('smtpUser')}
                    />
                    <Input
                      label="SMTP Password"
                      type="password"
                      {...register('smtpPassword')}
                    />
                  </div>

                  <Checkbox
                    label="Use SSL/TLS"
                    description="Enable secure connection"
                    {...register('smtpSecure')}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="From Name"
                      placeholder="PRIMO"
                      {...register('emailFromName')}
                    />
                    <Input
                      label="From Email"
                      placeholder="noreply@primo.com"
                      {...register('emailFromAddress')}
                    />
                  </div>
                </Card>

                <Card padding="lg" className="space-y-6">
                  <h3 className="text-lg font-semibold text-dark-900">Email Notifications</h3>

                  <Checkbox
                    label="Order Confirmation Emails"
                    description="Send email when order is placed"
                    {...register('enableOrderConfirmationEmail')}
                  />

                  <Checkbox
                    label="Shipping Notification Emails"
                    description="Send email when order is shipped"
                    {...register('enableShippingNotificationEmail')}
                  />

                  <Checkbox
                    label="Account Emails"
                    description="Send welcome, password reset emails"
                    {...register('enableAccountEmails')}
                  />

                  <Checkbox
                    label="Marketing Emails"
                    description="Send promotional and newsletter emails"
                    {...register('enableMarketingEmails')}
                  />
                </Card>
              </motion.div>
            )}

            {/* Social Media Settings */}
            {activeTab === 'social' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card padding="lg" className="space-y-6">
                  <h3 className="text-lg font-semibold text-dark-900">Social Media Links</h3>

                  <Input
                    label="Facebook URL"
                    placeholder="https://facebook.com/yourpage"
                    {...register('socialFacebook')}
                  />

                  <Input
                    label="Instagram URL"
                    placeholder="https://instagram.com/yourpage"
                    {...register('socialInstagram')}
                  />

                  <Input
                    label="Twitter / X URL"
                    placeholder="https://twitter.com/yourpage"
                    {...register('socialTwitter')}
                  />

                  <Input
                    label="YouTube URL"
                    placeholder="https://youtube.com/yourchannel"
                    {...register('socialYoutube')}
                  />

                  <Input
                    label="TikTok URL"
                    placeholder="https://tiktok.com/@yourpage"
                    {...register('socialTiktok')}
                  />

                  <Input
                    label="LinkedIn URL"
                    placeholder="https://linkedin.com/company/yourcompany"
                    {...register('socialLinkedin')}
                  />

                  <Input
                    label="WhatsApp Number"
                    placeholder="+201234567890"
                    {...register('socialWhatsapp')}
                  />
                </Card>
              </motion.div>
            )}

            {/* Appearance Settings */}
            {activeTab === 'appearance' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <Card padding="lg" className="space-y-6">
                  <h3 className="text-lg font-semibold text-dark-900">Logo & Branding</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-dark-700 mb-2">
                        Site Logo
                      </label>
                      <div className="flex items-center gap-4">
                        <div className="w-24 h-24 bg-beige-100 rounded-lg flex items-center justify-center overflow-hidden">
                          {watch('logo') ? (
                            <img src={watch('logo')} alt="Logo" className="w-full h-full object-contain" />
                          ) : (
                            <HiOutlinePhotograph className="text-beige-400" size={32} />
                          )}
                        </div>
                        <div>
                          <input
                            type="file"
                            ref={logoInputRef}
                            accept="image/*"
                            onChange={(e) => handleLogoUpload(e, 'logo')}
                            className="hidden"
                            aria-label="Upload site logo"
                            title="Upload site logo"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            leftIcon={<HiOutlineUpload size={16} />}
                            onClick={() => logoInputRef.current?.click()}
                          >
                            Upload Logo
                          </Button>
                          <p className="text-xs text-dark-500 mt-1">PNG, JPG, SVG. Max 2MB</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-dark-700 mb-2">
                        Favicon
                      </label>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-beige-100 rounded-lg flex items-center justify-center overflow-hidden">
                          {watch('favicon') ? (
                            <img src={watch('favicon')} alt="Favicon" className="w-full h-full object-contain" />
                          ) : (
                            <HiOutlinePhotograph className="text-beige-400" size={24} />
                          )}
                        </div>
                        <div>
                          <input
                            type="file"
                            ref={faviconInputRef}
                            accept="image/*"
                            onChange={(e) => handleLogoUpload(e, 'favicon')}
                            className="hidden"
                            aria-label="Upload favicon"
                            title="Upload favicon"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            leftIcon={<HiOutlineUpload size={16} />}
                            onClick={() => faviconInputRef.current?.click()}
                          >
                            Upload Favicon
                          </Button>
                          <p className="text-xs text-dark-500 mt-1">32x32 or 64x64 px</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card padding="lg" className="space-y-6">
                  <h3 className="text-lg font-semibold text-dark-900">Theme Colors</h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-dark-700 mb-2">
                        Primary Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          className="w-12 h-12 border-0 rounded cursor-pointer"
                          {...register('primaryColor')}
                        />
                        <Input {...register('primaryColor')} className="flex-1" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-dark-700 mb-2">
                        Secondary Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          className="w-12 h-12 border-0 rounded cursor-pointer"
                          {...register('secondaryColor')}
                        />
                        <Input {...register('secondaryColor')} className="flex-1" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-dark-700 mb-2">
                        Accent Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          className="w-12 h-12 border-0 rounded cursor-pointer"
                          {...register('accentColor')}
                        />
                        <Input {...register('accentColor')} className="flex-1" />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-beige-50 rounded-lg">
                    <p className="text-sm text-dark-600 mb-3">Preview:</p>
                    <div className="flex gap-2">
                      <div
                        className="w-16 h-16 rounded-lg shadow"
                        style={{ backgroundColor: watch('primaryColor') || '#C9A96E' }}
                      />
                      <div
                        className="w-16 h-16 rounded-lg shadow"
                        style={{ backgroundColor: watch('secondaryColor') || '#1A1A1A' }}
                      />
                      <div
                        className="w-16 h-16 rounded-lg shadow border border-beige-300"
                        style={{ backgroundColor: watch('accentColor') || '#F5F0E8' }}
                      />
                    </div>
                  </div>
                </Card>

                <Card padding="lg" className="space-y-6">
                  <h3 className="text-lg font-semibold text-dark-900">Layout Styles</h3>

                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-2">
                      Header Style
                    </label>
                    <select
                      className="w-full px-4 py-2 border border-beige-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      {...register('headerStyle')}
                    >
                      <option value="default">Default</option>
                      <option value="transparent">Transparent</option>
                      <option value="colored">Colored</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-2">
                      Footer Style
                    </label>
                    <select
                      className="w-full px-4 py-2 border border-beige-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      {...register('footerStyle')}
                    >
                      <option value="default">Default</option>
                      <option value="minimal">Minimal</option>
                      <option value="expanded">Expanded</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-2">
                      Product Card Style
                    </label>
                    <select
                      className="w-full px-4 py-2 border border-beige-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      {...register('productCardStyle')}
                    >
                      <option value="default">Default</option>
                      <option value="minimal">Minimal</option>
                      <option value="detailed">Detailed</option>
                    </select>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* SEO Settings */}
            {activeTab === 'seo' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <Card padding="lg" className="space-y-6">
                  <h3 className="text-lg font-semibold text-dark-900">SEO Settings</h3>

                  <Input
                    label="Meta Title"
                    placeholder="Your Store - Tagline"
                    {...register('metaTitle')}
                  />

                  <Textarea
                    label="Meta Description"
                    rows={3}
                    placeholder="Describe your store in 150-160 characters..."
                    {...register('metaDescription')}
                  />
                </Card>

                <Card padding="lg" className="space-y-6">
                  <h3 className="text-lg font-semibold text-dark-900">Analytics & Tracking</h3>

                  <Input
                    label="Google Analytics ID"
                    placeholder="G-XXXXXXXXXX"
                    {...register('googleAnalyticsId')}
                  />

                  <Input
                    label="Facebook Pixel ID"
                    placeholder="XXXXXXXXXXXXXXXXX"
                    {...register('facebookPixelId')}
                  />
                </Card>
              </motion.div>
            )}

            {/* Notification Settings */}
            {activeTab === 'notifications' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card padding="lg" className="space-y-6">
                  <h3 className="text-lg font-semibold text-dark-900">Notification Settings</h3>

                  <Checkbox
                    label="Enable Push Notifications"
                    description="Send browser push notifications"
                    {...register('enablePushNotifications')}
                  />

                  <Checkbox
                    label="Enable Email Notifications"
                    description="Send admin email notifications"
                    {...register('enableEmailNotifications')}
                  />

                  <div className="border-t border-beige-200 pt-6 space-y-4">
                    <h4 className="font-medium text-dark-900">Admin Alerts</h4>

                    <Checkbox
                      label="New Order Alert"
                      description="Notify when a new order is placed"
                      {...register('notifyOnNewOrder')}
                    />

                    <Checkbox
                      label="Low Stock Alert"
                      description="Notify when product stock is low"
                      {...register('notifyOnLowStock')}
                    />

                    <Input
                      label="Low Stock Threshold"
                      type="number"
                      {...register('lowStockThreshold', { valueAsNumber: true })}
                    />

                    <Checkbox
                      label="New Review Alert"
                      description="Notify when a new review is submitted"
                      {...register('notifyOnNewReview')}
                    />
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Advanced Settings */}
            {activeTab === 'advanced' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <Card padding="lg" className="space-y-6">
                  <h3 className="text-lg font-semibold text-dark-900">Reviews</h3>

                  <Checkbox
                    label="Enable Reviews"
                    description="Allow customers to leave product reviews"
                    {...register('enableReviews')}
                  />

                  <Checkbox
                    label="Reviews Require Approval"
                    description="Manually approve reviews before they appear"
                    {...register('reviewsRequireApproval')}
                  />
                </Card>

                <Card padding="lg" className="space-y-6">
                  <h3 className="text-lg font-semibold text-dark-900">Product Features</h3>

                  <Checkbox
                    label="Enable Wishlist"
                    description="Allow customers to save products to wishlist"
                    {...register('enableWishlist')}
                  />

                  <div className="flex items-start gap-4">
                    <Checkbox
                      label="Enable Compare"
                      description="Allow customers to compare products"
                      {...register('enableCompare')}
                    />
                  </div>

                  {watch('enableCompare') && (
                    <div className="ml-6">
                      <Input
                        label="Max Products to Compare"
                        type="number"
                        {...register('maxCompareProducts', { valueAsNumber: true })}
                      />
                    </div>
                  )}

                  <Checkbox
                    label="Enable Recently Viewed"
                    description="Show recently viewed products to customers"
                    {...register('enableRecentlyViewed')}
                  />

                  {watch('enableRecentlyViewed') && (
                    <div className="ml-6">
                      <Input
                        label="Recently Viewed Limit"
                        type="number"
                        {...register('recentlyViewedLimit', { valueAsNumber: true })}
                      />
                    </div>
                  )}
                </Card>

                <Card padding="lg" className="space-y-6">
                  <h3 className="text-lg font-semibold text-dark-900">Referral Program</h3>

                  <Checkbox
                    label="Enable Referral Program"
                    description="Allow customers to refer friends and earn rewards"
                    {...register('enableReferralProgram')}
                  />

                  {watch('enableReferralProgram') && (
                    <div className="ml-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="Reward Amount"
                          type="number"
                          {...register('referralRewardAmount', { valueAsNumber: true })}
                        />
                        <div>
                          <label className="block text-sm font-medium text-dark-700 mb-1">
                            Reward Type
                          </label>
                          <select
                            className="w-full px-4 py-2 border border-beige-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            {...register('referralRewardType')}
                          >
                            <option value="fixed">Fixed Amount</option>
                            <option value="percentage">Percentage</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>

                <Card padding="lg" className="space-y-6">
                  <div className="flex items-center gap-2">
                    <HiOutlineStar className="text-primary-600" size={22} />
                    <h3 className="text-lg font-semibold text-dark-900">Loyalty Points Program</h3>
                  </div>

                  <Checkbox
                    label="Enable Loyalty Program"
                    description="Allow customers to earn and redeem points on purchases"
                    {...register('enableLoyaltyProgram')}
                  />

                  {watch('enableLoyaltyProgram') && (
                    <div className="ml-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="Points Per Currency Unit"
                          type="number"
                          placeholder="1"
                          {...register('pointsPerCurrency', { valueAsNumber: true })}
                        />
                        <Input
                          label="Points Redemption Rate"
                          type="number"
                          placeholder="100"
                          {...register('pointsRedemptionRate', { valueAsNumber: true })}
                        />
                      </div>
                      <p className="text-xs text-dark-500">
                        Customers earn <strong>{watch('pointsPerCurrency') || 1}</strong> point(s) per 1 {watch('currency') || 'SAR'} spent.{' '}
                        <strong>{watch('pointsRedemptionRate') || 100}</strong> points = 1 {watch('currency') || 'SAR'} discount.
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="Referral Bonus Points"
                          type="number"
                          placeholder="50"
                          {...register('referralBonusPoints', { valueAsNumber: true })}
                        />
                        <Input
                          label="Min Points to Redeem"
                          type="number"
                          placeholder="100"
                          {...register('minPointsToRedeem', { valueAsNumber: true })}
                        />
                      </div>

                      <Input
                        label="Max Points Per Order (0 = unlimited)"
                        type="number"
                        placeholder="0"
                        {...register('maxPointsPerOrder', { valueAsNumber: true })}
                      />

                      <div className="p-4 bg-beige-50 rounded-lg text-sm text-dark-600 space-y-1">
                        <p><strong>How it works:</strong></p>
                        <p>- Customers earn points when orders are marked as delivered</p>
                        <p>- Referrers earn <strong>{watch('referralBonusPoints') || 50}</strong> bonus points per successful referral</p>
                        <p>- Customers need at least <strong>{watch('minPointsToRedeem') || 100}</strong> points to start redeeming</p>
                        {(watch('maxPointsPerOrder') || 0) > 0 && (
                          <p>- Maximum <strong>{watch('maxPointsPerOrder')}</strong> points can be used per order</p>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              </motion.div>
            )}

            <div className="mt-6">
              <Button type="submit" isLoading={updateMutation.isPending}>
                Save Settings
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

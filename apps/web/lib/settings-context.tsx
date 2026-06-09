'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { settingsApi } from './api';

// Default settings matching all public fields from the backend
const defaultSettings = {
  // General
  siteName: 'PRIMO',
  siteDescription: '',
  siteEmail: '',
  sitePhone: '',
  siteAddress: '',
  currency: 'SAR',
  timezone: 'Asia/Riyadh',
  dateFormat: 'DD/MM/YYYY',
  maintenanceMode: false,
  maintenanceMessage: '',

  // Shipping
  shippingFee: 50,
  freeShippingThreshold: 500,
  enableFreeShipping: true,
  estimatedDeliveryDays: 3,

  // Payment
  enableTax: true,
  taxRate: 14,
  taxLabel: 'VAT',
  enableCOD: true,
  codFee: 0,
  enableOnlinePayment: true,

  // Social Media
  socialFacebook: '',
  socialInstagram: '',
  socialTwitter: '',
  socialYoutube: '',
  socialTiktok: '',
  socialLinkedin: '',
  socialWhatsapp: '',

  // Appearance
  logo: '',
  favicon: '',
  primaryColor: '#C9A96E',
  secondaryColor: '#1A1A1A',
  accentColor: '#F5F0E8',
  headerStyle: 'default' as 'default' | 'transparent' | 'colored',
  footerStyle: 'default' as 'default' | 'minimal' | 'expanded',
  productCardStyle: 'default' as 'default' | 'minimal' | 'detailed',

  // SEO
  metaTitle: 'PRIMO - Premium E-Commerce',
  metaDescription: '',
  metaKeywords: [] as string[],

  // Features
  enableReviews: true,
  reviewsRequireApproval: true,
  enableWishlist: true,
  enableCompare: true,
  maxCompareProducts: 4,
  enableRecentlyViewed: true,
  recentlyViewedLimit: 10,
  enableReferralProgram: false,
  referralRewardAmount: 50,
  referralRewardType: 'fixed' as 'fixed' | 'percentage',
};

export type Settings = typeof defaultSettings;

interface SettingsContextValue {
  settings: Settings;
  isLoading: boolean;
  formatPrice: (price: number) => string;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { data, isLoading } = useQuery({
    queryKey: ['public-settings'],
    queryFn: settingsApi.getPublic,
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
    refetchOnWindowFocus: true,
  });

  const settings = { ...defaultSettings, ...data };

  const formatPrice = (price: number) => {
    const formatted = price.toLocaleString();
    return `${settings.currency} ${formatted}`;
  };

  return (
    <SettingsContext.Provider value={{ settings, isLoading, formatPrice }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

// Hook for just getting the currency formatter
export function useCurrency() {
  const { formatPrice, settings } = useSettings();
  return { formatPrice, currency: settings.currency };
}

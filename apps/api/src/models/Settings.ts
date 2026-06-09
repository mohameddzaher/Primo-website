// ============================================
// PRIMO API - Settings Model
// ============================================

import mongoose, { Document, Schema } from 'mongoose';

export interface ISettings extends Document {
  _id: mongoose.Types.ObjectId;
  // General
  siteName: string;
  siteDescription: string;
  siteEmail: string;
  sitePhone: string;
  siteAddress: string;
  currency: string;
  timezone: string;
  dateFormat: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  // Shipping
  shippingFee: number;
  freeShippingThreshold: number;
  enableFreeShipping: boolean;
  estimatedDeliveryDays: number;
  shippingZones: Array<{
    name: string;
    regions: string[];
    fee: number;
    freeShippingThreshold: number;
  }>;
  // Payment
  taxRate: number;
  enableTax: boolean;
  taxLabel: string;
  enableCOD: boolean;
  codFee: number;
  enableOnlinePayment: boolean;
  stripeEnabled: boolean;
  stripePublishableKey: string;
  stripeSecretKey: string;
  paypalEnabled: boolean;
  paypalClientId: string;
  paypalSecret: string;
  // Email
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  smtpSecure: boolean;
  emailFromName: string;
  emailFromAddress: string;
  enableOrderConfirmationEmail: boolean;
  enableShippingNotificationEmail: boolean;
  enableAccountEmails: boolean;
  enableMarketingEmails: boolean;
  // Social
  socialFacebook: string;
  socialInstagram: string;
  socialTwitter: string;
  socialYoutube: string;
  socialTiktok: string;
  socialLinkedin: string;
  socialWhatsapp: string;
  // Appearance
  logo: string;
  favicon: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  headerStyle: 'default' | 'transparent' | 'colored';
  footerStyle: 'default' | 'minimal' | 'expanded';
  productCardStyle: 'default' | 'minimal' | 'detailed';
  // SEO
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string[];
  googleAnalyticsId: string;
  facebookPixelId: string;
  // Notifications
  enablePushNotifications: boolean;
  enableEmailNotifications: boolean;
  lowStockThreshold: number;
  notifyOnNewOrder: boolean;
  notifyOnLowStock: boolean;
  notifyOnNewReview: boolean;
  adminNotificationEmails: string[];
  // Advanced
  enableReviews: boolean;
  reviewsRequireApproval: boolean;
  enableWishlist: boolean;
  enableCompare: boolean;
  maxCompareProducts: number;
  enableRecentlyViewed: boolean;
  recentlyViewedLimit: number;
  enableReferralProgram: boolean;
  referralRewardAmount: number;
  referralRewardType: 'fixed' | 'percentage';
  // Loyalty Program
  enableLoyaltyProgram: boolean;
  pointsPerCurrency: number;
  pointsRedemptionRate: number;
  referralBonusPoints: number;
  minPointsToRedeem: number;
  maxPointsPerOrder: number;
  // Metadata
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const settingsSchema = new Schema<ISettings>(
  {
    // General
    siteName: {
      type: String,
      default: 'PRIMO',
    },
    siteDescription: {
      type: String,
      default: '',
    },
    siteEmail: {
      type: String,
      default: 'support@primo.com',
    },
    sitePhone: {
      type: String,
      default: '',
    },
    siteAddress: {
      type: String,
      default: '',
    },
    currency: {
      type: String,
      default: 'SAR',
    },
    timezone: {
      type: String,
      default: 'Asia/Riyadh',
    },
    dateFormat: {
      type: String,
      default: 'DD/MM/YYYY',
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    maintenanceMessage: {
      type: String,
      default: 'We are currently undergoing maintenance. Please check back later.',
    },
    // Shipping
    shippingFee: {
      type: Number,
      default: 50,
    },
    freeShippingThreshold: {
      type: Number,
      default: 500,
    },
    enableFreeShipping: {
      type: Boolean,
      default: true,
    },
    estimatedDeliveryDays: {
      type: Number,
      default: 3,
    },
    shippingZones: [
      {
        name: String,
        regions: [String],
        fee: Number,
        freeShippingThreshold: Number,
      },
    ],
    // Payment
    taxRate: {
      type: Number,
      default: 14,
    },
    enableTax: {
      type: Boolean,
      default: true,
    },
    taxLabel: {
      type: String,
      default: 'VAT',
    },
    enableCOD: {
      type: Boolean,
      default: true,
    },
    codFee: {
      type: Number,
      default: 0,
    },
    enableOnlinePayment: {
      type: Boolean,
      default: true,
    },
    stripeEnabled: {
      type: Boolean,
      default: false,
    },
    stripePublishableKey: {
      type: String,
      default: '',
    },
    stripeSecretKey: {
      type: String,
      default: '',
    },
    paypalEnabled: {
      type: Boolean,
      default: false,
    },
    paypalClientId: {
      type: String,
      default: '',
    },
    paypalSecret: {
      type: String,
      default: '',
    },
    // Email
    smtpHost: {
      type: String,
      default: '',
    },
    smtpPort: {
      type: Number,
      default: 587,
    },
    smtpUser: {
      type: String,
      default: '',
    },
    smtpPassword: {
      type: String,
      default: '',
    },
    smtpSecure: {
      type: Boolean,
      default: false,
    },
    emailFromName: {
      type: String,
      default: 'PRIMO',
    },
    emailFromAddress: {
      type: String,
      default: 'noreply@primo.com',
    },
    enableOrderConfirmationEmail: {
      type: Boolean,
      default: true,
    },
    enableShippingNotificationEmail: {
      type: Boolean,
      default: true,
    },
    enableAccountEmails: {
      type: Boolean,
      default: true,
    },
    enableMarketingEmails: {
      type: Boolean,
      default: false,
    },
    // Social
    socialFacebook: {
      type: String,
      default: '',
    },
    socialInstagram: {
      type: String,
      default: 'https://www.instagram.com/energize.tech.s',
    },
    socialTwitter: {
      type: String,
      default: 'https://x.com/e_tech_s',
    },
    socialYoutube: {
      type: String,
      default: 'https://www.youtube.com/@E_TECH_S',
    },
    socialTiktok: {
      type: String,
      default: 'https://www.tiktok.com/@e.tech.s',
    },
    socialLinkedin: {
      type: String,
      default: '',
    },
    socialWhatsapp: {
      type: String,
      default: 'https://wa.me/966538486109',
    },
    // Appearance
    logo: {
      type: String,
      default: '',
    },
    favicon: {
      type: String,
      default: '',
    },
    primaryColor: {
      type: String,
      default: '#EA591D',
    },
    secondaryColor: {
      type: String,
      default: '#262B36',
    },
    accentColor: {
      type: String,
      default: '#F5F4F4',
    },
    headerStyle: {
      type: String,
      enum: ['default', 'transparent', 'colored'],
      default: 'default',
    },
    footerStyle: {
      type: String,
      enum: ['default', 'minimal', 'expanded'],
      default: 'default',
    },
    productCardStyle: {
      type: String,
      enum: ['default', 'minimal', 'detailed'],
      default: 'default',
    },
    // SEO
    metaTitle: {
      type: String,
      default: 'PRIMO - Premium E-Commerce',
    },
    metaDescription: {
      type: String,
      default: '',
    },
    metaKeywords: {
      type: [String],
      default: [],
    },
    googleAnalyticsId: {
      type: String,
      default: '',
    },
    facebookPixelId: {
      type: String,
      default: '',
    },
    // Notifications
    enablePushNotifications: {
      type: Boolean,
      default: false,
    },
    enableEmailNotifications: {
      type: Boolean,
      default: true,
    },
    lowStockThreshold: {
      type: Number,
      default: 10,
    },
    notifyOnNewOrder: {
      type: Boolean,
      default: true,
    },
    notifyOnLowStock: {
      type: Boolean,
      default: true,
    },
    notifyOnNewReview: {
      type: Boolean,
      default: true,
    },
    adminNotificationEmails: {
      type: [String],
      default: [],
    },
    // Advanced
    enableReviews: {
      type: Boolean,
      default: true,
    },
    reviewsRequireApproval: {
      type: Boolean,
      default: true,
    },
    enableWishlist: {
      type: Boolean,
      default: true,
    },
    enableCompare: {
      type: Boolean,
      default: true,
    },
    maxCompareProducts: {
      type: Number,
      default: 4,
    },
    enableRecentlyViewed: {
      type: Boolean,
      default: true,
    },
    recentlyViewedLimit: {
      type: Number,
      default: 10,
    },
    enableReferralProgram: {
      type: Boolean,
      default: false,
    },
    referralRewardAmount: {
      type: Number,
      default: 50,
    },
    referralRewardType: {
      type: String,
      enum: ['fixed', 'percentage'],
      default: 'fixed',
    },
    // Loyalty Program
    enableLoyaltyProgram: {
      type: Boolean,
      default: false,
    },
    pointsPerCurrency: {
      type: Number,
      default: 1, // 1 point per 1 SAR spent
    },
    pointsRedemptionRate: {
      type: Number,
      default: 100, // 100 points = 1 SAR discount
    },
    referralBonusPoints: {
      type: Number,
      default: 50,
    },
    minPointsToRedeem: {
      type: Number,
      default: 100,
    },
    maxPointsPerOrder: {
      type: Number,
      default: 0, // 0 = unlimited
    },
    // Metadata
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one settings document exists
settingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  } else {
    // Backfill social media defaults for existing records that have empty values
    const socialDefaults: Record<string, string> = {
      socialInstagram: 'https://www.instagram.com/energize.tech.s',
      socialTwitter: 'https://x.com/e_tech_s',
      socialYoutube: 'https://www.youtube.com/@E_TECH_S',
      socialTiktok: 'https://www.tiktok.com/@e.tech.s',
      socialWhatsapp: 'https://wa.me/966538486109',
    };
    let needsSave = false;
    for (const [key, value] of Object.entries(socialDefaults)) {
      if (!settings[key]) {
        (settings as any)[key] = value;
        needsSave = true;
      }
    }

    // Backfill theme color defaults for existing records with old values
    const colorDefaults: Record<string, { old: string; new: string }> = {
      primaryColor: { old: '#C9A96E', new: '#EA591D' },
      secondaryColor: { old: '#1A1A1A', new: '#262B36' },
      accentColor: { old: '#F5F0E8', new: '#F5F4F4' },
    };
    for (const [key, { old: oldVal, new: newVal }] of Object.entries(colorDefaults)) {
      if ((settings as any)[key] === oldVal) {
        (settings as any)[key] = newVal;
        needsSave = true;
      }
    }

    if (needsSave) {
      await settings.save();
    }
  }
  return settings;
};

export const Settings = mongoose.model<ISettings>('Settings', settingsSchema);

// ============================================
// i18n configuration
// ============================================

export type Locale = 'en' | 'ar';

export const LOCALES: Locale[] = ['en', 'ar'];

export const DEFAULT_LOCALE: Locale = 'en';

/** Locales that render right-to-left. */
export const RTL_LOCALES: Locale[] = ['ar'];

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  ar: 'العربية',
};

export function isRtl(locale: Locale): boolean {
  return RTL_LOCALES.includes(locale);
}

export function dirFor(locale: Locale): 'rtl' | 'ltr' {
  return isRtl(locale) ? 'rtl' : 'ltr';
}

/** Locale tag used for Intl number/date formatting (SAR, Saudi conventions). */
export function intlLocale(locale: Locale): string {
  return locale === 'ar' ? 'ar-SA' : 'en-SA';
}

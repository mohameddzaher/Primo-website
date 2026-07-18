'use client';

import { HiOutlineGlobeAlt } from 'react-icons/hi2';
import { useI18n } from '@/lib/i18n';
import { LOCALES, LOCALE_LABELS, type Locale } from '@/lib/i18n/config';
import { cn } from '@/lib/utils';

interface LanguageSwitcherProps {
  /** `compact` shows just the opposite language code — for tight header bars. */
  variant?: 'default' | 'compact';
  className?: string;
}

/**
 * Toggles the storefront between English and Arabic.
 * I18nProvider persists the choice and flips <html dir/lang>, so the whole
 * layout mirrors without a page reload.
 */
export function LanguageSwitcher({ variant = 'default', className }: LanguageSwitcherProps) {
  const { locale, setLocale } = useI18n();

  if (variant === 'compact') {
    const next: Locale = locale === 'ar' ? 'en' : 'ar';
    return (
      <button
        type="button"
        onClick={() => setLocale(next)}
        aria-label={`Switch to ${LOCALE_LABELS[next]}`}
        title={`Switch to ${LOCALE_LABELS[next]}`}
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium',
          'text-dark-600 hover:text-primary-600 hover:bg-beige-50 transition-colors',
          className
        )}
      >
        <HiOutlineGlobeAlt size={18} />
        <span>{LOCALE_LABELS[next]}</span>
      </button>
    );
  }

  return (
    <div
      role="group"
      aria-label="Language"
      className={cn(
        'inline-flex items-center rounded-lg border border-beige-300 bg-white p-0.5',
        className
      )}
    >
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLocale(l)}
          aria-pressed={locale === l}
          className={cn(
            'px-3 py-1 rounded-md text-sm font-medium transition-colors',
            locale === l
              ? 'bg-primary-600 text-white'
              : 'text-dark-600 hover:text-primary-600'
          )}
        >
          {LOCALE_LABELS[l]}
        </button>
      ))}
    </div>
  );
}

export default LanguageSwitcher;

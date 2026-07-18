'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import { Locale, DEFAULT_LOCALE, LOCALES, dirFor, isRtl, intlLocale } from './config';
import { en as coreEn, ar as coreAr, TranslationKey as CoreKey } from './dictionaries';
import { en as homeEn, ar as homeAr } from './dictionaries.home';
import { en as shopEn, ar as shopAr } from './dictionaries.shop';

// Namespaced dictionaries are merged into one lookup so callers just use t(key).
const en = { ...coreEn, ...homeEn, ...shopEn };
const ar = { ...coreAr, ...homeAr, ...shopAr };

export type TranslationKey = CoreKey | keyof typeof homeEn | keyof typeof shopEn;

const dictionaries: Record<Locale, Record<string, string>> = { en, ar };

const STORAGE_KEY = 'primo-locale';

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  /** Translate a key, optionally interpolating {placeholders}. */
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  dir: 'rtl' | 'ltr';
  isRtl: boolean;
  /** BCP-47 tag for Intl formatting (ar-SA / en-SA). */
  intlLocale: string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    key in vars ? String(vars[key]) : match
  );
}

export function I18nProvider({ children }: { children: ReactNode }) {
  // Always start from the default so server and client markup agree; the stored
  // preference is applied after mount to avoid a hydration mismatch.
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (stored && LOCALES.includes(stored)) {
        setLocaleState(stored);
      }
    } catch {
      // localStorage unavailable (private mode) — keep the default
    }
  }, []);

  // Keep the document in sync so CSS logical properties, text selection,
  // scrollbars and native form controls all mirror correctly.
  useEffect(() => {
    const root = document.documentElement;
    root.lang = locale;
    root.dir = dirFor(locale);
    root.classList.toggle('rtl', isRtl(locale));
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore persistence failures
    }
  }, []);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => {
      const dict = dictionaries[locale];
      // Fall back to English, then to the key itself, so a missing string is
      // always readable rather than rendering as blank.
      const template = dict?.[key] ?? (en as Record<string, string>)[key] ?? key;
      return interpolate(template, vars);
    },
    [locale]
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t,
      dir: dirFor(locale),
      isRtl: isRtl(locale),
      intlLocale: intlLocale(locale),
    }),
    [locale, setLocale, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return ctx;
}

/** Convenience hook when you only need the translate function. */
export function useT() {
  return useI18n().t;
}

export type { Locale };
export { LOCALES, DEFAULT_LOCALE } from './config';
export { LOCALE_LABELS } from './config';

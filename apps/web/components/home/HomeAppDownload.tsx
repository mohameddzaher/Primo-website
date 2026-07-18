'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCmsContent } from '@/lib/use-cms-content';
import { useT } from '@/lib/i18n';

function parseCmsJson(data: any, fallback: any) {
  try {
    if (data?.value) {
      return typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
    }
  } catch {}
  return fallback;
}

const defaultSettings = {
  enabled: true,
  title: 'Download the PRIMO App',
  subtitle: 'Shop smarter. Track orders. Get exclusive app-only deals — all from your pocket.',
  appStoreUrl: '',
  googlePlayUrl: '',
  badge: 'PRIMO Mobile',
};

/** Official Apple App Store icon */
function AppleIcon() {
  return (
    <svg className="w-7 h-7 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

/** Official Google Play 4-color icon */
function GooglePlayIcon() {
  return (
    <svg className="w-7 h-7 flex-shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      {/* Blue — left top */}
      <path d="M1.22.18C1.07.44 1 .76 1 1.13v21.74c0 .37.07.69.22.95L13.46 12z" fill="#4285F4" />
      {/* Green — upper half of arrow */}
      <path d="M17.56 8.55 1.22.18l-.02.18L13.46 12l4.1-3.45z" fill="#34A853" />
      {/* Red — lower half of arrow */}
      <path d="M1.2 23.64l16.36-8.37L13.46 12 1.2 23.46z" fill="#EA4335" />
      {/* Yellow — tip of arrow */}
      <path d="M22.78 11.2l-5.22-2.65L13.46 12l4.1 3.27 5.22-2.65c.75-.47.75-1.46 0-1.42z" fill="#FBBC04" />
    </svg>
  );
}

export function HomeAppDownload() {
  const t = useT();
  const { data: cms } = useCmsContent('homepage_app_download');

  const settings = parseCmsJson(cms, defaultSettings);

  if (settings.enabled === false) return null;
  if (!settings.appStoreUrl && !settings.googlePlayUrl) return null;

  return (
    <section className="bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 text-white overflow-hidden relative">
      {/* Background decorative blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary-600/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-primary-500/10 blur-3xl" />
      </div>

      <div className="container-custom py-16 sm:py-20 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
          {/* Left: Text content */}
          <div className="flex-1 text-center lg:text-start">
            {settings.badge && (
              <span className="inline-block px-3 py-1 bg-primary-600/20 text-primary-300 text-xs font-semibold rounded-full uppercase tracking-wider mb-4">
                {settings.badge}
              </span>
            )}

            <h2 className="text-3xl sm:text-4xl font-display font-bold text-white leading-tight mb-4">
              {settings.title}
            </h2>

            <p className="text-dark-300 text-base sm:text-lg max-w-lg mx-auto lg:mx-0 mb-8 leading-relaxed">
              {settings.subtitle}
            </p>

            {/* App store buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              {settings.appStoreUrl && (
                <Link
                  href={settings.appStoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 px-5 py-3 bg-white text-dark-900 rounded-xl font-medium text-sm hover:bg-beige-50 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  <AppleIcon />
                  <div className="text-start">
                    <div className="text-[10px] text-dark-500 leading-none">{t('home.downloadOnThe')}</div>
                    <div className="text-sm font-bold leading-tight">App Store</div>
                  </div>
                </Link>
              )}

              {settings.googlePlayUrl && (
                <Link
                  href={settings.googlePlayUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 px-5 py-3 bg-white text-dark-900 rounded-xl font-medium text-sm hover:bg-beige-50 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  <GooglePlayIcon />
                  <div className="text-start">
                    <div className="text-[10px] text-dark-500 leading-none">{t('home.getItOn')}</div>
                    <div className="text-sm font-bold leading-tight">Google Play</div>
                  </div>
                </Link>
              )}
            </div>
          </div>

          {/* Right: Phone mockup with mobApp screen */}
          <div className="flex-shrink-0 hidden lg:flex items-center justify-center">
            <div className="relative w-52">
              {/* Phone outer frame */}
              <div className="relative w-40 h-72 bg-dark-700 rounded-[2.75rem] border-4 border-dark-600 shadow-2xl mx-auto overflow-hidden">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-dark-700 rounded-b-2xl z-10" />

                {/* Screen: mobApp image fills the entire screen */}
                <div className="absolute inset-0 overflow-hidden rounded-[2.25rem]">
                  <Image
                    src="/images/mobApp.png"
                    alt={t('home.appMockupAlt')}
                    fill
                    className="object-cover"
                    sizes="160px"
                  />
                </div>

                {/* Home indicator */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-white/30 rounded-full z-10" />
              </div>

              {/* Glow */}
              <div className="absolute inset-0 -z-10 blur-2xl bg-primary-600/20 rounded-full scale-150" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HomeAppDownload;

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { cmsApi } from '@/lib/api';

interface AnnouncementMessage {
  text: string;
  enabled: boolean;
}

interface AnnouncementBarData {
  enabled: boolean;
  messages: AnnouncementMessage[];
}

export function AnnouncementBar() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fade, setFade] = useState(true);

  const { data: cmsContent } = useQuery({
    queryKey: ['cms-homepage_announcement_bar'],
    queryFn: () => cmsApi.getContent('homepage_announcement_bar'),
    staleTime: 5 * 60 * 1000,
  });

  let config: AnnouncementBarData | null = null;
  try {
    if (cmsContent?.value) {
      config = typeof cmsContent.value === 'string'
        ? JSON.parse(cmsContent.value)
        : cmsContent.value;
    }
  } catch {}

  const activeMessages = (config?.messages || []).filter((m) => m.enabled);
  const isEnabled = config?.enabled !== false;

  // Auto-rotate when 2+ messages
  useEffect(() => {
    if (activeMessages.length <= 1) return;
    const timer = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % activeMessages.length);
        setFade(true);
      }, 300);
    }, 4000);
    return () => clearInterval(timer);
  }, [activeMessages.length]);

  // No CMS data yet → show default bar so it never flashes empty
  const fallbackText = 'Free shipping on orders over EGP 500 🚚';
  const displayText = activeMessages.length > 0 ? activeMessages[currentIndex]?.text : null;

  // Hide only if explicitly disabled
  if (isEnabled === false) return null;

  const navLinks = (
    <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
      <Link
        href="/track-order"
        className="text-[10px] sm:text-xs text-white/90 hover:text-white font-medium transition-colors whitespace-nowrap underline-offset-2 hover:underline"
      >
        Track Order
      </Link>
      <span className="text-white/30 text-xs">|</span>
      <Link
        href="/help"
        className="text-[10px] sm:text-xs text-white/90 hover:text-white font-medium transition-colors whitespace-nowrap underline-offset-2 hover:underline"
      >
        Help Center
      </Link>
    </div>
  );

  // If CMS not loaded yet, show fallback with nav links
  if (!config && !displayText) {
    return (
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white h-9 flex items-center px-4 sm:px-6">
        <div className="flex-1 hidden sm:block" />
        <p className="flex-1 text-xs font-medium text-center">{fallbackText}</p>
        <div className="flex-1 hidden sm:flex justify-end">{navLinks}</div>
      </div>
    );
  }

  if (activeMessages.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white h-9 flex items-center px-4 sm:px-6 overflow-hidden">
      {/* Left — empty spacer for centering (desktop) */}
      <div className="flex-1 hidden sm:block" />

      {/* Center — rotating promotional message */}
      <div className="flex-1 flex items-center justify-center gap-2 min-w-0">
        <p
          className={`text-xs font-medium text-center truncate transition-opacity duration-300 ${fade ? 'opacity-100' : 'opacity-0'}`}
        >
          {displayText}
        </p>
        {/* Dot indicators for multi-message */}
        {activeMessages.length > 1 && (
          <div className="flex gap-1 flex-shrink-0">
            {activeMessages.map((_, i) => (
              <span
                key={i}
                className={`block w-1.5 h-1.5 rounded-full transition-colors duration-200 ${
                  i === currentIndex ? 'bg-white' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Right — Track Order + Help Center */}
      <div className="flex-1 flex justify-end">{navLinks}</div>
    </div>
  );
}

export default AnnouncementBar;

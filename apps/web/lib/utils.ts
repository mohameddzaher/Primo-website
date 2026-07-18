import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Class name utility
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// Format currency
export function formatCurrency(amount: number, currency = 'SAR'): string {
  return new Intl.NumberFormat('en-SA', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Format number
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-SA').format(num);
}

// Format date
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  return new Intl.DateTimeFormat('en-US', options || defaultOptions).format(new Date(date));
}

// Format date with time
export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

// Relative time
export function getRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;

  return formatDate(date);
}

// Slugify string
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Truncate text
export function truncate(text: string, length: number, suffix = '...'): string {
  if (text.length <= length) return text;
  return text.substring(0, length).trim() + suffix;
}

// Calculate discount price
export function getDiscountedPrice(price: number, discount: number): number {
  return price * (1 - discount / 100);
}

// Get discount percentage
export function getDiscountPercentage(originalPrice: number, salePrice: number): number {
  return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
}

// Generate random ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Debounce function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle function
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Check if device is mobile
export function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
}

// Check if device prefers reduced motion
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Storage helpers
export const storage = {
  get: <T>(key: string, defaultValue: T): T => {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  set: <T>(key: string, value: T): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Handle storage errors
    }
  },

  remove: (key: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch {
      // Handle storage errors
    }
  },
};

// Get initials from name
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Validate email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate phone (Saudi format)
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^(\+966|0)?5[0-9]{8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

// Format phone number
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('966')) {
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
  }
  if (cleaned.startsWith('0')) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }
  return phone;
}

// Order status helpers
export const orderStatusConfig = {
  new: { label: 'New', color: 'bg-blue-100 text-blue-700', icon: 'clock' },
  accepted: { label: 'Accepted', color: 'bg-purple-100 text-purple-700', icon: 'check' },
  in_progress: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-700', icon: 'loader' },
  out_for_delivery: { label: 'Out for Delivery', color: 'bg-orange-100 text-orange-700', icon: 'truck' },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-700', icon: 'check-circle' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: 'x-circle' },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-700', icon: 'alert-circle' },
};

// Payment method helpers
export const paymentMethodConfig = {
  cash_on_delivery: { label: 'Cash on Delivery', icon: 'banknote' },
  card: { label: 'Credit/Debit Card', icon: 'credit-card' },
  apple_pay: { label: 'Apple Pay', icon: 'apple' },
};

// Stock status helpers
export function getStockStatus(quantity: number, threshold = 5): {
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  label: string;
  color: string;
} {
  if (quantity === 0) {
    return { status: 'out_of_stock', label: 'Out of Stock', color: 'text-red-600' };
  }
  if (quantity <= threshold) {
    return { status: 'low_stock', label: `Only ${quantity} left`, color: 'text-orange-600' };
  }
  return { status: 'in_stock', label: 'In Stock', color: 'text-green-600' };
}

// Social proof message
export function getSocialProof(soldToday: number, stockQuantity: number): string | null {
  if (soldToday >= 20) return `${soldToday} people bought this today`;
  if (soldToday >= 10) return `Popular - ${soldToday} sold today`;
  if (soldToday >= 5) return `Trending - ${soldToday} sold today`;
  if (stockQuantity > 0 && stockQuantity <= 5) return `Only ${stockQuantity} left in stock`;
  return null;
}

// Rating helpers
export function getRatingLabel(rating: number): string {
  if (rating >= 4.5) return 'Excellent';
  if (rating >= 4) return 'Very Good';
  if (rating >= 3.5) return 'Good';
  if (rating >= 3) return 'Average';
  return 'Below Average';
}

// URL helpers
export function getProductUrl(slug: string): string {
  return `/products/${slug}`;
}

export function getCategoryUrl(slug: string): string {
  return `/categories/${slug}`;
}

export function getBlogUrl(slug: string): string {
  return `/blog/${slug}`;
}

// Array helpers
export function chunk<T>(array: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
    array.slice(i * size, i * size + size)
  );
}

export function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Normalize a category/product image value to an absolute URL.
 * Handles:  plain string URL, {url: string} object, relative /uploads/... path
 */
export function getImageUrl(image: any): string | undefined {
  if (!image) return undefined;
  const raw: string | undefined =
    typeof image === 'object'
      ? image.url || image.path || image.src
      : image;
  if (!raw || typeof raw !== 'string') return undefined;
  if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('data:')) return raw;
  // Relative path — prepend API server root (strip /api/v1 suffix)
  const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api/v1')
    .replace(/\/api\/v1\/?$/, '');
  return `${apiBase}${raw.startsWith('/') ? raw : `/${raw}`}`;
}

export function uniqueBy<T>(array: T[], key: keyof T): T[] {
  const seen = new Set();
  return array.filter((item) => {
    const k = item[key];
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

'use client';

import { cn } from '@/lib/utils';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const spinnerSizes = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <svg
      className={cn('animate-spin text-primary-600', spinnerSizes[size], className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

// Full page loading
export function PageLoading() {
  return (
    <div className="fixed inset-0 bg-beige-50/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="xl" />
        <p className="text-sm text-dark-600 font-medium">Loading...</p>
      </div>
    </div>
  );
}

// Section loading
export function SectionLoading({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <Spinner size="lg" />
      {text && <p className="text-sm text-dark-500">{text}</p>}
    </div>
  );
}

// Button loading content
export function ButtonLoading() {
  return (
    <div className="flex items-center gap-2">
      <Spinner size="sm" className="text-current" />
      <span>Loading...</span>
    </div>
  );
}

// Skeleton loading
export interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export function Skeleton({
  className,
  variant = 'text',
  width,
  height,
  lines = 1,
}: SkeletonProps) {
  const baseStyles = 'animate-pulse bg-beige-200';

  const variantStyles = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: '',
    rounded: 'rounded-lg',
  };

  if (lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(baseStyles, variantStyles[variant], className)}
            style={{
              width: i === lines - 1 ? '75%' : width || '100%',
              height: height || undefined,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(baseStyles, variantStyles[variant], className)}
      style={{ width: width || '100%', height: height || undefined }}
    />
  );
}

// Product card skeleton
export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-beige-200 overflow-hidden">
      <Skeleton variant="rectangular" className="aspect-square" />
      <div className="p-4 space-y-3">
        <Skeleton variant="text" width="30%" height={14} />
        <Skeleton variant="text" lines={2} />
        <div className="flex items-center gap-2">
          <Skeleton variant="text" width={60} height={16} />
          <Skeleton variant="text" width={80} height={20} />
        </div>
      </div>
    </div>
  );
}

// Product grid skeleton
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Table skeleton
export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-lg border border-beige-200">
      {/* Header */}
      <div className="bg-beige-50 px-4 py-3 grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} variant="text" height={14} width="70%" />
        ))}
      </div>
      {/* Rows */}
      <div className="divide-y divide-beige-200">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="px-4 py-3 grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
            {Array.from({ length: cols }).map((_, colIndex) => (
              <Skeleton key={colIndex} variant="text" height={16} width={colIndex === 0 ? '100%' : '60%'} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// Avatar skeleton
export function AvatarSkeleton({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
  };
  return <Skeleton variant="circular" className={sizes[size]} />;
}

// List item skeleton
export function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4">
      <AvatarSkeleton />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" width="40%" height={16} />
        <Skeleton variant="text" width="60%" height={14} />
      </div>
      <Skeleton variant="text" width={60} height={14} />
    </div>
  );
}

export default Spinner;

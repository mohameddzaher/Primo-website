'use client';

import { useState } from 'react';
import { HiStar } from 'react-icons/hi';
import { cn } from '@/lib/utils';

export interface RatingProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  showCount?: boolean;
  count?: number;
  readOnly?: boolean;
  onChange?: (value: number) => void;
  className?: string;
}

const sizes = {
  sm: { star: 14, text: 'text-xs' },
  md: { star: 18, text: 'text-sm' },
  lg: { star: 24, text: 'text-base' },
};

export function Rating({
  value,
  max = 5,
  size = 'md',
  showValue = false,
  showCount = false,
  count = 0,
  readOnly = true,
  onChange,
  className,
}: RatingProps) {
  const [hoverValue, setHoverValue] = useState(0);

  const handleClick = (rating: number) => {
    if (!readOnly && onChange) {
      onChange(rating);
    }
  };

  const handleMouseEnter = (rating: number) => {
    if (!readOnly) {
      setHoverValue(rating);
    }
  };

  const handleMouseLeave = () => {
    if (!readOnly) {
      setHoverValue(0);
    }
  };

  const displayValue = hoverValue || value;

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <div className="flex items-center">
        {Array.from({ length: max }).map((_, index) => {
          const rating = index + 1;
          const isFilled = rating <= displayValue;
          const isHalfFilled = !isFilled && rating - 0.5 <= displayValue;

          return (
            <button
              key={index}
              type="button"
              disabled={readOnly}
              onClick={() => handleClick(rating)}
              onMouseEnter={() => handleMouseEnter(rating)}
              onMouseLeave={handleMouseLeave}
              className={cn(
                'relative transition-transform',
                !readOnly && 'cursor-pointer hover:scale-110',
                readOnly && 'cursor-default'
              )}
            >
              {/* Background star (empty) */}
              <HiStar
                size={sizes[size].star}
                className="text-beige-300"
              />
              {/* Filled star (overlay) */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: isFilled ? '100%' : isHalfFilled ? '50%' : '0%' }}
              >
                <HiStar
                  size={sizes[size].star}
                  className="text-yellow-400"
                />
              </div>
            </button>
          );
        })}
      </div>
      {showValue && (
        <span className={cn('font-medium text-dark-700', sizes[size].text)}>
          {value.toFixed(1)}
        </span>
      )}
      {showCount && count > 0 && (
        <span className={cn('text-dark-500', sizes[size].text)}>
          ({count.toLocaleString()} {count === 1 ? 'review' : 'reviews'})
        </span>
      )}
    </div>
  );
}

// Rating summary for product pages
export interface RatingSummaryProps {
  averageRating: number;
  totalReviews: number;
  distribution: { [key: number]: number };
}

export function RatingSummary({
  averageRating,
  totalReviews,
  distribution,
}: RatingSummaryProps) {
  const maxCount = Math.max(...Object.values(distribution), 1);

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Average */}
      <div className="flex flex-col items-center justify-center p-4 bg-beige-50 rounded-xl">
        <span className="text-4xl font-bold text-dark-900">
          {averageRating.toFixed(1)}
        </span>
        <Rating value={averageRating} size="md" className="mt-2" />
        <span className="text-sm text-dark-500 mt-1">
          {totalReviews.toLocaleString()} reviews
        </span>
      </div>

      {/* Distribution */}
      <div className="flex-1 space-y-2">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = distribution[star] || 0;
          const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

          return (
            <div key={star} className="flex items-center gap-3">
              <div className="flex items-center gap-1 w-12">
                <span className="text-sm text-dark-600">{star}</span>
                <HiStar size={14} className="text-yellow-400" />
              </div>
              <div className="flex-1 h-2 bg-beige-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-sm text-dark-500 w-10 text-right">
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Star rating input for forms
export interface StarInputProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  error?: string;
}

export function StarInput({ value, onChange, label, error }: StarInputProps) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-sm font-medium text-dark-700">{label}</label>
      )}
      <Rating
        value={value}
        readOnly={false}
        onChange={onChange}
        size="lg"
      />
      {error && <p className="text-sm text-error-500">{error}</p>}
    </div>
  );
}

export default Rating;

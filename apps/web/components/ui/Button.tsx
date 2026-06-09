'use client';

import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'link';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  animated?: boolean;
}

const variants = {
  primary:
    'bg-dark-950 text-white hover:bg-primary-600 active:bg-primary-700 shadow-soft hover:shadow-soft-lg border-transparent',
  secondary:
    'bg-white text-dark-900 border-beige-300 hover:bg-beige-50 hover:border-beige-400 shadow-soft',
  ghost: 'text-dark-700 hover:bg-beige-100 hover:text-dark-900 border-transparent',
  outline:
    'bg-transparent text-dark-950 border-dark-950 hover:bg-dark-950 hover:text-white',
  danger: 'bg-error-500 text-white hover:bg-error-600 active:bg-error-700 border-transparent',
  link: 'text-primary-600 hover:text-primary-700 underline-offset-4 hover:underline border-transparent p-0',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2',
  icon: 'p-2',
};

const LoadingSpinner = () => (
  <svg
    className="animate-spin h-4 w-4"
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

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      animated = true,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    const buttonContent = (
      <>
        {isLoading ? <LoadingSpinner /> : leftIcon}
        {children}
        {!isLoading && rightIcon}
      </>
    );

    const baseStyles = cn(
      'inline-flex items-center justify-center font-medium rounded-lg border transition-all duration-200 ease-smooth',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
      variants[variant],
      variant !== 'link' && sizes[size],
      fullWidth && 'w-full',
      className
    );

    if (animated && !isDisabled) {
      return (
        <motion.button
          ref={ref}
          className={baseStyles}
          disabled={isDisabled}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          {...(props as HTMLMotionProps<'button'>)}
        >
          {buttonContent}
        </motion.button>
      );
    }

    return (
      <button ref={ref} className={baseStyles} disabled={isDisabled} {...props}>
        {buttonContent}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;

'use client';

import { forwardRef, HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'hover' | 'bordered' | 'ghost';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  animated?: boolean;
}

const variants = {
  default: 'bg-white border border-beige-200 shadow-soft',
  hover: 'bg-white border border-beige-200 shadow-soft hover:shadow-soft-lg hover:border-beige-300 hover:-translate-y-0.5 transition-all duration-300',
  bordered: 'bg-white border-2 border-beige-300',
  ghost: 'bg-transparent',
};

const paddings = {
  none: '',
  sm: 'p-3',
  md: 'p-4 md:p-5',
  lg: 'p-5 md:p-6 lg:p-8',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = 'default',
      padding = 'md',
      animated = false,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = cn(
      'rounded-xl',
      variants[variant],
      paddings[padding],
      className
    );

    if (animated) {
      return (
        <motion.div
          ref={ref}
          className={baseStyles}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          {...(props as HTMLMotionProps<'div'>)}
        >
          {children}
        </motion.div>
      );
    }

    return (
      <div ref={ref} className={baseStyles} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// Card Header
export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  action?: ReactNode;
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, title, description, action, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex items-start justify-between gap-4', className)}
        {...props}
      >
        <div className="flex-1 min-w-0">
          {title && (
            <h3 className="text-lg font-semibold text-dark-900 truncate">
              {title}
            </h3>
          )}
          {description && (
            <p className="mt-1 text-sm text-dark-500 line-clamp-2">
              {description}
            </p>
          )}
          {children}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

// Card Content
export const CardContent = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('', className)} {...props} />
));

CardContent.displayName = 'CardContent';

// Card Footer
export const CardFooter = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex items-center justify-between gap-4 pt-4 border-t border-beige-200',
      className
    )}
    {...props}
  />
));

CardFooter.displayName = 'CardFooter';

// Stat Card
export interface StatCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
  };
  icon?: ReactNode;
  description?: string;
}

export function StatCard({ title, value, change, icon, description }: StatCardProps) {
  return (
    <Card variant="hover" className="group h-full">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-dark-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-dark-900">{value}</p>
          {change && (
            <div className="mt-2 flex items-center gap-1">
              <span
                className={cn(
                  'text-sm font-medium',
                  change.type === 'increase'
                    ? 'text-success-600'
                    : 'text-error-600'
                )}
              >
                {change.type === 'increase' ? '+' : '-'}
                {Math.abs(change.value)}%
              </span>
              <span className="text-sm text-dark-400">vs last period</span>
            </div>
          )}
          {description && (
            <p className="mt-2 text-sm text-dark-500">{description}</p>
          )}
        </div>
        {icon && (
          <div className="p-3 rounded-xl bg-primary-50 text-primary-600 group-hover:bg-primary-100 transition-colors">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}

export default Card;

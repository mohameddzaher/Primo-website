'use client';

import { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?:
    | 'default'
    | 'primary'
    | 'secondary'
    | 'success'
    | 'warning'
    | 'error'
    | 'info';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  icon?: ReactNode;
}

const variants = {
  default: 'bg-beige-100 text-dark-700',
  primary: 'bg-primary-100 text-primary-700',
  secondary: 'bg-beige-200 text-dark-600',
  success: 'bg-success-50 text-success-600',
  warning: 'bg-warning-50 text-warning-600',
  error: 'bg-error-50 text-error-600',
  info: 'bg-blue-50 text-blue-600',
};

const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-0.5 text-xs',
  lg: 'px-3 py-1 text-sm',
};

const dotColors = {
  default: 'bg-dark-400',
  primary: 'bg-primary-500',
  secondary: 'bg-dark-400',
  success: 'bg-success-500',
  warning: 'bg-warning-500',
  error: 'bg-error-500',
  info: 'bg-blue-500',
};

export function Badge({
  className,
  variant = 'default',
  size = 'md',
  dot = false,
  icon,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full', dotColors[variant])}
        />
      )}
      {icon}
      {children}
    </span>
  );
}

// Status Badge for orders
export type OrderStatus =
  | 'new'
  | 'accepted'
  | 'in_progress'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'failed';

const orderStatusConfig: Record<
  OrderStatus,
  { label: string; variant: BadgeProps['variant'] }
> = {
  new: { label: 'New', variant: 'info' },
  accepted: { label: 'Accepted', variant: 'primary' },
  in_progress: { label: 'In Progress', variant: 'warning' },
  out_for_delivery: { label: 'Out for Delivery', variant: 'primary' },
  delivered: { label: 'Delivered', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'error' },
  failed: { label: 'Failed', variant: 'error' },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = orderStatusConfig[status] || orderStatusConfig.new;
  return (
    <Badge variant={config.variant} dot>
      {config.label}
    </Badge>
  );
}

// Payment Status Badge
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

const paymentStatusConfig: Record<
  PaymentStatus,
  { label: string; variant: BadgeProps['variant'] }
> = {
  pending: { label: 'Pending', variant: 'warning' },
  paid: { label: 'Paid', variant: 'success' },
  failed: { label: 'Failed', variant: 'error' },
  refunded: { label: 'Refunded', variant: 'info' },
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const config = paymentStatusConfig[status] || paymentStatusConfig.pending;
  return (
    <Badge variant={config.variant} dot>
      {config.label}
    </Badge>
  );
}

// Stock Badge
export function StockBadge({ quantity }: { quantity: number }) {
  if (quantity === 0) {
    return <Badge variant="error">Out of Stock</Badge>;
  }
  if (quantity <= 5) {
    return <Badge variant="warning">Only {quantity} left</Badge>;
  }
  return <Badge variant="success">In Stock</Badge>;
}

// Discount Badge
export function DiscountBadge({ percentage }: { percentage: number }) {
  return (
    <Badge variant="error" size="sm" className="font-bold">
      -{percentage}%
    </Badge>
  );
}

// New Badge
export function NewBadge() {
  return (
    <Badge variant="primary" size="sm" className="font-bold">
      NEW
    </Badge>
  );
}

// Featured Badge
export function FeaturedBadge() {
  return (
    <Badge variant="warning" size="sm" className="font-bold">
      FEATURED
    </Badge>
  );
}

export default Badge;

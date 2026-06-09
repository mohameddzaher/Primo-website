import type { Metadata } from 'next';
import PolicyPageContent from '@/components/PolicyPageContent';

export const metadata: Metadata = {
  title: 'Shipping Information | PRIMO',
  description: 'PRIMO shipping policy: delivery areas, shipping rates, order processing times, tracking information, and delivery instructions across Egypt.',
  openGraph: {
    title: 'Shipping Information | PRIMO',
    description: 'Learn about PRIMO delivery areas, shipping rates, and tracking.',
  },
};

export default function ShippingPage() {
  return <PolicyPageContent slug="shipping" fallbackTitle="Shipping Information" />;
}

import type { Metadata } from 'next';
import PolicyPageContent from '@/components/PolicyPageContent';

export const metadata: Metadata = {
  title: 'Returns & Exchanges | PRIMO',
  description: 'PRIMO return policy: 14-day return window, exchange process, refund timelines, and how to handle damaged or defective items.',
  openGraph: {
    title: 'Returns & Exchanges | PRIMO',
    description: 'Learn about PRIMO return and exchange policy.',
  },
};

export default function ReturnsPage() {
  return <PolicyPageContent slug="returns" fallbackTitle="Returns & Exchanges" />;
}

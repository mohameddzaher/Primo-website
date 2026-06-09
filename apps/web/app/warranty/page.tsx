import type { Metadata } from 'next';
import PolicyPageContent from '@/components/PolicyPageContent';

export const metadata: Metadata = {
  title: 'Warranty Policy | PRIMO',
  description: 'PRIMO warranty coverage: warranty periods by product category, what is covered, how to claim warranty, service options, and extended warranty plans.',
  openGraph: {
    title: 'Warranty Policy | PRIMO',
    description: 'Learn about PRIMO warranty coverage and how to claim warranty.',
  },
};

export default function WarrantyPage() {
  return <PolicyPageContent slug="warranty" fallbackTitle="Warranty Policy" />;
}

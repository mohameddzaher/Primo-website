import type { Metadata } from 'next';
import PolicyPageContent from '@/components/PolicyPageContent';

export const metadata: Metadata = {
  title: 'Terms of Service | PRIMO',
  description: 'Read the terms and conditions for using the PRIMO website. Covers account registration, orders, payments, shipping, returns, intellectual property, and user conduct.',
  openGraph: {
    title: 'Terms of Service | PRIMO',
    description: 'Read the terms and conditions for using the PRIMO website.',
  },
};

export default function TermsPage() {
  return <PolicyPageContent slug="terms" fallbackTitle="Terms of Service" />;
}

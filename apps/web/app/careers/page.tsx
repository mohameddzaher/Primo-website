import type { Metadata } from 'next';
import CareersPageContent from '@/components/CareersPageContent';

export const metadata: Metadata = {
  title: 'Careers | PRIMO',
  description: 'Join the PRIMO team! Explore career opportunities in engineering, marketing, operations, and more. Help us deliver premium home appliances across Saudi Arabia.',
  openGraph: {
    title: 'Careers at PRIMO',
    description: 'Explore career opportunities at PRIMO.',
  },
};

export default function CareersPage() {
  return <CareersPageContent />;
}

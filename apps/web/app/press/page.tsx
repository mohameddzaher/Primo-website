import type { Metadata } from 'next';
import PressPageContent from '@/components/PressPageContent';

export const metadata: Metadata = {
  title: 'Press & Media | PRIMO',
  description: 'PRIMO press and media resources. Company facts, press releases, media inquiries, and brand assets for Egypt\'s leading home appliance e-commerce platform.',
  openGraph: {
    title: 'Press & Media | PRIMO',
    description: 'Latest news and media resources from PRIMO.',
  },
};

export default function PressPage() {
  return <PressPageContent />;
}

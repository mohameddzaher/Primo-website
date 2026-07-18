import type { Metadata } from 'next';
import AboutPageContent from '@/components/AboutPageContent';

export const metadata: Metadata = {
  title: 'About Us | PRIMO',
  description: 'Learn about PRIMO - Saudi Arabia\'s leading e-commerce platform for premium home appliances. Our story, mission, values, and the team behind PRIMO.',
  openGraph: {
    title: 'About PRIMO',
    description: 'Learn about PRIMO - Saudi Arabia\'s leading e-commerce platform for premium home appliances.',
  },
};

export default function AboutPage() {
  return <AboutPageContent />;
}

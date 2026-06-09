import type { Metadata } from 'next';
import ContactPageContent from '@/components/ContactPageContent';

export const metadata: Metadata = {
  title: 'Contact Us | PRIMO',
  description: 'Get in touch with PRIMO. Contact us for questions about orders, products, returns, or general inquiries. Email, phone, and social media support available.',
  openGraph: {
    title: 'Contact Us | PRIMO',
    description: 'Get in touch with PRIMO for questions, support, and inquiries.',
  },
};

export default function ContactPage() {
  return <ContactPageContent />;
}

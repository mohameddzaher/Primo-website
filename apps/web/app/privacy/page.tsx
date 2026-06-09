import type { Metadata } from 'next';
import PolicyPageContent from '@/components/PolicyPageContent';

export const metadata: Metadata = {
  title: 'Privacy Policy | PRIMO',
  description: 'Learn how PRIMO collects, uses, and protects your personal information. Read our comprehensive privacy policy covering data security, cookies, and your rights.',
  openGraph: {
    title: 'Privacy Policy | PRIMO',
    description: 'Learn how PRIMO collects, uses, and protects your personal information.',
  },
};

export default function PrivacyPage() {
  return <PolicyPageContent slug="privacy" fallbackTitle="Privacy Policy" />;
}

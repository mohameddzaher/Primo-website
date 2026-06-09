import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Help Center | PRIMO',
  description: 'Get help with your PRIMO orders, returns, payments, and more. Contact our support team anytime.',
};

const topics = [
  {
    icon: '📦',
    title: 'Orders & Shipping',
    links: [
      { label: 'Track my order', href: '/track-order' },
      { label: 'Change or cancel an order', href: '/help#orders' },
      { label: 'Delivery times & fees', href: '/help#shipping' },
    ],
  },
  {
    icon: '↩️',
    title: 'Returns & Refunds',
    links: [
      { label: '30-day return policy', href: '/help#returns' },
      { label: 'How to start a return', href: '/help#returns' },
      { label: 'Refund status', href: '/help#refunds' },
    ],
  },
  {
    icon: '💳',
    title: 'Payments',
    links: [
      { label: 'Accepted payment methods', href: '/help#payments' },
      { label: 'Payment issues', href: '/help#payments' },
      { label: 'Installment options', href: '/help#payments' },
    ],
  },
  {
    icon: '🛡️',
    title: 'Warranty & Support',
    links: [
      { label: '2-year warranty coverage', href: '/help#warranty' },
      { label: 'Product support', href: '/help#support' },
      { label: 'Authorized service centers', href: '/help#service' },
    ],
  },
  {
    icon: '👤',
    title: 'Account',
    links: [
      { label: 'Create or log in to account', href: '/auth/login' },
      { label: 'Update personal info', href: '/account' },
      { label: 'Loyalty points & rewards', href: '/account/points' },
    ],
  },
  {
    icon: '📞',
    title: 'Contact Us',
    links: [
      { label: 'Live chat support', href: '/contact' },
      { label: 'Email us', href: '/contact' },
      { label: 'Call us: +20 123 456 789', href: 'tel:+20123456789' },
    ],
  },
];

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-beige-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-12 md:py-16">
        <div className="container-custom text-center">
          <h1 className="text-2xl md:text-4xl font-display font-bold mb-3">How can we help?</h1>
          <p className="text-white/80 text-sm md:text-base max-w-xl mx-auto">
            Browse topics below or contact our support team — available 24/7 to assist you.
          </p>
        </div>
      </div>

      {/* Topics Grid */}
      <div className="container-custom py-10 md:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {topics.map((topic) => (
            <div
              key={topic.title}
              className="bg-white rounded-xl p-5 border border-beige-200 hover:border-primary-200 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{topic.icon}</span>
                <h2 className="text-base font-semibold text-dark-900">{topic.title}</h2>
              </div>
              <ul className="space-y-2">
                {topic.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-dark-600 hover:text-primary-600 hover:underline transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-10 text-center">
          <p className="text-dark-500 text-sm mb-4">Still need help?</p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors shadow-sm hover:shadow-md"
          >
            Contact Support →
          </Link>
        </div>
      </div>
    </main>
  );
}

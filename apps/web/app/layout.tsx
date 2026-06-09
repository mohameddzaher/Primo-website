import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import { Providers } from '@/components/Providers';
import { ConditionalLayout } from '@/components/layout';
import '@/styles/globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    default: 'PRIMO - Premium Home Appliances',
    template: '%s | PRIMO',
  },
  description:
    'Discover premium home appliances at PRIMO. Shop kitchen appliances, coffee machines, small appliances, and home essentials with free shipping on orders over EGP 2,000.',
  keywords: [
    'home appliances',
    'kitchen appliances',
    'coffee machines',
    'small appliances',
    'premium appliances',
    'Egypt',
  ],
  authors: [{ name: 'PRIMO' }],
  creator: 'PRIMO',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://primo.com',
    siteName: 'PRIMO',
    title: 'PRIMO - Premium Home Appliances',
    description:
      'Discover premium home appliances at PRIMO. Shop kitchen appliances, coffee machines, small appliances, and home essentials.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'PRIMO - Premium Home Appliances',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PRIMO - Premium Home Appliances',
    description:
      'Discover premium home appliances at PRIMO. Shop kitchen appliances, coffee machines, small appliances, and home essentials.',
    images: ['/og-image.jpg'],
    creator: '@primo',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body className="min-h-screen bg-beige-50 font-sans antialiased">
        <Providers>
          <ConditionalLayout>{children}</ConditionalLayout>
        </Providers>
      </body>
    </html>
  );
}

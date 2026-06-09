'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  HiOutlineChartBar,
  HiOutlineDocumentText,
  HiOutlineShoppingBag,
  HiOutlineSwitchHorizontal,
  HiOutlineSearchCircle,
  HiOutlineShieldCheck,
} from 'react-icons/hi';
import { cn } from '@/lib/utils';

const seoTabs = [
  { name: 'Overview', href: '/admin/seo', icon: HiOutlineChartBar, exact: true },
  { name: 'Pages', href: '/admin/seo/pages', icon: HiOutlineDocumentText },
  { name: 'Products', href: '/admin/seo/products', icon: HiOutlineShoppingBag },
  { name: 'Redirects', href: '/admin/seo/redirects', icon: HiOutlineSwitchHorizontal },
  { name: 'Keywords', href: '/admin/seo/keywords', icon: HiOutlineSearchCircle },
  { name: 'Audit', href: '/admin/seo/audit', icon: HiOutlineShieldCheck },
];

export default function SEOLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      {/* SEO Sub-Navigation */}
      <div className="border-b border-beige-200 -mx-4 lg:-mx-8 px-4 lg:px-8">
        <nav className="flex gap-1 overflow-x-auto scrollbar-hide -mb-px">
          {seoTabs.map((tab) => {
            const isActive = tab.exact
              ? pathname === tab.href
              : pathname === tab.href || pathname.startsWith(tab.href + '/');

            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors',
                  isActive
                    ? 'border-primary-600 text-primary-700'
                    : 'border-transparent text-dark-500 hover:text-dark-700 hover:border-beige-300'
                )}
              >
                <tab.icon size={18} />
                {tab.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Page Content */}
      {children}
    </div>
  );
}

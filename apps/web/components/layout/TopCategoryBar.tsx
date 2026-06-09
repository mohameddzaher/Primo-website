'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { categoriesApi, cmsApi } from '@/lib/api';
import { cn } from '@/lib/utils';

function parseCmsJson(data: any, fallback: any) {
  try {
    if (data?.value) {
      return typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
    }
  } catch {}
  return fallback;
}

export function TopCategoryBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeCategoryId = searchParams.get('category') || '';

  const { data: categories = [] } = useQuery({
    queryKey: ['categories-topbar'],
    queryFn: categoriesApi.getAll,
    staleTime: 5 * 60 * 1000,
  });

  const { data: settingsCms } = useQuery({
    queryKey: ['cms-homepage_topbar_settings'],
    queryFn: () => cmsApi.getContent('homepage_topbar_settings'),
    staleTime: 5 * 60 * 1000,
  });

  const settings = parseCmsJson(settingsCms, { enabled: true });

  // Hide if disabled by admin
  if (settings.enabled === false) return null;

  // Filter top-level categories and those enabled for top bar
  const topCategories = (categories as any[]).filter(
    (cat) => !cat.parentId && cat.isActive !== false && cat.showInTopBar !== false
  );

  // Sort by topBarOrder then by order
  topCategories.sort((a, b) => {
    const aOrder = a.topBarOrder ?? a.order ?? 0;
    const bOrder = b.topBarOrder ?? b.order ?? 0;
    return aOrder - bOrder;
  });

  if (topCategories.length === 0) return null;

  return (
    <div className="border-t border-beige-100 bg-white shadow-sm">
      <div className="container-custom">
        <div className="flex items-center overflow-x-auto scrollbar-hide gap-1 py-0">
          {/* All Products link */}
          <Link
            href="/products"
            className={cn(
              'flex-shrink-0 px-3 py-2.5 text-xs font-bold font-display whitespace-nowrap transition-colors border-b-2',
              pathname === '/products' && !activeCategoryId
                ? 'text-primary-600 border-primary-600'
                : 'text-dark-600 border-transparent hover:text-dark-900 hover:border-dark-300'
            )}
          >
            All Products
          </Link>

          <div className="h-3 w-px bg-beige-200 flex-shrink-0" />

          {topCategories.map((category: any) => {
            const isActive = activeCategoryId === category._id || activeCategoryId === category.slug;
            return (
              <Link
                key={category._id}
                href={`/products?category=${category._id}`}
                className={cn(
                  'flex-shrink-0 flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold font-display whitespace-nowrap transition-colors border-b-2',
                  isActive
                    ? 'text-primary-600 border-primary-600'
                    : 'text-dark-600 border-transparent hover:text-dark-900 hover:border-dark-300'
                )}
              >
                {category.icon && (
                  <span className="text-sm">{category.icon}</span>
                )}
                {category.name}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default TopCategoryBar;

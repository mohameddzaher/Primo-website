'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineFilter,
  HiOutlineViewGrid,
  HiViewList,
  HiX,
  HiChevronDown,
  HiOutlineStar,
  HiStar,
  HiOutlineTag,
  HiOutlineSparkles,
  HiOutlineSearch,
  HiOutlineTruck,
  HiOutlineReceiptTax,
  HiOutlineBadgeCheck,
  HiOutlineRefresh,
} from 'react-icons/hi';
import { productsApi, categoriesApi } from '@/lib/api';
import { queryKeys } from '@/lib/query-client';
import { ProductCard } from '@/components/product/ProductCard';
import {
  Button,
  Checkbox,
  Select,
  ProductGridSkeleton,
  Card,
} from '@/components/ui';
import { cn, formatCurrency } from '@/lib/utils';
import { useSettings } from '@/lib/settings-context';
import { useI18n } from '@/lib/i18n';
import type { TranslationKey } from '@/lib/i18n';

const sortOptions: { value: string; labelKey: TranslationKey }[] = [
  { value: '-createdAt', labelKey: 'shop.sort.newest' },
  { value: 'price', labelKey: 'shop.sort.priceLowHigh' },
  { value: '-price', labelKey: 'shop.sort.priceHighLow' },
  { value: '-averageRating', labelKey: 'shop.sort.topRated' },
  { value: '-soldCount', labelKey: 'shop.sort.bestSelling' },
  { value: 'title', labelKey: 'shop.sort.nameAsc' },
  { value: '-title', labelKey: 'shop.sort.nameDesc' },
];

// Sentinel used to split a translated template so the numeric part can be
// wrapped in .ltr-nums — otherwise "SAR 1,500" reorders inside Arabic text.
const NUM_SLOT = '\u0000';

function LtrTemplate({ text, values }: { text: string; values: string[] }) {
  const parts = text.split(NUM_SLOT);
  return (
    <>
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 && <span className="ltr-nums">{values[i]}</span>}
        </span>
      ))}
    </>
  );
}

// Bounds only — the visible label is built with the active locale at render time.
const priceRanges: { min: number; max: number | '' }[] = [
  { min: 0, max: 100 },
  { min: 100, max: 500 },
  { min: 500, max: 1000 },
  { min: 1000, max: 5000 },
  { min: 5000, max: '' },
];

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, isRtl } = useI18n();
  const { settings } = useSettings();
  const currency = settings.currency;

  // Price bucket labels use the shared currency formatter so figures stay LTR.
  const priceRangeLabel = (range: { min: number; max: number | '' }) => {
    if (range.max === '') return t('shop.filter.priceOver', { min: formatCurrency(range.min, currency) });
    if (range.min === 0) return t('shop.filter.priceUnder', { max: formatCurrency(range.max, currency) });
    return t('shop.filter.priceBetween', {
      min: formatCurrency(range.min, currency),
      max: formatCurrency(range.max, currency),
    });
  };

  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    categories: true,
    brands: true,
    price: true,
    rating: true,
    availability: true,
  });

  // Filter states
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    brands: (searchParams.get('brands') || '').split(',').filter(Boolean),
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    rating: searchParams.get('rating') || '',
    inStock: searchParams.get('inStock') === 'true',
    onSale: searchParams.get('onSale') === 'true',
    newArrivals: searchParams.get('newArrivals') === 'true',
    sort: searchParams.get('sort') || '-createdAt',
    page: parseInt(searchParams.get('page') || '1'),
  });

  // Fetch products - keepPreviousData prevents skeleton flash on filter changes
  const { data: productsData, isLoading: isLoadingProducts, isFetching } = useQuery({
    queryKey: queryKeys.products.list(filters),
    queryFn: () =>
      productsApi.getAll({
        search: filters.search || undefined,
        category: filters.category || undefined,
        brands: filters.brands.length > 0 ? filters.brands.join(',') : undefined,
        minPrice: filters.minPrice ? parseFloat(filters.minPrice) : undefined,
        maxPrice: filters.maxPrice ? parseFloat(filters.maxPrice) : undefined,
        rating: filters.rating ? parseFloat(filters.rating) : undefined,
        inStock: filters.inStock || undefined,
        onSale: filters.onSale || undefined,
        newArrivals: filters.newArrivals || undefined,
        sort: filters.sort,
        page: filters.page,
        limit: 12,
      }),
    placeholderData: keepPreviousData,
  });

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: queryKeys.categories.list(),
    queryFn: categoriesApi.getAll,
  });

  // Fetch brands — pulled directly from product brand strings so every brand
  // used on any product automatically appears in the filter without needing
  // a separate Brand document to be manually created.
  const { data: productBrandStrings = [] } = useQuery<string[]>({
    queryKey: ['product-brands'],
    queryFn: () => productsApi.getBrands() as Promise<string[]>,
    staleTime: 0,
  });
  const brands = (productBrandStrings as string[]).map((name) => ({ name }));

  const products = productsData?.products || [];
  const pagination = productsData?.pagination;

  // Refs for loop prevention
  const filtersRef = useRef(filters);
  filtersRef.current = filters;
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastPushedRef = useRef('');

  // Sync URL → filters when navigating via external links (e.g. TopCategoryBar)
  useEffect(() => {
    const currentSearch = searchParams.toString();
    // Skip if this is a URL we just pushed ourselves
    if (currentSearch === lastPushedRef.current) return;
    setFilters({
      search: searchParams.get('search') || '',
      category: searchParams.get('category') || '',
      brands: (searchParams.get('brands') || '').split(',').filter(Boolean),
      minPrice: searchParams.get('minPrice') || '',
      maxPrice: searchParams.get('maxPrice') || '',
      rating: searchParams.get('rating') || '',
      inStock: searchParams.get('inStock') === 'true',
      onSale: searchParams.get('onSale') === 'true',
      newArrivals: searchParams.get('newArrivals') === 'true',
      sort: searchParams.get('sort') || '-createdAt',
      page: parseInt(searchParams.get('page') || '1'),
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Update URL when filters change - use ref-based debounce to avoid loops
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const params = new URLSearchParams();
      const f = filtersRef.current;
      Object.entries(f).forEach(([key, value]) => {
        if (key === 'brands') {
          if (Array.isArray(value) && value.length > 0) {
            params.set(key, value.join(','));
          }
        } else if (key === 'sort' && value === '-createdAt') {
          // Skip default sort to keep URL clean
        } else if (key === 'page' && value === 1) {
          // Skip default page
        } else if (value && value !== '') {
          params.set(key, String(value));
        }
      });
      const search = params.toString();
      lastPushedRef.current = search;
      router.push(`/products${search ? `?${search}` : ''}`, { scroll: false });
    }, 300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handleFilterChange = (key: keyof typeof filters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePriceRange = (min: number | string, max: number | string) => {
    setFilters((prev) => ({
      ...prev,
      minPrice: String(min),
      maxPrice: max ? String(max) : '',
      page: 1,
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      brands: [],
      minPrice: '',
      maxPrice: '',
      rating: '',
      inStock: false,
      onSale: false,
      newArrivals: false,
      sort: 'newest',
      page: 1,
    });
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const activeFilterCount = [
    filters.category,
    filters.brands.length > 0,
    filters.minPrice || filters.maxPrice,
    filters.rating,
    filters.inStock,
    filters.onSale,
    filters.newArrivals,
  ].filter(Boolean).length;

  const hasActiveFilters = activeFilterCount > 0;

  // ── Quick entry pills ────────────────────────────────────────────────────
  // Low-friction ways into the catalogue for a shopper who arrived without a
  // clear intent. Each pill toggles: clicking an active pill removes it again.
  const clearPrice = () =>
    setFilters((prev) => ({ ...prev, minPrice: '', maxPrice: '', page: 1 }));

  const isPriceRange = (min: number, max: number | '') =>
    filters.minPrice === String(min) &&
    (max === '' ? !filters.maxPrice : filters.maxPrice === String(max));

  const toggleSort = (value: string) =>
    handleFilterChange('sort', filters.sort === value ? '-createdAt' : value);

  // Renders a price span with the figures isolated LTR.
  const priceLabelNode = (min: number | '', max: number | '') => {
    const minStr = min === '' ? '' : formatCurrency(Number(min), currency);
    const maxStr = max === '' ? '' : formatCurrency(Number(max), currency);
    if (max === '') {
      return <LtrTemplate text={t('shop.filter.priceOver', { min: NUM_SLOT })} values={[minStr]} />;
    }
    if (min === '' || Number(min) === 0) {
      return <LtrTemplate text={t('shop.filter.priceUnder', { max: NUM_SLOT })} values={[maxStr]} />;
    }
    return (
      <LtrTemplate
        text={t('shop.filter.priceBetween', { min: NUM_SLOT, max: NUM_SLOT })}
        values={[minStr, maxStr]}
      />
    );
  };

  // Plain-string twin of the above, for aria-labels.
  const priceLabelText = (min: number | '', max: number | '') => {
    const minStr = min === '' ? '' : formatCurrency(Number(min), currency);
    const maxStr = max === '' ? '' : formatCurrency(Number(max), currency);
    if (max === '') return t('shop.filter.priceOver', { min: minStr });
    if (min === '' || Number(min) === 0) return t('shop.filter.priceUnder', { max: maxStr });
    return t('shop.filter.priceBetween', { min: minStr, max: maxStr });
  };

  const quickPickBuckets: { min: number; max: number | '' }[] = [
    { min: 0, max: 500 },
    { min: 500, max: 1500 },
    { min: 1500, max: '' },
  ];

  const quickPicks: {
    id: string;
    label: React.ReactNode;
    ariaLabel: string;
    active: boolean;
    apply: () => void;
  }[] = [
    ...quickPickBuckets.map((bucket) => ({
      id: `price-${bucket.min}-${bucket.max}`,
      label: priceLabelNode(bucket.min, bucket.max),
      ariaLabel: priceLabelText(bucket.min, bucket.max),
      active: isPriceRange(bucket.min, bucket.max),
      apply: () =>
        isPriceRange(bucket.min, bucket.max)
          ? clearPrice()
          : handlePriceRange(bucket.min, bucket.max),
    })),
    {
      id: 'onSale',
      label: t('home.onSale'),
      ariaLabel: t('home.onSale'),
      active: filters.onSale,
      apply: () => handleFilterChange('onSale', !filters.onSale),
    },
    {
      id: 'newArrivals',
      label: t('home.newArrivals'),
      ariaLabel: t('home.newArrivals'),
      active: filters.newArrivals,
      apply: () => handleFilterChange('newArrivals', !filters.newArrivals),
    },
    {
      id: 'topRated',
      label: t('shop.sort.topRated'),
      ariaLabel: t('shop.sort.topRated'),
      active: filters.sort === '-averageRating',
      apply: () => toggleSort('-averageRating'),
    },
    {
      id: 'bestSelling',
      label: t('shop.sort.bestSelling'),
      ariaLabel: t('shop.sort.bestSelling'),
      active: filters.sort === '-soldCount',
      apply: () => toggleSort('-soldCount'),
    },
  ];

  // ── Active filter chips ──────────────────────────────────────────────────
  // Every applied filter gets its own removable chip so a shopper can peel one
  // constraint off at a time instead of resetting everything.
  const chips: {
    id: string;
    label: React.ReactNode;
    ariaLabel: string;
    tone: string;
    remove: () => void;
  }[] = [];

  if (filters.search) {
    chips.push({
      id: 'search',
      label: t('home.searchChip', { query: filters.search }),
      ariaLabel: t('shop.a11y.clearSearch'),
      tone: 'bg-beige-100 text-dark-700',
      remove: () => handleFilterChange('search', ''),
    });
  }

  if (filters.category) {
    const categoryName =
      categories?.find((cat: any) => cat._id === filters.category)?.name || filters.category;
    chips.push({
      id: 'category',
      label: categoryName,
      ariaLabel: t('shop.a11y.removeCategoryFilter'),
      tone: 'bg-primary-50 text-primary-700',
      remove: () => handleFilterChange('category', ''),
    });
  }

  filters.brands.forEach((brandName) => {
    chips.push({
      id: `brand-${brandName}`,
      label: brandName,
      ariaLabel: t('shop.a11y.removeFilter', { name: brandName }),
      tone: 'bg-primary-50 text-primary-700',
      remove: () =>
        handleFilterChange('brands', filters.brands.filter((b) => b !== brandName)),
    });
  });

  if (filters.minPrice || filters.maxPrice) {
    const min = filters.minPrice === '' ? '' : Number(filters.minPrice);
    const max = filters.maxPrice === '' ? '' : Number(filters.maxPrice);
    chips.push({
      id: 'price',
      label: priceLabelNode(min, max),
      ariaLabel: t('shop.a11y.removeFilter', { name: priceLabelText(min, max) }),
      tone: 'bg-primary-50 text-primary-700',
      remove: clearPrice,
    });
  }

  if (filters.rating) {
    const ratingLabel = t('home.ratingChip', { rating: filters.rating });
    chips.push({
      id: 'rating',
      label: ratingLabel,
      ariaLabel: t('shop.a11y.removeFilter', { name: ratingLabel }),
      tone: 'bg-yellow-50 text-yellow-800',
      remove: () => handleFilterChange('rating', ''),
    });
  }

  if (filters.inStock) {
    chips.push({
      id: 'inStock',
      label: t('shop.filter.inStockOnly'),
      ariaLabel: t('shop.a11y.removeFilter', { name: t('shop.filter.inStockOnly') }),
      tone: 'bg-green-50 text-green-700',
      remove: () => handleFilterChange('inStock', false),
    });
  }

  if (filters.onSale) {
    chips.push({
      id: 'onSale',
      label: t('home.onSale'),
      ariaLabel: t('shop.a11y.removeFilter', { name: t('home.onSale') }),
      tone: 'bg-red-50 text-red-700',
      remove: () => handleFilterChange('onSale', false),
    });
  }

  if (filters.newArrivals) {
    chips.push({
      id: 'newArrivals',
      label: t('home.newArrivals'),
      ariaLabel: t('shop.a11y.removeFilter', { name: t('home.newArrivals') }),
      tone: 'bg-blue-50 text-blue-700',
      remove: () => handleFilterChange('newArrivals', false),
    });
  }

  // ── Trust bar ────────────────────────────────────────────────────────────
  // Threshold, VAT rate and label all come from store settings — never hardcoded.
  const trustItems: { id: string; icon: React.ReactNode; label: React.ReactNode }[] = [
    {
      id: 'delivery',
      icon: <HiOutlineTruck size={15} className="rtl-flip text-primary-600" />,
      label: settings.enableFreeShipping ? (
        <LtrTemplate
          text={t('home.trustFreeDelivery', { amount: NUM_SLOT })}
          values={[formatCurrency(settings.freeShippingThreshold, currency)]}
        />
      ) : (
        t('home.trustFreeDeliveryAlt')
      ),
    },
    ...(settings.enableTax
      ? [
          {
            id: 'vat',
            icon: <HiOutlineReceiptTax size={15} className="text-primary-600" />,
            label: (
              <LtrTemplate
                text={t('home.trustVatIncluded', { rate: NUM_SLOT, label: settings.taxLabel })}
                values={[String(settings.taxRate)]}
              />
            ),
          },
        ]
      : []),
    {
      id: 'dealer',
      icon: <HiOutlineBadgeCheck size={15} className="text-primary-600" />,
      label: t('home.trustAuthorizedDealer'),
    },
    {
      id: 'returns',
      icon: <HiOutlineRefresh size={15} className="text-primary-600" />,
      label: t('home.trustEasyReturns'),
    },
  ];

  const FilterSection = ({
    title,
    section,
    children,
  }: {
    title: string;
    section: string;
    children: React.ReactNode;
  }) => (
    <div className="py-4 border-t border-beige-200">
      <button
        onClick={() => toggleSection(section)}
        className="w-full flex items-center justify-between text-sm font-medium text-dark-900 mb-3"
      >
        {title}
        <HiChevronDown
          size={16}
          className={cn(
            'rtl-flip transition-transform duration-200',
            expandedSections[section] ? 'rotate-180' : ''
          )}
        />
      </button>
      {expandedSections[section] && (
        <div>
          {children}
        </div>
      )}
    </div>
  );

  const FilterContent = () => (
    <>
      {/* Quick Filters */}
      <div className="pb-4 space-y-3">
        <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-beige-50 transition-colors">
          <input
            type="checkbox"
            checked={filters.onSale}
            onChange={(e) => handleFilterChange('onSale', e.target.checked)}
            className="w-4 h-4 rounded text-primary-600 border-beige-300"
          />
          <HiOutlineTag className="text-red-500" size={18} />
          <span className="text-sm text-dark-700">{t('home.onSale')}</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-beige-50 transition-colors">
          <input
            type="checkbox"
            checked={filters.newArrivals}
            onChange={(e) => handleFilterChange('newArrivals', e.target.checked)}
            className="w-4 h-4 rounded text-primary-600 border-beige-300"
          />
          <HiOutlineSparkles className="text-blue-500" size={18} />
          <span className="text-sm text-dark-700">{t('home.newArrivals')}</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-beige-50 transition-colors">
          <input
            type="checkbox"
            checked={filters.inStock}
            onChange={(e) => handleFilterChange('inStock', e.target.checked)}
            className="w-4 h-4 rounded text-primary-600 border-beige-300"
          />
          <span className="text-sm text-dark-700">{t('shop.filter.inStockOnly')}</span>
        </label>
      </div>

      {/* Categories */}
      <FilterSection title={t('nav.categories')} section="categories">
        <div className="space-y-2 max-h-48 overflow-y-auto pe-2">
          <label
            className={cn(
              'flex items-center gap-2 cursor-pointer p-2 rounded-lg transition-colors',
              !filters.category ? 'bg-primary-50 text-primary-700' : 'hover:bg-beige-50'
            )}
          >
            <input
              type="radio"
              name="category"
              checked={!filters.category}
              onChange={() => handleFilterChange('category', '')}
              className="sr-only"
            />
            <span className="text-sm">{t('nav.allCategories')}</span>
          </label>
          {categories?.map((cat: any) => (
            <label
              key={cat._id}
              className={cn(
                'flex items-center justify-between gap-2 cursor-pointer p-2 rounded-lg transition-colors',
                filters.category === cat._id
                  ? 'bg-primary-50 text-primary-700'
                  : 'hover:bg-beige-50'
              )}
            >
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="category"
                  checked={filters.category === cat._id}
                  onChange={() => handleFilterChange('category', cat._id)}
                  className="sr-only"
                />
                <span className="text-sm">{cat.name}</span>
              </div>
              {cat.productCount && (
                <span className="text-xs text-dark-400">({cat.productCount})</span>
              )}
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Brands */}
      <FilterSection title={t('nav.brands')} section="brands">
        <div className="space-y-2 max-h-48 overflow-y-auto pe-2">
          {brands?.map((brand: any) => {
            const isSelected = filters.brands.includes(brand.name);
            return (
              <label
                key={brand._id}
                className={cn(
                  'flex items-center gap-2 cursor-pointer p-2 rounded-lg transition-colors',
                  isSelected
                    ? 'bg-primary-50 text-primary-700'
                    : 'hover:bg-beige-50'
                )}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => {
                    const newBrands = isSelected
                      ? filters.brands.filter((b) => b !== brand.name)
                      : [...filters.brands, brand.name];
                    handleFilterChange('brands', newBrands);
                  }}
                  className="w-4 h-4 rounded text-primary-600 border-beige-300"
                />
                <span className="text-sm">{brand.name}</span>
                {brand.productCount > 0 && (
                  <span className="text-xs text-dark-400">({brand.productCount})</span>
                )}
              </label>
            );
          })}
        </div>
      </FilterSection>

      {/* Price Range */}
      <FilterSection title={t('shop.filter.priceRange')} section="price">
        <div className="space-y-2">
          {priceRanges.map((range) => (
            <label
              key={`${range.min}-${range.max}`}
              className={cn(
                'flex items-center gap-2 cursor-pointer p-2 rounded-lg transition-colors',
                filters.minPrice === String(range.min) &&
                  (range.max === '' ? !filters.maxPrice : filters.maxPrice === String(range.max))
                  ? 'bg-primary-50 text-primary-700'
                  : 'hover:bg-beige-50'
              )}
            >
              <input
                type="radio"
                name="priceRange"
                checked={
                  filters.minPrice === String(range.min) &&
                  (range.max === '' ? !filters.maxPrice : filters.maxPrice === String(range.max))
                }
                onChange={() => handlePriceRange(range.min, range.max)}
                className="sr-only"
              />
              <span className="text-sm">{priceRangeLabel(range)}</span>
            </label>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-beige-100">
          <p className="text-xs text-dark-500 mb-2">{t('shop.filter.customRange')}</p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder={t('shop.filter.min')}
              value={filters.minPrice}
              onChange={(e) => handleFilterChange('minPrice', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-beige-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
            <span className="text-dark-400">-</span>
            <input
              type="number"
              placeholder={t('shop.filter.max')}
              value={filters.maxPrice}
              onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-beige-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>
        </div>
      </FilterSection>

      {/* Rating */}
      <FilterSection title={t('shop.filter.customerRating')} section="rating">
        <div className="space-y-2">
          {[4, 3, 2, 1].map((rating) => (
            <label
              key={rating}
              className={cn(
                'flex items-center gap-2 cursor-pointer p-2 rounded-lg transition-colors',
                filters.rating === String(rating)
                  ? 'bg-primary-50 text-primary-700'
                  : 'hover:bg-beige-50'
              )}
            >
              <input
                type="radio"
                name="rating"
                checked={filters.rating === String(rating)}
                onChange={() =>
                  handleFilterChange(
                    'rating',
                    filters.rating === String(rating) ? '' : String(rating)
                  )
                }
                className="sr-only"
              />
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <span key={i}>
                    {i < rating ? (
                      <HiStar className="text-yellow-400" size={16} />
                    ) : (
                      <HiOutlineStar className="text-gray-300" size={16} />
                    )}
                  </span>
                ))}
              </div>
              <span className="text-sm text-dark-600">{t('shop.filter.andUp')}</span>
            </label>
          ))}
        </div>
      </FilterSection>
    </>
  );

  // Compute "Showing X–Y of Z items"
  const totalItems = pagination?.total || 0;
  const startItem = totalItems === 0 ? 0 : (filters.page - 1) * 12 + 1;
  const endItem = Math.min(filters.page * 12, totalItems);
  const countLabel = totalItems === 0
    ? t('shop.products.noItems')
    : t('shop.products.showingCount', {
        start: startItem,
        end: endItem,
        total: totalItems,
      });

  return (
    <div className="min-h-screen bg-beige-50">
      {/* Page Header */}
      <div className="bg-white border-b border-beige-200">
        <div className="container-custom py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-display font-semibold text-dark-900">
                {filters.search
                  ? t('shop.products.resultsFor', { query: filters.search })
                  : filters.category
                  ? (categories?.find((c: any) => c._id === filters.category)?.name || t('nav.products'))
                  : t('shop.products.all')}
              </h1>
              <p className="mt-0.5 text-sm text-dark-400">{countLabel}</p>
            </div>
            {/* Inline search */}
            <div className="relative w-full sm:w-64">
              <HiOutlineSearch className="absolute start-3 top-1/2 -translate-y-1/2 text-dark-400" size={16} />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder={t('shop.products.searchPlaceholder')}
                className="w-full ps-9 pe-4 py-2 text-sm border border-beige-300 rounded-lg bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
              />
              {filters.search && (
                <button
                  type="button"
                  onClick={() => handleFilterChange('search', '')}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-600"
                  aria-label={t('shop.a11y.clearSearch')}
                >
                  <HiX size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Quick entry pills — price bands and merchandising shortcuts */}
          <div className="mt-4">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
              <span className="hidden sm:inline flex-shrink-0 text-xs font-medium uppercase tracking-wider text-dark-400 me-1">
                {t('home.quickPicks')}
              </span>
              {quickPicks.map((pick) => (
                <button
                  key={pick.id}
                  type="button"
                  onClick={pick.apply}
                  aria-pressed={pick.active}
                  aria-label={pick.ariaLabel}
                  className={cn(
                    'flex-shrink-0 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium border transition-colors',
                    pick.active
                      ? 'bg-primary-600 border-primary-600 text-white'
                      : 'bg-white border-beige-300 text-dark-600 hover:border-primary-400 hover:text-primary-700'
                  )}
                >
                  {pick.label}
                </button>
              ))}
            </div>
          </div>

          {/* Active filter chips — each removable, plus a clear all */}
          {chips.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="hidden sm:inline text-xs font-medium uppercase tracking-wider text-dark-400 me-1">
                {t('home.activeFilters')}
              </span>
              {chips.map((chip) => (
                <span
                  key={chip.id}
                  className={cn(
                    'inline-flex items-center gap-1.5 ps-3 pe-2 py-1 rounded-full text-xs sm:text-sm',
                    chip.tone
                  )}
                >
                  <span className="max-w-[16rem] truncate">{chip.label}</span>
                  <button
                    type="button"
                    aria-label={chip.ariaLabel}
                    onClick={chip.remove}
                    className="opacity-60 hover:opacity-100 transition-opacity"
                  >
                    <HiX size={14} />
                  </button>
                </span>
              ))}
              <button
                type="button"
                onClick={() => {
                  clearFilters();
                }}
                className="text-xs sm:text-sm font-medium text-primary-600 hover:text-primary-700 underline underline-offset-2"
              >
                {t('shop.filter.clearAll')}
              </button>
            </div>
          )}
        </div>

        {/* Trust / benefit bar — reassurance right where the browsing starts */}
        <div className="border-t border-beige-100 bg-beige-50/70">
          <div className="container-custom">
            <ul className="flex items-center gap-5 sm:gap-8 overflow-x-auto scrollbar-hide py-2.5">
              {trustItems.map((item) => (
                <li
                  key={item.id}
                  className="flex-shrink-0 flex items-center gap-1.5 text-[11px] sm:text-xs text-dark-600"
                >
                  {item.icon}
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters - Desktop */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <Card padding="md" className="sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-dark-900">{t('shop.filter.title')}</h2>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    {t('shop.filter.clearAll')}
                  </button>
                )}
              </div>
              <FilterContent />
            </Card>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              {/* Mobile filter button */}
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<HiOutlineFilter size={16} />}
                onClick={() => setShowFilters(true)}
                className="lg:hidden"
              >
                {t('shop.filter.title')}
                {activeFilterCount > 0 && (
                  <span className="ms-1 w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>

              {/* Sort */}
              <div className="flex items-center gap-2 ms-auto">
                <span className="text-sm text-dark-500 hidden sm:inline">{t('shop.filter.sortBy')}</span>
                <select
                  value={filters.sort}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                  aria-label={t('shop.a11y.sortProducts')}
                  className="px-3 py-2 text-sm border border-beige-300 rounded-lg bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {t(option.labelKey)}
                    </option>
                  ))}
                </select>
              </div>

              {/* View mode */}
              <div className="hidden sm:flex items-center gap-1 p-1 bg-beige-100 rounded-lg">
                <button
                  type="button"
                  aria-label={t('shop.a11y.gridView')}
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'p-2 rounded-md transition-colors',
                    viewMode === 'grid'
                      ? 'bg-white text-dark-900 shadow-sm'
                      : 'text-dark-500 hover:text-dark-700'
                  )}
                >
                  <HiOutlineViewGrid size={18} />
                </button>
                <button
                  type="button"
                  aria-label={t('shop.a11y.listView')}
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'p-2 rounded-md transition-colors',
                    viewMode === 'list'
                      ? 'bg-white text-dark-900 shadow-sm'
                      : 'text-dark-500 hover:text-dark-700'
                  )}
                >
                  <HiViewList size={18} />
                </button>
              </div>
            </div>

            {/* Products Grid */}
            {isLoadingProducts ? (
              <ProductGridSkeleton count={12} />
            ) : products.length === 0 ? (
              <Card padding="lg" className="text-center py-16">
                <h3 className="text-lg font-medium text-dark-900">
                  {t('shop.products.noneFound')}
                </h3>
                <p className="mt-2 text-dark-500">
                  {t('shop.products.noneFoundHint')}
                </p>
                <Button variant="primary" className="mt-4" onClick={clearFilters}>
                  {t('shop.filter.clearFilters')}
                </Button>
              </Card>
            ) : (
              <>
                <div
                  className={cn(
                    viewMode === 'grid'
                      ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4'
                      : 'space-y-4',
                    isFetching && 'opacity-60 transition-opacity duration-200'
                  )}
                >
                  {products.map((product: any) => (
                    <ProductCard
                      key={product._id}
                      product={product}
                      variant={viewMode === 'list' ? 'horizontal' : 'default'}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={pagination.page === 1}
                      onClick={() =>
                        handleFilterChange('page', pagination.page - 1)
                      }
                    >
                      {t('common.previous')}
                    </Button>

                    {/* Page numbers */}
                    <div className="hidden sm:flex items-center gap-1">
                      {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                        let pageNum;
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.page <= 3) {
                          pageNum = i + 1;
                        } else if (pagination.page >= pagination.totalPages - 2) {
                          pageNum = pagination.totalPages - 4 + i;
                        } else {
                          pageNum = pagination.page - 2 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => handleFilterChange('page', pageNum)}
                            className={cn(
                              'w-10 h-10 rounded-lg text-sm font-medium transition-colors',
                              pagination.page === pageNum
                                ? 'bg-primary-600 text-white'
                                : 'bg-white border border-beige-300 text-dark-600 hover:bg-beige-50'
                            )}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <span className="sm:hidden px-4 text-sm text-dark-600">
                      {t('shop.products.pageOf', {
                        page: pagination.page,
                        total: pagination.totalPages,
                      })}
                    </span>

                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={pagination.page === pagination.totalPages}
                      onClick={() =>
                        handleFilterChange('page', pagination.page + 1)
                      }
                    >
                      {t('common.next')}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filters Sheet */}
      <AnimatePresence>
        {showFilters && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-dark-950/60 backdrop-blur-sm z-50 lg:hidden"
              onClick={() => setShowFilters(false)}
            />
            <motion.div
              initial={{ x: isRtl ? '100%' : '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: isRtl ? '100%' : '-100%' }}
              className="fixed inset-y-0 start-0 w-80 bg-white shadow-soft-xl z-50 lg:hidden flex flex-col"
            >
              <div className="sticky top-0 bg-white border-b border-beige-200 p-4 flex items-center justify-between">
                <h2 className="font-semibold text-dark-900">{t('shop.filter.title')}</h2>
                <div className="flex items-center gap-2">
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="text-sm text-primary-600 hover:text-primary-700"
                    >
                      {t('shop.filter.clear')}
                    </button>
                  )}
                  <button
                    type="button"
                    aria-label={t('shop.a11y.closeFilters')}
                    onClick={() => setShowFilters(false)}
                    className="p-2 text-dark-500 hover:text-dark-700"
                  >
                    <HiX size={20} />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <FilterContent />
              </div>
              <div className="sticky bottom-0 bg-white border-t border-beige-200 p-4">
                <Button fullWidth onClick={() => setShowFilters(false)}>
                  {t('shop.filter.showResults', { count: pagination?.total || 0 })}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

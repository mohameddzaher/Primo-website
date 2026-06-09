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
import { cn } from '@/lib/utils';

const sortOptions = [
  { value: '-createdAt', label: 'Newest First' },
  { value: 'price', label: 'Price: Low to High' },
  { value: '-price', label: 'Price: High to Low' },
  { value: '-averageRating', label: 'Highest Rated' },
  { value: '-soldCount', label: 'Best Selling' },
  { value: 'title', label: 'Name: A-Z' },
  { value: '-title', label: 'Name: Z-A' },
];

const priceRanges = [
  { label: 'Under EGP 100', min: 0, max: 100 },
  { label: 'EGP 100 - 500', min: 100, max: 500 },
  { label: 'EGP 500 - 1,000', min: 500, max: 1000 },
  { label: 'EGP 1,000 - 5,000', min: 1000, max: 5000 },
  { label: 'Over EGP 5,000', min: 5000, max: '' },
];

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

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
      sort: '-createdAt',
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
            'transition-transform duration-200',
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
          <span className="text-sm text-dark-700">On Sale</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-beige-50 transition-colors">
          <input
            type="checkbox"
            checked={filters.newArrivals}
            onChange={(e) => handleFilterChange('newArrivals', e.target.checked)}
            className="w-4 h-4 rounded text-primary-600 border-beige-300"
          />
          <HiOutlineSparkles className="text-blue-500" size={18} />
          <span className="text-sm text-dark-700">New Arrivals</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-beige-50 transition-colors">
          <input
            type="checkbox"
            checked={filters.inStock}
            onChange={(e) => handleFilterChange('inStock', e.target.checked)}
            className="w-4 h-4 rounded text-primary-600 border-beige-300"
          />
          <span className="text-sm text-dark-700">In Stock Only</span>
        </label>
      </div>

      {/* Categories */}
      <FilterSection title="Categories" section="categories">
        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
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
            <span className="text-sm">All Categories</span>
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
      <FilterSection title="Brands" section="brands">
        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
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
      <FilterSection title="Price Range" section="price">
        <div className="space-y-2">
          {priceRanges.map((range) => (
            <label
              key={range.label}
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
              <span className="text-sm">{range.label}</span>
            </label>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-beige-100">
          <p className="text-xs text-dark-500 mb-2">Custom Range</p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Min"
              value={filters.minPrice}
              onChange={(e) => handleFilterChange('minPrice', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-beige-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
            <span className="text-dark-400">-</span>
            <input
              type="number"
              placeholder="Max"
              value={filters.maxPrice}
              onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-beige-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>
        </div>
      </FilterSection>

      {/* Rating */}
      <FilterSection title="Customer Rating" section="rating">
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
              <span className="text-sm text-dark-600">& up</span>
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
    ? '0 items'
    : `Showing ${startItem}–${endItem} of ${totalItems} items`;

  return (
    <div className="min-h-screen bg-beige-50">
      {/* Page Header */}
      <div className="bg-white border-b border-beige-200">
        <div className="container-custom py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-display font-semibold text-dark-900">
                {filters.search
                  ? `Results for "${filters.search}"`
                  : filters.category
                  ? (categories?.find((c: any) => c._id === filters.category)?.name || 'Products')
                  : 'All Products'}
              </h1>
              <p className="mt-0.5 text-sm text-dark-400">{countLabel}</p>
            </div>
            {/* Inline search */}
            <div className="relative w-full sm:w-64">
              <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" size={16} />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Search products…"
                className="w-full pl-9 pr-4 py-2 text-sm border border-beige-300 rounded-lg bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
              />
              {filters.search && (
                <button
                  type="button"
                  onClick={() => handleFilterChange('search', '')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-600"
                  aria-label="Clear search"
                >
                  <HiX size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters - Desktop */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <Card padding="md" className="sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-dark-900">Filters</h2>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    Clear all
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
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-1 w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>

              {/* Active filters tags */}
              {hasActiveFilters && (
                <div className="hidden lg:flex items-center gap-2 flex-wrap">
                  {filters.category && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm">
                      {categories?.find((cat: any) => cat._id === filters.category)?.name || filters.category}
                      <button
                        type="button"
                        aria-label="Remove category filter"
                        onClick={() => handleFilterChange('category', '')}
                      >
                        <HiX size={14} />
                      </button>
                    </span>
                  )}
                  {filters.brands.map((brandName) => (
                    <span
                      key={brandName}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm"
                    >
                      {brandName}
                      <button
                        type="button"
                        aria-label={`Remove ${brandName} filter`}
                        onClick={() =>
                          handleFilterChange(
                            'brands',
                            filters.brands.filter((b) => b !== brandName)
                          )
                        }
                      >
                        <HiX size={14} />
                      </button>
                    </span>
                  ))}
                  {filters.onSale && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm">
                      On Sale
                      <button
                        type="button"
                        aria-label="Remove sale filter"
                        onClick={() => handleFilterChange('onSale', false)}
                      >
                        <HiX size={14} />
                      </button>
                    </span>
                  )}
                  {filters.newArrivals && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                      New Arrivals
                      <button
                        type="button"
                        aria-label="Remove new arrivals filter"
                        onClick={() => handleFilterChange('newArrivals', false)}
                      >
                        <HiX size={14} />
                      </button>
                    </span>
                  )}
                </div>
              )}

              {/* Sort */}
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-sm text-dark-500 hidden sm:inline">Sort by:</span>
                <select
                  value={filters.sort}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                  aria-label="Sort products"
                  className="px-3 py-2 text-sm border border-beige-300 rounded-lg bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* View mode */}
              <div className="hidden sm:flex items-center gap-1 p-1 bg-beige-100 rounded-lg">
                <button
                  type="button"
                  aria-label="Grid view"
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
                  aria-label="List view"
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
                  No products found
                </h3>
                <p className="mt-2 text-dark-500">
                  Try adjusting your filters or search term
                </p>
                <Button variant="primary" className="mt-4" onClick={clearFilters}>
                  Clear Filters
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
                      Previous
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
                      Page {pagination.page} of {pagination.totalPages}
                    </span>

                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={pagination.page === pagination.totalPages}
                      onClick={() =>
                        handleFilterChange('page', pagination.page + 1)
                      }
                    >
                      Next
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
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              className="fixed inset-y-0 left-0 w-80 bg-white shadow-soft-xl z-50 lg:hidden flex flex-col"
            >
              <div className="sticky top-0 bg-white border-b border-beige-200 p-4 flex items-center justify-between">
                <h2 className="font-semibold text-dark-900">Filters</h2>
                <div className="flex items-center gap-2">
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="text-sm text-primary-600 hover:text-primary-700"
                    >
                      Clear
                    </button>
                  )}
                  <button
                    type="button"
                    aria-label="Close filters"
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
                  Show {pagination?.total || 0} Results
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

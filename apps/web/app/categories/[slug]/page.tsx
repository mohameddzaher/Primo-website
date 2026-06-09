'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  HiOutlineAdjustments,
  HiOutlineViewGrid,
  HiOutlineViewList,
  HiOutlineChevronRight,
} from 'react-icons/hi';
import { Button, Card, Select } from '@/components/ui';
import { categoriesApi, productsApi } from '@/lib/api';

const sortOptions = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'popular', label: 'Most Popular' },
];

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);

  const { data: category, isLoading: categoryLoading } = useQuery({
    queryKey: ['category', slug],
    queryFn: () => categoriesApi.getBySlug(slug),
  });

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['products', { category: slug, sort, page }],
    queryFn: () =>
      productsApi.getAll({ category: slug, sort, page, limit: 12 }),
    enabled: !!slug,
  });

  const isLoading = categoryLoading || productsLoading;
  const products = productsData?.products || [];
  const pagination = productsData?.pagination;

  if (categoryLoading) {
    return (
      <div className="min-h-screen bg-beige-50 py-8">
        <div className="container mx-auto px-4">
          <div className="h-8 bg-beige-200 rounded w-1/4 mb-8 animate-pulse"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                <div className="aspect-square bg-beige-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-beige-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-beige-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-beige-50 py-8">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-2xl font-semibold text-dark-900 mb-4">
            Category Not Found
          </h1>
          <Link href="/categories">
            <Button>Browse All Categories</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-beige-50 py-8">
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-dark-500 mb-6">
          <Link href="/" className="hover:text-primary-600">
            Home
          </Link>
          <HiOutlineChevronRight size={16} />
          <Link href="/categories" className="hover:text-primary-600">
            Categories
          </Link>
          <HiOutlineChevronRight size={16} />
          <span className="text-dark-900">{category.name}</span>
        </nav>

        {/* Category Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-dark-900 mb-2">
            {category.name}
          </h1>
          {category.description && (
            <p className="text-dark-500">{category.description}</p>
          )}
        </div>

        {/* Subcategories */}
        {category.subcategories && category.subcategories.length > 0 && (
          <div className="mb-8">
            <div className="flex flex-wrap gap-2">
              {category.subcategories.map((sub: any) => (
                <Link key={sub._id} href={`/categories/${sub.slug}`}>
                  <span className="inline-block px-4 py-2 bg-white rounded-full text-dark-700 hover:bg-primary-50 hover:text-primary-600 transition-colors border border-beige-200">
                    {sub.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Filters and Sort */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <p className="text-dark-500">
            {pagination?.total || 0} products found
          </p>
          <div className="flex items-center gap-4">
            <Select
              options={sortOptions}
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              fullWidth={false}
              className="w-48"
            />
            <div className="flex items-center border border-beige-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setView('grid')}
                className={`p-2 ${
                  view === 'grid'
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-dark-400 hover:bg-beige-50'
                }`}
              >
                <HiOutlineViewGrid size={20} />
              </button>
              <button
                onClick={() => setView('list')}
                className={`p-2 ${
                  view === 'list'
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-dark-400 hover:bg-beige-50'
                }`}
              >
                <HiOutlineViewList size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-dark-500 mb-4">No products found in this category</p>
            <Link href="/products">
              <Button>Browse All Products</Button>
            </Link>
          </div>
        ) : (
          <>
            <div
              className={`grid gap-6 ${
                view === 'grid'
                  ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                  : 'grid-cols-1'
              }`}
            >
              {products.map((product: any, index: number) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link href={`/products/${product.slug}`}>
                    <Card
                      padding="sm"
                      className={`hover:shadow-soft-lg transition-all group ${
                        view === 'list' ? 'flex gap-4' : ''
                      }`}
                    >
                      {/* Product Image */}
                      <div
                        className={`bg-beige-100 rounded-lg overflow-hidden ${
                          view === 'list' ? 'w-32 h-32 flex-shrink-0' : 'aspect-square mb-3'
                        }`}
                      >
                        {product.images?.[0]?.url ? (
                          <img
                            src={product.images[0].url}
                            alt={product.images[0].alt || product.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-beige-400">
                            No Image
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className={view === 'list' ? 'flex-1 py-2' : ''}>
                        <h3 className="font-medium text-dark-900 group-hover:text-primary-600 transition-colors line-clamp-2 mb-1">
                          {product.title}
                        </h3>
                        {product.brand && (
                          <p className="text-sm text-dark-500 mb-2">{product.brand}</p>
                        )}
                        <div className="flex items-center gap-2">
                          {product.salePrice ? (
                            <>
                              <span className="font-semibold text-primary-600">
                                EGP {product.salePrice.toLocaleString()}
                              </span>
                              <span className="text-sm text-dark-400 line-through">
                                EGP {product.price.toLocaleString()}
                              </span>
                            </>
                          ) : (
                            <span className="font-semibold text-dark-900">
                              EGP {product.price.toLocaleString()}
                            </span>
                          )}
                        </div>
                        {product.rating > 0 && (
                          <div className="flex items-center gap-1 mt-2">
                            <span className="text-yellow-400">★</span>
                            <span className="text-sm text-dark-600">
                              {product.rating.toFixed(1)}
                            </span>
                            <span className="text-sm text-dark-400">
                              ({product.reviewCount})
                            </span>
                          </div>
                        )}
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <span className="text-dark-500 px-4">
                  Page {page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={page === pagination.totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

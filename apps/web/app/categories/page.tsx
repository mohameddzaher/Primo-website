'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { HiOutlineChevronRight } from 'react-icons/hi';
import { Card } from '@/components/ui';
import { categoriesApi } from '@/lib/api';

export default function CategoriesPage() {
  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll(),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-beige-50 py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-semibold text-dark-900 mb-8">
            All Categories
          </h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl p-6 animate-pulse h-48"
              >
                <div className="w-16 h-16 bg-beige-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-beige-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const categoryList = categories || [];

  return (
    <div className="min-h-screen bg-beige-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-semibold text-dark-900 mb-8">
          All Categories
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categoryList.map((category: any, index: number) => (
            <motion.div
              key={category._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link href={`/categories/${category.slug}`}>
                <Card
                  padding="lg"
                  className="h-full hover:shadow-soft-lg transition-all hover:-translate-y-1 group cursor-pointer"
                >
                  {/* Category Image/Icon */}
                  <div className="w-16 h-16 bg-primary-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary-200 transition-colors">
                    {category.image ? (
                      <img
                        src={category.image}
                        alt={category.name}
                        className="w-12 h-12 object-contain"
                      />
                    ) : (
                      <span className="text-2xl font-bold text-primary-600">
                        {category.name.charAt(0)}
                      </span>
                    )}
                  </div>

                  {/* Category Info */}
                  <h3 className="font-semibold text-dark-900 group-hover:text-primary-600 transition-colors mb-1">
                    {category.name}
                  </h3>
                  {category.description && (
                    <p className="text-sm text-dark-500 line-clamp-2 mb-3">
                      {category.description}
                    </p>
                  )}
                  <p className="text-sm text-dark-400">
                    {category.productCount || 0} products
                  </p>

                  {/* Subcategories */}
                  {category.children && category.children.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-beige-200">
                      <p className="text-xs text-dark-500 mb-2">Subcategories:</p>
                      <div className="flex flex-wrap gap-1">
                        {category.children.slice(0, 3).map((sub: any) => (
                          <span
                            key={sub._id}
                            className="text-xs bg-beige-100 text-dark-600 px-2 py-1 rounded"
                          >
                            {sub.name}
                          </span>
                        ))}
                        {category.children.length > 3 && (
                          <span className="text-xs text-dark-400">
                            +{category.children.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Arrow */}
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <HiOutlineChevronRight className="text-primary-600" size={20} />
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        {categoryList.length === 0 && (
          <div className="text-center py-12">
            <p className="text-dark-500">No categories found</p>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { HiOutlineCalendar, HiOutlineUser } from 'react-icons/hi';
import { Button, Card } from '@/components/ui';
import { blogApi } from '@/lib/api';

export default function BlogPage() {
  const [page, setPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: categoriesData } = useQuery({
    queryKey: ['blog-categories'],
    queryFn: () => blogApi.getCategories(),
  });

  const { data: postsData, isLoading } = useQuery({
    queryKey: ['blog-posts', page, selectedCategory],
    queryFn: () =>
      blogApi.getPosts({
        page,
        limit: 9,
        category: selectedCategory || undefined,
      }),
  });

  const categories = categoriesData || [];
  const posts = postsData?.posts || [];
  const pagination = postsData?.pagination;

  return (
    <div className="min-h-screen bg-beige-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-display font-semibold text-dark-900 mb-4">
            Our Blog
          </h1>
          <p className="text-dark-500 max-w-2xl mx-auto">
            Discover tips, guides, and inspiration for your home. From appliance
            care to lifestyle ideas, we've got you covered.
          </p>
        </div>

        {/* Categories */}
        {categories.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                !selectedCategory
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-dark-600 hover:bg-beige-100'
              }`}
            >
              All Posts
            </button>
            {categories.map((cat: any) => (
              <button
                key={cat._id}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === cat.slug
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-dark-600 hover:bg-beige-100'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Posts Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden animate-pulse">
                <div className="aspect-video bg-beige-200"></div>
                <div className="p-6">
                  <div className="h-4 bg-beige-200 rounded w-1/4 mb-3"></div>
                  <div className="h-6 bg-beige-200 rounded w-3/4 mb-3"></div>
                  <div className="h-4 bg-beige-200 rounded w-full"></div>
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-dark-500">No posts found</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post: any, index: number) => (
                <motion.article
                  key={post._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link href={`/blog/${post.slug}`}>
                    <Card padding="none" className="overflow-hidden group h-full">
                      {/* Featured Image */}
                      <div className="aspect-video bg-beige-100 overflow-hidden">
                        {post.featuredImage ? (
                          <img
                            src={post.featuredImage}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-beige-400">
                            No Image
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-6">
                        {/* Category */}
                        {post.categoryId && (
                          <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-full mb-3">
                            {post.categoryId.name}
                          </span>
                        )}

                        {/* Title */}
                        <h2 className="text-lg font-semibold text-dark-900 group-hover:text-primary-600 transition-colors mb-2 line-clamp-2">
                          {post.title}
                        </h2>

                        {/* Excerpt */}
                        {post.excerpt && (
                          <p className="text-dark-500 text-sm line-clamp-3 mb-4">
                            {post.excerpt}
                          </p>
                        )}

                        {/* Meta */}
                        <div className="flex items-center gap-4 text-xs text-dark-400">
                          <span className="flex items-center gap-1">
                            <HiOutlineCalendar size={14} />
                            {new Date(post.publishedAt || post.createdAt).toLocaleDateString()}
                          </span>
                          {post.authorId && (
                            <span className="flex items-center gap-1">
                              <HiOutlineUser size={14} />
                              {post.authorId.firstName} {post.authorId.lastName}
                            </span>
                          )}
                        </div>
                      </div>
                    </Card>
                  </Link>
                </motion.article>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
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

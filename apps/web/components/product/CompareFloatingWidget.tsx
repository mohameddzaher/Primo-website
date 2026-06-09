'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineX, HiOutlineScale, HiOutlineChevronUp, HiOutlineChevronDown } from 'react-icons/hi';
import { useCompareStore } from '@/lib/store';
import { productsApi } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui';

export function CompareFloatingWidget() {
  const { items, removeItem, clearCompare, maxItems } = useCompareStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Ensure component is mounted before accessing localStorage-based store
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch product details for compare items
  const { data: products } = useQuery({
    queryKey: ['compare-products', items],
    queryFn: async () => {
      if (items.length === 0) return [];
      const result = await productsApi.compare(items);
      return result || [];
    },
    enabled: items.length > 0 && isMounted,
  });

  // Don't render until mounted (to avoid hydration mismatch)
  if (!isMounted) return null;

  // Don't show if no items in compare
  if (items.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50"
      >
        <div className="bg-white rounded-xl shadow-xl border border-beige-200 overflow-hidden">
          {/* Header */}
          <div
            className="flex items-center justify-between p-4 bg-dark-900 text-white cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="flex items-center gap-2">
              <HiOutlineScale size={20} />
              <span className="font-medium">Compare Products</span>
              <span className="bg-primary-500 text-white text-xs px-2 py-0.5 rounded-full">
                {items.length}/{maxItems}
              </span>
            </div>
            <button
              type="button"
              className="p-1 hover:bg-dark-800 rounded transition-colors"
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? <HiOutlineChevronDown size={20} /> : <HiOutlineChevronUp size={20} />}
            </button>
          </div>

          {/* Expanded Content */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 space-y-3">
                  {/* Product Thumbnails */}
                  <div className="flex gap-2">
                    {items.map((productId) => {
                      const product = products?.find((p: any) => p._id === productId);
                      return (
                        <div key={productId} className="relative">
                          <div className="w-16 h-16 bg-beige-100 rounded-lg overflow-hidden">
                            {product?.images?.[0]?.url ? (
                              <img
                                src={product.images[0].url}
                                alt={product.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-beige-400">
                                <HiOutlineScale size={20} />
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeItem(productId);
                            }}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                            aria-label="Remove from compare"
                            title="Remove from compare"
                          >
                            <HiOutlineX size={12} />
                          </button>
                        </div>
                      );
                    })}

                    {/* Empty slots */}
                    {Array(maxItems - items.length)
                      .fill(null)
                      .map((_, i) => (
                        <div
                          key={`empty-${i}`}
                          className="w-16 h-16 border-2 border-dashed border-beige-300 rounded-lg flex items-center justify-center"
                        >
                          <span className="text-xs text-beige-400">+</span>
                        </div>
                      ))}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link href={`/products/compare?ids=${items.join(',')}`} className="flex-1">
                      <Button fullWidth disabled={items.length < 2}>
                        Compare Now
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      onClick={() => clearCompare()}
                      className="px-3"
                      title="Clear all"
                      aria-label="Clear all"
                    >
                      <HiOutlineX size={18} />
                    </Button>
                  </div>

                  {items.length < 2 && (
                    <p className="text-xs text-dark-500 text-center">
                      Add at least 2 products to compare
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default CompareFloatingWidget;

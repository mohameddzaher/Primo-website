'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  HiOutlineX,
  HiOutlineShoppingCart,
  HiOutlineCheck,
  HiOutlineMinus,
  HiOutlineStar,
  HiStar,
  HiOutlineScale,
  HiOutlineShieldCheck,
  HiOutlineBadgeCheck,
  HiOutlineChartBar,
  HiOutlineArrowLeft,
  HiOutlinePlus,
} from 'react-icons/hi';
import { Button } from '@/components/ui';
import { productsApi, cartApi } from '@/lib/api';
import { useCartStore, useCompareStore } from '@/lib/store';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useMemo } from 'react';

export default function ComparePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const ids = searchParams.get('ids')?.split(',').filter(Boolean) || [];
  const { addItem, openCart } = useCartStore();
  const { removeItem: removeFromCompare, clearCompare } = useCompareStore();

  const { data: products, isLoading, error } = useQuery({
    queryKey: ['compare', ids],
    queryFn: () => productsApi.compare(ids),
    enabled: ids.length >= 2,
  });

  const handleAddToCart = async (product: any) => {
    try {
      await cartApi.addItem(product._id, 1);
      addItem({
        productId: product._id,
        product: {
          id: product._id,
          title: product.title,
          slug: product.slug,
          price: product.price,
          discount: product.discount,
          images: product.images,
          stock: product.stockQuantity,
        },
        quantity: 1,
      });
      toast.success('Added to cart');
      openCart();
    } catch {
      toast.error('Failed to add to cart');
    }
  };

  const handleRemoveProduct = (productId: string) => {
    removeFromCompare(productId);
    const newIds = ids.filter(id => id !== productId);
    if (newIds.length >= 2) {
      router.push(`/products/compare?ids=${newIds.join(',')}`);
    } else if (newIds.length === 1) {
      toast.error('Need at least 2 products to compare');
      router.push('/products');
    } else {
      router.push('/products');
    }
  };

  const handleClearAll = () => {
    clearCompare();
    router.push('/products');
  };

  // Analysis calculations
  const analysis = useMemo(() => {
    if (!products || products.length < 2) return null;

    const prices = products.map((p: any) => {
      const finalPrice = p.discount ? p.price * (1 - p.discount / 100) : p.price;
      return { id: p._id, price: finalPrice, originalPrice: p.price };
    });

    const cheapest = prices.reduce((min: any, p: any) => p.price < min.price ? p : min, prices[0]);
    const mostExpensive = prices.reduce((max: any, p: any) => p.price > max.price ? p : max, prices[0]);

    const ratings = products.filter((p: any) => p.averageRating > 0).map((p: any) => ({
      id: p._id,
      rating: p.averageRating,
      reviewCount: p.reviewCount
    }));

    const bestRated = ratings.length > 0
      ? ratings.reduce((best: any, p: any) => p.rating > best.rating ? p : best, ratings[0])
      : null;

    // Best value (rating per price ratio)
    const valueScores = products.map((p: any) => {
      const finalPrice = p.discount ? p.price * (1 - p.discount / 100) : p.price;
      const rating = p.averageRating || 0;
      return {
        id: p._id,
        score: rating > 0 ? (rating / finalPrice) * 1000 : 0
      };
    });
    const bestValue = valueScores.reduce((best: any, p: any) => p.score > best.score ? p : best, valueScores[0]);

    return {
      cheapest: cheapest.id,
      mostExpensive: mostExpensive.id,
      bestRated: bestRated?.id,
      bestValue: bestValue.score > 0 ? bestValue.id : null,
      priceDifference: mostExpensive.price - cheapest.price,
      maxSavings: Math.max(...products.map((p: any) => p.discount || 0)),
    };
  }, [products]);

  // Get all unique specification keys grouped
  const specGroups = useMemo(() => {
    if (!products) return {};

    const groups: Record<string, Set<string>> = {};

    products.forEach((p: any) => {
      if (p.specs && Array.isArray(p.specs)) {
        p.specs.forEach((spec: any) => {
          const group = spec.group || 'General';
          if (!groups[group]) groups[group] = new Set();
          groups[group].add(spec.name);
        });
      }
    });

    // Convert Sets to Arrays
    const result: Record<string, string[]> = {};
    Object.keys(groups).forEach(group => {
      result[group] = Array.from(groups[group]);
    });

    return result;
  }, [products]);

  const getSpecValue = (product: any, specName: string) => {
    if (!product.specs || !Array.isArray(product.specs)) return null;
    const spec = product.specs.find((s: any) => s.name === specName);
    return spec?.value || null;
  };

  // Check if all products have the same value for a spec
  const areSpecsSame = (specName: string) => {
    if (!products || products.length < 2) return true;
    const values = products.map((p: any) => getSpecValue(p, specName)).filter(Boolean);
    if (values.length < 2) return true;
    return values.every(v => v === values[0]);
  };

  if (ids.length < 2) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-beige-50 to-white py-12">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto text-center"
          >
            <div className="w-24 h-24 mx-auto mb-6 bg-beige-100 rounded-full flex items-center justify-center">
              <HiOutlineScale className="w-12 h-12 text-beige-400" />
            </div>
            <h1 className="text-3xl font-bold text-dark-900 mb-4">
              Compare Products
            </h1>
            <p className="text-dark-500 mb-8 text-lg">
              Select at least 2 products to compare their features, specifications, and prices side by side.
            </p>
            <Link href="/products">
              <Button size="lg" leftIcon={<HiOutlineArrowLeft />}>
                Browse Products
              </Button>
            </Link>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="bg-white p-6 rounded-xl shadow-soft">
                <HiOutlineChartBar className="w-8 h-8 text-primary-500 mb-3" />
                <h3 className="font-semibold text-dark-900 mb-2">Side by Side</h3>
                <p className="text-sm text-dark-500">View all product details in an easy-to-compare format</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-soft">
                <HiOutlineBadgeCheck className="w-8 h-8 text-primary-500 mb-3" />
                <h3 className="font-semibold text-dark-900 mb-2">Best Value</h3>
                <p className="text-sm text-dark-500">Identify the best product for your needs and budget</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-soft">
                <HiOutlineShieldCheck className="w-8 h-8 text-primary-500 mb-3" />
                <h3 className="font-semibold text-dark-900 mb-2">Make Decisions</h3>
                <p className="text-sm text-dark-500">Compare specs, warranty, and more to choose wisely</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-beige-50 to-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-dark-900 mb-8">
            Compare Products
          </h1>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {ids.map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 animate-pulse shadow-soft">
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

  if (error || !products || products.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-beige-50 to-white py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold text-dark-900 mb-4">
            Unable to Compare
          </h1>
          <p className="text-dark-500 mb-8">
            Some products may no longer be available. Please try selecting different products.
          </p>
          <Link href="/products">
            <Button>Browse Products</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-beige-50 to-white py-8 md:py-12">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 text-dark-500 hover:text-primary-600 transition-colors mb-2"
              >
                <HiOutlineArrowLeft />
                Back to Products
              </Link>
              <h1 className="text-2xl md:text-3xl font-bold text-dark-900">
                Comparing {products.length} Products
              </h1>
            </div>
            <div className="flex gap-3">
              <Link href="/products">
                <Button variant="outline" leftIcon={<HiOutlinePlus />}>
                  Add More
                </Button>
              </Link>
              <Button variant="ghost" onClick={handleClearAll}>
                Clear All
              </Button>
            </div>
          </div>

          {/* Quick Analysis Cards */}
          {analysis && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-green-50 border border-green-200 rounded-xl p-4"
              >
                <p className="text-xs text-green-600 uppercase tracking-wide font-medium mb-1">Lowest Price</p>
                <p className="text-lg font-bold text-green-700">
                  {formatCurrency(products.find((p: any) => p._id === analysis.cheapest)?.price *
                    (1 - (products.find((p: any) => p._id === analysis.cheapest)?.discount || 0) / 100))}
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-blue-50 border border-blue-200 rounded-xl p-4"
              >
                <p className="text-xs text-blue-600 uppercase tracking-wide font-medium mb-1">Price Range</p>
                <p className="text-lg font-bold text-blue-700">
                  {formatCurrency(analysis.priceDifference)}
                </p>
              </motion.div>
              {analysis.bestRated && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="bg-yellow-50 border border-yellow-200 rounded-xl p-4"
                >
                  <p className="text-xs text-yellow-600 uppercase tracking-wide font-medium mb-1">Best Rated</p>
                  <p className="text-lg font-bold text-yellow-700 flex items-center gap-1">
                    <HiStar className="text-yellow-500" />
                    {products.find((p: any) => p._id === analysis.bestRated)?.averageRating?.toFixed(1)}
                  </p>
                </motion.div>
              )}
              {analysis.maxSavings > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="bg-red-50 border border-red-200 rounded-xl p-4"
                >
                  <p className="text-xs text-red-600 uppercase tracking-wide font-medium mb-1">Max Discount</p>
                  <p className="text-lg font-bold text-red-700">
                    {analysis.maxSavings}% OFF
                  </p>
                </motion.div>
              )}
            </div>
          )}

          {/* Comparison Table */}
          <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                {/* Product Cards Header */}
                <thead>
                  <tr className="border-b border-beige-200">
                    <th className="sticky left-0 bg-white p-4 text-left text-dark-500 font-medium min-w-[160px] md:min-w-[200px] z-10">
                      <span className="hidden md:inline">Product Details</span>
                    </th>
                    {products.map((product: any) => (
                      <td key={product._id} className="p-4 min-w-[200px] md:min-w-[250px]">
                        <div className="relative">
                          {/* Remove button */}
                          <button
                            type="button"
                            onClick={() => handleRemoveProduct(product._id)}
                            className="absolute -top-2 -right-2 w-8 h-8 bg-red-100 hover:bg-red-200 text-red-600 rounded-full flex items-center justify-center transition-colors z-10"
                            title="Remove from compare"
                          >
                            <HiOutlineX size={16} />
                          </button>

                          {/* Badges */}
                          <div className="absolute top-0 left-0 flex flex-col gap-1 z-10">
                            {analysis?.cheapest === product._id && (
                              <span className="text-[10px] px-2 py-0.5 bg-green-500 text-white rounded-full font-medium">
                                Lowest Price
                              </span>
                            )}
                            {analysis?.bestRated === product._id && (
                              <span className="text-[10px] px-2 py-0.5 bg-yellow-500 text-white rounded-full font-medium">
                                Best Rated
                              </span>
                            )}
                            {analysis?.bestValue === product._id && analysis?.bestValue !== analysis?.cheapest && analysis?.bestValue !== analysis?.bestRated && (
                              <span className="text-[10px] px-2 py-0.5 bg-primary-500 text-white rounded-full font-medium">
                                Best Value
                              </span>
                            )}
                          </div>

                          <Link href={`/products/${product.slug}`} className="block">
                            <div className="w-full h-[200px] bg-beige-50 rounded-xl overflow-hidden mb-4 relative">
                              {product.images?.[0]?.url ? (
                                <Image
                                  src={product.images[0].url}
                                  alt={product.images[0].alt || product.title}
                                  fill
                                  className="object-contain p-2 hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-beige-400">
                                  <HiOutlineScale size={40} />
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-dark-400 uppercase tracking-wide mb-1">
                              {product.brand}
                            </p>
                            <h3 className="font-semibold text-dark-900 line-clamp-2 hover:text-primary-600 transition-colors leading-tight">
                              {product.title}
                            </h3>
                          </Link>
                        </div>
                      </td>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {/* Price Row */}
                  <tr className="border-b border-beige-100 bg-beige-50/50">
                    <td className="sticky left-0 bg-beige-50 p-4 text-dark-700 font-semibold">
                      Price
                    </td>
                    {products.map((product: any) => {
                      const finalPrice = product.discount
                        ? product.price * (1 - product.discount / 100)
                        : product.price;
                      const isCheapest = analysis?.cheapest === product._id;

                      return (
                        <td key={product._id} className={`p-4 ${isCheapest ? 'bg-green-50' : ''}`}>
                          <div className="space-y-1">
                            <span className={`text-xl font-bold ${isCheapest ? 'text-green-600' : 'text-dark-900'}`}>
                              {formatCurrency(finalPrice)}
                            </span>
                            {product.discount && product.discount > 0 && (
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-dark-400 line-through">
                                  {formatCurrency(product.price)}
                                </span>
                                <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded-full font-medium">
                                  -{product.discount}%
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Rating Row */}
                  <tr className="border-b border-beige-100">
                    <td className="sticky left-0 bg-white p-4 text-dark-700 font-semibold">
                      Rating
                    </td>
                    {products.map((product: any) => {
                      const isBestRated = analysis?.bestRated === product._id;

                      return (
                        <td key={product._id} className={`p-4 ${isBestRated ? 'bg-yellow-50' : ''}`}>
                          {product.averageRating > 0 ? (
                            <div className="flex items-center gap-2">
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <span key={star}>
                                    {star <= Math.round(product.averageRating) ? (
                                      <HiStar className="w-5 h-5 text-yellow-400" />
                                    ) : (
                                      <HiOutlineStar className="w-5 h-5 text-beige-300" />
                                    )}
                                  </span>
                                ))}
                              </div>
                              <span className={`font-semibold ${isBestRated ? 'text-yellow-700' : 'text-dark-700'}`}>
                                {product.averageRating.toFixed(1)}
                              </span>
                              <span className="text-dark-400 text-sm">
                                ({product.reviewCount} reviews)
                              </span>
                            </div>
                          ) : (
                            <span className="text-dark-400">No ratings yet</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Availability Row */}
                  <tr className="border-b border-beige-100">
                    <td className="sticky left-0 bg-white p-4 text-dark-700 font-semibold">
                      Availability
                    </td>
                    {products.map((product: any) => (
                      <td key={product._id} className="p-4">
                        {product.stockQuantity > 0 ? (
                          <span className="inline-flex items-center gap-1.5 text-green-600 font-medium">
                            <HiOutlineCheck className="w-5 h-5" />
                            In Stock
                            {product.stockQuantity <= 5 && (
                              <span className="text-orange-500 text-sm">
                                (Only {product.stockQuantity} left)
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-red-500 font-medium">
                            <HiOutlineX className="w-5 h-5" />
                            Out of Stock
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Warranty Row */}
                  <tr className="border-b border-beige-100">
                    <td className="sticky left-0 bg-white p-4 text-dark-700 font-semibold">
                      <div className="flex items-center gap-2">
                        <HiOutlineShieldCheck className="w-5 h-5 text-dark-400" />
                        Warranty
                      </div>
                    </td>
                    {products.map((product: any) => (
                      <td key={product._id} className="p-4 text-dark-700">
                        {product.warranty || <span className="text-dark-400">Not specified</span>}
                      </td>
                    ))}
                  </tr>

                  {/* SKU Row */}
                  <tr className="border-b border-beige-100">
                    <td className="sticky left-0 bg-white p-4 text-dark-700 font-semibold">
                      SKU
                    </td>
                    {products.map((product: any) => (
                      <td key={product._id} className="p-4">
                        <span className="font-mono text-sm text-dark-500 bg-beige-100 px-2 py-1 rounded">
                          {product.sku}
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* Category Row */}
                  <tr className="border-b border-beige-100">
                    <td className="sticky left-0 bg-white p-4 text-dark-700 font-semibold">
                      Category
                    </td>
                    {products.map((product: any) => (
                      <td key={product._id} className="p-4 text-dark-700">
                        {product.categoryId?.name || <span className="text-dark-400">N/A</span>}
                      </td>
                    ))}
                  </tr>

                  {/* Description Row */}
                  <tr className="border-b border-beige-100">
                    <td className="sticky left-0 bg-white p-4 text-dark-700 font-semibold align-top">
                      Description
                    </td>
                    {products.map((product: any) => (
                      <td key={product._id} className="p-4 text-dark-600 text-sm">
                        <p className="line-clamp-4">
                          {product.shortDescription || product.description || <span className="text-dark-400">N/A</span>}
                        </p>
                      </td>
                    ))}
                  </tr>

                  {/* Delivery Notes Row */}
                  {products.some((p: any) => p.deliveryNotes) && (
                    <tr className="border-b border-beige-100">
                      <td className="sticky left-0 bg-white p-4 text-dark-700 font-semibold">
                        Delivery Notes
                      </td>
                      {products.map((product: any) => (
                        <td key={product._id} className="p-4 text-dark-600 text-sm">
                          {product.deliveryNotes || <span className="text-dark-400">N/A</span>}
                        </td>
                      ))}
                    </tr>
                  )}

                  {/* Installation Notes Row */}
                  {products.some((p: any) => p.installationNotes) && (
                    <tr className="border-b border-beige-100">
                      <td className="sticky left-0 bg-white p-4 text-dark-700 font-semibold">
                        Installation
                      </td>
                      {products.map((product: any) => (
                        <td key={product._id} className="p-4 text-dark-600 text-sm">
                          {product.installationNotes || <span className="text-dark-400">N/A</span>}
                        </td>
                      ))}
                    </tr>
                  )}

                  {/* Tags Row */}
                  {products.some((p: any) => p.tags?.length > 0) && (
                    <tr className="border-b border-beige-100">
                      <td className="sticky left-0 bg-white p-4 text-dark-700 font-semibold">
                        Tags
                      </td>
                      {products.map((product: any) => (
                        <td key={product._id} className="p-4">
                          {product.tags?.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {product.tags.map((tag: string) => (
                                <span key={tag} className="text-xs px-2 py-0.5 bg-beige-100 text-dark-600 rounded-full">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-dark-400">N/A</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  )}

                  {/* Specifications by Group */}
                  {Object.keys(specGroups).map((group) => (
                    <>
                      {/* Group Header */}
                      <tr key={`group-${group}`} className="bg-dark-50">
                        <td
                          colSpan={products.length + 1}
                          className="p-3 text-dark-700 font-bold text-sm uppercase tracking-wide"
                        >
                          {group}
                        </td>
                      </tr>

                      {/* Specs in this group */}
                      {specGroups[group].map((specName: string) => {
                        const isSame = areSpecsSame(specName);

                        return (
                          <tr key={specName} className={`border-b border-beige-100 ${!isSame ? 'bg-primary-50/30' : ''}`}>
                            <td className={`sticky left-0 p-4 text-dark-600 font-medium ${!isSame ? 'bg-primary-50/30' : 'bg-white'}`}>
                              {specName}
                              {!isSame && (
                                <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-primary-100 text-primary-700 rounded">
                                  Differs
                                </span>
                              )}
                            </td>
                            {products.map((product: any) => {
                              const value = getSpecValue(product, specName);
                              return (
                                <td key={product._id} className="p-4 text-dark-700">
                                  {value || (
                                    <span className="text-dark-300 flex items-center gap-1">
                                      <HiOutlineMinus />
                                      N/A
                                    </span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </>
                  ))}

                  {/* No specs message */}
                  {Object.keys(specGroups).length === 0 && (
                    <tr>
                      <td colSpan={products.length + 1} className="p-8 text-center text-dark-400">
                        No detailed specifications available for these products.
                      </td>
                    </tr>
                  )}

                  {/* Add to Cart Row */}
                  <tr className="bg-beige-50">
                    <td className="sticky left-0 bg-beige-50 p-4"></td>
                    {products.map((product: any) => (
                      <td key={product._id} className="p-4">
                        <Button
                          fullWidth
                          size="lg"
                          onClick={() => handleAddToCart(product)}
                          disabled={product.stockQuantity === 0}
                          leftIcon={<HiOutlineShoppingCart size={18} />}
                          className="shadow-md"
                        >
                          {product.stockQuantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                        </Button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 bg-dark-900 text-white rounded-2xl p-6 md:p-8"
          >
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <HiOutlineChartBar className="w-6 h-6" />
              Comparison Summary
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product: any) => {
                const finalPrice = product.discount
                  ? product.price * (1 - product.discount / 100)
                  : product.price;
                const isCheapest = analysis?.cheapest === product._id;
                const isBestRated = analysis?.bestRated === product._id;

                return (
                  <div key={product._id} className="bg-dark-800 rounded-xl p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-16 h-16 bg-dark-700 rounded-lg overflow-hidden flex-shrink-0 relative">
                        {product.images?.[0]?.url ? (
                          <Image
                            src={product.images[0].url}
                            alt={product.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-dark-500">
                            <HiOutlineScale size={24} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-dark-400 mb-1">{product.brand}</p>
                        <h3 className="font-medium text-white line-clamp-2 text-sm">{product.title}</h3>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-dark-400">Price</span>
                        <span className={`font-semibold ${isCheapest ? 'text-green-400' : 'text-white'}`}>
                          {formatCurrency(finalPrice)}
                          {isCheapest && ' (Lowest)'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-dark-400">Rating</span>
                        <span className={`font-semibold ${isBestRated ? 'text-yellow-400' : 'text-white'}`}>
                          {product.averageRating > 0
                            ? `${product.averageRating.toFixed(1)} / 5${isBestRated ? ' (Best)' : ''}`
                            : 'No ratings'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-dark-400">Stock</span>
                        <span className={product.stockQuantity > 0 ? 'text-green-400' : 'text-red-400'}>
                          {product.stockQuantity > 0 ? 'Available' : 'Out of Stock'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

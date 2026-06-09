'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  HiOutlineHeart,
  HiOutlineShoppingCart,
  HiOutlineTrash,
} from 'react-icons/hi';
import { Button, Card } from '@/components/ui';
import { userApi, cartApi } from '@/lib/api';
import { useCartStore } from '@/lib/store';
import toast from 'react-hot-toast';

export default function WishlistPage() {
  const queryClient = useQueryClient();
  const { addItem } = useCartStore();

  const { data: wishlist, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => userApi.getWishlist(),
  });

  const removeMutation = useMutation({
    mutationFn: (productId: string) => userApi.removeFromWishlist(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      toast.success('Removed from wishlist');
    },
    onError: () => {
      toast.error('Failed to remove from wishlist');
    },
  });

  const handleAddToCart = async (product: any) => {
    try {
      await cartApi.addItem(product._id, 1);

      // Calculate discount percentage if salePrice exists
      const discount = product.salePrice && product.price > product.salePrice
        ? Math.round(((product.price - product.salePrice) / product.price) * 100)
        : product.discount || 0;

      addItem({
        productId: product._id,
        product: {
          id: product._id,
          title: product.title,
          slug: product.slug,
          price: product.price || 0,
          discount: discount,
          images: product.images || [],
          stock: product.stockQuantity ?? product.stock ?? 0,
        },
        quantity: 1,
      });
      toast.success('Added to cart');
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-dark-900">My Wishlist</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
              <div className="flex gap-4">
                <div className="w-24 h-24 bg-beige-200 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-beige-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-beige-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const items = wishlist || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-dark-900">
          My Wishlist ({items.length})
        </h1>
      </div>

      {items.length === 0 ? (
        <Card padding="lg" className="text-center py-12">
          <HiOutlineHeart className="mx-auto h-16 w-16 text-beige-400 mb-4" />
          <h3 className="text-lg font-medium text-dark-900 mb-2">
            Your wishlist is empty
          </h3>
          <p className="text-dark-500 mb-6">
            Save items you love for later
          </p>
          <Link href="/products">
            <Button>Browse Products</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((product: any, index: number) => (
            <motion.div
              key={product._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card padding="md" className="hover:shadow-soft-lg transition-shadow">
                <div className="flex gap-4">
                  {/* Product Image */}
                  <Link
                    href={`/products/${product.slug}`}
                    className="flex-shrink-0 w-24 h-24 bg-beige-100 rounded-lg overflow-hidden"
                  >
                    {product.images?.[0]?.url ? (
                      <img
                        src={product.images[0].url}
                        alt={product.images[0].alt || product.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-beige-400">
                        No Image
                      </div>
                    )}
                  </Link>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${product.slug}`}
                      className="font-medium text-dark-900 hover:text-primary-600 line-clamp-2"
                    >
                      {product.title}
                    </Link>
                    <div className="mt-1 flex items-center gap-2">
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
                    <p className="text-sm text-dark-500 mt-1">
                      {(product.stockQuantity ?? product.stock ?? 0) > 0 ? (
                        <span className="text-success-600">In Stock ({product.stockQuantity ?? product.stock ?? 0} available)</span>
                      ) : (
                        <span className="text-error-600">Out of Stock</span>
                      )}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-3">
                      <Button
                        size="sm"
                        onClick={() => handleAddToCart(product)}
                        disabled={(product.stockQuantity ?? product.stock ?? 0) === 0}
                        leftIcon={<HiOutlineShoppingCart size={16} />}
                      >
                        Add to Cart
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeMutation.mutate(product._id)}
                        className="text-error-600 hover:bg-error-50"
                      >
                        <HiOutlineTrash size={16} />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

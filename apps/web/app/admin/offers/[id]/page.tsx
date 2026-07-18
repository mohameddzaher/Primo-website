'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { HiOutlineArrowLeft, HiOutlineSearch, HiOutlineX } from 'react-icons/hi';
import { Button, Input, Textarea, Card, Checkbox } from '@/components/ui';
import { adminApi, categoriesApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-error';
import toast from 'react-hot-toast';

const optionalNumber = z.preprocess(
  (val) => (val === null || val === undefined || val === '' || (typeof val === 'number' && isNaN(val))) ? undefined : val,
  z.number().optional()
);

const offerSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  code: z.string().optional(),
  type: z.enum(['percentage', 'fixed', 'buy_x_get_y', 'bundle']),
  value: z.number().min(1, 'Discount value must be at least 1'),
  minOrderAmount: optionalNumber,
  maxDiscount: optionalNumber,
  usageLimit: optionalNumber,
  startsAt: z.string(),
  endsAt: z.string(),
  isActive: z.boolean(),
});

type OfferForm = z.infer<typeof offerSchema>;

export default function EditOfferPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const offerId = params.id as string;

  // Product selector state
  const [productSearch, setProductSearch] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<Array<{ _id: string; name: string; images?: string[] }>>([]);
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  // Category selector state
  const [selectedCategories, setSelectedCategories] = useState<Array<{ _id: string; name: string }>>([]);

  const { data: offer, isLoading: offerLoading } = useQuery({
    queryKey: ['offer', offerId],
    queryFn: () => adminApi.getOffer(offerId),
    enabled: !!offerId,
  });

  // Product search query
  const { data: productResults } = useQuery({
    queryKey: ['product-search', productSearch],
    queryFn: () => adminApi.getProducts({ search: productSearch, limit: 10 }),
    enabled: productSearch.length >= 2,
  });

  // Categories query
  const { data: allCategories } = useQuery({
    queryKey: ['all-categories'],
    queryFn: () => categoriesApi.getAll(),
  });

  const searchProducts = productResults?.products || [];

  // Pre-fill selected products from offer data
  useEffect(() => {
    if (offer?.productIds && offer.productIds.length > 0) {
      // Fetch product details for pre-selected IDs
      const fetchProducts = async () => {
        try {
          const results = await Promise.all(
            offer.productIds.map((id: string) => adminApi.getProduct(id).catch(() => null))
          );
          const products = results.filter(Boolean).map((p: any) => ({
            _id: p._id,
            name: p.name,
            images: p.images,
          }));
          setSelectedProducts(products);
        } catch {
          // silently fail
        }
      };
      fetchProducts();
    }
  }, [offer?.productIds]);

  // Pre-fill selected categories from offer data
  useEffect(() => {
    if (offer?.categoryIds && offer.categoryIds.length > 0 && allCategories) {
      const selected = (allCategories as any[]).filter((c: any) =>
        offer.categoryIds.includes(c._id)
      ).map((c: any) => ({ _id: c._id, name: c.name }));
      setSelectedCategories(selected);
    }
  }, [offer?.categoryIds, allCategories]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => adminApi.updateOffer(offerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offer', offerId] });
      toast.success('Offer updated');
      router.push('/admin/offers');
    },
    onError: (error: any) => {
      toast.error(getApiErrorMessage(error, 'Failed to update offer'));
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<OfferForm>({
    resolver: zodResolver(offerSchema),
  });

  const discountType = watch('type');

  useEffect(() => {
    if (offer) {
      reset({
        title: offer.title,
        description: offer.description || '',
        code: offer.code || '',
        type: offer.type || 'percentage',
        value: offer.value,
        minOrderAmount: offer.minOrderAmount,
        maxDiscount: offer.maxDiscount,
        usageLimit: offer.usageLimit,
        startsAt: new Date(offer.startsAt).toISOString().split('T')[0],
        endsAt: new Date(offer.endsAt).toISOString().split('T')[0],
        isActive: offer.isActive,
      });
    }
  }, [offer, reset]);

  const addProduct = (product: any) => {
    if (!selectedProducts.find(p => p._id === product._id)) {
      setSelectedProducts(prev => [...prev, { _id: product._id, name: product.name, images: product.images }]);
    }
    setProductSearch('');
    setShowProductDropdown(false);
  };

  const removeProduct = (productId: string) => {
    setSelectedProducts(prev => prev.filter(p => p._id !== productId));
  };

  const toggleCategory = (category: any) => {
    setSelectedCategories(prev => {
      const exists = prev.find(c => c._id === category._id);
      if (exists) return prev.filter(c => c._id !== category._id);
      return [...prev, { _id: category._id, name: category.name }];
    });
  };

  const onSubmit = (data: OfferForm) => {
    const payload: Record<string, any> = {
      title: data.title,
      type: data.type,
      value: data.value,
      startsAt: new Date(data.startsAt).toISOString(),
      endsAt: new Date(data.endsAt + 'T23:59:59').toISOString(),
      isActive: data.isActive,
    };
    if (data.code && data.code.trim()) {
      payload.code = data.code.toUpperCase();
    } else {
      payload.code = '';
    }
    if (data.description) payload.description = data.description;
    if (data.minOrderAmount && data.minOrderAmount > 0) payload.minOrderAmount = data.minOrderAmount;
    if (data.maxDiscount && data.maxDiscount > 0) payload.maxDiscount = data.maxDiscount;
    if (data.usageLimit && data.usageLimit > 0) payload.usageLimit = data.usageLimit;
    payload.productIds = selectedProducts.map(p => p._id);
    payload.categoryIds = selectedCategories.map(c => c._id);
    updateMutation.mutate(payload);
  };

  if (offerLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-64 bg-beige-200 rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/offers">
          <Button variant="ghost" size="sm">
            <HiOutlineArrowLeft size={20} />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-dark-900">Edit Offer</h1>
          <p className="text-dark-500 mt-1">{offer?.title}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl space-y-6">
        <Card padding="lg" className="space-y-6">
          <h3 className="font-semibold text-dark-900">Basic Information</h3>

          <Input
            label="Offer Title"
            error={errors.title?.message}
            {...register('title')}
          />

          <Textarea
            label="Description"
            rows={3}
            {...register('description')}
          />

          <Input
            label="Promo Code (Optional)"
            placeholder="Leave empty for flash deals"
            error={errors.code?.message}
            {...register('code')}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">
                Discount Type
              </label>
              <select
                className="w-full px-4 py-2 border border-beige-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                {...register('type')}
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (SAR)</option>
                <option value="buy_x_get_y">Buy X Get Y</option>
                <option value="bundle">Bundle Deal</option>
              </select>
            </div>

            <Input
              label={`Discount Value ${discountType === 'percentage' ? '(%)' : discountType === 'fixed' ? '(SAR)' : ''}`}
              type="number"
              error={errors.value?.message}
              {...register('value', { valueAsNumber: true })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Minimum Order Amount (SAR)"
              type="number"
              {...register('minOrderAmount', { valueAsNumber: true })}
            />

            <Input
              label="Max Discount (SAR)"
              type="number"
              placeholder="Optional — cap for percentage discounts"
              {...register('maxDiscount', { valueAsNumber: true })}
            />
          </div>

          <Input
            label="Maximum Uses"
            type="number"
            placeholder="Leave empty for unlimited"
            {...register('usageLimit', { valueAsNumber: true })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              error={errors.startsAt?.message}
              {...register('startsAt')}
            />

            <Input
              label="End Date"
              type="date"
              error={errors.endsAt?.message}
              {...register('endsAt')}
            />
          </div>

          <div className="p-4 bg-beige-50 rounded-lg">
            <p className="text-sm text-dark-600">
              <strong>Usage Stats:</strong> {offer?.usedCount || 0} times used
            </p>
          </div>

          <Checkbox
            label="Active"
            description="Offer is available for use"
            {...register('isActive')}
          />
        </Card>

        {/* Product Selector */}
        <Card padding="lg" className="space-y-4">
          <div>
            <h3 className="font-semibold text-dark-900">Products (Flash Deal)</h3>
            <p className="text-sm text-dark-500 mt-1">Select specific products for this offer. Required for flash deals on the homepage.</p>
          </div>

          <div className="relative">
            <div className="flex items-center gap-2 border border-beige-300 rounded-lg px-3 py-2">
              <HiOutlineSearch size={18} className="text-dark-400" />
              <input
                type="text"
                placeholder="Search products by name..."
                value={productSearch}
                onChange={(e) => {
                  setProductSearch(e.target.value);
                  setShowProductDropdown(true);
                }}
                onFocus={() => productSearch.length >= 2 && setShowProductDropdown(true)}
                className="flex-1 outline-none bg-transparent text-sm"
              />
            </div>

            {showProductDropdown && searchProducts.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-beige-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {searchProducts
                  .filter((p: any) => !selectedProducts.find(sp => sp._id === p._id))
                  .map((product: any) => (
                    <button
                      key={product._id}
                      type="button"
                      onClick={() => addProduct(product)}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-beige-50 text-left"
                    >
                      {product.images?.[0] && (
                        <img src={product.images[0]} alt="" className="w-8 h-8 rounded object-cover" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-dark-800">{product.name}</p>
                        <p className="text-xs text-dark-500">SAR {product.price?.toLocaleString()}</p>
                      </div>
                    </button>
                  ))}
              </div>
            )}
          </div>

          {selectedProducts.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedProducts.map(product => (
                <span
                  key={product._id}
                  className="inline-flex items-center gap-1.5 bg-primary-50 text-primary-700 px-3 py-1.5 rounded-full text-sm"
                >
                  {product.images?.[0] && (
                    <img src={product.images[0]} alt="" className="w-5 h-5 rounded-full object-cover" />
                  )}
                  {product.name}
                  <button type="button" onClick={() => removeProduct(product._id)} className="hover:text-primary-900" title="Remove product">
                    <HiOutlineX size={14} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {selectedProducts.length === 0 && (
            <p className="text-sm text-dark-400 italic">No products selected. Add products to create a flash deal.</p>
          )}
        </Card>

        {/* Category Selector */}
        <Card padding="lg" className="space-y-4">
          <div>
            <h3 className="font-semibold text-dark-900">Categories (Optional)</h3>
            <p className="text-sm text-dark-500 mt-1">Apply this offer to entire categories.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {(allCategories || []).map((category: any) => {
              const isSelected = selectedCategories.find(c => c._id === category._id);
              return (
                <button
                  key={category._id}
                  type="button"
                  onClick={() => toggleCategory(category)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    isSelected
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-dark-600 border-beige-300 hover:border-primary-400'
                  }`}
                >
                  {category.name}
                </button>
              );
            })}
          </div>

          {selectedCategories.length > 0 && (
            <p className="text-sm text-dark-500">{selectedCategories.length} categories selected</p>
          )}
        </Card>

        <div className="flex gap-3">
          <Button type="submit" isLoading={updateMutation.isPending}>
            Update Offer
          </Button>
          <Link href="/admin/offers">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}

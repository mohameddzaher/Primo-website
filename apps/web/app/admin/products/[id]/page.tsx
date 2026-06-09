'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { HiOutlineArrowLeft, HiOutlinePlus, HiOutlineX, HiOutlineTrash, HiOutlineChevronUp, HiOutlineChevronDown } from 'react-icons/hi';
import { Button, Input, Textarea, Select, Card, Checkbox } from '@/components/ui';
import { adminApi, categoriesApi, brandsApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-error';
import toast from 'react-hot-toast';

const optionalNumber = z.preprocess(
  (val) => (val === null || val === undefined || val === '' || (typeof val === 'number' && isNaN(val))) ? undefined : val,
  z.number().positive().optional()
);

const discountNumber = z.preprocess(
  (val) => (val === null || val === undefined || val === '' || (typeof val === 'number' && isNaN(val))) ? undefined : val,
  z.number().min(0).max(100).optional()
);

const productSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.number().min(1, 'Price must be greater than 0'),
  compareAtPrice: optionalNumber,
  discount: discountNumber,
  discountEndsAt: z.string().optional(),
  sku: z.string().min(1, 'SKU is required'),
  stockQuantity: z.number().min(0, 'Stock cannot be negative'),
  categoryId: z.string().min(1, 'Category is required'),
  brand: z.string().min(1, 'Brand is required'),
  warranty: z.string().optional(),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
});

type ProductForm = z.infer<typeof productSchema>;

type ProductImage = { id: string; url: string; alt: string; isPrimary: boolean; order: number };
type ProductFAQ = { id: string; question: string; answer: string; order: number };
type ProductSpec = { id: string; group: string; name: string; value: string };

const SPEC_GROUPS = [
  'General',
  'Technical Details',
  'Dimensions & Weight',
  'Display',
  'Connectivity',
  'Package Contents',
  'Safety & Compliance',
];

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const productId = params.id as string;
  const [images, setImages] = useState<ProductImage[]>([]);
  const [newImage, setNewImage] = useState('');
  const [faqs, setFaqs] = useState<ProductFAQ[]>([]);
  const [specs, setSpecs] = useState<ProductSpec[]>([]);

  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ['admin-product', productId],
    queryFn: () => adminApi.getProduct(productId),
    enabled: !!productId,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll(),
  });

  const { data: brands } = useQuery({
    queryKey: ['brands'],
    queryFn: () => brandsApi.getAll(true),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => adminApi.updateProduct(productId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      queryClient.invalidateQueries({ queryKey: ['admin-product', productId] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-inventory-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-inventory-dashboard'] });
      toast.success('Product updated successfully');
      router.push('/admin/products');
    },
    onError: (error: any) => {
      const data = error.response?.data;
      if (data?.errors && typeof data.errors === 'object') {
        const details = Object.entries(data.errors)
          .map(([field, msgs]) => `${field}: ${(msgs as string[]).join(', ')}`)
          .join('\n');
        toast.error(`Validation failed:\n${details}`, { duration: 8000 });
        console.error('Product update validation errors:', data.errors);
      } else {
        toast.error(getApiErrorMessage(error, 'Failed to update product'));
      }
      console.error('Product update error payload:', error.response?.data);
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
  });

  const watchPrice = watch('price');
  const watchDiscount = watch('discount');

  useEffect(() => {
    if (product) {
      reset({
        title: product.title,
        description: product.description,
        price: product.price,
        compareAtPrice: product.compareAtPrice || product.salePrice || null,
        discount: product.discount || undefined,
        discountEndsAt: product.discountEndsAt ? new Date(product.discountEndsAt).toISOString().split('T')[0] : '',
        sku: product.sku,
        stockQuantity: product.stockQuantity ?? product.stock ?? 0,
        categoryId: product.categoryId?._id || (typeof product.categoryId === 'string' ? product.categoryId : '') || product.category?._id || product.category || '',
        brand: product.brand || '',
        warranty: product.warranty || '',
        isActive: product.isActive,
        isFeatured: product.isFeatured,
      });
      // Map images with proper defaults (include id from _id or id, generate if missing)
      const mappedImages = (product.images || []).map((img: any, idx: number) => ({
        id: img.id || img._id || `img_${Date.now()}_${idx}`,
        url: img.url,
        alt: img.alt || `Product image ${idx + 1}`,
        isPrimary: img.isPrimary ?? idx === 0,
        order: img.order ?? idx,
      }));
      setImages(mappedImages);
      // Map FAQs
      const mappedFaqs = (product.faqs || []).map((faq: any, idx: number) => ({
        id: faq.id || `faq_${Date.now()}_${idx}`,
        question: faq.question || '',
        answer: faq.answer || '',
        order: faq.order ?? idx,
      }));
      setFaqs(mappedFaqs);
      // Map Specs
      const mappedSpecs = (product.specs || []).map((spec: any, idx: number) => ({
        id: spec.id || `spec_${Date.now()}_${idx}`,
        group: spec.group || 'General',
        name: spec.name || '',
        value: spec.value || '',
      }));
      setSpecs(mappedSpecs);
    }
  }, [product, reset]);

  const categoryOptions = [
    { value: '', label: 'Select Category' },
    ...(categories?.map((cat: any) => ({
      value: cat._id,
      label: cat.name,
    })) || []),
  ];

  const brandOptions = [
    { value: '', label: 'Select Brand' },
    ...(brands?.map((brand: any) => ({
      value: brand.name,
      label: brand.name,
    })) || []),
  ];

  const addImage = () => {
    if (newImage.trim() && !images.some(img => img.url === newImage.trim())) {
      const newImg: ProductImage = {
        id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        url: newImage.trim(),
        alt: `Product image ${images.length + 1}`,
        isPrimary: images.length === 0,
        order: images.length,
      };
      setImages([...images, newImg]);
      setNewImage('');
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const onSubmit = (data: ProductForm) => {
    if (images.length === 0) {
      toast.error('Please add at least one image');
      return;
    }
    // Clean up NaN/null values before sending
    const cleanFaqs = faqs
      .filter(f => f.question.trim().length >= 5 && f.answer.trim().length >= 5)
      .map((f, idx) => ({ id: f.id || `faq_${Date.now()}_${idx}`, question: f.question, answer: f.answer, order: idx }));

    // Build clean images (only schema-expected fields)
    const cleanImages = images.map(img => ({
      id: img.id || `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      url: img.url,
      alt: img.alt || '',
      isPrimary: img.isPrimary ?? false,
      order: img.order ?? 0,
    }));

    const cleanSpecs = specs
      .filter(s => s.name.trim() && s.value.trim())
      .map(s => ({ name: s.name.trim(), value: s.value.trim(), group: s.group || 'General' }));

    const cleanData: any = {
      title: data.title,
      description: data.description,
      sku: data.sku,
      brand: data.brand,
      categoryId: data.categoryId,
      isActive: data.isActive,
      isFeatured: data.isFeatured,
      images: cleanImages,
      faqs: cleanFaqs,
      specs: cleanSpecs,
    };

    // Only include numeric fields if they're valid numbers
    if (typeof data.price === 'number' && !isNaN(data.price) && data.price > 0) {
      cleanData.price = data.price;
    }
    if (typeof data.stockQuantity === 'number' && !isNaN(data.stockQuantity)) {
      cleanData.stockQuantity = data.stockQuantity;
    }
    if (typeof data.compareAtPrice === 'number' && !isNaN(data.compareAtPrice) && data.compareAtPrice > 0) {
      cleanData.compareAtPrice = data.compareAtPrice;
    }
    if (data.warranty) {
      cleanData.warranty = data.warranty;
    }

    // Handle discount
    if (typeof data.discount === 'number' && !isNaN(data.discount) && data.discount > 0) {
      cleanData.discount = data.discount;
      if (data.discountEndsAt) {
        try {
          cleanData.discountEndsAt = new Date(data.discountEndsAt + 'T23:59:59').toISOString();
        } catch {
          // skip invalid date
        }
      }
    }

    updateMutation.mutate(cleanData);
  };

  if (productLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-beige-200 rounded w-1/4 animate-pulse"></div>
        <Card padding="lg" className="animate-pulse">
          <div className="h-64 bg-beige-200 rounded"></div>
        </Card>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-dark-900 mb-4">Product Not Found</h2>
        <Link href="/admin/products">
          <Button>Back to Products</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/products">
          <Button variant="ghost" size="sm">
            <HiOutlineArrowLeft size={20} />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-dark-900">Edit Product</h1>
          <p className="text-dark-500 mt-1">{product.title}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card padding="lg">
              <h2 className="text-lg font-semibold text-dark-900 mb-4">Basic Information</h2>
              <div className="space-y-4">
                <Input
                  label="Product Title"
                  error={errors.title?.message}
                  {...register('title')}
                />
                <Textarea
                  label="Description"
                  rows={5}
                  error={errors.description?.message}
                  {...register('description')}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="SKU" error={errors.sku?.message} {...register('sku')} />
                  <Select label="Brand" options={brandOptions} error={errors.brand?.message} {...register('brand')} />
                </div>
                <Input
                  label="Warranty"
                  placeholder="e.g., 1 Year Manufacturer Warranty"
                  error={errors.warranty?.message}
                  {...register('warranty')}
                />
              </div>
            </Card>

            <Card padding="lg">
              <h2 className="text-lg font-semibold text-dark-900 mb-4">Images</h2>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter image URL"
                    value={newImage}
                    onChange={(e) => setNewImage(e.target.value)}
                    fullWidth
                  />
                  <Button type="button" onClick={addImage}>
                    <HiOutlinePlus size={18} />
                  </Button>
                </div>
                {images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {images.map((img, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square bg-beige-100 rounded-lg overflow-hidden">
                          <img src={img.url} alt={img.alt || `Product ${index + 1}`} className="w-full h-full object-cover" />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 p-1 bg-error-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <HiOutlineX size={14} />
                        </button>
                        {index === 0 && (
                          <span className="absolute bottom-1 left-1 px-2 py-0.5 bg-primary-600 text-white text-xs rounded">
                            Main
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            <Card padding="lg">
              <h2 className="text-lg font-semibold text-dark-900 mb-4">Pricing & Inventory</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="Price (EGP)"
                    type="number"
                    error={errors.price?.message}
                    {...register('price', { valueAsNumber: true })}
                  />
                  <Input
                    label="Compare at Price (EGP)"
                    type="number"
                    {...register('compareAtPrice', { valueAsNumber: true })}
                  />
                  <Input
                    label="Stock Quantity"
                    type="number"
                    error={errors.stockQuantity?.message}
                    {...register('stockQuantity', { valueAsNumber: true })}
                  />
                </div>

                <div className="border-t border-beige-200 pt-4">
                  <h3 className="text-sm font-semibold text-dark-900 mb-3">Discount</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Discount (%)"
                      type="number"
                      placeholder="0"
                      hint="Enter 0 or leave empty for no discount"
                      error={errors.discount?.message}
                      {...register('discount', { valueAsNumber: true })}
                    />
                    <Input
                      label="Discount Ends At"
                      type="date"
                      hint="Leave empty for no expiration"
                      {...register('discountEndsAt')}
                    />
                  </div>

                  {watchPrice > 0 && (watchDiscount ?? 0) > 0 && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-green-800">
                            <span className="line-through text-dark-400 mr-2">
                              EGP {watchPrice?.toLocaleString()}
                            </span>
                            <span className="font-bold text-lg">
                              EGP {(watchPrice * (1 - (watchDiscount || 0) / 100)).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </span>
                          </p>
                          <p className="text-xs text-green-600 mt-0.5">
                            Customer saves EGP {(watchPrice * (watchDiscount || 0) / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </p>
                        </div>
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-sm font-semibold rounded">
                          -{watchDiscount}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Specifications */}
            <Card padding="lg">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-dark-900">Specifications</h2>
                  <p className="text-xs text-dark-400 mt-0.5">Optional technical details. Only filled specs will appear on the product page.</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSpecs([
                      ...specs,
                      {
                        id: `spec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        group: 'General',
                        name: '',
                        value: '',
                      },
                    ]);
                  }}
                  leftIcon={<HiOutlinePlus size={16} />}
                >
                  Add Spec
                </Button>
              </div>

              {specs.length === 0 ? (
                <p className="text-sm text-dark-400 text-center py-6">No specifications added yet. Click &quot;Add Spec&quot; to get started.</p>
              ) : (
                <div className="space-y-3">
                  {specs.map((spec, index) => (
                    <div key={spec.id} className="flex items-start gap-2 p-3 bg-beige-50 rounded-lg border border-beige-200">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                        <select
                          aria-label="Spec group"
                          value={spec.group}
                          onChange={(e) => {
                            const newSpecs = [...specs];
                            newSpecs[index] = { ...newSpecs[index], group: e.target.value };
                            setSpecs(newSpecs);
                          }}
                          className="px-3 py-2 border border-beige-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                        >
                          {SPEC_GROUPS.map(g => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          placeholder="Spec name (e.g., Screen Size)"
                          value={spec.name}
                          onChange={(e) => {
                            const newSpecs = [...specs];
                            newSpecs[index] = { ...newSpecs[index], name: e.target.value };
                            setSpecs(newSpecs);
                          }}
                          className="px-3 py-2 border border-beige-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                        <input
                          type="text"
                          placeholder="Value (e.g., 6.7 inches)"
                          value={spec.value}
                          onChange={(e) => {
                            const newSpecs = [...specs];
                            newSpecs[index] = { ...newSpecs[index], value: e.target.value };
                            setSpecs(newSpecs);
                          }}
                          className="px-3 py-2 border border-beige-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setSpecs(specs.filter((_, i) => i !== index))}
                        className="p-2 text-error-500 hover:text-error-600 rounded mt-0.5"
                        title="Remove spec"
                      >
                        <HiOutlineTrash size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* FAQs */}
            <Card padding="lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-dark-900">FAQs</h2>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFaqs([
                      ...faqs,
                      {
                        id: `faq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        question: '',
                        answer: '',
                        order: faqs.length,
                      },
                    ]);
                  }}
                  leftIcon={<HiOutlinePlus size={16} />}
                >
                  Add FAQ
                </Button>
              </div>

              {faqs.length === 0 ? (
                <p className="text-sm text-dark-400 text-center py-6">No FAQs added yet. Click "Add FAQ" to get started.</p>
              ) : (
                <div className="space-y-4">
                  {faqs.map((faq, index) => (
                    <div key={faq.id} className="p-4 bg-beige-50 rounded-lg border border-beige-200">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <span className="text-xs font-semibold text-dark-400 mt-1">FAQ #{index + 1}</span>
                        <div className="flex items-center gap-1">
                          {index > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                const newFaqs = [...faqs];
                                [newFaqs[index - 1], newFaqs[index]] = [newFaqs[index], newFaqs[index - 1]];
                                setFaqs(newFaqs);
                              }}
                              className="p-1 text-dark-400 hover:text-dark-600 rounded"
                              title="Move up"
                            >
                              <HiOutlineChevronUp size={16} />
                            </button>
                          )}
                          {index < faqs.length - 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const newFaqs = [...faqs];
                                [newFaqs[index], newFaqs[index + 1]] = [newFaqs[index + 1], newFaqs[index]];
                                setFaqs(newFaqs);
                              }}
                              className="p-1 text-dark-400 hover:text-dark-600 rounded"
                              title="Move down"
                            >
                              <HiOutlineChevronDown size={16} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setFaqs(faqs.filter((_, i) => i !== index))}
                            className="p-1 text-error-500 hover:text-error-600 rounded"
                            title="Delete FAQ"
                          >
                            <HiOutlineTrash size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder="Question"
                          value={faq.question}
                          onChange={(e) => {
                            const newFaqs = [...faqs];
                            newFaqs[index] = { ...newFaqs[index], question: e.target.value };
                            setFaqs(newFaqs);
                          }}
                          className="w-full px-3 py-2 border border-beige-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                        <textarea
                          placeholder="Answer"
                          rows={3}
                          value={faq.answer}
                          onChange={(e) => {
                            const newFaqs = [...faqs];
                            newFaqs[index] = { ...newFaqs[index], answer: e.target.value };
                            setFaqs(newFaqs);
                          }}
                          className="w-full px-3 py-2 border border-beige-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card padding="lg">
              <h2 className="text-lg font-semibold text-dark-900 mb-4">Status</h2>
              <div className="space-y-3">
                <Checkbox label="Active" description="Product is visible" {...register('isActive')} />
                <Checkbox label="Featured" description="Show in featured" {...register('isFeatured')} />
              </div>
            </Card>

            <Card padding="lg">
              <h2 className="text-lg font-semibold text-dark-900 mb-4">Organization</h2>
              <Select label="Category" options={categoryOptions} error={errors.categoryId?.message} {...register('categoryId')} />
            </Card>

            <Card padding="lg">
              <div className="space-y-3">
                <Button type="submit" fullWidth isLoading={updateMutation.isPending}>
                  Update Product
                </Button>
                <Link href="/admin/products">
                  <Button type="button" variant="outline" fullWidth>
                    Cancel
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}

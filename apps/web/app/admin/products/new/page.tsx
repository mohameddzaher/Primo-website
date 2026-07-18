'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  shortDescription: z.string().max(500, 'Short description must be at most 500 characters').optional(),
  price: z.number().min(1, 'Price must be greater than 0'),
  compareAtPrice: optionalNumber,
  discount: discountNumber,
  discountEndsAt: z.string().optional(),
  sku: z.string().min(1, 'SKU is required'),
  stockQuantity: z.number().min(0, 'Stock cannot be negative'),
  lowStockThreshold: z.preprocess(
    (val) => (val === null || val === undefined || val === '' || (typeof val === 'number' && isNaN(val))) ? undefined : val,
    z.number().int().min(0).optional()
  ),
  categoryId: z.string().min(1, 'Category is required'),
  subcategoryId: z.string().optional(),
  brand: z.string().min(1, 'Brand is required'),
  warranty: z.string().optional(),
  deliveryNotes: z.string().max(1000).optional(),
  installationNotes: z.string().max(1000).optional(),
  metaTitle: z.string().max(60, 'Meta title must be at most 60 characters').optional(),
  metaDescription: z.string().max(160, 'Meta description must be at most 160 characters').optional(),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
});

type ProductForm = z.infer<typeof productSchema>;

type ProductImage = { id: string; url: string; alt: string; isPrimary: boolean; order: number };
type ProductFAQ = { id: string; question: string; answer: string; order: number };
type ProductSpec = { id: string; group: string; name: string; value: string };
type ProductVariant = {
  id: string;
  name: string;
  value: string;
  sku: string;
  priceModifier: number;
  stockQuantity: number;
  image: string;
  isDefault: boolean;
};

/** Common option names. Free text is allowed too — this is only a shortcut. */
const VARIANT_NAMES = [
  'Colour',
  'Capacity',
  'Size',
  'Screen Size',
  'Power',
  'Configuration',
];

const SPEC_GROUPS = [
  'General',
  'Technical Details',
  'Dimensions & Weight',
  'Display',
  'Connectivity',
  'Package Contents',
  'Safety & Compliance',
];

export default function NewProductPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [newImage, setNewImage] = useState('');
  const [faqs, setFaqs] = useState<ProductFAQ[]>([]);
  const [specs, setSpecs] = useState<ProductSpec[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll(),
  });

  const { data: brands } = useQuery({
    queryKey: ['brands'],
    queryFn: () => brandsApi.getAll(true),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      isActive: true,
      isFeatured: false,
      stockQuantity: 0,
      warranty: '',
      discount: undefined,
      discountEndsAt: '',
    },
  });

  const watchPrice = watch('price');
  const watchDiscount = watch('discount');
  const watchCategoryId = watch('categoryId');

  // Only parent categories are selectable as the main category
  const categoryOptions = [
    { value: '', label: 'Select Category' },
    ...(categories?.filter((cat: any) => !cat.parentId).map((cat: any) => ({
      value: cat._id,
      label: cat.name,
    })) || []),
  ];

  // Subcategories belong to the selected parent category
  const subcategoryOptions = [
    { value: '', label: 'None' },
    ...(categories
      ?.filter((cat: any) => cat.parentId && (cat.parentId?._id || cat.parentId) === watchCategoryId)
      .map((cat: any) => ({ value: cat._id, label: cat.name })) || []),
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

  const addTag = () => {
    const t = newTag.trim().toLowerCase();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const onSubmit = async (data: ProductForm) => {
    if (images.length === 0) {
      toast.error('Please add at least one image');
      return;
    }

    setIsLoading(true);
    try {
      // Clean up NaN/null values before sending
      const cleanFaqs = faqs
        .filter(f => f.question.trim() && f.answer.trim())
        .map((f, idx) => ({ ...f, order: idx }));
      const cleanSpecs = specs
        .filter(s => s.name.trim() && s.value.trim())
        .map(s => ({ name: s.name.trim(), value: s.value.trim(), group: s.group || 'General' }));
      // Only fully-filled variant rows are sent. When variants exist the API
      // recomputes the product's stock as the sum of theirs.
      const cleanVariants = variants
        .filter(v => v.name.trim() && v.value.trim() && v.sku.trim())
        .map(v => ({
          id: v.id,
          name: v.name.trim(),
          value: v.value.trim(),
          sku: v.sku.trim().toUpperCase(),
          priceModifier: Number.isFinite(v.priceModifier) ? v.priceModifier : 0,
          stockQuantity: Number.isFinite(v.stockQuantity) ? v.stockQuantity : 0,
          ...(v.image.trim() ? { image: v.image.trim() } : {}),
          isDefault: v.isDefault,
        }));
      const cleanData: any = { ...data, images, faqs: cleanFaqs, specs: cleanSpecs, variants: cleanVariants, tags };
      // Strip empty optional string fields so we don't send blank values
      for (const key of ['shortDescription', 'deliveryNotes', 'installationNotes', 'metaTitle', 'metaDescription', 'subcategoryId', 'warranty'] as const) {
        if (!cleanData[key] || !String(cleanData[key]).trim()) delete cleanData[key];
      }
      if (cleanData.lowStockThreshold == null || isNaN(cleanData.lowStockThreshold)) {
        delete cleanData.lowStockThreshold;
      }
      if (cleanData.compareAtPrice == null || isNaN(cleanData.compareAtPrice)) {
        delete cleanData.compareAtPrice;
      }
      if (cleanData.discount == null || isNaN(cleanData.discount) || cleanData.discount === 0) {
        delete cleanData.discount;
        delete cleanData.discountEndsAt;
      } else if (cleanData.discountEndsAt) {
        cleanData.discountEndsAt = new Date(cleanData.discountEndsAt + 'T23:59:59').toISOString();
      } else {
        delete cleanData.discountEndsAt;
      }
      await adminApi.createProduct(cleanData);
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-inventory-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-inventory-dashboard'] });
      toast.success('Product created successfully');
      router.push('/admin/products');
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, 'Failed to create product'), { duration: 8000 });
    } finally {
      setIsLoading(false);
    }
  };

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
          <h1 className="text-2xl font-semibold text-dark-900">New Product</h1>
          <p className="text-dark-500 mt-1">Add a new product to your catalog</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card padding="lg">
              <h2 className="text-lg font-semibold text-dark-900 mb-4">Basic Information</h2>
              <div className="space-y-4">
                <Input
                  label="Product Title"
                  placeholder="Enter product title"
                  error={errors.title?.message}
                  {...register('title')}
                />
                <Textarea
                  label="Description"
                  placeholder="Enter product description"
                  rows={5}
                  error={errors.description?.message}
                  {...register('description')}
                />
                <Textarea
                  label="Short Description"
                  placeholder="One-line summary shown on product cards (optional)"
                  rows={2}
                  error={errors.shortDescription?.message}
                  {...register('shortDescription')}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="SKU"
                    placeholder="Enter SKU"
                    error={errors.sku?.message}
                    {...register('sku')}
                  />
                  <Select
                    label="Brand"
                    options={brandOptions}
                    error={errors.brand?.message}
                    {...register('brand')}
                  />
                </div>
                <Input
                  label="Warranty"
                  placeholder="e.g., 1 Year Manufacturer Warranty"
                  error={errors.warranty?.message}
                  {...register('warranty')}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Textarea
                    label="Delivery Notes"
                    placeholder="e.g., Delivered within 2-5 business days"
                    rows={2}
                    error={errors.deliveryNotes?.message}
                    {...register('deliveryNotes')}
                  />
                  <Textarea
                    label="Installation Notes"
                    placeholder="e.g., Professional installation available"
                    rows={2}
                    error={errors.installationNotes?.message}
                    {...register('installationNotes')}
                  />
                </div>
              </div>
            </Card>

            {/* Tags */}
            <Card padding="lg">
              <h2 className="text-lg font-semibold text-dark-900 mb-1">Tags</h2>
              <p className="text-xs text-dark-400 mb-4">Used for search and related-product matching.</p>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a tag and press Enter"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                  fullWidth
                />
                <Button type="button" onClick={addTag} title="Add tag" aria-label="Add tag">
                  <HiOutlinePlus size={18} />
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {tags.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 bg-beige-100 text-dark-700 text-sm rounded-full">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="text-dark-400 hover:text-error-500">
                        <HiOutlineX size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </Card>

            {/* Images */}
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
                          <img
                            src={img.url}
                            alt={img.alt || `Product ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
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

            {/* Pricing */}
            <Card padding="lg">
              <h2 className="text-lg font-semibold text-dark-900 mb-4">Pricing & Inventory</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Price (SAR)"
                    type="number"
                    placeholder="0"
                    error={errors.price?.message}
                    {...register('price', { valueAsNumber: true })}
                  />
                  <Input
                    label="Compare at Price (SAR)"
                    type="number"
                    placeholder="0"
                    {...register('compareAtPrice', { valueAsNumber: true })}
                  />
                  <Input
                    label="Stock Quantity"
                    type="number"
                    placeholder="0"
                    error={errors.stockQuantity?.message}
                    {...register('stockQuantity', { valueAsNumber: true })}
                  />
                  <Input
                    label="Low Stock Threshold"
                    type="number"
                    placeholder="5"
                    hint="Alert when stock reaches this level"
                    error={errors.lowStockThreshold?.message}
                    {...register('lowStockThreshold', { valueAsNumber: true })}
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
                              SAR {watchPrice?.toLocaleString()}
                            </span>
                            <span className="font-bold text-lg">
                              SAR {(watchPrice * (1 - (watchDiscount || 0) / 100)).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </span>
                          </p>
                          <p className="text-xs text-green-600 mt-0.5">
                            Customer saves SAR {(watchPrice * (watchDiscount || 0) / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}
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

            {/* Variants */}
            <Card padding="lg">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-dark-900">Variants</h2>
                  <p className="text-xs text-dark-400 mt-0.5">
                    Optional purchasable options (e.g. Colour, Capacity). Each variant carries its own
                    SKU and stock, and its price modifier is added to the discounted price. When
                    variants exist, the product&apos;s stock above is replaced by the sum of theirs.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setVariants([
                      ...variants,
                      {
                        id: `var_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        name: variants[0]?.name || 'Colour',
                        value: '',
                        sku: '',
                        priceModifier: 0,
                        stockQuantity: 0,
                        image: '',
                        isDefault: variants.length === 0,
                      },
                    ]);
                  }}
                  leftIcon={<HiOutlinePlus size={16} />}
                >
                  Add Variant
                </Button>
              </div>

              <datalist id="variant-name-options">
                {VARIANT_NAMES.map((n) => (
                  <option key={n} value={n} />
                ))}
              </datalist>

              {variants.length === 0 ? (
                <p className="text-sm text-dark-400 text-center py-6">No variants added yet. Click &quot;Add Variant&quot; to get started.</p>
              ) : (
                <div className="space-y-3">
                  {variants.map((variant, index) => (
                    <div key={variant.id} className="flex items-start gap-2 p-3 bg-beige-50 rounded-lg border border-beige-200">
                      <div className="flex-1 space-y-2">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          <input
                            type="text"
                            list="variant-name-options"
                            aria-label="Option name"
                            placeholder="Option name (e.g., Colour)"
                            value={variant.name}
                            onChange={(e) => {
                              const next = [...variants];
                              next[index] = { ...next[index], name: e.target.value };
                              setVariants(next);
                            }}
                            className="px-3 py-2 border border-beige-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                          />
                          <input
                            type="text"
                            aria-label="Option value"
                            placeholder="Value (e.g., Stainless Steel)"
                            value={variant.value}
                            onChange={(e) => {
                              const next = [...variants];
                              next[index] = { ...next[index], value: e.target.value };
                              setVariants(next);
                            }}
                            className="px-3 py-2 border border-beige-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                          <input
                            type="text"
                            aria-label="Variant SKU"
                            placeholder="Variant SKU"
                            value={variant.sku}
                            onChange={(e) => {
                              const next = [...variants];
                              next[index] = { ...next[index], sku: e.target.value };
                              setVariants(next);
                            }}
                            className="px-3 py-2 border border-beige-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          <input
                            type="number"
                            aria-label="Price modifier in SAR"
                            placeholder="Price modifier (SAR, +/-)"
                            value={Number.isFinite(variant.priceModifier) ? variant.priceModifier : 0}
                            onChange={(e) => {
                              const next = [...variants];
                              next[index] = { ...next[index], priceModifier: parseFloat(e.target.value) || 0 };
                              setVariants(next);
                            }}
                            className="px-3 py-2 border border-beige-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                          <input
                            type="number"
                            min={0}
                            aria-label="Variant stock quantity"
                            placeholder="Stock"
                            value={Number.isFinite(variant.stockQuantity) ? variant.stockQuantity : 0}
                            onChange={(e) => {
                              const next = [...variants];
                              next[index] = { ...next[index], stockQuantity: Math.max(0, parseInt(e.target.value, 10) || 0) };
                              setVariants(next);
                            }}
                            className="px-3 py-2 border border-beige-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                          <input
                            type="text"
                            aria-label="Variant image URL"
                            placeholder="Image URL (optional)"
                            value={variant.image}
                            onChange={(e) => {
                              const next = [...variants];
                              next[index] = { ...next[index], image: e.target.value };
                              setVariants(next);
                            }}
                            className="px-3 py-2 border border-beige-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                        </div>
                        <label className="flex items-center gap-2 text-xs text-dark-600">
                          <input
                            type="radio"
                            name="default-variant"
                            checked={variant.isDefault}
                            onChange={() => {
                              setVariants(variants.map((v, i) => ({ ...v, isDefault: i === index })));
                            }}
                            className="accent-primary-600"
                          />
                          Pre-selected on the product page
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={() => setVariants(variants.filter((_, i) => i !== index))}
                        className="p-2 text-error-500 hover:text-error-600 rounded mt-0.5"
                        title="Remove variant"
                      >
                        <HiOutlineTrash size={16} />
                      </button>
                    </div>
                  ))}
                  <p className="text-xs text-dark-500">
                    Total variant stock: {variants.reduce((sum, v) => sum + (Number.isFinite(v.stockQuantity) ? v.stockQuantity : 0), 0)}
                  </p>
                </div>
              )}
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
            {/* Status */}
            <Card padding="lg">
              <h2 className="text-lg font-semibold text-dark-900 mb-4">Status</h2>
              <div className="space-y-3">
                <Checkbox
                  label="Active"
                  description="Product is visible on the store"
                  {...register('isActive')}
                />
                <Checkbox
                  label="Featured"
                  description="Show in featured products section"
                  {...register('isFeatured')}
                />
              </div>
            </Card>

            {/* Category */}
            <Card padding="lg">
              <h2 className="text-lg font-semibold text-dark-900 mb-4">Organization</h2>
              <div className="space-y-4">
                <Select
                  label="Category"
                  options={categoryOptions}
                  error={errors.categoryId?.message}
                  {...register('categoryId')}
                />
                <Select
                  label="Subcategory"
                  options={subcategoryOptions}
                  hint={!watchCategoryId ? 'Select a category first' : undefined}
                  error={errors.subcategoryId?.message}
                  {...register('subcategoryId')}
                />
              </div>
            </Card>

            {/* SEO */}
            <Card padding="lg">
              <h2 className="text-lg font-semibold text-dark-900 mb-1">SEO</h2>
              <p className="text-xs text-dark-400 mb-4">Optional. Falls back to the product title/description if left empty.</p>
              <div className="space-y-4">
                <Input
                  label="Meta Title"
                  placeholder="Up to 60 characters"
                  error={errors.metaTitle?.message}
                  {...register('metaTitle')}
                />
                <Textarea
                  label="Meta Description"
                  placeholder="Up to 160 characters"
                  rows={3}
                  error={errors.metaDescription?.message}
                  {...register('metaDescription')}
                />
              </div>
            </Card>

            {/* Actions */}
            <Card padding="lg">
              <div className="space-y-3">
                <Button type="submit" fullWidth isLoading={isLoading}>
                  Create Product
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

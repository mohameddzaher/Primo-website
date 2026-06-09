'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { HiOutlineArrowLeft } from 'react-icons/hi';
import { Button, Input, Textarea, Card, Checkbox } from '@/components/ui';
import { brandsApi, adminApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-error';
import toast from 'react-hot-toast';

const brandSchema = z.object({
  name: z.string().min(1, 'Brand name is required').max(100),
  description: z.string().max(500).optional(),
  logo: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  website: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  isActive: z.boolean(),
});

type BrandForm = z.infer<typeof brandSchema>;

export default function EditBrandPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const brandId = params.id as string;

  const { data: brand, isLoading: brandLoading } = useQuery({
    queryKey: ['admin-brand', brandId],
    queryFn: () => brandsApi.getById(brandId),
    enabled: !!brandId,
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => adminApi.updateBrand(brandId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-brand', brandId] });
      queryClient.invalidateQueries({ queryKey: ['admin-brands'] });
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      toast.success('Brand updated successfully');
      router.push('/admin/brands');
    },
    onError: (error: any) => {
      toast.error(getApiErrorMessage(error, 'Failed to update brand'));
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<BrandForm>({
    resolver: zodResolver(brandSchema),
  });

  useEffect(() => {
    if (brand) {
      reset({
        name: brand.name,
        description: brand.description || '',
        logo: brand.logo || '',
        website: brand.website || '',
        isActive: brand.isActive,
      });
    }
  }, [brand, reset]);

  const onSubmit = (data: BrandForm) => {
    // Clean up empty strings
    const cleanData = {
      ...data,
      logo: data.logo || undefined,
      website: data.website || undefined,
      description: data.description || undefined,
    };
    updateMutation.mutate(cleanData);
  };

  if (brandLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-beige-200 rounded w-1/4 animate-pulse"></div>
        <Card padding="lg" className="animate-pulse">
          <div className="h-64 bg-beige-200 rounded"></div>
        </Card>
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-dark-900 mb-4">Brand Not Found</h2>
        <Link href="/admin/brands">
          <Button>Back to Brands</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/brands">
          <Button variant="ghost" size="sm">
            <HiOutlineArrowLeft size={20} />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-dark-900">Edit Brand</h1>
          <p className="text-dark-500 mt-1">{brand.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card padding="lg">
              <h2 className="text-lg font-semibold text-dark-900 mb-4">Brand Information</h2>
              <div className="space-y-4">
                <Input
                  label="Brand Name"
                  placeholder="Enter brand name"
                  error={errors.name?.message}
                  {...register('name')}
                />
                <Textarea
                  label="Description"
                  placeholder="Enter brand description (optional)"
                  rows={3}
                  error={errors.description?.message}
                  {...register('description')}
                />
                <Input
                  label="Logo URL"
                  placeholder="https://example.com/logo.png"
                  error={errors.logo?.message}
                  {...register('logo')}
                />
                <Input
                  label="Website"
                  placeholder="https://example.com"
                  error={errors.website?.message}
                  {...register('website')}
                />
              </div>
            </Card>

            {/* Brand Stats */}
            <Card padding="lg">
              <h2 className="text-lg font-semibold text-dark-900 mb-4">Statistics</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-beige-50 rounded-lg p-4">
                  <p className="text-sm text-dark-500">Total Products</p>
                  <p className="text-2xl font-semibold text-dark-900">{brand.productCount || 0}</p>
                </div>
                <div className="bg-beige-50 rounded-lg p-4">
                  <p className="text-sm text-dark-500">Slug</p>
                  <p className="text-lg font-medium text-dark-900">{brand.slug}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <Card padding="lg">
              <h2 className="text-lg font-semibold text-dark-900 mb-4">Status</h2>
              <Checkbox
                label="Active"
                description="Brand is visible in product filters"
                {...register('isActive')}
              />
            </Card>

            {/* Actions */}
            <Card padding="lg">
              <div className="space-y-3">
                <Button type="submit" fullWidth isLoading={updateMutation.isPending}>
                  Update Brand
                </Button>
                <Link href="/admin/brands">
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

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { HiOutlineArrowLeft } from 'react-icons/hi';
import { Button, Input, Textarea, Card, Checkbox } from '@/components/ui';
import { adminApi } from '@/lib/api';
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

export default function NewBrandPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BrandForm>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      isActive: true,
    },
  });

  const onSubmit = async (data: BrandForm) => {
    setIsLoading(true);
    try {
      // Clean up empty strings
      const cleanData = {
        ...data,
        logo: data.logo || undefined,
        website: data.website || undefined,
        description: data.description || undefined,
      };
      await adminApi.createBrand(cleanData);
      queryClient.invalidateQueries({ queryKey: ['admin-brands'] });
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      toast.success('Brand created successfully');
      router.push('/admin/brands');
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, 'Failed to create brand'));
    } finally {
      setIsLoading(false);
    }
  };

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
          <h1 className="text-2xl font-semibold text-dark-900">New Brand</h1>
          <p className="text-dark-500 mt-1">Add a new product brand</p>
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
                <Button type="submit" fullWidth isLoading={isLoading}>
                  Create Brand
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

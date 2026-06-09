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

const categorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  image: z.string().optional(),
  isActive: z.boolean(),
});

type CategoryForm = z.infer<typeof categorySchema>;

export default function NewCategoryPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
    defaultValues: { isActive: true },
  });

  const onSubmit = async (data: CategoryForm) => {
    setIsLoading(true);
    try {
      await adminApi.createCategory(data);
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category created successfully');
      router.push('/admin/categories');
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, 'Failed to create category'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/categories">
          <Button variant="ghost" size="sm"><HiOutlineArrowLeft size={20} /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-dark-900">New Category</h1>
          <p className="text-dark-500 mt-1">Add a new product category</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl">
        <Card padding="lg" className="space-y-6">
          <Input label="Category Name" placeholder="Enter category name" error={errors.name?.message} {...register('name')} />
          <Textarea label="Description" placeholder="Enter category description" rows={4} {...register('description')} />
          <Input label="Image URL" placeholder="Enter image URL" {...register('image')} />
          <Checkbox label="Active" description="Category is visible on the store" {...register('isActive')} />
          <div className="flex gap-3 pt-4">
            <Button type="submit" isLoading={isLoading}>Create Category</Button>
            <Link href="/admin/categories">
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
          </div>
        </Card>
      </form>
    </div>
  );
}

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

export default function EditCategoryPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const categoryId = params.id as string;

  const { data: category, isLoading: categoryLoading } = useQuery({
    queryKey: ['admin-category', categoryId],
    queryFn: () => adminApi.getCategory(categoryId),
    enabled: !!categoryId,
  });

  const updateMutation = useMutation({
    mutationFn: (data: CategoryForm) => adminApi.updateCategory(categoryId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-category', categoryId] });
      toast.success('Category updated');
      router.push('/admin/categories');
    },
    onError: (error: any) => toast.error(getApiErrorMessage(error, 'Failed to update category')),
  });

  const { register, handleSubmit, formState: { errors }, reset } = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
  });

  useEffect(() => {
    if (category) {
      reset({
        name: category.name,
        description: category.description || '',
        image: category.image || '',
        isActive: category.isActive,
      });
    }
  }, [category, reset]);

  if (categoryLoading) {
    return <div className="animate-pulse"><div className="h-64 bg-beige-200 rounded-xl"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/categories">
          <Button variant="ghost" size="sm"><HiOutlineArrowLeft size={20} /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-dark-900">Edit Category</h1>
          <p className="text-dark-500 mt-1">{category?.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit((data) => updateMutation.mutate(data))} className="max-w-2xl">
        <Card padding="lg" className="space-y-6">
          <Input label="Category Name" error={errors.name?.message} {...register('name')} />
          <Textarea label="Description" rows={4} {...register('description')} />
          <Input label="Image URL" {...register('image')} />
          <Checkbox label="Active" description="Category is visible" {...register('isActive')} />
          <div className="flex gap-3 pt-4">
            <Button type="submit" isLoading={updateMutation.isPending}>Update Category</Button>
            <Link href="/admin/categories"><Button type="button" variant="outline">Cancel</Button></Link>
          </div>
        </Card>
      </form>
    </div>
  );
}

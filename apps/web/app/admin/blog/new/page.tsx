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

const postSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  excerpt: z.string().min(10, 'Excerpt must be at least 10 characters'),
  content: z.string().min(50, 'Content must be at least 50 characters'),
  image: z.string().optional(),
  category: z.string(),
  tags: z.string().optional(),
  status: z.enum(['draft', 'published']),
  featured: z.boolean(),
});

type PostForm = z.infer<typeof postSchema>;

export default function NewBlogPostPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PostForm>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      status: 'draft',
      featured: false,
      category: 'general',
    },
  });

  const onSubmit = async (data: PostForm) => {
    setIsLoading(true);
    try {
      const postData: Record<string, any> = {
        title: data.title,
        excerpt: data.excerpt,
        content: data.content,
        tags: data.tags?.split(',').map((t) => t.trim()).filter(Boolean) || [],
        isPublished: data.status === 'published',
      };
      if (data.image) postData.featuredImage = data.image;
      await adminApi.createBlogPost(postData);
      queryClient.invalidateQueries({ queryKey: ['admin-blog'] });
      toast.success('Post created successfully');
      router.push('/admin/blog');
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, 'Failed to create post'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/blog">
          <Button variant="ghost" size="sm">
            <HiOutlineArrowLeft size={20} />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-dark-900">New Blog Post</h1>
          <p className="text-dark-500 mt-1">Create a new blog article</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card padding="lg" className="space-y-6">
            <Input
              label="Post Title"
              placeholder="Enter post title"
              error={errors.title?.message}
              {...register('title')}
            />

            <Textarea
              label="Excerpt"
              placeholder="Brief summary of the post..."
              rows={3}
              error={errors.excerpt?.message}
              {...register('excerpt')}
            />

            <Textarea
              label="Content"
              placeholder="Write your post content here... (Markdown supported)"
              rows={15}
              error={errors.content?.message}
              {...register('content')}
            />
          </Card>
        </div>

        <div className="space-y-6">
          <Card padding="lg" className="space-y-6">
            <h3 className="font-medium text-dark-900">Post Settings</h3>

            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">
                Status
              </label>
              <select
                className="w-full px-4 py-2 border border-beige-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                {...register('status')}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">
                Category
              </label>
              <select
                className="w-full px-4 py-2 border border-beige-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                {...register('category')}
              >
                <option value="general">General</option>
                <option value="news">News</option>
                <option value="tips">Tips & Guides</option>
                <option value="trends">Trends</option>
                <option value="lifestyle">Lifestyle</option>
              </select>
            </div>

            <Input
              label="Featured Image URL"
              placeholder="https://..."
              {...register('image')}
            />

            <Input
              label="Tags"
              placeholder="tag1, tag2, tag3"
              {...register('tags')}
            />

            <Checkbox
              label="Featured Post"
              description="Show on homepage featured section"
              {...register('featured')}
            />
          </Card>

          <div className="flex flex-col gap-3">
            <Button type="submit" isLoading={isLoading} fullWidth>
              Create Post
            </Button>
            <Link href="/admin/blog">
              <Button type="button" variant="outline" fullWidth>
                Cancel
              </Button>
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}

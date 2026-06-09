'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { HiOutlineArrowLeft, HiOutlineGlobe, HiOutlineTrash } from 'react-icons/hi';
import { Button, Input, Textarea, Card, Checkbox, ConfirmModal } from '@/components/ui';
import { adminApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-error';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function EditSEOPageConfigPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const pageId = params.id as string;

  const [deleteModal, setDeleteModal] = useState(false);

  const [formData, setFormData] = useState({
    path: '',
    metaTitle: '',
    metaDescription: '',
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    canonicalUrl: '',
    keywords: '',
    noIndex: false,
    noFollow: false,
    structuredData: '',
  });

  const { data: pageConfig, isLoading: pageLoading } = useQuery({
    queryKey: ['admin-seo-page', pageId],
    queryFn: () => adminApi.getSEOPage(pageId),
    enabled: !!pageId,
  });

  useEffect(() => {
    if (pageConfig) {
      setFormData({
        path: pageConfig.path || '',
        metaTitle: pageConfig.metaTitle || '',
        metaDescription: pageConfig.metaDescription || '',
        ogTitle: pageConfig.ogTitle || '',
        ogDescription: pageConfig.ogDescription || '',
        ogImage: pageConfig.ogImage || '',
        canonicalUrl: pageConfig.canonicalUrl || '',
        keywords: Array.isArray(pageConfig.keywords) ? pageConfig.keywords.join(', ') : pageConfig.keywords || '',
        noIndex: pageConfig.noIndex || false,
        noFollow: pageConfig.noFollow || false,
        structuredData: pageConfig.structuredData ? JSON.stringify(pageConfig.structuredData, null, 2) : '',
      });
    }
  }, [pageConfig]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => adminApi.updateSEOPage(pageId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-seo-page', pageId] });
      queryClient.invalidateQueries({ queryKey: ['admin-seo-pages'] });
      toast.success('Page SEO config updated');
      router.push('/admin/seo/pages');
    },
    onError: (error: any) => {
      toast.error(getApiErrorMessage(error, 'Failed to update page config'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => adminApi.deleteSEOPage(pageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-seo-pages'] });
      toast.success('Page SEO config deleted');
      router.push('/admin/seo/pages');
    },
    onError: (error: any) => {
      toast.error(getApiErrorMessage(error, 'Failed to delete page config'));
    },
  });

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload: any = {
      path: formData.path,
      metaTitle: formData.metaTitle || undefined,
      metaDescription: formData.metaDescription || undefined,
      ogTitle: formData.ogTitle || undefined,
      ogDescription: formData.ogDescription || undefined,
      ogImage: formData.ogImage || undefined,
      canonicalUrl: formData.canonicalUrl || undefined,
      keywords: formData.keywords ? formData.keywords.split(',').map((k) => k.trim()).filter(Boolean) : undefined,
      noIndex: formData.noIndex,
      noFollow: formData.noFollow,
    };

    if (formData.structuredData) {
      try {
        // Validate it's valid JSON but send as string (schema expects string)
        JSON.parse(formData.structuredData);
        payload.structuredData = formData.structuredData;
      } catch {
        toast.error('Structured data must be valid JSON');
        return;
      }
    }

    updateMutation.mutate(payload);
  };

  if (pageLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-10 bg-beige-200 rounded w-64"></div>
        <div className="h-96 bg-beige-200 rounded-xl"></div>
      </div>
    );
  }

  // Google Preview
  const previewTitle = formData.metaTitle || formData.path || 'Page Title';
  const previewDescription = formData.metaDescription || 'No description set. Add a meta description to control how this page appears in search results.';
  const previewUrl = formData.canonicalUrl || `https://yourstore.com${formData.path || '/'}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/seo/pages">
            <Button variant="ghost" size="sm"><HiOutlineArrowLeft size={20} /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-dark-900">Edit Page SEO Config</h1>
            <p className="text-dark-500 mt-1">{pageConfig?.path}</p>
          </div>
        </div>
        <Button
          variant="danger"
          size="sm"
          leftIcon={<HiOutlineTrash size={16} />}
          onClick={() => setDeleteModal(true)}
        >
          Delete
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card padding="lg" className="space-y-6">
            <h2 className="font-semibold text-dark-900">Basic SEO</h2>

            <Input
              label="Path"
              placeholder="/about, /products/category-name"
              value={formData.path}
              onChange={(e) => handleChange('path', e.target.value)}
              hint="The URL path this config applies to"
            />

            <div>
              <Input
                label="Meta Title"
                placeholder="Page title for search engines"
                value={formData.metaTitle}
                onChange={(e) => handleChange('metaTitle', e.target.value)}
                hint={`${formData.metaTitle.length}/70 characters`}
              />
              <div className="mt-1 w-full bg-beige-200 rounded-full h-1">
                <div
                  className={cn(
                    'h-1 rounded-full transition-all',
                    formData.metaTitle.length <= 70 ? 'bg-green-500' : 'bg-red-500'
                  )}
                  style={{ width: `${Math.min((formData.metaTitle.length / 70) * 100, 100)}%` }}
                />
              </div>
            </div>

            <div>
              <Textarea
                label="Meta Description"
                placeholder="Describe this page for search engine results..."
                rows={3}
                value={formData.metaDescription}
                onChange={(e) => handleChange('metaDescription', e.target.value)}
                hint={`${formData.metaDescription.length}/160 characters`}
              />
              <div className="mt-1 w-full bg-beige-200 rounded-full h-1">
                <div
                  className={cn(
                    'h-1 rounded-full transition-all',
                    formData.metaDescription.length <= 160 ? 'bg-green-500' : 'bg-red-500'
                  )}
                  style={{ width: `${Math.min((formData.metaDescription.length / 160) * 100, 100)}%` }}
                />
              </div>
            </div>

            <Input
              label="Canonical URL"
              placeholder="https://yourstore.com/page"
              value={formData.canonicalUrl}
              onChange={(e) => handleChange('canonicalUrl', e.target.value)}
              hint="Leave empty to use the default URL"
            />

            <Input
              label="Keywords"
              placeholder="keyword1, keyword2, keyword3"
              value={formData.keywords}
              onChange={(e) => handleChange('keywords', e.target.value)}
              hint="Comma-separated list of keywords"
            />
          </Card>

          <Card padding="lg" className="space-y-6">
            <h2 className="font-semibold text-dark-900">Open Graph</h2>

            <Input
              label="OG Title"
              placeholder="Title for social media sharing"
              value={formData.ogTitle}
              onChange={(e) => handleChange('ogTitle', e.target.value)}
            />

            <Textarea
              label="OG Description"
              placeholder="Description for social media sharing"
              rows={2}
              value={formData.ogDescription}
              onChange={(e) => handleChange('ogDescription', e.target.value)}
            />

            <Input
              label="OG Image URL"
              placeholder="https://yourstore.com/images/og-image.jpg"
              value={formData.ogImage}
              onChange={(e) => handleChange('ogImage', e.target.value)}
            />
          </Card>

          <Card padding="lg" className="space-y-6">
            <h2 className="font-semibold text-dark-900">Advanced</h2>

            <div className="flex flex-col gap-4">
              <Checkbox
                label="noIndex"
                description="Prevent search engines from indexing this page"
                checked={formData.noIndex}
                onChange={(e) => handleChange('noIndex', e.target.checked)}
              />

              <Checkbox
                label="noFollow"
                description="Prevent search engines from following links on this page"
                checked={formData.noFollow}
                onChange={(e) => handleChange('noFollow', e.target.checked)}
              />
            </div>

            <Textarea
              label="Structured Data (JSON-LD)"
              placeholder='{"@context": "https://schema.org", "@type": "WebPage", ...}'
              rows={6}
              value={formData.structuredData}
              onChange={(e) => handleChange('structuredData', e.target.value)}
              hint="Enter valid JSON-LD structured data"
              className="font-mono text-sm"
            />
          </Card>

          <div className="flex gap-3">
            <Button type="submit" isLoading={updateMutation.isPending}>
              Update Page Config
            </Button>
            <Link href="/admin/seo/pages">
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
          </div>
        </div>

        {/* Google Preview Sidebar */}
        <div className="lg:col-span-1">
          <Card padding="lg" className="sticky top-6">
            <h2 className="font-semibold text-dark-900 mb-4 flex items-center gap-2">
              <HiOutlineGlobe size={18} />
              Google Preview
            </h2>
            <div className="border border-beige-200 rounded-lg p-4 bg-white">
              <p className="text-sm text-green-700 truncate font-sans">
                {previewUrl}
              </p>
              <p className="text-lg text-blue-800 font-medium mt-0.5 line-clamp-2 hover:underline cursor-pointer">
                {previewTitle}
              </p>
              <p className="text-sm text-dark-500 mt-1 line-clamp-2">
                {previewDescription}
              </p>
            </div>
            <p className="text-xs text-dark-400 mt-3">
              This is an approximate preview. Actual results may vary.
            </p>
          </Card>
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Delete Page Config"
        message={`Are you sure you want to delete the SEO configuration for "${pageConfig?.path}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

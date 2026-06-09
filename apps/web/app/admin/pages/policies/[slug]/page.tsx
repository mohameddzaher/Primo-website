'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { HiOutlineArrowLeft } from 'react-icons/hi';
import { Button, Input, Textarea, Card, Checkbox } from '@/components/ui';
import { adminApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-error';
import toast from 'react-hot-toast';

interface PolicyData {
  _id: string;
  slug: string;
  title: string;
  content: string;
  isActive: boolean;
}

interface PolicyFormData {
  title: string;
  content: string;
  isActive: boolean;
}

export default function EditPolicyPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const slug = params.slug as string;

  const [form, setForm] = useState<PolicyFormData>({
    title: '',
    content: '',
    isActive: true,
  });
  const [initialized, setInitialized] = useState(false);

  // Fetch all policies and find the one matching the slug
  const { data: policies, isLoading } = useQuery({
    queryKey: ['admin-policies'],
    queryFn: () => adminApi.getPolicies(),
    enabled: !!slug,
  });

  const policy: PolicyData | undefined = (policies as PolicyData[] | undefined)?.find(
    (p) => p.slug === slug
  );

  // Populate the form when policy data arrives
  useEffect(() => {
    if (policy && !initialized) {
      setForm({
        title: policy.title || '',
        content: policy.content || '',
        isActive: policy.isActive ?? true,
      });
      setInitialized(true);
    }
  }, [policy, initialized]);

  const updateMutation = useMutation({
    mutationFn: (data: PolicyFormData) => adminApi.updatePolicy(slug, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-policies'] });
      toast.success('Policy page updated successfully');
      router.push('/admin/pages');
    },
    onError: (error: any) => toast.error(getApiErrorMessage(error, 'Failed to update policy page')),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }
    updateMutation.mutate(form);
  };

  // ── Loading state ──────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-beige-200 rounded animate-pulse" />
          <div>
            <div className="h-7 w-48 bg-beige-200 rounded animate-pulse" />
            <div className="h-4 w-32 bg-beige-200 rounded animate-pulse mt-2" />
          </div>
        </div>
        <div className="h-96 bg-beige-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  // ── Not found state ────────────────────────────────────────────────────

  if (!isLoading && !policy) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/pages">
            <Button variant="ghost" size="sm">
              <HiOutlineArrowLeft size={20} />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-dark-900">Policy Not Found</h1>
            <p className="text-dark-500 mt-1">
              The policy page &quot;{slug}&quot; could not be found.
            </p>
          </div>
        </div>
        <Card padding="lg" className="text-center">
          <p className="text-dark-500 mb-4">
            This policy page does not exist or may have been removed.
          </p>
          <Link href="/admin/pages">
            <Button variant="outline">Back to Pages</Button>
          </Link>
        </Card>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/pages">
          <Button variant="ghost" size="sm">
            <HiOutlineArrowLeft size={20} />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-dark-900">Edit Policy Page</h1>
          <p className="text-dark-500 mt-1">{policy?.title}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-2">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card padding="lg" className="space-y-6">
              <Input
                label="Page Title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Enter the policy page title..."
              />

              <Textarea
                label="Page Content"
                rows={20}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="Enter the policy page content. You can use HTML markup for formatting."
              />

              <Checkbox
                label="Active"
                description="This page is visible on the website"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />

              <div className="flex gap-3 pt-4">
                <Button type="submit" isLoading={updateMutation.isPending}>
                  Save Changes
                </Button>
                <Link href="/admin/pages">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
              </div>
            </Card>
          </motion.div>
        </form>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card padding="md">
            <h3 className="font-medium text-dark-900 mb-4">Page Details</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-dark-500 uppercase">Slug</p>
                <code className="text-sm bg-beige-100 text-dark-600 px-2 py-1 rounded mt-1 inline-block">
                  {slug}
                </code>
              </div>
              <div>
                <p className="text-xs font-semibold text-dark-500 uppercase">Public URL</p>
                <p className="text-sm text-primary-600 mt-1">/{slug}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-dark-500 uppercase">Status</p>
                <span
                  className={`mt-1 inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    form.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {form.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </Card>

          <Card padding="md">
            <h3 className="font-medium text-dark-900 mb-3">Tips</h3>
            <ul className="space-y-2 text-sm text-dark-500">
              <li>- Use clear, concise language for policy pages.</li>
              <li>- Content supports HTML for formatting (bold, lists, links).</li>
              <li>- Inactive pages will not be accessible to customers.</li>
              <li>- The slug cannot be changed as it is used for URL routing.</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

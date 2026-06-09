'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineEye, HiOutlineDocumentText, HiOutlineDownload } from 'react-icons/hi';
import { Button, Input, Card, ConfirmModal } from '@/components/ui';
import { adminApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-error';
import { exportToCSV, blogColumns } from '@/lib/export';
import toast from 'react-hot-toast';

export default function AdminBlogPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string; title: string }>({
    isOpen: false,
    id: '',
    title: '',
  });
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-blog', page, search],
    queryFn: () => adminApi.getBlogPosts({ page, limit: 20, search }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteBlogPost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog'] });
      toast.success('Post deleted');
      setDeleteModal({ isOpen: false, id: '', title: '' });
    },
    onError: (error: any) => toast.error(getApiErrorMessage(error, 'Failed to delete post')),
  });

  const handleDelete = (id: string, title: string) => {
    setDeleteModal({ isOpen: true, id, title });
  };

  const confirmDelete = () => {
    deleteMutation.mutate(deleteModal.id);
  };

  const posts = data?.posts || [];
  const pagination = data?.pagination;

  const handleExport = () => {
    if (posts.length === 0) {
      toast.error('No blog posts to export');
      return;
    }
    exportToCSV(posts, blogColumns, `blog-posts-${new Date().toISOString().split('T')[0]}`);
    toast.success('Blog posts exported successfully');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-dark-900">Blog Posts</h1>
          <p className="text-dark-500 mt-1">Manage blog articles and content</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" leftIcon={<HiOutlineDownload size={18} />} onClick={handleExport}>
            Export
          </Button>
          <Link href="/admin/blog/new">
            <Button leftIcon={<HiOutlinePlus size={18} />}>New Post</Button>
          </Link>
        </div>
      </div>

      <Card padding="md">
        <Input
          placeholder="Search posts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Card>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-beige-50 border-b border-beige-200">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase">Post</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase">Author</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase">Category</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase">Views</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase">Status</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase">Date</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-beige-200">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-6 py-4">
                      <div className="h-8 bg-beige-200 rounded animate-pulse"></div>
                    </td>
                  </tr>
                ))
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="w-16 h-16 bg-beige-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <HiOutlineDocumentText className="text-beige-400" size={32} />
                    </div>
                    <p className="text-dark-500">No blog posts found</p>
                    <Link href="/admin/blog/new" className="inline-block mt-4">
                      <Button size="sm">Create your first post</Button>
                    </Link>
                  </td>
                </tr>
              ) : (
                posts.map((post: any) => (
                  <motion.tr
                    key={post._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-beige-50"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-12 bg-beige-100 rounded-lg overflow-hidden flex-shrink-0">
                          {post.featuredImage ? (
                            <img
                              src={post.featuredImage}
                              alt={post.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-beige-400">
                              <HiOutlineDocumentText size={20} />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-dark-900 line-clamp-1">{post.title}</p>
                          <p className="text-sm text-dark-500 line-clamp-1">{post.excerpt}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-dark-600">
                      {post.authorId?.firstName} {post.authorId?.lastName || ''}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-beige-100 rounded text-sm text-dark-600">
                        {post.categoryId?.name || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-dark-600">
                      <div className="flex items-center gap-1">
                        <HiOutlineEye size={16} />
                        {post.viewCount || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          post.isPublished
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {post.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-dark-600">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link href={`/blog/${post.slug}`} target="_blank">
                          <Button variant="ghost" size="sm">
                            <HiOutlineEye size={18} />
                          </Button>
                        </Link>
                        <Link href={`/admin/blog/${post._id}`}>
                          <Button variant="ghost" size="sm">
                            <HiOutlinePencil size={18} />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(post._id, post.title)}
                        >
                          <HiOutlineTrash size={18} className="text-red-600" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-beige-200">
            <p className="text-sm text-dark-500">
              Page {page} of {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page === pagination.totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: '', title: '' })}
        onConfirm={confirmDelete}
        title="Delete Post"
        message={`Are you sure you want to delete "${deleteModal.title}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

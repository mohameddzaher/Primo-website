'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineCheck,
  HiOutlineX,
} from 'react-icons/hi';
import { Button, Card, Badge, Input, Select, ConfirmModal } from '@/components/ui';
import { adminApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-error';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface RedirectForm {
  fromPath: string;
  toPath: string;
  type: '301' | '302';
  isActive: boolean;
}

const emptyForm: RedirectForm = {
  fromPath: '',
  toPath: '',
  type: '301',
  isActive: true,
};

export default function SEORedirectsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<RedirectForm>({ ...emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<RedirectForm>({ ...emptyForm });
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string }>({
    isOpen: false,
    id: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-seo-redirects', page],
    queryFn: () => adminApi.getSEORedirects({ page, limit: 20 }),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => adminApi.createSEORedirect(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-seo-redirects'] });
      toast.success('Redirect created');
      setShowAddForm(false);
      setAddForm({ ...emptyForm });
    },
    onError: (error: any) => {
      toast.error(getApiErrorMessage(error, 'Failed to create redirect'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminApi.updateSEORedirect(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-seo-redirects'] });
      toast.success('Redirect updated');
      setEditingId(null);
    },
    onError: (error: any) => {
      toast.error(getApiErrorMessage(error, 'Failed to update redirect'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteSEORedirect(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-seo-redirects'] });
      toast.success('Redirect deleted');
      setDeleteModal({ isOpen: false, id: '' });
    },
    onError: (error: any) => {
      toast.error(getApiErrorMessage(error, 'Failed to delete redirect'));
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminApi.updateSEORedirect(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-seo-redirects'] });
      toast.success('Redirect status updated');
    },
    onError: (error: any) => {
      toast.error(getApiErrorMessage(error, 'Failed to update redirect status'));
    },
  });

  const redirects = data?.redirects || [];
  const pagination = data?.pagination;

  const handleAdd = () => {
    if (!addForm.fromPath || !addForm.toPath) {
      toast.error('From and To paths are required');
      return;
    }
    createMutation.mutate(addForm);
  };

  const startEdit = (redirect: any) => {
    setEditingId(redirect._id);
    setEditForm({
      fromPath: redirect.fromPath || '',
      toPath: redirect.toPath || '',
      type: redirect.type || '301',
      isActive: redirect.isActive ?? true,
    });
  };

  const handleUpdate = () => {
    if (!editingId) return;
    if (!editForm.fromPath || !editForm.toPath) {
      toast.error('From and To paths are required');
      return;
    }
    updateMutation.mutate({ id: editingId, data: editForm });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ ...emptyForm });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-dark-900">URL Redirects</h1>
          <p className="text-dark-500 mt-1">Manage URL redirects for your store</p>
        </div>
        <Button
          leftIcon={<HiOutlinePlus size={18} />}
          onClick={() => setShowAddForm(!showAddForm)}
          variant={showAddForm ? 'outline' : 'primary'}
        >
          {showAddForm ? 'Cancel' : 'Add Redirect'}
        </Button>
      </div>

      {/* Inline Add Form */}
      {showAddForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Card padding="lg" className="border-primary-200 bg-primary-50/30">
            <h3 className="font-semibold text-dark-900 mb-4">New Redirect</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Input
                label="From Path"
                placeholder="/old-page"
                value={addForm.fromPath}
                onChange={(e) => setAddForm((prev) => ({ ...prev, fromPath: e.target.value }))}
              />
              <Input
                label="To Path"
                placeholder="/new-page"
                value={addForm.toPath}
                onChange={(e) => setAddForm((prev) => ({ ...prev, toPath: e.target.value }))}
              />
              <Select
                label="Type"
                value={addForm.type}
                onChange={(e) => setAddForm((prev) => ({ ...prev, type: e.target.value as '301' | '302' }))}
                options={[
                  { value: '301', label: '301 - Permanent' },
                  { value: '302', label: '302 - Temporary' },
                ]}
              />
              <div className="flex items-end">
                <Button
                  onClick={handleAdd}
                  isLoading={createMutation.isPending}
                  fullWidth
                >
                  Create Redirect
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-beige-50 border-b border-beige-200">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase">From Path</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase">To Path</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase">Type</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase">Active</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase">Hits</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-dark-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-beige-200">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-6 py-4">
                      <div className="h-8 bg-beige-200 rounded animate-pulse"></div>
                    </td>
                  </tr>
                ))
              ) : redirects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-dark-500">
                    No redirects configured
                  </td>
                </tr>
              ) : (
                redirects.map((redirect: any) => {
                  const isEditing = editingId === redirect._id;

                  if (isEditing) {
                    return (
                      <tr key={redirect._id} className="bg-yellow-50/50">
                        <td className="px-6 py-3">
                          <input
                            type="text"
                            value={editForm.fromPath}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, fromPath: e.target.value }))}
                            className="w-full rounded-lg border border-beige-300 bg-white px-3 py-1.5 text-sm text-dark-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                          />
                        </td>
                        <td className="px-6 py-3">
                          <input
                            type="text"
                            value={editForm.toPath}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, toPath: e.target.value }))}
                            className="w-full rounded-lg border border-beige-300 bg-white px-3 py-1.5 text-sm text-dark-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                          />
                        </td>
                        <td className="px-6 py-3">
                          <select
                            value={editForm.type}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, type: e.target.value as '301' | '302' }))}
                            className="rounded-lg border border-beige-300 bg-white px-3 py-1.5 text-sm text-dark-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                          >
                            <option value="301">301</option>
                            <option value="302">302</option>
                          </select>
                        </td>
                        <td className="px-6 py-3">
                          <input
                            type="checkbox"
                            checked={editForm.isActive}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                            className="w-4 h-4 rounded border-beige-400 text-primary-600 focus:ring-primary-500"
                          />
                        </td>
                        <td className="px-6 py-3 text-dark-500 text-sm">
                          {redirect.hitCount || 0}
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={handleUpdate} isLoading={updateMutation.isPending}>
                              <HiOutlineCheck size={18} className="text-green-600" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={cancelEdit}>
                              <HiOutlineX size={18} className="text-dark-400" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <motion.tr
                      key={redirect._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-beige-50"
                    >
                      <td className="px-6 py-4">
                        <p className="font-mono text-sm text-dark-900">{redirect.fromPath}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-mono text-sm text-dark-700">{redirect.toPath}</p>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={redirect.type === '301' || redirect.type === 301 ? 'primary' : 'warning'}>
                          {redirect.type}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() =>
                            toggleActiveMutation.mutate({
                              id: redirect._id,
                              isActive: !redirect.isActive,
                            })
                          }
                          className={cn(
                            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                            redirect.isActive ? 'bg-green-500' : 'bg-beige-300'
                          )}
                        >
                          <span
                            className={cn(
                              'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                              redirect.isActive ? 'translate-x-6' : 'translate-x-1'
                            )}
                          />
                        </button>
                      </td>
                      <td className="px-6 py-4 text-dark-600 text-sm">
                        {redirect.hitCount?.toLocaleString() || '0'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => startEdit(redirect)}>
                            <HiOutlinePencil size={18} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteModal({ isOpen: true, id: redirect._id })}
                            className="text-error-600 hover:bg-error-50"
                          >
                            <HiOutlineTrash size={18} />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
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
        onClose={() => setDeleteModal({ isOpen: false, id: '' })}
        onConfirm={() => deleteMutation.mutate(deleteModal.id)}
        title="Delete Redirect"
        message="Are you sure you want to delete this redirect? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

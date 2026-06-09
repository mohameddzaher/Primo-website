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
  HiOutlineFilter,
} from 'react-icons/hi';
import { Button, Card, Badge, Input, Select, ConfirmModal } from '@/components/ui';
import { adminApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-error';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface KeywordForm {
  keyword: string;
  targetPage: string;
  currentRank: string;
  searchVolume: string;
  difficulty: string;
}

const emptyForm: KeywordForm = {
  keyword: '',
  targetPage: '',
  currentRank: '',
  searchVolume: '',
  difficulty: 'medium',
};

export default function SEOKeywordsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<KeywordForm>({ ...emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<KeywordForm>({ ...emptyForm });
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string }>({
    isOpen: false,
    id: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-seo-keywords', page, difficultyFilter],
    queryFn: () =>
      adminApi.getSEOKeywords({
        page,
        limit: 20,
        difficulty: difficultyFilter !== 'all' ? difficultyFilter : undefined,
      }),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => adminApi.createSEOKeyword(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-seo-keywords'] });
      toast.success('Keyword added');
      setShowAddForm(false);
      setAddForm({ ...emptyForm });
    },
    onError: (error: any) => {
      toast.error(getApiErrorMessage(error, 'Failed to add keyword'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminApi.updateSEOKeyword(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-seo-keywords'] });
      toast.success('Keyword updated');
      setEditingId(null);
    },
    onError: (error: any) => {
      toast.error(getApiErrorMessage(error, 'Failed to update keyword'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteSEOKeyword(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-seo-keywords'] });
      toast.success('Keyword deleted');
      setDeleteModal({ isOpen: false, id: '' });
    },
    onError: (error: any) => {
      toast.error(getApiErrorMessage(error, 'Failed to delete keyword'));
    },
  });

  const keywords = data?.keywords || [];
  const pagination = data?.pagination;

  const getDifficultyVariant = (difficulty: string): 'success' | 'warning' | 'error' | 'default' => {
    switch (difficulty) {
      case 'easy':
        return 'success';
      case 'medium':
        return 'warning';
      case 'hard':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleAdd = () => {
    if (!addForm.keyword) {
      toast.error('Keyword is required');
      return;
    }
    createMutation.mutate({
      keyword: addForm.keyword,
      targetPage: addForm.targetPage || undefined,
      currentRank: addForm.currentRank ? parseInt(addForm.currentRank) : undefined,
      searchVolume: addForm.searchVolume ? parseInt(addForm.searchVolume) : undefined,
      difficulty: addForm.difficulty,
    });
  };

  const startEdit = (kw: any) => {
    setEditingId(kw._id);
    setEditForm({
      keyword: kw.keyword || '',
      targetPage: kw.targetPage || '',
      currentRank: kw.currentRank?.toString() || '',
      searchVolume: kw.searchVolume?.toString() || '',
      difficulty: kw.difficulty || 'medium',
    });
  };

  const handleUpdate = () => {
    if (!editingId) return;
    if (!editForm.keyword) {
      toast.error('Keyword is required');
      return;
    }
    updateMutation.mutate({
      id: editingId,
      data: {
        keyword: editForm.keyword,
        targetPage: editForm.targetPage || undefined,
        currentRank: editForm.currentRank ? parseInt(editForm.currentRank) : undefined,
        searchVolume: editForm.searchVolume ? parseInt(editForm.searchVolume) : undefined,
        difficulty: editForm.difficulty,
      },
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ ...emptyForm });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-dark-900">Keyword Tracking</h1>
          <p className="text-dark-500 mt-1">Track and manage your target keywords</p>
        </div>
        <Button
          leftIcon={<HiOutlinePlus size={18} />}
          onClick={() => setShowAddForm(!showAddForm)}
          variant={showAddForm ? 'outline' : 'primary'}
        >
          {showAddForm ? 'Cancel' : 'Add Keyword'}
        </Button>
      </div>

      {/* Inline Add Form */}
      {showAddForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Card padding="lg" className="border-primary-200 bg-primary-50/30">
            <h3 className="font-semibold text-dark-900 mb-4">New Keyword</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <Input
                label="Keyword"
                placeholder="e.g. organic skincare"
                value={addForm.keyword}
                onChange={(e) => setAddForm((prev) => ({ ...prev, keyword: e.target.value }))}
              />
              <Input
                label="Target Page"
                placeholder="/products/skincare"
                value={addForm.targetPage}
                onChange={(e) => setAddForm((prev) => ({ ...prev, targetPage: e.target.value }))}
              />
              <Input
                label="Current Rank"
                placeholder="e.g. 15"
                type="number"
                value={addForm.currentRank}
                onChange={(e) => setAddForm((prev) => ({ ...prev, currentRank: e.target.value }))}
              />
              <Input
                label="Search Volume"
                placeholder="e.g. 5000"
                type="number"
                value={addForm.searchVolume}
                onChange={(e) => setAddForm((prev) => ({ ...prev, searchVolume: e.target.value }))}
              />
              <Select
                label="Difficulty"
                value={addForm.difficulty}
                onChange={(e) => setAddForm((prev) => ({ ...prev, difficulty: e.target.value }))}
                options={[
                  { value: 'easy', label: 'Easy' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'hard', label: 'Hard' },
                ]}
              />
            </div>
            <div className="mt-4">
              <Button onClick={handleAdd} isLoading={createMutation.isPending}>
                Add Keyword
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Filter */}
      <Card padding="md">
        <div className="flex flex-wrap items-center gap-4">
          <HiOutlineFilter size={18} className="text-dark-400" />
          <Select
            value={difficultyFilter}
            onChange={(e) => {
              setDifficultyFilter(e.target.value);
              setPage(1);
            }}
            className="w-48"
            options={[
              { value: 'all', label: 'All Difficulty' },
              { value: 'easy', label: 'Easy' },
              { value: 'medium', label: 'Medium' },
              { value: 'hard', label: 'Hard' },
            ]}
          />
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-beige-50 border-b border-beige-200">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase">Keyword</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase">Target Page</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase">Current Rank</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase">Search Volume</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase">Difficulty</th>
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
              ) : keywords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-dark-500">
                    No keywords being tracked
                  </td>
                </tr>
              ) : (
                keywords.map((kw: any) => {
                  const isEditing = editingId === kw._id;

                  if (isEditing) {
                    return (
                      <tr key={kw._id} className="bg-yellow-50/50">
                        <td className="px-6 py-3">
                          <input
                            type="text"
                            value={editForm.keyword}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, keyword: e.target.value }))}
                            className="w-full rounded-lg border border-beige-300 bg-white px-3 py-1.5 text-sm text-dark-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                          />
                        </td>
                        <td className="px-6 py-3">
                          <input
                            type="text"
                            value={editForm.targetPage}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, targetPage: e.target.value }))}
                            className="w-full rounded-lg border border-beige-300 bg-white px-3 py-1.5 text-sm text-dark-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                          />
                        </td>
                        <td className="px-6 py-3">
                          <input
                            type="number"
                            value={editForm.currentRank}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, currentRank: e.target.value }))}
                            className="w-20 rounded-lg border border-beige-300 bg-white px-3 py-1.5 text-sm text-dark-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                          />
                        </td>
                        <td className="px-6 py-3">
                          <input
                            type="number"
                            value={editForm.searchVolume}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, searchVolume: e.target.value }))}
                            className="w-24 rounded-lg border border-beige-300 bg-white px-3 py-1.5 text-sm text-dark-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                          />
                        </td>
                        <td className="px-6 py-3">
                          <select
                            value={editForm.difficulty}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, difficulty: e.target.value }))}
                            className="rounded-lg border border-beige-300 bg-white px-3 py-1.5 text-sm text-dark-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                          >
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                          </select>
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
                      key={kw._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-beige-50"
                    >
                      <td className="px-6 py-4">
                        <p className="font-medium text-dark-900">{kw.keyword}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-dark-600 text-sm font-mono">{kw.targetPage || '-'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          'font-semibold text-sm',
                          kw.currentRank && kw.currentRank <= 10 ? 'text-green-600' :
                          kw.currentRank && kw.currentRank <= 30 ? 'text-yellow-600' :
                          'text-dark-600'
                        )}>
                          {kw.currentRank ? `#${kw.currentRank}` : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-dark-600 text-sm">
                        {kw.searchVolume?.toLocaleString() || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={getDifficultyVariant(kw.difficulty)}>
                          {kw.difficulty ? kw.difficulty.charAt(0).toUpperCase() + kw.difficulty.slice(1) : 'N/A'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => startEdit(kw)}>
                            <HiOutlinePencil size={18} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteModal({ isOpen: true, id: kw._id })}
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
        title="Delete Keyword"
        message="Are you sure you want to delete this keyword? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

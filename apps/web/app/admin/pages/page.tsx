'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  HiOutlineDocumentText,
  HiOutlineQuestionMarkCircle,
  HiOutlineTemplate,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlinePlus,
  HiOutlineCheck,
  HiOutlineX,
} from 'react-icons/hi';
import { Button, Input, Textarea, Card, Checkbox, ConfirmModal } from '@/components/ui';
import { adminApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-error';
import toast from 'react-hot-toast';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Policy {
  _id: string;
  slug: string;
  title: string;
  content: string;
  isActive: boolean;
}

interface FAQ {
  _id: string;
  question: string;
  answer: string;
  order: number;
  isActive: boolean;
}

interface FAQFormData {
  question: string;
  answer: string;
  order: number;
  isActive: boolean;
}

// ─── Tab definitions ─────────────────────────────────────────────────────────

const tabs = [
  { id: 'policies', label: 'Policy Pages', icon: HiOutlineDocumentText },
  { id: 'faqs', label: 'FAQs', icon: HiOutlineQuestionMarkCircle },
  { id: 'content', label: 'CMS Content', icon: HiOutlineTemplate },
] as const;

type TabId = (typeof tabs)[number]['id'];

// ─── CMS Content Block Component ────────────────────────────────────────────

function ContentBlock({ contentKey, label }: { contentKey: string; label: string }) {
  const queryClient = useQueryClient();
  const [value, setValue] = useState('');
  const [initialized, setInitialized] = useState(false);

  const { data: contentData, isLoading } = useQuery({
    queryKey: ['admin-content', contentKey],
    queryFn: () => adminApi.getContent(contentKey),
  });

  useEffect(() => {
    if (contentData && !initialized) {
      setValue(contentData?.value || contentData?.content || '');
      setInitialized(true);
    }
  }, [contentData, initialized]);

  const updateMutation = useMutation({
    mutationFn: () => adminApi.updateContent(contentKey, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-content', contentKey] });
      toast.success(`${label} content updated`);
    },
    onError: (error: any) => toast.error(getApiErrorMessage(error, `Failed to update ${label.toLowerCase()} content`)),
  });

  if (isLoading) {
    return (
      <div className="p-6 border border-beige-200 rounded-lg">
        <div className="h-5 w-24 bg-beige-200 rounded animate-pulse mb-4" />
        <div className="h-32 bg-beige-200 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-6 border border-beige-200 rounded-lg space-y-4">
      <h4 className="font-medium text-dark-900">{label}</h4>
      <Textarea
        rows={6}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={`Enter ${label.toLowerCase()} content...`}
      />
      <Button
        size="sm"
        onClick={() => updateMutation.mutate()}
        isLoading={updateMutation.isPending}
      >
        Save {label}
      </Button>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function AdminPagesPage() {
  const [activeTab, setActiveTab] = useState<TabId>('policies');
  const [editingFaqId, setEditingFaqId] = useState<string | null>(null);
  const [showAddFaq, setShowAddFaq] = useState(false);
  const [faqForm, setFaqForm] = useState<FAQFormData>({
    question: '',
    answer: '',
    order: 0,
    isActive: true,
  });
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string; question: string }>({
    isOpen: false,
    id: '',
    question: '',
  });

  const queryClient = useQueryClient();

  // ── Policy Queries ──────────────────────────────────────────────────────

  const { data: policies, isLoading: policiesLoading } = useQuery({
    queryKey: ['admin-policies'],
    queryFn: () => adminApi.getPolicies(),
    enabled: activeTab === 'policies',
  });

  // ── FAQ Queries & Mutations ─────────────────────────────────────────────

  const { data: faqs, isLoading: faqsLoading } = useQuery({
    queryKey: ['admin-faqs'],
    queryFn: () => adminApi.getFaqs(),
    enabled: activeTab === 'faqs',
  });

  const createFaqMutation = useMutation({
    mutationFn: (data: FAQFormData) => adminApi.createFaq(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-faqs'] });
      toast.success('FAQ created');
      resetFaqForm();
      setShowAddFaq(false);
    },
    onError: (error: any) => toast.error(getApiErrorMessage(error, 'Failed to create FAQ')),
  });

  const updateFaqMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FAQFormData }) =>
      adminApi.updateFaq(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-faqs'] });
      toast.success('FAQ updated');
      setEditingFaqId(null);
      resetFaqForm();
    },
    onError: (error: any) => toast.error(getApiErrorMessage(error, 'Failed to update FAQ')),
  });

  const deleteFaqMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteFaq(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-faqs'] });
      toast.success('FAQ deleted');
      setDeleteModal({ isOpen: false, id: '', question: '' });
    },
    onError: (error: any) => toast.error(getApiErrorMessage(error, 'Failed to delete FAQ')),
  });

  // ── Helpers ─────────────────────────────────────────────────────────────

  const resetFaqForm = () => {
    setFaqForm({ question: '', answer: '', order: 0, isActive: true });
  };

  const startEditFaq = (faq: FAQ) => {
    setEditingFaqId(faq._id);
    setFaqForm({
      question: faq.question,
      answer: faq.answer,
      order: faq.order,
      isActive: faq.isActive,
    });
    setShowAddFaq(false);
  };

  const cancelEditFaq = () => {
    setEditingFaqId(null);
    resetFaqForm();
  };

  const startAddFaq = () => {
    setShowAddFaq(true);
    setEditingFaqId(null);
    resetFaqForm();
  };

  const handleSaveFaq = () => {
    if (!faqForm.question.trim() || !faqForm.answer.trim()) {
      toast.error('Question and answer are required');
      return;
    }
    if (editingFaqId) {
      updateFaqMutation.mutate({ id: editingFaqId, data: faqForm });
    } else {
      createFaqMutation.mutate(faqForm);
    }
  };

  const handleDeleteFaq = (id: string, question: string) => {
    setDeleteModal({ isOpen: true, id, question });
  };

  const confirmDeleteFaq = () => {
    deleteFaqMutation.mutate(deleteModal.id);
  };

  const policyList: Policy[] = policies || [];
  const faqList: FAQ[] = (faqs as FAQ[]) || [];

  // ── Inline FAQ Form ─────────────────────────────────────────────────────

  const renderFaqForm = () => (
    <motion.tr
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-beige-50"
    >
      <td className="px-6 py-4" colSpan={4}>
        <div className="space-y-4">
          <Input
            label="Question"
            value={faqForm.question}
            onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
            placeholder="Enter the FAQ question..."
          />
          <Textarea
            label="Answer"
            rows={4}
            value={faqForm.answer}
            onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
            placeholder="Enter the FAQ answer..."
          />
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <div className="w-32">
              <Input
                label="Order"
                type="number"
                value={faqForm.order}
                onChange={(e) => setFaqForm({ ...faqForm, order: Number(e.target.value) })}
              />
            </div>
            <Checkbox
              label="Active"
              checked={faqForm.isActive}
              onChange={(e) => setFaqForm({ ...faqForm, isActive: e.target.checked })}
            />
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Button
              size="sm"
              onClick={handleSaveFaq}
              isLoading={createFaqMutation.isPending || updateFaqMutation.isPending}
              leftIcon={<HiOutlineCheck size={16} />}
            >
              {editingFaqId ? 'Update FAQ' : 'Create FAQ'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={editingFaqId ? cancelEditFaq : () => setShowAddFaq(false)}
              leftIcon={<HiOutlineX size={16} />}
            >
              Cancel
            </Button>
          </div>
        </div>
      </td>
    </motion.tr>
  );

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-dark-900">Pages & Content</h1>
        <p className="text-dark-500 mt-1">Manage policy pages, FAQs, and CMS content blocks</p>
      </div>

      {/* Tabs */}
      <Card padding="none">
        <div className="flex border-b border-beige-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-dark-500 hover:text-dark-900 hover:border-beige-300'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>
      </Card>

      {/* ── Policy Pages Tab ─────────────────────────────────────────────── */}
      {activeTab === 'policies' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-beige-50 border-b border-beige-200">
                  <tr>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase">
                      Title
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase">
                      Slug
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase">
                      Status
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-beige-200">
                  {policiesLoading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i}>
                        <td colSpan={4} className="px-6 py-4">
                          <div className="h-8 bg-beige-200 rounded animate-pulse" />
                        </td>
                      </tr>
                    ))
                  ) : policyList.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-dark-500">
                        No policy pages found
                      </td>
                    </tr>
                  ) : (
                    policyList.map((policy) => (
                      <motion.tr
                        key={policy._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-beige-50"
                      >
                        <td className="px-6 py-4">
                          <p className="font-medium text-dark-900">{policy.title}</p>
                        </td>
                        <td className="px-6 py-4">
                          <code className="text-sm bg-beige-100 text-dark-600 px-2 py-1 rounded">
                            {policy.slug}
                          </code>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              policy.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {policy.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Link href={`/admin/pages/policies/${policy.slug}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              leftIcon={<HiOutlinePencil size={16} />}
                            >
                              Edit
                            </Button>
                          </Link>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      )}

      {/* ── FAQs Tab ─────────────────────────────────────────────────────── */}
      {activeTab === 'faqs' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex justify-end mb-4">
            <Button
              leftIcon={<HiOutlinePlus size={18} />}
              onClick={startAddFaq}
              disabled={showAddFaq}
            >
              Add FAQ
            </Button>
          </div>

          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-beige-50 border-b border-beige-200">
                  <tr>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase">
                      Question
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase">
                      Status
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase">
                      Order
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-beige-200">
                  {/* Add FAQ inline form */}
                  {showAddFaq && !editingFaqId && renderFaqForm()}

                  {faqsLoading ? (
                    [...Array(4)].map((_, i) => (
                      <tr key={i}>
                        <td colSpan={4} className="px-6 py-4">
                          <div className="h-8 bg-beige-200 rounded animate-pulse" />
                        </td>
                      </tr>
                    ))
                  ) : faqList.length === 0 && !showAddFaq ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-dark-500">
                        No FAQs found. Click &quot;Add FAQ&quot; to create one.
                      </td>
                    </tr>
                  ) : (
                    faqList.map((faq) =>
                      editingFaqId === faq._id ? (
                        renderFaqForm()
                      ) : (
                        <motion.tr
                          key={faq._id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="hover:bg-beige-50"
                        >
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium text-dark-900">{faq.question}</p>
                              <p className="text-sm text-dark-500 line-clamp-2 mt-1 max-w-md">
                                {faq.answer}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                faq.isActive
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {faq.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-dark-600">{faq.order}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => startEditFaq(faq)}
                                leftIcon={<HiOutlinePencil size={16} />}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteFaq(faq._id, faq.question)}
                              >
                                <HiOutlineTrash size={16} className="text-red-600" />
                              </Button>
                            </div>
                          </td>
                        </motion.tr>
                      )
                    )
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      )}

      {/* ── CMS Content Tab ──────────────────────────────────────────────── */}
      {activeTab === 'content' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <Card padding="lg">
            <h3 className="text-lg font-semibold text-dark-900 mb-6">Editable Content Blocks</h3>
            <p className="text-dark-500 mb-6">
              Manage content that appears across different sections of the website.
            </p>
            <div className="space-y-6">
              <ContentBlock contentKey="careers" label="Careers" />
              <ContentBlock contentKey="press" label="Press" />
            </div>
          </Card>
        </motion.div>
      )}

      {/* Delete FAQ Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: '', question: '' })}
        onConfirm={confirmDeleteFaq}
        title="Delete FAQ"
        message={`Are you sure you want to delete the FAQ "${deleteModal.question}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        isLoading={deleteFaqMutation.isPending}
      />
    </div>
  );
}

'use client';

import { Fragment, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  HiOutlineSearch,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
} from 'react-icons/hi';
import { Button, Input, Select, Textarea, Card } from '@/components/ui';
import { supportApi, type ContactMessageRecord } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-error';
import toast from 'react-hot-toast';

const typeTabs = [
  { value: '', label: 'All' },
  { value: 'general', label: 'General' },
  { value: 'complaint', label: 'Complaints' },
];

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'new', label: 'New' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-indigo-100 text-indigo-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
};

const priorityColors: Record<string, string> = {
  low: 'bg-beige-200 text-dark-600',
  medium: 'bg-amber-100 text-amber-800',
  high: 'bg-red-100 text-red-800',
};

const categoryLabels: Record<string, string> = {
  delivery: 'Delivery & shipping',
  product_quality: 'Product quality',
  damaged: 'Damaged or missing',
  billing: 'Billing & payment',
  warranty: 'Warranty & repairs',
  staff: 'Staff & service',
  other: 'Other',
};

export default function AdminSupportPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // Draft note per message so typing in one row never leaks into another.
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['admin-support', page, search, type, status],
    queryFn: () => supportApi.getMessages({ page, limit: 20, search, type, status }),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      ...payload
    }: { id: string } & Parameters<typeof supportApi.updateMessage>[1]) =>
      supportApi.updateMessage(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-support'] });
      toast.success('Message updated');
    },
    onError: (error: any) => {
      toast.error(getApiErrorMessage(error, 'Failed to update message'));
    },
  });

  const messages = data?.data || [];
  const pagination = data?.pagination;

  const changeFilter = (fn: () => void) => {
    fn();
    setPage(1);
    setExpandedId(null);
  };

  const toggleExpand = (message: ContactMessageRecord) => {
    setExpandedId((current) => (current === message._id ? null : message._id));
    setNoteDrafts((drafts) =>
      message._id in drafts ? drafts : { ...drafts, [message._id]: message.adminNote || '' }
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-dark-900">Support Inbox</h1>
          <p className="text-dark-500 mt-1">
            Contact enquiries and customer complaints from the storefront
          </p>
        </div>
      </div>

      {/* Type tabs */}
      <div className="flex gap-2">
        {typeTabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => changeFilter(() => setType(tab.value))}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              type === tab.value
                ? 'bg-primary-600 text-white'
                : 'bg-white text-dark-600 hover:bg-beige-100 border border-beige-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <Card padding="md">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by name, email, order number..."
              value={search}
              onChange={(e) => changeFilter(() => setSearch(e.target.value))}
              leftIcon={<HiOutlineSearch size={18} />}
            />
          </div>
          <Select
            options={statusOptions}
            value={status}
            onChange={(e) => changeFilter(() => setStatus(e.target.value))}
            fullWidth={false}
            className="w-full sm:w-48"
          />
        </div>
      </Card>

      {/* Messages Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-beige-50 border-b border-beige-200">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                  Subject
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-beige-200">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-6 py-4">
                      <div className="h-4 bg-beige-200 rounded animate-pulse"></div>
                    </td>
                  </tr>
                ))
              ) : messages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-dark-500">
                    No messages found
                  </td>
                </tr>
              ) : (
                messages.map((message) => (
                  <Fragment key={message._id}>
                    <motion.tr
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-beige-50"
                    >
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => toggleExpand(message)}
                          className="font-medium text-dark-900 hover:text-primary-600 text-left"
                        >
                          {message.subject}
                        </button>
                        <p className="text-xs text-dark-500 mt-1">
                          {message.type === 'complaint'
                            ? `Complaint · ${categoryLabels[message.category || 'other'] || 'Other'}`
                            : 'General enquiry'}
                          {message.orderNumber ? ` · #${message.orderNumber}` : ''}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-dark-900">{message.name}</p>
                        <p className="text-xs text-dark-500">{message.email}</p>
                      </td>
                      <td className="px-6 py-4 text-dark-600">
                        {new Date(message.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            statusColors[message.status] || 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {statusOptions.find((o) => o.value === message.status)?.label ||
                            message.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            priorityColors[message.priority] || 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {priorityOptions.find((o) => o.value === message.priority)?.label ||
                            message.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="sm" onClick={() => toggleExpand(message)}>
                          {expandedId === message._id ? (
                            <HiOutlineChevronUp size={18} />
                          ) : (
                            <HiOutlineChevronDown size={18} />
                          )}
                        </Button>
                      </td>
                    </motion.tr>

                    {expandedId === message._id && (
                      <tr className="bg-beige-50">
                        <td colSpan={6} className="px-6 py-6">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div>
                              <h3 className="text-sm font-semibold text-dark-900 mb-2">Message</h3>
                              <p className="text-sm text-dark-600 whitespace-pre-wrap">
                                {message.message}
                              </p>
                              <dl className="mt-4 space-y-1 text-sm">
                                {message.phone && (
                                  <div className="flex gap-2">
                                    <dt className="text-dark-500">Phone:</dt>
                                    <dd className="text-dark-900">{message.phone}</dd>
                                  </div>
                                )}
                                {message.orderNumber && (
                                  <div className="flex gap-2">
                                    <dt className="text-dark-500">Order:</dt>
                                    <dd className="text-dark-900">{message.orderNumber}</dd>
                                  </div>
                                )}
                                {message.resolvedAt && (
                                  <div className="flex gap-2">
                                    <dt className="text-dark-500">Resolved:</dt>
                                    <dd className="text-dark-900">
                                      {new Date(message.resolvedAt).toLocaleString()}
                                    </dd>
                                  </div>
                                )}
                              </dl>
                            </div>

                            <div className="space-y-4">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Select
                                  label="Status"
                                  options={statusOptions.slice(1)}
                                  value={message.status}
                                  onChange={(e) =>
                                    updateMutation.mutate({
                                      id: message._id,
                                      status: e.target.value as ContactMessageRecord['status'],
                                    })
                                  }
                                />
                                <Select
                                  label="Priority"
                                  options={priorityOptions}
                                  value={message.priority}
                                  onChange={(e) =>
                                    updateMutation.mutate({
                                      id: message._id,
                                      priority: e.target.value as ContactMessageRecord['priority'],
                                    })
                                  }
                                />
                              </div>
                              <Textarea
                                label="Internal note"
                                rows={4}
                                placeholder="Visible to staff only"
                                value={noteDrafts[message._id] ?? message.adminNote ?? ''}
                                onChange={(e) =>
                                  setNoteDrafts((drafts) => ({
                                    ...drafts,
                                    [message._id]: e.target.value,
                                  }))
                                }
                              />
                              <Button
                                size="sm"
                                isLoading={updateMutation.isPending}
                                onClick={() =>
                                  updateMutation.mutate({
                                    id: message._id,
                                    adminNote: noteDrafts[message._id] ?? '',
                                  })
                                }
                              >
                                Save note
                              </Button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-beige-200">
            <p className="text-sm text-dark-500">
              Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, pagination.total)} of{' '}
              {pagination.total} messages
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
    </div>
  );
}

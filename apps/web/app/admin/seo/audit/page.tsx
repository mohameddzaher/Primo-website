'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  HiOutlineRefresh,
  HiOutlineExclamationCircle,
  HiOutlineExclamation,
  HiOutlineDocumentText,
  HiOutlinePhotograph,
  HiOutlineTag,
  HiOutlineArrowRight,
} from 'react-icons/hi';
import { Button, Card, Badge, Skeleton } from '@/components/ui';
import { adminApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface AuditIssue {
  type: string;
  title: string;
  count: number;
  severity: 'error' | 'warning';
  items: {
    _id: string;
    title: string;
    slug?: string;
    path?: string;
    detail?: string;
  }[];
}

const issueConfig: Record<string, { icon: React.ReactNode; label: string; severity: 'error' | 'warning' }> = {
  missing_meta_title: {
    icon: <HiOutlineDocumentText size={20} />,
    label: 'Missing Meta Title',
    severity: 'error',
  },
  missing_meta_description: {
    icon: <HiOutlineDocumentText size={20} />,
    label: 'Missing Meta Description',
    severity: 'error',
  },
  missing_image_alt: {
    icon: <HiOutlinePhotograph size={20} />,
    label: 'Missing Image Alt Text',
    severity: 'error',
  },
  title_too_long: {
    icon: <HiOutlineTag size={20} />,
    label: 'Title Too Long',
    severity: 'warning',
  },
  description_too_long: {
    icon: <HiOutlineTag size={20} />,
    label: 'Description Too Long',
    severity: 'warning',
  },
};

export default function SEOAuditPage() {
  const [runKey, setRunKey] = useState(0);

  const { data: audit, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-seo-audit', runKey],
    queryFn: adminApi.getSEOAudit,
    enabled: runKey > 0,
    staleTime: 0,
  });

  const handleRunAudit = () => {
    setRunKey((prev) => prev + 1);
  };

  // Map backend response: backend returns "products" and "description", normalize to "items" and "title"
  const rawIssues = audit?.issues || [];
  const issues: AuditIssue[] = rawIssues.map((issue: any) => ({
    type: issue.type,
    title: issue.description || issue.title || issue.type,
    count: issue.count,
    severity: issueConfig[issue.type]?.severity || 'warning',
    items: issue.products || issue.items || [],
  }));
  const totalIssues = audit?.totalIssues || issues.reduce((sum: number, i: AuditIssue) => sum + i.count, 0);

  const errorCount = issues.filter((i) => i.severity === 'error').reduce((sum, i) => sum + i.count, 0);

  const warningCount = issues.filter((i) => i.severity === 'warning').reduce((sum, i) => sum + i.count, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-dark-900">SEO Audit</h1>
          <p className="text-dark-500 mt-1">Scan your store for SEO issues and opportunities</p>
        </div>
        <Button
          leftIcon={<HiOutlineRefresh size={18} className={cn(isFetching && 'animate-spin')} />}
          onClick={handleRunAudit}
          isLoading={isFetching}
        >
          {runKey === 0 ? 'Run Audit' : 'Run Again'}
        </Button>
      </div>

      {/* Initial State */}
      {runKey === 0 && !isLoading && (
        <Card padding="lg" className="text-center py-16">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-beige-100 rounded-full flex items-center justify-center">
              <HiOutlineExclamationCircle size={32} className="text-dark-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-dark-900">No Audit Results</h2>
              <p className="text-dark-500 mt-1">
                Click &quot;Run Audit&quot; to scan your store for SEO issues.
              </p>
            </div>
            <Button onClick={handleRunAudit} leftIcon={<HiOutlineRefresh size={18} />}>
              Run Audit
            </Button>
          </div>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          <Skeleton variant="rounded" className="h-24" />
          <div className="grid sm:grid-cols-3 gap-4">
            <Skeleton variant="rounded" className="h-20" />
            <Skeleton variant="rounded" className="h-20" />
            <Skeleton variant="rounded" className="h-20" />
          </div>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" className="h-48" />
          ))}
        </div>
      )}

      {/* Audit Results */}
      {!isLoading && runKey > 0 && audit && (
        <>
          {/* Summary */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="grid sm:grid-cols-3 gap-4">
              <Card padding="md" className="text-center">
                <p className="text-sm text-dark-500">Total Issues</p>
                <p className="text-3xl font-bold text-dark-900 mt-1">{totalIssues}</p>
              </Card>
              <Card padding="md" className={cn('text-center', errorCount > 0 && 'bg-red-50 border-red-200')}>
                <p className="text-sm text-dark-500">Errors</p>
                <p className={cn('text-3xl font-bold mt-1', errorCount > 0 ? 'text-red-600' : 'text-dark-900')}>
                  {errorCount}
                </p>
              </Card>
              <Card padding="md" className={cn('text-center', warningCount > 0 && 'bg-orange-50 border-orange-200')}>
                <p className="text-sm text-dark-500">Warnings</p>
                <p className={cn('text-3xl font-bold mt-1', warningCount > 0 ? 'text-orange-600' : 'text-dark-900')}>
                  {warningCount}
                </p>
              </Card>
            </div>
          </motion.div>

          {/* No Issues */}
          {issues.length === 0 && (
            <Card padding="lg" className="text-center py-12 bg-green-50 border-green-200">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <HiOutlineExclamationCircle size={24} className="text-green-600" />
                </div>
                <h2 className="text-lg font-semibold text-green-800">No Issues Found</h2>
                <p className="text-green-700">Your store&apos;s SEO looks great! No issues were detected.</p>
              </div>
            </Card>
          )}

          {/* Issue Groups */}
          {issues.map((issue, index) => {
            const config = issueConfig[issue.type] || {
              icon: <HiOutlineExclamation size={20} />,
              label: issue.title || issue.type,
              severity: issue.severity,
            };
            const severity = issue.severity;
            const isError = severity === 'error';

            return (
              <motion.div
                key={issue.type}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card padding="none">
                  {/* Issue Header */}
                  <div
                    className={cn(
                      'flex items-center gap-3 px-6 py-4 border-b',
                      isError
                        ? 'bg-red-50 border-red-200'
                        : 'bg-orange-50 border-orange-200'
                    )}
                  >
                    <div
                      className={cn(
                        'p-2 rounded-lg',
                        isError ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                      )}
                    >
                      {config.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-dark-900">{config.label}</h3>
                      <p className="text-sm text-dark-500">{issue.count} affected item{issue.count !== 1 ? 's' : ''}</p>
                    </div>
                    <Badge variant={isError ? 'error' : 'warning'} size="lg">
                      {issue.count}
                    </Badge>
                  </div>

                  {/* Affected Items */}
                  <div className="divide-y divide-beige-200">
                    {(issue.items || []).slice(0, 10).map((item: any) => (
                      <div
                        key={item._id}
                        className="flex items-center justify-between px-6 py-3 hover:bg-beige-50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-dark-900 truncate">
                            {item.title || item.path || 'Unknown'}
                          </p>
                          {item.detail && (
                            <p className="text-xs text-dark-500 truncate">{item.detail}</p>
                          )}
                          {item.slug && (
                            <p className="text-xs text-dark-400 font-mono">/{item.slug}</p>
                          )}
                        </div>
                        {item._id && (
                          <Link
                            href={`/admin/products/${item._id}`}
                            className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium flex-shrink-0 ml-4"
                          >
                            Edit
                            <HiOutlineArrowRight size={14} />
                          </Link>
                        )}
                      </div>
                    ))}
                    {issue.items && issue.items.length > 10 && (
                      <div className="px-6 py-3 text-center">
                        <p className="text-sm text-dark-500">
                          and {issue.items.length - 10} more...
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </>
      )}
    </div>
  );
}

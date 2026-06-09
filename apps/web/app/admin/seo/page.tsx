'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  HiOutlineDocumentText,
  HiOutlineShoppingBag,
  HiOutlineExclamationCircle,
  HiOutlineSwitchHorizontal,
  HiOutlineSearchCircle,
  HiOutlineRefresh,
  HiOutlinePlus,
  HiOutlineArrowRight,
  HiOutlineDatabase,
  HiOutlineShieldCheck,
  HiOutlineCheckCircle,
  HiOutlinePencilAlt,
} from 'react-icons/hi';
import { adminApi } from '@/lib/api';
import { Card, Badge, Skeleton, Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function SEODashboardPage() {
  const queryClient = useQueryClient();
  const [seedResult, setSeedResult] = useState<any>(null);

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['admin-seo-dashboard'],
    queryFn: adminApi.getSEODashboard,
  });

  const seedMutation = useMutation({
    mutationFn: adminApi.seedSEOData,
    onSuccess: (data) => {
      setSeedResult(data);
      queryClient.invalidateQueries({ queryKey: ['admin-seo-dashboard'] });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton variant="rounded" className="h-10 w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} variant="rounded" className="h-28" />
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <Skeleton variant="rounded" className="h-64" />
          <Skeleton variant="rounded" className="h-64" />
        </div>
      </div>
    );
  }

  const stats = dashboard || {};
  const healthScore = dashboard?.seoScore ?? 0;

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthBg = (score: number) => {
    if (score >= 80) return 'bg-green-50 border-green-200';
    if (score >= 60) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const getHealthRingColor = (score: number) => {
    if (score >= 80) return 'stroke-green-500';
    if (score >= 60) return 'stroke-yellow-500';
    return 'stroke-red-500';
  };

  const getHealthLabel = (score: number) => {
    if (score >= 80) return 'Good';
    if (score >= 60) return 'Needs Work';
    return 'Poor';
  };

  // Section cards for navigation
  const sections = [
    {
      title: 'Page SEO',
      description: 'Meta tags, OG data, and structured data for each page',
      href: '/admin/seo/pages',
      icon: HiOutlineDocumentText,
      stat: stats.totalPages || 0,
      statLabel: 'pages configured',
      color: 'bg-blue-50 text-blue-600',
    },
    {
      title: 'Product SEO',
      description: 'Bulk edit meta titles and descriptions for products',
      href: '/admin/seo/products',
      icon: HiOutlineShoppingBag,
      stat: stats.productsWithMeta || 0,
      statLabel: `of ${stats.totalProducts || 0} products`,
      color: 'bg-purple-50 text-purple-600',
      alert: stats.productsMissingMeta > 0 ? `${stats.productsMissingMeta} missing` : undefined,
    },
    {
      title: 'URL Redirects',
      description: 'Manage 301/302 redirects to prevent broken links',
      href: '/admin/seo/redirects',
      icon: HiOutlineSwitchHorizontal,
      stat: stats.activeRedirects || 0,
      statLabel: 'active redirects',
      color: 'bg-orange-50 text-orange-600',
    },
    {
      title: 'Keyword Tracking',
      description: 'Track target keywords, rankings, and search volume',
      href: '/admin/seo/keywords',
      icon: HiOutlineSearchCircle,
      stat: stats.trackedKeywords || 0,
      statLabel: 'keywords tracked',
      color: 'bg-teal-50 text-teal-600',
    },
    {
      title: 'SEO Audit',
      description: 'Scan your store for SEO issues and get recommendations',
      href: '/admin/seo/audit',
      icon: HiOutlineShieldCheck,
      stat: null,
      statLabel: 'Run audit to check',
      color: 'bg-rose-50 text-rose-600',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-semibold text-dark-900">
            SEO Overview
          </h1>
          <p className="mt-1 text-dark-500">
            Monitor and optimize your store&apos;s search engine performance
          </p>
        </div>
      </div>

      {/* Health Score + Key Stats */}
      <div className="grid lg:grid-cols-5 gap-4">
        {/* Health Score Ring */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className={cn('h-full flex flex-col items-center justify-center py-6', getHealthBg(healthScore))}>
            <p className="text-xs font-semibold text-dark-500 uppercase tracking-wider mb-3">Health Score</p>
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" className="text-beige-200" />
                <circle
                  cx="50" cy="50" r="42" fill="none" strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${(healthScore / 100) * 264} 264`}
                  className={getHealthRingColor(healthScore)}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={cn('text-2xl font-bold', getHealthColor(healthScore))}>{healthScore}%</span>
              </div>
            </div>
            <Badge variant={healthScore >= 80 ? 'success' : healthScore >= 60 ? 'warning' : 'error'} className="mt-3">
              {getHealthLabel(healthScore)}
            </Badge>
          </Card>
        </motion.div>

        {/* Stat Cards */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="h-full flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600 flex-shrink-0">
                <HiOutlineDocumentText size={20} />
              </div>
              <p className="text-sm text-dark-500">Pages Configured</p>
            </div>
            <div className="mt-3">
              <p className="text-3xl font-bold text-dark-900">{stats.totalPages?.toLocaleString() || '0'}</p>
            </div>
            <Link href="/admin/seo/pages" className="mt-3 text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
              Manage <HiOutlineArrowRight size={12} />
            </Link>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="h-full flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-50 text-green-600 flex-shrink-0">
                <HiOutlineCheckCircle size={20} />
              </div>
              <p className="text-sm text-dark-500">Products with Meta</p>
            </div>
            <div className="mt-3">
              <p className="text-3xl font-bold text-dark-900">{stats.productsWithMeta?.toLocaleString() || '0'}</p>
              <p className="text-xs text-dark-400 mt-0.5">of {stats.totalProducts || 0} total</p>
            </div>
            <Link href="/admin/seo/products" className="mt-3 text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
              Edit Products <HiOutlineArrowRight size={12} />
            </Link>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className={cn('h-full flex flex-col justify-between', stats.productsMissingMeta > 0 && 'border-red-200')}>
            <div className="flex items-center gap-3">
              <div className={cn('p-2 rounded-lg flex-shrink-0', stats.productsMissingMeta > 0 ? 'bg-red-50 text-red-600' : 'bg-beige-100 text-dark-400')}>
                <HiOutlineExclamationCircle size={20} />
              </div>
              <p className="text-sm text-dark-500">Missing Meta</p>
            </div>
            <div className="mt-3">
              <p className={cn('text-3xl font-bold', stats.productsMissingMeta > 0 ? 'text-red-600' : 'text-dark-900')}>
                {stats.productsMissingMeta?.toLocaleString() || '0'}
              </p>
              <p className="text-xs text-dark-400 mt-0.5">products need attention</p>
            </div>
            <Link href="/admin/seo/products?status=incomplete" className="mt-3 text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
              Fix Now <HiOutlineArrowRight size={12} />
            </Link>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="h-full flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-50 text-orange-600 flex-shrink-0">
                <HiOutlineSwitchHorizontal size={20} />
              </div>
              <p className="text-sm text-dark-500">Active Redirects</p>
            </div>
            <div className="mt-3">
              <p className="text-3xl font-bold text-dark-900">{stats.activeRedirects?.toLocaleString() || '0'}</p>
              <p className="text-xs text-dark-400 mt-0.5">{stats.trackedKeywords || 0} keywords tracked</p>
            </div>
            <Link href="/admin/seo/redirects" className="mt-3 text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
              Manage <HiOutlineArrowRight size={12} />
            </Link>
          </Card>
        </motion.div>
      </div>

      {/* Section Navigation Cards */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <h2 className="text-lg font-semibold text-dark-900 mb-4">SEO Sections</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sections.map((section, i) => (
            <Link key={section.href} href={section.href}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
              >
                <Card className="h-full hover:shadow-soft-lg hover:border-primary-200 transition-all group cursor-pointer">
                  <div className="flex items-start gap-4">
                    <div className={cn('p-3 rounded-xl flex-shrink-0', section.color)}>
                      <section.icon size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-dark-900 group-hover:text-primary-700 transition-colors">
                          {section.title}
                        </h3>
                        <HiOutlineArrowRight size={16} className="text-dark-300 group-hover:text-primary-600 transition-colors flex-shrink-0" />
                      </div>
                      <p className="text-sm text-dark-500 mt-1 line-clamp-2">{section.description}</p>
                      <div className="mt-3 flex items-center gap-2">
                        {section.stat !== null && (
                          <span className="text-lg font-bold text-dark-900">{section.stat}</span>
                        )}
                        <span className="text-xs text-dark-400">{section.statLabel}</span>
                        {section.alert && (
                          <Badge variant="error" size="sm">{section.alert}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Auto-Populate + Quick Actions Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Auto-populate SEO Data */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
          <Card className="h-full border-primary-200 bg-gradient-to-br from-primary-50/50 to-white">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary-100 text-primary-600 flex-shrink-0">
                <HiOutlineDatabase size={22} />
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-dark-900">Auto-Populate SEO Data</h2>
                <p className="mt-1 text-sm text-dark-500">
                  Auto-generate SEO metadata for all pages, products, categories, keywords, and redirects. Safe to run multiple times.
                </p>
                <Button
                  onClick={() => seedMutation.mutate()}
                  isLoading={seedMutation.isPending}
                  size="sm"
                  variant="primary"
                  className="mt-4"
                >
                  {seedMutation.isPending ? 'Generating...' : 'Generate SEO Data'}
                </Button>
                {seedResult && (
                  <div className="mt-4 p-3 bg-white rounded-lg border border-green-200">
                    <p className="text-sm font-medium text-green-700 mb-2 flex items-center gap-1.5">
                      <HiOutlineCheckCircle size={16} />
                      SEO data populated successfully!
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-dark-600">
                      <div><span className="font-semibold">{seedResult.pagesCreated}</span> pages created</div>
                      <div><span className="font-semibold">{seedResult.productsUpdated}</span> products updated</div>
                      <div><span className="font-semibold">{seedResult.keywordsCreated}</span> keywords added</div>
                      <div><span className="font-semibold">{seedResult.redirectsCreated}</span> redirects added</div>
                      <div className="col-span-2"><span className="font-semibold">{seedResult.skipped}</span> skipped (already configured)</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card className="h-full">
            <h2 className="font-semibold text-dark-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link
                href="/admin/seo/audit"
                className="flex items-center gap-3 p-3 bg-beige-50 rounded-lg hover:bg-beige-100 transition-colors group"
              >
                <div className="p-2 rounded-lg bg-rose-100 text-rose-600 group-hover:bg-rose-200 transition-colors">
                  <HiOutlineRefresh size={18} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-dark-900 text-sm">Run SEO Audit</p>
                  <p className="text-xs text-dark-500">Scan for issues and get recommendations</p>
                </div>
                <HiOutlineArrowRight size={14} className="text-dark-400 group-hover:text-dark-600 transition-colors" />
              </Link>

              <Link
                href="/admin/seo/pages/new"
                className="flex items-center gap-3 p-3 bg-beige-50 rounded-lg hover:bg-beige-100 transition-colors group"
              >
                <div className="p-2 rounded-lg bg-blue-100 text-blue-600 group-hover:bg-blue-200 transition-colors">
                  <HiOutlinePlus size={18} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-dark-900 text-sm">Add Page Config</p>
                  <p className="text-xs text-dark-500">Configure SEO for a new page</p>
                </div>
                <HiOutlineArrowRight size={14} className="text-dark-400 group-hover:text-dark-600 transition-colors" />
              </Link>

              <Link
                href="/admin/seo/products"
                className="flex items-center gap-3 p-3 bg-beige-50 rounded-lg hover:bg-beige-100 transition-colors group"
              >
                <div className="p-2 rounded-lg bg-purple-100 text-purple-600 group-hover:bg-purple-200 transition-colors">
                  <HiOutlinePencilAlt size={18} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-dark-900 text-sm">Bulk Edit Products</p>
                  <p className="text-xs text-dark-500">Edit meta tags for multiple products</p>
                </div>
                <HiOutlineArrowRight size={14} className="text-dark-400 group-hover:text-dark-600 transition-colors" />
              </Link>

              <Link
                href="/admin/seo/keywords"
                className="flex items-center gap-3 p-3 bg-beige-50 rounded-lg hover:bg-beige-100 transition-colors group"
              >
                <div className="p-2 rounded-lg bg-teal-100 text-teal-600 group-hover:bg-teal-200 transition-colors">
                  <HiOutlineSearchCircle size={18} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-dark-900 text-sm">Track Keywords</p>
                  <p className="text-xs text-dark-500">Monitor keyword rankings and volume</p>
                </div>
                <HiOutlineArrowRight size={14} className="text-dark-400 group-hover:text-dark-600 transition-colors" />
              </Link>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Coverage Progress Bar */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}>
        <Card>
          <h2 className="font-semibold text-dark-900 mb-4">SEO Coverage</h2>
          <div className="space-y-4">
            {/* Product Meta Coverage */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-dark-600">Product Meta Tags</span>
                <span className="text-sm font-semibold text-dark-900">
                  {stats.productsWithMeta || 0} / {stats.totalProducts || 0}
                </span>
              </div>
              <div className="w-full bg-beige-200 rounded-full h-2.5">
                <div
                  className={cn(
                    'h-2.5 rounded-full transition-all duration-500',
                    healthScore >= 80 ? 'bg-green-500' : healthScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                  )}
                  style={{
                    width: `${stats.totalProducts > 0 ? Math.round(((stats.productsWithMeta || 0) / stats.totalProducts) * 100) : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Page Configs */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-dark-600">Page Configurations</span>
                <span className="text-sm font-semibold text-dark-900">{stats.totalPages || 0} pages</span>
              </div>
              <div className="w-full bg-beige-200 rounded-full h-2.5">
                <div
                  className="h-2.5 rounded-full bg-blue-500 transition-all duration-500"
                  style={{
                    width: `${Math.min(100, ((stats.totalPages || 0) / 15) * 100)}%`,
                  }}
                />
              </div>
              <p className="text-xs text-dark-400 mt-1">Target: ~15 key pages</p>
            </div>

            {/* Redirect Coverage */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-dark-600">URL Redirects</span>
                <span className="text-sm font-semibold text-dark-900">{stats.activeRedirects || 0} active</span>
              </div>
              <div className="w-full bg-beige-200 rounded-full h-2.5">
                <div
                  className="h-2.5 rounded-full bg-orange-500 transition-all duration-500"
                  style={{
                    width: `${Math.min(100, ((stats.activeRedirects || 0) / 10) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

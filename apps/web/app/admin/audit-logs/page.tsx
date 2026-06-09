'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineDocumentSearch,
  HiOutlineFilter,
  HiOutlineRefresh,
  HiOutlineUser,
  HiOutlineClock,
  HiOutlineDesktopComputer,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineShieldCheck,
  HiOutlineLogin,
  HiOutlineLogout,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlinePlus,
  HiOutlineSwitchHorizontal,
  HiOutlineKey,
  HiOutlineCalendar,
  HiOutlineGlobe,
  HiOutlineArrowRight,
} from 'react-icons/hi';
import { Card, Button, Badge } from '@/components/ui';
import { adminApi } from '@/lib/api';

// ===== CONSTANTS =====

const RESOURCE_OPTIONS = [
  { value: '', label: 'All Resources' },
  { value: 'staff', label: 'Staff' },
  { value: 'settings', label: 'Settings' },
  { value: 'order', label: 'Orders' },
  { value: 'auth', label: 'Authentication' },
  { value: 'user', label: 'Users' },
  { value: 'product', label: 'Products' },
  { value: 'category', label: 'Categories' },
  { value: 'banner', label: 'Banners' },
  { value: 'review', label: 'Reviews' },
];

const ACTION_OPTIONS = [
  { value: '', label: 'All Actions' },
  { value: 'create', label: 'Create' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
  { value: 'login', label: 'Login' },
  { value: 'logout', label: 'Logout' },
  { value: 'status_change', label: 'Status Change' },
  { value: 'permission_change', label: 'Permission Change' },
];

const RESOURCE_LABELS: Record<string, string> = {
  staff: 'Staff Member',
  settings: 'Settings',
  order: 'Order',
  auth: 'Authentication',
  user: 'User Account',
  product: 'Product',
  category: 'Category',
  banner: 'Banner',
  review: 'Review',
};

const ACTION_CONFIG: Record<string, { color: string; icon: any; label: string; bgClass: string; textClass: string }> = {
  create: { color: 'success', icon: HiOutlinePlus, label: 'Created', bgClass: 'bg-green-50', textClass: 'text-green-700' },
  update: { color: 'warning', icon: HiOutlinePencil, label: 'Updated', bgClass: 'bg-amber-50', textClass: 'text-amber-700' },
  delete: { color: 'error', icon: HiOutlineTrash, label: 'Deleted', bgClass: 'bg-red-50', textClass: 'text-red-700' },
  login: { color: 'info', icon: HiOutlineLogin, label: 'Logged In', bgClass: 'bg-blue-50', textClass: 'text-blue-700' },
  logout: { color: 'default', icon: HiOutlineLogout, label: 'Logged Out', bgClass: 'bg-gray-50', textClass: 'text-gray-600' },
  status_change: { color: 'warning', icon: HiOutlineSwitchHorizontal, label: 'Status Changed', bgClass: 'bg-purple-50', textClass: 'text-purple-700' },
  permission_change: { color: 'info', icon: HiOutlineKey, label: 'Permissions Changed', bgClass: 'bg-indigo-50', textClass: 'text-indigo-700' },
};

// ===== HELPER FUNCTIONS =====

const formatDateTime = (date: string) => {
  const d = new Date(date);
  return {
    date: d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
    time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    relative: getRelativeTime(d),
  };
};

const getRelativeTime = (date: Date) => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return '';
};

const parseBrowser = (userAgent?: string): string => {
  if (!userAgent) return '';
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
  if (userAgent.includes('Edg')) return 'Edge';
  if (userAgent.includes('Opera') || userAgent.includes('OPR')) return 'Opera';
  return 'Browser';
};

const parseOS = (userAgent?: string): string => {
  if (!userAgent) return '';
  if (userAgent.includes('Mac OS')) return 'macOS';
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS';
  return '';
};

/** Generate a human-readable description for a log entry */
const getActionDescription = (log: any): string => {
  const resource = RESOURCE_LABELS[log.resource] || log.resource;
  const userName = log.userId ? `${log.userId.firstName || ''} ${log.userId.lastName || ''}`.trim() : 'Unknown user';

  switch (log.action) {
    case 'create': {
      const name = log.newValue?.title || log.newValue?.name || log.newValue?.email || log.newValue?.firstName || '';
      return `${userName} created a new ${resource.toLowerCase()}${name ? `: "${name}"` : ''}`;
    }
    case 'update': {
      const fields = log.newValue ? Object.keys(log.newValue).filter(k => k !== 'title' && k !== 'name') : [];
      const name = log.newValue?.title || log.newValue?.name || log.oldValue?.title || log.oldValue?.name || '';
      if (log.newValue?.passwordReset) return `${userName} reset their password`;
      if (log.newValue?.passwordChanged) return `${userName} changed their password`;
      if (log.resource === 'settings') return `${userName} updated system settings`;
      if (fields.length === 0) return `${userName} updated ${resource.toLowerCase()}${name ? ` "${name}"` : ''}`;
      return `${userName} updated ${resource.toLowerCase()}${name ? ` "${name}"` : ''} — ${fields.join(', ')}`;
    }
    case 'delete': {
      const name = log.oldValue?.title || log.oldValue?.name || log.oldValue?.email || '';
      return `${userName} deleted ${resource.toLowerCase()}${name ? ` "${name}"` : ''}`;
    }
    case 'login':
      return `${userName} logged into the system`;
    case 'logout':
      return `${userName} logged out of the system`;
    case 'status_change': {
      const oldStatus = log.oldValue?.status || 'unknown';
      const newStatus = log.newValue?.status || 'unknown';
      return `${userName} changed ${resource.toLowerCase()} status from "${oldStatus}" to "${newStatus}"`;
    }
    case 'permission_change':
      return `${userName} changed permissions for ${resource.toLowerCase()}`;
    default:
      return `${userName} performed ${log.action} on ${resource.toLowerCase()}`;
  }
};

// ===== COMPONENTS =====

function ChangesDiff({ oldValue, newValue }: { oldValue?: Record<string, any>; newValue?: Record<string, any> }) {
  if (!oldValue && !newValue) return <span className="text-dark-400 text-sm">No details recorded</span>;

  // Collect all keys from both objects
  const allKeys = new Set([
    ...Object.keys(oldValue || {}),
    ...Object.keys(newValue || {}),
  ]);

  // Filter out meta keys
  const skipKeys = new Set(['title', 'name']);

  const changes: { key: string; old: any; new: any; type: 'added' | 'removed' | 'changed' | 'unchanged' }[] = [];

  allKeys.forEach((key) => {
    if (skipKeys.has(key)) return;
    const oldVal = oldValue?.[key];
    const newVal = newValue?.[key];

    if (oldVal === undefined && newVal !== undefined) {
      changes.push({ key, old: oldVal, new: newVal, type: 'added' });
    } else if (oldVal !== undefined && newVal === undefined) {
      changes.push({ key, old: oldVal, new: newVal, type: 'removed' });
    } else if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changes.push({ key, old: oldVal, new: newVal, type: 'changed' });
    }
  });

  if (changes.length === 0) {
    // Show newValue if only newValue exists (e.g., create actions)
    if (newValue && Object.keys(newValue).length > 0) {
      return (
        <div className="space-y-1.5">
          {Object.entries(newValue).map(([key, val]) => (
            <div key={key} className="flex items-start gap-2 text-sm">
              <span className="text-dark-500 font-medium min-w-[100px]">{formatKey(key)}:</span>
              <span className="text-dark-700">{formatValue(val)}</span>
            </div>
          ))}
        </div>
      );
    }
    return <span className="text-dark-400 text-sm">No changes detected</span>;
  }

  return (
    <div className="space-y-2">
      {changes.map(({ key, old: oldVal, new: newVal, type }) => (
        <div key={key} className="text-sm">
          <span className="font-medium text-dark-600">{formatKey(key)}</span>
          {type === 'added' && (
            <div className="ml-2 mt-0.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs">
                <HiOutlinePlus size={10} />
                {formatValue(newVal)}
              </span>
            </div>
          )}
          {type === 'removed' && (
            <div className="ml-2 mt-0.5">
              <span className="inline-flex items-center px-2 py-0.5 bg-red-50 text-red-700 rounded text-xs line-through">
                {formatValue(oldVal)}
              </span>
            </div>
          )}
          {type === 'changed' && (
            <div className="ml-2 mt-0.5 flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center px-2 py-0.5 bg-red-50 text-red-600 rounded text-xs">
                {formatValue(oldVal)}
              </span>
              <HiOutlineArrowRight size={12} className="text-dark-400 flex-shrink-0" />
              <span className="inline-flex items-center px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs">
                {formatValue(newVal)}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function formatKey(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

function formatValue(val: any): string {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

function LogRow({ log, isExpanded, onToggle }: { log: any; isExpanded: boolean; onToggle: () => void }) {
  const actionCfg = ACTION_CONFIG[log.action] || ACTION_CONFIG.update;
  const ActionIcon = actionCfg.icon;
  const dt = formatDateTime(log.createdAt);
  const description = getActionDescription(log);
  const browser = parseBrowser(log.userAgent);
  const os = parseOS(log.userAgent);
  const hasDetails = log.oldValue || log.newValue;

  return (
    <>
      <motion.tr
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`group cursor-pointer transition-colors ${isExpanded ? 'bg-beige-50' : 'hover:bg-beige-50/50'}`}
        onClick={onToggle}
      >
        {/* User */}
        <td className="px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
              {log.userId?.avatar ? (
                <img src={log.userId.avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
              ) : (
                <HiOutlineUser className="text-primary-600" size={16} />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-dark-900 truncate">
                {log.userId?.firstName} {log.userId?.lastName}
              </p>
              <p className="text-xs text-dark-400 truncate">{log.userId?.email || 'Deleted user'}</p>
            </div>
          </div>
        </td>

        {/* Action + Description */}
        <td className="px-5 py-4">
          <div className="flex items-start gap-2.5">
            <div className={`w-7 h-7 rounded-lg ${actionCfg.bgClass} flex items-center justify-center flex-shrink-0 mt-0.5`}>
              <ActionIcon className={actionCfg.textClass} size={14} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <Badge variant={actionCfg.color as any} size="sm">
                  {actionCfg.label}
                </Badge>
                <span className="text-xs text-dark-400 capitalize">{RESOURCE_LABELS[log.resource] || log.resource}</span>
              </div>
              <p className="text-sm text-dark-600 leading-snug">{description}</p>
            </div>
          </div>
        </td>

        {/* Date & Time */}
        <td className="px-5 py-4">
          <div className="text-right">
            <div className="flex items-center justify-end gap-1.5 text-sm text-dark-700">
              <HiOutlineClock size={14} className="text-dark-400" />
              {dt.time}
            </div>
            <p className="text-xs text-dark-400 mt-0.5">{dt.date}</p>
            {dt.relative && (
              <p className="text-xs text-primary-500 mt-0.5">{dt.relative}</p>
            )}
          </div>
        </td>

        {/* Expand arrow */}
        <td className="px-3 py-4 w-10">
          {hasDetails ? (
            <div className="text-dark-400 group-hover:text-dark-600 transition-colors">
              {isExpanded ? <HiOutlineChevronUp size={16} /> : <HiOutlineChevronDown size={16} />}
            </div>
          ) : (
            <div className="w-4" />
          )}
        </td>
      </motion.tr>

      {/* Expanded details */}
      <AnimatePresence>
        {isExpanded && hasDetails && (
          <motion.tr
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <td colSpan={4} className="px-5 pb-4 pt-0">
              <div className="ml-12 p-4 bg-white border border-beige-200 rounded-xl shadow-sm space-y-4">
                {/* Changes */}
                <div>
                  <h4 className="text-xs font-semibold text-dark-500 uppercase tracking-wider mb-2">Changes</h4>
                  <ChangesDiff oldValue={log.oldValue} newValue={log.newValue} />
                </div>

                {/* Meta info */}
                <div className="flex flex-wrap gap-x-6 gap-y-2 pt-3 border-t border-beige-100">
                  {log.resourceId && (
                    <div className="text-xs text-dark-400">
                      <span className="font-medium">Resource ID:</span>{' '}
                      <code className="bg-beige-100 px-1.5 py-0.5 rounded text-dark-600 font-mono">{log.resourceId}</code>
                    </div>
                  )}
                  {log.ipAddress && (
                    <div className="flex items-center gap-1 text-xs text-dark-400">
                      <HiOutlineGlobe size={12} />
                      <span className="font-medium">IP:</span> {log.ipAddress}
                    </div>
                  )}
                  {browser && (
                    <div className="flex items-center gap-1 text-xs text-dark-400">
                      <HiOutlineDesktopComputer size={12} />
                      {browser}{os ? ` on ${os}` : ''}
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-xs text-dark-400">
                    <HiOutlineCalendar size={12} />
                    {new Date(log.createdAt).toLocaleString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            </td>
          </motion.tr>
        )}
      </AnimatePresence>
    </>
  );
}

// ===== MAIN PAGE =====

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [resource, setResource] = useState('');
  const [action, setAction] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['audit-logs', page, resource, action, startDate, endDate],
    queryFn: () => adminApi.getAuditLogs({
      page,
      limit: 25,
      resource: resource || undefined,
      action: action || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    }),
  });

  const logs = data?.logs || [];
  const pagination = data?.pagination;
  const hasFilters = resource || action || startDate || endDate;

  const clearFilters = () => {
    setResource('');
    setAction('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
            <HiOutlineShieldCheck className="text-primary-600" size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-dark-900">Audit Logs</h1>
            <p className="text-dark-500 mt-0.5 text-sm">
              Track all system activities and changes
              {pagination && <span className="text-dark-400"> — {pagination.total.toLocaleString()} total entries</span>}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          leftIcon={<HiOutlineRefresh size={18} />}
          onClick={() => refetch()}
        >
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card padding="md">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <HiOutlineFilter className="text-dark-400" size={18} />
              <span className="text-sm font-medium text-dark-600">Filters:</span>
            </div>

            <select
              value={resource}
              onChange={(e) => { setResource(e.target.value); setPage(1); }}
              title="Filter by resource"
              className="px-3 py-2 border border-beige-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
            >
              {RESOURCE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <select
              value={action}
              onChange={(e) => { setAction(e.target.value); setPage(1); }}
              title="Filter by action"
              className="px-3 py-2 border border-beige-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
            >
              {ACTION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <div className="flex items-center gap-2">
              <label htmlFor="audit-start-date" className="text-xs text-dark-400">From:</label>
              <input
                id="audit-start-date"
                type="date"
                value={startDate}
                title="Start date"
                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                className="px-3 py-2 border border-beige-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="audit-end-date" className="text-xs text-dark-400">To:</label>
              <input
                id="audit-end-date"
                type="date"
                value={endDate}
                title="End date"
                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                className="px-3 py-2 border border-beige-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
              />
            </div>

            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear All
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Logs Table */}
      <Card padding="none">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-9 h-9 rounded-full bg-beige-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-beige-200 rounded w-1/3" />
                  <div className="h-3 bg-beige-100 rounded w-2/3" />
                </div>
                <div className="h-4 bg-beige-100 rounded w-20" />
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16">
            <HiOutlineDocumentSearch className="mx-auto text-beige-300" size={56} />
            <p className="mt-4 text-dark-500 font-medium">No audit logs found</p>
            <p className="text-sm text-dark-400 mt-1">
              {hasFilters ? 'Try adjusting your filters' : 'System activities will appear here as they happen'}
            </p>
            {hasFilters && (
              <Button variant="outline" size="sm" className="mt-4" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-beige-50/80 border-b border-beige-200">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-dark-500 uppercase tracking-wider w-[220px]">User</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-dark-500 uppercase tracking-wider">Activity</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-dark-500 uppercase tracking-wider w-[160px]">Date & Time</th>
                  <th className="w-10 px-3 py-3"><span className="sr-only">Details</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-beige-100">
                {logs.map((log: any) => (
                  <LogRow
                    key={log._id}
                    log={log}
                    isExpanded={expandedId === log._id}
                    onToggle={() => setExpandedId(expandedId === log._id ? null : log._id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-beige-200 bg-beige-50/40">
            <p className="text-sm text-dark-500">
              Page <span className="font-medium text-dark-700">{page}</span> of{' '}
              <span className="font-medium text-dark-700">{pagination.totalPages}</span>
              <span className="text-dark-400 ml-2">({pagination.total.toLocaleString()} total)</span>
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(1)}
              >
                First
              </Button>
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
              <Button
                variant="outline"
                size="sm"
                disabled={page === pagination.totalPages}
                onClick={() => setPage(pagination.totalPages)}
              >
                Last
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

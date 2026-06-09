'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineBell,
  HiOutlineCheckCircle,
  HiOutlineTrash,
  HiOutlineShoppingBag,
  HiOutlineStar,
  HiOutlineExclamation,
  HiOutlineSpeakerphone,
  HiOutlineCog,
} from 'react-icons/hi';
import { notificationsApi } from '@/lib/api';
import { cn } from '@/lib/utils';

const typeIcons: Record<string, React.ReactNode> = {
  order_new: <HiOutlineShoppingBag size={16} />,
  order_status: <HiOutlineShoppingBag size={16} />,
  review_new: <HiOutlineStar size={16} />,
  stock_low: <HiOutlineExclamation size={16} />,
  promo: <HiOutlineSpeakerphone size={16} />,
  system: <HiOutlineCog size={16} />,
};

const typeColors: Record<string, string> = {
  order_new: 'bg-blue-100 text-blue-600',
  order_status: 'bg-blue-100 text-blue-600',
  review_new: 'bg-yellow-100 text-yellow-600',
  stock_low: 'bg-red-100 text-red-600',
  promo: 'bg-purple-100 text-purple-600',
  system: 'bg-gray-100 text-gray-600',
};

function timeAgo(date: string) {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return past.toLocaleDateString();
}

// Get the navigation URL for a notification based on its type and data
function getNotificationUrl(notif: any): string | null {
  const data = notif.data || {};
  switch (notif.type) {
    case 'order_new':
      return data.orderId
        ? `/admin/orders/${data.orderId}`
        : data.orderNumber
          ? `/admin/orders/${data.orderNumber}`
          : '/admin/orders';
    case 'order_status':
      return data.orderId
        ? `/account/orders/${data.orderId}`
        : data.orderNumber
          ? `/account/orders/${data.orderNumber}`
          : '/account/orders';
    case 'review_new':
      return '/admin/reviews';
    case 'stock_low':
      return '/admin/inventory';
    case 'promo':
      return '/admin/offers';
    case 'system':
      return '/admin';
    default:
      return null;
  }
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const router = useRouter();

  // Fetch notifications
  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getAll({ limit: 20 }),
    refetchInterval: 30000, // Poll every 30 seconds
  });

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  // Mark single as read
  const markReadMutation = useMutation({
    mutationFn: notificationsApi.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mark all as read
  const markAllReadMutation = useMutation({
    mutationFn: notificationsApi.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Delete notification
  const deleteMutation = useMutation({
    mutationFn: notificationsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Handle clicking a notification - mark as read and navigate
  const handleNotificationClick = (notif: any) => {
    // Mark as read if unread
    if (!notif.isRead) {
      markReadMutation.mutate(notif._id);
    }

    // Navigate to the relevant page
    const url = getNotificationUrl(notif);
    if (url) {
      setIsOpen(false);
      router.push(url);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-dark-600 hover:text-dark-900 transition-colors"
        title="Notifications"
        aria-label="Notifications"
      >
        <HiOutlineBell size={22} />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold text-white bg-error-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-lg border border-beige-200 overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-beige-200">
              <h3 className="font-semibold text-dark-900 text-sm">
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold bg-error-100 text-error-600 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </h3>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllReadMutation.mutate()}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                  disabled={markAllReadMutation.isPending}
                >
                  <HiOutlineCheckCircle size={14} />
                  Mark all read
                </button>
              )}
            </div>

            {/* Notification List */}
            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-12 text-center">
                  <HiOutlineBell size={32} className="mx-auto text-dark-300 mb-2" />
                  <p className="text-sm text-dark-500">No notifications yet</p>
                </div>
              ) : (
                notifications.map((notif: any) => (
                  <div
                    key={notif._id}
                    onClick={() => handleNotificationClick(notif)}
                    className={cn(
                      'flex items-start gap-3 px-4 py-3 border-b border-beige-100 hover:bg-beige-50 transition-colors group cursor-pointer',
                      !notif.isRead && 'bg-primary-50/30'
                    )}
                  >
                    {/* Icon */}
                    <div className={cn('p-1.5 rounded-lg mt-0.5 shrink-0', typeColors[notif.type] || typeColors.system)}>
                      {typeIcons[notif.type] || typeIcons.system}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn('text-sm text-dark-900', !notif.isRead && 'font-medium')}>
                          {notif.title}
                        </p>
                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-primary-500 shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs text-dark-500 mt-0.5 line-clamp-2">
                        {notif.message}
                      </p>
                      <p className="text-[11px] text-dark-400 mt-1">
                        {timeAgo(notif.createdAt)}
                      </p>
                    </div>

                    {/* Delete button - visible on hover */}
                    <div className="flex items-center shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMutation.mutate(notif._id);
                        }}
                        className="p-1 text-dark-400 hover:text-red-600 rounded"
                        title="Delete"
                      >
                        <HiOutlineTrash size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

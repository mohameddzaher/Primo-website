'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineHome,
  HiOutlineShoppingBag,
  HiOutlineCollection,
  HiOutlineTag,
  HiOutlineClipboardList,
  HiOutlineRefresh,
  HiOutlineUsers,
  HiOutlineStar,
  HiOutlineSpeakerphone,
  HiOutlinePhotograph,
  HiOutlineCog,
  HiOutlineChartBar,
  HiOutlineDocumentText,
  HiOutlineLogout,
  HiOutlineMenu,
  HiOutlineX,
  HiChevronLeft,
  HiChevronRight,
  HiOutlineChatAlt2,
  HiOutlineInbox,
  HiOutlineLibrary,
  HiOutlineCube,
  HiOutlineCalculator,
  HiOutlineGlobe,
  HiOutlineTemplate,
} from 'react-icons/hi';
import { useAuthStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Button, Spinner } from '@/components/ui';
import NotificationBell from '@/components/admin/NotificationBell';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: HiOutlineHome },
  { name: 'Orders', href: '/admin/orders', icon: HiOutlineClipboardList },
  { name: 'Returns', href: '/admin/returns', icon: HiOutlineRefresh },
  { name: 'Products', href: '/admin/products', icon: HiOutlineShoppingBag },
  { name: 'Categories', href: '/admin/categories', icon: HiOutlineCollection },
  { name: 'Brands', href: '/admin/brands', icon: HiOutlineLibrary },
  { name: 'Customers', href: '/admin/customers', icon: HiOutlineUsers },
  { name: 'Reviews', href: '/admin/reviews', icon: HiOutlineStar },
  { name: 'Support', href: '/admin/support', icon: HiOutlineInbox },
];

const operationsNav = [
  { name: 'Inventory', href: '/admin/inventory', icon: HiOutlineCube },
  { name: 'Accounting', href: '/admin/accounting', icon: HiOutlineCalculator },
  { name: 'SEO', href: '/admin/seo', icon: HiOutlineGlobe },
];

const marketingNav = [
  { name: 'Homepage', href: '/admin/homepage', icon: HiOutlineTemplate },
  { name: 'Offers', href: '/admin/offers', icon: HiOutlineTag },
  { name: 'Banners', href: '/admin/banners', icon: HiOutlinePhotograph },
  { name: 'Blog', href: '/admin/blog', icon: HiOutlineDocumentText },
  { name: 'Pages', href: '/admin/pages', icon: HiOutlineSpeakerphone },
  { name: 'Testimonials', href: '/admin/testimonials', icon: HiOutlineChatAlt2 },
];

const superAdminNav = [
  { name: 'Staff', href: '/admin/staff', icon: HiOutlineUsers },
  { name: 'Analytics', href: '/admin/analytics', icon: HiOutlineChartBar },
  { name: 'Audit Logs', href: '/admin/audit-logs', icon: HiOutlineDocumentText },
  { name: 'Settings', href: '/admin/settings', icon: HiOutlineCog },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    } else if (!isLoading && user && !['admin', 'super_admin', 'staff'].includes(user.role)) {
      router.push('/');
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated || !user || !['admin', 'super_admin', 'staff'].includes(user.role)) {
    return null;
  }

  const isSuperAdmin = user?.role === 'super_admin';
  const isStaff = user?.role === 'staff';

  const NavLink = ({ item, collapsed = false }: { item: (typeof navigation)[0]; collapsed?: boolean }) => {
    const isActive = item.href === '/admin'
      ? pathname === '/admin'
      : pathname === item.href || pathname.startsWith(item.href + '/');
    return (
      <Link
        href={item.href}
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
          isActive
            ? 'bg-primary-600/15 text-primary-400'
            : 'text-dark-300 hover:bg-dark-800 hover:text-white',
          collapsed && 'justify-center px-2'
        )}
        onClick={() => setSidebarOpen(false)}
        title={collapsed ? item.name : undefined}
      >
        <item.icon size={20} />
        {!collapsed && <span>{item.name}</span>}
      </Link>
    );
  };

  const SidebarContent = ({ collapsed = false }: { collapsed?: boolean }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn(
        "h-16 px-4 flex items-center border-b border-dark-800",
        collapsed && "justify-center px-2"
      )}>
        <Link href="/admin" className="flex items-center gap-2">
          <span className="text-xl font-display font-bold text-primary-500">
            {collapsed ? 'P' : 'PRIMO'}
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className={cn("flex-1 overflow-y-auto scrollbar-dark p-4 space-y-1", collapsed && "p-2")}>
        <div className="space-y-1">
          {navigation.map((item) => (
            <NavLink key={item.name} item={item} collapsed={collapsed} />
          ))}
        </div>

        {!isStaff && (
          <div className="pt-4 mt-4 border-t border-dark-800">
            {!collapsed && (
              <p className="px-3 mb-2 text-xs font-semibold text-dark-400 uppercase tracking-wider">
                Operations
              </p>
            )}
            {operationsNav.map((item) => (
              <NavLink key={item.name} item={item} collapsed={collapsed} />
            ))}
          </div>
        )}

        {!isStaff && (
          <div className="pt-4 mt-4 border-t border-dark-800">
            {!collapsed && (
              <p className="px-3 mb-2 text-xs font-semibold text-dark-400 uppercase tracking-wider">
                Marketing
              </p>
            )}
            {marketingNav.map((item) => (
              <NavLink key={item.name} item={item} collapsed={collapsed} />
            ))}
          </div>
        )}

        {isSuperAdmin && (
          <div className="pt-4 mt-4 border-t border-dark-800">
            {!collapsed && (
              <p className="px-3 mb-2 text-xs font-semibold text-dark-400 uppercase tracking-wider">
                Super Admin
              </p>
            )}
            {superAdminNav.map((item) => (
              <NavLink key={item.name} item={item} collapsed={collapsed} />
            ))}
          </div>
        )}
      </nav>

      {/* User */}
      <div className={cn("p-4 border-t border-dark-800", collapsed && "p-2")}>
        {!collapsed ? (
          <>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-primary-600/20 flex items-center justify-center">
                <span className="text-sm font-semibold text-primary-400">
                  {(user?.name || user?.firstName || 'A').charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.name || user?.firstName || 'Admin'}
                </p>
                <p className="text-xs text-dark-400 capitalize">{user?.role?.replace('_', ' ')}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              fullWidth
              leftIcon={<HiOutlineLogout size={16} />}
              className="text-dark-400 hover:text-white hover:bg-dark-800"
              onClick={() => {
                useAuthStore.getState().logout();
                router.push('/auth/login');
              }}
            >
              Sign Out
            </Button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => {
              useAuthStore.getState().logout();
              router.push('/auth/login');
            }}
            className="w-full flex items-center justify-center p-2 text-dark-400 hover:text-white hover:bg-dark-800 rounded-lg transition-colors"
            title="Sign Out"
          >
            <HiOutlineLogout size={20} />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-beige-50">
      {/* Mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-dark-950/60 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              className="fixed inset-y-0 left-0 w-64 bg-dark-950 shadow-soft-xl z-50 lg:hidden"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 64 : 256 }}
        transition={{ duration: 0.2 }}
        className="hidden lg:fixed lg:top-0 lg:left-0 lg:bottom-0 lg:bg-dark-950 lg:border-r lg:border-dark-800 lg:block lg:z-40"
      >
        <SidebarContent collapsed={isCollapsed} />

        {/* Toggle button - inside sidebar at bottom */}
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "absolute bottom-20 w-8 h-8 bg-dark-800 hover:bg-dark-700 rounded-lg flex items-center justify-center text-white shadow-md transition-all",
            isCollapsed ? "left-1/2 -translate-x-1/2" : "right-4"
          )}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <HiChevronRight size={16} /> : <HiChevronLeft size={16} />}
        </button>
      </motion.aside>

      {/* Main content */}
      <div
        className={cn(
          "min-h-screen transition-[padding-left] duration-200",
          isCollapsed ? "lg:pl-16" : "lg:pl-64"
        )}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-beige-200">
          <div className="flex items-center justify-between h-16 px-4 lg:px-8">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-dark-600 hover:text-dark-900 lg:hidden"
              title="Open menu"
              aria-label="Open menu"
            >
              <HiOutlineMenu size={24} />
            </button>

            <div className="flex items-center gap-4 ml-auto">
              <NotificationBell />
              <Link href="/" target="_blank">
                <Button variant="ghost" size="sm">
                  View Store
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

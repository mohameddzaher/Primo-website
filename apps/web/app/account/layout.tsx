'use client';

import { ReactNode, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  HiOutlineUser,
  HiOutlineShoppingBag,
  HiOutlineShoppingCart,
  HiOutlineHeart,
  HiOutlineLocationMarker,
  HiOutlineUserAdd,
  HiOutlineLockClosed,
  HiOutlineLogout,
  HiOutlineStar,
} from 'react-icons/hi';
import { useAuthStore, useCartStore } from '@/lib/store';
import { authApi, setAccessToken } from '@/lib/api';
import toast from 'react-hot-toast';

const sidebarLinks = [
  { href: '/account/profile', label: 'My Profile', icon: HiOutlineUser },
  { href: '/account/orders', label: 'My Orders', icon: HiOutlineShoppingBag },
  { href: '/account/cart', label: 'My Cart', icon: HiOutlineShoppingCart },
  { href: '/account/wishlist', label: 'Wishlist', icon: HiOutlineHeart },
  { href: '/account/addresses', label: 'Addresses', icon: HiOutlineLocationMarker },
  { href: '/account/points', label: 'My Points', icon: HiOutlineStar },
  { href: '/account/referrals', label: 'Refer & Earn', icon: HiOutlineUserAdd },
  { href: '/account/change-password', label: 'Change Password', icon: HiOutlineLockClosed },
];

export default function AccountLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, setUser } = useAuthStore();
  const { items: cartItems } = useCartStore();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login?redirect=' + pathname);
    }
  }, [user, isLoading, router, pathname]);

  const handleLogout = async () => {
    try {
      await authApi.logout();
      setAccessToken(null);
      setUser(null);
      toast.success('Logged out successfully');
      router.push('/');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-beige-50 py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl shadow-soft p-6"
            >
              {/* User Info */}
              <div className="text-center mb-6 pb-6 border-b border-beige-200">
                <div className="w-20 h-20 mx-auto bg-primary-100 rounded-full flex items-center justify-center mb-3">
                  <span className="text-2xl font-bold text-primary-600">
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <h3 className="font-semibold text-dark-900">{user.name}</h3>
                <p className="text-sm text-dark-500">{user.email}</p>
              </div>

              {/* Navigation */}
              <nav className="space-y-1">
                {sidebarLinks.map((link) => {
                  const isActive = pathname === link.href || (link.href === '/account/cart' && pathname === '/account/cart');
                  const Icon = link.icon;
                  const isCart = link.href === '/account/cart';
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-primary-50 text-primary-600'
                          : 'text-dark-600 hover:bg-beige-50'
                      }`}
                    >
                      <Icon size={20} />
                      <span className="font-medium">{link.label}</span>
                      {isCart && cartItems.length > 0 && (
                        <span className="ml-auto px-1.5 py-0.5 text-xs bg-primary-100 text-primary-600 rounded-full">
                          {cartItems.reduce((acc, item) => acc + item.quantity, 0)}
                        </span>
                      )}
                    </Link>
                  );
                })}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-error-600 hover:bg-error-50 transition-colors"
                >
                  <HiOutlineLogout size={20} />
                  <span className="font-medium">Logout</span>
                </button>
              </nav>
            </motion.div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {children}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

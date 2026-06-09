'use client';

import { useState, useEffect, useRef, Fragment } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Dialog, Transition, Popover } from '@headlessui/react';
import { useQuery } from '@tanstack/react-query';
import {
  HiOutlineShoppingBag,
  HiOutlineHeart,
  HiOutlineUser,
  HiOutlineSearch,
  HiOutlineMenu,
  HiOutlineX,
  HiChevronDown,
  HiViewGrid,
} from 'react-icons/hi';
import { cn } from '@/lib/utils';
import { useAuthStore, useCartStore, useUIStore, useWishlistStore } from '@/lib/store';
import { productsApi, categoriesApi } from '@/lib/api';
import { useSettings } from '@/lib/settings-context';
import { Button } from '@/components/ui';
import { TopCategoryBar } from './TopCategoryBar';
import { AnnouncementBar } from './AnnouncementBar';

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Products', href: '/products' },
  { name: 'Blog', href: '/blog' },
  { name: 'About', href: '/about' },
  { name: 'Contact', href: '/contact' },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { settings } = useSettings();
  const [isScrolled, setIsScrolled] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Categories for mega menu
  const { data: allCategories = [] } = useQuery({
    queryKey: ['categories-megamenu'],
    queryFn: categoriesApi.getAll,
    staleTime: 10 * 60 * 1000,
  });
  const parentCategories = (allCategories as any[]).filter((c: any) => !c.parentId && c.isActive !== false);
  const getSubcategories = (parentId: string) =>
    (allCategories as any[]).filter((c: any) => c.parentId === parentId && c.isActive !== false);

  // Live search suggestions
  const { data: searchResults = [], isFetching: isSearching } = useQuery({
    queryKey: ['search-suggestions', debouncedQuery],
    queryFn: () => productsApi.search(debouncedQuery, 8),
    enabled: debouncedQuery.length >= 2,
    staleTime: 30 * 1000,
  });

  const { user, isAuthenticated } = useAuthStore();
  const { items: cartItems, openCart } = useCartStore();
  const { items: wishlistItems } = useWishlistStore();
  const { isMobileMenuOpen, toggleMobileMenu, closeMobileMenu } = useUIStore();

  const cartItemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    closeMobileMenu();
  }, [pathname, closeMobileMenu]);

  // Debounce search query for autocomplete
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearch(false);
      setSearchQuery('');
      setDebouncedQuery('');
    }
  };

  const handleSuggestionClick = (product: any) => {
    setShowSearch(false);
    setSearchQuery('');
    setDebouncedQuery('');
    router.push(`/products/${product.slug}`);
  };

  const closeSearch = () => {
    setShowSearch(false);
    setSearchQuery('');
    setDebouncedQuery('');
  };

  const showSuggestions = debouncedQuery.length >= 2;

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-40 transition-all duration-300',
          isScrolled
            ? 'bg-white/95 backdrop-blur-md shadow-soft'
            : 'bg-white'
        )}
      >
        {/* Announcement Bar — dynamic, CMS-controlled */}
        <AnnouncementBar />

        {/* Main navbar */}
        <nav className="container-custom h-16">
          <div className="flex items-center justify-between h-full">
            {/* Logo */}
            <Link href="/" className="flex items-center z-10">
              {settings.logo ? (
                <img src={settings.logo} alt={settings.siteName} className="h-10 w-auto" />
              ) : (
                <Image
                  src="/images/logo.png"
                  alt={settings.siteName}
                  width={120}
                  height={46}
                  className="h-10 w-auto"
                  priority
                />
              )}
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {/* All Departments Mega Menu */}
              {parentCategories.length > 0 && (
                <Popover className="relative">
                  {({ open, close }) => (
                    <>
                      <Popover.Button
                        className={cn(
                          'flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none',
                          open
                            ? 'text-primary-600 bg-primary-50'
                            : 'text-dark-700 hover:text-dark-900 hover:bg-beige-100'
                        )}
                      >
                        <HiViewGrid size={16} />
                        All Departments
                        <HiChevronDown
                          size={14}
                          className={cn('transition-transform duration-200', open && 'rotate-180')}
                        />
                      </Popover.Button>

                      {open && <Popover.Overlay className="fixed inset-0 z-30" />}

                      <Transition
                        as={Fragment}
                        enter="transition ease-out duration-200"
                        enterFrom="opacity-0 translate-y-1"
                        enterTo="opacity-100 translate-y-0"
                        leave="transition ease-in duration-150"
                        leaveFrom="opacity-100 translate-y-0"
                        leaveTo="opacity-0 translate-y-1"
                      >
                        <Popover.Panel className="absolute left-0 z-40 mt-2 w-[720px] max-w-[calc(100vw-2rem)]">
                          <div className="overflow-hidden rounded-2xl bg-white shadow-soft-xl ring-1 ring-beige-200">
                            <div className="p-4">
                              <div className="grid grid-cols-3 gap-x-8 gap-y-1">
                                {parentCategories.slice(0, 12).map((cat: any) => {
                                  const subs = getSubcategories(cat._id);
                                  return (
                                    <div key={cat._id} className="py-2 min-w-0">
                                      <Link
                                        href={`/products?category=${cat._id}`}
                                        onClick={() => close()}
                                        className="flex items-center gap-2 text-sm font-semibold text-dark-900 hover:text-primary-600 transition-colors mb-1.5 min-w-0"
                                      >
                                        {cat.icon && <span className="text-base flex-shrink-0">{cat.icon}</span>}
                                        <span className="truncate">{cat.name}</span>
                                      </Link>
                                      {subs.length > 0 && (
                                        <div className="space-y-0.5 pl-1">
                                          {subs.slice(0, 4).map((sub: any) => (
                                            <Link
                                              key={sub._id}
                                              href={`/products?category=${sub._id}`}
                                              onClick={() => close()}
                                              className="block text-xs text-dark-500 hover:text-primary-600 transition-colors py-0.5 truncate"
                                            >
                                              {sub.name}
                                            </Link>
                                          ))}
                                          {subs.length > 4 && (
                                            <Link
                                              href={`/products?category=${cat._id}`}
                                              onClick={() => close()}
                                              className="block text-xs text-primary-600 font-medium hover:text-primary-700 transition-colors py-0.5"
                                            >
                                              +{subs.length - 4} more
                                            </Link>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                            <div className="border-t border-beige-100 px-4 py-2.5 bg-beige-50">
                              <Link
                                href="/products"
                                onClick={() => close()}
                                className="text-xs font-medium text-primary-600 hover:text-primary-700"
                              >
                                View All Products →
                              </Link>
                            </div>
                          </div>
                        </Popover.Panel>
                      </Transition>
                    </>
                  )}
                </Popover>
              )}

              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                    pathname === item.href
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-dark-700 hover:text-dark-900 hover:bg-beige-100'
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <button
                onClick={() => setShowSearch(true)}
                className="p-2 text-dark-600 hover:text-dark-900 transition-colors"
                aria-label="Search"
              >
                <HiOutlineSearch size={22} />
              </button>

              {/* Wishlist */}
              <Link
                href="/account/wishlist"
                className="relative p-2 text-dark-600 hover:text-dark-900 transition-colors hidden sm:flex"
                aria-label="Wishlist"
              >
                <HiOutlineHeart size={22} />
                {wishlistItems.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 text-[10px] font-bold text-white bg-primary-600 rounded-full flex items-center justify-center">
                    {wishlistItems.length}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <button
                onClick={openCart}
                className="relative p-2 text-dark-600 hover:text-dark-900 transition-colors"
                aria-label="Cart"
              >
                <HiOutlineShoppingBag size={22} />
                {cartItemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 text-[10px] font-bold text-white bg-primary-600 rounded-full flex items-center justify-center">
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </span>
                )}
              </button>

              {/* User */}
              {isAuthenticated ? (
                <Popover className="relative">
                  {({ open, close }) => (
                    <>
                      <Popover.Button className="p-2 text-dark-600 hover:text-dark-900 transition-colors focus:outline-none">
                        <HiOutlineUser size={22} />
                      </Popover.Button>

                      {open && <Popover.Overlay className="fixed inset-0 z-30" />}

                      <Transition
                        as={Fragment}
                        enter="transition ease-out duration-200"
                        enterFrom="opacity-0 translate-y-1"
                        enterTo="opacity-100 translate-y-0"
                        leave="transition ease-in duration-150"
                        leaveFrom="opacity-100 translate-y-0"
                        leaveTo="opacity-0 translate-y-1"
                      >
                        <Popover.Panel className="absolute right-0 z-40 mt-3 w-56">
                          <div className="overflow-hidden rounded-xl bg-white shadow-soft-lg ring-1 ring-beige-200">
                            <div className="p-3 border-b border-beige-200">
                              <p className="text-sm font-medium text-dark-900">{user?.name}</p>
                              <p className="text-xs text-dark-500">{user?.email}</p>
                            </div>
                            <div className="p-2">
                              <Link href="/account/profile" onClick={() => close()} className="block px-3 py-2 text-sm text-dark-700 hover:bg-beige-50 rounded-lg">My Profile</Link>
                              <Link href="/account/orders" onClick={() => close()} className="block px-3 py-2 text-sm text-dark-700 hover:bg-beige-50 rounded-lg">My Orders</Link>
                              <button type="button" onClick={() => { close(); openCart(); }} className="block w-full text-left px-3 py-2 text-sm text-dark-700 hover:bg-beige-50 rounded-lg">
                                My Cart
                                {cartItemCount > 0 && (
                                  <span className="ml-2 px-1.5 py-0.5 text-xs bg-primary-100 text-primary-600 rounded-full">{cartItemCount}</span>
                                )}
                              </button>
                              <Link href="/account/wishlist" onClick={() => close()} className="block px-3 py-2 text-sm text-dark-700 hover:bg-beige-50 rounded-lg">
                                Wishlist
                                {wishlistItems.length > 0 && (
                                  <span className="ml-2 px-1.5 py-0.5 text-xs bg-primary-100 text-primary-600 rounded-full">{wishlistItems.length}</span>
                                )}
                              </Link>
                              <Link href="/account/addresses" onClick={() => close()} className="block px-3 py-2 text-sm text-dark-700 hover:bg-beige-50 rounded-lg">Addresses</Link>
                              <Link href="/account/referrals" onClick={() => close()} className="block px-3 py-2 text-sm text-dark-700 hover:bg-beige-50 rounded-lg">Refer & Earn</Link>
                              {['admin', 'super_admin', 'staff'].includes(user?.role || '') && (
                                <Link href="/admin" onClick={() => close()} className="block px-3 py-2 text-sm text-primary-600 font-medium hover:bg-primary-50 rounded-lg">Admin Panel</Link>
                              )}
                            </div>
                            <div className="p-2 border-t border-beige-200">
                              <button
                                onClick={() => { useAuthStore.getState().logout(); window.location.href = '/'; }}
                                className="block w-full text-left px-3 py-2 text-sm text-error-600 hover:bg-error-50 rounded-lg"
                              >
                                Log Out
                              </button>
                            </div>
                          </div>
                        </Popover.Panel>
                      </Transition>
                    </>
                  )}
                </Popover>
              ) : (
                <Link href="/auth/login" className="hidden sm:block">
                  <Button variant="primary" size="sm">Sign In</Button>
                </Link>
              )}

              {/* Mobile menu button */}
              <button
                onClick={toggleMobileMenu}
                className="lg:hidden p-2 text-dark-600 hover:text-dark-900 transition-colors"
                aria-label="Menu"
              >
                {isMobileMenuOpen ? (
                  <HiOutlineX size={24} />
                ) : (
                  <HiOutlineMenu size={24} />
                )}
              </button>
            </div>
          </div>
        </nav>

        {/* Category Bar — slim strip under main nav, fully dynamic */}
        <TopCategoryBar />
      </header>

      {/* Search Modal with Live Autocomplete */}
      <Transition show={showSearch} as={Fragment}>
        <Dialog onClose={closeSearch} className="relative z-50">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-dark-950/60 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-start justify-center p-4 pt-20">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-xl bg-white shadow-soft-xl transition-all">
                  {/* Search Input */}
                  <form onSubmit={handleSearch} className="flex items-center p-4 border-b border-beige-100">
                    <HiOutlineSearch className="text-dark-400 mr-3 flex-shrink-0" size={24} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search for products..."
                      className="flex-1 text-lg outline-none border-none ring-0 focus:outline-none placeholder:text-dark-400 bg-transparent"
                      autoFocus
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => { setSearchQuery(''); setDebouncedQuery(''); }}
                        className="p-1 text-dark-400 hover:text-dark-600 mr-1"
                        aria-label="Clear"
                      >
                        <HiOutlineX size={18} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={closeSearch}
                      className="p-2 text-dark-400 hover:text-dark-600"
                      aria-label="Close search"
                    >
                      <HiOutlineX size={20} />
                    </button>
                  </form>

                  {/* Live Suggestions */}
                  {showSuggestions && (
                    <div className="max-h-[420px] overflow-y-auto">
                      {isSearching && (searchResults as any[]).length === 0 ? (
                        <div className="p-6 text-center text-sm text-dark-400">Searching...</div>
                      ) : (searchResults as any[]).length > 0 ? (
                        <>
                          <div className="px-4 py-2 bg-beige-50 border-b border-beige-100">
                            <span className="text-xs font-medium text-dark-500 uppercase tracking-wider">
                              Suggestions
                            </span>
                          </div>
                          {(searchResults as any[]).map((product: any) => {
                            const finalPrice = product.discount
                              ? Math.round(product.price * (1 - product.discount / 100))
                              : product.price;
                            return (
                              <button
                                key={product._id}
                                type="button"
                                onClick={() => handleSuggestionClick(product)}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-beige-50 transition-colors text-left border-b border-beige-50 last:border-0"
                              >
                                <div className="w-12 h-12 rounded-lg overflow-hidden bg-beige-100 flex-shrink-0 relative">
                                  {product.image ? (
                                    <Image src={product.image} alt={product.title} fill className="object-cover" sizes="48px" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-dark-300">
                                      <HiOutlineSearch size={18} />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-dark-900 line-clamp-1">{product.title}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    {product.category && (
                                      <span className="text-xs text-dark-400">{product.category.name}</span>
                                    )}
                                    {!product.inStock && (
                                      <span className="text-[10px] text-red-500 font-medium">Out of stock</span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <p className="text-sm font-bold text-dark-900">
                                    {finalPrice.toLocaleString()} EGP
                                  </p>
                                  {product.discount > 0 && (
                                    <p className="text-xs text-dark-400 line-through">
                                      {product.price.toLocaleString()} EGP
                                    </p>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                          <div className="px-4 py-3 bg-beige-50 border-t border-beige-100">
                            <button
                              type="button"
                              onClick={handleSearch}
                              className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
                            >
                              View all results for &quot;{searchQuery}&quot; →
                            </button>
                          </div>
                        </>
                      ) : !isSearching ? (
                        <div className="p-6 text-center">
                          <p className="text-sm text-dark-400">No products found for &quot;{debouncedQuery}&quot;</p>
                          <p className="text-xs text-dark-300 mt-1">Try a different search term</p>
                        </div>
                      ) : null}
                    </div>
                  )}

                  {!showSuggestions && (
                    <div className="p-4 text-xs text-dark-400 text-center">
                      Type at least 2 characters to see live suggestions
                    </div>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Mobile Menu */}
      <Transition show={isMobileMenuOpen} as={Fragment}>
        <Dialog onClose={closeMobileMenu} className="relative z-50 lg:hidden">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-dark-950/60 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-x-full"
              enterTo="opacity-100 translate-x-0"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-x-0"
              leaveTo="opacity-0 translate-x-full"
            >
              <Dialog.Panel className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-white shadow-soft-xl flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-beige-200">
                  {settings.logo ? (
                    <img src={settings.logo} alt={settings.siteName} className="h-8 w-auto" />
                  ) : (
                    <Image src="/images/logo.png" alt={settings.siteName} width={100} height={38} className="h-8 w-auto" />
                  )}
                  <button type="button" onClick={closeMobileMenu} className="p-2 text-dark-600 hover:text-dark-900" aria-label="Close menu">
                    <HiOutlineX size={24} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-1">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        'block px-4 py-3 text-sm font-medium rounded-lg',
                        pathname === item.href
                          ? 'text-primary-600 bg-primary-50'
                          : 'text-dark-700 hover:bg-beige-100'
                      )}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>

                <div className="p-4 border-t border-beige-200">
                  {isAuthenticated ? (
                    <div className="space-y-1">
                      <Link href="/account/profile" className="block px-4 py-2.5 text-sm font-medium text-dark-700 hover:bg-beige-100 rounded-lg">My Profile</Link>
                      <Link href="/account/orders" className="block px-4 py-2.5 text-sm font-medium text-dark-700 hover:bg-beige-100 rounded-lg">My Orders</Link>
                      <button type="button" onClick={() => { closeMobileMenu(); openCart(); }} className="block w-full text-left px-4 py-2.5 text-sm font-medium text-dark-700 hover:bg-beige-100 rounded-lg">
                        My Cart
                        {cartItemCount > 0 && (
                          <span className="ml-2 px-1.5 py-0.5 text-xs bg-primary-100 text-primary-600 rounded-full">{cartItemCount}</span>
                        )}
                      </button>
                      <Link href="/account/wishlist" className="block px-4 py-2.5 text-sm font-medium text-dark-700 hover:bg-beige-100 rounded-lg">
                        Wishlist
                        {wishlistItems.length > 0 && (
                          <span className="ml-2 px-1.5 py-0.5 text-xs bg-primary-100 text-primary-600 rounded-full">{wishlistItems.length}</span>
                        )}
                      </Link>
                      <Link href="/account/addresses" className="block px-4 py-2.5 text-sm font-medium text-dark-700 hover:bg-beige-100 rounded-lg">Addresses</Link>
                      <Link href="/account/referrals" className="block px-4 py-2.5 text-sm font-medium text-dark-700 hover:bg-beige-100 rounded-lg">Refer & Earn</Link>
                      {['admin', 'super_admin', 'staff'].includes(user?.role || '') && (
                        <Link href="/admin" onClick={closeMobileMenu} className="block px-4 py-2.5 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg border border-primary-100 mt-1">
                          Admin Panel
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={() => { useAuthStore.getState().logout(); closeMobileMenu(); window.location.href = '/'; }}
                        className="block w-full text-left px-4 py-2.5 text-sm font-medium text-error-600 hover:bg-error-50 rounded-lg mt-2"
                      >
                        Log Out
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Link href="/auth/login" className="block">
                        <Button variant="primary" fullWidth>Sign In</Button>
                      </Link>
                      <Link href="/auth/register" className="block">
                        <Button variant="secondary" fullWidth>Create Account</Button>
                      </Link>
                    </div>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>

      {/* Spacer: top bar (32px desktop) + main nav (64px) + category bar (~40px) */}
      <div className="h-[140px]" />
    </>
  );
}

export default Navbar;

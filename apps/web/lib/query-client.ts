import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      gcTime: 5 * 60 * 1000, // 5 minutes (previously cacheTime)
      retry: 1,
      refetchOnWindowFocus: true, // re-fetch when user switches back from admin
    },
    mutations: {
      retry: 0,
    },
  },
});

// Categories are admin-managed — always treat as stale so they refetch
// on window focus immediately after an admin adds/edits/deletes a category.
queryClient.setQueryDefaults(['categories'], { staleTime: 0 });

// Query keys factory
export const queryKeys = {
  // Auth
  auth: {
    all: ['auth'] as const,
    me: () => [...queryKeys.auth.all, 'me'] as const,
  },

  // Products
  products: {
    all: ['products'] as const,
    lists: () => [...queryKeys.products.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.products.lists(), filters] as const,
    details: () => [...queryKeys.products.all, 'detail'] as const,
    detail: (slug: string) => [...queryKeys.products.details(), slug] as const,
    featured: () => [...queryKeys.products.all, 'featured'] as const,
    brands: () => [...queryKeys.products.all, 'brands'] as const,
    related: (id: string) => [...queryKeys.products.all, 'related', id] as const,
    compare: (ids: string[]) => [...queryKeys.products.all, 'compare', ids] as const,
  },

  // Categories
  categories: {
    all: ['categories'] as const,
    list: () => [...queryKeys.categories.all, 'list'] as const,
    tree: () => [...queryKeys.categories.all, 'tree'] as const,
    detail: (slug: string) => [...queryKeys.categories.all, 'detail', slug] as const,
  },

  // Cart
  cart: {
    all: ['cart'] as const,
    current: () => [...queryKeys.cart.all, 'current'] as const,
  },

  // Orders
  orders: {
    all: ['orders'] as const,
    lists: () => [...queryKeys.orders.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.orders.lists(), filters] as const,
    detail: (id: string) => [...queryKeys.orders.all, 'detail', id] as const,
  },

  // Reviews
  reviews: {
    all: ['reviews'] as const,
    byProduct: (productId: string) => [...queryKeys.reviews.all, 'product', productId] as const,
    pending: () => [...queryKeys.reviews.all, 'pending'] as const,
  },

  // User
  user: {
    all: ['user'] as const,
    profile: () => [...queryKeys.user.all, 'profile'] as const,
    addresses: () => [...queryKeys.user.all, 'addresses'] as const,
    wishlist: () => [...queryKeys.user.all, 'wishlist'] as const,
    recentlyViewed: () => [...queryKeys.user.all, 'recently-viewed'] as const,
  },

  // Offers
  offers: {
    all: ['offers'] as const,
    active: () => [...queryKeys.offers.all, 'active'] as const,
  },

  // Banners
  banners: {
    all: ['banners'] as const,
    active: () => [...queryKeys.banners.all, 'active'] as const,
    byPosition: (position: string) => [...queryKeys.banners.all, 'position', position] as const,
  },

  // Notifications
  notifications: {
    all: ['notifications'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.notifications.all, 'list', filters] as const,
    unreadCount: () => [...queryKeys.notifications.all, 'unread-count'] as const,
  },

  // CMS
  cms: {
    all: ['cms'] as const,
    content: (key: string) => [...queryKeys.cms.all, 'content', key] as const,
    policies: () => [...queryKeys.cms.all, 'policies'] as const,
    faqs: () => [...queryKeys.cms.all, 'faqs'] as const,
  },

  // Blog
  blog: {
    all: ['blog'] as const,
    posts: (filters: Record<string, any>) => [...queryKeys.blog.all, 'posts', filters] as const,
    post: (slug: string) => [...queryKeys.blog.all, 'post', slug] as const,
    categories: () => [...queryKeys.blog.all, 'categories'] as const,
  },

  // Admin
  admin: {
    all: ['admin'] as const,
    dashboard: () => [...queryKeys.admin.all, 'dashboard'] as const,
    analytics: (params: Record<string, any>) => [...queryKeys.admin.all, 'analytics', params] as const,
    users: (filters: Record<string, any>) => [...queryKeys.admin.all, 'users', filters] as const,
    staff: () => [...queryKeys.admin.all, 'staff'] as const,
    orders: (filters: Record<string, any>) => [...queryKeys.admin.all, 'orders', filters] as const,
  },
};

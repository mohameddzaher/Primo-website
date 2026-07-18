import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000, // 2 minutes
      gcTime: 15 * 60 * 1000, // keep data around for back/forward navigation
      retry: 1,
      // Refetching everything on every tab focus caused a request storm (the
      // storefront shell alone issues ~10 queries). Freshness is instead
      // guaranteed by: (a) the API busting its own response cache on every
      // write, and (b) admin mutations invalidating their query keys directly.
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
});

// Reference data that only changes via the admin panel — hold it longer on the
// client. Admin mutations invalidate these keys explicitly, and the API clears
// its own cache on write, so this stays correct without constant refetching.
queryClient.setQueryDefaults(['categories'], { staleTime: 5 * 60 * 1000 });
queryClient.setQueryDefaults(['brands'], { staleTime: 5 * 60 * 1000 });
queryClient.setQueryDefaults(['settings'], { staleTime: 10 * 60 * 1000 });

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

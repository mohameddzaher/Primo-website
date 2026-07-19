import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { ApiResponse } from '@primo/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api/v1';

// Token management
let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // For cookies (refresh token)
});

// Request interceptor - add access token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Don't retry for refresh endpoint itself to prevent infinite loops
    if (originalRequest.url?.includes('/auth/refresh')) {
      return Promise.reject(error);
    }

    // If 401 and not already retried, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue the request while refreshing
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post<ApiResponse<{ accessToken: string }>>(
          `${API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newToken = response.data.data?.accessToken;
        if (newToken) {
          setAccessToken(newToken);
          processQueue(null, newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Refresh failed - clear token
        setAccessToken(null);
        // Don't redirect to login for unauthenticated users browsing public pages
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// API helper functions
export const apiGet = async <T>(url: string, params?: Record<string, any>): Promise<T> => {
  const response = await api.get<ApiResponse<T>>(url, { params });
  return response.data.data as T;
};

export const apiPost = async <T>(url: string, data?: any): Promise<T> => {
  const response = await api.post<ApiResponse<T>>(url, data);
  return response.data.data as T;
};

export const apiPut = async <T>(url: string, data?: any): Promise<T> => {
  const response = await api.put<ApiResponse<T>>(url, data);
  return response.data.data as T;
};

export const apiPatch = async <T>(url: string, data?: any): Promise<T> => {
  const response = await api.patch<ApiResponse<T>>(url, data);
  return response.data.data as T;
};

export const apiDelete = async <T>(url: string): Promise<T> => {
  const response = await api.delete<ApiResponse<T>>(url);
  return response.data.data as T;
};

// API helper for paginated responses (returns both data and pagination)
export const apiGetPaginated = async <T>(url: string, params?: Record<string, any>): Promise<{ data: T; pagination: any }> => {
  const response = await api.get(url, { params });
  return {
    data: response.data.data as T,
    pagination: response.data.pagination,
  };
};

// Specific API modules
export const authApi = {
  register: (data: { email: string; password: string; name: string; phone?: string; referralCode?: string }) => {
    // Split name into firstName and lastName for backend
    const nameParts = data.name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || nameParts[0] || '';

    return apiPost<{ user: any; accessToken: string }>('/auth/register', {
      email: data.email,
      password: data.password,
      firstName,
      lastName,
      phone: data.phone,
      referralCode: data.referralCode,
    });
  },

  login: (data: { email: string; password: string }) =>
    apiPost<{ user: any; accessToken: string }>('/auth/login', data),

  logout: () => apiPost('/auth/logout'),

  refresh: () => apiPost<{ accessToken: string; user: any }>('/auth/refresh'),

  forgotPassword: (email: string) =>
    apiPost('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    apiPost('/auth/reset-password', { token, password }),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiPost('/auth/change-password', { currentPassword, newPassword }),

  getMe: () => apiGet<any>('/auth/me'),

  googleAuth: (token: string) =>
    apiPost<{ user: any; accessToken: string }>('/auth/google', { token }),
};

export const productsApi = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    categoryId?: string;
    brand?: string;
    brands?: string; // Comma-separated brand names
    minPrice?: number;
    maxPrice?: number;
    rating?: number;
    inStock?: boolean;
    onSale?: boolean;
    newArrivals?: boolean;
    featured?: boolean;
    sort?: string;
    search?: string;
  }): Promise<{ products: any[]; pagination: any }> => {
    // Map frontend params to backend expected format
    const mappedParams: Record<string, any> = {
      page: params?.page,
      limit: params?.limit,
      search: params?.search,
      minPrice: params?.minPrice,
      maxPrice: params?.maxPrice,
      inStock: params?.inStock,
      onSale: params?.onSale,
      newArrivals: params?.newArrivals,
      isFeatured: params?.featured,
    };

    // Map category slug/id to appropriate param
    if (params?.categoryId) {
      mappedParams.categoryIds = params.categoryId;
    } else if (params?.category) {
      // Check if the value looks like a MongoDB ObjectId (24 hex chars)
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(params.category);
      if (isObjectId) {
        mappedParams.categoryIds = params.category;
      } else {
        mappedParams.categorySlug = params.category;
      }
    }

    // Map brand/brands to brands (comma-separated for multiple)
    if (params?.brands) {
      mappedParams.brands = params.brands;
    } else if (params?.brand) {
      mappedParams.brands = params.brand;
    }

    // Map rating to minRating
    if (params?.rating) {
      mappedParams.minRating = params.rating;
    }

    // Map sort values from frontend format to backend format
    if (params?.sort) {
      const sortMap: Record<string, string> = {
        '-createdAt': 'newest',
        'price': 'price_asc',
        '-price': 'price_desc',
        '-averageRating': 'rating',
        '-soldCount': 'popularity',
        '-discount': 'discount',
        'title': 'newest', // fallback
        '-title': 'newest', // fallback
      };
      mappedParams.sort = sortMap[params.sort] || params.sort;
    }

    // Remove undefined/null/empty values
    Object.keys(mappedParams).forEach(key => {
      if (mappedParams[key] === undefined || mappedParams[key] === null || mappedParams[key] === '') {
        delete mappedParams[key];
      }
    });

    const response = await api.get<ApiResponse<any[]> & { pagination?: any }>('/products', { params: mappedParams });
    return {
      products: response.data.data || [],
      pagination: response.data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 },
    };
  },

  getBySlug: (slug: string) => apiGet<any>(`/products/slug/${slug}`),

  getById: (id: string) => apiGet<any>(`/products/${id}`),

  getFeatured: () => apiGet<any[]>('/products/featured'),

  getBrands: () => apiGet<string[]>('/products/brands'),

  compare: (ids: string[]) => apiPost<any[]>('/products/compare', { productIds: ids }),

  // Note: Related products are included in getBySlug response - this is kept for backwards compatibility
  getRelated: async (_id: string): Promise<any[]> => [],

  search: (q: string, limit = 8) => apiGet<any[]>('/products/search', { q, limit }),
};

export const categoriesApi = {
  getAll: () => apiGet<any[]>('/categories'),

  getById: (id: string) => apiGet<any>(`/categories/${id}`),

  getBySlug: (slug: string) => apiGet<any>(`/categories/slug/${slug}`),

  getTree: () => apiGet<any[]>('/categories/tree'),
};

export const brandsApi = {
  getAll: (all?: boolean) => apiGet<any[]>('/brands', all ? { all: 'true' } : undefined),

  getById: (id: string) => apiGet<any>(`/brands/${id}`),

  getBySlug: (slug: string) => apiGet<any>(`/brands/slug/${slug}`),

  create: (data: { name: string; description?: string; logo?: string; website?: string; isActive?: boolean }) =>
    apiPost<any>('/brands', data),

  update: (id: string, data: { name?: string; description?: string; logo?: string; website?: string; isActive?: boolean }) =>
    apiPatch<any>(`/brands/${id}`, data),

  delete: (id: string) => apiDelete<any>(`/brands/${id}`),
};

export const cartApi = {
  get: () => apiGet<any>('/cart'),

  // `variantId` is optional — omitted for products without options, which is
  // every existing call site.
  addItem: (productId: string, quantity: number, variantId?: string) =>
    apiPost<any>('/cart/items', { productId, quantity, ...(variantId ? { variantId } : {}) }),

  // `variantId` targets one option's line; without it the server falls back to
  // the single line for that product (products that have no variants).
  updateQuantity: (productId: string, quantity: number, variantId?: string) =>
    apiPatch<any>(`/cart/items/${productId}`, {
      quantity,
      ...(variantId ? { variantId } : {}),
    }),

  removeItem: (productId: string, variantId?: string) =>
    apiDelete<any>(
      `/cart/items/${productId}${variantId ? `?variantId=${encodeURIComponent(variantId)}` : ''}`
    ),

  clear: () => apiDelete<any>('/cart'),

  sync: (items: { productId: string; quantity: number }[]) =>
    apiPost<any>('/cart/sync', { items }),

  applyDiscount: (code: string) =>
    apiPost<any>('/cart/discount', { code }),

  removeDiscount: () =>
    apiDelete<any>('/cart/discount'),
};

export const ordersApi = {
  create: (data: {
    items: { productId: string; quantity: number }[];
    shippingAddress: {
      fullName: string;
      phone: string;
      email: string;
      fullAddress: string;
      city: string;
      area: string;
      building?: string;
      floor?: string;
      apartment?: string;
      landmark?: string;
    };
    paymentMethod: 'cash_on_delivery' | 'card' | 'apple_pay';
    discountCode?: string;
    notes?: string;
  }) => apiPost<any>('/orders', data),

  getAll: async (params?: { page?: number; limit?: number; status?: string }) => {
    const result = await apiGetPaginated<any[]>('/orders/my-orders', params);
    return { orders: result.data, pagination: result.pagination };
  },

  getById: (orderNumber: string) => apiGet<any>(`/orders/my-orders/${encodeURIComponent(orderNumber)}`),

  cancel: (id: string) => apiPost<any>(`/orders/${id}/cancel`),
};

export const reviewsApi = {
  getByProduct: (productId: string, params?: { page?: number; limit?: number }) =>
    apiGet<{ reviews: any[]; stats: any; pagination: any }>(`/reviews/product/${productId}`, params),

  create: (data: { productId: string; orderId: string; rating: number; title?: string; comment: string }) =>
    apiPost<any>('/reviews', data),

  update: (id: string, data: { rating?: number; title?: string; comment?: string }) =>
    apiPatch<any>(`/reviews/${id}`, data),

  delete: (id: string) => apiDelete<any>(`/reviews/${id}`),

  deleteOwn: (id: string) => apiDelete<any>(`/reviews/${id}/mine`),

  markHelpful: (id: string) => apiPost<any>(`/reviews/${id}/helpful`),

  canReview: (productId: string) =>
    apiGet<{ canReview: boolean; orderId?: string; reason?: string }>(`/reviews/can-review/${productId}`),

  getMyReviews: () => apiGet<any[]>('/reviews/my-reviews'),
};

export const userApi = {
  getProfile: () => apiGet<any>('/users/profile'),

  updateProfile: (data: { firstName?: string; lastName?: string; phone?: string; avatar?: string }) =>
    apiPatch<any>('/users/profile', data),

  getAddresses: () => apiGet<any[]>('/users/addresses'),

  addAddress: (data: any) => apiPost<any>('/users/addresses', data),

  updateAddress: (id: string, data: any) =>
    apiPatch<any>(`/users/addresses/${id}`, data),

  deleteAddress: (id: string) => apiDelete<any>(`/users/addresses/${id}`),

  setDefaultAddress: (id: string) =>
    apiPatch<any>(`/users/addresses/${id}/default`),

  getWishlist: () => apiGet<any[]>('/users/wishlist'),

  addToWishlist: (productId: string) =>
    apiPost<any>(`/users/wishlist/${productId}`),

  removeFromWishlist: (productId: string) =>
    apiDelete<any>(`/users/wishlist/${productId}`),

  getRecentlyViewed: () => apiGet<any[]>('/users/recently-viewed'),

  addToRecentlyViewed: (productId: string) =>
    apiPost<any>('/users/recently-viewed', { productId }),
};

export const offersApi = {
  getActive: () => apiGet<any[]>('/offers/active'),

  getFlashDeal: async (): Promise<{ offer: any; products: any[] }> => {
    const res = await api.get<ApiResponse<{ offer: any; products: any[] }>>('/offers/flash-deal');
    return res.data.data || { offer: null, products: [] };
  },

  validateCode: (code: string, subtotal?: number) =>
    apiPost<any>('/offers/validate-code', { code, subtotal }),
};

export const bannersApi = {
  getByPosition: (position: string) =>
    apiGet<any[]>(`/banners/position/${position}`),

  getActive: () => apiGet<any[]>('/banners/active'),
};

export const notificationsApi = {
  getAll: (params?: { limit?: number; offset?: number; unreadOnly?: boolean }) =>
    apiGet<{ notifications: any[]; unreadCount: number; total: number }>('/notifications', params),

  markAsRead: (id: string) => apiPatch<any>(`/notifications/${id}/read`),

  markAllAsRead: () => apiPatch<any>('/notifications/read-all'),

  delete: (id: string) => apiDelete<any>(`/notifications/${id}`),

  getUnreadCount: () => apiGet<{ unreadCount: number }>('/notifications/unread-count'),
};

export const newsletterApi = {
  subscribe: (email: string) =>
    apiPost<any>('/cms/newsletter/subscribe', { email }),

  unsubscribe: (email: string) =>
    apiPost<any>('/cms/newsletter/unsubscribe', { email }),
};

// ── Contact & support ───────────────────────────────────────────────────────
// The storefront has two forms (a general enquiry and a complaint) writing to
// the same collection, told apart by `type`. The admin inbox lives at
// /admin/support and reads the same endpoints.
export type ContactType = 'general' | 'complaint';

export type ComplaintCategory =
  | 'delivery'
  | 'product_quality'
  | 'damaged'
  | 'billing'
  | 'warranty'
  | 'staff'
  | 'other';

export type ContactStatus = 'new' | 'in_progress' | 'resolved' | 'closed';
export type ContactPriority = 'low' | 'medium' | 'high';

export interface ContactSubmission {
  type: ContactType;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  orderNumber?: string;
  category?: ComplaintCategory;
}

export interface ContactMessageRecord {
  _id: string;
  type: ContactType;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: ContactStatus;
  priority: ContactPriority;
  orderNumber?: string;
  category?: ComplaintCategory;
  adminNote?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const contactApi = {
  submit: (data: ContactSubmission) => apiPost<any>('/cms/contact', data),
};

export const supportApi = {
  getMessages: (params: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
    search?: string;
  }) => apiGetPaginated<ContactMessageRecord[]>('/cms/contact', params),

  updateMessage: (
    id: string,
    data: { status?: ContactStatus; priority?: ContactPriority; adminNote?: string }
  ) => apiPatch<ContactMessageRecord>(`/cms/contact/${id}`, data),
};

export const cmsApi = {
  getContent: (key: string) => apiGet<any>(`/cms/content/${key}`),

  getMultiple: (keys: string[]) =>
    apiGet<any>('/cms/content', { keys: keys.join(',') }),

  getPolicies: () => apiGet<any>('/cms/policies'),

  getFaqs: () => apiGet<any[]>('/cms/faqs'),
};

export const blogApi = {
  getPosts: async (params?: { page?: number; limit?: number; category?: string }) => {
    const result = await apiGetPaginated<any[]>('/blog/posts', params);
    return { posts: result.data, pagination: result.pagination };
  },

  getPost: (slug: string) => apiGet<any>(`/blog/posts/slug/${slug}`),

  getCategories: () => apiGet<any[]>('/blog/categories'),
};

export const settingsApi = {
  getPublic: () => apiGet<any>('/settings/public'),
};

export const testimonialsApi = {
  // Public endpoints
  getApproved: () => apiGet<any[]>('/testimonials/approved'),

  getFeatured: () => apiGet<any[]>('/testimonials/featured'),

  submit: (data: { customerName: string; customerEmail: string; rating: number; title?: string; content: string }) =>
    apiPost<any>('/testimonials', data),
};

export const loyaltyApi = {
  getMyPoints: () =>
    apiGet<{
      balance: number;
      totalEarned: number;
      totalRedeemed: number;
      isFrozen: boolean;
      programEnabled: boolean;
      pointsRedemptionRate: number;
      minPointsToRedeem: number;
      discountValue: number;
      breakdown: { fromPurchases: number; fromReferrals: number; redeemed: number; adjusted: number };
      transactions: any[];
    }>('/loyalty/me'),

  calculateDiscount: (points: number) =>
    apiGet<{ requestedPoints: number; availablePoints: number; discountValue: number; pointsRedemptionRate: number }>('/loyalty/calculate', { points }),

  redeemPoints: (points: number, orderId?: string) =>
    apiPost<{ pointsRedeemed: number; discountValue: number; remainingBalance: number }>('/loyalty/redeem', { points, orderId }),
};

export const referralsApi = {
  getMyReferrals: () =>
    apiGet<{
      referralCode: string;
      totalReferrals: number;
      successfulReferrals: number;
      totalEarnings: number;
      pendingRewards: number;
      referrals: any[];
    }>('/referrals/me'),

  getReferralByCode: (code: string) =>
    apiGet<{ valid: boolean; referrer?: any }>(`/referrals/code/${code}`),

  applyReferralCode: (code: string) =>
    apiPost<any>('/referrals/apply', { code }),

  generateReferralCode: () =>
    apiPost<{ referralCode: string }>('/referrals/generate'),
};

export const returnsApi = {
  // Customer: request a return against a delivered order
  create: (data: {
    orderId: string;
    reason: string;
    description?: string;
    items: { productId: string; quantity: number; reason?: string }[];
  }) => apiPost<any>('/returns', data),

  // Customer: their own returns
  getMy: async (params?: { page?: number; limit?: number }) => {
    const result = await apiGetPaginated<any[]>('/returns/my', params);
    return { returns: result.data, pagination: result.pagination };
  },

  // Admin: all returns, filterable by status
  getAll: async (params?: { page?: number; limit?: number; status?: string; search?: string }) => {
    const result = await apiGetPaginated<any[]>('/returns', params);
    return { returns: result.data, pagination: result.pagination };
  },

  // Admin: approve / reject / receive / refund
  updateStatus: (
    id: string,
    data: { status: string; adminNote?: string; refundAmount?: number }
  ) => apiPatch<any>(`/returns/${id}/status`, data),
};

// Admin APIs
export const adminApi = {
  // Dashboard
  getDashboard: () => apiGet<any>('/admin/dashboard'),

  getAnalytics: (params?: { startDate?: string; endDate?: string; period?: string }) =>
    apiGet<any>('/admin/analytics', params),

  getSalesAnalytics: (params?: { period?: string; days?: number }) =>
    apiGet<any>('/admin/analytics/sales', params),

  getOrderStatusDistribution: () =>
    apiGet<any>('/admin/analytics/order-status'),

  getRevenueComparison: () =>
    apiGet<any>('/admin/analytics/revenue-comparison'),

  getTopCategories: (params?: { limit?: number }) =>
    apiGet<any>('/admin/analytics/top-categories', params),

  getTopAnalyticsProducts: (params?: { limit?: number }) =>
    apiGet<any>('/admin/analytics/top-products', params),

  // Products (admin uses same endpoints as public, auth determines access)
  getProducts: (params?: any) => apiGet<any>('/products', params),

  getProduct: (id: string) => apiGet<any>(`/products/${id}`),

  createProduct: (data: any) => apiPost<any>('/products', data),

  updateProduct: (id: string, data: any) =>
    apiPatch<any>(`/products/${id}`, data),

  deleteProduct: (id: string) => apiDelete<any>(`/products/${id}`),

  // Categories
  getCategory: (id: string) => apiGet<any>(`/categories/${id}`),

  createCategory: (data: any) => apiPost<any>('/categories', data),

  updateCategory: (id: string, data: any) =>
    apiPatch<any>(`/categories/${id}`, data),

  deleteCategory: (id: string) => apiDelete<any>(`/categories/${id}`),

  // Brands
  getBrands: (all?: boolean) => apiGet<any[]>('/brands', all ? { all: 'true' } : undefined),

  getBrand: (id: string) => apiGet<any>(`/brands/${id}`),

  createBrand: (data: any) => apiPost<any>('/brands', data),

  updateBrand: (id: string, data: any) =>
    apiPatch<any>(`/brands/${id}`, data),

  deleteBrand: (id: string) => apiDelete<any>(`/brands/${id}`),

  // Orders (admin endpoints are at /orders, not /admin/orders)
  getOrders: async (params?: any) => {
    const result = await apiGetPaginated<any[]>('/orders', params);
    return { orders: result.data, pagination: result.pagination };
  },

  getOrder: (id: string) => apiGet<any>(`/orders/${id}`),

  updateOrderStatus: (id: string, status: string, note?: string) =>
    apiPatch<any>(`/orders/${id}/status`, { status, note }),

  // Shipment tracking — trackingUrl is derived server-side from the carrier
  // when it isn't supplied.
  updateOrderShipment: (
    id: string,
    data: {
      carrier: string;
      trackingNumber: string;
      trackingUrl?: string;
      estimatedDelivery?: string;
    }
  ) => apiPatch<any>(`/orders/${id}/shipment`, data),

  // Partial or full refund against a paid order.
  refundOrder: (id: string, data: { amount: number; reason?: string }) =>
    apiPost<any>(`/orders/${id}/refund`, data),

  // Customers (users are at /admin/customers on backend)
  getUsers: async (params?: any) => {
    const result = await apiGetPaginated<any[]>('/admin/customers', params);
    return { users: result.data, pagination: result.pagination };
  },

  getUser: (id: string) => apiGet<any>(`/admin/customers/${id}`),

  updateUser: (id: string, data: any) =>
    apiPatch<any>(`/admin/customers/${id}`, data),

  updateCustomer: (id: string, data: any) =>
    apiPatch<any>(`/admin/customers/${id}`, data),

  deleteUser: (id: string) => apiDelete<any>(`/admin/customers/${id}`),

  // Staff
  getStaffMember: (id: string) => apiGet<any>(`/admin/staff/${id}`),

  getStaff: () => apiGet<any[]>('/admin/staff'),

  getStaffPaginated: async (params?: any) => {
    const result = await apiGetPaginated<any[]>('/admin/staff', params);
    return { users: result.data, pagination: result.pagination };
  },

  createStaff: (data: any) => apiPost<any>('/admin/staff', data),

  updateStaff: (id: string, data: any) =>
    apiPatch<any>(`/admin/staff/${id}`, data),

  deleteStaff: (id: string) => apiDelete<any>(`/admin/staff/${id}`),

  updateStaffPermissions: (id: string, permissions: any) =>
    apiPatch<any>(`/admin/staff/${id}/permissions`, { permissions }),

  // Reviews (admin reviews endpoint is at /reviews with auth)
  getReviews: async (params?: any) => {
    const result = await apiGetPaginated<any[]>('/reviews', params);
    return { reviews: result.data, pagination: result.pagination };
  },

  getPendingReviews: async () => {
    const result = await apiGetPaginated<any[]>('/reviews', { status: 'pending' });
    return result.data;
  },

  approveReview: (id: string) => apiPatch<any>(`/reviews/${id}/moderate`, { status: 'approved' }),

  rejectReview: (id: string) => apiPatch<any>(`/reviews/${id}/moderate`, { status: 'rejected' }),

  deleteReview: (id: string) => apiDelete<any>(`/reviews/${id}`),

  // Offers (admin offers endpoint is at /offers with auth, no pagination)
  getOffers: async (params?: any) => {
    const offers = await apiGet<any[]>('/offers', params);
    return { offers, pagination: null as { totalPages: number; page: number } | null };
  },

  getOffer: (id: string) => apiGet<any>(`/offers/${id}`),

  createOffer: (data: any) => apiPost<any>('/offers', data),

  updateOffer: (id: string, data: any) =>
    apiPatch<any>(`/offers/${id}`, data),

  deleteOffer: (id: string) => apiDelete<any>(`/offers/${id}`),

  // Banners (admin banners endpoint is at /banners with auth, no pagination)
  getBanners: async (params?: any) => {
    const banners = await apiGet<any[]>('/banners', params);
    return { banners, pagination: null as { totalPages: number; page: number } | null };
  },

  getBanner: (id: string) => apiGet<any>(`/banners/${id}`),

  createBanner: (data: any) => apiPost<any>('/banners', data),

  updateBanner: (id: string, data: any) =>
    apiPatch<any>(`/banners/${id}`, data),

  deleteBanner: (id: string) => apiDelete<any>(`/banners/${id}`),

  // Blog (admin blog endpoint is at /blog/admin/posts)
  getBlogPosts: async (params?: any) => {
    const result = await apiGetPaginated<any[]>('/blog/admin/posts', params);
    return { posts: result.data, pagination: result.pagination };
  },

  getBlogPost: (id: string) => apiGet<any>(`/blog/admin/posts/${id}`),

  createBlogPost: (data: any) => apiPost<any>('/blog/admin/posts', data),

  updateBlogPost: (id: string, data: any) =>
    apiPatch<any>(`/blog/admin/posts/${id}`, data),

  deleteBlogPost: (id: string) => apiDelete<any>(`/blog/admin/posts/${id}`),

  // Settings
  getSettings: () => apiGet<any>('/admin/settings'),

  updateSettings: (data: any) => apiPatch<any>('/admin/settings', data),

  // Testimonials
  getTestimonials: (params?: { page?: number; limit?: number; status?: string; search?: string }) =>
    apiGet<{ testimonials: any[]; pagination: any }>('/testimonials', params),

  getTestimonial: (id: string) => apiGet<any>(`/testimonials/${id}`),

  updateTestimonial: (id: string, data: any) =>
    apiPatch<any>(`/testimonials/${id}`, data),

  moderateTestimonial: (id: string, status: 'approved' | 'rejected') =>
    apiPost<any>(`/testimonials/${id}/moderate`, { status }),

  toggleTestimonialFeatured: (id: string) =>
    apiPost<any>(`/testimonials/${id}/toggle-featured`),

  deleteTestimonial: (id: string) => apiDelete<any>(`/testimonials/${id}`),

  // Audit Logs (super admin only)
  getAuditLogs: async (params?: { page?: number; limit?: number; resource?: string; action?: string; userId?: string; startDate?: string; endDate?: string }) => {
    const result = await apiGetPaginated<any[]>('/admin/audit-logs', params);
    return { logs: result.data, pagination: result.pagination };
  },

  // ========== INVENTORY ==========
  getInventoryDashboard: () => apiGet<any>('/admin/inventory/dashboard'),

  getInventoryProducts: async (params?: any) => {
    const result = await apiGetPaginated<any[]>('/admin/inventory/products', params);
    return { products: result.data, pagination: result.pagination };
  },

  updateProductStock: (id: string, data: { quantity: number; type: 'set' | 'add' | 'subtract'; reason?: string }) =>
    apiPatch<any>(`/admin/inventory/products/${id}/stock`, data),

  bulkUpdateStock: (updates: { productId: string; quantity: number; reason?: string }[]) =>
    apiPost<any>('/admin/inventory/bulk-update', { updates }),

  getStockMovements: async (params?: any) => {
    const result = await apiGetPaginated<any[]>('/admin/inventory/movements', params);
    return { movements: result.data, pagination: result.pagination };
  },

  createStockMovement: (data: any) =>
    apiPost<any>('/admin/inventory/movements', data),

  getStockAlerts: () => apiGet<any[]>('/admin/inventory/alerts'),

  // ========== ACCOUNTING ==========
  getAccountingDashboard: (params?: { period?: number }) =>
    apiGet<any>('/admin/accounting/dashboard', params),

  getExpenses: async (params?: any) => {
    const result = await apiGetPaginated<any[]>('/admin/accounting/expenses', params);
    return { expenses: result.data, pagination: result.pagination };
  },

  createExpense: (data: any) => apiPost<any>('/admin/accounting/expenses', data),

  getExpense: (id: string) => apiGet<any>(`/admin/accounting/expenses/${id}`),

  updateExpense: (id: string, data: any) =>
    apiPatch<any>(`/admin/accounting/expenses/${id}`, data),

  deleteExpense: (id: string) => apiDelete<any>(`/admin/accounting/expenses/${id}`),

  getTransactions: async (params?: any) => {
    const result = await apiGetPaginated<any[]>('/admin/accounting/transactions', params);
    return { transactions: result.data, pagination: result.pagination };
  },

  createTransaction: (data: any) =>
    apiPost<any>('/admin/accounting/transactions', data),

  getFinancialReports: (params?: { period?: string; year?: number }) =>
    apiGet<any>('/admin/accounting/reports', params),

  // ========== SEO ==========
  getSEODashboard: () => apiGet<any>('/admin/seo/dashboard'),

  getSEOPages: async (params?: any) => {
    const result = await apiGetPaginated<any[]>('/admin/seo/pages', params);
    return { pages: result.data, pagination: result.pagination };
  },

  createSEOPage: (data: any) => apiPost<any>('/admin/seo/pages', data),

  getSEOPage: (id: string) => apiGet<any>(`/admin/seo/pages/${id}`),

  updateSEOPage: (id: string, data: any) =>
    apiPatch<any>(`/admin/seo/pages/${id}`, data),

  deleteSEOPage: (id: string) => apiDelete<any>(`/admin/seo/pages/${id}`),

  getSEOProducts: async (params?: any) => {
    const result = await apiGetPaginated<any[]>('/admin/seo/products', params);
    return { products: result.data, pagination: result.pagination };
  },

  updateProductSEO: (id: string, data: { metaTitle?: string; metaDescription?: string }) =>
    apiPatch<any>(`/admin/seo/products/${id}`, data),

  bulkUpdateProductSEO: (updates: { productId: string; metaTitle?: string; metaDescription?: string }[]) =>
    apiPost<any>('/admin/seo/products/bulk', { updates }),

  getSEORedirects: async (params?: any) => {
    const result = await apiGetPaginated<any[]>('/admin/seo/redirects', params);
    return { redirects: result.data, pagination: result.pagination };
  },

  createSEORedirect: (data: any) => apiPost<any>('/admin/seo/redirects', data),

  updateSEORedirect: (id: string, data: any) =>
    apiPatch<any>(`/admin/seo/redirects/${id}`, data),

  deleteSEORedirect: (id: string) => apiDelete<any>(`/admin/seo/redirects/${id}`),

  getSEOKeywords: async (params?: any) => {
    const result = await apiGetPaginated<any[]>('/admin/seo/keywords', params);
    return { keywords: result.data, pagination: result.pagination };
  },

  createSEOKeyword: (data: any) => apiPost<any>('/admin/seo/keywords', data),

  updateSEOKeyword: (id: string, data: any) =>
    apiPatch<any>(`/admin/seo/keywords/${id}`, data),

  deleteSEOKeyword: (id: string) => apiDelete<any>(`/admin/seo/keywords/${id}`),

  getSEOAudit: () => apiGet<any>('/admin/seo/audit'),

  // SEO Seed
  seedSEOData: () => apiPost<any>('/admin/seo/seed', {}),

  // Backfill endpoints
  backfillAccounting: () => apiPost<any>('/admin/accounting/backfill', {}),
  backfillInventory: () => apiPost<any>('/admin/inventory/backfill', {}),

  // CMS - Policy Pages
  getPolicies: () => apiGet<any[]>('/cms/policies'),
  updatePolicy: (slug: string, data: any) => apiPut<any>(`/cms/policies/${slug}`, data),

  // CMS - FAQs
  getFaqs: () => apiGet<any[]>('/cms/faqs'),
  createFaq: (data: any) => apiPost<any>('/cms/faqs', data),
  updateFaq: (id: string, data: any) => apiPatch<any>(`/cms/faqs/${id}`, data),
  deleteFaq: (id: string) => apiDelete<any>(`/cms/faqs/${id}`),

  // CMS - Content
  getContent: (key: string) => apiGet<any>(`/cms/content/${key}`),
  updateContent: (key: string, value: any) => apiPut<any>(`/cms/content/${key}`, { value }),

  // ========== LOYALTY ==========
  getLoyaltyUsers: async (params?: any) => {
    const result = await apiGetPaginated<any[]>('/loyalty/admin/users', params);
    return { users: result.data, pagination: result.pagination };
  },

  getUserPointsTransactions: async (userId: string, params?: any) => {
    const result = await apiGetPaginated<any[]>(`/loyalty/admin/${userId}/transactions`, params);
    return { transactions: result.data, pagination: result.pagination };
  },

  adjustUserPoints: (userId: string, data: { freeze?: boolean; adjustPoints?: number; reason?: string }) =>
    apiPatch<any>(`/loyalty/admin/${userId}`, data),
};

export default api;

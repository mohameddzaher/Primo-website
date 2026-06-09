import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authApi, setAccessToken } from '@/lib/api';

// User Store
interface User {
  id: string;
  _id?: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  role: 'user' | 'admin' | 'super_admin' | 'staff';
  avatar?: string;
  phone?: string;
  permissions?: Record<string, any>;
  createdAt?: string;
  ordersCount?: number;
  wishlistCount?: number;
  reviewsCount?: number;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      setUser: (user) => set({
        user: user ? {
          ...user,
          name: (user.firstName || user.lastName)
            ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
            : user.name || user.email,
        } : null,
        isAuthenticated: !!user,
        isLoading: false,
      }),
      setLoading: (isLoading) => set({ isLoading }),
      logout: () => {
        // Call backend to clear refresh token cookie
        authApi.logout().catch(() => {});
        setAccessToken(null);
        set({ user: null, isAuthenticated: false });
        // Clear all persisted stores on logout
        useCartStore.getState().clearCart();
        useWishlistStore.getState().clearWishlist();
        useCompareStore.getState().clearCompare();
        useRecentlyViewedStore.getState().clearHistory();
      },
    }),
    {
      name: 'primo-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);

// Cart Store
interface CartItem {
  productId: string;
  product: {
    id: string;
    title: string;
    slug: string;
    price: number;
    compareAtPrice?: number;
    discount?: number;
    images: { url: string; alt?: string }[];
    stock: number;
  };
  quantity: number;
}

interface CartState {
  items: CartItem[];
  discountCode: string | null;
  discountAmount: number;
  discountType: 'percentage' | 'fixed' | null;
  discountValue: number;
  maxDiscount: number | null;
  isOpen: boolean;
  addItem: (item: CartItem) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  setDiscount: (code: string, amount: number, type?: 'percentage' | 'fixed', value?: number, maxDiscount?: number | null) => void;
  clearDiscount: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  setItems: (items: CartItem[]) => void;
  getSubtotal: () => number;
  getDiscountAmount: () => number;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      discountCode: null,
      discountAmount: 0,
      discountType: null,
      discountValue: 0,
      maxDiscount: null,
      isOpen: false,

      addItem: (item) =>
        set((state) => {
          const existingItem = state.items.find((i) => i.productId === item.productId);
          if (existingItem) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId
                  ? { ...i, quantity: Math.min((i.quantity || 0) + (item.quantity || 1), i.product?.stock || 999) }
                  : i
              ),
            };
          }
          return { items: [...state.items, item] };
        }),

      updateQuantity: (productId, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.productId === productId
              ? { ...item, quantity: Math.min(Math.max(1, quantity || 1), item.product?.stock || 999) }
              : item
          ),
        })),

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
        })),

      clearCart: () => set({ items: [], discountCode: null, discountAmount: 0, discountType: null, discountValue: 0, maxDiscount: null }),

      setDiscount: (code, amount, type, value, maxDiscount) => set({
        discountCode: code,
        discountAmount: amount,
        discountType: type || null,
        discountValue: value || 0,
        maxDiscount: maxDiscount ?? null,
      }),

      clearDiscount: () => set({ discountCode: null, discountAmount: 0, discountType: null, discountValue: 0, maxDiscount: null }),

      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      openCart: () => set({ isOpen: true }),

      closeCart: () => set({ isOpen: false }),

      setItems: (items) => set({ items }),

      getSubtotal: () => {
        const state = get();
        return state.items.reduce((total, item) => {
          const basePrice = item.product?.price || 0;
          const discount = item.product?.discount || 0;
          const price = discount > 0
            ? basePrice * (1 - discount / 100)
            : basePrice;
          const quantity = item.quantity || 0;
          return total + (price * quantity);
        }, 0);
      },

      getDiscountAmount: () => {
        const state = get();
        if (!state.discountCode) return 0;
        const subtotal = state.getSubtotal();
        if (state.discountType === 'percentage') {
          let discount = (subtotal * state.discountValue) / 100;
          if (state.maxDiscount) discount = Math.min(discount, state.maxDiscount);
          return Math.round(discount * 100) / 100;
        }
        if (state.discountType === 'fixed') {
          return Math.min(state.discountValue, subtotal);
        }
        // Fallback to stored amount
        return state.discountAmount;
      },

      getTotal: () => {
        const state = get();
        const subtotal = state.getSubtotal();
        return Math.max(0, subtotal - state.getDiscountAmount());
      },

      getItemCount: () => {
        const state = get();
        return state.items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: 'primo-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        discountCode: state.discountCode,
        discountAmount: state.discountAmount,
        discountType: state.discountType,
        discountValue: state.discountValue,
        maxDiscount: state.maxDiscount,
      }),
    }
  )
);

// Wishlist Store
interface WishlistState {
  items: string[];
  addItem: (productId: string) => void;
  removeItem: (productId: string) => void;
  toggleItem: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
  setItems: (items: string[]) => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (productId) =>
        set((state) => ({
          items: state.items.includes(productId) ? state.items : [...state.items, productId],
        })),

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((id) => id !== productId),
        })),

      toggleItem: (productId) =>
        set((state) => ({
          items: state.items.includes(productId)
            ? state.items.filter((id) => id !== productId)
            : [...state.items, productId],
        })),

      isInWishlist: (productId) => get().items.includes(productId),

      clearWishlist: () => set({ items: [] }),

      setItems: (items) => set({ items }),
    }),
    {
      name: 'primo-wishlist',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Compare Store
interface CompareState {
  items: string[];
  maxItems: number;
  addItem: (productId: string) => boolean;
  removeItem: (productId: string) => void;
  isInCompare: (productId: string) => boolean;
  clearCompare: () => void;
}

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      items: [],
      maxItems: 4,

      addItem: (productId) => {
        const state = get();
        if (state.items.length >= state.maxItems) return false;
        if (state.items.includes(productId)) return true;
        set({ items: [...state.items, productId] });
        return true;
      },

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((id) => id !== productId),
        })),

      isInCompare: (productId) => get().items.includes(productId),

      clearCompare: () => set({ items: [] }),
    }),
    {
      name: 'primo-compare',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Recently Viewed Store
interface RecentlyViewedState {
  items: string[];
  maxItems: number;
  addItem: (productId: string) => void;
  clearHistory: () => void;
  setItems: (items: string[]) => void;
}

export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set, get) => ({
      items: [],
      maxItems: 20,

      addItem: (productId) =>
        set((state) => {
          const filtered = state.items.filter((id) => id !== productId);
          return {
            items: [productId, ...filtered].slice(0, state.maxItems),
          };
        }),

      clearHistory: () => set({ items: [] }),

      setItems: (items) => set({ items }),
    }),
    {
      name: 'primo-recently-viewed',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// UI Store
interface UIState {
  isMobileMenuOpen: boolean;
  isSearchOpen: boolean;
  isFilterOpen: boolean;
  activeModal: string | null;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
  toggleSearch: () => void;
  closeSearch: () => void;
  toggleFilter: () => void;
  closeFilter: () => void;
  openModal: (modalId: string) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isMobileMenuOpen: false,
  isSearchOpen: false,
  isFilterOpen: false,
  activeModal: null,

  toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),

  toggleSearch: () => set((state) => ({ isSearchOpen: !state.isSearchOpen })),
  closeSearch: () => set({ isSearchOpen: false }),

  toggleFilter: () => set((state) => ({ isFilterOpen: !state.isFilterOpen })),
  closeFilter: () => set({ isFilterOpen: false }),

  openModal: (modalId) => set({ activeModal: modalId }),
  closeModal: () => set({ activeModal: null }),
}));

// Notification Store
interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  setUnreadCount: (count: number) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,

  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        { ...notification, id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` },
      ],
    })),

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  clearNotifications: () => set({ notifications: [] }),

  setUnreadCount: (count) => set({ unreadCount: count }),
}));

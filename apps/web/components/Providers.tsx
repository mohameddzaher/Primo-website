'use client';

import { ReactNode, useEffect, useRef } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import { queryClient } from '@/lib/query-client';
import { useAuthStore, syncWishlistWithServer } from '@/lib/store';
import { authApi, setAccessToken } from '@/lib/api';
import { SettingsProvider } from '@/lib/settings-context';
import { I18nProvider } from '@/lib/i18n';

interface ProvidersProps {
  children: ReactNode;
}

function AuthProvider({ children }: { children: ReactNode }) {
  const { setUser, setLoading, isAuthenticated } = useAuthStore();
  const initRef = useRef(false);

  useEffect(() => {
    // Prevent double initialization in StrictMode
    if (initRef.current) return;
    initRef.current = true;

    const initAuth = async () => {
      // Only attempt restore if user was previously authenticated
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Use refresh token cookie to get a new access token + user data in one call
        const result = await authApi.refresh();
        setAccessToken(result.accessToken);

        // Refresh endpoint returns user data — use it directly
        if (result.user) {
          setUser(result.user);
        } else {
          // Fallback: fetch user data separately
          const user = await authApi.getMe();
          setUser(user);
        }
        // Reconcile the guest/local wishlist with the server now we're authed
        await syncWishlistWithServer();
      } catch {
        // Refresh token invalid/expired — clear session
        setAccessToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [setUser, setLoading, isAuthenticated]);

  return <>{children}</>;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <SettingsProvider>
          <AuthProvider>
            {children}
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 4000,
                className: 'toast-custom',
                success: {
                  iconTheme: {
                    primary: '#22c55e',
                    secondary: '#fff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </AuthProvider>
        </SettingsProvider>
      </I18nProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default Providers;

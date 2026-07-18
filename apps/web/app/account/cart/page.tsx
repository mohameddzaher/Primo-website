'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/components/ui';

/**
 * The cart lives at /cart so that GUESTS can view and build a basket.
 * Everything under /account is auth-gated, which previously made the cart
 * unreachable for logged-out visitors. This route is kept only so old links
 * and bookmarks keep working.
 */
export default function AccountCartRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/cart');
  }, [router]);

  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}

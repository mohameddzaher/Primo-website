'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/components/ui';

export default function CartPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/account/cart');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}

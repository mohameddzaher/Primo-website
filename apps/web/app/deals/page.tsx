'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/components/ui';

export default function DealsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/products?onSale=true');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}

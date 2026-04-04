'use client';

import { Spin } from 'antd';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function HomePage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/dashboard');
      return;
    }

    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [router, status]);

  return (
    <div className="app-shell" style={{ display: 'grid', placeItems: 'center' }}>
      <Spin size="large" />
    </div>
  );
}

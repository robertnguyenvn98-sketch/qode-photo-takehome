'use client';

import { App as AntApp, ConfigProvider } from 'antd';
import type { ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#0c6cf2',
            borderRadius: 12,
            fontFamily: 'var(--font-primary)',
          },
        }}
      >
        <AntApp>{children}</AntApp>
      </ConfigProvider>
    </SessionProvider>
  );
}

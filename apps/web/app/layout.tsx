import type { ReactNode } from 'react';
import { Providers } from './providers';

export const metadata = {
  title: 'Qode Photo Takehome',
  description: 'Photo upload and comment application',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

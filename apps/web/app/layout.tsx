import type { ReactNode } from 'react';
import { Space_Grotesk } from 'next/font/google';
import 'antd/dist/reset.css';
import './globals.css';
import { Providers } from './providers';

const primaryFont = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-primary',
});

export const metadata = {
  title: 'Qode Photo Takehome',
  description: 'Photo upload and comment application',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={primaryFont.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

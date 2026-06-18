import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Article Panel',
  description: 'Multi-domain static article publisher',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

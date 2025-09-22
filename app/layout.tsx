import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ErrorBoundary } from '@/components/ui/error-boundary';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TableRewards Cape Town - Restaurant Booking & Rewards',
  description: 'Book tables at Cape Town\'s finest restaurants and earn rewards. Discover the Mother City\'s culinary scene from Camps Bay to the V&A Waterfront.',
  keywords: 'restaurant booking, Cape Town, rewards, dining, South Africa',
  authors: [{ name: 'TableRewards' }],
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}

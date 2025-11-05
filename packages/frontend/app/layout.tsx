import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/layout/Header';
import { Web3Provider } from '@/lib/providers/web3-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'fhEVM Perpetual DEX',
  description: 'Privacy-preserving perpetual futures trading',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-950 text-white min-h-screen`}>
        <Web3Provider>
          <Header />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </Web3Provider>
      </body>
    </html>
  );
}

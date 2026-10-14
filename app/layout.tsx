import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Inter } from 'next/font/google';
import Shell from '@/components/Shell';
import './globals.css';

const display = Cormorant_Garamond({ subsets: ['latin'], weight: ['400', '500', '600', '700'], style: ['normal', 'italic'], variable: '--font-cormorant', display: 'swap' });
const ui = Inter({ subsets: ['latin', 'greek'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  title: 'MYTHOS — an atlas of Greek mythology',
  description: 'An interactive 3D atlas of Greek mythology that keeps mythic time and historical time on separate clocks, bridged by attestation.',
};

export const viewport: Viewport = { themeColor: '#070912', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${ui.variable}`}>
      <body className="starfield antialiased">
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}

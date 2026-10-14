import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

import PwaManager from '@/components/PwaManager';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PerfConnect',
  description: 'Trouve ton partenaire de sport',
  applicationName: 'PerfConnect',
  appleWebApp: {
    capable: true,
    title: 'PerfConnect',
    statusBarStyle: 'default',
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Le contenu s'étend sous l'encoche ; les marges sont gérées par les
  // classes pt-safe / pb-safe (globals.css).
  viewportFit: 'cover',
  themeColor: '#ffffff',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        {/* Tuiles des cartes : connexion ouverte avant le premier rendu. */}
        <link rel="preconnect" href="https://tile.openstreetmap.org" crossOrigin="" />
      </head>
      <body className={`${inter.className} bg-gray-50 text-slate-900 antialiased`}>
        {children}
        <PwaManager />
      </body>
    </html>
  );
}

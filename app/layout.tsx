import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

import PwaManager from '@/components/PwaManager';
import { BRAND_COLORS } from '@/lib/brand';

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
  // favicon.ico (16/32/48) est ajouté automatiquement depuis app/. Fichiers
  // générés depuis le logo par scripts/brand-assets.py.
  icons: {
    icon: [{ url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Le contenu s'étend sous l'encoche ; les marges sont gérées par les
  // classes pt-safe / pb-safe (globals.css).
  viewportFit: 'cover',
  // Barre d'adresse (Chrome Android) et barre de titre de l'app installée.
  themeColor: BRAND_COLORS.navy,
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
      <body className={`${inter.className} bg-gray-50 text-navy-900 antialiased`}>
        {children}
        <PwaManager />
      </body>
    </html>
  );
}

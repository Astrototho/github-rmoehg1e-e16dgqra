import type { MetadataRoute } from 'next';
import { BRAND_COLORS } from '@/lib/brand';

// Rend l'app installable sur l'écran d'accueil (Android / iOS « Sur l'écran
// d'accueil ») et l'ouvre en plein écran, sans barre de navigateur.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'PerfConnect',
    short_name: 'PerfConnect',
    description: 'Trouve ton partenaire de sport',
    lang: 'fr',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    // Écran de lancement Android : fond blanc, comme les icônes.
    background_color: BRAND_COLORS.white,
    // Barre d'état / de titre de l'app installée : marine du logo.
    theme_color: BRAND_COLORS.navy,
    categories: ['sports', 'social', 'health'],
    shortcuts: [
      { name: 'Proposer une sortie', short_name: 'Proposer', url: '/create' },
      { name: 'Messages', url: '/messages' },
      { name: 'Mes sorties', url: '/activities' },
    ],
    // Générées depuis le logo par scripts/brand-assets.py (logo centré ;
    // maskable : logo dans la zone sûre, cercle central de 80 %).
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}

import type { MetadataRoute } from 'next';

// Rend l'app installable sur l'écran d'accueil (Android / iOS « Sur l'écran
// d'accueil ») et l'ouvre en plein écran, sans barre de navigateur.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PerfConnect',
    short_name: 'PerfConnect',
    description: 'Trouve ton partenaire de sport',
    lang: 'fr',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    icons: [
      { src: '/icon/192', sizes: '192x192', type: 'image/png' },
      { src: '/icon/512', sizes: '512x512', type: 'image/png' },
      { src: '/icon/maskable', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}

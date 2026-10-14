import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/** @type {import('next').NextConfig} */

// En-têtes de sécurité appliqués à toutes les réponses.
const securityHeaders = [
  // Interdit l'affichage du site dans une iframe d'un autre site (clickjacking).
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Géolocalisation autorisée pour le site lui-même (carte, ville), le reste coupé.
  {
    key: 'Permissions-Policy',
    value: 'geolocation=(self), camera=(), microphone=(), payment=(), usb=()',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains',
  },
];

const nextConfig = {
  poweredByHeader: false,
  experimental: {
    // Revenir sur un onglet déjà visité dans les 30 s réutilise son rendu au
    // lieu de tout redemander au serveur (les actions invalident ce cache).
    staleTimes: { dynamic: 30 },
  },
  // Un package-lock.json existe dans le dossier parent : on fixe la racine du
  // projet pour que Next ne la devine pas de travers.
  outputFileTracingRoot: dirname(fileURLToPath(import.meta.url)),
  // Identifiant du build (commit déployé sur Vercel), utilisé pour détecter
  // qu'une nouvelle version est en ligne (components/PwaManager.tsx).
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.VERCEL_GIT_COMMIT_SHA || 'dev',
  },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      {
        // Le service worker doit toujours être revérifié, sinon une ancienne
        // version pourrait rester active sur les téléphones.
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ];
  },
};

export default nextConfig;

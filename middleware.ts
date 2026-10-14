import NextAuth from 'next-auth';
import { authConfig } from '@/auth.config';

// Le middleware n'utilise que la partie "Edge" de la config Auth.js
// (auth.config.ts) : lecture du cookie de session + callback authorized.
export const { auth: middleware } = NextAuth(authConfig);

// On définit sur quelles routes le middleware doit s'activer
// Les préchargements de liens et les Server Actions n'ont pas besoin du
// contrôle d'accès (les pages et les actions revérifient la session) : on
// leur épargne le passage par le middleware.
export const config = {
  matcher: [
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'next-action' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};

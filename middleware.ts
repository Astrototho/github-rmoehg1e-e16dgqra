import NextAuth from 'next-auth';
import { authConfig } from '@/auth.config';

// Le middleware n'utilise que la partie "Edge" de la config Auth.js
// (auth.config.ts) : lecture du cookie de session + callback authorized.
export const { auth: middleware } = NextAuth(authConfig);

// On définit sur quelles routes le middleware doit s'activer
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};

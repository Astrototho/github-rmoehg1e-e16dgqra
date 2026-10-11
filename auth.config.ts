import type { NextAuthConfig } from 'next-auth';
import Strava from 'next-auth/providers/strava';

// Partie de la configuration Auth.js utilisable dans le middleware (runtime
// Edge) : aucun accès base de données ni module Node ici. Le callback signIn,
// qui écrit dans Supabase et chiffre les tokens, est ajouté dans auth.ts.
export const authConfig = {
  providers: [
    Strava({
      clientId: process.env.AUTH_STRAVA_ID,
      clientSecret: process.env.AUTH_STRAVA_SECRET,
      authorization: {
        params: {
          scope: 'read,profile:read_all,activity:read_all',
        },
      },
    }),
  ],
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: '/login',
    // Les erreurs de connexion (accès refusé, échec OAuth...) reviennent sur
    // la page de connexion, qui affiche un message lisible.
    error: '/login',
  },
  callbacks: {
    async jwt({ token, account }) {
      if (account?.providerAccountId) {
        token.userId = String(account.providerAccountId);
      }
      return token;
    },
    async session({ session, token }) {
      if (token.userId) {
        session.user.id = token.userId as string;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const path = nextUrl.pathname;

      if (
        path.startsWith('/api/auth') ||
        path === '/login' ||
        path.startsWith('/legal') ||
        // Icônes et manifest de l'app installable (PWA)
        path.startsWith('/icon') ||
        path.startsWith('/apple-icon') ||
        path === '/manifest.webmanifest'
      ) {
        return true;
      }

      // Fil et détail d'une sortie : accessibles sans connexion
      if (path === '/') {
        return true;
      }
      if (/^\/activities\/[0-9a-f-]{36}$/.test(path)) {
        return true;
      }

      return !!auth?.user;
    },
  },
} satisfies NextAuthConfig;

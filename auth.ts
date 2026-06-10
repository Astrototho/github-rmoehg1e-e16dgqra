import NextAuth from 'next-auth';
import Strava from 'next-auth/providers/strava';
import { createAdminClient } from '@/lib/supabase-admin';

interface StravaAthleteProfile {
  id?: number;
  firstname?: string;
  lastname?: string;
  username?: string;
  city?: string;
  country?: string;
  profile?: string;
  profile_medium?: string;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Strava({
      clientId: process.env.AUTH_STRAVA_ID,
      clientSecret: process.env.AUTH_STRAVA_SECRET,
      authorization: {
        params: {
          scope: 'read,profile:read_all',
        },
      },
    }),
  ],
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== 'strava' || !account.providerAccountId) {
        return false;
      }

      const stravaProfile = profile as StravaAthleteProfile;
      const name =
        [stravaProfile.firstname, stravaProfile.lastname]
          .filter(Boolean)
          .join(' ')
          .trim() || 'Athlète';

      const admin = createAdminClient();
      const { error } = await admin.from('profiles').upsert(
        {
          id: account.providerAccountId,
          name,
          avatar_url:
            stravaProfile.profile ||
            stravaProfile.profile_medium ||
            null,
          strava_username: stravaProfile.username || null,
          city: stravaProfile.city || null,
          country: stravaProfile.country || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

      if (error) {
        console.error('Erreur sync profil Strava → Supabase:', error);
        return false;
      }

      return true;
    },
    async jwt({ token, account }) {
      if (account?.providerAccountId) {
        token.userId = account.providerAccountId;
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

      if (path.startsWith('/api/auth') || path === '/login') {
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
});

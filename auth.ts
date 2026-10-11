import NextAuth from 'next-auth';
import { authConfig } from '@/auth.config';
import { createAdminClient } from '@/lib/supabase-admin';
import { refreshPerformanceProfile } from '@/lib/performance';
import { saveStravaTokens } from '@/lib/strava-tokens';
import { runInBackground } from '@/lib/background';

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
  ...authConfig,
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== 'strava' || !account.providerAccountId) {
        return false;
      }

      const stravaProfile = profile as StravaAthleteProfile;

      // Si l'appel Strava /athlete échoue (application Strava inactive, quota
      // dépassé...), Auth.js reçoit le corps d'erreur à la place du profil et
      // invente un identifiant aléatoire : on refuse la connexion plutôt que
      // de créer un profil fantôme sans lien avec le compte Strava.
      if (
        stravaProfile?.id == null ||
        !/^\d+$/.test(String(account.providerAccountId))
      ) {
        console.error(
          'Profil Strava invalide à la connexion :',
          JSON.stringify(profile)
        );
        return '/login?error=StravaProfile';
      }
      const name =
        [stravaProfile.firstname, stravaProfile.lastname]
          .filter(Boolean)
          .join(' ')
          .trim() || 'Athlète';

      const admin = createAdminClient();
      const { error } = await admin.from('profiles').upsert(
        {
          id: String(account.providerAccountId),
          name,
          avatar_url:
            stravaProfile.profile ||
            stravaProfile.profile_medium ||
            null,
          strava_username: stravaProfile.username || null,
          city: stravaProfile.city || null,
          country: stravaProfile.country || null,
        },
        { onConflict: 'id' }
      );

      if (error) {
        console.error('Erreur sync profil Strava → Supabase:', error);
        return false;
      }

      // Capture des tokens (chiffrés) + calcul du profil de performance en
      // tâche de fond : la connexion n'attend pas l'API Strava, et une erreur
      // ici ne doit jamais bloquer la connexion.
      const userId = String(account.providerAccountId);
      const accessToken = account.access_token;
      if (accessToken && account.refresh_token && account.expires_at) {
        const saved = await saveStravaTokens(userId, {
          accessToken,
          refreshToken: account.refresh_token,
          expiresAt: new Date(account.expires_at * 1000).toISOString(),
          scope: account.scope ?? null,
        });

        if (saved) {
          runInBackground('profil de performance (connexion)', () =>
            refreshPerformanceProfile(userId, accessToken)
          );
        }
      }

      return true;
    },
    ...authConfig.callbacks,
  },
});

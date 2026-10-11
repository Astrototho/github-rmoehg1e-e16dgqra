import { cache } from 'react';
import { auth } from '@/auth';
import { createAdminClient } from '@/lib/supabase-admin';
import type { AppUser, Profile } from '@/lib/types';
import { isValidUserId } from '@/lib/validation';
import { DEFAULT_AVATAR } from '@/lib/users';


function mapProfileToAppUser(profile: Profile): AppUser {
  return {
    id: profile.id,
    name: profile.name,
    avatar: profile.avatar_url ?? DEFAULT_AVATAR,
    bio: profile.bio ?? undefined,
    strava_username: profile.strava_username ?? undefined,
    latitude: profile.latitude,
    longitude: profile.longitude,
    city: profile.city,
    country: profile.country,
  };
}

// Mémorisé pour la durée d'une requête : le layout, la page et les helpers
// appelés pendant le rendu partagent une seule lecture de session + profil.
export const getCurrentUser = cache(async (): Promise<AppUser | null> => {
  const session = await auth();
  // Une session dont l'identifiant n'est pas un ID athlète Strava (ancien
  // profil fantôme) est traitée comme une absence de connexion.
  if (!session?.user?.id || !isValidUserId(session.user.id)) {
    return null;
  }

  const { data, error } = await createAdminClient()
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .maybeSingle();

  if (error) {
    console.error('Erreur getCurrentUser:', error);
    throw new Error('Impossible de charger ton profil.');
  }
  // Compte supprimé alors que le cookie de session existe encore.
  if (!data) return null;

  return mapProfileToAppUser(data as Profile);
});

export async function requireAuth(): Promise<AppUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Non authentifié');
  }
  return user;
}

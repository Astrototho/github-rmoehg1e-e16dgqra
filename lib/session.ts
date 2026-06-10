import { auth } from '@/auth';
import { createAdminClient } from '@/lib/supabase-admin';
import type { AppUser, Profile } from '@/lib/types';

function mapProfileToAppUser(profile: Profile): AppUser {
  return {
    id: profile.id,
    name: profile.name,
    avatar: profile.avatar_url ?? '/default-avatar.png',
    bio: profile.bio ?? undefined,
    strava_username: profile.strava_username ?? undefined,
  };
}

export async function getCurrentUser(): Promise<AppUser | null> {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (error || !data) {
    return {
      id: session.user.id,
      name: session.user.name ?? 'Athlète',
      avatar: session.user.image ?? '/default-avatar.png',
    };
  }

  return mapProfileToAppUser(data as Profile);
}

export async function requireAuth(): Promise<AppUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Non authentifié');
  }
  return user;
}

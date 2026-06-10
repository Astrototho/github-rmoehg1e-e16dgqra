import { createAdminClient } from '@/lib/supabase-admin';
import type { Profile } from '@/lib/types';

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=100';

export async function getUserById(userId: string): Promise<Profile | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) return null;
  return data as Profile;
}

export async function getUsersByIds(userIds: string[]): Promise<Profile[]> {
  if (userIds.length === 0) return [];

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('profiles')
    .select('*')
    .in('id', userIds);

  if (error || !data) return [];
  return data as Profile[];
}

export async function getUserName(userId: string): Promise<string> {
  const user = await getUserById(userId);
  return user?.name ?? 'Utilisateur';
}

export async function getUserAvatar(userId: string): Promise<string> {
  const user = await getUserById(userId);
  return user?.avatar_url ?? DEFAULT_AVATAR;
}

export async function getContactProfile(userId: string) {
  const user = await getUserById(userId);
  return {
    name: user?.name ?? 'Utilisateur',
    avatar: user?.avatar_url ?? DEFAULT_AVATAR,
  };
}

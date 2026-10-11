import { createAdminClient } from '@/lib/supabase-admin';
import { isValidUserId } from '@/lib/validation';
import type { Profile } from '@/lib/types';

export const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=100';

export async function getUserById(userId: string): Promise<Profile | null> {
  if (!isValidUserId(userId)) return null;

  const { data, error } = await createAdminClient()
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) return null;
  return data as Profile;
}

export async function getUsersByIds(userIds: string[]): Promise<Profile[]> {
  const ids = userIds.filter(isValidUserId);
  if (ids.length === 0) return [];

  const { data, error } = await createAdminClient()
    .from('profiles')
    .select('*')
    .in('id', ids);

  if (error || !data) return [];
  return data as Profile[];
}

export async function getContactProfile(userId: string) {
  const user = await getUserById(userId);
  if (!user) return null;
  return {
    name: user.name,
    avatar: user.avatar_url ?? DEFAULT_AVATAR,
  };
}

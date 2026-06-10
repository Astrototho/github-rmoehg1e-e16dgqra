import { createAdminClient } from '@/lib/supabase-admin';
import type { Activity } from '@/lib/types';

export const ACTIVITY_COLUMNS =
  'id, created_at, title, type, start_date, location, distance, elevation, description, organizer_id, organizer_name, organizer_avatar';

export async function getAllActivities(): Promise<Activity[]> {
  const { data, error } = await createAdminClient()
    .from('activities')
    .select(ACTIVITY_COLUMNS)
    .order('start_date', { ascending: true });

  if (error) {
    console.error('Erreur getAllActivities:', error);
    return [];
  }

  return (data ?? []) as Activity[];
}

export async function getActivityByIdFromDb(id: string): Promise<Activity | null> {
  const { data, error } = await createAdminClient()
    .from('activities')
    .select(ACTIVITY_COLUMNS)
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return data as Activity;
}

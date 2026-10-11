import { createAdminClient } from '@/lib/supabase-admin';
import { isValidUuid } from '@/lib/validation';
import type { Activity } from '@/lib/types';

export const ACTIVITY_COLUMNS =
  'id, created_at, updated_at, title, type, start_date, location, latitude, longitude, distance, elevation, description, organizer_id, organizer_name, organizer_avatar, status, cancelled_at';

/** Sorties à venir et non annulées (fil d'actualité). */
export async function getUpcomingActivities(): Promise<Activity[]> {
  const { data, error } = await createAdminClient()
    .from('activities')
    .select(ACTIVITY_COLUMNS)
    .eq('status', 'active')
    .gt('start_date', new Date().toISOString())
    .order('start_date', { ascending: true })
    .limit(200);

  if (error) {
    console.error('Erreur getUpcomingActivities:', error);
    return [];
  }

  return (data ?? []) as Activity[];
}

export async function getActivityByIdFromDb(id: string): Promise<Activity | null> {
  if (!isValidUuid(id)) return null;

  const { data, error } = await createAdminClient()
    .from('activities')
    .select(ACTIVITY_COLUMNS)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Erreur getActivityByIdFromDb:', error);
    return null;
  }
  return (data as Activity | null) ?? null;
}

export async function getActivitiesByOrganizer(organizerId: string): Promise<Activity[]> {
  const { data, error } = await createAdminClient()
    .from('activities')
    .select(ACTIVITY_COLUMNS)
    .eq('organizer_id', organizerId)
    .order('start_date', { ascending: false });

  if (error) {
    console.error('Erreur getActivitiesByOrganizer:', error);
    return [];
  }
  return (data ?? []) as Activity[];
}

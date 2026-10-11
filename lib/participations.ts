import { createAdminClient } from '@/lib/supabase-admin';
import { DEFAULT_AVATAR, getUsersByIds } from '@/lib/users';
import type { Participation, ParticipationWithUser } from '@/lib/types';

async function enrichParticipations(
  participations: Participation[]
): Promise<ParticipationWithUser[]> {
  const userIds = Array.from(new Set(participations.map((p) => p.user_id)));
  const profiles = await getUsersByIds(userIds);
  const profileMap = new Map(profiles.map((p) => [p.id, p]));

  return participations.map((p) => {
    const profile = profileMap.get(p.user_id);
    return {
      ...p,
      user_name: profile?.name ?? 'Utilisateur',
      user_avatar: profile?.avatar_url ?? DEFAULT_AVATAR,
    };
  });
}

export async function getParticipationsForActivity(activityId: string): Promise<{
  pending: ParticipationWithUser[];
  approved: ParticipationWithUser[];
}> {
  const { data, error } = await createAdminClient()
    .from('participations')
    .select('*')
    .eq('activity_id', activityId);

  if (error) {
    console.error('Erreur getParticipationsForActivity:', error);
    return { pending: [], approved: [] };
  }

  const participations = await enrichParticipations((data ?? []) as Participation[]);
  return {
    pending: participations.filter((p) => p.status === 'pending'),
    approved: participations.filter((p) => p.status === 'approved'),
  };
}

export async function getUserParticipation(
  activityId: string,
  userId: string
): Promise<Participation | null> {
  const { data, error } = await createAdminClient()
    .from('participations')
    .select('*')
    .eq('activity_id', activityId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Erreur getUserParticipation:', error);
    return null;
  }
  return (data as Participation | null) ?? null;
}

export async function getApprovedParticipantsForActivities(
  activityIds: string[]
): Promise<Record<string, ParticipationWithUser[]>> {
  if (activityIds.length === 0) return {};

  const { data, error } = await createAdminClient()
    .from('participations')
    .select('*')
    .in('activity_id', activityIds)
    .eq('status', 'approved');

  if (error) {
    console.error('Erreur getApprovedParticipantsForActivities:', error);
    return {};
  }

  const enriched = await enrichParticipations((data ?? []) as Participation[]);
  const map: Record<string, ParticipationWithUser[]> = {};
  for (const p of enriched) {
    (map[p.activity_id] ??= []).push(p);
  }
  return map;
}

/** Participants (acceptés et en attente) à prévenir d'une modification. */
export async function getParticipantIdsToNotify(activityId: string): Promise<string[]> {
  const { data, error } = await createAdminClient()
    .from('participations')
    .select('user_id')
    .eq('activity_id', activityId)
    .in('status', ['pending', 'approved']);

  if (error) {
    console.error('Erreur getParticipantIdsToNotify:', error);
    return [];
  }
  return (data ?? []).map((row) => row.user_id as string);
}

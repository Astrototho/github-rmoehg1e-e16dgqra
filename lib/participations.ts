import { createAdminClient } from '@/lib/supabase-admin';
import { DEFAULT_AVATAR } from '@/lib/users';
import type { Participation, ParticipationWithUser } from '@/lib/types';

// Le profil du participant est joint dans la même requête (FK
// participations.user_id → profiles.id) : un seul aller-retour vers la base.
const WITH_PROFILE = '*, profiles(name, avatar_url)';

type RowWithProfile = Participation & {
  profiles: { name: string | null; avatar_url: string | null } | null;
};

function withUser(rows: RowWithProfile[]): ParticipationWithUser[] {
  return rows.map(({ profiles, ...p }) => ({
    ...p,
    user_name: profiles?.name ?? 'Utilisateur',
    user_avatar: profiles?.avatar_url ?? DEFAULT_AVATAR,
  }));
}

/** Participations d'une sortie ; `mine` évite une requête de plus sur la page détail. */
export async function getParticipationsForActivity(
  activityId: string,
  viewerId?: string | null
): Promise<{
  pending: ParticipationWithUser[];
  approved: ParticipationWithUser[];
  mine: Participation | null;
}> {
  const { data, error } = await createAdminClient()
    .from('participations')
    .select(WITH_PROFILE)
    .eq('activity_id', activityId);

  if (error) {
    console.error('Erreur getParticipationsForActivity:', error);
    return { pending: [], approved: [], mine: null };
  }

  const participations = withUser((data ?? []) as RowWithProfile[]);
  const mine = viewerId ? participations.find((p) => p.user_id === viewerId) : undefined;
  return {
    pending: participations.filter((p) => p.status === 'pending'),
    approved: participations.filter((p) => p.status === 'approved'),
    mine: mine ?? null,
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
    .select(WITH_PROFILE)
    .in('activity_id', activityIds)
    .eq('status', 'approved');

  if (error) {
    console.error('Erreur getApprovedParticipantsForActivities:', error);
    return {};
  }

  const enriched = withUser((data ?? []) as RowWithProfile[]);
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

/** Statut de la demande du visiteur pour chaque sortie (badge sur le fil). */
export async function getViewerParticipationStatuses(
  userId: string,
  activityIds: string[]
): Promise<Record<string, 'pending' | 'approved'>> {
  if (activityIds.length === 0) return {};
  const { data, error } = await createAdminClient()
    .from('participations')
    .select('activity_id, status')
    .eq('user_id', userId)
    .in('activity_id', activityIds)
    .in('status', ['pending', 'approved']);

  if (error) {
    console.error('Erreur getViewerParticipationStatuses:', error);
    return {};
  }
  return Object.fromEntries(
    (data ?? []).map((row) => [row.activity_id as string, row.status as 'pending' | 'approved'])
  );
}

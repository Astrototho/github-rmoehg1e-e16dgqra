import { createAdminClient } from '@/lib/supabase-admin';
import { fetchStravaActivities, type StravaActivitySummary } from '@/lib/strava';
import type { ActivityType } from '@/lib/types';

// Correspondance type Strava → famille de sport interne à l'app.
// Isolée pour être ajustable sans toucher au reste du calcul.
export const SPORT_TYPE_TO_FAMILY: Record<string, ActivityType> = {
  Run: 'course-a-pied',
  TrailRun: 'trail',
  MountainBikeRide: 'vtt',
  EMountainBikeRide: 'vtt',
  GravelRide: 'velo-route',
  Ride: 'velo',
  VirtualRide: 'velo',
  EBikeRide: 'velo',
  Handcycle: 'velo',
  Velomobile: 'velo',
};

// Sous ce seuil d'activités pour une famille de sport, on considère qu'il n'y
// a pas assez de données pour un score fiable.
const MIN_ACTIVITIES_PER_FAMILY = 2;

export interface SportFamilyIndices {
  sportFamily: ActivityType;
  avgSpeedMps: number;
  avgMovingTimeS: number;
  avgElevationGainM: number;
  avgChillIndex: number; // part du temps arrêté / temps total, 0..1
  sampleSize: number;
}

export function mapToSportFamily(
  activity: StravaActivitySummary
): ActivityType | null {
  return (
    SPORT_TYPE_TO_FAMILY[activity.sport_type] ??
    SPORT_TYPE_TO_FAMILY[activity.type] ??
    null
  );
}

export function computeIndicesBySportFamily(
  activities: StravaActivitySummary[]
): SportFamilyIndices[] {
  const groups = new Map<ActivityType, StravaActivitySummary[]>();

  for (const activity of activities) {
    const family = mapToSportFamily(activity);
    if (!family || !activity.elapsed_time || activity.elapsed_time <= 0) {
      continue;
    }
    const group = groups.get(family) ?? [];
    group.push(activity);
    groups.set(family, group);
  }

  const result: SportFamilyIndices[] = [];
  for (const [sportFamily, acts] of Array.from(groups.entries())) {
    if (acts.length < MIN_ACTIVITIES_PER_FAMILY) continue;

    const n = acts.length;
    result.push({
      sportFamily,
      avgSpeedMps: acts.reduce((sum, a) => sum + a.average_speed, 0) / n,
      avgMovingTimeS: acts.reduce((sum, a) => sum + a.moving_time, 0) / n,
      avgElevationGainM:
        acts.reduce((sum, a) => sum + a.total_elevation_gain, 0) / n,
      avgChillIndex:
        acts.reduce(
          (sum, a) => sum + (a.elapsed_time - a.moving_time) / a.elapsed_time,
          0
        ) / n,
      sampleSize: n,
    });
  }

  return result;
}

export async function refreshPerformanceProfile(
  userId: string,
  accessToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const activities = await fetchStravaActivities(accessToken, 30);
    const indices = computeIndicesBySportFamily(activities);
    const admin = createAdminClient();

    // On repart d'une base propre à chaque rafraîchissement : si une famille
    // de sport n'a plus assez de données récentes, on retire l'ancienne ligne
    // plutôt que de laisser un score périmé (au plus 5 lignes/utilisateur).
    await admin.from('performance_profiles').delete().eq('user_id', userId);

    if (indices.length > 0) {
      const { error } = await admin.from('performance_profiles').upsert(
        indices.map((i) => ({
          user_id: userId,
          sport_family: i.sportFamily,
          avg_speed_mps: i.avgSpeedMps,
          avg_moving_time_s: i.avgMovingTimeS,
          avg_elevation_gain_m: i.avgElevationGainM,
          avg_chill_index: i.avgChillIndex,
          sample_size: i.sampleSize,
          computed_at: new Date().toISOString(),
        })),
        { onConflict: 'user_id,sport_family' }
      );
      if (error) throw error;
    }

    return { success: true };
  } catch (err) {
    console.error('Erreur refreshPerformanceProfile:', err);
    return { success: false, error: String(err) };
  }
}

export async function getPerformanceProfilesForUsers(
  userIds: string[]
): Promise<Record<string, SportFamilyIndices[]>> {
  if (userIds.length === 0) return {};

  const { data, error } = await createAdminClient()
    .from('performance_profiles')
    .select('*')
    .in('user_id', userIds);

  if (error || !data) return {};

  const map: Record<string, SportFamilyIndices[]> = {};
  for (const row of data) {
    const list = map[row.user_id] ?? [];
    list.push({
      sportFamily: row.sport_family,
      avgSpeedMps: row.avg_speed_mps,
      avgMovingTimeS: row.avg_moving_time_s,
      avgElevationGainM: row.avg_elevation_gain_m,
      avgChillIndex: row.avg_chill_index,
      sampleSize: row.sample_size,
    });
    map[row.user_id] = list;
  }
  return map;
}

export async function hasActivityScopeConnected(
  userId: string
): Promise<boolean> {
  const { data, error } = await createAdminClient()
    .from('strava_tokens')
    .select('scope')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) return false;
  const scope = data.scope ?? '';
  return scope.includes('activity:read_all') || scope.includes('activity:read');
}

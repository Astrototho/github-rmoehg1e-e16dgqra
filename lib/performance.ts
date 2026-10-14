import { createAdminClient } from '@/lib/supabase-admin';
import { fetchStravaActivities, type StravaActivitySummary } from '@/lib/strava';
import { getValidStravaAccessToken } from '@/lib/strava-tokens';
import type { ActivityType } from '@/lib/sports';
import { effortKm } from '@/lib/effort';
import { isValidUserId } from '@/lib/validation';

// Correspondance type Strava → famille de sport interne à l'app.
// Isolée pour être ajustable sans toucher au reste du calcul. Vélos à
// assistance électrique, home-trainer virtuel, vélomobile et handbike sont
// volontairement absents : ils fausseraient le rythme.
export const SPORT_TYPE_TO_FAMILY: Record<string, ActivityType> = {
  Run: 'course-a-pied',
  TrailRun: 'trail',
  MountainBikeRide: 'vtt',
  GravelRide: 'velo-route',
  Ride: 'velo-route',
};

const EXCLUDED_SPORT_TYPES = new Set([
  'EBikeRide',
  'EMountainBikeRide',
  'VirtualRide',
  'VirtualRun',
  'Velomobile',
  'Handcycle',
]);

// Sous ce seuil d'activités pour une famille de sport, on considère qu'il n'y
// a pas assez de données pour un score fiable.
const MIN_ACTIVITIES_PER_FAMILY = 2;
// Activités trop courtes (échauffement, test de montre) ignorées.
const MIN_MOVING_TIME_S = 10 * 60;
// En course à pied, sous 6,5 km/h il s'agit de marche.
const MIN_RUN_SPEED_MPS = 6.5 / 3.6;

// Le profil est recalculé au plus une fois par jour (appels API Strava limités).
const PROFILE_MAX_AGE_MS = 24 * 60 * 60 * 1000;
// Données dérivées de Strava : conservées 48 h au plus (règles de l'API
// Strava), puis ignorées et purgées.
export const PROFILE_TTL_MS = 48 * 60 * 60 * 1000;
// Version du calcul : un profil d'une version antérieure est recalculé à la
// visite suivante, sans attendre 24 h.
export const PROFILE_VERSION = 'v2';
// Après un échec (quota, réseau), nouvel essai possible au bout d'1 h.
const RETRY_AFTER_FAILURE_MS = 60 * 60 * 1000;

export interface SportFamilyIndices {
  sportFamily: ActivityType;
  /** Rythme corrigé du dénivelé : km-effort par heure de mouvement (médiane). */
  effortSpeedKmh: number;
  /** Durée habituelle d'une sortie, en secondes (médiane). */
  avgMovingTimeS: number;
  /** Profil de terrain : mètres de D+ par km (médiane). */
  climbMPerKm: number;
  /** Part du temps passé à l'arrêt, 0..1 (médiane) : style "pauses". */
  avgChillIndex: number;
  /** Capacité : 90e centile des km-effort et du D+ par sortie. */
  p90EffortKm: number;
  p90ElevationGainM: number;
  sampleSize: number;
}

export function mapToSportFamily(
  activity: StravaActivitySummary
): ActivityType | null {
  if (EXCLUDED_SPORT_TYPES.has(activity.sport_type)) return null;
  return (
    SPORT_TYPE_TO_FAMILY[activity.sport_type] ??
    SPORT_TYPE_TO_FAMILY[activity.type] ??
    null
  );
}

/** Activité exploitable pour le profil (filtres de qualité). */
export function isUsableActivity(activity: StravaActivitySummary, family: ActivityType): boolean {
  if (activity.trainer || activity.commute || activity.manual) return false;
  if (!activity.elapsed_time || activity.elapsed_time <= 0) return false;
  if (!activity.moving_time || activity.moving_time < MIN_MOVING_TIME_S) return false;
  if (!activity.distance || activity.distance <= 0) return false;
  if (family === 'course-a-pied' && activity.average_speed < MIN_RUN_SPEED_MPS) return false;
  return true;
}

function quantile(values: number[], q: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

const median = (values: number[]) => quantile(values, 0.5);

export function computeIndicesBySportFamily(
  activities: StravaActivitySummary[]
): SportFamilyIndices[] {
  const groups = new Map<ActivityType, StravaActivitySummary[]>();

  for (const activity of activities) {
    const family = mapToSportFamily(activity);
    if (!family || !isUsableActivity(activity, family)) continue;
    const group = groups.get(family) ?? [];
    group.push(activity);
    groups.set(family, group);
  }

  const result: SportFamilyIndices[] = [];
  for (const [sportFamily, acts] of Array.from(groups.entries())) {
    if (acts.length < MIN_ACTIVITIES_PER_FAMILY) continue;

    const efforts = acts.map((a) =>
      effortKm(sportFamily, a.distance / 1000, a.total_elevation_gain || 0)
    );
    result.push({
      sportFamily,
      effortSpeedKmh: median(acts.map((a, i) => efforts[i] / (a.moving_time / 3600))),
      avgMovingTimeS: median(acts.map((a) => a.moving_time)),
      climbMPerKm: median(acts.map((a) => (a.total_elevation_gain || 0) / (a.distance / 1000))),
      avgChillIndex: median(
        acts.map((a) => Math.max(0, a.elapsed_time - a.moving_time) / a.elapsed_time)
      ),
      p90EffortKm: quantile(efforts, 0.9),
      p90ElevationGainM: quantile(
        acts.map((a) => a.total_elevation_gain || 0),
        0.9
      ),
      sampleSize: acts.length,
    });
  }

  return result;
}

export async function refreshPerformanceProfile(
  userId: string,
  accessToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const activities = await fetchStravaActivities(accessToken);
    const indices = computeIndicesBySportFamily(activities);
    const admin = createAdminClient();

    // On repart d'une base propre à chaque rafraîchissement : si une famille
    // de sport n'a plus assez de données récentes, on retire l'ancienne ligne
    // plutôt que de laisser un score périmé (au plus 4 lignes/utilisateur).
    await admin.from('performance_profiles').delete().eq('user_id', userId);

    if (indices.length > 0) {
      const { error } = await admin.from('performance_profiles').upsert(
        indices.map((i) => ({
          user_id: userId,
          sport_family: i.sportFamily,
          // Colonnes v1 (NOT NULL) gardées pour compatibilité.
          avg_speed_mps: i.effortSpeedKmh / 3.6,
          avg_moving_time_s: i.avgMovingTimeS,
          avg_elevation_gain_m: i.p90ElevationGainM,
          avg_chill_index: i.avgChillIndex,
          effort_speed_kmh: i.effortSpeedKmh,
          climb_m_per_km: i.climbMPerKm,
          p90_effort_km: i.p90EffortKm,
          p90_elevation_gain_m: i.p90ElevationGainM,
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
    // Nouvel essai possible dans 1 h au lieu de 24 h.
    await createAdminClient()
      .from('strava_tokens')
      .update({
        last_profile_refresh_at: new Date(
          Date.now() - PROFILE_MAX_AGE_MS + RETRY_AFTER_FAILURE_MS
        ).toISOString(),
      })
      .eq('user_id', userId);
    return { success: false, error: String(err) };
  }
}

/**
 * Réserve le rafraîchissement de façon atomique : une seule requête (même
 * si plusieurs rendus arrivent en même temps) obtient le droit d'appeler
 * Strava, au plus une fois par 24 h (ou tout de suite après un changement
 * de version du calcul).
 */
async function claimProfileRefresh(userId: string): Promise<boolean> {
  const staleBefore = new Date(Date.now() - PROFILE_MAX_AGE_MS).toISOString();
  const { data, error } = await createAdminClient()
    .from('strava_tokens')
    .update({
      last_profile_refresh_at: new Date().toISOString(),
      profile_version: PROFILE_VERSION,
    })
    .eq('user_id', userId)
    .or(
      `last_profile_refresh_at.is.null,last_profile_refresh_at.lt.${staleBefore},profile_version.is.null,profile_version.neq.${PROFILE_VERSION}`
    )
    .select('user_id');
  return !error && (data?.length ?? 0) > 0;
}

/**
 * Recalcule le profil de performance si la dernière tentative date de plus de
 * 24 h. Pensé pour être lancé en tâche de fond (runInBackground).
 */
export async function refreshPerformanceProfileIfStale(userId: string) {
  if (!isValidUserId(userId)) return;
  if (!(await claimProfileRefresh(userId))) return;

  const accessToken = await getValidStravaAccessToken(userId);
  if (!accessToken) return;
  await refreshPerformanceProfile(userId, accessToken);
}

/**
 * Rafraîchit en tâche de fond les profils de plusieurs utilisateurs (ex. les
 * organisateurs du fil) et purge les profils expirés.
 */
export async function refreshProfilesInBackground(userIds: string[], max = 5) {
  await createAdminClient()
    .from('performance_profiles')
    .delete()
    .lt('computed_at', new Date(Date.now() - PROFILE_TTL_MS).toISOString());
  for (const id of userIds.slice(0, max)) {
    await refreshPerformanceProfileIfStale(id);
  }
}

export async function getPerformanceProfilesForUsers(
  userIds: string[]
): Promise<Record<string, SportFamilyIndices[]>> {
  if (userIds.length === 0) return {};

  const { data, error } = await createAdminClient()
    .from('performance_profiles')
    .select(
      'user_id, sport_family, effort_speed_kmh, avg_moving_time_s, climb_m_per_km, avg_chill_index, p90_effort_km, p90_elevation_gain_m, sample_size'
    )
    .in('user_id', userIds)
    .not('effort_speed_kmh', 'is', null)
    .gt('computed_at', new Date(Date.now() - PROFILE_TTL_MS).toISOString());

  if (error || !data) return {};

  const map: Record<string, SportFamilyIndices[]> = {};
  for (const row of data) {
    const list = map[row.user_id] ?? [];
    list.push({
      sportFamily: row.sport_family,
      effortSpeedKmh: Number(row.effort_speed_kmh),
      avgMovingTimeS: Number(row.avg_moving_time_s),
      climbMPerKm: Number(row.climb_m_per_km),
      avgChillIndex: Number(row.avg_chill_index),
      p90EffortKm: Number(row.p90_effort_km),
      p90ElevationGainM: Number(row.p90_elevation_gain_m),
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

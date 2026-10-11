import { getPerformanceProfilesForUsers } from '@/lib/performance';
import { computeMatchPercentage } from '@/lib/matching';
import { haversineDistanceKm } from '@/lib/distance';
import { getUsersByIds } from '@/lib/users';
import type { Activity, ActivityType, AppUser } from '@/lib/types';

/** % de match entre le visiteur et l'organisateur de chaque sortie. */
export async function getMatchPercentages(
  viewer: AppUser | null,
  activities: Pick<Activity, 'id' | 'organizer_id' | 'type'>[]
): Promise<Record<string, number>> {
  if (!viewer || activities.length === 0) return {};

  try {
    const organizerIds = Array.from(new Set(activities.map((a) => a.organizer_id)));
    const allUserIds = Array.from(new Set([viewer.id, ...organizerIds]));

    const [profilesByUser, geoProfiles] = await Promise.all([
      getPerformanceProfilesForUsers(allUserIds),
      getUsersByIds(allUserIds),
    ]);

    const geoMap = new Map(geoProfiles.map((p) => [p.id, p]));
    const viewerGeo = geoMap.get(viewer.id) ?? {};
    const viewerFamilies = new Map(
      (profilesByUser[viewer.id] ?? []).map((p) => [p.sportFamily, p])
    );

    const map: Record<string, number> = {};
    for (const act of activities) {
      if (act.organizer_id === viewer.id) continue;

      const organizerFamilies = new Map(
        (profilesByUser[act.organizer_id] ?? []).map((p) => [p.sportFamily, p])
      );
      const pct = computeMatchPercentage(
        viewerFamilies.get(act.type as ActivityType),
        organizerFamilies.get(act.type as ActivityType),
        viewerGeo,
        geoMap.get(act.organizer_id) ?? {}
      );
      if (pct !== null) map[act.id] = pct;
    }
    return map;
  } catch (err) {
    console.error('Erreur getMatchPercentages:', err);
    return {};
  }
}

/** Distance (km, à vol d'oiseau) entre la ville du visiteur et chaque départ. */
export function getDistancesFromViewer(
  viewer: AppUser | null,
  activities: Pick<Activity, 'id' | 'latitude' | 'longitude'>[]
): Record<string, number> {
  if (!viewer || viewer.latitude == null || viewer.longitude == null) return {};

  const map: Record<string, number> = {};
  for (const act of activities) {
    if (act.latitude == null || act.longitude == null) continue;
    const km = haversineDistanceKm(
      Number(viewer.latitude),
      Number(viewer.longitude),
      Number(act.latitude),
      Number(act.longitude)
    );
    map[act.id] = Math.round(km * 10) / 10;
  }
  return map;
}

/**
 * Ordre du fil : % de match décroissant, puis date de départ. Les sorties
 * sans % (pas assez de données Strava d'un côté ou de l'autre) passent après.
 */
export function sortFeed<T extends Pick<Activity, 'id' | 'start_date'>>(
  activities: T[],
  matchMap: Record<string, number>
): T[] {
  return [...activities].sort((a, b) => {
    const ma = matchMap[a.id];
    const mb = matchMap[b.id];
    if (ma != null && mb != null && ma !== mb) return mb - ma;
    if (ma != null && mb == null) return -1;
    if (ma == null && mb != null) return 1;
    return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
  });
}

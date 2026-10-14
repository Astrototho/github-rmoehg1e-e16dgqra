import { getPerformanceProfilesForUsers, refreshProfilesInBackground } from '@/lib/performance';
import { runInBackground } from '@/lib/background';
import { isActivityType } from '@/lib/sports';
import { computeMatch, type MatchResult } from '@/lib/matching';
import { haversineDistanceKm } from '@/lib/distance';
import { getUsersByIds } from '@/lib/users';
import type { Activity, AppUser } from '@/lib/types';

/**
 * % de match entre le visiteur et l'organisateur de chaque sortie (rythme et
 * style des deux personnes, puis faisabilité de la sortie pour le visiteur).
 * Les profils manquants ou périmés des organisateurs sont recalculés en tâche
 * de fond : leur % apparaît au chargement suivant.
 */
export async function getMatchPercentages(
  viewer: AppUser | null,
  activities: Pick<Activity, 'id' | 'organizer_id' | 'type' | 'distance' | 'elevation'>[]
): Promise<Record<string, MatchResult>> {
  if (!viewer || activities.length === 0) return {};

  try {
    const organizerIds = Array.from(new Set(activities.map((a) => a.organizer_id)));
    const allUserIds = Array.from(new Set([viewer.id, ...organizerIds]));

    const [profilesByUser, geoProfiles] = await Promise.all([
      getPerformanceProfilesForUsers(allUserIds),
      getUsersByIds(allUserIds),
    ]);

    const missing = organizerIds.filter((id) => !profilesByUser[id]);
    if (missing.length > 0) {
      runInBackground('profils des organisateurs', () => refreshProfilesInBackground(missing));
    }

    const geoMap = new Map(geoProfiles.map((p) => [p.id, p]));
    const viewerGeo = geoMap.get(viewer.id) ?? {};
    const viewerFamilies = new Map(
      (profilesByUser[viewer.id] ?? []).map((p) => [p.sportFamily, p])
    );

    const map: Record<string, MatchResult> = {};
    for (const act of activities) {
      if (act.organizer_id === viewer.id || !isActivityType(act.type)) continue;

      const organizerFamilies = new Map(
        (profilesByUser[act.organizer_id] ?? []).map((p) => [p.sportFamily, p])
      );
      const result = computeMatch(
        viewerFamilies.get(act.type),
        organizerFamilies.get(act.type),
        viewerGeo,
        geoMap.get(act.organizer_id) ?? {},
        { type: act.type, distanceKm: Number(act.distance), elevationM: Number(act.elevation) }
      );
      if (result) map[act.id] = result;
    }
    return map;
  } catch (err) {
    console.error('Erreur getMatchPercentages:', err);
    return {};
  }
}

export interface ReferencePoint {
  latitude: number;
  longitude: number;
}

/** Point de référence du visiteur, transmis par le cookie "pc_pos" ("lat,lng"). */
export function parsePositionCookie(value: string | undefined): ReferencePoint | null {
  if (!value) return null;
  const [lat, lng] = value.split(',').map(Number);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { latitude: lat, longitude: lng };
}

/** Distance (km, à vol d'oiseau) entre le point de référence et chaque départ. */
export function getDistancesFromViewer(
  reference: ReferencePoint | null,
  activities: Pick<Activity, 'id' | 'latitude' | 'longitude'>[]
): Record<string, number> {
  if (!reference) return {};

  const map: Record<string, number> = {};
  for (const act of activities) {
    if (act.latitude == null || act.longitude == null) continue;
    const km = haversineDistanceKm(
      reference.latitude,
      reference.longitude,
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

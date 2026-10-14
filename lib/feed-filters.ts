import { parisDayKey } from '@/lib/dates';
import { isActivityType, type ActivityType } from '@/lib/sports';

// Filtres du fil, portés par l'URL (?sport=trail&quand=weekend&rayon=25) :
// rendus côté serveur, partageables, et le bouton retour fonctionne.

export const WHEN_OPTIONS = [
  { value: 'today', label: "Aujourd'hui" },
  { value: 'tomorrow', label: 'Demain' },
  { value: 'weekend', label: 'Ce week-end' },
  { value: 'week', label: '7 prochains jours' },
] as const;
export type WhenFilter = (typeof WHEN_OPTIONS)[number]['value'];

export const RADIUS_OPTIONS = [5, 10, 25, 50] as const;
export type RadiusFilter = (typeof RADIUS_OPTIONS)[number];

export interface FeedFilters {
  sport?: ActivityType;
  when?: WhenFilter;
  radius?: RadiusFilter;
}

type RawParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseFeedFilters(params: RawParams): FeedFilters {
  const sport = first(params.sport);
  const when = first(params.quand);
  const radius = Number(first(params.rayon));
  return {
    sport: isActivityType(sport) ? sport : undefined,
    when: WHEN_OPTIONS.some((o) => o.value === when) ? (when as WhenFilter) : undefined,
    radius: (RADIUS_OPTIONS as readonly number[]).includes(radius)
      ? (radius as RadiusFilter)
      : undefined,
  };
}

/** Lien vers le fil avec un filtre modifié (undefined = retiré). */
export function feedHref(filters: FeedFilters, patch: Partial<FeedFilters>): string {
  const next = { ...filters, ...patch };
  const params = new URLSearchParams();
  if (next.sport) params.set('sport', next.sport);
  if (next.when) params.set('quand', next.when);
  if (next.radius) params.set('rayon', String(next.radius));
  const query = params.toString();
  return query ? `/?${query}` : '/';
}

function addDays(dayKey: string, days: number): string {
  const [y, m, d] = dayKey.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** Jours (AAAA-MM-JJ, heure de Paris) couverts par un filtre de date. */
export function daysForWhen(when: WhenFilter, now: Date = new Date()): Set<string> {
  const today = parisDayKey(now);
  const weekday = new Date(`${today}T12:00:00Z`).getUTCDay(); // 0 = dimanche
  switch (when) {
    case 'today':
      return new Set([today]);
    case 'tomorrow':
      return new Set([addDays(today, 1)]);
    case 'weekend': {
      if (weekday === 0) return new Set([today]);
      const saturday = addDays(today, weekday === 6 ? 0 : 6 - weekday);
      return new Set([saturday, addDays(saturday, 1)]);
    }
    case 'week':
      return new Set(Array.from({ length: 7 }, (_, i) => addDays(today, i)));
  }
}

interface Filterable {
  id: string;
  type: string;
  start_date: string;
}

/**
 * Sorties qui passent les filtres. Le rayon n'élimine que les sorties dont
 * la distance est connue (pas de point de référence : filtre ignoré).
 */
export function applyFeedFilters<T extends Filterable>(
  activities: T[],
  filters: FeedFilters,
  distances: Record<string, number>,
  now: Date = new Date()
): T[] {
  const days = filters.when ? daysForWhen(filters.when, now) : null;
  const hasReference = Object.keys(distances).length > 0;
  return activities.filter((a) => {
    if (filters.sport && a.type !== filters.sport) return false;
    if (days && !days.has(parisDayKey(a.start_date))) return false;
    if (filters.radius && hasReference) {
      const km = distances[a.id];
      if (km == null || km > filters.radius) return false;
    }
    return true;
  });
}

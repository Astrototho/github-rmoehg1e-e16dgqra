import type { ActivityType } from '@/lib/sports';

// Effort et durée estimés d'une sortie à partir de sa distance et de son D+
// uniquement (aucune donnée Strava) : affichés à tout le monde sur les blocs.
// Seuils et vitesses de référence isolés pour pouvoir être recalibrés.
export const EFFORT_MODEL_VERSION = 'v1';

// Équivalence D+ → km à plat (km-effort). Pied : convention ITRA (100 m = 1 km).
const METERS_PER_EFFORT_KM: Record<ActivityType, number> = {
  trail: 100,
  'course-a-pied': 100,
  'velo-route': 50,
  vtt: 40,
};

// Bornes Facile | Modéré | Soutenu | Costaud (en km-effort).
const EFFORT_THRESHOLDS: Record<ActivityType, [number, number, number]> = {
  trail: [20, 35, 55],
  'course-a-pied': [12, 21, 35],
  'velo-route': [50, 90, 140],
  vtt: [25, 45, 70],
};

export const EFFORT_LABELS = ['Facile', 'Modéré', 'Soutenu', 'Costaud'] as const;
export type EffortLevel = 0 | 1 | 2 | 3;

export function effortKm(type: ActivityType, distanceKm: number, elevationM: number): number {
  return distanceKm + elevationM / METERS_PER_EFFORT_KM[type];
}

export function effortLevel(type: ActivityType, distanceKm: number, elevationM: number): EffortLevel {
  const score = effortKm(type, distanceKm, elevationM);
  const [a, b, c] = EFFORT_THRESHOLDS[type];
  if (score < a) return 0;
  if (score < b) return 1;
  if (score < c) return 2;
  return 3;
}

/** Durée estimée pour un rythme moyen, en minutes, arrondie au quart d'heure. */
export function estimatedDurationMinutes(
  type: ActivityType,
  distanceKm: number,
  elevationM: number
): number {
  let hours: number;
  switch (type) {
    case 'trail':
      hours = effortKm(type, distanceKm, elevationM) / 8;
      break;
    case 'course-a-pied':
      hours = effortKm(type, distanceKm, elevationM) / 10;
      break;
    case 'velo-route':
      hours = distanceKm / 26 + elevationM / 1200;
      break;
    case 'vtt':
      hours = distanceKm / 14 + elevationM / 800;
      break;
  }
  return Math.max(15, Math.round((hours * 60) / 15) * 15);
}

/** "≈ 3 h 30", "≈ 45 min" */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, '0')}`;
}

import type { SportFamilyIndices } from '@/lib/performance';
import type { ActivityType } from '@/lib/sports';
import { effortKm } from '@/lib/effort';

// Version de la formule : enregistrée avec chaque demande de participation
// (participations.matching_version) pour relier les retours terrain à la
// formule qui a produit le % affiché. À incrémenter à chaque changement de
// poids ou de calcul.
export const MATCHING_VERSION = 'v2-pace-style-feasibility';

// -----------------------------------------------------------------------------
// v2 : on fait matcher deux PERSONNES (rythme et style), puis on vérifie que
// la sortie proposée est à la portée du visiteur.
//
// 1. Affinité (0..1) entre le visiteur et l'organisateur, sport par sport :
//    - rythme corrigé du dénivelé (km-effort/h) : le critère principal ;
//    - profil de terrain (D+ par km) : roulant ou montagne ;
//    - durée habituelle des sorties ;
//    - pauses (part du temps à l'arrêt) : non-stop ou contemplatif.
//    Chaque critère est une gaussienne de l'écart, tolérance propre au sport.
// 2. Faisabilité (0..1) : la sortie (km-effort et D+) comparée au 90e centile
//    des sorties du visiteur. Au-delà de +15 %, le score chute rapidement :
//    une sortie de 2 000 m D+ ne peut pas afficher 90 % à quelqu'un qui n'en
//    fait jamais plus de 800.
// % = (100 × affinité + bonus géo) × faisabilité.
//
// Tous les paramètres sont regroupés ici pour pouvoir être recalibrés.
// -----------------------------------------------------------------------------

export const WEIGHTS = { pace: 0.55, terrain: 0.2, duration: 0.15, pauses: 0.1 };

// Écart-type sur ln(rapport des rythmes). En vélo de route l'aspiration
// absorbe davantage d'écart ; en course à pied, 20 % d'écart, c'est trop.
const PACE_TOLERANCE: Record<ActivityType, number> = {
  trail: 0.15,
  'course-a-pied': 0.12,
  'velo-route': 0.18,
  vtt: 0.16,
};
const TERRAIN_TOLERANCE = 0.5; // sur ln((D+/km + 5) / (D+/km + 5))
const DURATION_TOLERANCE = 0.45; // sur ln(rapport des durées)
const PAUSES_TOLERANCE = 0.12; // sur l'écart de part du temps à l'arrêt

// Faisabilité : marge tolérée au-dessus des sorties habituelles, largeur de
// la chute, et plancher (le % reste visible mais très bas).
const FEASIBILITY_COMFORT = 1.15;
const FEASIBILITY_WIDTH = 0.45;
const FEASIBILITY_FLOOR = 0.15;
// D+ minimal considéré comme "faisable" quel que soit l'historique (un
// coureur sur route peut faire 150 m de D+ même s'il n'en fait jamais).
const MIN_CLIMB_CAPACITY_M: Record<ActivityType, number> = {
  trail: 300,
  'course-a-pied': 150,
  'velo-route': 500,
  vtt: 400,
};
// Sous ce seuil de faisabilité, le visiteur voit une explication.
const HINT_FEASIBILITY_BELOW = 0.6;

// Bonus géo uniquement (jamais de pénalité), sur la ville du profil.
const GEO_BONUS_SAME_CITY = 5;
const GEO_BONUS_SAME_COUNTRY = 2;

function gauss(x: number, sigma: number): number {
  return Math.exp(-(x * x) / (2 * sigma * sigma));
}

function logRatio(a: number, b: number): number {
  return Math.log(Math.max(a, 1e-6) / Math.max(b, 1e-6));
}

export interface GeoInput {
  city?: string | null;
  country?: string | null;
}

function normalize(value?: string | null): string | null {
  return value ? value.trim().toLowerCase() : null;
}

export function computeGeoBonus(viewer: GeoInput, organizer: GeoInput): number {
  const viewerCity = normalize(viewer.city);
  const organizerCity = normalize(organizer.city);
  if (viewerCity && organizerCity && viewerCity === organizerCity) {
    return GEO_BONUS_SAME_CITY;
  }

  const viewerCountry = normalize(viewer.country);
  const organizerCountry = normalize(organizer.country);
  if (viewerCountry && organizerCountry && viewerCountry === organizerCountry) {
    return GEO_BONUS_SAME_COUNTRY;
  }

  return 0;
}

/** Affinité de rythme et de style entre deux sportifs d'un même sport (0..1). */
export function computeAffinity(viewer: SportFamilyIndices, organizer: SportFamilyIndices): number {
  const sport = viewer.sportFamily;
  const pace = gauss(logRatio(viewer.effortSpeedKmh, organizer.effortSpeedKmh), PACE_TOLERANCE[sport]);
  const terrain = gauss(
    Math.log((viewer.climbMPerKm + 5) / (organizer.climbMPerKm + 5)),
    TERRAIN_TOLERANCE
  );
  const duration = gauss(logRatio(viewer.avgMovingTimeS, organizer.avgMovingTimeS), DURATION_TOLERANCE);
  const pauses = gauss(viewer.avgChillIndex - organizer.avgChillIndex, PAUSES_TOLERANCE);
  return (
    WEIGHTS.pace * pace +
    WEIGHTS.terrain * terrain +
    WEIGHTS.duration * duration +
    WEIGHTS.pauses * pauses
  );
}

export interface OutingInput {
  type: ActivityType;
  distanceKm: number;
  elevationM: number;
}

/** La sortie est-elle à la portée du visiteur ? 1 = oui, plancher = clairement non. */
export function computeFeasibility(viewer: SportFamilyIndices, outing: OutingInput): number {
  const effortRatio =
    effortKm(outing.type, outing.distanceKm, outing.elevationM) / Math.max(viewer.p90EffortKm, 1);
  const climbRatio =
    outing.elevationM / Math.max(viewer.p90ElevationGainM, MIN_CLIMB_CAPACITY_M[outing.type]);
  const ratio = Math.max(effortRatio, climbRatio);
  if (ratio <= FEASIBILITY_COMFORT) return 1;
  return Math.max(FEASIBILITY_FLOOR, gauss(ratio - FEASIBILITY_COMFORT, FEASIBILITY_WIDTH));
}

export interface MatchResult {
  percentage: number;
  /** Explication pour le visiteur, fondée uniquement sur ses propres données. */
  hint?: string;
}

export function computeMatch(
  viewer: SportFamilyIndices | undefined,
  organizer: SportFamilyIndices | undefined,
  viewerGeo: GeoInput,
  organizerGeo: GeoInput,
  outing?: OutingInput
): MatchResult | null {
  if (!viewer || !organizer) return null;

  const affinity = computeAffinity(viewer, organizer);
  const feasibility = outing ? computeFeasibility(viewer, outing) : 1;
  const raw = (100 * affinity + computeGeoBonus(viewerGeo, organizerGeo)) * feasibility;

  return {
    percentage: Math.round(Math.min(100, Math.max(0, raw))),
    hint:
      feasibility < HINT_FEASIBILITY_BELOW
        ? 'Plus long ou plus de dénivelé que tes sorties habituelles'
        : undefined,
  };
}

/** % de match entre deux personnes, sans sortie précise (profil public). */
export function computeMatchPercentage(
  viewer: SportFamilyIndices | undefined,
  organizer: SportFamilyIndices | undefined,
  viewerGeo: GeoInput,
  organizerGeo: GeoInput
): number | null {
  return computeMatch(viewer, organizer, viewerGeo, organizerGeo)?.percentage ?? null;
}

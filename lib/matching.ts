import type { SportFamilyIndices } from '@/lib/performance';

// Poids égaux par défaut faute d'indication contraire — isolés pour être
// ajustables sans toucher au reste du calcul.
const WEIGHTS = { speed: 0.25, duration: 0.25, elevation: 0.25, chill: 0.25 };

// Bonus géo uniquement (jamais de pénalité) : sans géocodage (pas de lat/lng
// en base), impossible de distinguer "loin" de "juste écrit différemment
// mais proche" à partir de city/country en texte libre.
const GEO_BONUS_SAME_CITY = 5;
const GEO_BONUS_SAME_COUNTRY = 2;

function relativeCloseness(a: number, b: number): number {
  const denom = Math.max(Math.abs(a), Math.abs(b), 1e-6);
  return 1 - Math.min(Math.abs(a - b) / denom, 1);
}

function absoluteCloseness01(a: number, b: number): number {
  return 1 - Math.min(Math.abs(a - b), 1);
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

export function computeMatchPercentage(
  viewer: SportFamilyIndices | undefined,
  organizer: SportFamilyIndices | undefined,
  viewerGeo: GeoInput,
  organizerGeo: GeoInput
): number | null {
  if (!viewer || !organizer) return null;

  const speedScore = relativeCloseness(viewer.avgSpeedMps, organizer.avgSpeedMps);
  const durationScore = relativeCloseness(
    viewer.avgMovingTimeS,
    organizer.avgMovingTimeS
  );
  const elevationScore = relativeCloseness(
    viewer.avgElevationGainM,
    organizer.avgElevationGainM
  );
  const chillScore = absoluteCloseness01(
    viewer.avgChillIndex,
    organizer.avgChillIndex
  );

  const performanceScore =
    100 *
    (WEIGHTS.speed * speedScore +
      WEIGHTS.duration * durationScore +
      WEIGHTS.elevation * elevationScore +
      WEIGHTS.chill * chillScore);

  const geoBonus = computeGeoBonus(viewerGeo, organizerGeo);
  return Math.round(Math.min(100, Math.max(0, performanceScore + geoBonus)));
}

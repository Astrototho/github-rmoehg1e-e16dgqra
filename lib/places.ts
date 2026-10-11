/**
 * Forme canonique d'un nom de lieu, pour reconnaître "Fontaine au Lion",
 * "fontaine-au-lion" ou "  FONTAINE  AU LION " comme le même lieu enregistré :
 * sans casse, sans accents, ponctuation remplacée par des espaces, espaces
 * multiples réduits.
 */
export function normalizePlaceName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export const GRENOBLE_CENTER = { latitude: 45.1885, longitude: 5.7245 };

export function isValidCoordinate(latitude: unknown, longitude: unknown) {
  return (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

/** Liens "Itinéraire" vers les applications de navigation du téléphone. */
export function getDirectionsLinks(latitude: number, longitude: number) {
  const ll = `${latitude},${longitude}`;
  return {
    google: `https://www.google.com/maps/dir/?api=1&destination=${ll}`,
    apple: `https://maps.apple.com/?daddr=${ll}`,
    waze: `https://waze.com/ul?ll=${ll}&navigate=yes`,
  };
}

/** Centre de carte par défaut : ville du profil, sinon Grenoble. */
export function getFallbackCenter(user?: {
  latitude?: number | null;
  longitude?: number | null;
} | null) {
  if (user?.latitude != null && user?.longitude != null) {
    return { latitude: Number(user.latitude), longitude: Number(user.longitude) };
  }
  return GRENOBLE_CENTER;
}

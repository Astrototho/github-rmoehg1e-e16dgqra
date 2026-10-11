import { getSportLabel } from '@/lib/sports';

// Limites de saisie partagées par les formulaires (client) et la validation
// serveur (lib/validation.ts). Sans dépendance : importable côté client.
export const TITLE_MAX = 120;
export const PLACE_NAME_MAX = 120;
export const DESCRIPTION_MAX = 2000;
export const MESSAGE_MAX = 2000;

export const REPORT_REASONS = [
  'Comportement déplacé',
  'Message inapproprié',
  "Ne s'est pas présenté",
  'Autre',
] as const;

/** Titre généré quand l'organisateur n'en saisit pas. */
export function buildDefaultTitle(values: {
  type: string;
  distance: number;
  location: string;
}): string {
  const distance = Number(values.distance);
  const distanceLabel = Number.isInteger(distance)
    ? String(distance)
    : distance.toFixed(1).replace('.', ',');
  return `${getSportLabel(values.type)} ${distanceLabel} km · ${values.location}`.slice(
    0,
    TITLE_MAX
  );
}

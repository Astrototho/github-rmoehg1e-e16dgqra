import { z } from 'zod';
import { SPORT_VALUES } from '@/lib/sports';
import {
  DESCRIPTION_MAX,
  MESSAGE_MAX,
  PLACE_NAME_MAX,
  REPORT_REASONS,
  TITLE_MAX,
} from '@/lib/constraints';

export {
  DESCRIPTION_MAX,
  MESSAGE_MAX,
  PLACE_NAME_MAX,
  REPORT_REASONS,
  TITLE_MAX,
  buildDefaultTitle,
} from '@/lib/constraints';

// Identifiant utilisateur = ID athlète Strava (numérique). Toute valeur venant
// du client (paramètre d'URL, argument d'action) doit passer par ce schéma
// avant d'être utilisée dans une requête.
export const userIdSchema = z.string().regex(/^\d{1,20}$/, 'Identifiant invalide.');
export const uuidSchema = z.uuid('Identifiant invalide.');

export function isValidUserId(value: unknown): value is string {
  return userIdSchema.safeParse(value).success;
}

export function isValidUuid(value: unknown): value is string {
  return uuidSchema.safeParse(value).success;
}

const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} : ${max} caractères maximum.`)
    .optional()
    .transform((v) => (v ? v : null));

export const activityFormSchema = z.object({
  title: optionalText(TITLE_MAX, 'Titre'),
  type: z.enum(SPORT_VALUES, 'Choisis un sport.'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'La date est obligatoire.'),
  time: z.string().regex(/^\d{2}:\d{2}$/, "L'heure est obligatoire."),
  location: z
    .string('Le lieu de départ est obligatoire.')
    .trim()
    .min(1, 'Le lieu de départ est obligatoire.')
    .max(PLACE_NAME_MAX, `Lieu de départ : ${PLACE_NAME_MAX} caractères maximum.`),
  latitude: z.coerce
    .number('Place le point de départ sur la carte.')
    .min(-90, 'Point de départ invalide.')
    .max(90, 'Point de départ invalide.'),
  longitude: z.coerce
    .number('Place le point de départ sur la carte.')
    .min(-180, 'Point de départ invalide.')
    .max(180, 'Point de départ invalide.'),
  distance: z.coerce
    .number('La distance est obligatoire.')
    .gt(0, 'La distance doit être supérieure à 0.')
    .max(1000, 'Distance : 1000 km maximum.'),
  elevation: z.coerce
    .number('Le dénivelé est obligatoire.')
    .int('Le dénivelé doit être un nombre entier.')
    .min(0, 'Le dénivelé ne peut pas être négatif.')
    .max(20000, 'Dénivelé : 20000 m maximum.'),
  description: optionalText(DESCRIPTION_MAX, 'Description'),
});

export type ActivityFormValues = z.infer<typeof activityFormSchema>;

/**
 * Convertit un FormData en objet pour activityFormSchema : les champs vides
 * deviennent undefined (sinon z.coerce.number transformerait "" en 0).
 */
export function formDataToObject(formData: FormData): Record<string, string> {
  const result: Record<string, string> = {};
  formData.forEach((value, key) => {
    if (typeof value === 'string' && value.trim() !== '') result[key] = value;
  });
  return result;
}

export const messageContentSchema = z
  .string()
  .trim()
  .min(1, 'Le message est vide.')
  .max(MESSAGE_MAX, `Message : ${MESSAGE_MAX} caractères maximum.`);

export const reportSchema = z.object({
  activityId: uuidSchema.optional(),
  reportedId: userIdSchema,
  reason: z.enum(REPORT_REASONS, 'Motif invalide.'),
  description: optionalText(DESCRIPTION_MAX, 'Détails'),
});

export const placeNameSchema = z
  .string()
  .trim()
  .min(1, 'Le nom du lieu est obligatoire.')
  .max(PLACE_NAME_MAX, `Nom du lieu : ${PLACE_NAME_MAX} caractères maximum.`);

export function firstErrorMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Données invalides.';
}

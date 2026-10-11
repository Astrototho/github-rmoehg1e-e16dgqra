// Sports proposés dans l'app. L'ordre est celui des boutons du formulaire.
export const SPORTS = [
  { value: 'trail', label: 'Trail', emoji: '⛰️' },
  { value: 'course-a-pied', label: 'Course à pied', emoji: '🏃' },
  { value: 'velo-route', label: 'Vélo route', emoji: '🚴' },
  { value: 'vtt', label: 'VTT', emoji: '🚵' },
] as const;

export type ActivityType = (typeof SPORTS)[number]['value'];

export const SPORT_VALUES = SPORTS.map((s) => s.value) as [
  ActivityType,
  ...ActivityType[],
];

export function isActivityType(value: unknown): value is ActivityType {
  return SPORTS.some((s) => s.value === value);
}

export function getSportLabel(type: string): string {
  return SPORTS.find((s) => s.value === type)?.label ?? type;
}

export function getSportEmoji(type: string): string {
  return SPORTS.find((s) => s.value === type)?.emoji ?? '🏅';
}

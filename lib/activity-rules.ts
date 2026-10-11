import type { Activity } from '@/lib/types';

// Une sortie peut être modifiée ou annulée jusqu'à 1 h avant son départ, et une
// nouvelle date doit elle-même être au moins 1 h dans le futur.
export const EDIT_CUTOFF_MS = 60 * 60 * 1000;

type ActivityTiming = Pick<Activity, 'start_date' | 'status'>;

export function isCancelled(activity: Pick<Activity, 'status'>): boolean {
  return activity.status === 'cancelled';
}

export function isPast(activity: Pick<Activity, 'start_date'>, now = Date.now()) {
  return new Date(activity.start_date).getTime() < now;
}

/** Sortie à venir et non annulée : visible dans le fil, ouverte aux demandes. */
export function isOpen(activity: ActivityTiming, now = Date.now()): boolean {
  return !isCancelled(activity) && !isPast(activity, now);
}

export function canEditActivity(activity: ActivityTiming, now = Date.now()): boolean {
  return (
    !isCancelled(activity) &&
    new Date(activity.start_date).getTime() - now > EDIT_CUTOFF_MS
  );
}

export function isValidNewStartDate(startDate: Date, now = Date.now()): boolean {
  return startDate.getTime() - now >= EDIT_CUTOFF_MS;
}

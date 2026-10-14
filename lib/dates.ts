// Toutes les dates de l'app sont saisies et affichées à l'heure de Paris,
// quel que soit le fuseau du serveur (UTC sur Vercel) ou du navigateur. Sans
// ça, une sortie saisie à 9h était enregistrée à 9h UTC (= 11h à Paris) et le
// rendu serveur/client affichait deux heures différentes.
export const APP_TIME_ZONE = 'Europe/Paris';

const partsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: APP_TIME_ZONE,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

function getParisParts(date: Date): ZonedParts {
  const parts: Record<string, number> = {};
  for (const part of partsFormatter.formatToParts(date)) {
    if (part.type !== 'literal') parts[part.type] = Number(part.value);
  }
  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour,
    minute: parts.minute,
  };
}

// Décalage (ms) entre l'heure de Paris et UTC à un instant donné.
function getParisOffsetMs(timestamp: number): number {
  const p = getParisParts(new Date(timestamp));
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
  return asUtc - Math.floor(timestamp / 60_000) * 60_000;
}

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Convertit une date (YYYY-MM-DD) et une heure (HH:mm) saisies à l'heure de
 * Paris en instant UTC. Renvoie null si la saisie est invalide ou si l'heure
 * n'existe pas (saut du changement d'heure de printemps).
 */
export function parisLocalToUtc(date: string, time: string): Date | null {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(time);
  if (!dateMatch || !timeMatch) return null;

  const [year, month, day] = dateMatch.slice(1).map(Number);
  const [hour, minute] = timeMatch.slice(1).map(Number);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  if (hour > 23 || minute > 59) return null;

  const wallClockAsUtc = Date.UTC(year, month - 1, day, hour, minute);
  let utc = wallClockAsUtc - getParisOffsetMs(wallClockAsUtc);
  // Le décalage peut changer entre l'estimation et le résultat (changement
  // d'heure) : on recalcule une fois avec le décalage de l'instant obtenu.
  utc = wallClockAsUtc - getParisOffsetMs(utc);

  const check = getParisParts(new Date(utc));
  if (
    check.year !== year ||
    check.month !== month ||
    check.day !== day ||
    check.hour !== hour ||
    check.minute !== minute
  ) {
    return null;
  }
  return new Date(utc);
}

/** Valeurs à pré-remplir dans des champs <input type="date|time">. */
export function toParisInputValues(value: string | Date): {
  date: string;
  time: string;
} {
  const p = getParisParts(new Date(value));
  return {
    date: `${p.year}-${pad(p.month)}-${pad(p.day)}`,
    time: `${pad(p.hour)}:${pad(p.minute)}`,
  };
}

/** Jour calendaire à Paris (YYYY-MM-DD), pour comparer des dates. */
export function parisDayKey(value: string | Date): string {
  return toParisInputValues(value).date;
}

export function todayInParis(): string {
  return parisDayKey(new Date());
}

function format(value: string | Date, options: Intl.DateTimeFormatOptions) {
  return new Date(value).toLocaleString('fr-FR', {
    timeZone: APP_TIME_ZONE,
    ...options,
  });
}

/** "12 oct." */
export function formatDayMonth(value: string | Date): string {
  return format(value, { day: 'numeric', month: 'short' });
}

/** "dimanche 12 octobre" */
export function formatLongDate(value: string | Date): string {
  return format(value, { weekday: 'long', day: 'numeric', month: 'long' });
}

/** "09h05" */
export function formatTime(value: string | Date): string {
  return format(value, { hour: '2-digit', minute: '2-digit' }).replace(':', 'h');
}

/** "12/10" */
export function formatShortDate(value: string | Date): string {
  return format(value, { day: '2-digit', month: '2-digit' });
}

/** "lun." */
export function formatWeekday(value: string | Date): string {
  return format(value, { weekday: 'short' });
}

/**
 * Horodatage relatif court pour les listes (messages, notifications) :
 * l'heure si c'est aujourd'hui, "Hier", sinon `fallback`.
 */
export function formatRelativeDay(
  value: string | Date,
  fallback: (value: string | Date) => string = formatShortDate,
  now: Date = new Date()
): string {
  const day = parisDayKey(value);
  const today = parisDayKey(now);
  if (day === today) return formatTime(value).replace('h', ':');
  const [y, m, d] = today.split('-').map(Number);
  const yesterday = new Date(Date.UTC(y, m - 1, d - 1)).toISOString().slice(0, 10);
  if (day === yesterday) return 'Hier';
  return fallback(value);
}

/** "8h30" (sans zéro initial). */
function shortTime(value: string | Date): string {
  return format(value, { hour: 'numeric', minute: '2-digit' }).replace(':', 'h');
}

export type RelativeStartTone = 'past' | 'soon' | 'normal';

/**
 * Date de départ lisible d'un coup d'œil, à l'heure de Paris :
 * "Dans 45 min · 18h30", "Aujourd'hui · 18h30", "Demain · 8h30",
 * "Samedi · 8h30", puis "Sam. 25 oct. · 8h30" au-delà d'une semaine.
 */
export function formatRelativeStart(
  value: string | Date,
  now: Date = new Date()
): { label: string; tone: RelativeStartTone } {
  const start = new Date(value);
  const diffMin = Math.round((start.getTime() - now.getTime()) / 60000);
  const time = shortTime(start);
  if (diffMin <= 0) return { label: 'En cours', tone: 'past' };
  if (diffMin < 60) return { label: `Dans ${diffMin} min · ${time}`, tone: 'soon' };
  if (diffMin < 180) return { label: `Dans ${Math.floor(diffMin / 60)} h · ${time}`, tone: 'soon' };

  const day = parisDayKey(start);
  const today = parisDayKey(now);
  const dayDiff = Math.round(
    (Date.parse(`${day}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86400000
  );
  if (dayDiff === 0) return { label: `Aujourd'hui · ${time}`, tone: 'normal' };
  if (dayDiff === 1) return { label: `Demain · ${time}`, tone: 'normal' };
  if (dayDiff < 7) {
    const weekday = format(start, { weekday: 'long' });
    return { label: `${weekday[0].toUpperCase()}${weekday.slice(1)} · ${time}`, tone: 'normal' };
  }
  const short = format(start, { weekday: 'short', day: 'numeric', month: 'short' });
  return { label: `${short[0].toUpperCase()}${short.slice(1)} · ${time}`, tone: 'normal' };
}

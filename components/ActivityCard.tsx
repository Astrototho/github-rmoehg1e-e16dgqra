import Link from 'next/link';
import { Check, Clock, Lock, MapPin, Navigation } from 'lucide-react';
import StaticMap, { OsmAttribution } from '@/components/maps/StaticMap';
import { getSportEmoji, getSportLabel, isActivityType } from '@/lib/sports';
import { formatRelativeStart } from '@/lib/dates';
import {
  EFFORT_LABELS,
  effortLevel,
  estimatedDurationMinutes,
  formatDuration,
} from '@/lib/effort';
import type { Activity } from '@/lib/types';

export interface ActivityCardData extends Activity {
  matchPercentage?: number;
  /** Explication courte affichée sous le % (jamais de donnée Strava d'autrui). */
  matchHint?: string;
  distanceFromViewerKm?: number;
  participantsCount?: number;
  participantAvatars?: string[];
  viewerStatus?: 'pending' | 'approved' | null;
}

export interface CardBadge {
  label: string;
  tone: 'neutral' | 'success' | 'warning' | 'danger';
}

const BADGE_TONES: Record<CardBadge['tone'], string> = {
  neutral: 'bg-brand-50 text-brand-800 ring-brand-200',
  success: 'bg-green-50 text-green-800 ring-green-200',
  warning: 'bg-amber-50 text-amber-800 ring-amber-200',
  danger: 'bg-red-50 text-red-700 ring-red-200',
};

interface ActivityCardProps {
  activity: ActivityCardData;
  href: string;
  badge?: CardBadge;
  /** Visiteur non connecté : le % est remplacé par une invitation. */
  anonymous?: boolean;
}

const numberFormat = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });

/** "Julien M." : prénom et initiale sur le fil, nom complet sur le détail. */
function shortName(name: string): string {
  const [first, ...rest] = name.trim().split(/\s+/);
  const last = rest.at(-1);
  return last ? `${first} ${last[0].toUpperCase()}.` : first;
}

const RING_C = 2 * Math.PI * 29;

function MatchRing({ avatar, percentage }: { avatar: string; percentage?: number }) {
  const known = percentage != null;
  return (
    <div className="relative h-16 w-16 flex-shrink-0">
      <svg viewBox="0 0 64 64" className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle
          cx="32"
          cy="32"
          r="29"
          fill="white"
          stroke={known ? '#F3F4F6' : '#D1D5DB'}
          strokeWidth="4"
          strokeDasharray={known ? undefined : '3 5'}
        />
        {known && (
          <circle
            cx="32"
            cy="32"
            r="29"
            fill="none"
            stroke="#F16423"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={RING_C}
            strokeDashoffset={RING_C * (1 - percentage / 100)}
          />
        )}
      </svg>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={avatar}
        alt=""
        loading="lazy"
        className="absolute inset-1.5 h-[52px] w-[52px] rounded-full bg-gray-100 object-cover ring-2 ring-white"
      />
    </div>
  );
}

function EffortBars({ level }: { level: number }) {
  return (
    <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
      <span className="flex items-end gap-0.5" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`w-[3px] rounded-sm ${i <= level ? 'bg-gray-900' : 'bg-gray-300'}`}
            style={{ height: 6 + i * 2 }}
          />
        ))}
      </span>
      Effort {EFFORT_LABELS[level].toLowerCase()}
    </span>
  );
}

export default function ActivityCard({ activity, href, badge, anonymous }: ActivityCardProps) {
  const hasCoords = activity.latitude != null && activity.longitude != null;
  const cancelled = activity.status === 'cancelled';
  const sport = isActivityType(activity.type) ? activity.type : 'trail';
  const distance = Number(activity.distance);
  const elevation = Number(activity.elevation);
  const level = effortLevel(sport, distance, elevation);
  const duration = estimatedDurationMinutes(sport, distance, elevation);
  const start = formatRelativeStart(activity.start_date);
  const organizer = shortName(activity.organizer_name);
  const count = activity.participantsCount ?? 0;
  const avatars = activity.participantAvatars ?? [];

  const statusBadge: CardBadge | undefined = cancelled
    ? { label: 'Annulée', tone: 'danger' }
    : badge ??
      (activity.viewerStatus === 'approved'
        ? { label: 'Tu participes', tone: 'success' }
        : activity.viewerStatus === 'pending'
          ? { label: 'Demande envoyée', tone: 'warning' }
          : undefined);

  return (
    <Link
      href={href}
      className={`block overflow-hidden rounded-3xl bg-white shadow-[0_1px_2px_rgba(16,24,40,.06),0_6px_16px_rgba(16,24,40,.06)] ring-1 ring-gray-900/5 transition-transform duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 active:scale-[.99] ${
        cancelled ? 'opacity-60 grayscale' : ''
      }`}
    >
      {/* Point de départ */}
      <div className="relative h-32 overflow-hidden bg-gradient-to-br from-brand-100 to-brand-50">
        {hasCoords ? (
          <StaticMap
            latitude={Number(activity.latitude)}
            longitude={Number(activity.longitude)}
            halfHeight={64}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl">
              {getSportEmoji(sport)}
            </span>
            <span className="text-xs text-gray-600">Point de départ à préciser</span>
          </div>
        )}
        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          <span className="flex h-7 items-center gap-1.5 rounded-full bg-white/95 px-2.5 text-[13px] font-semibold text-gray-900 shadow-sm">
            <span aria-hidden="true">{getSportEmoji(sport)}</span>
            {getSportLabel(sport)}
          </span>
          {activity.distanceFromViewerKm != null && (
            <span className="flex h-7 items-center gap-1 rounded-full bg-white/95 px-2.5 text-[13px] font-semibold text-gray-900 shadow-sm">
              <Navigation className="h-3.5 w-3.5 text-gray-500" aria-hidden="true" />
              à {numberFormat.format(activity.distanceFromViewerKm)} km
            </span>
          )}
        </div>
        {hasCoords && <OsmAttribution className="absolute bottom-1 right-1" />}
      </div>

      <div className="px-4 pb-4">
        {/* Organisateur et % de match : la donnée clé */}
        <div className="-mt-8 flex items-end justify-between gap-2">
          <div className="flex min-w-0 items-end gap-2.5">
            <MatchRing avatar={activity.organizer_avatar} percentage={activity.matchPercentage} />
            <div className="min-w-0 pb-0.5">
              {activity.matchPercentage != null ? (
                <p className="leading-none text-gray-900">
                  <span className="text-[28px] font-black tabular-nums">
                    {activity.matchPercentage}
                  </span>
                  <span className="text-base font-bold"> %</span>
                </p>
              ) : anonymous ? (
                <p className="flex items-center gap-1 text-[22px] font-black leading-none text-gray-300">
                  ?? %<Lock className="h-3.5 w-3.5" aria-hidden="true" />
                </p>
              ) : (
                <p className="text-[22px] font-black leading-none text-gray-300">— %</p>
              )}
              <p className="mt-1 truncate text-xs text-gray-600">
                {anonymous
                  ? 'Ton match : connecte-toi'
                  : activity.matchPercentage != null
                    ? `match avec ${organizer}`
                    : `avec ${organizer}`}
              </p>
            </div>
          </div>
          {statusBadge && (
            <span
              className={`mb-1 flex h-7 flex-shrink-0 items-center gap-1 rounded-full px-2.5 text-xs font-bold ring-1 ${BADGE_TONES[statusBadge.tone]}`}
            >
              {statusBadge.tone === 'success' && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
              {statusBadge.tone === 'warning' && <Clock className="h-3.5 w-3.5" aria-hidden="true" />}
              {statusBadge.label}
            </span>
          )}
        </div>
        {activity.matchHint && (
          <p className="mt-2 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-800">
            {activity.matchHint}
          </p>
        )}

        <p
          className={`mt-3 flex items-center gap-1.5 text-[13px] font-bold ${
            start.tone === 'soon' ? 'text-amber-700' : start.tone === 'past' ? 'text-gray-500' : 'text-brand-700'
          } ${cancelled ? 'line-through' : ''}`}
        >
          {start.tone === 'soon' && (
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 motion-safe:animate-pulse" />
          )}
          {start.label}
        </p>
        <h3 className="mt-0.5 line-clamp-2 break-words text-[17px] font-bold leading-snug text-gray-900">
          {activity.title}
        </h3>
        <p className="mt-1 flex items-center gap-1 truncate text-sm text-gray-600">
          <MapPin className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
          <span className="truncate">{activity.location}</span>
        </p>

        <dl className="mt-3 grid grid-cols-3 divide-x divide-gray-200/70 rounded-2xl bg-gray-50 py-2.5 text-center">
          <div>
            <dt className="sr-only">Distance</dt>
            <dd className="text-lg font-extrabold tabular-nums text-gray-900">
              {numberFormat.format(distance)}
              <span className="text-xs font-semibold text-gray-500"> km</span>
            </dd>
          </div>
          <div>
            <dt className="sr-only">Dénivelé positif</dt>
            <dd className="text-lg font-extrabold tabular-nums text-gray-900">
              {numberFormat.format(elevation)}
              <span className="text-xs font-semibold text-gray-500"> m D+</span>
            </dd>
          </div>
          <div>
            <dt className="sr-only">Durée estimée</dt>
            <dd className="text-lg font-extrabold tabular-nums text-gray-900">
              <span className="text-xs font-semibold text-gray-500">≈ </span>
              {formatDuration(duration)}
            </dd>
          </div>
        </dl>

        <div className="mt-3 flex items-center justify-between gap-2">
          {count > 0 ? (
            <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <span className="flex -space-x-2">
                {avatars.slice(0, 3).map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={src}
                    alt=""
                    loading="lazy"
                    className="h-6 w-6 rounded-full bg-gray-100 object-cover ring-2 ring-white"
                  />
                ))}
                {count > 3 && (
                  <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-gray-100 px-1 text-[11px] font-bold ring-2 ring-white">
                    +{count - 3}
                  </span>
                )}
              </span>
              {count} inscrit{count > 1 ? 's' : ''}
            </span>
          ) : (
            <span className="truncate text-sm font-semibold text-gray-700">
              {cancelled ? '' : `Sois le 1er à rejoindre ${organizer.split(' ')[0]}`}
            </span>
          )}
          {!cancelled && <EffortBars level={level} />}
        </div>
      </div>
    </Link>
  );
}

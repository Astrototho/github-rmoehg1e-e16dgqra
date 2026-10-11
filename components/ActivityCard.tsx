import Link from 'next/link';
import { MapPin, Calendar, TrendingUp, Users, Navigation } from 'lucide-react';
import StaticMap, { OsmAttribution } from '@/components/maps/StaticMap';
import { getSportEmoji, getSportLabel } from '@/lib/sports';
import { formatDayMonth, formatTime } from '@/lib/dates';
import type { Activity } from '@/lib/types';

export interface ActivityCardData extends Activity {
  matchPercentage?: number;
  distanceFromViewerKm?: number;
  participantsCount?: number;
}

export interface CardBadge {
  label: string;
  tone: 'neutral' | 'success' | 'warning' | 'danger';
}

const BADGE_TONES: Record<CardBadge['tone'], string> = {
  neutral: 'bg-white/95 text-gray-700',
  success: 'bg-green-600 text-white',
  warning: 'bg-amber-500 text-white',
  danger: 'bg-red-600 text-white',
};

interface ActivityCardProps {
  activity: ActivityCardData;
  href: string;
  badge?: CardBadge;
}

export default function ActivityCard({ activity, href, badge }: ActivityCardProps) {
  const hasCoords = activity.latitude != null && activity.longitude != null;
  const cancelled = activity.status === 'cancelled';
  const effectiveBadge: CardBadge | undefined = cancelled
    ? { label: 'Annulée', tone: 'danger' }
    : badge;

  return (
    <Link
      href={href}
      className={`block w-full overflow-hidden rounded-2xl border border-gray-200 bg-white text-left shadow-sm transition-shadow hover:shadow-md ${
        cancelled ? 'opacity-75' : ''
      }`}
    >
      {/* Carte du point de départ en fond */}
      <div className="relative h-40 overflow-hidden bg-gradient-to-br from-primary/25 to-primary/5">
        {hasCoords ? (
          <StaticMap latitude={Number(activity.latitude)} longitude={Number(activity.longitude)} />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-30">
            {getSportEmoji(activity.type)}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10" />

        {/* Sport + statut */}
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          <span className="flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 backdrop-blur-sm">
            <span aria-hidden="true">{getSportEmoji(activity.type)}</span>
            <span className="text-sm font-medium text-gray-900">
              {getSportLabel(activity.type)}
            </span>
          </span>
          {effectiveBadge && (
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-bold shadow ${BADGE_TONES[effectiveBadge.tone]}`}
            >
              {effectiveBadge.label}
            </span>
          )}
        </div>

        {/* % de match (la donnée clé) et distance */}
        {(activity.matchPercentage != null || activity.distanceFromViewerKm != null) && (
          <div className="absolute right-3 top-3 flex flex-col items-end gap-1.5">
            {activity.matchPercentage != null && (
              <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow-lg">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                <span className="font-black text-green-600">{activity.matchPercentage}%</span>
                <span className="text-xs font-semibold text-gray-500">match</span>
              </span>
            )}
            {activity.distanceFromViewerKm != null && (
              <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow-lg">
                <Navigation className="h-3.5 w-3.5 text-gray-500" />
                <span className="text-sm font-bold text-gray-700">
                  {activity.distanceFromViewerKm} km
                </span>
              </span>
            )}
          </div>
        )}

        {hasCoords && <OsmAttribution className="absolute bottom-1 right-1" />}
      </div>

      <div className="p-4">
        <h3 className="mb-3 line-clamp-2 break-words text-lg font-bold text-gray-900">
          {activity.title}
        </h3>

        <div className="mb-3 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={activity.organizer_avatar}
            alt=""
            loading="lazy"
            className="h-10 w-10 flex-shrink-0 rounded-full border-2 border-gray-200 bg-slate-100 object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-gray-900">{activity.organizer_name}</p>
            <p className="text-xs text-gray-500">Organisateur</p>
          </div>
        </div>

        <div className="space-y-2 text-gray-700">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="flex items-center gap-2 text-sm font-medium">
              <TrendingUp className="h-4 w-4 text-gray-400" />
              {activity.distance} km · {activity.elevation} m D+
            </span>
            {activity.participantsCount != null && activity.participantsCount > 0 && (
              <span className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-gray-400" />
                {activity.participantsCount} participant
                {activity.participantsCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
            <span className="break-words text-sm">{activity.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-sm">
              {formatDayMonth(activity.start_date)} à {formatTime(activity.start_date)}
            </span>
          </div>
        </div>

        {activity.description && (
          <p className="mt-3 line-clamp-2 break-words text-sm text-gray-600">
            {activity.description}
          </p>
        )}
      </div>
    </Link>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { List, Map } from 'lucide-react';
import LeafletMap from '@/components/maps/LeafletMap';
import { getSportEmoji } from '@/lib/sports';
import { formatDayMonth } from '@/lib/dates';

interface ProfileActivity {
  id: string;
  title: string;
  type: string;
  start_date: string;
  status?: string;
}

interface ProfileTabsProps {
  activities: ProfileActivity[];
  city?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export default function ProfileTabs({
  activities,
  city,
  country,
  latitude,
  longitude,
}: ProfileTabsProps) {
  const [tab, setTab] = useState<'sorties' | 'carte'>('sorties');
  const hasCoords = latitude != null && longitude != null;

  return (
    <>
      <div className="sticky top-header bg-white border-b border-gray-100 z-30">
        <div className="flex gap-6 px-4 text-sm font-medium">
          <button
            onClick={() => setTab('sorties')}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              tab === 'sorties'
                ? 'text-primary border-primary'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
          >
            <List className="w-4 h-4" />
            Sorties
          </button>
          <button
            onClick={() => setTab('carte')}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              tab === 'carte'
                ? 'text-primary border-primary'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
          >
            <Map className="w-4 h-4" />
            Carte
          </button>
        </div>
      </div>

      {tab === 'sorties' ? (
        activities.length === 0 ? (
          <div className="text-center py-16 px-4">
            <p className="text-gray-400 text-sm">
              Aucune sortie publiée pour le moment.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1 p-0">
            {activities.map((activity) => (
              <Link
                key={activity.id}
                href={`/activities/${activity.id}`}
                className="relative aspect-square overflow-hidden bg-primary/10 flex flex-col items-center justify-center p-2 hover:bg-primary/20 transition-colors"
              >
                <span className="text-2xl mb-1">{getSportEmoji(activity.type)}</span>
                <span className="text-[11px] font-semibold text-gray-900 text-center line-clamp-2">
                  {activity.title}
                </span>
                <span className="text-[10px] text-gray-500 mt-0.5">
                  {activity.status === 'cancelled'
                    ? 'Annulée'
                    : formatDayMonth(activity.start_date)}
                </span>
              </Link>
            ))}
          </div>
        )
      ) : (
        <div className="p-4">
          {hasCoords ? (
            <div className="space-y-2">
              <div className="relative z-0 aspect-square w-full overflow-hidden rounded-xl border border-gray-100">
                <LeafletMap latitude={Number(latitude)} longitude={Number(longitude)} zoom={12} />
              </div>
              {city && (
                <p className="text-center text-sm text-gray-600">
                  {city}
                  {country ? `, ${country}` : ''}
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-16 px-4">
              <p className="text-gray-400 text-sm mb-2">
                Aucune ville renseignée pour le moment.
              </p>
              <Link href="/settings" className="text-primary text-sm font-semibold hover:underline">
                Renseigne-la dans Paramètres
              </Link>
            </div>
          )}
        </div>
      )}
    </>
  );
}

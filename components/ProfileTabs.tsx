'use client';

import { useState } from 'react';
import Link from 'next/link';
import { List, Map } from 'lucide-react';

interface ProfileActivity {
  id: string;
  title: string;
  type: string;
  start_date: string;
}

interface ProfileTabsProps {
  activities: ProfileActivity[];
  city?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

const sportEmojis: Record<string, string> = {
  trail: '⛰️',
  'course-a-pied': '🏃',
  'velo-route': '🚴',
  velo: '🚴',
  vtt: '🚵',
};

export default function ProfileTabs({
  activities,
  city,
  country,
  latitude,
  longitude,
}: ProfileTabsProps) {
  const [tab, setTab] = useState<'sorties' | 'carte'>('sorties');

  const mapQuery =
    latitude != null && longitude != null
      ? `${latitude},${longitude}`
      : [city, country].filter(Boolean).join(', ');

  return (
    <>
      <div className="sticky top-14 bg-white border-b border-gray-100 z-30">
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
                <span className="text-2xl mb-1">
                  {sportEmojis[activity.type] ?? '🏅'}
                </span>
                <span className="text-[11px] font-semibold text-gray-900 text-center line-clamp-2">
                  {activity.title}
                </span>
                <span className="text-[10px] text-gray-500 mt-0.5">
                  {new Date(activity.start_date).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </span>
              </Link>
            ))}
          </div>
        )
      ) : (
        <div className="p-4">
          {mapQuery ? (
            <div className="aspect-square w-full rounded-xl overflow-hidden border border-gray-100">
              <iframe
                title="Carte de localisation"
                src={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`}
                className="w-full h-full border-0"
                loading="lazy"
              />
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

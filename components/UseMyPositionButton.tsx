'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LocateFixed } from 'lucide-react';

// Position GPS du navigateur, arrondie (~1 km) et gardée dans un cookie
// pc_pos (jamais dans l'URL, jamais en base) : sert au filtre de distance.
export default function UseMyPositionButton({ compact }: { compact?: boolean }) {
  const router = useRouter();
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle');

  const locate = () => {
    if (!('geolocation' in navigator)) {
      setState('error');
      return;
    }
    setState('loading');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const value = `${coords.latitude.toFixed(2)},${coords.longitude.toFixed(2)}`;
        document.cookie = `pc_pos=${value}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
        setState('idle');
        router.refresh();
      },
      () => setState('error'),
      { maximumAge: 10 * 60 * 1000, timeout: 10000 }
    );
  };

  return (
    <button
      type="button"
      onClick={locate}
      disabled={state === 'loading'}
      aria-label="Utiliser ma position"
      className="flex h-9 flex-shrink-0 items-center gap-1.5 rounded-full bg-white px-3 text-sm font-semibold text-gray-800 ring-1 ring-gray-200 hover:bg-gray-50 disabled:opacity-60"
    >
      <LocateFixed className="h-4 w-4 text-brand-700" aria-hidden="true" />
      {state === 'loading'
        ? 'Localisation…'
        : state === 'error'
          ? 'Position refusée'
          : compact
            ? null
            : 'Près de moi'}
    </button>
  );
}

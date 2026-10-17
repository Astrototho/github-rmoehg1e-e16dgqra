'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LocateFixed, SlidersHorizontal, X } from 'lucide-react';
import { SPORTS, getSportEmoji } from '@/lib/sports';
import {
  RADIUS_OPTIONS,
  WHEN_OPTIONS,
  applyFeedFilters,
  feedHref,
  type FeedFilters as Filters,
} from '@/lib/feed-filters';
import { locateUser } from '@/lib/geolocation-client';

interface FeedFiltersProps {
  filters: Filters;
  /** Sorties du fil avant filtrage (pour compter les résultats en direct). */
  items: { id: string; type: string; start_date: string }[];
  distances: Record<string, number>;
  referenceLabel: string | null;
}

function summary(filters: Filters): string {
  const parts = [
    filters.sport ? SPORTS.find((s) => s.value === filters.sport)?.label : 'Tous les sports',
    filters.when ? WHEN_OPTIONS.find((o) => o.value === filters.when)?.label : 'Toutes dates',
    filters.radius ? `≤ ${filters.radius} km` : 'Partout',
  ];
  return parts.join(' · ');
}

function Option({
  selected,
  disabled,
  onClick,
  children,
  count,
}: {
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={`flex min-h-11 items-center justify-between gap-2 rounded-xl px-3 text-left text-sm font-semibold ring-1 transition-colors disabled:opacity-40 ${
        selected
          ? 'bg-brand-50 text-brand-800 ring-2 ring-brand-500'
          : 'bg-white text-gray-800 ring-gray-200'
      }`}
    >
      <span className="truncate">{children}</span>
      {count != null && <span className="text-xs font-medium text-gray-500">{count}</span>}
    </button>
  );
}

// Filtres du fil : une barre compacte (résumé + nombre de filtres actifs) qui
// ouvre un panneau plein écran par le bas, validé par « Voir N sorties »
// (principe Airbnb / Vinted / Komoot).
export default function FeedFilters({ filters, items, distances, referenceLabel }: FeedFiltersProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Filters>(filters);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);
  const hasReference = Object.keys(distances).length > 0 || referenceLabel != null;
  const activeCount = [filters.sport, filters.when, filters.radius].filter(Boolean).length;

  useEffect(() => {
    if (!open) return;
    setDraft(filters);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const count = (patch: Partial<Filters>) =>
    applyFeedFilters(items, { ...draft, ...patch }, distances).length;
  const total = useMemo(() => applyFeedFilters(items, draft, distances).length, [items, draft, distances]);

  const apply = () => {
    setOpen(false);
    router.push(feedHref(draft, {}), { scroll: false });
  };

  const useMyPosition = async () => {
    setLocating(true);
    setLocateError(null);
    try {
      const { latitude, longitude } = await locateUser();
      document.cookie = `pc_pos=${latitude.toFixed(2)},${longitude.toFixed(2)}; path=/; max-age=${
        60 * 60 * 24 * 7
      }; samesite=lax`;
      router.refresh();
    } catch (err) {
      setLocateError(err instanceof Error ? err.message : 'Position introuvable.');
    } finally {
      setLocating(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-12 w-full items-center gap-3 rounded-full bg-white px-4 text-left shadow-[0_2px_10px_rgba(16,24,40,.08)] ring-1 ring-gray-200"
      >
        <SlidersHorizontal className="h-5 w-5 flex-shrink-0 text-navy-900" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-800">
          {summary(filters)}
        </span>
        {activeCount > 0 && (
          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-brand-600 px-1.5 text-xs font-bold text-white">
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center" role="dialog" aria-modal="true" aria-label="Filtres">
          <button
            type="button"
            aria-label="Fermer"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <div className="relative flex max-h-[88dvh] w-full max-w-md flex-col rounded-t-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h2 className="text-lg font-black text-navy-900">Filtres</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fermer"
                className="-mr-2 flex h-11 w-11 items-center justify-center rounded-full hover:bg-gray-100"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-6 overflow-y-auto px-5 py-5">
              <section>
                <h3 className="mb-2.5 text-sm font-bold text-navy-900">Sport</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Option selected={!draft.sport} onClick={() => setDraft({ ...draft, sport: undefined })} count={count({ sport: undefined })}>
                    Tous
                  </Option>
                  {SPORTS.map((s) => (
                    <Option
                      key={s.value}
                      selected={draft.sport === s.value}
                      onClick={() => setDraft({ ...draft, sport: s.value })}
                      count={count({ sport: s.value })}
                    >
                      {getSportEmoji(s.value)} {s.label}
                    </Option>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="mb-2.5 text-sm font-bold text-navy-900">Date</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Option selected={!draft.when} onClick={() => setDraft({ ...draft, when: undefined })} count={count({ when: undefined })}>
                    Toutes les dates
                  </Option>
                  {WHEN_OPTIONS.map((o) => (
                    <Option
                      key={o.value}
                      selected={draft.when === o.value}
                      onClick={() => setDraft({ ...draft, when: o.value })}
                      count={count({ when: o.value })}
                    >
                      {o.label}
                    </Option>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="mb-1 text-sm font-bold text-navy-900">Distance max depuis toi</h3>
                <p className="mb-2.5 text-xs text-gray-600">
                  {referenceLabel
                    ? `Calculée depuis ${referenceLabel}.`
                    : 'Active ta position pour filtrer par distance.'}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <Option selected={!draft.radius} onClick={() => setDraft({ ...draft, radius: undefined })}>
                    Partout
                  </Option>
                  {RADIUS_OPTIONS.map((r) => (
                    <Option
                      key={r}
                      selected={draft.radius === r}
                      disabled={!hasReference}
                      onClick={() => setDraft({ ...draft, radius: r })}
                    >
                      {r} km
                    </Option>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={useMyPosition}
                  disabled={locating}
                  className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gray-100 text-sm font-semibold text-navy-900 disabled:opacity-60"
                >
                  <LocateFixed className="h-4 w-4 text-brand-700" aria-hidden="true" />
                  {locating ? 'Localisation en cours…' : 'Utiliser ma position actuelle'}
                </button>
                {locateError && (
                  <p role="alert" className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900">
                    {locateError}
                  </p>
                )}
              </section>
            </div>

            <div className="flex items-center gap-3 border-t border-gray-100 px-5 pb-safe pt-3">
              <button
                type="button"
                onClick={() => setDraft({})}
                className="mb-3 h-12 px-2 text-sm font-semibold text-gray-700 underline underline-offset-4"
              >
                Tout effacer
              </button>
              <button
                type="button"
                onClick={apply}
                className="mb-3 h-12 flex-1 rounded-xl bg-brand-600 text-sm font-bold text-white"
              >
                {total === 0 ? 'Aucune sortie' : `Voir ${total} sortie${total > 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

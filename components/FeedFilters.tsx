import Link from 'next/link';
import { ChevronDown, X } from 'lucide-react';
import UseMyPositionButton from '@/components/UseMyPositionButton';
import { SPORTS, getSportEmoji } from '@/lib/sports';
import {
  RADIUS_OPTIONS,
  WHEN_OPTIONS,
  feedHref,
  type FeedFilters as Filters,
} from '@/lib/feed-filters';

interface Option {
  label: string;
  href: string;
  active: boolean;
  count: number;
}

interface FeedFiltersProps {
  filters: Filters;
  /** Nombre de sorties obtenues si l'on choisit chaque option. */
  counts: {
    sport: Record<string, number>;
    when: Record<string, number>;
    radius: Record<string, number>;
    all: { sport: number; when: number; radius: number };
  };
  hasReference: boolean;
}

// Chaque filtre est un menu déroulant natif (<details>) : aucun JavaScript,
// chaque option est un lien rendu côté serveur.
function FilterMenu({ label, active, options }: { label: string; active: boolean; options: Option[] }) {
  return (
    <details className="group relative flex-shrink-0">
      <summary
        className={`flex h-9 cursor-pointer list-none items-center gap-1 rounded-full px-3.5 text-sm font-semibold ring-1 transition-colors [&::-webkit-details-marker]:hidden ${
          active
            ? 'bg-gray-900 text-white ring-gray-900'
            : 'bg-white text-gray-800 ring-gray-200 hover:bg-gray-50'
        }`}
      >
        {label}
        <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="absolute left-0 z-30 mt-2 min-w-[12rem] overflow-hidden rounded-2xl bg-white py-1 shadow-xl ring-1 ring-gray-900/10">
        {options.map((o) =>
          o.count === 0 && !o.active ? (
            <span
              key={o.label}
              className="flex min-h-11 items-center justify-between gap-3 px-4 text-sm text-gray-400"
            >
              {o.label}
              <span className="text-xs">0</span>
            </span>
          ) : (
            <Link
              key={o.label}
              href={o.href}
              scroll={false}
              className={`flex min-h-11 items-center justify-between gap-3 px-4 text-sm hover:bg-gray-50 ${
                o.active ? 'font-bold text-brand-700' : 'text-gray-800'
              }`}
            >
              {o.label}
              <span className="text-xs text-gray-500">{o.count}</span>
            </Link>
          )
        )}
      </div>
    </details>
  );
}

export default function FeedFilters({ filters, counts, hasReference }: FeedFiltersProps) {
  const sportLabel = filters.sport
    ? `${getSportEmoji(filters.sport)} ${SPORTS.find((s) => s.value === filters.sport)?.label}`
    : 'Sport';
  const whenLabel = WHEN_OPTIONS.find((o) => o.value === filters.when)?.label ?? 'Date';
  const radiusLabel = filters.radius ? `≤ ${filters.radius} km` : 'Distance';
  const anyActive = Boolean(filters.sport || filters.when || filters.radius);

  return (
    <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
      <FilterMenu
        label={sportLabel}
        active={Boolean(filters.sport)}
        options={[
          {
            label: 'Tous les sports',
            href: feedHref(filters, { sport: undefined }),
            active: !filters.sport,
            count: counts.all.sport,
          },
          ...SPORTS.map((s) => ({
            label: `${getSportEmoji(s.value)} ${s.label}`,
            href: feedHref(filters, { sport: s.value }),
            active: filters.sport === s.value,
            count: counts.sport[s.value] ?? 0,
          })),
        ]}
      />
      <FilterMenu
        label={whenLabel}
        active={Boolean(filters.when)}
        options={[
          {
            label: 'Toutes les dates',
            href: feedHref(filters, { when: undefined }),
            active: !filters.when,
            count: counts.all.when,
          },
          ...WHEN_OPTIONS.map((o) => ({
            label: o.label,
            href: feedHref(filters, { when: o.value }),
            active: filters.when === o.value,
            count: counts.when[o.value] ?? 0,
          })),
        ]}
      />
      {hasReference ? (
        <FilterMenu
          label={radiusLabel}
          active={Boolean(filters.radius)}
          options={[
            {
              label: 'Partout',
              href: feedHref(filters, { radius: undefined }),
              active: !filters.radius,
              count: counts.all.radius,
            },
            ...RADIUS_OPTIONS.map((r) => ({
              label: `À moins de ${r} km`,
              href: feedHref(filters, { radius: r }),
              active: filters.radius === r,
              count: counts.radius[r] ?? 0,
            })),
          ]}
        />
      ) : null}
      <UseMyPositionButton compact={hasReference} />
      {anyActive && (
        <Link
          href="/"
          scroll={false}
          className="flex h-9 flex-shrink-0 items-center gap-1 rounded-full px-3 text-sm font-semibold text-gray-600 hover:bg-gray-100"
        >
          <X className="h-4 w-4" aria-hidden="true" />
          Effacer
        </Link>
      )}
    </div>
  );
}

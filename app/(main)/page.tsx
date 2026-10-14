import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Plus } from 'lucide-react';
import ActivityCard from '@/components/ActivityCard';
import FeedFilters from '@/components/FeedFilters';
import InstallAppPrompt from '@/components/InstallAppPrompt';
import { getUpcomingActivities } from '@/lib/activities';
import {
  getApprovedParticipantsForActivities,
  getViewerParticipationStatuses,
} from '@/lib/participations';
import {
  getDistancesFromViewer,
  getMatchPercentages,
  parsePositionCookie,
  sortFeed,
} from '@/lib/feed';
import {
  RADIUS_OPTIONS,
  WHEN_OPTIONS,
  applyFeedFilters,
  parseFeedFilters,
  type FeedFilters as Filters,
} from '@/lib/feed-filters';
import { SPORTS } from '@/lib/sports';
import { getCurrentUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

interface HomeProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function Home({ searchParams }: HomeProps) {
  const [currentUser, upcoming, cookieStore, params] = await Promise.all([
    getCurrentUser(),
    getUpcomingActivities(),
    cookies(),
    searchParams,
  ]);
  // Premier lancement sans compte : écran d'accueil (« Voir les sorties
  // d'abord » y pose le cookie pc_apercu pour ne plus y être renvoyé).
  if (!currentUser && !cookieStore.has('pc_apercu')) redirect('/login');

  // Sur le fil, on ne montre pas les sorties que l'on organise soi-même.
  const activities = currentUser
    ? upcoming.filter((a) => a.organizer_id !== currentUser.id)
    : upcoming;

  // Point de référence pour les distances : position GPS récente, sinon la
  // ville du profil.
  const reference =
    parsePositionCookie(cookieStore.get('pc_pos')?.value) ??
    (currentUser?.latitude != null && currentUser.longitude != null
      ? { latitude: Number(currentUser.latitude), longitude: Number(currentUser.longitude) }
      : null);
  const distanceMap = getDistancesFromViewer(reference, activities);

  const filters = parseFeedFilters(params);
  const visible = applyFeedFilters(activities, filters, distanceMap);
  const countWith = (patch: Partial<Filters>) =>
    applyFeedFilters(activities, { ...filters, ...patch }, distanceMap).length;
  const counts = {
    sport: Object.fromEntries(SPORTS.map((s) => [s.value, countWith({ sport: s.value })])),
    when: Object.fromEntries(WHEN_OPTIONS.map((o) => [o.value, countWith({ when: o.value })])),
    radius: Object.fromEntries(RADIUS_OPTIONS.map((r) => [r, countWith({ radius: r })])),
    all: {
      sport: countWith({ sport: undefined }),
      when: countWith({ when: undefined }),
      radius: countWith({ radius: undefined }),
    },
  };

  const ids = visible.map((a) => a.id);
  const [participantsMap, matchMap, statuses] = await Promise.all([
    getApprovedParticipantsForActivities(ids),
    getMatchPercentages(currentUser, visible),
    currentUser
      ? getViewerParticipationStatuses(currentUser.id, ids)
      : ({} as Record<string, 'pending' | 'approved'>),
  ]);
  const sorted = sortFeed(
    visible,
    Object.fromEntries(Object.entries(matchMap).map(([id, m]) => [id, m.percentage]))
  );
  const anyFilter = Boolean(filters.sport || filters.when || filters.radius);

  return (
    <div className={`space-y-4 p-4 ${currentUser ? '' : 'pb-28'}`}>
      {currentUser && <InstallAppPrompt variant="banner" />}

      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-black tracking-tight text-gray-900">Sorties à venir</h1>
        <span className="whitespace-nowrap rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-600">
          {sorted.length} sortie{sorted.length > 1 ? 's' : ''}
        </span>
      </div>

      <FeedFilters filters={filters} counts={counts} hasReference={reference != null} />

      {currentUser && Object.keys(matchMap).length > 0 && (
        <p className="text-xs text-gray-500">
          Classées selon ton % de match avec chaque organisateur.
        </p>
      )}

      <div className="space-y-4">
        {sorted.map((act) => {
          const participants = participantsMap[act.id] ?? [];
          return (
            <ActivityCard
              key={act.id}
              activity={{
                ...act,
                participantsCount: participants.length,
                participantAvatars: participants.map((p) => p.user_avatar),
                matchPercentage: matchMap[act.id]?.percentage,
                matchHint: matchMap[act.id]?.hint,
                distanceFromViewerKm: distanceMap[act.id],
                viewerStatus: statuses[act.id] ?? null,
              }}
              href={`/activities/${act.id}`}
              anonymous={!currentUser}
            />
          );
        })}

        {sorted.length === 0 && (
          <div className="rounded-3xl border-2 border-dashed border-gray-200 px-6 py-14 text-center">
            <p className="text-sm font-semibold text-gray-700">
              {anyFilter ? 'Aucune sortie avec ces filtres.' : 'Aucune sortie de prévue pour le moment.'}
            </p>
            <div className="mt-4 flex flex-col items-center gap-2">
              {anyFilter && (
                <Link href="/" className="text-sm font-semibold text-brand-700 underline-offset-4 hover:underline">
                  Élargir la recherche
                </Link>
              )}
              {currentUser && (
                <Link
                  href="/create"
                  className="mt-1 inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Proposer une sortie
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      {!currentUser && (
        <div className="bottom-nav-offset fixed inset-x-0 z-40 mx-auto max-w-md px-4">
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-gray-900 p-4 text-white shadow-xl">
            <p className="text-sm font-semibold">Vois ton % de match avec chaque orga</p>
            <Link
              href="/login"
              className="flex-shrink-0 rounded-xl bg-white px-3.5 py-2 text-sm font-bold text-gray-900"
            >
              Se connecter
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

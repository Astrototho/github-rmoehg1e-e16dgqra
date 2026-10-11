import ActivityCard from '@/components/ActivityCard';
import InstallAppPrompt from '@/components/InstallAppPrompt';
import { getUpcomingActivities } from '@/lib/activities';
import { getApprovedParticipantsForActivities } from '@/lib/participations';
import { getDistancesFromViewer, getMatchPercentages, sortFeed } from '@/lib/feed';
import { getCurrentUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const currentUser = await getCurrentUser();
  const upcoming = await getUpcomingActivities();
  // Sur le fil, on ne montre pas les sorties que l'on organise soi-même.
  const activities = currentUser
    ? upcoming.filter((a) => a.organizer_id !== currentUser.id)
    : upcoming;

  const [participantsMap, matchMap] = await Promise.all([
    getApprovedParticipantsForActivities(activities.map((a) => a.id)),
    getMatchPercentages(currentUser, activities),
  ]);
  const distanceMap = getDistancesFromViewer(currentUser, activities);
  const sorted = sortFeed(activities, matchMap);

  return (
    <div className="space-y-6 p-4">
      {currentUser && <InstallAppPrompt variant="banner" />}

      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <span className="h-6 w-1.5 rounded-full bg-primary"></span>
          Sorties à venir
        </h2>
        <span className="whitespace-nowrap rounded-full bg-gray-100 px-2 py-1 text-xs font-bold text-gray-500">
          {sorted.length} sortie{sorted.length > 1 ? 's' : ''}
        </span>
      </div>

      {currentUser && Object.keys(matchMap).length > 0 && (
        <p className="-mt-3 text-xs text-gray-500">
          Classées selon ton % de match avec chaque organisateur.
        </p>
      )}

      <div className="space-y-4">
        {sorted.map((act) => (
          <ActivityCard
            key={act.id}
            activity={{
              ...act,
              participantsCount: participantsMap[act.id]?.length ?? 0,
              matchPercentage: matchMap[act.id],
              distanceFromViewerKm: distanceMap[act.id],
            }}
            href={`/activities/${act.id}`}
          />
        ))}

        {sorted.length === 0 && (
          <div className="rounded-3xl border-2 border-dashed border-gray-100 py-20 text-center">
            <p className="text-sm text-gray-400">Aucune sortie de prévue...</p>
          </div>
        )}
      </div>
    </div>
  );
}

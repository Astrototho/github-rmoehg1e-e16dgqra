import ActivityCard from '@/components/ActivityCard';
import { getApprovedParticipantsForActivities } from '@/app/actions';
import { getAllActivities } from '@/lib/activities';
import { getCurrentUser } from '@/lib/session';
import { unstable_noStore as noStore } from 'next/cache';

export const dynamic = 'force-dynamic';

export default async function Home() {
  noStore();

  const currentUser = await getCurrentUser();
  const allActivities = await getAllActivities();
  // Sur le fil, on ne montre pas les sorties que l'on organise soi-même.
  const activities = currentUser
    ? allActivities.filter((a) => a.organizer_id !== currentUser.id)
    : allActivities;
  const activityIds = activities.map((a) => a.id);
  const participantsMap =
    await getApprovedParticipantsForActivities(activityIds);

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span className="w-1.5 h-6 bg-primary rounded-full"></span>
          Sorties à proximité
        </h2>
        <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
          {activities.length} TRAITS
        </span>
      </div>

      <div className="space-y-4">
        {activities.map((act) => (
          <ActivityCard
            key={act.id}
            activity={{
              ...act,
              participants: participantsMap[act.id] ?? [],
            }}
            href={`/activities/${act.id}`}
          />
        ))}

        {activities.length === 0 && (
          <div className="text-center py-20 border-2 border-dashed rounded-3xl border-gray-100">
            <p className="text-gray-400 text-sm">Aucune sortie de prévue...</p>
          </div>
        )}
      </div>
    </div>
  );
}

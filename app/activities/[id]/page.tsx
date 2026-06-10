import { notFound } from 'next/navigation';
import ActivityDetailClient from '@/components/ActivityDetailClient';
import {
  getActivityById,
  getActivityParticipations,
  getMyParticipationForActivity,
} from '@/app/actions';
import { getCurrentUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { id: string };
}

export default async function ActivityDetailPage({ params }: PageProps) {
  const [activityResult, participationsResult, myParticipationResult, currentUser] =
    await Promise.all([
      getActivityById(params.id),
      getActivityParticipations(params.id),
      getMyParticipationForActivity(params.id),
      getCurrentUser(),
    ]);

  if (!activityResult.success || !activityResult.data) {
    notFound();
  }

  const activity = activityResult.data;
  const participations = participationsResult.success
    ? participationsResult.data!
    : { pending: [], approved: [] };
  const myParticipation = myParticipationResult.success
    ? myParticipationResult.data
    : null;

  return (
    <ActivityDetailClient
      activity={activity}
      participations={participations}
      myParticipation={myParticipation ?? null}
      currentUserId={currentUser?.id ?? null}
      isOrganizer={
        currentUser ? activity.organizer_id === currentUser.id : false
      }
    />
  );
}

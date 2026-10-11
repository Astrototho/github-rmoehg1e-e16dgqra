import { notFound } from 'next/navigation';
import ActivityDetailClient from '@/components/ActivityDetailClient';
import { getActivityByIdFromDb } from '@/lib/activities';
import { getParticipationsForActivity, getUserParticipation } from '@/lib/participations';
import { getMatchPercentages } from '@/lib/feed';
import { getCurrentUser } from '@/lib/session';
import { createAdminClient } from '@/lib/supabase-admin';
import { canEditActivity } from '@/lib/activity-rules';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getMyMatchFeedback(activityId: string, userId: string) {
  const { data } = await createAdminClient()
    .from('match_feedback')
    .select('accurate')
    .eq('activity_id', activityId)
    .eq('rater_id', userId)
    .maybeSingle();
  return (data?.accurate as boolean | undefined) ?? null;
}

export default async function ActivityDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [activity, currentUser] = await Promise.all([
    getActivityByIdFromDb(id),
    getCurrentUser(),
  ]);
  if (!activity) notFound();

  const isOrganizer = currentUser?.id === activity.organizer_id;
  const [participations, myParticipation, matchMap, myMatchFeedback] = await Promise.all([
    getParticipationsForActivity(activity.id),
    currentUser ? getUserParticipation(activity.id, currentUser.id) : null,
    isOrganizer ? {} : getMatchPercentages(currentUser, [activity]),
    currentUser ? getMyMatchFeedback(activity.id, currentUser.id) : null,
  ]);

  return (
    <ActivityDetailClient
      activity={activity}
      participations={participations}
      myParticipation={myParticipation}
      currentUserId={currentUser?.id ?? null}
      isOrganizer={isOrganizer}
      canEdit={isOrganizer && canEditActivity(activity)}
      matchPercentage={(matchMap as Record<string, number>)[activity.id] ?? null}
      myMatchFeedback={myMatchFeedback}
    />
  );
}

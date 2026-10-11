import { redirect } from 'next/navigation';
import MyActivitiesTabs, { type MyActivityItem } from '@/components/MyActivitiesTabs';
import { ACTIVITY_COLUMNS, getActivitiesByOrganizer } from '@/lib/activities';
import { getCurrentUser } from '@/lib/session';
import { createAdminClient } from '@/lib/supabase-admin';
import { isCancelled, isPast } from '@/lib/activity-rules';
import type { Activity } from '@/lib/types';

export const dynamic = 'force-dynamic';

type ParticipationRow = { status: string; activities: Activity | null };

const byStartAsc = (a: MyActivityItem, b: MyActivityItem) =>
  new Date(a.activity.start_date).getTime() - new Date(b.activity.start_date).getTime();

export default async function ActivitiesPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect('/login');

  const [organized, participationsResult] = await Promise.all([
    getActivitiesByOrganizer(currentUser.id),
    createAdminClient()
      .from('participations')
      .select(`status, activities (${ACTIVITY_COLUMNS})`)
      .eq('user_id', currentUser.id),
  ]);

  if (participationsResult.error) {
    throw new Error('Impossible de charger tes participations.');
  }

  const now = Date.now();
  const participations = (participationsResult.data ?? []) as unknown as ParticipationRow[];
  const isUpcoming = (a: Activity) => !isCancelled(a) && !isPast(a, now);

  const tabs = {
    'mes-sorties': organized
      .filter(isUpcoming)
      .map((activity) => ({ activity }))
      .sort(byStartAsc),
    validees: participations
      .filter((p) => p.status === 'approved' && p.activities && isUpcoming(p.activities))
      .map((p) => ({ activity: p.activities!, badge: { label: 'Validée', tone: 'success' as const } }))
      .sort(byStartAsc),
    'en-cours': participations
      .filter((p) => p.status === 'pending' && p.activities && isUpcoming(p.activities))
      .map((p) => ({ activity: p.activities!, badge: { label: 'En attente', tone: 'warning' as const } }))
      .sort(byStartAsc),
    passees: [
      ...organized
        .filter((a) => !isUpcoming(a))
        .map((activity) => ({
          activity,
          badge: { label: 'Organisée', tone: 'neutral' as const },
        })),
      ...participations
        .filter((p) => p.status === 'approved' && p.activities && !isUpcoming(p.activities))
        .map((p) => ({ activity: p.activities! })),
    ].sort((a, b) => byStartAsc(b, a)),
  } satisfies Record<string, MyActivityItem[]>;

  return <MyActivitiesTabs tabs={tabs} />;
}

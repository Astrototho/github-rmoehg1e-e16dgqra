import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session';
import { createAdminClient } from '@/lib/supabase-admin';
import ProfileTabs from '@/components/ProfileTabs';
import ShareInviteButton from '@/components/ShareInviteButton';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect('/login');

  const admin = createAdminClient();
  const [{ data: myActivities }, { count: participationCount }] = await Promise.all([
    admin
      .from('activities')
      .select('id, title, type, start_date, status')
      .eq('organizer_id', currentUser.id)
      .order('start_date', { ascending: false }),
    admin
      .from('participations')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', currentUser.id)
      .eq('status', 'approved'),
  ]);

  const organizedCount = (myActivities ?? []).filter((a) => a.status !== 'cancelled').length;

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="pb-6">
        <div className="p-4">
          <div className="mb-4 flex items-center justify-between">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="h-20 w-20 rounded-full border-2 border-gray-100 object-cover"
            />
            <ShareInviteButton />
          </div>

          <h2 className="mb-3 break-words text-xl font-bold text-navy-900">{currentUser.name}</h2>

          <div className="mb-4 flex gap-6 text-center">
            <div>
              <p className="text-lg font-bold text-navy-900">
                {organizedCount + (participationCount ?? 0)}
              </p>
              <p className="text-xs text-gray-500">Sorties</p>
            </div>
          </div>

          {currentUser.bio && (
            <p className="whitespace-pre-line text-sm text-gray-700">{currentUser.bio}</p>
          )}
        </div>

        <ProfileTabs
          activities={myActivities ?? []}
          city={currentUser.city}
          country={currentUser.country}
          latitude={currentUser.latitude}
          longitude={currentUser.longitude}
        />
      </div>
    </div>
  );
}

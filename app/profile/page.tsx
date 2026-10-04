import { Settings, Zap } from 'lucide-react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session';
import { createAdminClient } from '@/lib/supabase-admin';
import { hasActivityScopeConnected } from '@/lib/performance';
import { signIn } from '@/auth';
import ProfileTabs from '@/components/ProfileTabs';
import ShareInviteButton from '@/components/ShareInviteButton';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect('/login');
  }

  const admin = createAdminClient();

  const stravaConnected = await hasActivityScopeConnected(currentUser.id);

  const { count: organizedCount } = await admin
    .from('activities')
    .select('*', { count: 'exact', head: true })
    .eq('organizer_id', currentUser.id);

  const { count: participationCount } = await admin
    .from('participations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', currentUser.id)
    .eq('status', 'approved');

  const { data: myActivities } = await admin
    .from('activities')
    .select('id, title, type, start_date')
    .eq('organizer_id', currentUser.id)
    .order('start_date', { ascending: false });

  const { data: profileRow } = await admin
    .from('profiles')
    .select('city, country, latitude, longitude')
    .eq('id', currentUser.id)
    .single();

  const username =
    currentUser.strava_username ??
    currentUser.name.toLowerCase().replace(/\s/g, '_');

  return (
    <div className="flex flex-col h-full bg-white">
      <header className="px-4 h-14 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-md z-40">
        <h1 className="text-xl font-bold text-gray-900">@{username}</h1>
        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <Settings className="w-6 h-6 text-gray-900" />
        </button>
      </header>

      <div className="overflow-y-auto pb-6">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="relative">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-20 h-20 rounded-full object-cover border-2 border-gray-100"
              />
            </div>

            <ShareInviteButton />
          </div>

          <div className="mb-3">
            <h2 className="text-xl font-bold text-gray-900">
              {currentUser.name}
            </h2>
          </div>

          <div className="flex gap-6 mb-4 text-center">
            <div>
              <p className="text-lg font-bold text-gray-900">
                {(organizedCount ?? 0) + (participationCount ?? 0)}
              </p>
              <p className="text-xs text-gray-500">Sorties</p>
            </div>
          </div>

          {currentUser.bio && (
            <p className="text-sm text-gray-700 whitespace-pre-line">
              {currentUser.bio}
            </p>
          )}

          {!stravaConnected && (
            <form
              action={async () => {
                'use server';
                await signIn('strava', { redirectTo: '/profile' });
              }}
              className="mt-4"
            >
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-primary/10 text-primary font-semibold py-3 rounded-xl hover:bg-primary/20 transition-colors text-sm"
              >
                <Zap className="w-4 h-4" />
                Reconnecter Strava pour activer le matching
              </button>
            </form>
          )}
        </div>

        <ProfileTabs
          activities={myActivities ?? []}
          city={profileRow?.city}
          country={profileRow?.country}
          latitude={profileRow?.latitude}
          longitude={profileRow?.longitude}
        />
      </div>
    </div>
  );
}

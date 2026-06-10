import { Settings, Grid, Map, Share } from 'lucide-react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session';
import { createAdminClient } from '@/lib/supabase-admin';

const mockGridPhotos = [
  'https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1541625602330-2277a4c4618c?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1502224562085-639556652f33?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1511994298241-608e28f14fde?q=80&w=400&auto=format&fit=crop',
];

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect('/login');
  }

  const admin = createAdminClient();

  const { count: organizedCount } = await admin
    .from('activities')
    .select('*', { count: 'exact', head: true })
    .eq('organizer_id', currentUser.id);

  const { count: participationCount } = await admin
    .from('participations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', currentUser.id)
    .eq('status', 'approved');

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

            <div className="flex gap-2">
              <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                Suivre
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <Share className="w-5 h-5 text-gray-600" />
              </button>
            </div>
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
            <div>
              <p className="text-lg font-bold text-gray-900">0</p>
              <p className="text-xs text-gray-500">Suiveurs</p>
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">0</p>
              <p className="text-xs text-gray-500">Abonnements</p>
            </div>
          </div>

          {currentUser.bio && (
            <p className="text-sm text-gray-700 whitespace-pre-line">
              {currentUser.bio}
            </p>
          )}
        </div>

        <div className="sticky top-14 bg-white border-b border-gray-100 z-30">
          <div className="flex gap-6 px-4 text-sm font-medium">
            <button className="py-3 text-primary border-b-2 border-primary flex items-center gap-1.5">
              <Grid className="w-4 h-4" />
              Grille
            </button>
            <button className="py-3 text-gray-600 border-b-2 border-transparent hover:text-gray-900 flex items-center gap-1.5">
              <Map className="w-4 h-4" />
              Carte
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1 p-0">
          {mockGridPhotos.map((photo, idx) => (
            <div
              key={idx}
              className="relative aspect-square overflow-hidden bg-gray-100"
            >
              <img
                src={photo}
                alt={`Photo ${idx + 1}`}
                className="w-full h-full object-cover hover:opacity-90 transition-opacity cursor-pointer"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

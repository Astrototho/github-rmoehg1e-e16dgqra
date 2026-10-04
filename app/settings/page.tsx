import Link from 'next/link';
import { Zap, MapPin, LogOut, FileText } from 'lucide-react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session';
import { createAdminClient } from '@/lib/supabase-admin';
import { hasActivityScopeConnected } from '@/lib/performance';
import { signIn } from '@/auth';
import { signOutAction } from '@/app/actions';
import LocationSettings from '@/components/LocationSettings';
import DeleteAccountButton from '@/components/DeleteAccountButton';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect('/login');
  }

  const stravaConnected = await hasActivityScopeConnected(currentUser.id);

  const { data: profileRow } = await createAdminClient()
    .from('profiles')
    .select('city, country')
    .eq('id', currentUser.id)
    .single();

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="px-4 py-6 bg-white border-b border-gray-100">
        <h1 className="text-2xl font-black text-gray-900">Paramètres</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Connexion Strava */}
        <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
          <h2 className="font-bold text-gray-900">Connexion Strava</h2>
          {stravaConnected ? (
            <p className="text-sm text-green-600 font-medium">
              ✓ Connecté — le matching est actif
            </p>
          ) : (
            <>
              <p className="text-sm text-gray-500">
                Reconnecte-toi pour activer le matching basé sur tes
                performances Strava.
              </p>
              <form
                action={async () => {
                  'use server';
                  await signIn('strava', { redirectTo: '/settings' });
                }}
              >
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-primary/10 text-primary font-semibold py-3 rounded-xl hover:bg-primary/20 transition-colors text-sm"
                >
                  <Zap className="w-4 h-4" />
                  Reconnecter Strava
                </button>
              </form>
            </>
          )}
        </section>

        {/* Localisation */}
        <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Localisation
          </h2>
          <LocationSettings city={profileRow?.city} country={profileRow?.country} />
        </section>

        {/* Légal */}
        <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <Link
            href="/legal"
            className="flex items-center gap-2 text-sm text-gray-700 hover:text-primary transition-colors"
          >
            <FileText className="w-4 h-4" />
            Politique de confidentialité
          </Link>
        </section>

        {/* Compte */}
        <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-2">
          <h2 className="font-bold text-gray-900">Compte</h2>
          <form action={signOutAction}>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Déconnexion
            </button>
          </form>
          <DeleteAccountButton />
        </section>
      </div>
    </div>
  );
}

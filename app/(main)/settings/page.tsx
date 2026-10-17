import Link from 'next/link';
import { Zap, MapPin, LogOut, FileText, Bookmark, Smartphone, Bell } from 'lucide-react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session';
import { hasActivityScopeConnected } from '@/lib/performance';
import { getSavedPlaces } from '@/lib/saved-places';
import SavedPlacesManager from '@/components/SavedPlacesManager';
import InstallAppPrompt from '@/components/InstallAppPrompt';
import PushNotificationsToggle from '@/components/PushNotificationsToggle';
import { signIn } from '@/auth';
import { signOutAction } from '@/app/actions';
import LocationSettings from '@/components/LocationSettings';
import DeleteAccountButton from '@/components/DeleteAccountButton';
import PoweredByStrava from '@/components/PoweredByStrava';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect('/login');
  }

  const [stravaConnected, savedPlaces] = await Promise.all([
    hasActivityScopeConnected(currentUser.id),
    getSavedPlaces(currentUser.id),
  ]);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="px-4 py-6 bg-white border-b border-gray-100">
        <h1 className="text-2xl font-black text-navy-900">Paramètres</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Connexion Strava */}
        <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
          <h2 className="font-bold text-navy-900">Connexion Strava</h2>
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
                  className="w-full flex items-center justify-center gap-2 bg-brand-50 text-brand-700 font-semibold py-3 rounded-xl hover:bg-brand-100 transition-colors text-sm"
                >
                  <Zap className="w-4 h-4" />
                  Reconnecter Strava
                </button>
              </form>
            </>
          )}
        </section>

        {/* Application installable (PWA) */}
        <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
          <h2 className="font-bold text-navy-900 flex items-center gap-2">
            <Smartphone className="w-4 h-4" />
            Application
          </h2>
          <InstallAppPrompt variant="card" />
        </section>

        {/* Notifications push */}
        <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
          <h2 className="font-bold text-navy-900 flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </h2>
          <PushNotificationsToggle />
        </section>

        {/* Localisation */}
        <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
          <h2 className="font-bold text-navy-900 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Localisation
          </h2>
          <LocationSettings city={currentUser.city} country={currentUser.country} />
        </section>

        {/* Lieux de départ enregistrés */}
        <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
          <h2 className="font-bold text-navy-900 flex items-center gap-2">
            <Bookmark className="w-4 h-4" />
            Mes lieux de départ
          </h2>
          <SavedPlacesManager places={savedPlaces} />
        </section>

        {/* Légal */}
        <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <Link
            href="/legal"
            className="flex min-h-[44px] items-center gap-2 text-sm text-gray-700 hover:text-primary transition-colors"
          >
            <FileText className="w-4 h-4" />
            Politique de confidentialité
          </Link>
        </section>

        {/* Compte */}
        <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-2">
          <h2 className="font-bold text-navy-900">Compte</h2>
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
        <PoweredByStrava className="py-2" />
      </div>
    </div>
  );
}

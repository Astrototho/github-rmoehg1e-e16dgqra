import Link from 'next/link';
import { Bell, Settings } from 'lucide-react';

import HeaderMenu from '@/components/HeaderMenu';
import BottomNav from '@/components/BottomNav';
import SessionMarker from '@/components/SessionMarker';
import { getCurrentUser } from '@/lib/session';
import { getUnreadConversationsCount } from '@/lib/messages';
import { getUnreadNotificationCount } from '@/lib/notifications';
import { refreshPerformanceProfileIfStale } from '@/lib/performance';
import { runInBackground } from '@/lib/background';

export const dynamic = 'force-dynamic';

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Une panne passagère de la base ne doit pas casser toute l'app : le
  // layout s'affiche alors comme pour un visiteur, la page gère son erreur.
  const currentUser = await getCurrentUser().catch(() => null);
  const [unreadMessages, unreadNotifications] = currentUser
    ? await Promise.all([
        getUnreadConversationsCount(currentUser.id),
        getUnreadNotificationCount(currentUser.id),
      ])
    : [0, 0];

  // Profil de performance Strava recalculé au plus une fois par jour, après
  // l'envoi de la page (aucun impact sur le temps d'affichage).
  if (currentUser) {
    runInBackground('rafraîchissement profil de performance', () =>
      refreshPerformanceProfileIfStale(currentUser.id)
    );
  }

  // Conteneur mobile (largeur de téléphone, centré sur ordinateur).
  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col bg-white shadow-2xl">
      {/* --- Barre supérieure --- */}
      <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur-md pt-safe">
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/" className="flex items-center" aria-label="Accueil PerfConnect">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="PerfConnect" className="h-7 w-auto" />
          </Link>

          <div className="flex items-center gap-1">
            <Link
              href="/notifications"
              aria-label="Notifications"
              className="relative rounded-full p-2 transition-colors hover:bg-gray-100"
            >
              <Bell className="h-6 w-6 stroke-[1.5]" />
              {unreadNotifications > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-[1.1rem] min-w-[1.1rem] items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              )}
            </Link>

            <Link
              href="/settings"
              aria-label="Paramètres"
              className="rounded-full p-2 transition-colors hover:bg-gray-100"
            >
              <Settings className="h-6 w-6 stroke-[1.5]" />
            </Link>

            <HeaderMenu isLoggedIn={!!currentUser} />
          </div>
        </div>
      </header>

      {/* --- Contenu de la page (espace réservé pour la barre du bas) --- */}
      <main className="flex-1 pb-nav">{children}</main>

      <BottomNav unreadMessages={unreadMessages} />
      {currentUser && <SessionMarker />}
    </div>
  );
}

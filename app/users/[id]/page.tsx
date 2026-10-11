import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { MapPin, MessageCircle, CalendarDays } from 'lucide-react';
import ActivityCard from '@/components/ActivityCard';
import ReportUserButton from '@/components/ReportUserButton';
import { getCurrentUser } from '@/lib/session';
import { DEFAULT_AVATAR, getUserById } from '@/lib/users';
import { getActivitiesByOrganizer } from '@/lib/activities';
import { getPerformanceProfilesForUsers } from '@/lib/performance';
import { computeMatchPercentage } from '@/lib/matching';
import { getSportEmoji, getSportLabel } from '@/lib/sports';
import { isOpen } from '@/lib/activity-rules';
import { APP_TIME_ZONE } from '@/lib/dates';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

// Profil public d'un membre : jamais de données Strava brutes (vitesse,
// activités...), seulement les sports pratiqués et le % de match avec le
// visiteur, comme annoncé dans la politique de confidentialité.
export default async function UserProfilePage({ params }: PageProps) {
  const { id } = await params;
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect('/login');
  if (id === currentUser.id) redirect('/profile');

  const user = await getUserById(id);
  if (!user) notFound();

  const [activities, performance, viewer] = await Promise.all([
    getActivitiesByOrganizer(user.id),
    getPerformanceProfilesForUsers([user.id, currentUser.id]),
    getUserById(currentUser.id),
  ]);

  const upcoming = activities
    .filter((a) => isOpen(a))
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
  const organizedCount = activities.filter((a) => a.status !== 'cancelled').length;

  const viewerFamilies = new Map(
    (performance[currentUser.id] ?? []).map((p) => [p.sportFamily, p])
  );
  const sports = (performance[user.id] ?? []).map((p) => ({
    family: p.sportFamily,
    match: computeMatchPercentage(viewerFamilies.get(p.sportFamily), p, viewer ?? {}, user),
  }));

  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString('fr-FR', {
        month: 'long',
        year: 'numeric',
        timeZone: APP_TIME_ZONE,
      })
    : null;

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-start gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={user.avatar_url ?? DEFAULT_AVATAR}
          alt={user.name}
          className="h-20 w-20 flex-shrink-0 rounded-full border-2 border-gray-100 object-cover"
        />
        <div className="min-w-0 flex-1 space-y-1">
          <h1 className="break-words text-xl font-bold text-gray-900">{user.name}</h1>
          {user.city && (
            <p className="flex items-center gap-1 text-sm text-gray-600">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">
                {user.city}
                {user.country ? `, ${user.country}` : ''}
              </span>
            </p>
          )}
          {memberSince && (
            <p className="flex items-center gap-1 text-xs text-gray-500">
              <CalendarDays className="h-3.5 w-3.5" />
              Membre depuis {memberSince}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href={`/messages/${user.id}`}
          className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-primary/10 text-sm font-semibold text-primary hover:bg-primary/20"
        >
          <MessageCircle className="h-4 w-4" />
          Contacter
        </Link>
        <ReportUserButton reportedId={user.id} reportedName={user.name} />
      </div>

      {user.bio && <p className="whitespace-pre-line text-sm text-gray-700">{user.bio}</p>}

      <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-bold text-gray-900">Sports pratiqués</h2>
        {sports.length === 0 ? (
          <p className="text-sm text-gray-500">Pas encore assez d&apos;activités Strava.</p>
        ) : (
          <ul className="space-y-2">
            {sports.map((s) => (
              <li key={s.family} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-sm text-gray-800">
                  <span aria-hidden="true">{getSportEmoji(s.family)}</span>
                  {getSportLabel(s.family)}
                </span>
                {s.match != null ? (
                  <span className="text-sm font-black text-green-600">{s.match}% match</span>
                ) : (
                  <span className="text-xs text-gray-400">match indisponible</span>
                )}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-gray-400">
          {organizedCount} sortie{organizedCount > 1 ? 's' : ''} organisée
          {organizedCount > 1 ? 's' : ''}
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="font-bold text-gray-900">Prochaines sorties</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-gray-500">Aucune sortie prévue pour le moment.</p>
        ) : (
          upcoming.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              href={`/activities/${activity.id}`}
            />
          ))
        )}
      </section>
    </div>
  );
}

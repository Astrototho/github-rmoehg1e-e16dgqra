import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { BadgePercent, Lock, MapPin, UserCheck } from 'lucide-react';
import { signIn } from '@/auth';
import { getCurrentUser } from '@/lib/session';
import { getActivityByIdFromDb } from '@/lib/activities';
import { activityIdFromCallback, safeCallbackUrl } from '@/lib/redirects';
import WelcomeHero from '@/components/welcome/WelcomeHero';
import StravaConnectButton from '@/components/welcome/StravaConnectButton';
import PoweredByStrava from '@/components/PoweredByStrava';

// Codes renvoyés dans ?error= par Auth.js (ou par le callback signIn).
const ERROR_MESSAGES: Record<string, string> = {
  StravaProfile:
    "Strava n'a pas transmis ton profil. Réessaie dans quelques minutes.",
  AccessDenied:
    'Connexion annulée. Pour continuer, autorise PerfConnect sur l\'écran Strava.',
};

const DEFAULT_ERROR_MESSAGE =
  'La connexion avec Strava a échoué. Réessaie dans quelques minutes.';

// Cookie posé quand le visiteur choisit de regarder les sorties sans compte :
// l'accueil ne le redirige plus vers cet écran.
const PREVIEW_COOKIE = 'pc_apercu';

interface LoginPageProps {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error, callbackUrl: rawCallback } = await searchParams;
  const callbackUrl = safeCallbackUrl(
    rawCallback,
    process.env.AUTH_URL ? new URL(process.env.AUTH_URL).origin : undefined
  );

  const [currentUser, cookieStore] = await Promise.all([
    getCurrentUser().catch(() => null),
    cookies(),
  ]);
  if (currentUser) redirect(callbackUrl);

  const activityId = activityIdFromCallback(callbackUrl);
  const activity = activityId ? await getActivityByIdFromDb(activityId) : null;
  const organizerFirstName = activity?.organizer_name.split(' ')[0];
  const variant = activity ? 'context' : cookieStore.has('pc_had_session') ? 'return' : 'first';

  const errorMessage = error ? ERROR_MESSAGES[error] ?? DEFAULT_ERROR_MESSAGE : null;

  async function connect() {
    'use server';
    await signIn('strava', { redirectTo: callbackUrl });
  }

  async function browseFirst() {
    'use server';
    (await cookies()).set(PREVIEW_COOKIE, '1', {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    });
    redirect(callbackUrl);
  }

  const title =
    variant === 'context'
      ? `Rejoins la sortie de ${organizerFirstName}`
      : variant === 'return'
        ? 'Content de te revoir !'
        : 'Trouve tes partenaires de sortie, à ton niveau.';
  const subtitle =
    variant === 'context'
      ? `Connecte-toi avec Strava : ${organizerFirstName} recevra ta demande tout de suite.`
      : variant === 'return'
        ? 'Reconnecte-toi pour retrouver tes sorties, tes demandes et tes messages.'
        : 'Trail, course à pied, vélo de route et VTT autour de Grenoble.';

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex h-14 items-center px-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="PerfConnect" width={102} height={28} className="h-7 w-auto" />
      </div>

      <div className="relative min-h-[180px] flex-1 overflow-hidden px-2 [max-height:40dvh]">
        <WelcomeHero />
      </div>

      <div className="px-6 pb-4">
        {variant === 'context' && activity && (
          <p className="welcome-rise mb-3 inline-block max-w-full truncate rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800">
            Pour rejoindre « {activity.title} »
          </p>
        )}
        <h1 className="welcome-rise text-[28px] font-black leading-[1.15] tracking-tight text-gray-900">
          {title}
        </h1>
        <p className="welcome-rise mt-2 text-base text-gray-600 [animation-delay:80ms]">{subtitle}</p>

        {variant === 'first' && (
          <ul className="mt-4 space-y-2 text-sm text-gray-700 [@media(max-height:700px)]:hidden">
            <li className="flex items-center gap-2">
              <BadgePercent className="h-[18px] w-[18px] text-brand-700" aria-hidden="true" />
              Un % de match avec chaque organisateur
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="h-[18px] w-[18px] text-brand-700" aria-hidden="true" />
              Des sorties près de chez toi, toute la semaine
            </li>
            <li className="flex items-center gap-2">
              <UserCheck className="h-[18px] w-[18px] text-brand-700" aria-hidden="true" />
              Tu demandes à rejoindre, l&apos;orga valide
            </li>
          </ul>
        )}

        {errorMessage && (
          <p
            role="alert"
            className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200"
          >
            {errorMessage}
          </p>
        )}

        <form action={connect} className="mt-6">
          <StravaConnectButton />
        </form>

        <form action={browseFirst} className="text-center">
          <button
            type="submit"
            className="mt-1 min-h-11 px-4 text-sm font-semibold text-gray-700 underline-offset-4 hover:underline"
          >
            {variant === 'context'
              ? 'Revenir à la sortie'
              : variant === 'return'
                ? 'Voir les sorties'
                : "Voir les sorties d'abord"}
          </button>
        </form>

        <div className="mt-4 space-y-2 border-t border-gray-100 pt-4">
          <p className="flex gap-2 text-[12px] leading-4 text-gray-600">
            <Lock className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
            Tes activités Strava servent seulement à calculer ton niveau. Les autres membres
            voient ton prénom, ta photo et votre % de match, jamais tes données Strava.
          </p>
          {variant !== 'return' && (
            <p className="text-[12px] leading-4 text-gray-600">
              Sur l&apos;écran Strava, laisse cochée l&apos;autorisation d&apos;accès à tes
              activités : c&apos;est elle qui calcule ton % de match.
            </p>
          )}
          <p className="text-[11px] text-gray-500">
            En te connectant, tu acceptes notre{' '}
            <Link href="/legal" className="text-gray-700 underline">
              Politique de confidentialité
            </Link>
            .
          </p>
          <PoweredByStrava className="pt-2" />
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  TrendingUp,
  Users,
  MessageCircle,
  Check,
  X,
  Clock,
  Pencil,
  Ban,
  Navigation,
  AlertCircle,
} from 'lucide-react';
import {
  cancelActivity,
  requestParticipation,
  updateParticipationStatus,
} from '@/app/actions';
import type { Activity, Participation, ParticipationWithUser } from '@/lib/types';
import ReportUserButton from '@/components/ReportUserButton';
import MatchFeedbackPrompt from '@/components/MatchFeedbackPrompt';
import LeafletMap from '@/components/maps/LeafletMap';
import { getSportEmoji, getSportLabel } from '@/lib/sports';
import { formatLongDate, formatTime } from '@/lib/dates';
import { getDirectionsLinks } from '@/lib/places';
import { isPast as isActivityPast } from '@/lib/activity-rules';

interface ActivityDetailClientProps {
  activity: Activity;
  participations: {
    pending: ParticipationWithUser[];
    approved: ParticipationWithUser[];
  };
  myParticipation: Participation | null;
  currentUserId: string | null;
  isOrganizer: boolean;
  canEdit: boolean;
  matchPercentage: number | null;
  myMatchFeedback: boolean | null;
}

export default function ActivityDetailClient({
  activity,
  participations,
  myParticipation,
  currentUserId,
  isOrganizer,
  canEdit,
  matchPercentage,
  myMatchFeedback,
}: ActivityDetailClientProps) {
  const router = useRouter();
  const [pending, setPending] = useState(participations.pending);
  const [approved, setApproved] = useState(participations.approved);
  const [myStatus, setMyStatus] = useState(myParticipation?.status ?? null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const cancelled = activity.status === 'cancelled';
  const past = isActivityPast(activity);
  const open = !cancelled && !past;
  const hasCoords = activity.latitude != null && activity.longitude != null;
  const latitude = Number(activity.latitude);
  const longitude = Number(activity.longitude);
  const directions = hasCoords ? getDirectionsLinks(latitude, longitude) : null;

  const handleRequest = async () => {
    setIsRequesting(true);
    setError(null);
    const result = await requestParticipation(activity.id);
    if (result.success) {
      setMyStatus('pending');
    } else {
      setError(result.error);
    }
    setIsRequesting(false);
  };

  const handleUpdateStatus = async (
    participation: ParticipationWithUser,
    status: 'approved' | 'rejected'
  ) => {
    setActionLoading(participation.id);
    setError(null);
    const result = await updateParticipationStatus(participation.id, status);
    if (result.success) {
      setPending((prev) => prev.filter((p) => p.id !== participation.id));
      if (status === 'approved') {
        setApproved((prev) => [...prev, { ...participation, status: 'approved' }]);
      }
    } else {
      setError(result.error);
    }
    setActionLoading(null);
  };

  const handleCancel = async () => {
    setIsCancelling(true);
    setError(null);
    const result = await cancelActivity(activity.id);
    setIsCancelling(false);
    setConfirmingCancel(false);
    if (!result.success) setError(result.error);
  };

  return (
    <div className="flex min-h-full flex-col bg-gray-50">
      <div className="sticky top-header z-40 flex h-14 items-center gap-3 border-b bg-white px-4">
        <button
          type="button"
          onClick={() => (window.history.length > 1 ? router.back() : router.push('/'))}
          aria-label="Retour"
          className="-ml-2 rounded-full p-2 transition-colors hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5 text-gray-700" />
        </button>
        <h1 className="flex-1 truncate font-bold text-gray-900">Détail de la sortie</h1>
      </div>

      {/* Carte du point de départ + titre */}
      <div className="relative z-0 h-56 bg-gradient-to-br from-primary/20 to-primary/5">
        {hasCoords ? (
          <LeafletMap latitude={latitude} longitude={longitude} className="absolute inset-0" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-7xl opacity-30">
            {getSportEmoji(activity.type)}
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 z-[400] bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        <div className="pointer-events-none absolute left-4 top-4 z-[400] flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 backdrop-blur-sm">
          <span aria-hidden="true">{getSportEmoji(activity.type)}</span>
          <span className="text-sm font-medium text-gray-900">{getSportLabel(activity.type)}</span>
        </div>
        {matchPercentage != null && (
          <div className="pointer-events-none absolute right-4 top-4 z-[400] flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow-lg">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            <span className="font-black text-green-600">{matchPercentage}%</span>
            <span className="text-xs font-semibold text-gray-500">match</span>
          </div>
        )}
        <div className="pointer-events-none absolute bottom-6 left-4 right-4 z-[400]">
          <h2 className="break-words text-2xl font-black text-white drop-shadow-lg">
            {activity.title}
          </h2>
        </div>
      </div>

      <div className="space-y-4 p-4">
        {cancelled && (
          <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            <Ban className="mt-0.5 h-4 w-4 flex-shrink-0" />
            Cette sortie a été annulée par l&apos;organisateur.
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Infos pratiques */}
        <div className="space-y-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-gray-700">
            <TrendingUp className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium">
              {activity.distance} km · {activity.elevation} m D+
            </span>
          </div>
          <div className="flex items-start gap-2 text-gray-700">
            <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
            <span className="break-words text-sm">{activity.location}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-sm first-letter:uppercase">
              {formatLongDate(activity.start_date)} à {formatTime(activity.start_date)}
            </span>
          </div>

          {directions && !cancelled && (
            <div className="border-t border-gray-100 pt-3">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
                <Navigation className="h-3.5 w-3.5" />
                Itinéraire jusqu&apos;au départ
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { href: directions.google, label: 'Google Maps' },
                  { href: directions.apple, label: 'Plans' },
                  { href: directions.waze, label: 'Waze' },
                ].map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-[44px] items-center justify-center rounded-xl bg-gray-100 px-2 text-center text-xs font-semibold text-gray-800 hover:bg-gray-200"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions de l'organisateur */}
        {isOrganizer && !cancelled && !past && (
          <div className="space-y-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            {canEdit ? (
              confirmingCancel ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-800">
                    Annuler la sortie ? Les participants seront prévenus. Cette action est
                    définitive.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmingCancel(false)}
                      disabled={isCancelling}
                      className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-700 disabled:opacity-50"
                    >
                      Retour
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={isCancelling}
                      className="flex-1 rounded-xl bg-red-600 py-3 text-sm font-bold text-white disabled:opacity-50"
                    >
                      {isCancelling ? 'Annulation...' : 'Confirmer'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href={`/activities/${activity.id}/edit`}
                    className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-primary/10 text-sm font-semibold text-primary hover:bg-primary/20"
                  >
                    <Pencil className="h-4 w-4" />
                    Modifier
                  </Link>
                  <button
                    type="button"
                    onClick={() => setConfirmingCancel(true)}
                    className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-red-50 text-sm font-semibold text-red-600 hover:bg-red-100"
                  >
                    <Ban className="h-4 w-4" />
                    Annuler la sortie
                  </button>
                </div>
              )
            ) : (
              <p className="text-sm text-gray-500">
                Modification et annulation impossibles moins d&apos;1 h avant le départ.
              </p>
            )}
          </div>
        )}

        {activity.description && (
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <h3 className="mb-2 font-bold text-gray-900">Description</h3>
            <p className="whitespace-pre-line break-words text-sm leading-relaxed text-gray-600">
              {activity.description}
            </p>
          </div>
        )}

        {/* Organisateur */}
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <h3 className="mb-3 font-bold text-gray-900">Organisateur</h3>
          <div className="flex flex-wrap items-center gap-3">
            {/* Largeur mini : sur petit écran, les boutons passent à la ligne
                plutôt que de tronquer le nom. */}
            <Link
              href={currentUserId ? `/users/${activity.organizer_id}` : '/login'}
              className="flex min-w-[12rem] flex-1 items-center gap-3"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activity.organizer_avatar}
                alt=""
                className="h-12 w-12 flex-shrink-0 rounded-full border-2 border-gray-100 object-cover"
              />
              <div className="min-w-0">
                <p className="truncate font-semibold text-gray-900">{activity.organizer_name}</p>
                <p className="text-xs text-primary">Voir le profil</p>
              </div>
            </Link>
            {!isOrganizer && currentUserId && (
              <Link
                href={`/messages/${activity.organizer_id}`}
                className="flex min-h-[44px] items-center gap-2 rounded-xl bg-primary/10 px-4 text-sm font-semibold text-primary transition-colors hover:bg-primary/20"
              >
                <MessageCircle className="h-4 w-4" />
                Contacter
              </Link>
            )}
            {!isOrganizer && currentUserId && (
              <ReportUserButton
                activityId={activity.id}
                reportedId={activity.organizer_id}
                reportedName={activity.organizer_name}
              />
            )}
          </div>
        </div>

        {/* Participants confirmés */}
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Users className="h-5 w-5 text-gray-400" />
            <h3 className="font-bold text-gray-900">
              Participants confirmés ({approved.length})
            </h3>
          </div>
          {approved.length === 0 ? (
            <p className="text-sm text-gray-500">
              Personne n&apos;a encore été accepté sur cette sortie.
            </p>
          ) : (
            <div className="space-y-3">
              {approved.map((p) => (
                <div key={p.id} className="flex flex-wrap items-center gap-3">
                  <Link
                    href={currentUserId ? `/users/${p.user_id}` : '/login'}
                    className="flex min-w-[10rem] flex-1 items-center gap-3"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.user_avatar}
                      alt=""
                      className="h-10 w-10 flex-shrink-0 rounded-full border border-gray-100 object-cover"
                    />
                    <p className="truncate text-sm font-medium text-gray-900">{p.user_name}</p>
                  </Link>
                  {currentUserId && p.user_id !== currentUserId && (
                    <>
                      <Link
                        href={`/messages/${p.user_id}`}
                        className="flex min-h-[44px] items-center gap-1 px-2 text-xs font-semibold text-primary hover:underline"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        Contacter
                      </Link>
                      <ReportUserButton
                        activityId={activity.id}
                        reportedId={p.user_id}
                        reportedName={p.user_name}
                      />
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Retour sur le matching (sortie passée, participant confirmé) */}
        {!isOrganizer && past && !cancelled && myStatus === 'approved' && (
          <MatchFeedbackPrompt
            activityId={activity.id}
            ratedName={activity.organizer_name}
            initialAnswer={myMatchFeedback}
          />
        )}

        {/* Demandes en attente (organisateur) */}
        {isOrganizer && !cancelled && pending.length > 0 && (
          <div className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              <h3 className="font-bold text-gray-900">Demandes en attente ({pending.length})</h3>
            </div>
            <div className="space-y-3">
              {pending.map((p) => (
                <div key={p.id} className="flex items-center gap-3 rounded-xl bg-amber-50 p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.user_avatar}
                    alt=""
                    className="h-10 w-10 flex-shrink-0 rounded-full border border-white object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/users/${p.user_id}`}
                      className="block truncate text-sm font-medium text-gray-900"
                    >
                      {p.user_name}
                    </Link>
                    <div className="flex flex-wrap items-center gap-x-2">
                      {p.match_percentage != null && (
                        <span className="text-xs font-bold text-green-600">
                          {p.match_percentage}% match
                        </span>
                      )}
                      <Link
                        href={`/messages/${p.user_id}`}
                        className="text-xs text-primary hover:underline"
                      >
                        Envoyer un message
                      </Link>
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(p, 'approved')}
                      disabled={actionLoading === p.id}
                      aria-label={`Accepter ${p.user_name}`}
                      className="flex h-11 w-11 items-center justify-center rounded-lg bg-green-500 text-white transition-colors hover:bg-green-600 disabled:opacity-50"
                    >
                      <Check className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(p, 'rejected')}
                      disabled={actionLoading === p.id}
                      aria-label={`Refuser ${p.user_name}`}
                      className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-500 text-white transition-colors hover:bg-red-600 disabled:opacity-50"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action participation (non-organisateur) */}
        {!isOrganizer && (
          <div className="sticky bottom-nav-offset z-30 pb-2">
            {!currentUserId ? (
              <Link
                href="/login"
                className="block w-full rounded-2xl bg-primary py-4 text-center font-bold text-white shadow-lg shadow-primary/20 transition-colors hover:bg-primary/90"
              >
                Connecte-toi pour participer
              </Link>
            ) : myStatus === 'approved' ? (
              <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-center font-semibold text-green-700">
                ✓ Tu participes à cette sortie
              </div>
            ) : !open ? (
              <div className="rounded-2xl border border-gray-200 bg-gray-100 p-4 text-center text-sm font-semibold text-gray-600">
                {cancelled ? 'Sortie annulée' : 'Sortie terminée'}
              </div>
            ) : myStatus === 'pending' ? (
              <div className="flex items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center font-semibold text-amber-700">
                <Clock className="h-5 w-5" />
                Demande en attente de validation
              </div>
            ) : (
              <button
                type="button"
                onClick={handleRequest}
                disabled={isRequesting}
                className="w-full rounded-2xl bg-primary py-4 font-bold text-white shadow-lg shadow-primary/20 transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {isRequesting
                  ? 'Envoi...'
                  : myStatus === 'rejected'
                    ? 'Refaire une demande de participation'
                    : 'Demander à participer'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

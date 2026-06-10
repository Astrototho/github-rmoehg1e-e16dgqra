'use client';

import { useState } from 'react';
import Link from 'next/link';
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
} from 'lucide-react';
import {
  requestParticipation,
  updateParticipationStatus,
} from '@/app/actions';
import type { Activity, Participation, ParticipationWithUser } from '@/lib/types';

interface ActivityDetailClientProps {
  activity: Activity;
  participations: {
    pending: ParticipationWithUser[];
    approved: ParticipationWithUser[];
  };
  myParticipation: Participation | null;
  currentUserId: string | null;
  isOrganizer: boolean;
}

const sportLabels: Record<string, string> = {
  trail: 'Trail',
  'course-a-pied': 'Course à pied',
  'velo-route': 'Vélo route',
  velo: 'Vélo',
  vtt: 'VTT',
};

const sportEmojis: Record<string, string> = {
  trail: '⛰️',
  'course-a-pied': '🏃',
  'velo-route': '🚴',
  velo: '🚴',
  vtt: '🚵',
};

export default function ActivityDetailClient({
  activity,
  participations,
  myParticipation,
  currentUserId,
  isOrganizer,
}: ActivityDetailClientProps) {
  const [pending, setPending] = useState(participations.pending);
  const [approved, setApproved] = useState(participations.approved);
  const [myStatus, setMyStatus] = useState(myParticipation?.status ?? null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const sportLabel = sportLabels[activity.type] || activity.type;
  const sportEmoji = sportEmojis[activity.type] || '🏅';

  const dateObj = new Date(activity.start_date);
  const dateStr = dateObj.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const timeStr = dateObj
    .toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    .replace(':', 'h');

  const handleRequest = async () => {
    setIsRequesting(true);
    const result = await requestParticipation(activity.id);
    if (result.success) {
      setMyStatus('pending');
    } else {
      alert(result.error);
    }
    setIsRequesting(false);
  };

  const handleUpdateStatus = async (
    participationId: string,
    status: 'approved' | 'rejected',
    participation: ParticipationWithUser
  ) => {
    setActionLoading(participationId);
    const result = await updateParticipationStatus(participationId, status);
    if (result.success) {
      setPending((prev) => prev.filter((p) => p.id !== participationId));
      if (status === 'approved') {
        setApproved((prev) => [...prev, { ...participation, status: 'approved' }]);
      }
    } else {
      alert(result.error);
    }
    setActionLoading(null);
  };

  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      {/* Header */}
      <div className="sticky top-14 z-40 bg-white border-b px-4 h-14 flex items-center gap-3">
        <Link
          href="/"
          className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </Link>
        <h1 className="font-bold text-gray-900 truncate flex-1">
          Détail de la sortie
        </h1>
      </div>

      {/* Hero */}
      <div className="relative h-48 bg-gradient-to-br from-primary/20 to-primary/5">
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1.5">
          <span>{sportEmoji}</span>
          <span className="text-gray-900 text-sm font-medium">{sportLabel}</span>
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <h2 className="text-2xl font-black text-white drop-shadow-lg">
            {activity.title}
          </h2>
        </div>
      </div>

      <div className="p-4 space-y-4 -mt-2">
        {/* Stats */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
          <div className="flex items-center gap-2 text-gray-700">
            <TrendingUp className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium">
              {activity.distance} km · {activity.elevation}m D+
            </span>
          </div>
          <div className="flex items-start gap-2 text-gray-700">
            <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <span className="text-sm">{activity.location}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-sm capitalize">
              {dateStr} à {timeStr}
            </span>
          </div>
        </div>

        {/* Description */}
        {activity.description && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-2">Description</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              {activity.description}
            </p>
          </div>
        )}

        {/* Organisateur */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-3">Organisateur</h3>
          <div className="flex items-center gap-3">
            <img
              src={activity.organizer_avatar}
              alt={activity.organizer_name}
              className="w-12 h-12 rounded-full border-2 border-gray-100"
            />
            <div className="flex-1">
              <p className="font-semibold text-gray-900">
                {activity.organizer_name}
              </p>
              <p className="text-gray-500 text-xs">Créateur de la sortie</p>
            </div>
            {!isOrganizer && currentUserId && (
              <Link
                href={`/messages/${activity.organizer_id}`}
                className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary/20 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                Contacter
              </Link>
            )}
          </div>
        </div>

        {/* Participants confirmés */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-5 h-5 text-gray-400" />
            <h3 className="font-bold text-gray-900">
              Participants confirmés ({approved.length})
            </h3>
          </div>
          {approved.length === 0 ? (
            <p className="text-gray-500 text-sm">
              Personne n&apos;a encore été accepté sur cette sortie.
            </p>
          ) : (
            <div className="space-y-3">
              {approved.map((p) => (
                <div key={p.id} className="flex items-center gap-3">
                  <img
                    src={p.user_avatar}
                    alt={p.user_name}
                    className="w-10 h-10 rounded-full border border-gray-100"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">
                      {p.user_name}
                    </p>
                  </div>
                  {!isOrganizer && p.user_id !== currentUserId && (
                    <Link
                      href={`/messages/${p.user_id}`}
                      className="text-primary text-xs font-semibold hover:underline"
                    >
                      Contacter
                    </Link>
                  )}
                  {isOrganizer && p.user_id !== currentUserId && (
                    <Link
                      href={`/messages/${p.user_id}`}
                      className="flex items-center gap-1 text-primary text-xs font-semibold hover:underline"
                    >
                      <MessageCircle className="w-3 h-3" />
                      Contacter
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Demandes en attente (organisateur) */}
        {isOrganizer && pending.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-amber-100">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-gray-900">
                Demandes en attente ({pending.length})
              </h3>
            </div>
            <div className="space-y-3">
              {pending.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl"
                >
                  <img
                    src={p.user_avatar}
                    alt={p.user_name}
                    className="w-10 h-10 rounded-full border border-white"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">
                      {p.user_name}
                    </p>
                    <Link
                      href={`/messages/${p.user_id}`}
                      className="text-primary text-xs hover:underline"
                    >
                      Envoyer un message
                    </Link>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleUpdateStatus(p.id, 'approved', p)}
                      disabled={actionLoading === p.id}
                      className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
                      title="Accepter"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(p.id, 'rejected', p)}
                      disabled={actionLoading === p.id}
                      className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
                      title="Refuser"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action participation (non-organisateur) */}
        {!isOrganizer && (
          <div className="sticky bottom-20 pb-2">
            {!currentUserId ? (
              <Link
                href="/login"
                className="block w-full bg-primary text-white font-bold py-4 rounded-2xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 text-center"
              >
                Connecte-toi pour participer
              </Link>
            ) : myStatus === 'approved' ? (
              <div className="bg-green-50 border border-green-200 text-green-700 rounded-2xl p-4 text-center font-semibold">
                ✓ Tu participes à cette sortie
              </div>
            ) : myStatus === 'pending' ? (
              <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-2xl p-4 text-center font-semibold flex items-center justify-center gap-2">
                <Clock className="w-5 h-5" />
                Demande en attente de validation
              </div>
            ) : myStatus === 'rejected' ? (
              <button
                onClick={handleRequest}
                disabled={isRequesting}
                className="w-full bg-primary text-white font-bold py-4 rounded-2xl hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-lg shadow-primary/20"
              >
                {isRequesting ? 'Envoi...' : 'Refaire une demande de participation'}
              </button>
            ) : (
              <button
                onClick={handleRequest}
                disabled={isRequesting}
                className="w-full bg-primary text-white font-bold py-4 rounded-2xl hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-lg shadow-primary/20"
              >
                {isRequesting ? 'Envoi...' : 'Demander à participer'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

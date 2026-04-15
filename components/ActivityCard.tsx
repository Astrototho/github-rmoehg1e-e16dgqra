import { MapPin, Calendar, TrendingUp, Users } from 'lucide-react';

// 1. On met à jour l'interface pour coller EXACTEMENT à Supabase
export interface Activity {
  id: string;
  title: string; // Nouveau : Le titre de la sortie
  type: string; // Ancien 'sport'
  start_date: string; // Remplace 'date' et 'time'
  location: string;
  distance: number;
  elevation: number;
  description?: string;
  organizer_id: string; // Nouveaux champs pour l'organisateur
  organizer_name: string;
  organizer_avatar: string;

  // Champs purement visuels (optionnels car pas encore dans la base)
  routeImage?: string;
  matchPercentage?: number;
  participants?: any[];
}

// 2. Props du composant
interface ActivityCardProps {
  activity: Activity;
  onClick?: () => void;
  hasStatusBadge?: boolean;
}

export default function ActivityCard({
  activity,
  onClick,
  hasStatusBadge = false,
}: ActivityCardProps) {
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

  // On utilise activity.type
  const sportLabel = sportLabels[activity.type] || activity.type;
  const sportEmoji = sportEmojis[activity.type] || '🏅';

  // Formatage de la date ET de l'heure à partir de start_date
  const dateObj = new Date(activity.start_date);
  const dateStr = dateObj.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });
  const timeStr = dateObj
    .toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    .replace(':', 'h');

  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-200 text-left"
    >
      {/* Map Background */}
      <div className="relative h-40 overflow-hidden bg-slate-100">
        {activity.routeImage && (
          <img
            src={activity.routeImage}
            alt="Route"
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Match Badge (Affiché seulement s'il existe) */}
        {activity.matchPercentage && (
          <div className="absolute top-3 right-3 bg-white rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-lg">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-green-600 font-bold">
              {activity.matchPercentage}%
            </span>
          </div>
        )}

        {/* Sport Badge */}
        <div
          className={`absolute ${
            hasStatusBadge ? 'top-14' : 'top-3'
          } left-3 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1.5`}
        >
          <span>{sportEmoji}</span>
          <span className="text-gray-900 text-sm font-medium">
            {sportLabel}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Le Titre (Nouveau) */}
        <h3 className="text-lg font-bold text-gray-900 mb-3">
          {activity.title}
        </h3>

        {/* User Info */}
        <div className="flex items-center gap-3 mb-3">
          <img
            src={activity.organizer_avatar}
            alt={activity.organizer_name}
            className="w-10 h-10 rounded-full border-2 border-gray-200 bg-slate-100"
          />
          <div className="flex-1">
            <p className="text-gray-900 font-medium">
              {activity.organizer_name}
            </p>
            <p className="text-gray-500 text-xs">Organisateur</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="flex items-center gap-2 text-gray-700">
            <TrendingUp className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium">
              {activity.distance} km / {activity.elevation}m D+
            </span>
          </div>
          {activity.participants && activity.participants.length > 0 && (
            <div className="flex items-center gap-2 text-gray-700">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-sm">
                {activity.participants.length} participant
                {activity.participants.length > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {/* Location & Date */}
        <div className="space-y-2">
          <div className="flex items-start gap-2 text-gray-700">
            <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <span className="text-sm">{activity.location}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <Calendar className="w-4 h-4 text-gray-400" />
            {/* On utilise notre date et heure formatées */}
            <span className="text-sm">
              {dateStr} à {timeStr}
            </span>
          </div>
        </div>

        {/* Description Preview */}
        {activity.description && (
          <p className="text-gray-600 text-sm mt-3 line-clamp-2">
            {activity.description}
          </p>
        )}
      </div>
    </button>
  );
}

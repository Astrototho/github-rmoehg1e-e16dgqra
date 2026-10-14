'use client';

import TimeSelect from '@/components/TimeSelect';
import { useRef, useState } from 'react';
import { MapPin, Calendar, TrendingUp, AlertCircle } from 'lucide-react';
import { createActivity, updateActivity } from '@/app/actions';
import StartPlacePicker from '@/components/StartPlacePicker';
import type { Coordinates } from '@/components/maps/MapPickerModal';
import { SPORTS, type ActivityType } from '@/lib/sports';
import { todayInParis, toParisInputValues } from '@/lib/dates';
import { DESCRIPTION_MAX, TITLE_MAX, buildDefaultTitle } from '@/lib/constraints';
import type { Activity, SavedPlace } from '@/lib/types';

// Libellés courts pour tenir sur 4 colonnes, même sur un écran de 320 px.
const SHORT_LABELS: Record<ActivityType, string> = {
  trail: 'Trail',
  'course-a-pied': 'Course',
  'velo-route': 'Route',
  vtt: 'VTT',
};

const inputClass =
  'w-full min-w-0 rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50';

interface PropositionFormProps {
  savedPlaces: SavedPlace[];
  fallbackCenter: Coordinates;
  // Présent en mode modification.
  activity?: Activity;
}

export default function PropositionForm({
  savedPlaces,
  fallbackCenter,
  activity,
}: PropositionFormProps) {
  const isEdit = !!activity;
  const errorRef = useRef<HTMLDivElement>(null);
  const [sport, setSport] = useState<ActivityType>(
    (SPORTS.find((s) => s.value === activity?.type)?.value as ActivityType) ?? 'trail'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialDateTime = activity ? toParisInputValues(activity.start_date) : null;
  // Un titre généré automatiquement n'est pas pré-rempli : il sera régénéré
  // avec les nouvelles valeurs (distance, lieu...) s'il reste vide.
  const initialTitle =
    activity && activity.title !== buildDefaultTitle(activity) ? activity.title : undefined;
  const initialCoords =
    activity?.latitude != null && activity?.longitude != null
      ? { latitude: Number(activity.latitude), longitude: Number(activity.longitude) }
      : null;

  const showError = (message: string) => {
    setError(message);
    // Le message est en haut du formulaire : on le rend visible sur mobile.
    requestAnimationFrame(() =>
      errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    if (!formData.get('latitude') || !formData.get('longitude')) {
      showError('Place le point de départ sur la carte.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = activity
      ? await updateActivity(activity.id, formData)
      : await createActivity(formData);

    // En cas de succès, l'action redirige directement vers la sortie.
    setIsSubmitting(false);
    showError(result.success ? 'Une erreur inattendue est survenue.' : result.error);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-5">

      {error && (
        <div
          ref={errorRef}
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <fieldset>
        <input type="hidden" name="type" value={sport} />
        <legend className="mb-3 block text-sm font-medium text-gray-700">Sport</legend>
        <div className="grid grid-cols-4 gap-2">
          {SPORTS.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setSport(s.value)}
              aria-pressed={sport === s.value}
              className={`flex min-h-[64px] flex-col items-center justify-center rounded-xl border-2 p-2 transition-all ${
                sport === s.value
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-100 bg-white hover:border-gray-200'
              }`}
            >
              <span className="mb-1 text-2xl" aria-hidden="true">
                {s.emoji}
              </span>
              <span className="text-xs font-medium">{SHORT_LABELS[s.value]}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-1 gap-4 min-[360px]:grid-cols-2">
        <div className="min-w-0">
          <label htmlFor="date" className="mb-2 flex items-center text-sm font-medium text-gray-700">
            <Calendar className="mr-2 h-4 w-4 text-gray-400" />
            Date
          </label>
          <input
            id="date"
            type="date"
            name="date"
            required
            min={todayInParis()}
            defaultValue={initialDateTime?.date}
            className={inputClass}
          />
        </div>
        <div className="min-w-0">
          <p className="mb-2 block text-sm font-medium text-gray-700">Heure</p>
          <TimeSelect name="time" defaultValue={initialDateTime?.time} className={inputClass} />
        </div>
      </div>

      <div>
        <p className="mb-2 flex items-center text-sm font-medium text-gray-700">
          <MapPin className="mr-2 h-4 w-4 text-gray-400" />
          Lieu de départ
        </p>
        <StartPlacePicker
          savedPlaces={savedPlaces}
          fallbackCenter={fallbackCenter}
          initialName={activity?.location}
          initialCoords={initialCoords}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 min-[360px]:grid-cols-2">
        <div className="min-w-0">
          <label
            htmlFor="distance"
            className="mb-2 flex items-center text-sm font-medium text-gray-700"
          >
            <TrendingUp className="mr-2 h-4 w-4 text-gray-400" />
            Distance (km)
          </label>
          <input
            id="distance"
            type="number"
            name="distance"
            inputMode="decimal"
            placeholder="Ex : 28"
            required
            step="0.1"
            min="0.1"
            max="1000"
            defaultValue={activity?.distance}
            className={inputClass}
          />
        </div>
        <div className="min-w-0">
          <label htmlFor="elevation" className="mb-2 block text-sm font-medium text-gray-700">
            Dénivelé (m D+)
          </label>
          <input
            id="elevation"
            type="number"
            name="elevation"
            inputMode="numeric"
            placeholder="Ex : 1800"
            required
            step="1"
            min="0"
            max="20000"
            defaultValue={activity?.elevation}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="title" className="mb-2 block text-sm font-medium text-gray-700">
          Titre <span className="font-normal text-gray-400">(optionnel)</span>
        </label>
        <input
          id="title"
          type="text"
          name="title"
          maxLength={TITLE_MAX}
          placeholder="Généré automatiquement si vide"
          defaultValue={initialTitle}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="description" className="mb-2 block text-sm font-medium text-gray-700">
          Description <span className="font-normal text-gray-400">(optionnel)</span>
        </label>
        <textarea
          id="description"
          name="description"
          placeholder="Décris l'ambiance, le niveau attendu..."
          rows={3}
          maxLength={DESCRIPTION_MAX}
          defaultValue={activity?.description ?? undefined}
          className={`${inputClass} resize-none`}
        />
      </div>

      {isEdit && (
        <p className="text-xs text-gray-500">
          Les participants (acceptés et en attente) seront prévenus des changements.
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-xl bg-primary py-3.5 font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
      >
        {isSubmitting
          ? isEdit
            ? 'Enregistrement...'
            : 'Publication en cours...'
          : isEdit
            ? 'Enregistrer les modifications'
            : 'Publier ma sortie'}
      </button>
    </form>
  );
}

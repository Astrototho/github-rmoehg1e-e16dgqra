'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation'; // <-- Ajout de useRouter
import { X, MapPin, Calendar, TrendingUp } from 'lucide-react';
import { createActivity } from '@/app/actions';

type SportType = 'trail' | 'course-a-pied' | 'velo-route' | 'vtt';

interface PropositionFormProps {
  onClose?: () => void;
}

export default function PropositionForm({ onClose }: PropositionFormProps) {
  const [sport, setSport] = useState<SportType>('trail');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Initialisation du router
  const router = useRouter();

  const actionHandler = async (formData: FormData) => {
    setIsSubmitting(true);

    // On attend la réponse du serveur
    const result = await createActivity(formData);

    if (result.success) {
      // Si c'est un succès, on nettoie tout
      if (formRef.current) formRef.current.reset();
      if (onClose) onClose();

      // On force le rafraîchissement des données de la page d'accueil
      router.refresh();
      // Et on redirige
      router.push('/');
    } else {
      // S'il y a une erreur, on l'affiche et on arrête le chargement
      alert(result.error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <header className="flex items-center justify-between px-4 h-14 border-b border-gray-100 bg-gray-50/50">
        <span className="font-semibold text-gray-900 ml-2">
          Nouvelle sortie
        </span>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        )}
      </header>

      <form ref={formRef} action={actionHandler} className="p-6">
        <input type="hidden" name="type" value={sport} />

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Titre de la sortie
          </label>
          <input
            type="text"
            name="title"
            placeholder="Ex: Sortie longue à la Bastille"
            required
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Type de sortie
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSport('trail')}
              className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center ${
                sport === 'trail'
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-100 bg-white hover:border-gray-200'
              }`}
            >
              <div className="text-2xl mb-1">⛰️</div>
              <div className="text-sm font-medium">Trail</div>
            </button>
            <button
              type="button"
              onClick={() => setSport('course-a-pied')}
              className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center ${
                sport === 'course-a-pied'
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-100 bg-white hover:border-gray-200'
              }`}
            >
              <div className="text-2xl mb-1">🏃</div>
              <div className="text-sm font-medium">Course</div>
            </button>
            <button
              type="button"
              onClick={() => setSport('velo-route')}
              className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center ${
                sport === 'velo-route'
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-100 bg-white hover:border-gray-200'
              }`}
            >
              <div className="text-2xl mb-1">🚴</div>
              <div className="text-sm font-medium">Route</div>
            </button>
            <button
              type="button"
              onClick={() => setSport('vtt')}
              className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center ${
                sport === 'vtt'
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-100 bg-white hover:border-gray-200'
              }`}
            >
              <div className="text-2xl mb-1">🚵</div>
              <div className="text-sm font-medium">VTT</div>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-gray-400" />
              Date
            </label>
            <input
              type="date"
              name="date"
              required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Heure
            </label>
            <input
              type="time"
              name="time"
              required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
            <MapPin className="w-4 h-4 mr-2 text-gray-400" />
            Lieu de départ
          </label>
          <input
            type="text"
            name="location"
            placeholder="Ex: Parking de la Mairie"
            required
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2 text-gray-400" />
              Distance (km)
            </label>
            <input
              type="number"
              name="distance"
              placeholder="Ex: 28"
              required
              step="0.1"
              min="0"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              Dénivelé (m D+)
            </label>
            <input
              type="number"
              name="elevation"
              placeholder="Ex: 1800"
              required
              step="1"
              min="0"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description (optionnel)
          </label>
          <textarea
            name="description"
            placeholder="Décrivez l'ambiance, le niveau attendu..."
            rows={3}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-primary hover:bg-primary/90 text-white py-3.5 rounded-xl font-bold transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Publication en cours...' : 'Publier ma sortie'}
        </button>
      </form>
    </div>
  );
}

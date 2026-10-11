'use client';

import { useState } from 'react';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import { deleteSavedPlaceAction, renameSavedPlaceAction } from '@/app/actions';
import { PLACE_NAME_MAX } from '@/lib/constraints';
import type { SavedPlace } from '@/lib/types';

interface SavedPlacesManagerProps {
  places: SavedPlace[];
}

/** Liste des lieux de départ enregistrés : renommer ou supprimer. */
export default function SavedPlacesManager({ places: initialPlaces }: SavedPlacesManagerProps) {
  const [places, setPlaces] = useState(initialPlaces);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (places.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        Les lieux de départ que tu utilises en proposant une sortie apparaîtront ici. Tu
        n&apos;auras plus à replacer le point sur la carte.
      </p>
    );
  }

  const startEditing = (place: SavedPlace) => {
    setEditingId(place.id);
    setConfirmDeleteId(null);
    setDraft(place.name);
    setError(null);
  };

  const saveName = async (place: SavedPlace) => {
    setBusyId(place.id);
    setError(null);
    const result = await renameSavedPlaceAction(place.id, draft);
    setBusyId(null);
    if (result.success) {
      setPlaces((prev) =>
        prev.map((p) => (p.id === place.id ? { ...p, name: draft.trim() } : p))
      );
      setEditingId(null);
    } else {
      setError(result.error);
    }
  };

  const remove = async (place: SavedPlace) => {
    setBusyId(place.id);
    setError(null);
    const result = await deleteSavedPlaceAction(place.id);
    setBusyId(null);
    setConfirmDeleteId(null);
    if (result.success) {
      setPlaces((prev) => prev.filter((p) => p.id !== place.id));
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="space-y-2">
      {error && <p className="text-xs text-red-600">{error}</p>}
      <ul className="divide-y divide-gray-100">
        {places.map((place) => (
          <li key={place.id} className="py-2">
            {editingId === place.id ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  maxLength={PLACE_NAME_MAX}
                  aria-label="Nouveau nom du lieu"
                  autoFocus
                  className="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <button
                  type="button"
                  onClick={() => saveName(place)}
                  disabled={busyId === place.id || !draft.trim()}
                  aria-label="Enregistrer le nom"
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  aria-label="Annuler"
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : confirmDeleteId === place.id ? (
              <div className="flex flex-wrap items-center gap-2">
                <p className="min-w-0 flex-1 text-sm text-gray-800">
                  Supprimer « {place.name} » ?
                </p>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(null)}
                  className="min-h-[40px] rounded-lg border border-gray-200 px-3 text-xs font-medium text-gray-700"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => remove(place)}
                  disabled={busyId === place.id}
                  className="min-h-[40px] rounded-lg bg-red-600 px-3 text-xs font-bold text-white disabled:opacity-50"
                >
                  Supprimer
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <p className="min-w-0 flex-1 truncate text-sm text-gray-800">{place.name}</p>
                <button
                  type="button"
                  onClick={() => startEditing(place)}
                  aria-label={`Renommer ${place.name}`}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmDeleteId(place.id);
                    setEditingId(null);
                  }}
                  aria-label={`Supprimer ${place.name}`}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

'use client';

import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, Map as MapIcon, CheckCircle2, Bookmark } from 'lucide-react';
import MapPickerModal, { type Coordinates } from '@/components/maps/MapPickerModal';
import { normalizePlaceName } from '@/lib/places';
import { PLACE_NAME_MAX } from '@/lib/constraints';
import type { SavedPlace } from '@/lib/types';

interface StartPlacePickerProps {
  savedPlaces: SavedPlace[];
  // Centre de la carte quand le lieu est inconnu (ville du profil ou Grenoble).
  fallbackCenter: Coordinates;
  initialName?: string;
  initialCoords?: Coordinates | null;
}

type CoordsSource = 'saved' | 'map' | null;

/**
 * Lieu de départ = un nom libre ("Fontaine au Lion") + un point GPS précis
 * placé sur la carte. Les lieux déjà utilisés par l'organisateur sont
 * proposés pendant la frappe, et un nom reconnu (sans tenir compte des
 * majuscules, accents, espaces ou tirets) remplit le point automatiquement.
 */
export default function StartPlacePicker({
  savedPlaces,
  fallbackCenter,
  initialName = '',
  initialCoords = null,
}: StartPlacePickerProps) {
  const [name, setName] = useState(initialName);
  const [coords, setCoords] = useState<Coordinates | null>(initialCoords);
  const [source, setSource] = useState<CoordsSource>(initialCoords ? 'map' : null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);

  const placesByKey = useMemo(
    () => new Map(savedPlaces.map((p) => [normalizePlaceName(p.name), p])),
    [savedPlaces]
  );

  const query = normalizePlaceName(name);
  const suggestions = useMemo(() => {
    const list = query
      ? savedPlaces.filter((p) => normalizePlaceName(p.name).includes(query))
      : savedPlaces;
    return list.slice(0, 6);
  }, [savedPlaces, query]);

  const selectSaved = (place: SavedPlace) => {
    setName(place.name);
    setCoords({ latitude: place.latitude, longitude: place.longitude });
    setSource('saved');
    setShowSuggestions(false);
  };

  const handleNameChange = (value: string) => {
    setName(value);
    const match = placesByKey.get(normalizePlaceName(value));
    if (match) {
      setCoords({ latitude: match.latitude, longitude: match.longitude });
      setSource('saved');
    } else if (source === 'saved') {
      // Le nom ne correspond plus au lieu enregistré : son point ne vaut plus.
      setCoords(null);
      setSource(null);
    }
    setShowSuggestions(true);
  };

  const matchedSaved = source === 'saved' && placesByKey.get(query);
  const exactSuggestion = suggestions.length === 1 && normalizePlaceName(suggestions[0].name) === query;

  return (
    <div className="space-y-2">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          name="location"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder="Ex : Fontaine au Lion"
          required
          maxLength={PLACE_NAME_MAX}
          autoComplete="off"
          className="w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />

        {showSuggestions && suggestions.length > 0 && !exactSuggestion && (
          <ul className="absolute left-0 right-0 top-full z-30 mt-1 max-h-60 overflow-y-auto rounded-lg border border-gray-100 bg-white py-1 shadow-lg">
            <li className="px-4 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              Mes lieux enregistrés
            </li>
            {suggestions.map((place) => (
              <li key={place.id}>
                <button
                  type="button"
                  // onMouseDown : sélection avant le blur du champ.
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectSaved(place);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Bookmark className="h-4 w-4 flex-shrink-0 text-primary" />
                  <span className="truncate">{place.name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <input type="hidden" name="latitude" value={coords?.latitude ?? ''} />
      <input type="hidden" name="longitude" value={coords?.longitude ?? ''} />

      {coords ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-green-50 px-3 py-2">
          <span className="flex items-center gap-1.5 text-xs font-medium text-green-700">
            <CheckCircle2 className="h-4 w-4" />
            {matchedSaved ? 'Point enregistré retrouvé' : 'Point de départ placé'}
          </span>
          <button
            type="button"
            onClick={() => setMapOpen(true)}
            className="py-1 text-xs font-semibold text-primary hover:underline"
          >
            Ajuster sur la carte
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setMapOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-primary/40 py-3 text-sm font-semibold text-primary hover:bg-primary/5"
        >
          <MapIcon className="h-4 w-4" />
          Placer le point de départ sur la carte
        </button>
      )}

      {mapOpen &&
        createPortal(
          <MapPickerModal
            title={name.trim() ? `Départ : ${name.trim()}` : 'Point de départ'}
            initialCenter={coords ?? fallbackCenter}
            initialIsExact={!!coords}
            onClose={() => setMapOpen(false)}
            onConfirm={(picked) => {
              setCoords(picked);
              setSource('map');
              setMapOpen(false);
            }}
          />,
          document.body
        )}
    </div>
  );
}

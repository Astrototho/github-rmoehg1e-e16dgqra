'use client';

import { useState, useEffect } from 'react';
import { MapPin, Loader2 } from 'lucide-react';

export interface PlaceResult {
  label: string;
  city: string | null;
  country: string | null;
  latitude: number;
  longitude: number;
}

interface PhotonFeature {
  geometry: { coordinates: [number, number] };
  properties: {
    name?: string;
    city?: string;
    country?: string;
    street?: string;
    housenumber?: string;
  };
}

interface PlaceAutocompleteProps {
  placeholder: string;
  // Restreint la recherche aux villes/communes (sinon : adresses, lieux-dits...)
  osmTag?: string;
  onSelect?: (place: PlaceResult) => void;
  disabled?: boolean;
  // Pour un usage en formulaire natif (FormData) : rend des <input> nommés
  // directement utilisables par un server action, sans état contrôlé parent.
  name?: string;
  latName?: string;
  lngName?: string;
  required?: boolean;
}

function formatLabel(feature: PhotonFeature): string {
  const streetPart =
    feature.properties.housenumber && feature.properties.street
      ? `${feature.properties.housenumber} ${feature.properties.street}`
      : feature.properties.street;

  return [streetPart ?? feature.properties.name, feature.properties.city, feature.properties.country]
    .filter((value, index, all) => value && all.indexOf(value) === index)
    .join(', ');
}

export default function PlaceAutocomplete({
  placeholder,
  osmTag,
  onSelect,
  disabled,
  name,
  latName,
  lngName,
  required,
}: PlaceAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<PlaceResult | null>(null);
  const [results, setResults] = useState<PhotonFeature[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({ q: query, limit: '5', lang: 'fr' });
        if (osmTag) params.set('osm_tag', osmTag);
        const res = await fetch(`https://photon.komoot.io/api/?${params.toString()}`);
        const data = await res.json();
        setResults(data.features ?? []);
        setIsOpen(true);
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 350);

    return () => clearTimeout(timeout);
  }, [query, osmTag]);

  const handleSelect = (feature: PhotonFeature) => {
    const label = formatLabel(feature);
    const [longitude, latitude] = feature.geometry.coordinates;
    const place: PlaceResult = {
      label,
      city: feature.properties.city ?? feature.properties.name ?? null,
      country: feature.properties.country ?? null,
      latitude,
      longitude,
    };

    setQuery(label);
    setSelected(place);
    setResults([]);
    setIsOpen(false);
    onSelect?.(place);
  };

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          name={name}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelected(null);
          }}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          autoComplete="off"
          className="w-full pl-9 pr-9 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm disabled:opacity-50"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
        )}
      </div>

      {latName && (
        <input type="hidden" name={latName} value={selected?.latitude ?? ''} />
      )}
      {lngName && (
        <input type="hidden" name={lngName} value={selected?.longitude ?? ''} />
      )}

      {isOpen && results.length > 0 && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50 max-h-60 overflow-y-auto">
            {results.map((feature, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelect(feature)}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {formatLabel(feature)}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

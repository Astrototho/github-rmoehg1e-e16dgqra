'use client';

import { useState } from 'react';
import { Locate, Loader2, CheckCircle2 } from 'lucide-react';
import PlaceAutocomplete, { type PlaceResult } from '@/components/PlaceAutocomplete';
import { updateProfileLocation } from '@/app/actions';

interface CityPickerProps {
  currentCity?: string | null;
  currentCountry?: string | null;
  onSelected: (params: {
    city: string;
    country: string | null;
    latitude: number;
    longitude: number;
  }) => void;
}

export default function CityPicker({
  currentCity,
  currentCountry,
  onSelected,
}: CityPickerProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  const save = async (
    city: string,
    country: string | null,
    latitude: number,
    longitude: number
  ) => {
    setIsSaving(true);
    setError(null);
    setJustSaved(false);

    const result = await updateProfileLocation({ city, country, latitude, longitude });
    setIsSaving(false);

    if (result.success) {
      onSelected({ city, country, latitude, longitude });
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 3000);
    } else {
      setError(result.error ?? "Impossible d'enregistrer ta position.");
    }
  };

  const handleSelect = async (place: PlaceResult) => {
    const city = place.city ?? place.label;
    await save(city, place.country, place.latitude, place.longitude);
  };

  const handleLocate = () => {
    if (!navigator.geolocation) {
      setError("La géolocalisation n'est pas disponible sur cet appareil.");
      return;
    }

    setIsLocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `https://photon.komoot.io/reverse?lon=${longitude}&lat=${latitude}&lang=fr`
          );
          const data = await res.json();
          const feature = data.features?.[0];
          const city =
            feature?.properties?.city ?? feature?.properties?.name ?? 'Position actuelle';
          const country = feature?.properties?.country ?? null;
          await save(city, country, latitude, longitude);
        } catch {
          setError('Impossible de déterminer ta ville à partir de ta position.');
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        setError('Localisation refusée ou indisponible.');
        setIsLocating(false);
      }
    );
  };

  return (
    <div className="space-y-2">
      {currentCity && (
        <p className="text-sm text-gray-600">
          Ville actuelle :{' '}
          <span className="font-semibold text-gray-900">
            {currentCity}
            {currentCountry ? `, ${currentCountry}` : ''}
          </span>
        </p>
      )}

      <PlaceAutocomplete
        placeholder="Changer de ville..."
        osmTag="place"
        disabled={isSaving || isLocating}
        onSelect={handleSelect}
      />

      <button
        type="button"
        onClick={handleLocate}
        disabled={isSaving || isLocating}
        className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-primary hover:bg-primary/5 rounded-lg transition-colors disabled:opacity-50"
      >
        {isLocating ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Locate className="w-4 h-4" />
        )}
        Actualiser ma position
      </button>

      {justSaved && (
        <p className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Position enregistrée
        </p>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

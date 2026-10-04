'use client';

import { useState } from 'react';
import PlaceAutocomplete, { type PlaceResult } from '@/components/PlaceAutocomplete';
import { updateProfileLocation } from '@/app/actions';

interface CityPickerProps {
  onSelected: (params: {
    city: string;
    country: string | null;
    latitude: number;
    longitude: number;
  }) => void;
}

export default function CityPicker({ onSelected }: CityPickerProps) {
  const [isSaving, setIsSaving] = useState(false);

  const handleSelect = async (place: PlaceResult) => {
    const city = place.city ?? place.label;
    setIsSaving(true);

    const result = await updateProfileLocation({
      city,
      country: place.country,
      latitude: place.latitude,
      longitude: place.longitude,
    });

    setIsSaving(false);

    if (result.success) {
      onSelected({
        city,
        country: place.country,
        latitude: place.latitude,
        longitude: place.longitude,
      });
    } else {
      alert(result.error);
    }
  };

  return (
    <PlaceAutocomplete
      placeholder="Changer de ville..."
      osmTag="place"
      disabled={isSaving}
      onSelect={handleSelect}
    />
  );
}

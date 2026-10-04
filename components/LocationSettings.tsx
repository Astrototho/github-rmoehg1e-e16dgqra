'use client';

import { useState } from 'react';
import CityPicker from '@/components/CityPicker';

interface LocationSettingsProps {
  city?: string | null;
  country?: string | null;
}

export default function LocationSettings({
  city: initialCity,
  country: initialCountry,
}: LocationSettingsProps) {
  const [city, setCity] = useState(initialCity);
  const [country, setCountry] = useState(initialCountry);

  return (
    <CityPicker
      currentCity={city}
      currentCountry={country}
      onSelected={(params) => {
        setCity(params.city);
        setCountry(params.country);
      }}
    />
  );
}

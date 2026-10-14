'use client';

import { useState } from 'react';

const HOURS = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, '0'));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

// Sélecteur d'heure en deux listes (heures, minutes par pas de 5) : évite le
// sélecteur natif dont le bouton « Définir » sort de l'écran sur certains
// téléphones. Envoie "HH:MM" dans un champ caché, comme <input type="time">.
export default function TimeSelect({
  name,
  defaultValue,
  className,
}: {
  name: string;
  defaultValue?: string;
  className: string;
}) {
  const [initialH, initialM] = (defaultValue ?? '09:00').split(':');
  const roundedM = String(Math.min(55, Math.round(Number(initialM) / 5) * 5)).padStart(2, '0');
  const [hour, setHour] = useState(initialH);
  const [minute, setMinute] = useState(MINUTES.includes(initialM) ? initialM : roundedM);

  return (
    <div className="flex items-center gap-1.5">
      <select
        aria-label="Heure"
        value={hour}
        onChange={(e) => setHour(e.target.value)}
        className={className}
      >
        {HOURS.map((h) => (
          <option key={h} value={h}>
            {h} h
          </option>
        ))}
      </select>
      <select
        aria-label="Minutes"
        value={minute}
        onChange={(e) => setMinute(e.target.value)}
        className={className}
      >
        {MINUTES.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
      <input type="hidden" name={name} value={`${hour}:${minute}`} />
    </div>
  );
}

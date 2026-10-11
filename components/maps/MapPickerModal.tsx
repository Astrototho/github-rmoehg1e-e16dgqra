'use client';

import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import type { Map as LeafletMapInstance } from 'leaflet';
import { X, Locate, Loader2, Check } from 'lucide-react';
import MapPin from '@/components/maps/MapPin';
import { OSM_TILES, loadLeaflet } from '@/components/maps/LeafletMap';
import PlaceAutocomplete from '@/components/PlaceAutocomplete';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

interface MapPickerModalProps {
  title: string;
  initialCenter: Coordinates;
  // Vrai si initialCenter est déjà le point exact (lieu connu) : on zoome
  // davantage et on ne cherche pas la position du téléphone.
  initialIsExact: boolean;
  onConfirm: (coords: Coordinates) => void;
  onClose: () => void;
}

/**
 * Sélection plein écran d'un point GPS : l'utilisateur déplace la carte sous
 * le repère fixe au centre (plus précis au doigt que de viser un point).
 */
export default function MapPickerModal({
  title,
  initialCenter,
  initialIsExact,
  onConfirm,
  onClose,
}: MapPickerModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMapInstance | null>(null);
  const [center, setCenter] = useState<Coordinates>(initialCenter);
  const [isLocating, setIsLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadLeaflet().then((L) => {
      if (cancelled || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        center: [initialCenter.latitude, initialCenter.longitude],
        zoom: initialIsExact ? 17 : 14,
        zoomControl: false,
      });
      L.tileLayer(OSM_TILES.url, {
        attribution: OSM_TILES.attribution,
        maxZoom: OSM_TILES.maxZoom,
      }).addTo(map);
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      map.on('moveend', () => {
        const c = map.getCenter();
        setCenter({ latitude: c.lat, longitude: c.lng });
      });

      mapRef.current = map;
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // La carte n'est créée qu'une fois, à l'ouverture.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const flyTo = (coords: Coordinates, zoom = 16) => {
    mapRef.current?.setView([coords.latitude, coords.longitude], zoom);
    setCenter(coords);
  };

  const locate = (silent: boolean) => {
    if (!navigator.geolocation) {
      if (!silent) setLocateError("La géolocalisation n'est pas disponible.");
      return;
    }
    setIsLocating(true);
    setLocateError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        flyTo({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => {
        setIsLocating(false);
        if (!silent) setLocateError('Position refusée ou indisponible.');
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60_000 }
    );
  };

  // Lieu inconnu : on part de la position du téléphone si elle est disponible.
  useEffect(() => {
    if (!initialIsExact) locate(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Échap pour fermer, et pas de défilement de la page derrière la modale.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[60] mx-auto flex w-full max-w-md flex-col bg-white"
    >
      <div className="relative z-10 space-y-2 border-b bg-white px-3 pb-3 pt-safe">
        <div className="flex h-12 items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer la carte"
            className="rounded-full p-2 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
          <p className="flex-1 truncate font-semibold text-gray-900">{title}</p>
        </div>
        <PlaceAutocomplete
          placeholder="Rechercher une adresse, un lieu..."
          bias={initialCenter}
          onSelect={(place) =>
            flyTo({ latitude: place.latitude, longitude: place.longitude }, 17)
          }
        />
      </div>

      <div className="relative z-0 flex-1">
        <div ref={containerRef} className="absolute inset-0" />

        {/* Repère fixe : la pointe désigne le centre de la carte. */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-[500] -translate-x-1/2 -translate-y-full">
          <MapPin />
        </div>

        <button
          type="button"
          onClick={() => locate(false)}
          disabled={isLocating}
          aria-label="Centrer sur ma position"
          className="absolute left-3 top-3 z-[500] flex items-center gap-2 rounded-full bg-white px-3 py-2.5 text-sm font-semibold text-gray-800 shadow-lg disabled:opacity-60"
        >
          {isLocating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Locate className="h-4 w-4" />
          )}
          Ma position
        </button>
        {locateError && (
          <p className="absolute left-3 top-16 z-[500] rounded-lg bg-white px-3 py-1.5 text-xs text-red-600 shadow">
            {locateError}
          </p>
        )}
      </div>

      <div className="z-10 border-t bg-white px-4 pt-3 pb-safe">
        <p className="mb-2 text-center text-xs text-gray-500">
          Déplace la carte pour placer le repère sur le point de rendez-vous.
        </p>
        <button
          type="button"
          onClick={() => onConfirm(center)}
          className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-bold text-white"
        >
          <Check className="h-5 w-5" />
          Valider ce point de départ
        </button>
      </div>
    </div>
  );
}

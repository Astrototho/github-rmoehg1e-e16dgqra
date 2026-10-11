'use client';

import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import type { Map as LeafletMapInstance } from 'leaflet';
import { MAP_PIN_SVG } from '@/components/maps/MapPin';
import { cn } from '@/lib/utils';

export const OSM_TILES = {
  url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',
  maxZoom: 19,
};

export async function loadLeaflet() {
  return (await import('leaflet')).default;
}

interface LeafletMapProps {
  latitude: number;
  longitude: number;
  zoom?: number;
  className?: string;
  // Sur le fil/la page détail, on évite que la carte capte le défilement de
  // la page : un doigt fait défiler la page, la carte reste zoomable.
  scrollWheelZoom?: boolean;
}

/** Carte interactive (OpenStreetMap) avec un repère sur le point donné. */
export default function LeafletMap({
  latitude,
  longitude,
  zoom = 15,
  className,
  scrollWheelZoom = false,
}: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMapInstance | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadLeaflet().then((L) => {
      if (cancelled || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        center: [latitude, longitude],
        zoom,
        scrollWheelZoom,
        // Pas de boutons +/- (ils masqueraient les badges posés sur la carte) :
        // pincement sur téléphone, double-clic sur ordinateur.
        zoomControl: false,
        // Sur téléphone, un doigt fait défiler la page au lieu de déplacer la
        // carte (le pincement permet toujours de zoomer).
        dragging: !L.Browser.mobile,
      });
      L.tileLayer(OSM_TILES.url, {
        attribution: OSM_TILES.attribution,
        maxZoom: OSM_TILES.maxZoom,
      }).addTo(map);
      L.marker([latitude, longitude], {
        icon: L.divIcon({
          className: '',
          html: MAP_PIN_SVG,
          iconSize: [32, 40],
          iconAnchor: [16, 40],
        }),
        keyboard: false,
      }).addTo(map);

      mapRef.current = map;
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [latitude, longitude, zoom, scrollWheelZoom]);

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label="Carte du point de départ"
      className={cn('h-full w-full bg-slate-100', className)}
    />
  );
}

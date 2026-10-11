import { getTilesAround, TILE_SIZE } from '@/lib/static-map';
import { cn } from '@/lib/utils';
import MapPin from '@/components/maps/MapPin';

interface StaticMapProps {
  latitude: number;
  longitude: number;
  zoom?: number;
  // Demi-dimensions maximales du cadre (px) : déterminent les tuiles chargées.
  halfWidth?: number;
  halfHeight?: number;
  className?: string;
}

/**
 * Petite carte non interactive centrée sur un point (fond des blocs du fil) :
 * quelques tuiles OpenStreetMap positionnées en CSS, sans JavaScript ni clé.
 */
export default function StaticMap({
  latitude,
  longitude,
  zoom = 14,
  halfWidth = 224,
  halfHeight = 96,
  className,
}: StaticMapProps) {
  const tiles = getTilesAround(latitude, longitude, zoom, halfWidth, halfHeight);

  return (
    <div
      aria-hidden="true"
      className={cn('absolute inset-0 overflow-hidden bg-slate-100', className)}
    >
      {tiles.map((tile) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={tile.key}
          src={tile.url}
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
          width={TILE_SIZE}
          height={TILE_SIZE}
          className="pointer-events-none absolute max-w-none select-none"
          style={{
            left: `calc(50% + ${tile.offsetX}px)`,
            top: `calc(50% + ${tile.offsetY}px)`,
            width: TILE_SIZE,
            height: TILE_SIZE,
          }}
        />
      ))}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full">
        <MapPin />
      </div>
    </div>
  );
}

export function OsmAttribution({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'rounded bg-white/80 px-1 text-[9px] leading-tight text-gray-600',
        className
      )}
    >
      © OpenStreetMap
    </span>
  );
}

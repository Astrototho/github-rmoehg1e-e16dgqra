// Calcul des tuiles OpenStreetMap à afficher pour une petite carte statique
// centrée sur un point (fond des blocs du fil) : aucune clé ni bibliothèque,
// juste quelques <img> de 256 px positionnées autour du centre.
export const TILE_SIZE = 256;
export const OSM_TILE_URL = 'https://tile.openstreetmap.org';

export interface StaticTile {
  key: string;
  url: string;
  // Position du coin haut-gauche de la tuile par rapport au centre du cadre.
  offsetX: number;
  offsetY: number;
}

export function lonLatToWorldPixels(latitude: number, longitude: number, zoom: number) {
  const scale = TILE_SIZE * 2 ** zoom;
  const lat = Math.max(Math.min(latitude, 85.05112878), -85.05112878);
  const sin = Math.sin((lat * Math.PI) / 180);
  return {
    x: ((longitude + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale,
  };
}

/**
 * Tuiles couvrant un cadre de (2 × halfWidth) × (2 × halfHeight) pixels centré
 * sur le point donné.
 */
export function getTilesAround(
  latitude: number,
  longitude: number,
  zoom: number,
  halfWidth: number,
  halfHeight: number
): StaticTile[] {
  const center = lonLatToWorldPixels(latitude, longitude, zoom);
  const maxIndex = 2 ** zoom - 1;
  const minTileX = Math.floor((center.x - halfWidth) / TILE_SIZE);
  const maxTileX = Math.floor((center.x + halfWidth) / TILE_SIZE);
  const minTileY = Math.max(0, Math.floor((center.y - halfHeight) / TILE_SIZE));
  const maxTileY = Math.min(maxIndex, Math.floor((center.y + halfHeight) / TILE_SIZE));

  const tiles: StaticTile[] = [];
  for (let ty = minTileY; ty <= maxTileY; ty++) {
    for (let tx = minTileX; tx <= maxTileX; tx++) {
      // Bouclage horizontal autour de l'antiméridien.
      const wrappedX = ((tx % (maxIndex + 1)) + maxIndex + 1) % (maxIndex + 1);
      tiles.push({
        key: `${zoom}/${tx}/${ty}`,
        url: `${OSM_TILE_URL}/${zoom}/${wrappedX}/${ty}.png`,
        offsetX: Math.round(tx * TILE_SIZE - center.x),
        offsetY: Math.round(ty * TILE_SIZE - center.y),
      });
    }
  }
  return tiles;
}

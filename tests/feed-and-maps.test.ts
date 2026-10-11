import { describe, expect, it } from 'vitest';
import { sortFeed } from '@/lib/feed';
import { computeMatchPercentage } from '@/lib/matching';
import { getTilesAround, lonLatToWorldPixels, TILE_SIZE } from '@/lib/static-map';
import type { SportFamilyIndices } from '@/lib/performance';

describe('sortFeed', () => {
  const a = (id: string, day: number) => ({ id, start_date: `2026-11-${day}T08:00:00.000Z` });

  it('trie par % de match puis par date, sans % à la fin', () => {
    const activities = [a('sans1', 10), a('m60', 12), a('m90', 15), a('sans2', 11), a('m60b', 11)];
    const sorted = sortFeed(activities, { m60: 60, m90: 90, m60b: 60 });
    expect(sorted.map((x) => x.id)).toEqual(['m90', 'm60b', 'm60', 'sans1', 'sans2']);
  });
});

describe('computeMatchPercentage', () => {
  const profile: SportFamilyIndices = {
    sportFamily: 'trail',
    avgSpeedMps: 2.5,
    avgMovingTimeS: 5400,
    avgElevationGainM: 800,
    avgChillIndex: 0.1,
    sampleSize: 10,
  };

  it('renvoie null sans profil de part ou d’autre', () => {
    expect(computeMatchPercentage(undefined, profile, {}, {})).toBeNull();
  });

  it('plafonne à 100 et ajoute le bonus géo', () => {
    expect(computeMatchPercentage(profile, profile, {}, {})).toBe(100);
    const slower = { ...profile, avgSpeedMps: 2 };
    const base = computeMatchPercentage(profile, slower, {}, {})!;
    expect(
      computeMatchPercentage(profile, slower, { city: 'Grenoble' }, { city: ' grenoble ' })
    ).toBe(base + 5);
  });
});

describe('carte statique', () => {
  it('couvre le point demandé avec la tuile qui le contient', () => {
    const lat = 45.1885;
    const lng = 5.7245;
    const zoom = 14;
    const center = lonLatToWorldPixels(lat, lng, zoom);
    const tiles = getTilesAround(lat, lng, zoom, 224, 96);
    const containing = tiles.find(
      (t) => t.offsetX <= 0 && t.offsetX > -TILE_SIZE && t.offsetY <= 0 && t.offsetY > -TILE_SIZE
    );
    expect(containing?.url).toBe(
      `https://tile.openstreetmap.org/${zoom}/${Math.floor(center.x / TILE_SIZE)}/${Math.floor(
        center.y / TILE_SIZE
      )}.png`
    );
    // 448 × 192 px : au plus 3 colonnes × 2 lignes de tuiles.
    expect(tiles.length).toBeLessThanOrEqual(6);
  });
});

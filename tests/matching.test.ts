import { describe, expect, it } from 'vitest';
import {
  computeAffinity,
  computeFeasibility,
  computeMatch,
  computeMatchPercentage,
} from '@/lib/matching';
import { computeIndicesBySportFamily, type SportFamilyIndices } from '@/lib/performance';
import type { StravaActivitySummary } from '@/lib/strava';

const trailer: SportFamilyIndices = {
  sportFamily: 'trail',
  effortSpeedKmh: 8,
  avgMovingTimeS: 2 * 3600,
  climbMPerKm: 50,
  avgChillIndex: 0.1,
  p90EffortKm: 30,
  p90ElevationGainM: 800,
  sampleSize: 12,
};

describe('matching v2 : personne ↔ personne', () => {
  it('renvoie null sans profil de part ou d’autre', () => {
    expect(computeMatchPercentage(undefined, trailer, {}, {})).toBeNull();
  });

  it('deux profils identiques : 100 %, bonus géo plafonné', () => {
    expect(computeMatchPercentage(trailer, trailer, {}, {})).toBe(100);
    expect(computeMatchPercentage(trailer, trailer, { city: 'Grenoble' }, { city: 'grenoble' })).toBe(100);
  });

  it('le rythme pèse le plus : 25 % plus rapide fait nettement baisser le score', () => {
    const faster = { ...trailer, effortSpeedKmh: 10 };
    const longer = { ...trailer, avgMovingTimeS: 2.5 * 3600 };
    expect(computeAffinity(trailer, faster)).toBeLessThan(0.75);
    expect(computeAffinity(trailer, longer)).toBeGreaterThan(computeAffinity(trailer, faster));
  });

  it('le style compte : un profil montagne et un profil roulant matchent moins', () => {
    const flat = { ...trailer, climbMPerKm: 10 };
    expect(computeAffinity(trailer, flat)).toBeLessThan(computeAffinity(trailer, trailer));
  });
});

describe('matching v2 : faisabilité de la sortie', () => {
  it('sortie dans les habitudes : aucune pénalité, aucune explication', () => {
    const result = computeMatch(trailer, trailer, {}, {}, {
      type: 'trail',
      distanceKm: 20,
      elevationM: 700,
    });
    expect(computeFeasibility(trailer, { type: 'trail', distanceKm: 20, elevationM: 700 })).toBe(1);
    expect(result).toEqual({ percentage: 100, hint: undefined });
  });

  it('2 000 m D+ pour quelqu’un qui ne dépasse pas 800 m : jamais 90 %', () => {
    const result = computeMatch(trailer, trailer, {}, {}, {
      type: 'trail',
      distanceKm: 30,
      elevationM: 2000,
    })!;
    expect(result.percentage).toBeLessThan(30);
    expect(result.hint).toBeDefined();
  });

  it('un peu au-dessus des habitudes : légère baisse seulement', () => {
    const f = computeFeasibility(trailer, { type: 'trail', distanceKm: 26, elevationM: 950 });
    expect(f).toBeGreaterThan(0.8);
    expect(f).toBeLessThan(1);
  });

  it('un coureur sur route peut faire un peu de D+ sans être pénalisé', () => {
    const runner = { ...trailer, sportFamily: 'course-a-pied' as const, p90EffortKm: 15, p90ElevationGainM: 40 };
    expect(computeFeasibility(runner, { type: 'course-a-pied', distanceKm: 10, elevationM: 120 })).toBe(1);
  });
});

describe('profil de performance', () => {
  const act = (over: Partial<StravaActivitySummary>): StravaActivitySummary => ({
    id: 1,
    type: 'Run',
    sport_type: 'TrailRun',
    distance: 15000,
    moving_time: 7200,
    elapsed_time: 7800,
    total_elevation_gain: 700,
    average_speed: 15000 / 7200,
    start_date: '2026-10-01T08:00:00Z',
    ...over,
  });

  it('écarte VAE, home-trainer, trajets et marche', () => {
    const indices = computeIndicesBySportFamily([
      act({}),
      act({ total_elevation_gain: 900 }),
      act({ sport_type: 'EMountainBikeRide', type: 'EMountainBikeRide' }),
      act({ sport_type: 'Ride', type: 'Ride', trainer: true }),
      act({ sport_type: 'Run', type: 'Run', average_speed: 1.2 }),
      act({ sport_type: 'Run', type: 'Run', commute: true }),
    ]);
    expect(indices.map((i) => i.sportFamily)).toEqual(['trail']);
    expect(indices[0].sampleSize).toBe(2);
  });

  it('rythme en km-effort/h et capacité au 90e centile', () => {
    const [trail] = computeIndicesBySportFamily([act({}), act({ total_elevation_gain: 900 })]);
    // 15 km + 700 m → 22 km-effort en 2 h ; 15 km + 900 m → 24 km-effort.
    expect(trail.effortSpeedKmh).toBeCloseTo(11.5);
    expect(trail.p90EffortKm).toBeCloseTo(23.8);
    expect(trail.climbMPerKm).toBeCloseTo(53.33, 1);
  });
});

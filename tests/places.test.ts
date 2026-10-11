import { describe, expect, it } from 'vitest';
import { getFallbackCenter, GRENOBLE_CENTER, normalizePlaceName } from '@/lib/places';

describe('normalizePlaceName', () => {
  it('ignore casse, accents, espaces et ponctuation', () => {
    const variants = [
      'Fontaine au Lion',
      'fontaine au lion',
      '  FONTAINE   AU  LION ',
      'fontaine-au-lion',
      'Fontaine, au Lion !',
    ];
    for (const v of variants) expect(normalizePlaceName(v)).toBe('fontaine au lion');
  });

  it('retire les accents et ligatures', () => {
    expect(normalizePlaceName('Église Saint-Bruno')).toBe('eglise saint bruno');
    expect(normalizePlaceName("Cœur de l'Île Verte")).toBe('coeur de l ile verte');
  });

  it('distingue deux lieux différents', () => {
    expect(normalizePlaceName('Bastille')).not.toBe(normalizePlaceName('Bastille 2'));
  });
});

describe('getFallbackCenter', () => {
  it('utilise la ville du profil, sinon Grenoble', () => {
    expect(getFallbackCenter({ latitude: 48.85, longitude: 2.35 })).toEqual({
      latitude: 48.85,
      longitude: 2.35,
    });
    expect(getFallbackCenter(null)).toEqual(GRENOBLE_CENTER);
    expect(getFallbackCenter({ latitude: null, longitude: 2 })).toEqual(GRENOBLE_CENTER);
  });
});

import { describe, expect, it } from 'vitest';
import {
  applyFeedFilters,
  daysForWhen,
  feedHref,
  parseFeedFilters,
} from '@/lib/feed-filters';

describe('parseFeedFilters', () => {
  it('ignore les valeurs inconnues', () => {
    expect(parseFeedFilters({ sport: 'trail', quand: 'weekend', rayon: '25' })).toEqual({
      sport: 'trail',
      when: 'weekend',
      radius: 25,
    });
    expect(parseFeedFilters({ sport: 'golf', quand: 'x', rayon: '7' })).toEqual({});
  });
  it('construit les liens', () => {
    expect(feedHref({ sport: 'vtt' }, { radius: 10 })).toBe('/?sport=vtt&rayon=10');
    expect(feedHref({ sport: 'vtt' }, { sport: undefined })).toBe('/');
  });
});

describe('daysForWhen', () => {
  const wednesday = new Date('2026-10-14T10:00:00Z');
  it('week-end à venir depuis un mercredi', () => {
    expect(Array.from(daysForWhen('weekend', wednesday))).toEqual(['2026-10-17', '2026-10-18']);
  });
  it('dimanche : seulement aujourd’hui', () => {
    expect(Array.from(daysForWhen('weekend', new Date('2026-10-18T10:00:00Z')))).toEqual([
      '2026-10-18',
    ]);
  });
  it('demain, à l’heure de Paris', () => {
    expect(Array.from(daysForWhen('tomorrow', new Date('2026-10-14T22:30:00Z')))).toEqual([
      '2026-10-16',
    ]);
  });
});

describe('applyFeedFilters', () => {
  const now = new Date('2026-10-14T10:00:00Z');
  const list = [
    { id: 'a', type: 'trail', start_date: '2026-10-17T06:00:00Z' },
    { id: 'b', type: 'vtt', start_date: '2026-10-15T06:00:00Z' },
    { id: 'c', type: 'trail', start_date: '2026-10-30T06:00:00Z' },
  ];
  it('combine sport, date et rayon', () => {
    expect(applyFeedFilters(list, { sport: 'trail' }, {}, now).map((a) => a.id)).toEqual(['a', 'c']);
    expect(applyFeedFilters(list, { when: 'weekend' }, {}, now).map((a) => a.id)).toEqual(['a']);
    expect(
      applyFeedFilters(list, { radius: 10 }, { a: 4, b: 30, c: 9 }, now).map((a) => a.id)
    ).toEqual(['a', 'c']);
  });
  it('sans point de référence, le rayon est ignoré', () => {
    expect(applyFeedFilters(list, { radius: 10 }, {}, now)).toHaveLength(3);
  });
});

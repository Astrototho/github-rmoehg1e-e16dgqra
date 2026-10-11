import { describe, expect, it } from 'vitest';
import {
  EDIT_CUTOFF_MS,
  canEditActivity,
  isOpen,
  isValidNewStartDate,
} from '@/lib/activity-rules';

const now = Date.parse('2026-10-11T10:00:00.000Z');
const at = (offsetMs: number) => new Date(now + offsetMs).toISOString();

describe('règle des 1 h avant le départ', () => {
  it('autorise la modification plus d’1 h avant', () => {
    expect(canEditActivity({ start_date: at(EDIT_CUTOFF_MS + 60_000), status: 'active' }, now)).toBe(true);
  });

  it('refuse à 1 h ou moins du départ', () => {
    expect(canEditActivity({ start_date: at(EDIT_CUTOFF_MS), status: 'active' }, now)).toBe(false);
    expect(canEditActivity({ start_date: at(30 * 60_000), status: 'active' }, now)).toBe(false);
    expect(canEditActivity({ start_date: at(-60_000), status: 'active' }, now)).toBe(false);
  });

  it('refuse une sortie annulée', () => {
    expect(canEditActivity({ start_date: at(10 * EDIT_CUTOFF_MS), status: 'cancelled' }, now)).toBe(false);
  });

  it('exige une nouvelle date au moins 1 h dans le futur', () => {
    expect(isValidNewStartDate(new Date(now + EDIT_CUTOFF_MS), now)).toBe(true);
    expect(isValidNewStartDate(new Date(now + EDIT_CUTOFF_MS - 1), now)).toBe(false);
  });
});

describe('isOpen', () => {
  it('vrai seulement pour une sortie à venir et active', () => {
    expect(isOpen({ start_date: at(60_000), status: 'active' }, now)).toBe(true);
    expect(isOpen({ start_date: at(-60_000), status: 'active' }, now)).toBe(false);
    expect(isOpen({ start_date: at(60_000), status: 'cancelled' }, now)).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import {
  formatRelativeDay,
  formatTime,
  parisDayKey,
  parisLocalToUtc,
  toParisInputValues,
} from '@/lib/dates';

describe('parisLocalToUtc', () => {
  it("convertit l'heure d'hiver (UTC+1)", () => {
    expect(parisLocalToUtc('2026-01-15', '09:00')?.toISOString()).toBe(
      '2026-01-15T08:00:00.000Z'
    );
  });

  it("convertit l'heure d'été (UTC+2)", () => {
    expect(parisLocalToUtc('2026-07-15', '09:00')?.toISOString()).toBe(
      '2026-07-15T07:00:00.000Z'
    );
  });

  it("refuse une heure qui n'existe pas (passage à l'heure d'été)", () => {
    expect(parisLocalToUtc('2026-03-29', '02:30')).toBeNull();
  });

  it("accepte une heure ambiguë (passage à l'heure d'hiver)", () => {
    const date = parisLocalToUtc('2026-10-25', '02:30');
    expect(date).not.toBeNull();
    expect(toParisInputValues(date!)).toEqual({ date: '2026-10-25', time: '02:30' });
  });

  it('refuse les saisies invalides', () => {
    expect(parisLocalToUtc('2026-13-01', '09:00')).toBeNull();
    expect(parisLocalToUtc('2026-02-30', '09:00')).toBeNull();
    expect(parisLocalToUtc('2026-01-15', '24:00')).toBeNull();
    expect(parisLocalToUtc('15/01/2026', '09:00')).toBeNull();
    expect(parisLocalToUtc('2026-01-15', '9h')).toBeNull();
  });

  it('fait un aller-retour exact avec toParisInputValues', () => {
    const date = parisLocalToUtc('2026-11-03', '18:45')!;
    expect(toParisInputValues(date)).toEqual({ date: '2026-11-03', time: '18:45' });
  });
});

describe('formatage à l’heure de Paris', () => {
  it('affiche l’heure de Paris quel que soit le fuseau du serveur', () => {
    expect(formatTime('2026-07-15T07:00:00.000Z')).toBe('09h00');
    expect(parisDayKey('2026-07-14T23:30:00.000Z')).toBe('2026-07-15');
  });

  it('formatRelativeDay : heure, "Hier" ou date', () => {
    const now = new Date('2026-10-11T10:00:00.000Z');
    expect(formatRelativeDay('2026-10-11T06:05:00.000Z', undefined, now)).toBe('08:05');
    expect(formatRelativeDay('2026-10-10T20:00:00.000Z', undefined, now)).toBe('Hier');
    expect(formatRelativeDay('2026-10-01T20:00:00.000Z', undefined, now)).toBe('01/10');
  });
});

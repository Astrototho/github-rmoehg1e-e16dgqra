import { describe, expect, it } from 'vitest';
import { effortKm, effortLevel, estimatedDurationMinutes, formatDuration } from '@/lib/effort';
import { formatRelativeStart } from '@/lib/dates';

describe('effort', () => {
  it('km-effort ITRA pour le trail', () => {
    expect(effortKm('trail', 18, 950)).toBeCloseTo(27.5);
    expect(effortLevel('trail', 18, 950)).toBe(1);
    expect(effortLevel('trail', 42, 2000)).toBe(3);
  });
  it('durée estimée arrondie au quart d’heure', () => {
    expect(estimatedDurationMinutes('trail', 18, 950)).toBe(210);
    expect(formatDuration(210)).toBe('3 h 30');
    expect(formatDuration(45)).toBe('45 min');
    expect(formatDuration(120)).toBe('2 h');
  });
});

describe('formatRelativeStart', () => {
  const now = new Date('2026-10-14T10:00:00Z'); // 12h00 à Paris
  it('proche : minutes ou heures', () => {
    expect(formatRelativeStart('2026-10-14T10:45:00Z', now)).toEqual({
      label: 'Dans 45 min · 12h45',
      tone: 'soon',
    });
    expect(formatRelativeStart('2026-10-14T12:00:00Z', now).label).toBe('Dans 2 h · 14h00');
  });
  it("aujourd'hui, demain, jour de la semaine, puis date", () => {
    expect(formatRelativeStart('2026-10-14T16:30:00Z', now).label).toBe("Aujourd'hui · 18h30");
    expect(formatRelativeStart('2026-10-15T06:30:00Z', now).label).toBe('Demain · 8h30');
    expect(formatRelativeStart('2026-10-17T06:30:00Z', now).label).toBe('Samedi · 8h30');
    expect(formatRelativeStart('2026-10-25T06:30:00Z', now).label).toMatch(/^Dim\. 25 oct\. · 7h30$/);
  });
  it('déjà commencée', () => {
    expect(formatRelativeStart('2026-10-14T09:00:00Z', now).tone).toBe('past');
  });
});

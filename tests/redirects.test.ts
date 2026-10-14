import { describe, expect, it } from 'vitest';
import { activityIdFromCallback, safeCallbackUrl } from '@/lib/redirects';

describe('safeCallbackUrl', () => {
  it('garde un chemin interne', () => {
    expect(safeCallbackUrl('/activities/abc')).toBe('/activities/abc');
  });
  it("refuse un autre site et les chemins ambigus", () => {
    expect(safeCallbackUrl('https://evil.com/x')).toBe('/');
    expect(safeCallbackUrl('//evil.com')).toBe('/');
    expect(safeCallbackUrl('/\\evil.com')).toBe('/');
    expect(safeCallbackUrl(undefined)).toBe('/');
  });
  it("accepte une URL absolue de notre propre site", () => {
    expect(safeCallbackUrl('https://app.perfconnect.fr/messages', 'https://app.perfconnect.fr')).toBe(
      '/messages'
    );
    expect(safeCallbackUrl('https://app.perfconnect.fr.evil.com/x', 'https://app.perfconnect.fr')).toBe('/');
  });
});

describe('activityIdFromCallback', () => {
  it("extrait l'identifiant d'une sortie", () => {
    const id = '123e4567-e89b-12d3-a456-426614174000';
    expect(activityIdFromCallback(`/activities/${id}`)).toBe(id);
    expect(activityIdFromCallback('/messages')).toBeNull();
  });
});

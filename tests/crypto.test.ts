import { randomBytes } from 'node:crypto';
import { beforeAll, describe, expect, it } from 'vitest';
import { decryptSecret, encryptSecret, isEncryptedSecret } from '@/lib/crypto';

beforeAll(() => {
  process.env.STRAVA_TOKEN_ENCRYPTION_KEY = randomBytes(32).toString('base64');
});

describe('chiffrement des tokens Strava', () => {
  it('chiffre puis déchiffre', () => {
    const encrypted = encryptSecret('token-strava-123');
    expect(isEncryptedSecret(encrypted)).toBe(true);
    expect(encrypted).not.toContain('token-strava-123');
    expect(decryptSecret(encrypted)).toBe('token-strava-123');
  });

  it('produit un chiffré différent à chaque appel', () => {
    expect(encryptSecret('abc')).not.toBe(encryptSecret('abc'));
  });

  it('détecte une altération', () => {
    const [prefix, iv, tag, data] = encryptSecret('abc').split('.');
    const tampered = [prefix, iv, tag, Buffer.from('zzz').toString('base64url') + data].join('.');
    expect(() => decryptSecret(tampered)).toThrow();
  });

  it('laisse passer les anciens tokens stockés en clair', () => {
    expect(decryptSecret('a1b2c3d4e5')).toBe('a1b2c3d4e5');
  });
});

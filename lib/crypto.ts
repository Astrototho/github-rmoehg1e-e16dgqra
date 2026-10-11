import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

// Chiffrement applicatif (AES-256-GCM) des secrets stockés en base, en
// particulier les tokens Strava. Format stocké :
//   v1.<iv base64url>.<tag base64url>.<chiffré base64url>
// La clé (32 octets, en base64) vient de STRAVA_TOKEN_ENCRYPTION_KEY.
// Générer une clé : openssl rand -base64 32
const PREFIX = 'v1';
const IV_LENGTH = 12;

function getKey(): Buffer {
  const raw = process.env.STRAVA_TOKEN_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      'STRAVA_TOKEN_ENCRYPTION_KEY is missing (openssl rand -base64 32).'
    );
  }
  const key = Buffer.from(raw, 'base64');
  if (key.length !== 32) {
    throw new Error('STRAVA_TOKEN_ENCRYPTION_KEY must be 32 bytes, base64-encoded.');
  }
  return key;
}

export function isEncryptedSecret(value: string): boolean {
  return value.startsWith(`${PREFIX}.`) && value.split('.').length === 4;
}

export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv('aes-256-gcm', getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [PREFIX, iv, tag, encrypted]
    .map((part) => (typeof part === 'string' ? part : part.toString('base64url')))
    .join('.');
}

/**
 * Déchiffre une valeur produite par encryptSecret. Les valeurs historiques
 * stockées en clair (avant le chiffrement) sont renvoyées telles quelles :
 * elles seront rechiffrées à la prochaine connexion de l'utilisateur.
 */
export function decryptSecret(value: string): string {
  if (!isEncryptedSecret(value)) return value;

  const [, iv, tag, encrypted] = value
    .split('.')
    .map((part) => Buffer.from(part, 'base64url'));
  const decipher = createDecipheriv('aes-256-gcm', getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

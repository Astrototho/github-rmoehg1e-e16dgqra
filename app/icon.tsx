import { ImageResponse } from 'next/og';
import AppIconImage from '@/components/AppIconImage';

export const contentType = 'image/png';

const VARIANTS = {
  '192': { size: 192, padding: 0 },
  '512': { size: 512, padding: 0 },
  // Icône "maskable" : marge de sécurité pour les masques ronds d'Android.
  maskable: { size: 512, padding: 96 },
} as const;

export function generateImageMetadata() {
  return Object.entries(VARIANTS).map(([id, v]) => ({
    id,
    size: { width: v.size, height: v.size },
    contentType,
  }));
}

export default async function Icon({ id }: { id: Promise<string> | string }) {
  const key = (await id) as keyof typeof VARIANTS;
  const variant = VARIANTS[key] ?? VARIANTS['192'];
  return new ImageResponse(<AppIconImage size={variant.size} padding={variant.padding} />, {
    width: variant.size,
    height: variant.size,
  });
}

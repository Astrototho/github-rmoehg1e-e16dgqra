import { ImageResponse } from 'next/og';
import AppIconImage from '@/components/AppIconImage';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(<AppIconImage size={180} padding={16} />, size);
}

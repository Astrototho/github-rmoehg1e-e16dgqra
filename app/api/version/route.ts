import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Version du build en ligne : comparée par l'app ouverte (components/PwaManager)
// à sa propre version pour proposer de se mettre à jour après un déploiement.
export function GET() {
  return NextResponse.json(
    { version: process.env.NEXT_PUBLIC_APP_VERSION ?? 'dev' },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
